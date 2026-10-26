import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lead, LeadStage } from '../types/crm';
import { localStore } from '../services/crmService';
import { getEmployeePerformanceMetrics, getEmployeeFollowupsDueToday, getCompanyMetrics, getTodayIST } from '../utils/crmMetrics';
import {
  Users,
  Briefcase,
  PhoneCall,
  Award,
  Plus,
  ArrowRight,
  Clock,
  Phone,
  MessageSquare,
  Sparkles,
  ChevronRight,
  CalendarCheck2
} from 'lucide-react';
import { LeadSourceBadge } from './LeadSourceBadge';

interface DashboardProps {
  onSelectTab: (tab: string) => void;
  onSelectLead: (lead: Lead) => void;
  onOpenNewLeadModal?: () => void;
  onSelectStage?: (stage: string) => void;
}

const STAGES_LIST: LeadStage[] = [
  'New lead',
  'Ringing',
  'Whatsapp',
  'Opportunity',
  'Site Visit',
  'Revisit',
  'Unqualified',
  'Lost'
];

const STAGE_DOT_COLORS: Record<LeadStage, string> = {
  'New lead': 'bg-blue-500',
  'Ringing': 'bg-amber-500',
  'Whatsapp': 'bg-emerald-500',
  'Opportunity': 'bg-purple-500',
  'Site Visit': 'bg-indigo-500',
  'Visit done': 'bg-indigo-500',
  'Revisit': 'bg-teal-500',
  'Unqualified': 'bg-zinc-400',
  'Lost': 'bg-rose-500'
};

export const Dashboard: React.FC<DashboardProps> = ({
  onSelectTab,
  onSelectLead,
  onOpenNewLeadModal,
  onSelectStage
}) => {
  const { currentUser, selectedEmployeeFilter, isAdmin, isOwner, isTeamLeader, teamMemberUids, setEmployeeFilter, usersList } = useAuth();
  const [, setTick] = useState(0);

  useEffect(() => {
    return localStore.subscribe(() => setTick(t => t + 1));
  }, []);

  let leads = localStore.leads;
  let followups = localStore.followups;
  let bookings = localStore.bookings;

  const isEmployeeFilterValid = selectedEmployeeFilter !== 'ALL' && usersList.some(u => u.uid === selectedEmployeeFilter && (u.role === 'employee' || u.role === 'team_leader'));

  if (isTeamLeader && selectedEmployeeFilter === 'ALL') {
    leads = leads.filter(l => Boolean(l.assignedEmployeeId && teamMemberUids.includes(l.assignedEmployeeId)) || l.assignedEmployeeId === currentUser.uid);
    followups = followups.filter(f => Boolean(f.employeeId && teamMemberUids.includes(f.employeeId)) || f.employeeId === currentUser.uid);
    bookings = bookings.filter(b => Boolean(b.employeeId && teamMemberUids.includes(b.employeeId)) || b.employeeId === currentUser.uid);
  } else if (currentUser.role === 'employee' || isEmployeeFilterValid) {
    const filterUid = isEmployeeFilterValid ? selectedEmployeeFilter : currentUser.uid;
    const isTargetTeamLeader = usersList.some(u => u.uid === filterUid && u.role === 'team_leader');
    if (isTargetTeamLeader) {
      leads = leads.filter(l => Boolean(l.assignedEmployeeId && teamMemberUids.includes(l.assignedEmployeeId)) || l.assignedEmployeeId === filterUid);
      followups = followups.filter(f => Boolean(f.employeeId && teamMemberUids.includes(f.employeeId)) || f.employeeId === filterUid);
      bookings = bookings.filter(b => Boolean(b.employeeId && teamMemberUids.includes(b.employeeId)) || b.employeeId === filterUid);
    } else {
      leads = leads.filter(l => l.assignedEmployeeId === filterUid);
      followups = followups.filter(f => f.employeeId === filterUid);
      bookings = bookings.filter(b => b.employeeId === filterUid);
    }
  }

  const isCompanyView = isOwner && selectedEmployeeFilter === 'ALL';
  const targetEmployeeId = selectedEmployeeFilter !== 'ALL' ? selectedEmployeeFilter : (isOwner ? 'ALL' : currentUser.uid);

  // Unified shared metrics calculation (consistent across every screen)
  const metrics = getEmployeePerformanceMetrics(targetEmployeeId);
  const todayStr = metrics.todayStr;

  // Core Numbers (The Big 4)
  const totalLeads = isCompanyView ? localStore.leads.length : metrics.totalLeadsCount;
  const unassignedCount = localStore.leads.filter(l => !l.assignedEmployeeId).length;
  const dueTodayFollowups = (getEmployeeFollowupsDueToday(targetEmployeeId) || []);
  const dueTodayCount = dueTodayFollowups.length;
  const overdueCount = metrics.overdueFollowupsCount;
  const totalBookingsCount = metrics.totalBookingsCount;
  const totalSalesVal = metrics.salesVolume;

  // Active Pipeline Value (dynamic based on staff-updated customer budget)
  const activeLeadsCount = metrics.activeLeadsCount;
  const pipelineValue = leads
    .filter(l => l.stage !== 'Lost' && l.stage !== 'Unqualified')
    .reduce((sum, l) => {
      const b = Number(l.budgetMax || l.budgetMin || 0);
      return sum + (b > 0 ? b : 0);
    }, 0);
  const hotCount = leads.filter(l => l.priority === 'Hot').length;

  // Today's Work for Dashboard Focus Banner
  const userPendingFollowups = metrics.pendingCallsToday;
  const userPendingVisits = metrics.pendingVisitsToday;
  const userPendingTasks = metrics.pendingTasksToday;
  const totalActionItems = metrics.totalActionItemsToday;

  const breakdownParts: string[] = [];
  if (userPendingFollowups > 0) breakdownParts.push(`${userPendingFollowups} ${userPendingFollowups === 1 ? 'Call' : 'Calls'}`);
  if (userPendingVisits > 0) breakdownParts.push(`${userPendingVisits} ${userPendingVisits === 1 ? 'Site Visit' : 'Site Visits'}`);
  if (userPendingTasks > 0) breakdownParts.push(`${userPendingTasks} ${userPendingTasks === 1 ? 'Daily Task' : 'Daily Tasks'}`);
  const breakdownText = breakdownParts.length > 0 ? breakdownParts.join(' & ') : 'All Action Items Done';

  const getGreetingName = () => {
    if (!currentUser || !currentUser.displayName) return 'Team';
    const cleaned = currentUser.displayName.replace(/^(mr\.|mrs\.|ms\.|dr\.)\s*/i, '').trim();
    return cleaned.split(' ')[0] || currentUser.displayName;
  };

  const getUserBadge = () => {
    const isKishan = currentUser.uid === 'admin-001' || currentUser.displayName.toLowerCase().includes('kishan');
    const isHeena = currentUser.uid === 'admin-002' || currentUser.displayName.toLowerCase().includes('heena');

    if (isKishan) return { label: 'Company Owner', bg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-700' };
    if (isHeena) return { label: 'Team Leader', bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700' };
    return { label: currentUser.designation || currentUser.employeeCode || 'Sales Rep', bg: 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border-blue-300 dark:border-blue-700' };
  };

  const badge = getUserBadge();

  return (
    <div className="space-y-6 animate-fadeIn pb-16 w-full">
      {/* 1. Minimal Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">
              Dashboard
            </h1>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${badge.bg}`}>
              {badge.label}
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Welcome back, {getGreetingName()} · {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
          <button
            onClick={() => onSelectTab('work')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors shadow-2xs cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Today's Agenda</span>
            <span className="text-neutral-400 font-mono">({dueTodayCount})</span>
          </button>

          {onOpenNewLeadModal && (
            <button
              onClick={onOpenNewLeadModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-black hover:bg-neutral-800 text-white dark:bg-white dark:text-black dark:hover:bg-neutral-100 rounded-lg text-xs font-medium transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Lead</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Key Metrics Strip (Clean, border-light, minimal icons) */}
      {/* 2. Key Metrics Strip (Elevated Executive Real Estate CRM Aesthetics) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Leads */}
        <div
          onClick={() => onSelectTab('leads')}
          className="relative overflow-hidden p-5 bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-2xl cursor-pointer hover:border-blue-400 dark:hover:border-blue-500/60 transition-all duration-200 shadow-xs hover:shadow-md group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Total Facebook Leads
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/60 transition-transform group-hover:scale-105">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white mt-3">
            {totalLeads.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 mt-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
            <span>Real Meta Leads (Last 3 Months)</span>
          </div>
        </div>

        {/* Metric 2: Pipeline Value */}
        <div
          onClick={() => onSelectTab('leads')}
          className="relative overflow-hidden p-5 bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-2xl cursor-pointer hover:border-purple-400 dark:hover:border-purple-500/60 transition-all duration-200 shadow-xs hover:shadow-md group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Active Pipeline Value
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-900/60 transition-transform group-hover:scale-105">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white mt-3">
            ₹{(pipelineValue / 10000000).toFixed(2)} <span className="text-sm font-semibold text-neutral-400">Cr</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 mt-1.5">
            <span className="text-neutral-800 dark:text-neutral-200 font-semibold">{totalLeads.toLocaleString()}</span>
            <span>potential buyers</span>
          </div>
        </div>

        {/* Metric 3: Follow-ups Today */}
        <div
          onClick={() => onSelectTab('followups')}
          className="relative overflow-hidden p-5 bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-2xl cursor-pointer hover:border-amber-400 dark:hover:border-amber-500/60 transition-all duration-200 shadow-xs hover:shadow-md group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Follow-ups Today
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/60 transition-transform group-hover:scale-105">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white mt-3">
            {dueTodayCount}
          </div>
          <div className="text-xs mt-1.5 font-medium">
            {overdueCount > 0 ? (
              <span className="text-rose-600 dark:text-rose-400">{overdueCount} overdue</span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                ✓ All follow-ups clear (0 due)
              </span>
            )}
          </div>
        </div>

        {/* Metric 4: Confirmed Bookings */}
        <div
          onClick={() => onSelectTab('bookings')}
          className="relative overflow-hidden p-5 bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-2xl cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-500/60 transition-all duration-200 shadow-xs hover:shadow-md group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Confirmed Bookings
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/60 transition-transform group-hover:scale-105">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white mt-3">
            ₹{(totalSalesVal / 10000000).toFixed(2)} <span className="text-sm font-semibold text-neutral-400">Cr</span>
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5">
            <span>{totalBookingsCount} booked units</span>
          </div>
        </div>
      </div>

      {/* 3. Pipeline Distribution (Minimal & High Contrast) */}
      <div className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-2xl shadow-xs">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
              Pipeline Stages
            </span>
            <span className="text-xs text-neutral-400 font-mono">({leads.length.toLocaleString()} real leads)</span>
          </div>
          <button
            onClick={() => onSelectTab('leads')}
            className="text-xs text-neutral-500 hover:text-black dark:hover:text-white transition-colors flex items-center gap-1 cursor-pointer font-semibold"
          >
            <span>Kanban Board</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {STAGES_LIST.map((stage) => {
            const count = leads.filter(l =>
              stage === 'Site Visit'
                ? (l.stage === 'Site Visit' || l.stage === 'Visit done')
                : l.stage === stage
            ).length;
            const dot = STAGE_DOT_COLORS[stage];
            const hasLeads = count > 0;
            return (
              <button
                key={stage}
                type="button"
                onClick={() => {
                  if (stage === 'Site Visit' || stage === 'Visit done') {
                    onSelectTab('visits');
                  } else if (onSelectStage) {
                    onSelectStage(stage);
                  } else {
                    onSelectTab('leads');
                  }
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer group ${
                  hasLeads
                    ? 'bg-neutral-50 dark:bg-neutral-800/60 border-neutral-300 dark:border-neutral-700 shadow-2xs hover:border-black dark:hover:border-white'
                    : 'bg-neutral-50/40 dark:bg-neutral-900/40 border-neutral-200/60 dark:border-neutral-800/60 hover:bg-neutral-50 dark:hover:bg-neutral-800/30'
                }`}
                title={`Filter by ${stage}`}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className={`w-2 h-2 rounded-full ${dot}`} />
                  <span className={`text-[11px] font-semibold truncate ${
                    hasLeads ? 'text-neutral-900 dark:text-white' : 'text-neutral-400 dark:text-neutral-500'
                  }`}>
                    {stage}
                  </span>
                </div>
                <div className={`text-xl font-bold tracking-tight ${
                  hasLeads ? 'text-neutral-900 dark:text-white' : 'text-neutral-400 dark:text-neutral-500'
                }`}>
                  {count.toLocaleString()}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Action Focus (Today's Calls vs Recent Inbound Leads) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Today's Follow-up Calls */}
        <div className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-2xl shadow-xs min-h-[380px] flex flex-col">
          <div className="flex items-center justify-between pb-3.5 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
            <div className="flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Today's Calls ({dueTodayFollowups.length})
              </h3>
            </div>
            <button
              onClick={() => onSelectTab('followups')}
              className="text-xs font-semibold text-neutral-500 hover:text-black dark:hover:text-white cursor-pointer transition-colors"
            >
              View All Follow-ups →
            </button>
          </div>

          <div className="mt-3 flex-1 min-h-0 flex flex-col justify-center">
            {dueTodayFollowups.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 my-auto">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white">All Follow-ups Clear</h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-xs leading-relaxed">
                  No scheduled follow-up calls are due right now. Real Facebook leads are ready in the inbox for first outreach!
                </p>
                <button
                  onClick={() => onSelectTab('inbox')}
                  className="mt-4 px-4 py-2 bg-black hover:bg-neutral-800 text-white dark:bg-white dark:text-black dark:hover:bg-neutral-200 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Open New Leads Inbox ({leads.length})</span>
                </button>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800 overflow-y-auto pr-1">
                {dueTodayFollowups.slice(0, 10).map(f => (
                  <div
                    key={f.id}
                    className="py-3 px-2 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 rounded-xl flex items-center justify-between gap-3 text-sm transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-neutral-900 dark:text-white truncate">
                          {f.leadName}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-semibold">
                          {f.type}
                        </span>
                      </div>
                      <p className="text-neutral-400 font-mono text-xs mt-0.5">
                        {f.leadPhone} · {f.scheduledTime || 'Today'}
                      </p>
                    </div>

                    <a
                      href={`tel:${f.leadPhone}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black hover:bg-neutral-800 text-white dark:bg-white dark:text-black dark:hover:bg-neutral-200 rounded-lg text-xs font-semibold transition-colors shadow-2xs shrink-0"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call</span>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Recent Inbound Leads */}
        <div className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-2xl shadow-xs min-h-[380px] flex flex-col">
          <div className="flex items-center justify-between pb-3.5 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Recent Facebook Leads ({leads.length.toLocaleString()})
              </h3>
            </div>
            <button
              onClick={() => onSelectTab('leads')}
              className="text-xs font-semibold text-neutral-500 hover:text-black dark:hover:text-white cursor-pointer transition-colors"
            >
              All Leads →
            </button>
          </div>

          <div className="mt-2 divide-y divide-neutral-100 dark:divide-neutral-800/60 flex-1 min-h-0 overflow-y-auto pr-1">
            {leads.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-400">
                <p className="text-sm font-medium">No inbound leads recorded yet.</p>
              </div>
            ) : (
              leads.slice(0, 8).map(l => (
                <div
                  key={l.id}
                  onClick={() => onSelectLead(l)}
                  className="py-3 px-2 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 rounded-xl flex items-center justify-between gap-3 text-sm cursor-pointer transition-colors group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-neutral-900 dark:text-white truncate">
                        {l.customerName}
                      </span>
                      <span className="text-neutral-500 text-xs">
                        · {l.projectName || 'Palghar Property'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-neutral-400 font-mono text-xs">
                        {l.phone}
                      </span>
                      <span className="text-neutral-400 text-xs font-medium">
                        · {l.propertyType}
                      </span>
                      {l.city && (
                        <span className="text-neutral-400 text-xs">
                          · {l.city}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={`tel:${l.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 transition-colors"
                      title="Direct Call"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={`https://wa.me/${l.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${l.customerName}, thank you for inquiring about Choudhary Estate Palghar!`)}`}
                      onClick={(e) => e.stopPropagation()}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                      title="WhatsApp"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </a>
                    <LeadSourceBadge source={l.source} size="sm" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
