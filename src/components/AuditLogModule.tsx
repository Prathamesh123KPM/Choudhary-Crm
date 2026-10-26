import React from 'react';
import { localStore } from '../services/crmService';
import { History, Shield, User, Clock } from 'lucide-react';

export const AuditLogModule: React.FC = () => {
  const logs = localStore.activityLogs;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs transition-colors">
        <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2 uppercase tracking-wide">
          System Immutable Audit Trail
        </h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
          Complete security and operational logs of lead transfers, status modifications, site visit updates, and booking approvals.
        </p>
      </div>

      {/* Audit Logs Stream */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xs transition-colors">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/75 dark:bg-neutral-950">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">Activity Stream ({logs.length} Events)</h3>
        </div>

        <div className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
          {logs.map(log => (
            <div key={log.id} className="p-4 hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors text-sm space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-neutral-900 dark:text-white font-mono text-base">{log.eventType}</span>
                <span className="text-sm text-neutral-500 dark:text-neutral-400 font-mono">
                  {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                </span>
              </div>
              <p className="text-neutral-800 dark:text-neutral-200 font-medium text-sm">{log.description}</p>
              <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400 font-mono pt-0.5">
                <span>Actor: {log.actorName} ({log.actorRole})</span>
                {log.leadId && <span>Lead ID: {log.leadId}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AuditLogModule;
