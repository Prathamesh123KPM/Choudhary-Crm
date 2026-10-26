import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/error';
import {
  CRMUser,
  Lead,
  Followup,
  SiteVisit,
  Booking,
  Project,
  InventoryUnit,
  ActivityLog,
  MetaIntegration,
  NotificationItem,
  LeadStage,
  LeadSubStatus,
  DailyTask,
  UserRole
} from '../types/crm';
import {
  SEED_USERS,
  SEED_PROJECTS,
  SEED_INVENTORY,
  SEED_LEADS,
  SEED_FOLLOWUPS,
  SEED_SITE_VISITS,
  SEED_BOOKINGS,
  SEED_META_INTEGRATION,
  SEED_ACTIVITY_LOGS,
  SEED_NOTIFICATIONS,
  SEED_DAILY_TASKS
} from '../data/seedData';
import { REAL_ESTATE_LEADS } from '../data/realEstateLeads';

// Firestore safe sanitization helper (removes undefined values that crash Firestore)
export function sanitizeForFirestore<T extends Record<string, any>>(obj: T): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      clean[key] = val;
    }
  }
  return clean;
}

// Timeout wrapper so slow/offline network promises never freeze the application
export function withTimeout<T>(promise: Promise<T>, ms = 2500): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Operation timed out')), ms))
  ]);
}

// Local reactive state store with multi-tier persistence (LocalStorage + Server Disk + Firestore)
class LocalCRMStore {
  users: CRMUser[] = [...SEED_USERS];
  projects: Project[] = [...SEED_PROJECTS];
  inventory: InventoryUnit[] = [...SEED_INVENTORY];

  leadOverrides: Record<string, Partial<Lead>> = (() => {
    try {
      const saved = localStorage.getItem('choudhary_crm_lead_overrides');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  })();

  leads: Lead[] = (() => {
    const base = [...REAL_ESTATE_LEADS].map(l => ({
      ...l,
      assigned_to: l.assigned_to || l.assignedEmployeeId || '',
      assignedTo: l.assignedTo || l.assignedEmployeeId || ''
    }));
    try {
      const savedOverrides = localStorage.getItem('choudhary_crm_lead_overrides');
      if (savedOverrides) {
        const overrides: Record<string, Partial<Lead>> = JSON.parse(savedOverrides);
        return base.map(l => {
          const ov = overrides[l.id] || overrides[l.metaLeadId || ''];
          return ov ? { ...l, ...ov } : l;
        });
      }
    } catch (e) {}
    return base;
  })();

  followups: Followup[] = (() => {
    try {
      const saved = localStorage.getItem('choudhary_crm_followups');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [...SEED_FOLLOWUPS];
  })();

  siteVisits: SiteVisit[] = (() => {
    try {
      const saved = localStorage.getItem('choudhary_crm_site_visits');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [...SEED_SITE_VISITS];
  })();

  bookings: Booking[] = [...SEED_BOOKINGS];
  metaIntegration: MetaIntegration = { ...SEED_META_INTEGRATION };
  activityLogs: ActivityLog[] = [...SEED_ACTIVITY_LOGS];
  notifications: NotificationItem[] = [...SEED_NOTIFICATIONS];
  dailyTasks: DailyTask[] = (() => {
    try {
      const saved = localStorage.getItem('choudhary_crm_daily_tasks');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [...SEED_DAILY_TASKS];
  })();
  listeners: Array<() => void> = [];

  saveDailyTasks() {
    try {
      localStorage.setItem('choudhary_crm_daily_tasks', JSON.stringify(this.dailyTasks));
    } catch (e) {}
  }

  saveFollowups() {
    try {
      localStorage.setItem('choudhary_crm_followups', JSON.stringify(this.followups));
    } catch (e) {}
  }

  saveSiteVisits() {
    try {
      localStorage.setItem('choudhary_crm_site_visits', JSON.stringify(this.siteVisits));
    } catch (e) {}
  }

  saveLeadOverride(leadId: string, updates: Partial<Lead>) {
    try {
      this.leadOverrides[leadId] = {
        ...(this.leadOverrides[leadId] || {}),
        ...updates
      };
      localStorage.setItem('choudhary_crm_lead_overrides', JSON.stringify(this.leadOverrides));
    } catch (e) {}
  }

  applyLeadOverrides(leadsList: Lead[]): Lead[] {
    if (!this.leadOverrides || Object.keys(this.leadOverrides).length === 0) return leadsList;
    return leadsList.map(l => {
      const ov = this.leadOverrides[l.id] || this.leadOverrides[l.metaLeadId || ''];
      return ov ? { ...l, ...ov } : l;
    });
  }

  subscribe(cb: () => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  notify() {
    this.listeners.forEach(l => l());
  }
}

export const localStore = new LocalCRMStore();

// Helper to log audit activity
export async function logActivity(
  eventType: ActivityLog['eventType'],
  description: string,
  actor: { id: string; name: string; role: UserRole },
  leadId?: string,
  previousValue?: string,
  newValue?: string
) {
  const newLog: ActivityLog = {
    id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    leadId,
    eventType,
    description,
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    previousValue,
    newValue,
    timestamp: new Date().toISOString()
  };

  localStore.activityLogs.unshift(newLog);
  localStore.notify();

  // Background non-blocking persistence
  try {
    withTimeout(setDoc(doc(db, 'activityLogs', newLog.id), sanitizeForFirestore(newLog)), 2000).catch(() => {});
  } catch (err) {}
}

// ----------------- USER SERVICES -----------------
export async function fetchUsers(): Promise<CRMUser[]> {
  try {
    const snap = await getDocs(collection(db, 'users'));
    if (!snap.empty) {
      const list = snap.docs.map(d => d.data() as CRMUser);
      localStore.users = list;
      return list;
    }
  } catch (err) {
    console.warn('Using seed users fallback');
  }
  return localStore.users;
}

export async function toggleUserStatus(uid: string, active: boolean, actor: { id: string; name: string; role: UserRole }) {
  const user = localStore.users.find(u => u.uid === uid);
  if (user) {
    user.active = active;
    try {
      await updateDoc(doc(db, 'users', uid), { active });
    } catch (e) {}
    await logActivity('STATUS_UPDATED', `User account ${user.displayName} (${user.employeeCode || user.email}) ${active ? 'reactivated' : 'disabled'}`, actor);
    localStore.notify();
  }
}

// ----------------- PROJECT & INVENTORY SERVICES -----------------
export async function fetchProjects(): Promise<Project[]> {
  try {
    const snap = await getDocs(collection(db, 'projects'));
    if (!snap.empty) {
      const list = snap.docs.map(d => d.data() as Project);
      localStore.projects = list;
      return list;
    }
  } catch (err) {}
  return localStore.projects;
}

export async function fetchInventory(): Promise<InventoryUnit[]> {
  try {
    const snap = await getDocs(collection(db, 'inventoryUnits'));
    if (!snap.empty) {
      const list = snap.docs.map(d => d.data() as InventoryUnit);
      localStore.inventory = list;
      return list;
    }
  } catch (err) {}
  return localStore.inventory;
}

export async function addProject(projectData: Omit<Project, 'id' | 'createdAt'>, actor: { id: string; name: string; role: UserRole }) {
  const newProj: Project = {
    ...projectData,
    id: `proj-${Date.now()}`,
    createdAt: new Date().toISOString()
  };
  localStore.projects.unshift(newProj);
  try {
    await setDoc(doc(db, 'projects', newProj.id), newProj);
  } catch (e) {}
  await logActivity('STATUS_UPDATED', `Created new project: ${newProj.name} (${newProj.location})`, actor);
  localStore.notify();
  return newProj;
}

// ----------------- LEAD SERVICES -----------------
export async function fetchLeads(userUid?: string): Promise<Lead[]> {
  const uid = userUid || localStorage.getItem('choudhary_crm_user_uid') || 'admin-001';

  // 1. Try Live API endpoint (/api/leads via Express or Apache rewrite)
  try {
    const res = await fetch('/api/leads', {
      headers: {
        'x-user-id': uid
      }
    });
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      if (data.success && Array.isArray(data.leads) && data.leads.length > 0) {
        localStore.leads = localStore.applyLeadOverrides(data.leads.map((l: any) => ({
          ...l,
          assigned_to: l.assigned_to || l.assignedEmployeeId || '',
          assignedTo: l.assignedTo || l.assignedEmployeeId || ''
        })));
        localStore.notify();
        return localStore.leads;
      }
    }
  } catch (err) {
    console.warn('API /api/leads error, attempting static JSON fallback:', err);
  }

  // 2. Try static /api/leads.json (for cPanel/Apache static hosting)
  try {
    const resJson = await fetch('/api/leads.json');
    const ct = resJson.headers.get('content-type') || '';
    if (resJson.ok && (ct.includes('application/json') || !ct.includes('text/html'))) {
      const data = await resJson.json();
      const list = Array.isArray(data) ? data : data.leads;
      if (Array.isArray(list) && list.length > 0) {
        const user = localStore.users.find(u => u.uid === uid);
        let filtered = list;
        if (user && user.role === 'employee') {
          filtered = list.filter((l: any) => l.assignedEmployeeId === uid);
        } else if (user && user.role === 'team_leader') {
          const heenaTeam = ['admin-002', 'emp-001', 'emp-002', 'emp-003', 'emp-004', 'emp-005', 'emp-006', 'emp-007', 'emp-008'];
          filtered = list.filter((l: any) => heenaTeam.includes(l.assignedEmployeeId) || l.assignedEmployeeId === uid || !l.assignedEmployeeId);
        }
        localStore.leads = localStore.applyLeadOverrides(filtered.map((l: any) => ({
          ...l,
          assigned_to: l.assigned_to || l.assignedEmployeeId || '',
          assignedTo: l.assignedTo || l.assignedEmployeeId || ''
        })));
        localStore.notify();
        return localStore.leads;
      }
    }
  } catch (err) {
    console.warn('Static /api/leads.json error:', err);
  }

  // 3. Fallback to bundled authentic REAL_ESTATE_LEADS (guarantees leads ALWAYS show on live!)
  if (REAL_ESTATE_LEADS && REAL_ESTATE_LEADS.length > 0) {
    const user = localStore.users.find(u => u.uid === uid);
    let filtered = REAL_ESTATE_LEADS;
    if (user && user.role === 'employee') {
      filtered = REAL_ESTATE_LEADS.filter(l => l.assignedEmployeeId === uid);
    } else if (user && user.role === 'team_leader') {
      const heenaTeam = ['admin-002', 'emp-001', 'emp-002', 'emp-003', 'emp-004', 'emp-005', 'emp-006', 'emp-007', 'emp-008'];
      filtered = REAL_ESTATE_LEADS.filter(l => heenaTeam.includes(l.assignedEmployeeId || '') || l.assignedEmployeeId === uid || !l.assignedEmployeeId);
    }
    localStore.leads = localStore.applyLeadOverrides(filtered.map(l => ({
      ...l,
      assigned_to: l.assigned_to || l.assignedEmployeeId || '',
      assignedTo: l.assignedTo || l.assignedEmployeeId || ''
    })));
    localStore.notify();
    return localStore.leads;
  }

  return localStore.leads;
}

export async function createLead(
  leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>,
  actor: { id: string; name: string; role: UserRole }
): Promise<Lead> {
  const id = `lead-${Date.now()}`;
  const now = new Date().toISOString();
  
  // Auto assignment check if unassigned and round-robin active
  let assignedEmployeeId = leadData.assignedEmployeeId || '';
  let assignedEmployeeName = leadData.assignedEmployeeName || '';
  
  if (!assignedEmployeeId && localStore.metaIntegration.autoAssignmentEnabled && localStore.metaIntegration.assignmentMode === 'Round Robin') {
    const activeEmployees = localStore.users.filter(u => u.role === 'employee' && u.active);
    if (activeEmployees.length > 0) {
      // Pick next employee with fewest active leads
      const counts = activeEmployees.map(emp => ({
        emp,
        count: localStore.leads.filter(l => l.assignedEmployeeId === emp.uid && l.stage !== 'Lost' && l.stage !== 'Unqualified').length
      }));
      counts.sort((a, b) => a.count - b.count);
      assignedEmployeeId = counts[0].emp.uid;
      assignedEmployeeName = counts[0].emp.displayName;
    }
  }

  const newLead: Lead = {
    ...leadData,
    id,
    assignedEmployeeId,
    assignedEmployeeName,
    assigned_to: (leadData as any).assigned_to || assignedEmployeeId,
    assignedTo: (leadData as any).assignedTo || assignedEmployeeId,
    stage: leadData.stage || 'New lead',
    subStatus: leadData.subStatus || (assignedEmployeeId ? 'Assigned' : 'Unassigned'),
    createdAt: now,
    updatedAt: now
  };

  localStore.leads.unshift(newLead);
  localStore.metaIntegration.totalLeadsIngested += 1;
  localStore.metaIntegration.lastSyncAt = now;

  try {
    await fetch('/api/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': actor.id
      },
      body: JSON.stringify(newLead)
    });
  } catch (e) {
    console.warn('Could not post lead to server API:', e);
  }

  try {
    await setDoc(doc(db, 'leads', id), newLead);
  } catch (e) {}

  await logActivity(
    'LEAD_CREATED',
    `New lead created for ${newLead.customerName} (${newLead.phone}) via ${newLead.source}`,
    actor,
    newLead.id
  );

  if (assignedEmployeeId) {
    await logActivity(
      'LEAD_ASSIGNED',
      `Lead assigned to ${assignedEmployeeName}`,
      actor,
      newLead.id,
      'Unassigned',
      assignedEmployeeName
    );
  }

  localStore.notify();
  return newLead;
}

export async function addLeadActivity(
  leadId: string,
  eventType: ActivityLog['eventType'],
  description: string,
  actor: { id: string; name: string; role: UserRole }
) {
  return await logActivity(eventType, description, actor, leadId);
}

export async function updateLead(
  leadId: string,
  updates: Partial<Lead>,
  actor: { id: string; name: string; role: UserRole }
) {
  const index = localStore.leads.findIndex(l => l.id === leadId || l.metaLeadId === leadId);
  if (index !== -1) {
    const oldLead = localStore.leads[index];
    const newAssigned = updates.assigned_to !== undefined 
      ? updates.assigned_to 
      : (updates.assignedEmployeeId !== undefined ? updates.assignedEmployeeId : (oldLead.assigned_to || oldLead.assignedEmployeeId));

    const updated: Lead = {
      ...oldLead,
      ...updates,
      assignedEmployeeId: newAssigned,
      assigned_to: newAssigned,
      assignedTo: newAssigned,
      updatedAt: new Date().toISOString()
    };
    localStore.leads[index] = updated;
    localStore.saveLeadOverride(leadId, updates);
    localStore.notify();

    fetch(`/api/leads/${encodeURIComponent(leadId)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': actor.id
      },
      body: JSON.stringify(updates)
    }).catch(() => {});

    try {
      withTimeout(setDoc(doc(db, 'leads', leadId), sanitizeForFirestore(updates), { merge: true }), 3000).catch(() => {});
    } catch (e) {}

    if (updates.stage || updates.subStatus) {
      await logActivity(
        'STATUS_UPDATED',
        `Lead stage changed to ${updated.stage} (${updated.subStatus})`,
        actor,
        leadId,
        `${oldLead.stage} / ${oldLead.subStatus}`,
        `${updated.stage} / ${updated.subStatus}`
      );
    } else if (updates.priority && updates.priority !== oldLead.priority) {
      await logActivity(
        'STATUS_UPDATED',
        `Priority modified from ${oldLead.priority} to ${updates.priority}`,
        actor,
        leadId,
        oldLead.priority,
        updates.priority
      );
    } else if (updates.budgetMax !== undefined || updates.budgetMin !== undefined) {
      const minL = ((Number(updated.budgetMin || 0)) / 100000).toFixed(1);
      const maxL = ((Number(updated.budgetMax || 0)) / 100000).toFixed(1);
      await logActivity(
        'STATUS_UPDATED',
        `Customer budget updated to ₹${minL}L - ₹${maxL}L by staff (Pipeline value recalculated)`,
        actor,
        leadId,
        `₹${((Number(oldLead.budgetMin || 0)) / 100000).toFixed(1)}L - ₹${((Number(oldLead.budgetMax || 0)) / 100000).toFixed(1)}L`,
        `₹${minL}L - ₹${maxL}L`
      );
    } else if (updates.notes && updates.notes !== oldLead.notes) {
      await logActivity(
        'NOTE_ADDED',
        `Remarks / Discussion recorded: "${updates.notes}"`,
        actor,
        leadId
      );
    } else {
      await logActivity(
        'NOTE_ADDED',
        `Updated lead profile details for ${updated.customerName}`,
        actor,
        leadId
      );
    }

    localStore.notify();
    return updated;
  }
}

export async function assignLead(
  leadId: string,
  employeeId: string,
  employeeName: string,
  actor: { id: string; name: string; role: UserRole }
) {
  const lead = localStore.leads.find(l => l.id === leadId || l.metaLeadId === leadId);
  if (lead) {
    const prevOwner = lead.assignedEmployeeName || 'Unassigned';
    lead.assignedEmployeeId = employeeId;
    lead.assignedEmployeeName = employeeName;
    lead.assigned_to = employeeId;
    lead.assignedTo = employeeId;
    if (lead.subStatus === 'Unassigned') {
      lead.subStatus = 'Assigned';
    }
    lead.updatedAt = new Date().toISOString();

    try {
      await fetch('/api/leads/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': actor.id
        },
        body: JSON.stringify({
          leadIds: [lead.id],
          employeeId,
          employeeName
        })
      });
    } catch (e) {
      console.warn('Could not assign lead on server API:', e);
    }

    try {
      await updateDoc(doc(db, 'leads', leadId), {
        assignedEmployeeId: employeeId,
        assignedEmployeeName: employeeName,
        assigned_to: employeeId,
        assignedTo: employeeId,
        subStatus: lead.subStatus,
        updatedAt: lead.updatedAt
      });
    } catch (e) {}

    await logActivity(
      'LEAD_ASSIGNED',
      `Lead assigned to ${employeeName}`,
      actor,
      leadId,
      prevOwner,
      employeeName
    );

    localStore.notify();
  }
}

export async function bulkAssignLeads(
  leadIds: string[],
  employeeId: string,
  employeeName: string,
  actor: { id: string; name: string; role: UserRole }
) {
  for (const id of leadIds) {
    const lead = localStore.leads.find(l => l.id === id || l.metaLeadId === id);
    if (lead) {
      lead.assignedEmployeeId = employeeId;
      lead.assignedEmployeeName = employeeName;
      lead.assigned_to = employeeId;
      lead.assignedTo = employeeId;
      if (lead.subStatus === 'Unassigned') {
        lead.subStatus = 'Assigned';
      }
      lead.updatedAt = new Date().toISOString();
    }
  }
  localStore.notify();

  try {
    await fetch('/api/leads/assign', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': actor.id
      },
      body: JSON.stringify({
        leadIds,
        employeeId,
        employeeName
      })
    });
  } catch (e) {
    console.warn('Could not bulk assign leads on server API:', e);
  }

  await logActivity(
    'LEAD_ASSIGNED',
    `Bulk assigned ${leadIds.length} lead(s) to ${employeeName}`,
    actor
  );
}

export async function bulkUpdateLeadStatus(
  leadIds: string[],
  stage: LeadStage,
  subStatus: LeadSubStatus,
  actor: { id: string; name: string; role: UserRole }
) {
  for (const id of leadIds) {
    const lead = localStore.leads.find(l => l.id === id || l.metaLeadId === id);
    if (lead) {
      lead.stage = stage;
      lead.subStatus = subStatus;
      lead.updatedAt = new Date().toISOString();
    }
  }
  localStore.notify();

  try {
    await fetch('/api/leads/bulk-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': actor.id
      },
      body: JSON.stringify({
        leadIds,
        stage,
        subStatus
      })
    });
  } catch (e) {
    console.warn('Could not bulk update status on server API:', e);
  }

  await logActivity(
    'STATUS_UPDATED',
    `Bulk updated status for ${leadIds.length} lead(s) to ${stage} (${subStatus})`,
    actor
  );
}

// ----------------- FOLLOWUP SERVICES -----------------
export async function scheduleFollowup(
  followupData: Omit<Followup, 'id' | 'createdAt'>,
  actor: { id: string; name: string; role: UserRole }
) {
  const newFol: Followup = {
    ...followupData,
    notes: followupData.notes || '',
    id: `fol-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString()
  };

  // 1. Instant in-memory and LocalStorage persistence (0 delay, crash-proof)
  localStore.followups.unshift(newFol);
  localStore.saveFollowups();

  // 2. Immediate Lead nextFollowupDate update
  const lead = localStore.leads.find(l => l.id === newFol.leadId);
  if (lead) {
    lead.nextFollowupDate = newFol.scheduledDate;
    localStore.saveLeadOverride(lead.id, { nextFollowupDate: newFol.scheduledDate });
  }

  // 3. Notify UI immediately
  localStore.notify();

  // 4. Background non-blocking network persistence (never blocks or freezes UI)
  const cleanFol = sanitizeForFirestore(newFol);

  fetch('/api/followups', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': actor.id },
    body: JSON.stringify(cleanFol)
  }).catch(() => {});

  if (lead) {
    fetch(`/api/leads/${encodeURIComponent(lead.id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-user-id': actor.id },
      body: JSON.stringify({ nextFollowupDate: newFol.scheduledDate })
    }).catch(() => {});

    try {
      withTimeout(setDoc(doc(db, 'leads', lead.id), { nextFollowupDate: newFol.scheduledDate }, { merge: true }), 3000).catch(() => {});
    } catch (e) {}
  }

  try {
    withTimeout(setDoc(doc(db, 'followups', newFol.id), cleanFol, { merge: true }), 3000).catch(() => {});
  } catch (e) {}

  logActivity(
    'FOLLOWUP_SCHEDULED',
    `Scheduled ${newFol.type} for ${newFol.scheduledDate} ${newFol.scheduledTime || ''}`,
    actor,
    newFol.leadId
  ).catch(() => {});

  return newFol;
}

export async function completeFollowup(
  followupId: string,
  outcome: string,
  actor: { id: string; name: string; role: UserRole },
  fallbackLeadId?: string
) {
  let fol = localStore.followups.find(f => f.id === followupId);

  if (!fol && followupId.startsWith('fol-lead-')) {
    const leadId = fallbackLeadId || followupId.replace('fol-lead-', '');
    const lead = localStore.leads.find(l => l.id === leadId);
    if (lead) {
      const mappedPriority: 'High' | 'Medium' | 'Low' = lead.priority === 'Hot' ? 'High' : lead.priority === 'Cold' ? 'Low' : 'Medium';
      fol = {
        id: followupId,
        leadId: lead.id,
        leadName: lead.customerName,
        leadPhone: lead.phone,
        employeeId: lead.assignedEmployeeId || actor.id,
        employeeName: lead.assignedEmployeeName || actor.name,
        type: 'Phone Call',
        scheduledDate: lead.nextFollowupDate || new Date().toISOString().split('T')[0],
        status: 'Completed',
        notes: lead.notes || '',
        priority: mappedPriority,
        createdAt: new Date().toISOString(),
        outcome,
        completedAt: new Date().toISOString()
      };
      localStore.followups.unshift(fol);
      lead.nextFollowupDate = '';
      localStore.saveLeadOverride(lead.id, { nextFollowupDate: '' });

      fetch(`/api/leads/${encodeURIComponent(lead.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-id': actor.id },
        body: JSON.stringify({ nextFollowupDate: '' })
      }).catch(() => {});

      try {
        withTimeout(setDoc(doc(db, 'leads', lead.id), { nextFollowupDate: '' }, { merge: true }), 3000).catch(() => {});
      } catch (e) {}
    }
  } else if (fol) {
    const existingFol: Followup = fol;
    existingFol.status = 'Completed';
    existingFol.outcome = outcome;
    existingFol.completedAt = new Date().toISOString();

    const lead = localStore.leads.find(l => l.id === existingFol.leadId);
    if (lead && lead.nextFollowupDate === existingFol.scheduledDate) {
      lead.nextFollowupDate = '';
      localStore.saveLeadOverride(lead.id, { nextFollowupDate: '' });

      fetch(`/api/leads/${encodeURIComponent(lead.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-id': actor.id },
        body: JSON.stringify({ nextFollowupDate: '' })
      }).catch(() => {});

      try {
        withTimeout(setDoc(doc(db, 'leads', lead.id), { nextFollowupDate: '' }, { merge: true }), 3000).catch(() => {});
      } catch (e) {}
    }
  }

  if (fol) {
    localStore.saveFollowups();
    localStore.notify();

    fetch(`/api/followups/${encodeURIComponent(fol.id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-user-id': actor.id },
      body: JSON.stringify({
        status: 'Completed',
        outcome,
        completedAt: fol.completedAt
      })
    }).catch(() => {});

    try {
      withTimeout(setDoc(doc(db, 'followups', fol.id), {
        status: 'Completed',
        outcome,
        completedAt: fol.completedAt
      }, { merge: true }), 3000).catch(() => {});
    } catch (e) {}

    logActivity(
      'FOLLOWUP_COMPLETED',
      `Completed follow-up (${fol.type}): ${outcome}`,
      actor,
      fol.leadId
    ).catch(() => {});
  }
}

// ----------------- SITE VISIT SERVICES -----------------
export async function scheduleSiteVisit(
  visitData: Omit<SiteVisit, 'id' | 'createdAt'>,
  actor: { id: string; name: string; role: UserRole }
) {
  const newVisit: SiteVisit = {
    ...visitData,
    feedback: visitData.feedback || '',
    id: `vis-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString()
  };

  // 1. Instant in-memory & LocalStorage save (INSTANT, 0 delay, 100% persistent)
  localStore.siteVisits.unshift(newVisit);
  localStore.saveSiteVisits();

  // 2. Immediate Lead stage & followup date update
  const lead = localStore.leads.find(l => l.id === newVisit.leadId);
  if (lead) {
    lead.stage = 'Site Visit';
    lead.subStatus = newVisit.status === 'Completed' ? 'Site Visit Completed' : 'Site Visit Scheduled';
    if (newVisit.visitDate) {
      lead.nextFollowupDate = newVisit.visitDate;
    }
    localStore.saveLeadOverride(lead.id, {
      stage: 'Site Visit',
      subStatus: lead.subStatus,
      nextFollowupDate: lead.nextFollowupDate
    });
  }

  // 3. Immediately notify all listeners so tables, kanban, counts update without delay
  localStore.notify();

  // 4. Background non-blocking network persistence (never blocks or freezes UI)
  const cleanVisit = sanitizeForFirestore(newVisit);

  fetch('/api/site-visits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': actor.id },
    body: JSON.stringify(cleanVisit)
  }).catch(() => {});

  if (lead) {
    fetch(`/api/leads/${encodeURIComponent(lead.id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-user-id': actor.id },
      body: JSON.stringify({
        stage: 'Site Visit',
        subStatus: lead.subStatus,
        nextFollowupDate: lead.nextFollowupDate
      })
    }).catch(() => {});

    try {
      withTimeout(setDoc(doc(db, 'leads', lead.id), {
        stage: 'Site Visit',
        subStatus: lead.subStatus,
        nextFollowupDate: lead.nextFollowupDate
      }, { merge: true }), 3000).catch(() => {});
    } catch (e) {}
  }

  try {
    withTimeout(setDoc(doc(db, 'siteVisits', newVisit.id), cleanVisit, { merge: true }), 3000).catch(() => {});
  } catch (e) {}

  logActivity(
    'SITE_VISIT_SCHEDULED',
    `Scheduled site visit for project ${newVisit.projectName} on ${newVisit.visitDate} at ${newVisit.visitTime}`,
    actor,
    newVisit.leadId
  ).catch(() => {});

  return newVisit;
}

export async function updateSiteVisit(
  visitId: string,
  updates: Partial<SiteVisit>,
  actor: { id: string; name: string; role: UserRole }
) {
  const visit = localStore.siteVisits.find(v => v.id === visitId);
  if (visit) {
    Object.assign(visit, updates);
    if (updates.status === 'Completed') {
      visit.completedAt = new Date().toISOString();
      const lead = localStore.leads.find(l => l.id === visit.leadId);
      if (lead) {
        lead.stage = 'Site Visit';
        lead.subStatus = 'Site Visit Completed';
        localStore.saveLeadOverride(lead.id, {
          stage: 'Site Visit',
          subStatus: 'Site Visit Completed'
        });

        fetch(`/api/leads/${encodeURIComponent(lead.id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'x-user-id': actor.id },
          body: JSON.stringify({ stage: 'Site Visit', subStatus: 'Site Visit Completed' })
        }).catch(() => {});

        try {
          withTimeout(setDoc(doc(db, 'leads', lead.id), {
            stage: 'Site Visit',
            subStatus: 'Site Visit Completed'
          }, { merge: true }), 3000).catch(() => {});
        } catch (e) {}
      }
    } else if (updates.status === 'Revisit') {
      const lead = localStore.leads.find(l => l.id === visit.leadId);
      if (lead) {
        lead.stage = 'Revisit';
        lead.subStatus = 'Revisit Scheduled';
        localStore.saveLeadOverride(lead.id, {
          stage: 'Revisit',
          subStatus: 'Revisit Scheduled'
        });

        fetch(`/api/leads/${encodeURIComponent(lead.id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'x-user-id': actor.id },
          body: JSON.stringify({ stage: 'Revisit', subStatus: 'Revisit Scheduled' })
        }).catch(() => {});

        try {
          withTimeout(setDoc(doc(db, 'leads', lead.id), {
            stage: 'Revisit',
            subStatus: 'Revisit Scheduled'
          }, { merge: true }), 3000).catch(() => {});
        } catch (e) {}
      }
    } else if (updates.status === 'Cancelled' || updates.status === 'No-Show') {
      const lead = localStore.leads.find(l => l.id === visit.leadId);
      if (lead) {
        localStore.saveLeadOverride(lead.id, {
          stage: lead.stage,
          subStatus: 'Site Visit Scheduled'
        });
      }
    }

    localStore.saveSiteVisits();
    localStore.notify();

    const cleanUpdates = sanitizeForFirestore(updates);

    fetch(`/api/site-visits/${encodeURIComponent(visitId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-user-id': actor.id },
      body: JSON.stringify(cleanUpdates)
    }).catch(() => {});

    try {
      withTimeout(setDoc(doc(db, 'siteVisits', visitId), cleanUpdates, { merge: true }), 3000).catch(() => {});
    } catch (e) {}

    logActivity(
      'SITE_VISIT_COMPLETED',
      `Updated site visit status to ${visit.status} (${visit.feedback || 'No feedback'})`,
      actor,
      visit.leadId
    ).catch(() => {});
  }
}

// ----------------- BOOKING & INVENTORY SERVICES -----------------
export async function createBooking(
  bookingData: Omit<Booking, 'id' | 'createdAt' | 'adminApproved'>,
  actor: { id: string; name: string; role: UserRole }
) {
  // Check inventory unit availability
  const unit = localStore.inventory.find(u => u.unitNumber === bookingData.unitNumber || u.id === bookingData.unitId);
  if (unit && (unit.status === 'Booked' || unit.status === 'Sold')) {
    throw new Error(`Unit ${bookingData.unitNumber} is already ${unit.status}. Duplicate booking prevented.`);
  }

  const newBooking: Booking = {
    ...bookingData,
    id: `book-${Date.now()}`,
    adminApproved: actor.role === 'admin',
    createdAt: new Date().toISOString()
  };

  localStore.bookings.unshift(newBooking);

  // Hold inventory unit
  if (unit) {
    unit.status = newBooking.adminApproved ? 'Booked' : 'On Hold';
    unit.bookedByLeadId = newBooking.leadId;
    unit.bookedByEmployeeId = newBooking.employeeId;
  }

  // Update lead
  const lead = localStore.leads.find(l => l.id === newBooking.leadId);
  if (lead) {
    lead.stage = 'Opportunity';
    lead.subStatus = newBooking.adminApproved ? 'Booked' : 'Token Received';
    try {
      await updateDoc(doc(db, 'leads', lead.id), {
        stage: lead.stage,
        subStatus: lead.subStatus
      });
    } catch (e) {}
  }

  try {
    await setDoc(doc(db, 'bookings', newBooking.id), newBooking);
  } catch (e) {}

  await logActivity(
    'BOOKING_REQUESTED',
    `Booking ${newBooking.adminApproved ? 'Confirmed' : 'Requested'} for Unit ${newBooking.unitNumber} (Token: ₹${newBooking.tokenAmount.toLocaleString('en-IN')})`,
    actor,
    newBooking.leadId
  );

  localStore.notify();
  return newBooking;
}

export async function approveBooking(
  bookingId: string,
  actor: { id: string; name: string; role: UserRole }
) {
  if (actor.role !== 'admin') {
    throw new Error('Only Super Admin can approve bookings');
  }

  const booking = localStore.bookings.find(b => b.id === bookingId);
  if (booking) {
    booking.adminApproved = true;
    booking.status = 'Confirmed';

    // Update unit status to Booked
    const unit = localStore.inventory.find(u => u.unitNumber === booking.unitNumber);
    if (unit) {
      unit.status = 'Booked';
    }

    // Update lead stage
    const lead = localStore.leads.find(l => l.id === booking.leadId);
    if (lead) {
      lead.stage = 'Opportunity';
      lead.subStatus = 'Booked';
    }

    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        adminApproved: true,
        status: 'Confirmed'
      });
    } catch (e) {}

    await logActivity(
      'BOOKING_APPROVED',
      `Super Admin approved booking for ${booking.customerName} (Unit: ${booking.unitNumber})`,
      actor,
      booking.leadId
    );

    localStore.notify();
  }
}

// ----------------- META INTEGRATION TEST TRIGGER -----------------
export async function triggerMetaLeadSimulation(
  customerName: string,
  phone: string,
  projectName: string,
  actor: { id: string; name: string; role: UserRole }
) {
  const simLead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'> = {
    customerName,
    phone,
    source: 'Facebook Ads',
    metaLeadId: `meta-sim-${Date.now()}`,
    metaFormName: 'FB Instant Lead Form',
    metaCampaignName: `${projectName.replace(/\s+/g, '_')}_Campaign_2026`,
    projectName,
    stage: 'New lead',
    subStatus: 'Unassigned',
    priority: 'Hot',
    notes: 'Simulated Facebook Lead Ads submission via CRM Meta Integration Test console.'
  };

  const created = await createLead(simLead, actor);
  return created;
}

// ----------------- EXPORT & IMPORT CSV HELPERS -----------------
export function exportLeadsToCSV(
  leads: Lead[],
  actor?: { id: string; name: string; role: string; username?: string }
) {
  if (actor) {
    const isOwner = actor.role === 'owner' || actor.id === 'admin-001' || actor.username === 'kishan';
    const isHeena = actor.role === 'team_leader' || actor.id === 'admin-002' || actor.username === 'heena' || (actor.name && actor.name.toLowerCase().includes('heena'));
    if (!isOwner && !isHeena) {
      alert('Access Denied: Regular employees are not permitted to export leads. Only Company Owner and Heena are authorized.');
      return;
    }
  }

  const headers = [
    'Lead ID',
    'Customer Name',
    'Phone',
    'Alternate Phone',
    'Email',
    'Source',
    'Project Name',
    'Property Type',
    'Budget Min',
    'Budget Max',
    'Stage',
    'Sub Status',
    'Priority',
    'Assigned Employee',
    'Created Date'
  ];

  const rows = leads.map(l => [
    l.id,
    `"${l.customerName || ''}"`,
    `"${l.phone || ''}"`,
    `"${l.alternatePhone || ''}"`,
    `"${l.email || ''}"`,
    `"${l.source || ''}"`,
    `"${l.projectName || ''}"`,
    `"${l.propertyType || ''}"`,
    l.budgetMin || '',
    l.budgetMax || '',
    `"${l.stage || ''}"`,
    `"${l.subStatus || ''}"`,
    `"${l.priority || ''}"`,
    `"${l.assignedEmployeeName || 'Unassigned'}"`,
    `"${l.createdAt || ''}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Choudhary_CRM_Leads_Export_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  if (actor) {
    logActivity(
      'LEAD_EXPORTED',
      `${actor.name} exported ${leads.length} leads to CSV`,
      { id: actor.id, name: actor.name, role: actor.role as UserRole }
    );
  }
}

export async function importLeadsFromCSV(
  csvText: string,
  actor: { id: string; name: string; role: UserRole }
): Promise<number> {
  const lines = csvText.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return 0;

  let importedCount = 0;
  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.replace(/^"|"$/g, '').trim());
    if (cols.length >= 2 && cols[0] && cols[1]) {
      const customerName = cols[0] || 'Bulk Import Lead';
      const phone = cols[1] || '+91 90000 00000';
      const email = cols[2] || '';
      const projectName = cols[3] || 'Jeevika Heights';
      const source = (cols[4] || 'Manual Call') as Lead['source'];

      await createLead(
        {
          customerName,
          phone,
          email,
          projectName,
          source,
          stage: 'New lead',
          subStatus: 'Unassigned',
          priority: 'Warm',
          notes: 'Imported from CSV Bulk Lead file.'
        },
        actor
      );
      importedCount++;
    }
  }

  return importedCount;
}

// ----------------- DAILY WORK & TASK SERVICES -----------------
export async function addDailyTask(
  taskData: Omit<DailyTask, 'id' | 'createdAt'>,
  actor: { id: string; name: string; role: UserRole }
): Promise<DailyTask> {
  const newTask: DailyTask = {
    ...taskData,
    id: `dt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    createdAt: new Date().toISOString()
  };
  localStore.dailyTasks.unshift(newTask);
  localStore.saveDailyTasks();
  await logActivity(
    'NOTE_ADDED',
    `Added daily task for ${newTask.assignedToName}: "${newTask.title}"`,
    actor
  );
  localStore.notify();
  return newTask;
}

export async function toggleDailyTask(
  taskId: string,
  actor: { id: string; name: string; role: UserRole }
) {
  const task = localStore.dailyTasks.find(t => t.id === taskId);
  if (task) {
    task.completed = !task.completed;
    task.completedAt = task.completed ? new Date().toISOString() : undefined;
    localStore.saveDailyTasks();
    await logActivity(
      'NOTE_ADDED',
      `${task.completed ? 'Completed' : 'Reopened'} daily task: "${task.title}"`,
      actor
    );
    localStore.notify();
  }
}

export async function deleteDailyTask(
  taskId: string,
  actor: { id: string; name: string; role: UserRole }
) {
  const idx = localStore.dailyTasks.findIndex(t => t.id === taskId);
  if (idx !== -1) {
    const [removed] = localStore.dailyTasks.splice(idx, 1);
    localStore.saveDailyTasks();
    await logActivity(
      'NOTE_ADDED',
      `Deleted daily task: "${removed.title}"`,
      actor
    );
    localStore.notify();
  }
}

// Synchronize database records (Server Disk + Firebase Firestore) on startup and in real-time
export async function syncDatabaseAndState() {
  if (typeof window === 'undefined') return;

  // 1. Sync Followups from Server Disk
  try {
    const res = await withTimeout(fetch('/api/followups'), 2000);
    const ct = res.headers.get('content-type') || '';
    if (res.ok && ct.includes('application/json')) {
      const data = await res.json();
      if (data.success && Array.isArray(data.followups)) {
        const idMap = new Map(localStore.followups.map(f => [f.id, f]));
        for (const sf of data.followups) {
          if (!idMap.has(sf.id)) {
            localStore.followups.unshift(sf);
            idMap.set(sf.id, sf);
          } else {
            Object.assign(idMap.get(sf.id)!, sf);
          }
        }
        localStore.saveFollowups();
      }
    }
  } catch (e) {}

  // 2. Sync Site Visits from Server Disk
  try {
    const res = await withTimeout(fetch('/api/site-visits'), 2000);
    const ct = res.headers.get('content-type') || '';
    if (res.ok && ct.includes('application/json')) {
      const data = await res.json();
      if (data.success && Array.isArray(data.siteVisits)) {
        const idMap = new Map(localStore.siteVisits.map(v => [v.id, v]));
        for (const sv of data.siteVisits) {
          if (!idMap.has(sv.id)) {
            localStore.siteVisits.unshift(sv);
            idMap.set(sv.id, sv);
          } else {
            Object.assign(idMap.get(sv.id)!, sv);
          }
        }
        localStore.saveSiteVisits();
      }
    }
  } catch (e) {}

  // 3. Sync from Firebase Firestore (Followups)
  try {
    const fSnap = await withTimeout(getDocs(collection(db, 'followups')), 2000);
    if (fSnap && !fSnap.empty) {
      const idMap = new Map(localStore.followups.map(f => [f.id, f]));
      fSnap.forEach(docSnap => {
        const d = docSnap.data() as Followup;
        if (!idMap.has(d.id)) {
          localStore.followups.unshift(d);
          idMap.set(d.id, d);
        } else {
          Object.assign(idMap.get(d.id)!, d);
        }
      });
      localStore.saveFollowups();
    }
  } catch (e) {}

  // 4. Sync from Firebase Firestore (Site Visits)
  try {
    const vSnap = await withTimeout(getDocs(collection(db, 'siteVisits')), 2000);
    if (vSnap && !vSnap.empty) {
      const idMap = new Map(localStore.siteVisits.map(v => [v.id, v]));
      vSnap.forEach(docSnap => {
        const d = docSnap.data() as SiteVisit;
        if (!idMap.has(d.id)) {
          localStore.siteVisits.unshift(d);
          idMap.set(d.id, d);
        } else {
          Object.assign(idMap.get(d.id)!, d);
        }
      });
      localStore.saveSiteVisits();
    }
  } catch (e) {}

  // 5. Setup Real-time Firestore Listeners with error handlers
  try {
    onSnapshot(collection(db, 'followups'), snapshot => {
      let changed = false;
      const idMap = new Map(localStore.followups.map(f => [f.id, f]));
      snapshot.docChanges().forEach(change => {
        const d = change.doc.data() as Followup;
        if (change.type === 'added' && !idMap.has(d.id)) {
          localStore.followups.unshift(d);
          idMap.set(d.id, d);
          changed = true;
        } else if (change.type === 'modified' && idMap.has(d.id)) {
          Object.assign(idMap.get(d.id)!, d);
          changed = true;
        }
      });
      if (changed) {
        localStore.saveFollowups();
        localStore.notify();
      }
    }, err => {
      console.warn('Firestore followups snapshot warning:', err.message);
    });
  } catch (e) {}

  try {
    onSnapshot(collection(db, 'siteVisits'), snapshot => {
      let changed = false;
      const idMap = new Map(localStore.siteVisits.map(v => [v.id, v]));
      snapshot.docChanges().forEach(change => {
        const d = change.doc.data() as SiteVisit;
        if (change.type === 'added' && !idMap.has(d.id)) {
          localStore.siteVisits.unshift(d);
          idMap.set(d.id, d);
          changed = true;
        } else if (change.type === 'modified' && idMap.has(d.id)) {
          Object.assign(idMap.get(d.id)!, d);
          changed = true;
        }
      });
      if (changed) {
        localStore.saveSiteVisits();
        localStore.notify();
      }
    }, err => {
      console.warn('Firestore siteVisits snapshot warning:', err.message);
    });
  } catch (e) {}

  localStore.notify();
}

// Auto-load real estate leads and sync database records on client startup
if (typeof window !== 'undefined') {
  fetchLeads().catch(err => console.warn('Initial API lead fetch:', err));
  syncDatabaseAndState().catch(err => console.warn('Initial database sync:', err));
}

