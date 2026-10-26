import React, { useState, useEffect } from 'react';
import { Lead, LeadStage, LeadSubStatus, LeadPriority, LEAD_SUB_STATUS_OPTIONS } from '../types/crm';
import { useAuth } from '../context/AuthContext';
import { exportLeadsToCSV, importLeadsFromCSV, bulkAssignLeads, bulkUpdateLeadStatus, updateLead, localStore } from '../services/crmService';
import {
  Search,
  Filter,
  Download,
  Upload,
  UserCheck,
  CheckSquare,
  Columns,
  Table as TableIcon,
  Phone,
  MessageSquare,
  ChevronRight,
  ChevronLeft,
  ChevronsRight,
  ChevronsLeft,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreVertical,
  Plus,
  Building,
  Flame,
  TrendingUp,
  ArrowRight
} from 'lucide-react';

import { LeadSourceBadge } from './LeadSourceBadge';
import { matchesEmployee } from '../utils/crmMetrics';
import RecordSiteVisitModal from './RecordSiteVisitModal';

interface LeadTableProps {
  onSelectLead: (lead: Lead) => void;
  onOpenNewLeadModal: () => void;
  initialStageFilter?: string;
  onResetStageFilter?: () => void;
}

const stageConfig: Record<LeadStage, {
  label: string;
  dotColor: string;
  badgeBg: string;
}> = {
  'New lead': {
    label: 'New lead',
    dotColor: 'bg-blue-500',
    badgeBg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800/80',
  },
  'Ringing': {
    label: 'Ringing',
    dotColor: 'bg-amber-500',
    badgeBg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/80',
  },
  'Whatsapp': {
    label: 'Whatsapp',
    dotColor: 'bg-emerald-500',
    badgeBg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80',
  },
  'Opportunity': {
    label: 'Opportunity',
    dotColor: 'bg-indigo-500',
    badgeBg: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/80',
  },
  'Site Visit': {
    label: 'Site Visit',
    dotColor: 'bg-purple-500',
    badgeBg: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800/80',
  },
  'Visit done': {
    label: 'Site Visit',
    dotColor: 'bg-purple-500',
    badgeBg: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800/80',
  },
  'Revisit': {
    label: 'Revisit',
    dotColor: 'bg-teal-500',
    badgeBg: 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-800/80',
  },
  'Unqualified': {
    label: 'Unqualified',
    dotColor: 'bg-neutral-500',
    badgeBg: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700',
  },
  'Lost': {
    label: 'Lost',
    dotColor: 'bg-rose-500',
    badgeBg: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200 dark:border-rose-800/80',
  },
};

const getStageValue = (stageLeads: Lead[]) => {
  const total = stageLeads.reduce((acc, l) => {
    const b = Number(l.budgetMax || l.budgetMin || 0);
    return acc + (b > 0 ? b : 0);
  }, 0);
  if (total >= 10000000) {
    return `₹${(total / 10000000).toFixed(2)} Cr`;
  }
  return `₹${(total / 100000).toFixed(0)}L`;
};

const getInitials = (name: string) => {
  return (name || '')
    .split(' ')
    .map(p => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'L';
};

export const LeadTable: React.FC<LeadTableProps> = ({
  onSelectLead,
  onOpenNewLeadModal,
  initialStageFilter = 'ALL',
  onResetStageFilter
}) => {
  const {
    currentUser,
    selectedEmployeeFilter,
    setEmployeeFilter: setGlobalEmployeeFilter,
    usersList,
    isOwner,
    isTeamLeader,
    isEmployee,
    teamMemberUids,
    canBulkExportLeads
  } = useAuth();
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>(initialStageFilter);
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [projectFilter, setProjectFilter] = useState<string>('ALL');
  const [employeeFilter, setEmployeeFilter] = useState<string>(selectedEmployeeFilter || 'ALL');

  // Sorting state: 'name', 'date', 'stage', 'nextFollowup'
  type SortField = 'name' | 'date' | 'stage' | 'nextFollowup' | null;
  type SortDirection = 'asc' | 'desc';
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Pagination state (25 / 50 per page)
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [, setTick] = useState(0);

  useEffect(() => {
    return localStore.subscribe(() => setTick(t => t + 1));
  }, []);

  // Synchronize if selectedEmployeeFilter changes from Header 'Viewing' dropdown
  React.useEffect(() => {
    setEmployeeFilter(selectedEmployeeFilter || 'ALL');
  }, [selectedEmployeeFilter]);

  // Synchronize if initialStageFilter changes from navigation
  React.useEffect(() => {
    if (initialStageFilter) {
      setStageFilter(initialStageFilter);
    }
  }, [initialStageFilter]);

  // Bulk selection
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [bulkEmpId, setBulkEmpId] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [importStatus, setImportStatus] = useState('');

  // Drag and drop state for Kanban columns
  const [draggingLeadId, setDraggingLeadId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  const actor = { id: currentUser.uid, name: currentUser.displayName, role: currentUser.role };

  // Site Visit recording modal state
  const [siteVisitModalLead, setSiteVisitModalLead] = useState<Lead | null>(null);

  const handlePriorityChange = async (leadId: string, newPriority: LeadPriority) => {
    await updateLead(leadId, { priority: newPriority }, actor);
  };

  const handleStageChange = async (leadId: string, newStage: LeadStage) => {
    if (newStage === 'Site Visit' || newStage === 'Visit done') {
      const targetLead = localStore.leads.find(l => l.id === leadId);
      if (targetLead) {
        setSiteVisitModalLead(targetLead);
        return;
      }
    }
    const defaultSub = LEAD_SUB_STATUS_OPTIONS[newStage]?.[0] || 'Not Contacted';
    await updateLead(leadId, { stage: newStage, subStatus: defaultSub }, actor);
  };

  const handleSubStatusChange = async (leadId: string, newSubStatus: LeadSubStatus) => {
    await updateLead(leadId, { subStatus: newSubStatus }, actor);
  };

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('text/plain', leadId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingLeadId(leadId);
  };

  const handleDragEnd = () => {
    setDraggingLeadId(null);
    setDragOverStage(null);
  };

  const handleDragOverColumn = (e: React.DragEvent, stage: LeadStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStage !== stage) {
      setDragOverStage(stage);
    }
  };

  const handleDragLeaveColumn = (e: React.DragEvent, stage: LeadStage) => {
    // Only clear if leaving the column itself
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    if (dragOverStage === stage) {
      setDragOverStage(null);
    }
  };

  const handleDropOnColumn = async (e: React.DragEvent, stage: LeadStage) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain') || draggingLeadId;
    setDragOverStage(null);
    setDraggingLeadId(null);
    if (leadId) {
      await handleStageChange(leadId, stage);
    }
  };

  // Role-based Leads Scoping:
  // Owner: sees all leads across the company
  // Team Leader (Heena): sees ONLY her team's leads
  // Employee: sees ONLY their own assigned leads
  let baseLeads = localStore.leads;
  if (isTeamLeader) {
    baseLeads = baseLeads.filter(l => {
      const assignedId = (l as any).assigned_to || l.assignedEmployeeId;
      return Boolean(assignedId && teamMemberUids.includes(assignedId)) || assignedId === currentUser.uid || !assignedId || assignedId === '';
    });
  } else if (isEmployee) {
    baseLeads = baseLeads.filter(l => {
      const assignedId = (l as any).assigned_to || l.assignedEmployeeId;
      return matchesEmployee(assignedId, l.assignedEmployeeName, currentUser.uid);
    });
  }

  let leads = baseLeads;

  // Filter leads by 'Viewing' dropdown / assigned_to
  const activeEmpFilter = employeeFilter || selectedEmployeeFilter || 'ALL';
  if (activeEmpFilter !== 'ALL') {
    leads = leads.filter(l => {
      const assignedTo = (l as any).assigned_to || (l as any).assignedTo || l.assignedEmployeeId;
      return matchesEmployee(assignedTo, l.assignedEmployeeName, activeEmpFilter);
    });
  }

  if (searchQuery && typeof searchQuery === 'string' && searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    const cleanDigits = q.replace(/\D/g, '');
    leads = leads.filter(l => {
      if (!l || typeof l !== 'object') return false;
      const name = String(l.customerName || (l as any).name || (l as any).full_name || '').toLowerCase();
      const phoneRaw = String(l.phone || (l as any).phone_number || '');
      const phoneDigits = phoneRaw.replace(/\D/g, '');
      const id = String(l.id || '').toLowerCase();
      const project = String(l.projectName || '').toLowerCase();
      const email = String(l.email || '').toLowerCase();
      const city = String(l.city || '').toLowerCase();
      const assigned = String(l.assignedEmployeeName || '').toLowerCase();

      return (
        name.includes(q) ||
        phoneRaw.toLowerCase().includes(q) ||
        (cleanDigits.length > 0 && phoneDigits.includes(cleanDigits)) ||
        id.includes(q) ||
        project.includes(q) ||
        email.includes(q) ||
        city.includes(q) ||
        assigned.includes(q)
      );
    });
  }

  if (stageFilter !== 'ALL') {
    if (stageFilter === 'Site Visit' || stageFilter === 'Visit done') {
      leads = leads.filter(l => l && (l.stage === 'Site Visit' || l.stage === 'Visit done'));
    } else {
      leads = leads.filter(l => l && l.stage === stageFilter);
    }
  }

  if (priorityFilter !== 'ALL') {
    leads = leads.filter(l => l && l.priority === priorityFilter);
  }

  if (sourceFilter !== 'ALL') {
    leads = leads.filter(l => l && l.source === sourceFilter);
  }

  if (projectFilter !== 'ALL') {
    leads = leads.filter(l => l && l.projectName === projectFilter);
  }

  // Reset pagination to page 1 whenever any search or filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, stageFilter, priorityFilter, sourceFilter, projectFilter, employeeFilter, activeEmpFilter, pageSize]);

  // Sort leads according to active sortField and sortDirection
  const sortedLeads = React.useMemo(() => {
    if (!sortField) return leads;
    return [...leads].sort((a, b) => {
      if (!a || !b) return 0;
      let comparison = 0;
      if (sortField === 'name') {
        comparison = String(a.customerName || '').localeCompare(String(b.customerName || ''), undefined, { sensitivity: 'base' });
      } else if (sortField === 'date') {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        comparison = (isNaN(dateA) ? 0 : dateA) - (isNaN(dateB) ? 0 : dateB);
      } else if (sortField === 'stage') {
        comparison = String(a.stage || '').localeCompare(String(b.stage || ''), undefined, { sensitivity: 'base' });
      } else if (sortField === 'nextFollowup') {
        const dateA = a.nextFollowupDate ? new Date(a.nextFollowupDate).getTime() : 0;
        const dateB = b.nextFollowupDate ? new Date(b.nextFollowupDate).getTime() : 0;
        if (!a.nextFollowupDate && !b.nextFollowupDate) comparison = 0;
        else if (!a.nextFollowupDate) comparison = 1; // Unscheduled placed at bottom
        else if (!b.nextFollowupDate) comparison = -1;
        else comparison = (isNaN(dateA) ? 0 : dateA) - (isNaN(dateB) ? 0 : dateB);
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [leads, sortField, sortDirection]);

  // Pagination calculations
  const totalItems = sortedLeads.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedLeads = sortedLeads.slice(startIndex, endIndex);

  const handleSort = (field: 'name' | 'date' | 'stage' | 'nextFollowup') => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'date' ? 'desc' : 'asc');
    }
    setCurrentPage(1);
  };

  const getPageNumbers = (current: number, total: number): (number | string)[] => {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 4) {
      return [1, 2, 3, 4, 5, '...', total];
    }
    if (current >= total - 3) {
      return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    }
    return [1, '...', current - 1, current, current + 1, '...', total];
  };

  const pageNumbers = getPageNumbers(safeCurrentPage, totalPages);

  const isAllCurrentPageSelected = paginatedLeads.length > 0 && paginatedLeads.every(l => selectedLeadIds.includes(l.id));
  const isSomeCurrentPageSelected = paginatedLeads.some(l => selectedLeadIds.includes(l.id)) && !isAllCurrentPageSelected;

  const handleSelectAllCurrentPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const pageIds = paginatedLeads.map(l => l.id);
      setSelectedLeadIds(Array.from(new Set([...selectedLeadIds, ...pageIds])));
    } else {
      const pageIdSet = new Set(paginatedLeads.map(l => l.id));
      setSelectedLeadIds(selectedLeadIds.filter(id => !pageIdSet.has(id)));
    }
  };

  const handleSelectAllMatching = () => {
    setSelectedLeadIds(sortedLeads.map(l => l.id));
  };

  const renderSortableHeader = (
    label: string,
    field: 'name' | 'date' | 'stage' | 'nextFollowup',
    extraClass?: string
  ) => {
    const isActive = sortField === field;
    return (
      <th
        onClick={() => handleSort(field)}
        className={`p-3.5 select-none cursor-pointer transition-colors group text-xs font-bold uppercase tracking-wider ${
          isActive
            ? 'bg-neutral-200/90 dark:bg-neutral-800 text-neutral-900 dark:text-white'
            : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-white'
        } ${extraClass || ''}`}
        title={`Sort by ${label} (${isActive ? (sortDirection === 'asc' ? 'Ascending • Click for Descending' : 'Descending • Click for Ascending') : 'Click to sort'})`}
      >
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <span>{label}</span>
          <span className="shrink-0">
            {isActive ? (
              sortDirection === 'asc' ? (
                <ArrowUp className="w-4 h-4 text-blue-600 dark:text-blue-400 stroke-[2.5]" />
              ) : (
                <ArrowDown className="w-4 h-4 text-blue-600 dark:text-blue-400 stroke-[2.5]" />
              )
            ) : (
              <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400 opacity-40 group-hover:opacity-100 transition-opacity" />
            )}
          </span>
        </div>
      </th>
    );
  };

  const totalPipelineValue = leads.reduce((acc, l) => {
    const b = Number(l.budgetMax || l.budgetMin || 0);
    return acc + (b > 0 ? b : 0);
  }, 0);
  const formattedTotalValue = totalPipelineValue >= 10000000
    ? `₹${(totalPipelineValue / 10000000).toFixed(2)} Cr`
    : `₹${(totalPipelineValue / 100000).toFixed(0)}L`;
  const hotLeadsCount = leads.filter(l => l.priority === 'Hot').length;

  const handleToggleSelectLead = (id: string) => {
    if (selectedLeadIds.includes(id)) {
      setSelectedLeadIds(selectedLeadIds.filter(i => i !== id));
    } else {
      setSelectedLeadIds([...selectedLeadIds, id]);
    }
  };

  const handleBulkAssignSubmit = async () => {
    if (bulkEmpId && selectedLeadIds.length > 0) {
      const emp = usersList.find(u => u.uid === bulkEmpId);
      if (emp) {
        await bulkAssignLeads(selectedLeadIds, emp.uid, emp.displayName, actor);
        setSelectedLeadIds([]);
        setShowBulkAssignModal(false);
      }
    }
  };

  const handleImportCSVSubmit = async () => {
    if (csvText.trim()) {
      const count = await importLeadsFromCSV(csvText, actor);
      setImportStatus(`Successfully imported ${count} leads!`);
      setTimeout(() => {
        setImportStatus('');
        setShowImportModal(false);
        setCsvText('');
      }, 1500);
    }
  };

  const stagesList: LeadStage[] = [
    'New lead',
    'Ringing',
    'Whatsapp',
    'Opportunity',
    'Site Visit',
    'Revisit',
    'Unqualified',
    'Lost'
  ];

  return (
    <div className="space-y-4 text-sm">
      {/* Header Controls & Filters */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3.5 p-4 glass-ios rounded-2xl transition-all duration-200 text-sm">
        {/* Search Input - High visibility with clear button */}
        <div className="w-full xl:w-80 shrink-0">
          <div className="relative flex items-center w-full">
            <Search className="w-4 h-4 text-neutral-500 dark:text-neutral-400 absolute left-3.5 pointer-events-none shrink-0" />
            <input
              type="text"
              placeholder="Search by name, phone, or Lead ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-white/90 dark:bg-neutral-900/90 border border-neutral-300 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-2xs font-medium transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          {/* Stage Filter */}
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="glass-pill text-neutral-800 dark:text-neutral-200 text-sm rounded-xl px-3 py-2 font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
          >
            <option value="ALL">All Leads</option>
            {stagesList.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="glass-pill text-neutral-800 dark:text-neutral-200 text-sm rounded-xl px-3 py-2 font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
          >
            <option value="ALL">All Priorities</option>
            <option value="Hot">🔥 Hot Priority</option>
            <option value="Warm">⚡ Warm Priority</option>
            <option value="Cold">❄️ Cold Priority</option>
          </select>

          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="glass-pill text-neutral-800 dark:text-neutral-200 text-sm rounded-xl px-3 py-2 font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
          >
            <option value="ALL">All Sources</option>
            <option value="Facebook Ads">Facebook Ads</option>
            <option value="Instagram Ads">Instagram Ads</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Website Form">Website Form</option>
            <option value="Walk-in">Walk-in</option>
            <option value="Referral">Referral</option>
            <option value="Manual Call">Manual Call</option>
          </select>

          {/* Viewing / Assigned-to Employee Filter (Available for Owner / Team Leader) */}
          {(isOwner || isTeamLeader) && (
            <div className="flex items-center gap-1.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm">
              <span className="text-neutral-500 font-medium whitespace-nowrap">Viewing:</span>
              <select
                value={activeEmpFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  setEmployeeFilter(val);
                  setGlobalEmployeeFilter(val);
                }}
                className="bg-transparent text-neutral-800 dark:text-neutral-200 font-semibold focus:outline-none cursor-pointer max-w-[160px] truncate text-sm"
              >
                <option value="ALL">All Employees</option>
                {usersList
                  .filter(u => isOwner || teamMemberUids.includes(u.uid))
                  .map(emp => (
                    <option key={emp.uid} value={emp.uid}>
                      {emp.displayName} {emp.designation ? `(${emp.designation})` : `(${emp.employeeCode || 'REP'})`}
                    </option>
                  ))}
              </select>
              {activeEmpFilter !== 'ALL' && (
                <button
                  onClick={() => {
                    setEmployeeFilter('ALL');
                    setGlobalEmployeeFilter('ALL');
                  }}
                  className="text-sm font-bold text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white underline cursor-pointer ml-1"
                  title="Reset to All Employees"
                >
                  Reset
                </button>
              )}
            </div>
          )}

          {/* View Toggle */}
          <div className="flex items-center glass-pill rounded-xl p-1 text-sm">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                viewMode === 'table'
                  ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
              }`}
            >
              <TableIcon className="w-4 h-4" /> Table
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                viewMode === 'kanban'
                  ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
              }`}
            >
              <Columns className="w-4 h-4" /> Kanban
            </button>
          </div>

          {/* Page size quick selector (visible in Table mode) */}
          {viewMode === 'table' && (
            <div className="flex items-center gap-1.5 glass-pill rounded-xl px-3 py-2 text-sm text-neutral-600 dark:text-neutral-400">
              <span className="font-medium whitespace-nowrap">Show:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-transparent text-neutral-800 dark:text-neutral-200 font-bold focus:outline-none cursor-pointer text-sm"
              >
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
              </select>
            </div>
          )}

          {/* Export Leads: Allowed for Company Owner and Heena; forbidden for regular employees */}
          {canBulkExportLeads && (
            <button
              onClick={() => exportLeadsToCSV(leads, { id: currentUser.uid, name: currentUser.displayName, role: currentUser.role, username: currentUser.username })}
              className="flex items-center gap-1.5 px-3.5 py-2 liquid-glass-btn text-neutral-800 dark:text-neutral-200 rounded-xl text-sm font-semibold cursor-pointer"
              title={isOwner ? "Company Owner CSV Export" : "Authorized Lead Export (Heena)"}
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          )}

          {/* Import CSV - Strictly Company Owner only */}
          {isOwner && (
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 liquid-glass-btn text-neutral-800 dark:text-neutral-200 rounded-xl text-sm font-semibold cursor-pointer"
              title="Company Owner Lead Ingestion"
            >
              <Upload className="w-4 h-4" /> Import CSV
            </button>
          )}
        </div>
      </div>

      {/* Active Filter Banner when filtered by employee */}
      {activeEmpFilter !== 'ALL' && (
        <div className="flex items-center justify-between px-4 py-3 liquid-glass-section rounded-2xl text-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-neutral-700 dark:text-neutral-300 shrink-0" />
            <span className="text-neutral-600 dark:text-neutral-400">
              Filtered by Assigned Employee: <strong className="text-neutral-900 dark:text-white">{usersList.find(u => matchesEmployee(u.uid, u.displayName, activeEmpFilter))?.displayName || activeEmpFilter}</strong> · <span className="font-bold text-neutral-900 dark:text-white">{leads.length} leads</span> found
            </span>
          </div>
          <button
            onClick={() => {
              setEmployeeFilter('ALL');
              setGlobalEmployeeFilter('ALL');
            }}
            className="text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white underline cursor-pointer"
          >
            Show All Leads ({baseLeads.length})
          </button>
        </div>
      )}

      {/* Bulk Action Toolbar */}
      {selectedLeadIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 liquid-glass-section rounded-2xl text-sm animate-fadeIn shadow-lg">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-sm text-neutral-900 dark:text-white">{selectedLeadIds.length} lead(s) selected</span>
            {isAllCurrentPageSelected && totalItems > paginatedLeads.length && selectedLeadIds.length < totalItems && (
              <button
                onClick={handleSelectAllMatching}
                className="underline hover:opacity-80 font-bold ml-1.5 text-blue-600 dark:text-blue-400 cursor-pointer text-sm"
              >
                Select all {totalItems} leads matching current filters
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {(isOwner || isTeamLeader) && (
              <button
                onClick={() => setShowBulkAssignModal(true)}
                className="px-3.5 py-2 liquid-glass-primary font-bold rounded-xl cursor-pointer text-sm"
              >
                Bulk Assign Owner
              </button>
            )}
            <button
              onClick={() => setSelectedLeadIds([])}
              className="px-3.5 py-2 liquid-glass-btn text-neutral-800 dark:text-neutral-200 rounded-xl font-medium cursor-pointer text-sm"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Active Stage Filter Banner */}
      {stageFilter !== 'ALL' && (
        <div className="flex items-center justify-between p-3.5 px-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl text-sm text-blue-900 dark:text-blue-200 shadow-2xs animate-fadeIn">
          <div className="flex items-center gap-2 flex-wrap text-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="font-semibold text-neutral-600 dark:text-neutral-400">Filtering only:</span>
            <span className="font-bold px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 border border-blue-300 dark:border-blue-700 text-sm">
              {stageFilter}
            </span>
            <span className="font-mono text-neutral-500 dark:text-neutral-400 text-sm">
              ({leads.length} {leads.length === 1 ? 'lead' : 'leads'} found in this stage)
            </span>
          </div>
          <button
            onClick={() => {
              setStageFilter('ALL');
              if (onResetStageFilter) onResetStageFilter();
            }}
            className="text-sm font-bold text-blue-700 hover:text-blue-900 dark:text-blue-300 dark:hover:text-white underline cursor-pointer"
          >
            ✕ Show All Leads
          </button>
        </div>
      )}

      {/* TABLE VIEW */}
      {viewMode === 'table' ? (
        <div className="glass-ios rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="glass-header-row text-neutral-700 dark:text-neutral-300 font-bold uppercase tracking-wider text-sm sticky top-0 z-10">
                <tr>
                  <th className="p-3.5 w-10">
                    <input
                      type="checkbox"
                      checked={isAllCurrentPageSelected}
                      ref={(input) => {
                        if (input) input.indeterminate = isSomeCurrentPageSelected;
                      }}
                      onChange={handleSelectAllCurrentPage}
                      className="w-4 h-4 rounded bg-white border-neutral-300 dark:border-neutral-700 cursor-pointer"
                      title="Select all leads on current page"
                    />
                  </th>
                  {renderSortableHeader('Customer & Phone', 'name', 'whitespace-nowrap')}
                  {renderSortableHeader('Date Created', 'date', 'whitespace-nowrap')}
                  <th className="p-3.5 text-xs font-bold uppercase tracking-wider whitespace-nowrap text-neutral-600 dark:text-neutral-400">
                    Project & Budget
                  </th>
                  <th className="p-3.5 text-xs font-bold uppercase tracking-wider whitespace-nowrap text-neutral-600 dark:text-neutral-400">
                    Source
                  </th>
                  {renderSortableHeader('Stage & Sub-Status', 'stage', 'whitespace-nowrap')}
                  <th className="p-3.5 text-xs font-bold uppercase tracking-wider whitespace-nowrap text-neutral-600 dark:text-neutral-400">
                    Priority
                  </th>
                  <th className="p-3.5 text-xs font-bold uppercase tracking-wider whitespace-nowrap text-neutral-600 dark:text-neutral-400">
                    Assigned Owner
                  </th>
                  {renderSortableHeader('Next Follow-up', 'nextFollowup', 'whitespace-nowrap')}
                  <th className="p-3.5 text-right text-xs font-bold uppercase tracking-wider whitespace-nowrap text-neutral-600 dark:text-neutral-400">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-neutral-800 dark:text-neutral-200 text-sm">
                {paginatedLeads.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-neutral-400 dark:text-neutral-500 text-sm">
                      No leads match your active search filters.
                    </td>
                  </tr>
                ) : (
                  paginatedLeads.map(lead => (
                    <tr
                      key={lead.id}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors group cursor-pointer"
                      onClick={() => onSelectLead(lead)}
                    >
                      <td className="p-3.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedLeadIds.includes(lead.id)}
                          onChange={() => handleToggleSelectLead(lead.id)}
                          className="w-4 h-4 rounded bg-white border-neutral-300 dark:border-neutral-700 cursor-pointer"
                        />
                      </td>
                      <td className="p-3.5 font-medium">
                        <div className="font-bold text-neutral-900 dark:text-white text-base">
                          {lead.customerName}
                        </div>
                        <div className="font-mono text-neutral-500 dark:text-neutral-400 text-sm mt-0.5">{lead.phone}</div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-semibold text-neutral-900 dark:text-white text-sm">
                          {lead.createdAt
                            ? new Date(lead.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                            : '—'}
                        </div>
                        <div className="text-sm font-mono text-neutral-500 dark:text-neutral-400 mt-0.5">
                          {lead.createdAt
                            ? new Date(lead.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                            : ''}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-neutral-900 dark:text-white text-sm">{lead.projectName || 'Jeevika Heights'}</div>
                        <div className="text-neutral-500 dark:text-neutral-400 text-sm font-mono mt-0.5">
                          {lead.propertyType || '2 BHK'} · {Number(lead.budgetMax || lead.budgetMin || 0) > 0 ? (
                            <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                              ₹{((Number(lead.budgetMax || lead.budgetMin || 0)) / 100000).toFixed(1)}L
                            </span>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400 text-xs font-sans font-medium">Budget Not Set</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <LeadSourceBadge source={lead.source} size="md" />
                      </td>
                      <td className="p-3.5" onClick={(e) => e.stopPropagation()}>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${stageConfig[lead.stage]?.dotColor || 'bg-neutral-400'}`} />
                            <select
                              value={lead.stage === 'Visit done' ? 'Site Visit' : lead.stage}
                              onChange={(e) => handleStageChange(lead.id, e.target.value as LeadStage)}
                              className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-lg px-2.5 py-1.5 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white cursor-pointer shadow-2xs hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors w-full max-w-[155px]"
                              title="Click to change lead stage"
                            >
                              {stagesList.map((stg) => (
                                <option key={stg} value={stg}>{stg}</option>
                              ))}
                            </select>
                          </div>
                          {lead.subStatus && (
                            <div className="pl-4 text-xs text-neutral-500 dark:text-neutral-400 font-medium truncate max-w-[150px]" title={lead.subStatus}>
                              {lead.subStatus}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs whitespace-nowrap shrink-0 ${
                          lead.priority === 'Hot'
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                            : lead.priority === 'Warm'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                            : 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800'
                        }`}>
                          <span className="shrink-0">{lead.priority === 'Hot' ? '🔥' : lead.priority === 'Warm' ? '⚡' : '❄️'}</span>
                          <span className="whitespace-nowrap">{lead.priority}</span>
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="font-medium text-neutral-800 dark:text-neutral-200 text-sm">
                          {lead.assignedEmployeeName || <span className="font-bold opacity-75">Unassigned</span>}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-neutral-600 dark:text-neutral-400 whitespace-nowrap text-sm">
                        {lead.nextFollowupDate || 'None Scheduled'}
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <a
                            href={`tel:${lead.phone}`}
                            className="p-1.5 rounded-xl liquid-glass-btn text-neutral-800 dark:text-neutral-200"
                            title={`Call ${lead.customerName}`}
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${lead.customerName}, thank you for inquiring about Choudhary Estate Palghar!`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-xl liquid-glass-btn text-emerald-600 dark:text-emerald-400 border-emerald-300/40"
                            title={`WhatsApp ${lead.customerName}`}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => onSelectLead(lead)}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold liquid-glass-btn text-neutral-900 dark:text-white cursor-pointer"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 px-5 bg-white dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 text-sm">
            <div className="flex flex-wrap items-center gap-3 text-neutral-600 dark:text-neutral-400 text-sm">
              <span>
                Showing <strong className="text-neutral-900 dark:text-white font-mono text-sm">{totalItems === 0 ? 0 : startIndex + 1}</strong> to <strong className="text-neutral-900 dark:text-white font-mono text-sm">{endIndex}</strong> of <strong className="text-neutral-900 dark:text-white font-mono text-sm">{totalItems}</strong> leads
              </span>
              {sortField && (
                <span className="inline-flex items-center gap-1.5 text-sm px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                  Sorted by <strong className="text-neutral-900 dark:text-white font-semibold">{sortField === 'name' ? 'Name' : sortField === 'date' ? 'Date Created' : sortField === 'stage' ? 'Stage' : 'Next Follow-up'}</strong> ({sortDirection === 'asc' ? 'Ascending' : 'Descending'})
                  <button
                    onClick={() => {
                      setSortField(null);
                      setCurrentPage(1);
                    }}
                    className="text-neutral-400 hover:text-rose-500 font-bold ml-1 cursor-pointer text-sm"
                    title="Reset to default sorting"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm">
              {/* Page size dropdown */}
              <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400 text-sm">
                <span className="text-sm font-medium">Show:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white rounded-lg px-2.5 py-1.5 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white cursor-pointer"
                >
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                  <option value={100}>100 / page</option>
                </select>
              </div>

              {/* Page Navigation */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={safeCurrentPage <= 1}
                  className="p-2 rounded-xl liquid-glass-btn text-neutral-700 dark:text-neutral-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  title="First Page"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={safeCurrentPage <= 1}
                  className="p-2 rounded-xl liquid-glass-btn text-neutral-700 dark:text-neutral-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-1 px-1">
                  {pageNumbers.map((p, idx) =>
                    typeof p === 'number' ? (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`min-w-[34px] h-9 px-2.5 rounded-xl text-sm font-bold cursor-pointer ${
                          safeCurrentPage === p
                            ? 'liquid-glass-primary shadow-xs'
                            : 'liquid-glass-btn text-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        {p}
                      </button>
                    ) : (
                      <span key={`ellipsis-${idx}`} className="px-1 text-neutral-400 select-none text-sm">
                        …
                      </span>
                    )
                  )}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={safeCurrentPage >= totalPages}
                  className="p-2 rounded-xl liquid-glass-btn text-neutral-700 dark:text-neutral-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={safeCurrentPage >= totalPages}
                  className="p-2 rounded-xl liquid-glass-btn text-neutral-700 dark:text-neutral-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  title="Last Page"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* KANBAN BOARD VIEW */
        <div className="space-y-3.5">
          {/* Pipeline Summary Bar with iOS Frosted Glass */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 glass-ios rounded-2xl text-sm shadow-xs">
            <div className="flex flex-wrap items-center gap-4 text-neutral-600 dark:text-neutral-400">
              <span className="flex items-center gap-2 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                Active Pipeline: <strong className="text-neutral-900 dark:text-white font-mono text-base">{leads.length} Leads</strong>
              </span>
              <span className="hidden sm:inline text-neutral-300 dark:text-neutral-700">|</span>
              <span className="flex items-center gap-1.5 font-medium">
                Pipeline Value: <strong className="text-neutral-900 dark:text-white font-mono text-base">{formattedTotalValue}</strong>
              </span>
              <span className="hidden sm:inline text-neutral-300 dark:text-neutral-700">|</span>
              <span className="flex items-center gap-1.5 font-medium">
                <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500/30" />
                Hot Deals: <strong className="text-rose-600 dark:text-rose-400 font-mono text-base">{hotLeadsCount}</strong>
              </span>
            </div>
            <div className="text-sm text-neutral-400 dark:text-neutral-500 font-medium">
              Click any card to open 360° Lead View
            </div>
          </div>

          {/* Kanban Columns (Horizontal Flex Scroll - Fixes overlapping grid) */}
          <div className="flex gap-4 overflow-x-auto pb-4 pt-1 items-start scrollbar-thin">
            {(stageFilter === 'ALL' ? stagesList : stagesList.filter(s => s === stageFilter)).map(stg => {
              const stageLeads = leads.filter(l =>
                stg === 'Site Visit'
                  ? (l.stage === 'Site Visit' || l.stage === 'Visit done')
                  : l.stage === stg
              );
              const conf = stageConfig[stg] || {
                label: stg,
                dotColor: 'bg-neutral-500',
                badgeBg: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
              };
              const totalVal = getStageValue(stageLeads);
              const isOver = dragOverStage === stg;

              return (
                <div
                  key={stg}
                  onDragOver={(e) => handleDragOverColumn(e, stg)}
                  onDragLeave={(e) => handleDragLeaveColumn(e, stg)}
                  onDrop={(e) => handleDropOnColumn(e, stg)}
                  className={`w-[305px] shrink-0 rounded-2xl flex flex-col max-h-[calc(100vh-230px)] shadow-2xs transition-all duration-150 ${
                    isOver
                      ? 'bg-blue-50/70 dark:bg-blue-950/40 border-2 border-blue-500 ring-4 ring-blue-500/10 scale-[1.01]'
                      : 'bg-neutral-100/70 dark:bg-neutral-950 border border-neutral-200/90 dark:border-neutral-800'
                  }`}
                >
                  {/* Column Header */}
                  <div className={`p-3.5 border-b rounded-t-2xl flex items-center justify-between transition-colors ${
                    isOver
                      ? 'border-blue-300 dark:border-blue-800 bg-blue-100/60 dark:bg-blue-900/40'
                      : 'border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900'
                  }`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${conf.dotColor}`} />
                      <h4 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider truncate">
                        {stg}
                      </h4>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold border shrink-0 ${conf.badgeBg}`}>
                        {stageLeads.length}
                      </span>
                    </div>
                    <span className="text-sm font-mono font-bold text-neutral-600 dark:text-neutral-400 shrink-0">
                      {totalVal}
                    </span>
                  </div>

                  {/* Cards List */}
                  <div className="p-3 space-y-2.5 overflow-y-auto flex-1 min-h-[160px]">
                    {stageLeads.length === 0 ? (
                      <div className={`h-36 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center p-3 transition-colors ${
                        isOver
                          ? 'border-blue-400 bg-blue-50/50 text-blue-600 dark:border-blue-700 dark:bg-blue-950/30 dark:text-blue-300'
                          : 'border-neutral-200 dark:border-neutral-800 text-neutral-400 dark:text-neutral-500'
                      }`}>
                        <span className="text-sm font-semibold">{isOver ? 'Drop lead here' : `No leads in ${stg}`}</span>
                        <span className="text-xs opacity-80 mt-0.5">{isOver ? `Move to ${stg}` : 'Stage is currently clear'}</span>
                      </div>
                    ) : (
                      stageLeads.map(l => (
                        <div
                          key={l.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, l.id)}
                          onDragEnd={handleDragEnd}
                          onClick={() => onSelectLead(l)}
                          className={`group liquid-glass-section rounded-2xl p-3.5 space-y-2.5 cursor-grab active:cursor-grabbing hover:shadow-lg transition-all duration-200 ${
                            draggingLeadId === l.id
                              ? 'opacity-40 border-dashed border-blue-400 dark:border-blue-600 scale-[0.98]'
                              : 'hover:scale-[1.01]'
                          }`}
                        >
                          {/* Card Top: Customer Avatar Initial, Name, Priority */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-8 h-8 rounded-full liquid-glass-btn flex items-center justify-center font-bold text-xs text-neutral-800 dark:text-neutral-200 shrink-0">
                                {getInitials(l.customerName)}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-sm text-neutral-900 dark:text-white truncate group-hover:underline">
                                  {l.customerName}
                                </h4>
                                <p className="text-sm font-mono text-neutral-500 dark:text-neutral-400 truncate">
                                  {l.phone}
                                </p>
                              </div>
                            </div>

                            {/* Interactive Priority Badge */}
                            <div onClick={(e) => e.stopPropagation()}>
                              <select
                                value={l.priority}
                                onChange={(e) => handlePriorityChange(l.id, e.target.value as LeadPriority)}
                                className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none transition-all shadow-xs ${
                                  l.priority === 'Hot'
                                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200 dark:border-rose-800 hover:bg-rose-100'
                                    : l.priority === 'Warm'
                                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-800 hover:bg-amber-100'
                                    : 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800 hover:bg-sky-100'
                                }`}
                                title="Click to change lead priority"
                              >
                                <option value="Hot">🔥 Hot</option>
                                <option value="Warm">⚡ Warm</option>
                                <option value="Cold">❄️ Cold</option>
                              </select>
                            </div>
                          </div>

                          {/* Project & Budget Box */}
                          <div className="liquid-glass-btn p-3 rounded-xl space-y-1 text-sm">
                            <div className="flex items-center gap-1.5 text-neutral-900 dark:text-white font-semibold text-sm truncate">
                              <Building className="w-4 h-4 text-neutral-400 shrink-0" />
                              <span className="truncate">{l.projectName || 'Jeevika Heights'}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm font-mono text-neutral-500 dark:text-neutral-400">
                              <span>{l.propertyType || '2 BHK'}</span>
                              <span className="font-bold text-neutral-800 dark:text-neutral-200">
                                {Number(l.budgetMax || l.budgetMin || 0) > 0 ? (
                                  `₹${((Number(l.budgetMax || l.budgetMin || 0)) / 100000).toFixed(1)}L`
                                ) : (
                                  <span className="text-[11px] font-sans font-medium text-amber-600 dark:text-amber-400">Not Set</span>
                                )}
                              </span>
                            </div>
                          </div>

                          {/* Interactive Stage & Substatus selectors */}
                          <div className="space-y-1.5 pt-0.5" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between text-sm gap-1.5">
                              <span className="text-neutral-500 dark:text-neutral-400 font-medium shrink-0">Stage:</span>
                              <select
                                value={l.stage === 'Visit done' ? 'Site Visit' : l.stage}
                                onChange={(e) => handleStageChange(l.id, e.target.value as LeadStage)}
                                className="bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 text-sm font-bold rounded px-2 py-1 cursor-pointer focus:outline-none max-w-[170px] truncate"
                                title="Move to stage"
                              >
                                {stagesList.map((stg) => (
                                  <option key={stg} value={stg}>{stg}</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex items-center justify-between text-sm gap-1.5">
                              <span className="text-neutral-500 dark:text-neutral-400 font-medium shrink-0">Status:</span>
                              <select
                                value={l.subStatus}
                                onChange={(e) => handleSubStatusChange(l.id, e.target.value as LeadSubStatus)}
                                className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700 text-sm font-medium rounded px-2 py-1 cursor-pointer focus:outline-none max-w-[170px] truncate"
                                title="Change sub-status"
                              >
                                {(LEAD_SUB_STATUS_OPTIONS[l.stage] || [l.subStatus]).map((sub) => (
                                  <option key={sub} value={sub}>{sub}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Card Footer: Source Badge & Assigned Owner */}
                          <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-1 text-sm">
                            <LeadSourceBadge source={l.source} size="sm" />
                            <span className="flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-400 font-medium truncate">
                              <UserCheck className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{l.assignedEmployeeName || 'Unassigned'}</span>
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bulk Assign Modal */}
      {showBulkAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 text-neutral-900 dark:text-white space-y-3 shadow-2xl text-sm">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">Bulk Reassign {selectedLeadIds.length} Leads</h3>
            <select
              value={bulkEmpId}
              onChange={(e) => setBulkEmpId(e.target.value)}
              className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2.5 text-sm text-neutral-900 dark:text-white"
            >
              <option value="">Select Target Employee or Team Leader...</option>
              {usersList.filter(u => u.role === 'employee' || u.role === 'team_leader').map(emp => (
                <option key={emp.uid} value={emp.uid}>{emp.displayName} ({emp.designation || emp.employeeCode})</option>
              ))}
            </select>
            <div className="flex justify-end gap-2 pt-2 text-sm">
              <button onClick={() => setShowBulkAssignModal(false)} className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 rounded-lg text-sm text-neutral-700 dark:text-neutral-300 font-medium cursor-pointer">Cancel</button>
              <button onClick={handleBulkAssignSubmit} disabled={!bulkEmpId} className="px-4 py-2 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black rounded-lg text-sm font-bold disabled:opacity-50 cursor-pointer">Confirm Bulk Assign</button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 text-neutral-900 dark:text-white space-y-3 shadow-2xl">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">Import Leads from CSV</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Paste CSV data format: Customer Name, Phone, Email, Project Name, Source</p>
            {importStatus && <p className="text-sm font-bold text-neutral-900 dark:text-white">{importStatus}</p>}
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              rows={6}
              className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded p-2.5 text-sm font-mono text-neutral-900 dark:text-white"
              placeholder={`Customer Name,Phone,Email,Project Name,Source
Rajesh Patil,+91 98220 12345,rajesh@gmail.com,Jeevika Heights,Facebook Ads
Sanjay Kulkarni,+91 98220 54321,sanjay@gmail.com,Fia Woods,Website Form`}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowImportModal(false)} className="px-3.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 rounded text-sm text-neutral-700 dark:text-neutral-300 font-medium cursor-pointer">Cancel</button>
              <button onClick={handleImportCSVSubmit} className="px-3.5 py-1.5 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black rounded text-sm font-bold cursor-pointer">Import CSV Leads</button>
            </div>
          </div>
        </div>
      )}

      {/* Record Site Visit Modal */}
      {siteVisitModalLead && (
        <RecordSiteVisitModal
          lead={siteVisitModalLead}
          onClose={() => setSiteVisitModalLead(null)}
          onSuccess={() => {
            setSiteVisitModalLead(null);
          }}
        />
      )}
    </div>
  );
};

export default LeadTable;
