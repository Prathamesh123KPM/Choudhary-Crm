import { localStore } from '../services/crmService';
import { Followup, SiteVisit, DailyTask, Lead, Booking, CRMUser } from '../types/crm';

/**
 * Returns current date in Indian Standard Time (IST - Asia/Kolkata) formatted as 'YYYY-MM-DD'
 */
export function getTodayIST(): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  } catch (e) {
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Normalizes strings for robust employee identity comparison.
 */
function normalizeIdentifier(val?: string): string {
  return (val || '').trim().toLowerCase().replace(/[-_\s]/g, '');
}

/**
 * Checks if a target employee (by ID and/or Name) matches an employee identifier filter.
 * Supports matching across uid, id, username, employeeCode, and displayName.
 * If employeeFilter is undefined or 'ALL', returns true.
 */
export function matchesEmployee(
  targetEmpId?: string,
  targetEmpName?: string,
  employeeFilter?: string
): boolean {
  if (!employeeFilter || employeeFilter === 'ALL') {
    return true;
  }
  if (!targetEmpId && !targetEmpName) {
    return false;
  }

  const cleanFilter = normalizeIdentifier(employeeFilter);
  const cleanId = normalizeIdentifier(targetEmpId);
  const cleanName = normalizeIdentifier(targetEmpName);

  if (cleanId && (cleanId === cleanFilter || cleanId.includes(cleanFilter) || cleanFilter.includes(cleanId))) {
    return true;
  }
  if (cleanName && (cleanName === cleanFilter || cleanName.includes(cleanFilter) || cleanFilter.includes(cleanName))) {
    return true;
  }

  // Cross-reference against users list in localStore
  const matchedUser = localStore.users.find(u => {
    return (
      normalizeIdentifier(u.uid) === cleanFilter ||
      normalizeIdentifier(u.id) === cleanFilter ||
      normalizeIdentifier(u.username) === cleanFilter ||
      normalizeIdentifier(u.employeeCode) === cleanFilter ||
      normalizeIdentifier(u.displayName) === cleanFilter
    );
  });

  if (matchedUser) {
    if (
      normalizeIdentifier(matchedUser.uid) === cleanId ||
      normalizeIdentifier(matchedUser.id) === cleanId ||
      normalizeIdentifier(matchedUser.username) === cleanId ||
      normalizeIdentifier(matchedUser.employeeCode) === cleanId
    ) {
      return true;
    }
    if (cleanName && normalizeIdentifier(matchedUser.displayName) === cleanName) {
      return true;
    }
  }

  return false;
}

/**
 * Unified list of follow-ups for an employee or company, combining explicit
 * follow-up records with lead callback dates.
 */
export function getEmployeeFollowups(employeeFilter?: string): Followup[] {
  const todayStr = getTodayIST();
  const explicitFollowups = localStore.followups.filter(f =>
    matchesEmployee(f.employeeId, f.employeeName, employeeFilter)
  );

  // Existing lead IDs that already have an explicit active follow-up
  const existingFollowupLeadIds = new Set(
    explicitFollowups.map(f => f.leadId).filter(Boolean)
  );

  // Synthesize follow-up tasks for leads with nextFollowupDate
  const leadFollowups: Followup[] = [];
  localStore.leads.forEach(l => {
    if (l.nextFollowupDate && matchesEmployee(l.assignedEmployeeId, l.assignedEmployeeName, employeeFilter)) {
      // If the lead doesn't already have an explicit follow-up matching this scheduled date
      const alreadyHasTask = explicitFollowups.some(
        f => f.leadId === l.id && (f.scheduledDate === l.nextFollowupDate || f.status !== 'Completed')
      );

      if (!alreadyHasTask) {
        const isPast = l.nextFollowupDate < todayStr;
        const isToday = l.nextFollowupDate === todayStr;
        leadFollowups.push({
          id: `fol-lead-${l.id}`,
          leadId: l.id,
          leadName: l.customerName,
          leadPhone: l.phone,
          employeeId: l.assignedEmployeeId || 'emp-001',
          employeeName: l.assignedEmployeeName || 'Surendra',
          type: 'Phone Call',
          scheduledDate: l.nextFollowupDate,
          scheduledTime: '11:00 AM',
          notes: l.notes || `Callback inquiry for ${l.projectName || 'property requirement'}`,
          priority: l.priority === 'Hot' ? 'High' : l.priority === 'Cold' ? 'Low' : 'Medium',
          status: isPast ? 'Overdue' : isToday ? 'Due Today' : 'Upcoming',
          createdAt: l.createdAt
        });
      }
    }
  });

  return [...explicitFollowups, ...leadFollowups];
}

/**
 * Follow-ups due today (scheduledDate === today in IST and not completed)
 */
export function getEmployeeFollowupsDueToday(employeeFilter?: string): Followup[] {
  const todayStr = getTodayIST();
  return getEmployeeFollowups(employeeFilter).filter(
    f => f.scheduledDate === todayStr && f.status !== 'Completed'
  );
}

/**
 * Overdue follow-ups (next follow-up date before today in IST and not completed)
 */
export function getEmployeeFollowupsOverdue(employeeFilter?: string): Followup[] {
  const todayStr = getTodayIST();
  return getEmployeeFollowups(employeeFilter).filter(
    f => f.scheduledDate < todayStr && f.status !== 'Completed'
  );
}

/**
 * Site visits per employee with flexible status / date filtering
 */
export function getEmployeeSiteVisits(
  employeeFilter?: string,
  filter?: 'today' | 'upcoming' | 'completed' | 'all'
): SiteVisit[] {
  const todayStr = getTodayIST();
  const allVisits = localStore.siteVisits.filter(v =>
    matchesEmployee(v.employeeId, v.employeeName, employeeFilter)
  );

  if (filter === 'today') {
    return allVisits.filter(v => v.visitDate === todayStr);
  }
  if (filter === 'upcoming') {
    return allVisits.filter(v => v.visitDate > todayStr);
  }
  if (filter === 'completed') {
    return allVisits.filter(v => v.status === 'Completed');
  }
  return allVisits;
}

/**
 * Daily tasks per employee with status / date filtering
 */
export function getEmployeeDailyTasks(
  employeeFilter?: string,
  filter?: 'today' | 'pending' | 'completed' | 'all'
): DailyTask[] {
  const todayStr = getTodayIST();
  const allTasks = localStore.dailyTasks.filter(t =>
    matchesEmployee(t.assignedToId, t.assignedToName, employeeFilter)
  );

  if (filter === 'today') {
    return allTasks.filter(t => t.dueDate === todayStr || (!t.completed && (t.dueDate || '') <= todayStr));
  }
  if (filter === 'pending') {
    return allTasks.filter(t => !t.completed);
  }
  if (filter === 'completed') {
    return allTasks.filter(t => t.completed);
  }
  return allTasks;
}

/**
 * Active leads per employee (excluding Lost and Unqualified)
 */
export function getEmployeeActiveLeads(employeeFilter?: string): Lead[] {
  return localStore.leads.filter(
    l =>
      matchesEmployee(l.assignedEmployeeId, l.assignedEmployeeName, employeeFilter) &&
      l.stage !== 'Lost' &&
      l.stage !== 'Unqualified'
  );
}

/**
 * Confirmed bookings / sales per employee
 */
export function getEmployeeBookings(employeeFilter?: string): Booking[] {
  return localStore.bookings.filter(b =>
    matchesEmployee(b.employeeId, b.employeeName, employeeFilter)
  );
}

export interface EmployeePerformanceMetrics {
  employeeId: string;
  todayStr: string;

  // Active Pipeline
  activeLeadsCount: number;
  totalLeadsCount: number;
  activePipelineValue: number;

  // Follow-ups
  dueTodayFollowupsCount: number;
  overdueFollowupsCount: number;
  completedFollowupsCount: number;
  totalFollowupsCount: number;

  // Site Visits
  siteVisitsTodayCount: number;
  siteVisitsPendingTodayCount: number;
  siteVisitsUpcomingCount: number;
  siteVisitsCompletedCount: number;
  siteVisitsTotalCount: number;

  // Daily Tasks
  tasksTodayCount: number;
  tasksPendingCount: number;
  tasksCompletedCount: number;
  totalTasksCount: number;

  // Sales Volume & Bookings
  totalBookingsCount: number;
  salesVolume: number;

  // Action Items for Today's Work Banner & Badges
  pendingCallsToday: number;
  pendingVisitsToday: number;
  pendingTasksToday: number;
  totalActionItemsToday: number;
  completedActionItemsToday: number;
  completionPercentage: number;
}

/**
 * Aggregates all performance, follow-up, task, and visit metrics for an employee
 * (or 'ALL' for company-wide summary).
 */
export function getEmployeePerformanceMetrics(employeeFilter?: string): EmployeePerformanceMetrics {
  const todayStr = getTodayIST();

  const allFollowups = getEmployeeFollowups(employeeFilter);
  const dueTodayFollowups = allFollowups.filter(f => f.scheduledDate === todayStr && f.status !== 'Completed');
  const overdueFollowups = allFollowups.filter(f => f.scheduledDate < todayStr && f.status !== 'Completed');
  const completedFollowups = allFollowups.filter(f => f.status === 'Completed');

  const allVisits = getEmployeeSiteVisits(employeeFilter, 'all');
  const todayVisits = allVisits.filter(v => v.visitDate === todayStr);
  const pendingVisitsToday = todayVisits.filter(v => v.status !== 'Completed');
  const upcomingVisits = allVisits.filter(v => v.visitDate > todayStr);
  const completedVisits = allVisits.filter(v => v.status === 'Completed');

  const allTasks = getEmployeeDailyTasks(employeeFilter, 'all');
  const todayTasks = allTasks.filter(t => t.dueDate === todayStr || (!t.completed && (t.dueDate || '') <= todayStr));
  const pendingTasks = allTasks.filter(t => !t.completed);
  const completedTasks = allTasks.filter(t => t.completed);

  const empLeads = localStore.leads.filter(l =>
    matchesEmployee(l.assignedEmployeeId, l.assignedEmployeeName, employeeFilter)
  );
  const activeLeads = empLeads.filter(l => l.stage !== 'Lost' && l.stage !== 'Unqualified');

  // Active Pipeline Value calculated dynamically from lead budgetMax/budgetMin
  const activePipelineValue = activeLeads.reduce((sum, l) => {
    const val = Number(l.budgetMax || l.budgetMin || 0);
    return sum + (val > 0 ? val : 0);
  }, 0);

  const empBookings = getEmployeeBookings(employeeFilter);
  const salesVolume = empBookings.reduce((sum, b) => sum + (b.agreedPrice || 0), 0);

  const pendingCallsToday = dueTodayFollowups.length;
  const pendingVisitsTodayCount = pendingVisitsToday.length;
  const pendingTasksTodayCount = todayTasks.filter(t => !t.completed).length;

  const totalActionItemsToday = pendingCallsToday + pendingVisitsTodayCount + pendingTasksTodayCount;
  const completedActionItemsToday =
    completedFollowups.filter(f => f.scheduledDate === todayStr).length +
    todayVisits.filter(v => v.status === 'Completed').length +
    todayTasks.filter(t => t.completed).length;

  const totalTodayScheduled = todayTasks.length + todayVisits.length + dueTodayFollowups.length;
  const completionPercentage =
    totalTodayScheduled > 0 ? Math.round((completedActionItemsToday / totalTodayScheduled) * 100) : 100;

  return {
    employeeId: employeeFilter || 'ALL',
    todayStr,
    activeLeadsCount: activeLeads.length,
    totalLeadsCount: empLeads.length,
    activePipelineValue,
    dueTodayFollowupsCount: dueTodayFollowups.length,
    overdueFollowupsCount: overdueFollowups.length,
    completedFollowupsCount: completedFollowups.length,
    totalFollowupsCount: allFollowups.length,
    siteVisitsTodayCount: todayVisits.length,
    siteVisitsPendingTodayCount: pendingVisitsTodayCount,
    siteVisitsUpcomingCount: upcomingVisits.length,
    siteVisitsCompletedCount: completedVisits.length,
    siteVisitsTotalCount: allVisits.length,
    tasksTodayCount: todayTasks.length,
    tasksPendingCount: pendingTasks.length,
    tasksCompletedCount: completedTasks.length,
    totalTasksCount: allTasks.length,
    totalBookingsCount: empBookings.length,
    salesVolume,
    pendingCallsToday,
    pendingVisitsToday: pendingVisitsTodayCount,
    pendingTasksToday: pendingTasksTodayCount,
    totalActionItemsToday,
    completedActionItemsToday,
    completionPercentage
  };
}

/**
 * Returns company-wide aggregated metrics.
 */
export function getCompanyMetrics(): EmployeePerformanceMetrics {
  return getEmployeePerformanceMetrics('ALL');
}
