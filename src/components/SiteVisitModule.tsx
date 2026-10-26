import React, { useState, useEffect } from 'react';
import { SiteVisit, Lead } from '../types/crm';
import { useAuth } from '../context/AuthContext';
import { updateSiteVisit, localStore } from '../services/crmService';
import { MapPin, Calendar, Clock, Car, CheckCircle2, UserCheck, AlertCircle, ExternalLink, Building } from 'lucide-react';

interface SiteVisitModuleProps {
  onSelectLead?: (lead: Lead) => void;
}

type SiteVisitStatusFilter = 'ALL' | 'Scheduled' | 'Completed' | 'Cancelled' | 'Revisit';

export const SiteVisitModule: React.FC<SiteVisitModuleProps> = ({ onSelectLead }) => {
  const { currentUser, selectedEmployeeFilter } = useAuth();
  const [statusFilter, setStatusFilter] = useState<SiteVisitStatusFilter>('ALL');
  const [selectedVisit, setSelectedVisit] = useState<SiteVisit | null>(null);
  const [visitStatus, setVisitStatus] = useState<SiteVisit['status']>('Completed');
  const [feedback, setFeedback] = useState('');
  const [bookingProb, setBookingProb] = useState<'High' | 'Medium' | 'Low'>('High');
  const [, setTick] = useState(0);

  useEffect(() => {
    return localStore.subscribe(() => setTick(t => t + 1));
  }, []);

  let visits = localStore.siteVisits;

  if (selectedEmployeeFilter !== 'ALL') {
    visits = visits.filter(v => v.employeeId === selectedEmployeeFilter);
  }

  // Pre-calculate counts across the selected employee's visits
  const counts = {
    ALL: visits.length,
    Scheduled: visits.filter(v => v.status === 'Scheduled' || v.status === 'Confirmed' || v.status === 'Requested').length,
    Completed: visits.filter(v => v.status === 'Completed').length,
    Cancelled: visits.filter(v => v.status === 'Cancelled' || v.status === 'No-Show').length,
    Revisit: visits.filter(v => v.status === 'Revisit' || v.status === 'Rescheduled').length
  };

  // Filter based on selected tab
  const filteredVisits = visits.filter(v => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'Scheduled') return v.status === 'Scheduled' || v.status === 'Confirmed' || v.status === 'Requested';
    if (statusFilter === 'Completed') return v.status === 'Completed';
    if (statusFilter === 'Cancelled') return v.status === 'Cancelled' || v.status === 'No-Show';
    if (statusFilter === 'Revisit') return v.status === 'Revisit' || v.status === 'Rescheduled';
    return true;
  });

  const handleLeadClick = (leadId: string, leadPhone?: string, leadName?: string) => {
    if (!onSelectLead) return;
    const cleanPhone = (p?: string) => (p || '').replace(/\D/g, '');
    const found =
      localStore.leads.find(l => l.id === leadId) ||
      localStore.leads.find(l => leadPhone && cleanPhone(l.phone).includes(cleanPhone(leadPhone))) ||
      localStore.leads.find(l => leadName && l.customerName.toLowerCase() === leadName.toLowerCase());
    if (found) {
      onSelectLead(found);
    }
  };

  const handleUpdateSubmit = async () => {
    if (selectedVisit) {
      const actor = { id: currentUser.uid, name: currentUser.displayName, role: currentUser.role };
      await updateSiteVisit(
        selectedVisit.id,
        {
          status: visitStatus,
          feedback,
          bookingProbability: bookingProb
        },
        actor
      );
      setSelectedVisit(null);
      setFeedback('');
    }
  };

  const openFeedbackModal = (vis: SiteVisit) => {
    setSelectedVisit(vis);
    setVisitStatus(vis.status === 'Scheduled' || vis.status === 'Confirmed' ? 'Completed' : vis.status);
    setFeedback(vis.feedback || '');
    setBookingProb(vis.bookingProbability || 'High');
  };

  return (
    <div className="space-y-4">
      {/* Module Header & Filters with Glassmorphic Card */}
      <div className="relative overflow-hidden p-6 rounded-3xl bg-white/70 dark:bg-neutral-900/60 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] transition-all">
        {/* Soft background ambient glow */}
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-purple-500/10 dark:bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-neutral-900/5 dark:bg-white/10 text-neutral-800 dark:text-neutral-200 backdrop-blur-md border border-neutral-900/10 dark:border-white/10 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Site Visit Engine
            </div>
            <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
              Property Site Visit Schedule
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-xl">
              Track site visit confirmations, sales office meetings, transport requests, and post-visit buyer feedback with real-time pipeline classification.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-4 py-2 rounded-2xl bg-white/60 dark:bg-neutral-800/60 backdrop-blur-md border border-white/50 dark:border-white/10 shadow-xs flex items-center gap-3">
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Total Visits:</span>
              <span className="text-base font-extrabold font-mono text-neutral-900 dark:text-white">{counts.ALL}</span>
            </div>
          </div>
        </div>

        {/* Glassmorphic Filter Classification Tabs */}
        <div className="relative z-10 flex flex-wrap items-center gap-2 pt-5 mt-5 border-t border-neutral-200/50 dark:border-white/5">
          {(
            [
              { key: 'ALL', label: 'All Visits', count: counts.ALL, color: 'neutral' },
              { key: 'Scheduled', label: 'Scheduled', count: counts.Scheduled, color: 'blue' },
              { key: 'Completed', label: 'Completed', count: counts.Completed, color: 'emerald' },
              { key: 'Revisit', label: 'Revisit', count: counts.Revisit, color: 'purple' },
              { key: 'Cancelled', label: 'Cancelled / No-Show', count: counts.Cancelled, color: 'rose' }
            ] as const
          ).map(tab => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`group relative inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 shadow-md shadow-neutral-950/20 dark:shadow-white/10 scale-[1.02]'
                    : 'bg-white/50 hover:bg-white/80 dark:bg-neutral-800/40 dark:hover:bg-neutral-800/80 text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white backdrop-blur-md border border-white/60 dark:border-white/5 hover:border-neutral-300 dark:hover:border-white/20 shadow-2xs'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold transition-colors ${
                    isActive
                      ? 'bg-white/25 text-white dark:bg-black/20 dark:text-neutral-900'
                      : 'bg-neutral-200/70 dark:bg-neutral-700/60 text-neutral-700 dark:text-neutral-300 group-hover:bg-neutral-300/80 dark:group-hover:bg-neutral-600/80'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Visits Table with Frosted Glassmorphism Card */}
      <div className="relative rounded-3xl bg-white/70 dark:bg-neutral-900/60 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] overflow-hidden transition-all">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-100/60 dark:bg-neutral-950/60 backdrop-blur-md text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider border-b border-neutral-200/60 dark:border-white/5 text-[11px]">
              <tr>
                <th className="p-4">Customer & Phone</th>
                <th className="p-4">Project Name</th>
                <th className="p-4">Visit Date & Time</th>
                <th className="p-4">Visitors & Transport</th>
                <th className="p-4">Sales Employee</th>
                <th className="p-4">Status</th>
                <th className="p-4">Feedback / Notes</th>
                <th className="p-4 text-right">Update Feedback</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200/40 dark:divide-white/5 text-neutral-800 dark:text-neutral-200">
              {filteredVisits.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-neutral-400 dark:text-neutral-500">
                    <div className="inline-flex flex-col items-center justify-center p-6 rounded-2xl bg-white/40 dark:bg-neutral-800/30 backdrop-blur-md border border-white/40 dark:border-white/5">
                      <Clock className="w-8 h-8 text-neutral-400/80 mb-2 stroke-[1.5]" />
                      <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">No site visits found</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">There are no records in the "{statusFilter}" category.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredVisits.map(vis => (
                  <tr
                    key={vis.id}
                    className="group/row hover:bg-white/60 dark:hover:bg-neutral-800/50 backdrop-blur-sm transition-all duration-150"
                  >
                    <td className="p-4">
                      <button
                        onClick={() => handleLeadClick(vis.leadId, vis.leadPhone, vis.leadName)}
                        className="text-left group/lead cursor-pointer"
                        title="Click to view 360° Lead Details"
                      >
                        <div className="font-bold text-neutral-900 dark:text-white group-hover/lead:text-blue-600 dark:group-hover/lead:text-blue-400 flex items-center gap-1.5 text-sm transition-colors">
                          <span>{vis.leadName}</span>
                          <ExternalLink className="w-3.5 h-3.5 opacity-40 group-hover/lead:opacity-100 transition-opacity" />
                        </div>
                        <div className="font-mono text-neutral-500 dark:text-neutral-400 text-xs mt-0.5">{vis.leadPhone}</div>
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {(vis.projectNames && vis.projectNames.length > 0
                          ? vis.projectNames
                          : (vis.projectName ? vis.projectName.split(',').map(s => s.trim()) : ['Jeevika Heights'])
                        ).map((p, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 backdrop-blur-md shadow-2xs"
                          >
                            <Building className="w-3 h-3 opacity-70 shrink-0" />
                            <span>{p}</span>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 font-mono text-xs text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                      <div className="font-semibold text-neutral-900 dark:text-neutral-100">{vis.visitDate}</div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">{vis.visitTime}</div>
                    </td>
                    <td className="p-4 text-neutral-700 dark:text-neutral-300 text-xs font-medium">
                      <div className="font-semibold">{vis.visitorsCount} Person(s)</div>
                      {vis.transportNeeded && (
                        <span className="inline-block mt-1 text-[10px] bg-neutral-900/5 dark:bg-white/10 text-neutral-800 dark:text-neutral-200 border border-neutral-900/10 dark:border-white/15 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider backdrop-blur-xs">
                          Cab Needed
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-medium text-xs text-neutral-800 dark:text-neutral-200">{vis.employeeName}</td>
                    <td className="p-4">
                      {vis.status === 'Completed' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 backdrop-blur-md shadow-2xs">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Completed
                        </span>
                      ) : vis.status === 'Revisit' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/25 backdrop-blur-md shadow-2xs">
                          Revisit
                        </span>
                      ) : vis.status === 'Cancelled' || vis.status === 'No-Show' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/25 backdrop-blur-md shadow-2xs">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {vis.status}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/25 backdrop-blur-md shadow-2xs">
                          <Clock className="w-3.5 h-3.5" />
                          {vis.status}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-xs text-neutral-600 dark:text-neutral-400 max-w-xs truncate">
                      {vis.feedback || <span className="italic text-neutral-400 dark:text-neutral-500">Awaiting feedback</span>}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => openFeedbackModal(vis)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100 shadow-sm transition-all duration-150 cursor-pointer active:scale-95"
                      >
                        Record Feedback
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Glassmorphic Record Feedback Modal */}
      {selectedVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-white/85 dark:bg-neutral-900/85 backdrop-blur-2xl border border-white/60 dark:border-white/10 p-6 text-neutral-900 dark:text-neutral-100 space-y-4 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.35)] overflow-hidden">
            {/* Modal ambient glow */}
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between pb-3 border-b border-neutral-200/60 dark:border-white/10">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">Post-Visit Log</span>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">{selectedVisit.leadName}</h3>
              </div>
              <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">{selectedVisit.visitDate}</span>
            </div>
            
            <div className="space-y-3.5 relative z-10">
              <div>
                <label className="block text-xs text-neutral-700 dark:text-neutral-300 mb-1.5 font-semibold">Visit Status</label>
                <select
                  value={visitStatus}
                  onChange={(e) => setVisitStatus(e.target.value as any)}
                  className="w-full bg-white/70 dark:bg-neutral-800/70 backdrop-blur-md border border-neutral-300/80 dark:border-white/15 rounded-xl p-2.5 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                >
                  <option value="Completed">Completed Successfully</option>
                  <option value="Revisit">Revisit (2nd Visit Required)</option>
                  <option value="Rescheduled">Rescheduled</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="No-Show">Customer No-Show</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-neutral-700 dark:text-neutral-300 mb-1.5 font-semibold">Customer Feedback Remarks</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={3}
                  className="w-full bg-white/70 dark:bg-neutral-800/70 backdrop-blur-md border border-neutral-300/80 dark:border-white/15 rounded-xl p-2.5 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                  placeholder="Liked sample flat layout. Concerned about floor level..."
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-700 dark:text-neutral-300 mb-1.5 font-semibold">Booking Conversion Probability</label>
                <select
                  value={bookingProb}
                  onChange={(e) => setBookingProb(e.target.value as any)}
                  className="w-full bg-white/70 dark:bg-neutral-800/70 backdrop-blur-md border border-neutral-300/80 dark:border-white/15 rounded-xl p-2.5 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                >
                  <option value="High">High (Token Expected Soon)</option>
                  <option value="Medium">Medium (Needs 2nd Visit)</option>
                  <option value="Low">Low (Budget / Location Issue)</option>
                </select>
              </div>
            </div>

            <div className="relative z-10 flex justify-end gap-2.5 pt-3 border-t border-neutral-200/60 dark:border-white/10">
              <button
                onClick={() => setSelectedVisit(null)}
                className="px-4 py-2 bg-neutral-200/70 hover:bg-neutral-200 dark:bg-neutral-800/70 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-xl text-xs font-semibold backdrop-blur-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateSubmit}
                className="px-4 py-2 bg-neutral-950 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100 rounded-xl text-xs font-bold shadow-md shadow-neutral-950/20 dark:shadow-white/10 transition-all cursor-pointer active:scale-95"
              >
                Save Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SiteVisitModule;
