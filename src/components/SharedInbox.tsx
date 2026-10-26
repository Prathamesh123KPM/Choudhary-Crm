import React, { useState } from 'react';
import { Lead } from '../types/crm';
import { useAuth } from '../context/AuthContext';
import { assignLead, localStore } from '../services/crmService';
import { Inbox, UserPlus, Clock, Sparkles, Filter, CheckCircle2 } from 'lucide-react';
import { LeadSourceBadge } from './LeadSourceBadge';

interface SharedInboxProps {
  onSelectLead: (lead: Lead) => void;
}

export const SharedInbox: React.FC<SharedInboxProps> = ({ onSelectLead }) => {
  const { currentUser, usersList, isAdmin } = useAuth();
  const [selectedLeadForAssign, setSelectedLeadForAssign] = useState<Lead | null>(null);
  const [targetEmpId, setTargetEmpId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(24);

  const rawUnassigned = (localStore.leads || []).filter(l => l && (!l.assignedEmployeeId || l.assignedEmployeeId === ''));
  const unassignedLeads = rawUnassigned.filter(l => {
    if (!searchQuery || !searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    const cleanDigits = q.replace(/\D/g, '');
    const name = String(l.customerName || (l as any).name || '').toLowerCase();
    const phoneRaw = String(l.phone || '');
    const phoneDigits = phoneRaw.replace(/\D/g, '');
    const project = String(l.projectName || '').toLowerCase();

    return (
      name.includes(q) ||
      phoneRaw.toLowerCase().includes(q) ||
      (cleanDigits.length > 0 && phoneDigits.includes(cleanDigits)) ||
      project.includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(unassignedLeads.length / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedUnassigned = unassignedLeads.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);

  const handleClaimLead = async (lead: Lead) => {
    const actor = { id: currentUser.uid, name: currentUser.displayName, role: currentUser.role };
    await assignLead(lead.id, currentUser.uid, currentUser.displayName, actor);
  };

  const handleAssignToEmp = async () => {
    if (selectedLeadForAssign && targetEmpId) {
      const emp = usersList.find(u => u.uid === targetEmpId);
      if (emp) {
        const actor = { id: currentUser.uid, name: currentUser.displayName, role: currentUser.role };
        await assignLead(selectedLeadForAssign.id, emp.uid, emp.displayName, actor);
        setSelectedLeadForAssign(null);
      }
    }
  };

  const toggleAutoAssign = () => {
    localStore.metaIntegration.autoAssignmentEnabled = !localStore.metaIntegration.autoAssignmentEnabled;
    localStore.notify();
  };

  return (
    <div className="space-y-4">
      {/* Inbox Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs transition-colors duration-200">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white">
            <Inbox className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              Shared New Leads Inbox
              <span className="px-2 py-0.5 bg-black text-white dark:bg-white dark:text-black text-xs rounded-full font-bold">
                {unassignedLeads.length} Unassigned
              </span>
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Live incoming Lead Ads & web inquiries awaiting sales representative assignment.
            </p>
          </div>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-3 bg-neutral-50 dark:bg-neutral-900 p-2 rounded-lg border border-neutral-200 dark:border-neutral-800">
            <div className="text-xs">
              <span className="text-neutral-500 dark:text-neutral-400 font-medium">Round Robin Auto-Assign:</span>
              <span className={`ml-2 font-bold ${localStore.metaIntegration.autoAssignmentEnabled ? 'text-black dark:text-white' : 'text-neutral-400'}`}>
                {localStore.metaIntegration.autoAssignmentEnabled ? 'ENABLED' : 'PAUSED'}
              </span>
            </div>
            <button
              onClick={toggleAutoAssign}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${
                localStore.metaIntegration.autoAssignmentEnabled
                  ? 'bg-neutral-800 hover:bg-neutral-900 text-white dark:bg-neutral-200 dark:text-black'
                  : 'bg-black hover:bg-neutral-800 text-white dark:bg-white dark:text-black'
              }`}
            >
              {localStore.metaIntegration.autoAssignmentEnabled ? 'Pause Auto-Assign' : 'Enable Auto-Assign'}
            </button>
          </div>
        )}
      </div>

      {/* Search and count toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search inbox leads by name, phone, project..."
            className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg pl-3 pr-8 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black dark:hover:text-white text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 self-end sm:self-auto">
          <span>Showing {unassignedLeads.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1} - {Math.min(safeCurrentPage * pageSize, unassignedLeads.length)} of {unassignedLeads.length}</span>
        </div>
      </div>

      {/* Unassigned Leads Grid */}
      {unassignedLeads.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs">
          <CheckCircle2 className="w-10 h-10 text-neutral-900 dark:text-white mx-auto mb-3" />
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white">All Caught Up!</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">There are currently no unassigned leads matching your query.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedUnassigned.map(lead => (
              <div
                key={lead.id}
                className="p-4 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 hover:border-black dark:hover:border-white rounded-xl shadow-xs transition-all space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-neutral-900 dark:text-white cursor-pointer hover:underline" onClick={() => onSelectLead(lead)}>
                      {lead.customerName}
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">{lead.phone}</p>
                  </div>
                  <LeadSourceBadge source={lead.source} />
                </div>

                <div className="text-sm text-neutral-800 dark:text-neutral-200 space-y-1.5 bg-neutral-50 dark:bg-neutral-900 p-3 rounded-lg border border-neutral-200 dark:border-neutral-800">
                  <p><span className="text-neutral-500 dark:text-neutral-400">Project:</span> {lead.projectName || 'Jeevika Heights'}</p>
                  <p><span className="text-neutral-500 dark:text-neutral-400">Property:</span> {lead.propertyType || '2 BHK'}</p>
                  <p><span className="text-neutral-500 dark:text-neutral-400">Time Ingested:</span> <span className="font-mono">{new Date(lead.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></p>
                </div>

                {lead.notes && (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 italic line-clamp-2">
                    "{lead.notes}"
                  </p>
                )}

                <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onSelectLead(lead)}
                    className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white cursor-pointer"
                  >
                    Preview Details
                  </button>

                  <div className="flex items-center gap-2">
                    {isAdmin ? (
                      <button
                        onClick={() => setSelectedLeadForAssign(lead)}
                        className="px-3.5 py-1.5 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black rounded-lg text-sm font-semibold shadow-xs cursor-pointer"
                      >
                        Assign to Employee
                      </button>
                    ) : (
                      <button
                        onClick={() => handleClaimLead(lead)}
                        className="px-3.5 py-1.5 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black rounded-lg text-sm font-semibold shadow-xs cursor-pointer"
                      >
                        Claim Lead
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs">
              <span className="text-neutral-500">
                Page <strong className="text-neutral-900 dark:text-white">{safeCurrentPage}</strong> of <strong className="text-neutral-900 dark:text-white">{totalPages}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={safeCurrentPage <= 1}
                  className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 disabled:opacity-40 cursor-pointer"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={safeCurrentPage >= totalPages}
                  className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 disabled:opacity-40 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Admin Assign Modal */}
      {selectedLeadForAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 text-neutral-900 dark:text-white space-y-3 shadow-2xl">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Assign Lead: {selectedLeadForAssign.customerName}</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Choose sales representative to assign ownership:</p>

            <select
              value={targetEmpId}
              onChange={(e) => setTargetEmpId(e.target.value)}
              className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 text-xs text-neutral-900 dark:text-white"
            >
              <option value="">Select Employee / Team Leader...</option>
              {usersList.filter(u => u.role === 'employee' || u.role === 'team_leader').map(emp => (
                <option key={emp.uid} value={emp.uid}>
                  {emp.displayName} ({emp.designation || emp.employeeCode})
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setSelectedLeadForAssign(null)} className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded text-xs font-medium">
                Cancel
              </button>
              <button onClick={handleAssignToEmp} disabled={!targetEmpId} className="px-3 py-1.5 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black rounded text-xs font-bold disabled:opacity-50">
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SharedInbox;
