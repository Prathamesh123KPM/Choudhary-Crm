import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lead, Followup, SiteVisit, DailyTask } from '../types/crm';
import {
  localStore,
  toggleDailyTask,
  deleteDailyTask,
  addDailyTask,
  completeFollowup,
  scheduleFollowup
} from '../services/crmService';
import {
  getTodayIST,
  getEmployeeFollowups,
  getEmployeeSiteVisits,
  getEmployeeDailyTasks,
  getEmployeePerformanceMetrics,
  matchesEmployee
} from '../utils/crmMetrics';
import {
  CalendarCheck2,
  PhoneCall,
  MapPin,
  Clock,
  CheckCircle2,
  Plus,
  Phone,
  MessageSquare,
  Sparkles,
  User,
  Filter,
  CheckSquare,
  Square,
  Trash2,
  Car,
  Home,
  FileText,
  AlertCircle,
  Building,
  Users,
  ChevronRight,
  TrendingUp,
  Search,
  ExternalLink
} from 'lucide-react';
import { LeadSourceBadge } from './LeadSourceBadge';

interface TodaysWorkModuleProps {
  onSelectLead: (lead: Lead) => void;
  onSelectTab: (tab: string) => void;
}

export const TodaysWorkModule: React.FC<TodaysWorkModuleProps> = ({
  onSelectLead,
  onSelectTab
}) => {
  const { currentUser, isAdmin, isOwner, isTeamLeader, teamMemberUids, usersList } = useAuth();
  const todayStr = getTodayIST();

  // Default to 'ALL' for Owner and Team Leader so they immediately see the company/team agenda,
  // or currentUser.uid for individual employees
  const [selectedStaffUid, setSelectedStaffUid] = useState<string>(
    (isOwner || isTeamLeader) ? 'ALL' : currentUser.uid
  );
  const [activeTab, setActiveTab] = useState<'all' | 'calls' | 'visits' | 'fresh' | 'checklist' | 'team'>('all');
  const [checklistFilter, setChecklistFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Modals state
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState(currentUser.uid);
  const [newTaskDueTime, setNewTaskDueTime] = useState('11:00 AM');
  const [newTaskPriority, setNewTaskPriority] = useState<DailyTask['priority']>('High');
  const [newTaskCategory, setNewTaskCategory] = useState<DailyTask['category']>('Call / Follow-up');

  // Complete followup modal
  const [completingFollowup, setCompletingFollowup] = useState<Followup | null>(null);
  const [followupOutcome, setFollowupOutcome] = useState('');

  // Target employee whose daily work is being viewed
  const isViewingAll = selectedStaffUid === 'ALL';
  const viewingUser = isViewingAll ? null : (usersList.find(u => u.uid === selectedStaffUid) || currentUser);
  const isViewingSelf = !isViewingAll && viewingUser?.uid === currentUser.uid;

  // Effective staff filter for metrics
  const staffTarget = isViewingAll ? (isOwner ? 'ALL' : (isTeamLeader ? 'ALL' : currentUser.uid)) : selectedStaffUid;
  const staffMetrics = getEmployeePerformanceMetrics(staffTarget);

  // Filter today's items
  const matchesStaff = (empId?: string) => {
    if (isViewingAll) {
      if (isOwner) return true;
      if (isTeamLeader) return empId ? teamMemberUids.includes(empId) : true;
      return empId === currentUser.uid;
    }
    return matchesEmployee(empId, undefined, selectedStaffUid);
  };

  // Unified follow-ups (including scheduled and lead callbacks)
  const allStaffFollowups = getEmployeeFollowups(staffTarget);
  const todayFollowups = allStaffFollowups.filter(
    f => matchesStaff(f.employeeId) &&
         (f.scheduledDate === todayStr || (f.scheduledDate < todayStr && f.status !== 'Completed'))
  );

  const todayVisits = localStore.siteVisits.filter(
    v => matchesStaff(v.employeeId) && v.visitDate === todayStr
  );

  const freshPendingLeads = localStore.leads.filter(
    l => matchesStaff(l.assignedEmployeeId) &&
         (l.stage === 'New lead' || l.subStatus === 'Not Contacted' || l.subStatus === 'Assigned')
  );

  const staffDailyTasks = localStore.dailyTasks.filter(
    t => matchesStaff(t.assignedToId) && (t.dueDate === todayStr || !t.completed)
  );

  // Completed items count today
  const completedFollowupsCount = todayFollowups.filter(f => f.status === 'Completed').length;
  const completedVisitsCount = todayVisits.filter(v => v.status === 'Completed').length;
  const completedTasksCount = staffDailyTasks.filter(t => t.completed).length;

  const totalActionItems = todayFollowups.length + todayVisits.length + staffDailyTasks.length;
  const totalCompletedActionItems = completedFollowupsCount + completedVisitsCount + completedTasksCount;
  const completionPercentage = totalActionItems > 0 ? Math.round((totalCompletedActionItems / totalActionItems) * 100) : 100;

  // Quick WhatsApp Launcher
  const handleLaunchWhatsApp = (phone: string, customerName: string, projectName?: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const message = `Hello ${customerName}, I am ${currentUser.displayName} from Choudhary Estate. I am following up regarding your interest in ${projectName || 'our Palghar residential projects'}. When is a good time for a quick 2-minute call?`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Add Task Submit
  const handleCreateTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const assignee = usersList.find(u => u.uid === newTaskAssigneeId) || currentUser;

    await addDailyTask(
      {
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim() || undefined,
        assignedToId: assignee.uid,
        assignedToName: assignee.displayName,
        assignedById: currentUser.uid,
        assignedByName: currentUser.displayName,
        dueDate: todayStr,
        dueTime: newTaskDueTime,
        priority: newTaskPriority,
        category: newTaskCategory,
        completed: false
      },
      { id: currentUser.uid, name: currentUser.displayName, role: currentUser.role }
    );

    setNewTaskTitle('');
    setNewTaskDescription('');
    setShowAddTaskModal(false);
  };

  // Complete Followup Submit
  const handleConfirmCompleteFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingFollowup) return;

    await completeFollowup(
      completingFollowup.id,
      followupOutcome || 'Follow-up successfully completed.',
      { id: currentUser.uid, name: currentUser.displayName, role: currentUser.role }
    );

    setCompletingFollowup(null);
    setFollowupOutcome('');
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Welcome & Employee Selector Header */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 md:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 flex items-center gap-1.5 font-mono">
              <CalendarCheck2 className="w-3 h-3 text-emerald-500" />
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <span className="text-[11px] font-mono text-neutral-400">· Palghar Operations</span>
          </div>

          <h1 className="text-xl md:text-2xl font-semibold text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Today's Work Agenda</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
              {isViewingAll
                ? (isOwner ? 'Entire Company Overview' : "My Sales Team Overview")
                : `${viewingUser?.displayName} (${viewingUser?.designation || 'Sales Executive'})`}
            </span>
          </h1>

          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {isViewingAll
              ? `Real-time daily operations overview across ${isOwner ? 'all company staff' : 'your sales team'} (${todayFollowups.length} Calls · ${todayVisits.length} Site Visits).`
              : isViewingSelf
              ? `Review your scheduled calls, client site tours, fresh incoming inquiries, and daily checklist items.`
              : `Reviewing real-time daily work plan and operational targets for ${viewingUser?.displayName}.`}
          </p>
        </div>

        {/* Action Buttons & Staff Filter */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Employee Dropdown Selector for Owner & Team Leader */}
          {(isOwner || isTeamLeader || isAdmin || currentUser.role === 'admin' || currentUser.employeeCode === 'HEAD-01') && (
            <div className="flex items-center gap-1.5 bg-neutral-50 dark:bg-neutral-800/80 p-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700">
              <Filter className="w-3.5 h-3.5 text-neutral-400 shrink-0 ml-1" />
              <select
                value={selectedStaffUid}
                onChange={(e) => setSelectedStaffUid(e.target.value)}
                className="bg-transparent text-xs font-semibold text-neutral-800 dark:text-neutral-200 focus:outline-none cursor-pointer pr-2"
                aria-label="Filter work by team member"
              >
                <option value="ALL">
                  {isOwner ? '🏢 All Staff (Company-Wide Overview)' : '⚡ My Entire Sales Team'}
                </option>
                <optgroup label="Management & Team Leaders">
                  {usersList.filter(u => u.role === 'owner' || u.role === 'team_leader' || u.role === 'admin').map(u => (
                    <option key={u.uid} value={u.uid}>
                      {u.displayName} ({u.designation || (u.role === 'owner' ? 'Owner' : 'Team Leader')})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Sales & Operations Staff">
                  {usersList.filter(u => u.role === 'employee').map(u => (
                    <option key={u.uid} value={u.uid}>
                      {u.displayName} - {u.designation || 'Executive'}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          )}

          <button
            onClick={() => setShowAddTaskModal(true)}
            className="px-3.5 py-2 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Daily To-Do</span>
          </button>
        </div>
      </div>

      {/* KPI Performance Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Calls Due Today */}
        <div
          onClick={() => setActiveTab('calls')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'calls'
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-black border-black dark:border-white shadow-md'
              : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 text-neutral-900 dark:text-white'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider opacity-70">Follow-up Calls</span>
            <div className={`p-1.5 rounded-lg ${activeTab === 'calls' ? 'bg-white/20 dark:bg-black/10' : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'}`}>
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-medium font-mono">{todayFollowups.length}</span>
            <span className="text-xs opacity-75">({completedFollowupsCount} completed)</span>
          </div>
          <p className="text-[11px] mt-1 opacity-70">
            {todayFollowups.length - completedFollowupsCount} calls pending today
          </p>
        </div>

        {/* Site Visits Today */}
        <div
          onClick={() => setActiveTab('visits')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'visits'
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-black border-black dark:border-white shadow-md'
              : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 text-neutral-900 dark:text-white'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider opacity-70">Site Visits</span>
            <div className={`p-1.5 rounded-lg ${activeTab === 'visits' ? 'bg-white/20 dark:bg-black/10' : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'}`}>
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-medium font-mono">{todayVisits.length}</span>
            <span className="text-xs opacity-75">({completedVisitsCount} done)</span>
          </div>
          <p className="text-[11px] mt-1 opacity-70">
            Scheduled client site tours
          </p>
        </div>

        {/* Fresh Incoming Leads */}
        <div
          onClick={() => setActiveTab('fresh')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'fresh'
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-black border-black dark:border-white shadow-md'
              : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 text-neutral-900 dark:text-white'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider opacity-70">Pending Leads</span>
            <div className={`p-1.5 rounded-lg ${activeTab === 'fresh' ? 'bg-white/20 dark:bg-black/10' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'}`}>
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-medium font-mono">{freshPendingLeads.length}</span>
            <span className="text-xs opacity-75">awaiting call</span>
          </div>
          <p className="text-[11px] mt-1 opacity-70">
            Immediate 15-min response
          </p>
        </div>

        {/* Daily Completion Rate */}
        <div
          onClick={() => setActiveTab('checklist')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'checklist'
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-black border-black dark:border-white shadow-md'
              : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 text-neutral-900 dark:text-white'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider opacity-70">Today's Progress</span>
            <div className={`p-1.5 rounded-lg ${activeTab === 'checklist' ? 'bg-white/20 dark:bg-black/10' : 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'}`}>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-medium font-mono">{completionPercentage}%</span>
            <span className="text-xs opacity-75">({totalCompletedActionItems}/{totalActionItems})</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 overflow-x-auto pb-2 text-xs">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'all'
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-black'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <span>All Today's Agenda</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200">
            {totalActionItems}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('calls')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'calls'
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-black'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>Calls Due ({todayFollowups.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('visits')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'visits'
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-black'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Site Visits ({todayVisits.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('fresh')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'fresh'
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-black'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Fresh Leads ({freshPendingLeads.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('checklist')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'checklist'
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-black'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>Daily To-Dos ({staffDailyTasks.length})</span>
        </button>

        {/* Admin & Team Leader Team Matrix Tab */}
        {(isOwner || isTeamLeader || isAdmin || currentUser.role === 'admin') && (
          <button
            onClick={() => setActiveTab('team')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ml-auto ${
              activeTab === 'team'
                ? 'bg-blue-600 text-white'
                : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Team Work Matrix</span>
          </button>
        )}
      </div>

      {/* TAB 1: ALL TODAY'S AGENDA */}
      {(activeTab === 'all' || activeTab === 'calls') && todayFollowups.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-amber-500" />
              <span>Calls & Follow-ups Due Today ({todayFollowups.length})</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {todayFollowups.map(fol => {
              const matchedLead = localStore.leads.find(l => l.id === fol.leadId);
              const isCompleted = fol.status === 'Completed';

              return (
                <div
                  key={fol.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isCompleted
                      ? 'bg-neutral-50 dark:bg-neutral-900/40 border-neutral-200 dark:border-neutral-800 opacity-60'
                      : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-xs hover:border-black dark:hover:border-neutral-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => matchedLead && onSelectLead(matchedLead)}
                          className="font-bold text-sm text-neutral-900 dark:text-white hover:underline text-left"
                        >
                          {fol.leadName}
                        </button>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          fol.priority === 'High'
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}>
                          {fol.priority || 'Medium'}
                        </span>
                        {isCompleted && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            Completed
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-mono text-neutral-500 dark:text-neutral-400 flex items-center flex-wrap gap-1.5">
                        <span>{fol.leadPhone} · {fol.type} · <span className="font-semibold text-neutral-700 dark:text-neutral-300">{fol.scheduledTime || 'Scheduled'}</span></span>
                        {isViewingAll && fol.employeeName && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold border border-neutral-200 dark:border-neutral-700">
                            👤 {fol.employeeName}
                          </span>
                        )}
                      </p>
                      {matchedLead?.projectName && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 font-medium">
                          <Building className="w-3 h-3 shrink-0" />
                          <span>{matchedLead.projectName}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <a
                        href={`tel:${fol.leadPhone}`}
                        className="p-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-colors"
                        title="Direct Call"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => handleLaunchWhatsApp(fol.leadPhone, fol.leadName, matchedLead?.projectName)}
                        className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
                        title="WhatsApp Client"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {fol.notes && (
                    <div className="mt-2.5 p-2 rounded-lg bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-100 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-300">
                      <span className="font-semibold text-neutral-500 dark:text-neutral-400">Task Objective: </span>
                      {fol.notes}
                    </div>
                  )}

                  {fol.outcome && (
                    <div className="mt-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200">
                      <span className="font-bold">Call Outcome: </span>
                      {fol.outcome}
                    </div>
                  )}

                  {!isCompleted && (
                    <div className="mt-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                      <button
                        onClick={() => matchedLead && onSelectLead(matchedLead)}
                        className="text-xs text-neutral-500 hover:text-black dark:hover:text-white flex items-center gap-1 font-medium"
                      >
                        <span>View 360° Lead</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => {
                          setCompletingFollowup(fol);
                          setFollowupOutcome('');
                        }}
                        className="px-2.5 py-1 bg-black text-white dark:bg-white dark:text-black hover:opacity-85 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Log Call & Mark Done</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* TAB 2: SITE VISITS */}
      {(activeTab === 'all' || activeTab === 'visits') && todayVisits.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-500" />
              <span>Site Visits Scheduled Today ({todayVisits.length})</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {todayVisits.map(visit => {
              const matchedLead = localStore.leads.find(l => l.id === visit.leadId);
              return (
                <div
                  key={visit.id}
                  className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => matchedLead && onSelectLead(matchedLead)}
                          className="font-bold text-sm text-neutral-900 dark:text-white hover:underline"
                        >
                          {visit.leadName}
                        </button>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                          {visit.status}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 font-mono mt-0.5 flex items-center flex-wrap gap-1.5">
                        <span>{visit.leadPhone} · Time: <span className="font-bold text-neutral-900 dark:text-white">{visit.visitTime}</span></span>
                        {isViewingAll && visit.employeeName && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold border border-neutral-200 dark:border-neutral-700">
                            👤 {visit.employeeName}
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <a
                        href={`tel:${visit.leadPhone}`}
                        className="p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                        title="Call Customer"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => handleLaunchWhatsApp(visit.leadPhone, visit.leadName, visit.projectName)}
                        className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                        title="WhatsApp Directions"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-100 dark:border-neutral-800 text-xs space-y-1">
                    <p className="font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-blue-600" />
                      <span>{visit.projectName}</span>
                    </p>
                    <p className="text-neutral-500 dark:text-neutral-400">
                      Visitors: <span className="font-bold text-neutral-700 dark:text-neutral-300">{visit.visitorsCount} Person(s)</span>
                      {visit.transportNeeded && (
                        <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold inline-flex items-center gap-1">
                          <Car className="w-3 h-3" /> Pickup Needed (Vishal)
                        </span>
                      )}
                    </p>
                    {visit.feedback && (
                      <p className="text-neutral-600 dark:text-neutral-300 italic pt-1 border-t border-neutral-200 dark:border-neutral-800">
                        "{visit.feedback}"
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* TAB 3: FRESH UNCONTACTED LEADS */}
      {(activeTab === 'all' || activeTab === 'fresh') && freshPendingLeads.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>Fresh Leads Assigned — Ready for First Call ({freshPendingLeads.length})</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {freshPendingLeads.map(lead => (
              <div
                key={lead.id}
                className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-emerald-200 dark:border-emerald-900/60 shadow-xs space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSelectLead(lead)}
                        className="font-bold text-sm text-neutral-900 dark:text-white hover:underline text-left"
                      >
                        {lead.customerName}
                      </button>
                      <LeadSourceBadge source={lead.source} size="sm" />
                    </div>
                    <p className="text-xs font-mono text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {lead.phone} · Ingested {new Date(lead.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <a
                      href={`tel:${lead.phone}`}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs"
                    >
                      <Phone className="w-3 h-3" />
                      <span>Call Now</span>
                    </a>
                    <button
                      onClick={() => handleLaunchWhatsApp(lead.phone, lead.customerName, lead.projectName)}
                      className="p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 cursor-pointer"
                      title="Send WhatsApp Intro"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-xs text-neutral-600 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-950/60 p-2.5 rounded-lg border border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                  <span>Project: <strong className="text-neutral-900 dark:text-white">{lead.projectName || 'Palghar Project'}</strong></span>
                  <span>Budget: {Number(lead.budgetMax || lead.budgetMin || 0) > 0 ? (
                    <strong className="font-mono text-emerald-700 dark:text-emerald-400">₹{((Number(lead.budgetMax || lead.budgetMin || 0)) / 100000).toFixed(1)}L</strong>
                  ) : (
                    <strong className="font-sans text-amber-600 dark:text-amber-400 font-medium">Not Set</strong>
                  )}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TAB 4: DAILY TO-DO CHECKLIST */}
      {(activeTab === 'all' || activeTab === 'checklist') && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-purple-500" />
              <span>Personal Daily Checklist & Operational Tasks ({staffDailyTasks.length})</span>
            </h2>

            <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg text-xs">
              <button
                onClick={() => setChecklistFilter('all')}
                className={`px-2 py-0.5 rounded font-medium cursor-pointer ${checklistFilter === 'all' ? 'bg-white dark:bg-neutral-900 text-black dark:text-white shadow-xs' : 'text-neutral-500'}`}
              >
                All
              </button>
              <button
                onClick={() => setChecklistFilter('pending')}
                className={`px-2 py-0.5 rounded font-medium cursor-pointer ${checklistFilter === 'pending' ? 'bg-white dark:bg-neutral-900 text-black dark:text-white shadow-xs' : 'text-neutral-500'}`}
              >
                Pending
              </button>
              <button
                onClick={() => setChecklistFilter('completed')}
                className={`px-2 py-0.5 rounded font-medium cursor-pointer ${checklistFilter === 'completed' ? 'bg-white dark:bg-neutral-900 text-black dark:text-white shadow-xs' : 'text-neutral-500'}`}
              >
                Completed
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl divide-y divide-neutral-100 dark:divide-neutral-800 shadow-xs overflow-hidden">
            {staffDailyTasks
              .filter(t => {
                if (checklistFilter === 'pending') return !t.completed;
                if (checklistFilter === 'completed') return t.completed;
                return true;
              })
              .map(task => {
                const getCategoryIcon = (cat: DailyTask['category']) => {
                  switch (cat) {
                    case 'Car & Transport': return <Car className="w-3.5 h-3.5 text-blue-500" />;
                    case 'Rent Department': return <Home className="w-3.5 h-3.5 text-amber-500" />;
                    case 'Documentation / Accounts': return <FileText className="w-3.5 h-3.5 text-emerald-500" />;
                    case 'Site Visit': return <MapPin className="w-3.5 h-3.5 text-purple-500" />;
                    case 'Call / Follow-up': return <Phone className="w-3.5 h-3.5 text-indigo-500" />;
                    default: return <CheckSquare className="w-3.5 h-3.5 text-neutral-500" />;
                  }
                };

                return (
                  <div
                    key={task.id}
                    className={`p-3.5 md:p-4 flex items-start gap-3 transition-colors ${
                      task.completed ? 'bg-neutral-50/60 dark:bg-neutral-950/40 opacity-70' : 'hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40'
                    }`}
                  >
                    <button
                      onClick={() => toggleDailyTask(task.id, { id: currentUser.uid, name: currentUser.displayName, role: currentUser.role })}
                      className="mt-0.5 text-neutral-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer shrink-0"
                      title={task.completed ? 'Mark pending' : 'Mark completed'}
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Square className="w-5 h-5 text-neutral-400" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-xs md:text-sm font-bold text-neutral-900 dark:text-white ${task.completed ? 'line-through text-neutral-400 dark:text-neutral-500' : ''}`}>
                          {task.title}
                        </span>
                        <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                          {getCategoryIcon(task.category)}
                          <span>{task.category}</span>
                        </span>
                        {task.dueTime && (
                          <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {task.dueTime}
                          </span>
                        )}
                        <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-bold uppercase tracking-wider ${
                          task.priority === 'High' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                        }`}>
                          {task.priority}
                        </span>
                      </div>

                      {task.description && (
                        <p className="text-xs text-neutral-600 dark:text-neutral-400">
                          {task.description}
                        </p>
                      )}

                      {task.relatedProjectName && (
                        <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                          Project: {task.relatedProjectName} {task.relatedLeadName && `· Lead: ${task.relatedLeadName}`}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => deleteDailyTask(task.id, { id: currentUser.uid, name: currentUser.displayName, role: currentUser.role })}
                      className="p-1.5 rounded text-neutral-400 hover:text-rose-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
                      title="Delete task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}

            {staffDailyTasks.length === 0 && (
              <div className="p-8 text-center text-xs text-neutral-500 space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 opacity-70" />
                <p className="font-semibold text-neutral-700 dark:text-neutral-300">No pending checklist tasks for today!</p>
                <p>Click "Add Daily To-Do" above to schedule tasks or targets.</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* TAB 5: ADMIN & TEAM LEADER PROGRESS MATRIX */}
      {activeTab === 'team' && (isOwner || isTeamLeader || isAdmin || currentUser.role === 'admin') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                <span>All Staff Daily Work Matrix & Performance (Today)</span>
              </h2>
              <p className="text-xs text-neutral-500">
                Real-time visibility into today's calls, site tours, and checklist completion across all 11 Choudhary Estate team members.
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-neutral-50 dark:bg-neutral-950/60 border-b border-neutral-200 dark:border-neutral-800 text-xs font-bold uppercase tracking-wider text-neutral-500">
                    <th className="p-3.5">Employee Name & Role</th>
                    <th className="p-3.5">Department</th>
                    <th className="p-3.5">Calls Due</th>
                    <th className="p-3.5">Visits Due</th>
                    <th className="p-3.5">To-Dos</th>
                    <th className="p-3.5">Today Progress</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {usersList.map(member => {
                    const empFollowups = localStore.followups.filter(f => f.employeeId === member.uid && (f.scheduledDate === todayStr || (f.scheduledDate < todayStr && f.status !== 'Completed')));
                    const empVisits = localStore.siteVisits.filter(v => v.employeeId === member.uid && v.visitDate === todayStr);
                    const empTasks = localStore.dailyTasks.filter(t => t.assignedToId === member.uid && (t.dueDate === todayStr || !t.completed));

                    const empCompleted = empFollowups.filter(f => f.status === 'Completed').length +
                                         empVisits.filter(v => v.status === 'Completed').length +
                                         empTasks.filter(t => t.completed).length;
                    const empTotal = empFollowups.length + empVisits.length + empTasks.length;
                    const empPercent = empTotal > 0 ? Math.round((empCompleted / empTotal) * 100) : 100;

                    return (
                      <tr key={member.uid} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                        <td className="p-3.5">
                          <div className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5 text-base">
                            <span>{member.displayName}</span>
                            {member.role === 'admin' && (
                              <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                Admin
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-neutral-500 font-mono mt-0.5">
                            {member.employeeCode || 'STAFF'} · {member.phone}
                          </div>
                        </td>

                        <td className="p-3.5">
                          <span className="text-neutral-700 dark:text-neutral-300 font-semibold text-sm">
                            {member.designation || 'Sales Rep'}
                          </span>
                        </td>

                        <td className="p-3.5 font-mono text-sm">
                          <span className="font-bold text-neutral-900 dark:text-white">{empFollowups.length}</span>
                          <span className="text-neutral-400 text-xs ml-1">({empFollowups.filter(f => f.status === 'Completed').length} done)</span>
                        </td>

                        <td className="p-3.5 font-mono text-sm">
                          <span className="font-bold text-neutral-900 dark:text-white">{empVisits.length}</span>
                        </td>

                        <td className="p-3.5 font-mono text-sm">
                          <span className="font-bold text-neutral-900 dark:text-white">{empTasks.length}</span>
                        </td>

                        <td className="p-3.5">
                          <div className="w-28 space-y-1">
                            <div className="flex justify-between text-xs font-mono font-bold">
                              <span>{empCompleted}/{empTotal}</span>
                              <span>{empPercent}%</span>
                            </div>
                            <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${empPercent === 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                                style={{ width: `${empPercent}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => {
                              setSelectedStaffUid(member.uid);
                              setActiveTab('all');
                            }}
                            className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-lg text-sm font-bold transition-all cursor-pointer"
                          >
                            View Agenda
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* MODAL 1: ADD NEW DAILY TO-DO */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 text-neutral-900 dark:text-neutral-100 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-500" />
                <span>Add Daily Work Task / Target</span>
              </h3>
              <button
                onClick={() => setShowAddTaskModal(false)}
                className="text-neutral-400 hover:text-black dark:hover:text-white cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTaskSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-semibold">
                  Task Title *
                </label>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  required
                  placeholder="e.g. Call 10 leads from Jeevika Heights campaign"
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2.5 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-black dark:focus:border-white font-medium"
                />
              </div>

              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-semibold">
                  Detailed Notes / Instructions (Optional)
                </label>
                <textarea
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  rows={2}
                  placeholder="Additional details, customer name or phone numbers..."
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-black dark:focus:border-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-semibold">
                    Assign To Employee
                  </label>
                  <select
                    value={newTaskAssigneeId}
                    onChange={(e) => setNewTaskAssigneeId(e.target.value)}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 text-neutral-900 dark:text-neutral-100 focus:outline-none"
                  >
                    {usersList.map(u => (
                      <option key={u.uid} value={u.uid}>
                        {u.displayName} ({u.designation || 'Staff'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-semibold">
                    Target Time (Due)
                  </label>
                  <input
                    type="text"
                    value={newTaskDueTime}
                    onChange={(e) => setNewTaskDueTime(e.target.value)}
                    placeholder="e.g. 11:30 AM"
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 text-neutral-900 dark:text-neutral-100 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-semibold">
                    Category
                  </label>
                  <select
                    value={newTaskCategory}
                    onChange={(e) => setNewTaskCategory(e.target.value as DailyTask['category'])}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 text-neutral-900 dark:text-neutral-100 focus:outline-none"
                  >
                    <option value="Call / Follow-up">Call / Follow-up</option>
                    <option value="Site Visit">Site Visit</option>
                    <option value="Rent Department">Rent Department</option>
                    <option value="Car & Transport">Car & Transport</option>
                    <option value="Documentation / Accounts">Documentation / Accounts</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-semibold">
                    Priority
                  </label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as DailyTask['priority'])}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 text-neutral-900 dark:text-neutral-100 focus:outline-none"
                  >
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: COMPLETE FOLLOW-UP WITH OUTCOME */}
      {completingFollowup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 text-neutral-900 dark:text-neutral-100 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Log Follow-up Call Outcome</span>
              </h3>
              <button
                onClick={() => setCompletingFollowup(null)}
                className="text-neutral-400 hover:text-black dark:hover:text-white cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-neutral-50 dark:bg-neutral-950/60 rounded-xl text-xs space-y-1 border border-neutral-200 dark:border-neutral-800">
              <p className="font-bold text-neutral-900 dark:text-white">{completingFollowup.leadName}</p>
              <p className="text-neutral-500 font-mono">{completingFollowup.leadPhone} · {completingFollowup.type}</p>
              {completingFollowup.notes && (
                <p className="text-neutral-600 dark:text-neutral-300 italic pt-1 border-t border-neutral-200 dark:border-neutral-800">
                  Target: {completingFollowup.notes}
                </p>
              )}
            </div>

            <form onSubmit={handleConfirmCompleteFollowup} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-semibold">
                  Discussion Outcome / Next Step *
                </label>
                <textarea
                  value={followupOutcome}
                  onChange={(e) => setFollowupOutcome(e.target.value)}
                  required
                  rows={3}
                  placeholder="e.g. Spoke with client. Highly interested in Jeevika Heights 2 BHK. Confirmed site visit for Saturday 11 AM."
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2.5 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-black dark:focus:border-white font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setCompletingFollowup(null)}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark Completed</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
