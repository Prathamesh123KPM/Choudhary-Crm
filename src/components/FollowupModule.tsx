import React, { useState, useEffect } from 'react';
import { Followup, Lead } from '../types/crm';
import { useAuth } from '../context/AuthContext';
import { completeFollowup, localStore } from '../services/crmService';
import { getTodayIST, getEmployeeFollowups, getEmployeePerformanceMetrics } from '../utils/crmMetrics';
import { Calendar, Clock, CheckCircle2, Phone, MessageSquare, AlertTriangle, Plus, ExternalLink } from 'lucide-react';

interface FollowupModuleProps {
  onSelectLead?: (lead: Lead) => void;
}

export const FollowupModule: React.FC<FollowupModuleProps> = ({ onSelectLead }) => {
  const { currentUser, selectedEmployeeFilter, isAdmin, isOwner, isTeamLeader, teamMemberUids } = useAuth();
  const [filterMode, setFilterMode] = useState<'today' | 'overdue' | 'upcoming' | 'all'>('today');
  const [selectedFollowup, setSelectedFollowup] = useState<Followup | null>(null);
  const [outcomeText, setOutcomeText] = useState('');
  const [, setTick] = useState(0);

  useEffect(() => {
    return localStore.subscribe(() => setTick(t => t + 1));
  }, []);

  const todayStr = getTodayIST();
  const targetEmployeeId = selectedEmployeeFilter !== 'ALL' ? selectedEmployeeFilter : (isOwner ? 'ALL' : currentUser.uid);

  // Shared unified metrics and followups
  const metrics = getEmployeePerformanceMetrics(targetEmployeeId);
  const allFollowups = getEmployeeFollowups(targetEmployeeId);

  const dueTodayCount = metrics.dueTodayFollowupsCount;
  const overdueCount = metrics.overdueFollowupsCount;

  let followups = allFollowups;

  if (filterMode === 'today') {
    followups = followups.filter(f => f.scheduledDate === todayStr && f.status !== 'Completed');
  } else if (filterMode === 'overdue') {
    followups = followups.filter(f => f.scheduledDate < todayStr && f.status !== 'Completed');
  } else if (filterMode === 'upcoming') {
    followups = followups.filter(f => f.scheduledDate > todayStr && f.status !== 'Completed');
  }

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

  const handleCompleteSubmit = async () => {
    if (selectedFollowup && outcomeText.trim()) {
      const actor = { id: currentUser.uid, name: currentUser.displayName, role: currentUser.role };
      await completeFollowup(selectedFollowup.id, outcomeText, actor, selectedFollowup.leadId);
      setSelectedFollowup(null);
      setOutcomeText('');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs transition-colors duration-200">
        <div>
          <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            Follow-up Task Manager
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Never miss a customer callback. Track scheduled calls, meetings, and WhatsApp follow-ups.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterMode('today')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filterMode === 'today' ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs' : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800'}`}
          >
            Due Today ({dueTodayCount})
          </button>
          <button
            onClick={() => setFilterMode('overdue')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filterMode === 'overdue' ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs' : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800'}`}
          >
            Overdue ({overdueCount})
          </button>
          <button
            onClick={() => setFilterMode('upcoming')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filterMode === 'upcoming' ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs' : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800'}`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filterMode === 'all' ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs' : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800'}`}
          >
            All History
          </button>
        </div>
      </div>

      {/* Followups List */}
      <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 font-bold uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-800 text-sm">
              <tr>
                <th className="p-3.5">Customer & Phone</th>
                <th className="p-3.5">Follow-up Type</th>
                <th className="p-3.5">Scheduled Date & Time</th>
                <th className="p-3.5">Assigned Employee</th>
                <th className="p-3.5">Action Item / Notes</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Complete Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-neutral-800 dark:text-neutral-200 text-sm">
              {followups.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-neutral-400 dark:text-neutral-500 text-sm">
                    No follow-ups found for the selected filter.
                  </td>
                </tr>
              ) : (
                followups.map(fol => (
                  <tr key={fol.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <td className="p-3.5">
                      <button
                        onClick={() => handleLeadClick(fol.leadId, fol.leadPhone, fol.leadName)}
                        className="text-left group/lead cursor-pointer"
                        title="Click to view 360° Lead Details"
                      >
                        <div className="font-bold text-neutral-900 dark:text-white group-hover/lead:underline flex items-center gap-1.5 text-base">
                          <span>{fol.leadName}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-neutral-400 group-hover/lead:text-black dark:group-hover/lead:text-white transition-colors" />
                        </div>
                        <div className="font-mono text-neutral-500 dark:text-neutral-400 text-sm mt-0.5">{fol.leadPhone}</div>
                      </button>
                    </td>
                    <td className="p-3.5">
                      <span className="font-semibold text-neutral-900 dark:text-white text-sm">{fol.type}</span>
                    </td>
                    <td className="p-3.5 font-mono text-neutral-700 dark:text-neutral-300 whitespace-nowrap text-sm">
                      {fol.scheduledDate} {fol.scheduledTime || ''}
                    </td>
                    <td className="p-3.5 font-medium text-neutral-800 dark:text-neutral-200 text-sm">{fol.employeeName}</td>
                    <td className="p-3.5 text-neutral-600 dark:text-neutral-400 max-w-xs truncate text-sm">
                      {fol.notes || 'Routine follow-up call'}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded text-sm font-bold ${
                        fol.status === 'Completed'
                          ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700'
                          : fol.scheduledDate < todayStr
                          ? 'bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white animate-pulse'
                          : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-800'
                      }`}>
                        {fol.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      {fol.status !== 'Completed' ? (
                        <button
                          onClick={() => setSelectedFollowup(fol)}
                          className="px-3 py-1.5 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black rounded-lg text-sm font-semibold shadow-xs cursor-pointer"
                        >
                          Mark Completed
                        </button>
                      ) : (
                        <span className="text-sm text-neutral-500 font-semibold italic">Done</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Complete Followup Modal */}
      {selectedFollowup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 text-neutral-900 dark:text-white space-y-3 shadow-2xl">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Complete Follow-up for {selectedFollowup.leadName}</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Record the call discussion outcome:</p>
            <textarea
              value={outcomeText}
              onChange={(e) => setOutcomeText(e.target.value)}
              rows={3}
              className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded p-2 text-xs text-neutral-900 dark:text-white"
              placeholder="e.g. Spoke with customer. He confirmed site visit for Saturday 11 AM..."
            />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setSelectedFollowup(null)} className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded text-xs font-medium">
                Cancel
              </button>
              <button onClick={handleCompleteSubmit} disabled={!outcomeText.trim()} className="px-3 py-1.5 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black rounded text-xs font-bold disabled:opacity-50">
                Save Outcome
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FollowupModule;
