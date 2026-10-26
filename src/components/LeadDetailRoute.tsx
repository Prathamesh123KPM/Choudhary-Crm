import React from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { localStore } from '../services/crmService';
import { LeadDrawer } from './LeadDrawer';
import { LeadTable } from './LeadTable';
import { ShieldAlert, ArrowLeft, Users, AlertCircle } from 'lucide-react';

export const LeadDetailRoute: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, isOwner, isTeamLeader, isEmployee, teamMemberUids } = useAuth();

  const lead = localStore.leads.find(l => l.id === id || l.metaLeadId === id);

  if (!lead) {
    return (
      <div className="space-y-4">
        <div className="min-h-[50vh] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 rounded-2xl p-6 text-center space-y-4 shadow-lg">
            <div className="w-12 h-12 mx-auto rounded-full bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center text-neutral-500">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">Lead Not Found</h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                No lead found matching identifier <code className="font-mono text-neutral-700 dark:text-neutral-300 font-bold">{id}</code>.
              </p>
            </div>
            <button
              onClick={() => navigate('/leads')}
              className="px-4 py-2 bg-black hover:bg-neutral-800 text-white dark:bg-white dark:text-black dark:hover:bg-neutral-200 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Leads Table
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Permission Guard for this specific lead:
  let hasPermission = false;
  let denialReason = '';

  if (isOwner) {
    hasPermission = true;
  } else if (isTeamLeader) {
    const isTeamLead = Boolean(lead.assignedEmployeeId && teamMemberUids.includes(lead.assignedEmployeeId)) || lead.assignedEmployeeId === currentUser.uid || !lead.assignedEmployeeId;
    if (isTeamLead) {
      hasPermission = true;
    } else {
      denialReason = `As Team Leader, your access is strictly scoped to Heena's Sales Team. Lead #${lead.id} (${lead.customerName}) is assigned to ${lead.assignedEmployeeName || 'another department'}.`;
    }
  } else {
    // Employee: can view assigned leads or unassigned leads awaiting claim
    if (lead.assignedEmployeeId === currentUser.uid || !lead.assignedEmployeeId) {
      hasPermission = true;
    } else {
      denialReason = `Lead #${lead.id} (${lead.customerName}) is assigned to ${lead.assignedEmployeeName || 'another representative'}. Employees can only access their personally assigned leads.`;
    }
  }

  if (!hasPermission) {
    return (
      <div className="space-y-4">
        <div className="min-h-[50vh] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-black border border-red-200 dark:border-red-900/60 rounded-2xl p-6 text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 mx-auto rounded-full bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 flex items-center justify-center text-red-600 dark:text-red-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-100 text-red-800 dark:bg-red-900/80 dark:text-red-200 uppercase">
                403 Lead Restricted
              </span>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                Unauthorized Lead Access
              </h2>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed mt-1">
                {denialReason}
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => navigate('/leads')}
                className="px-4 py-2 bg-black hover:bg-neutral-800 text-white dark:bg-white dark:text-black dark:hover:bg-neutral-200 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" /> Return to My Accessible Leads
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const context = useOutletContext<{ onOpenNewLeadModal?: () => void }>();

  return (
    <div className="relative">
      <LeadTable
        onSelectLead={(l) => navigate(`/leads/${l.id}`)}
        onOpenNewLeadModal={context?.onOpenNewLeadModal || (() => {})}
      />
      <LeadDrawer
        lead={lead}
        onClose={() => navigate('/leads')}
      />
    </div>
  );
};
