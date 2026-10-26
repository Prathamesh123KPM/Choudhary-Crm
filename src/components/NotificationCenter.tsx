import React, { useState, useEffect } from 'react';
import { localStore } from '../services/crmService';
import { NotificationItem } from '../types/crm';
import { Bell, Check, X, ExternalLink } from 'lucide-react';

interface NotificationCenterProps {
  onClose: () => void;
  onSelectLead: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onClose, onSelectLead }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(localStore.notifications);

  useEffect(() => {
    const unsub = localStore.subscribe(() => {
      setNotifications([...localStore.notifications]);
    });
    return unsub;
  }, []);

  const markAllRead = () => {
    localStore.notifications.forEach(n => (n.read = true));
    localStore.notify();
  };

  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl z-50 p-3 overflow-hidden text-neutral-900 dark:text-neutral-100">
      <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800 mb-2">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-neutral-900 dark:text-white" />
          <h4 className="text-xs font-bold text-neutral-900 dark:text-white">System Notifications</h4>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={markAllRead}
            className="text-[10px] text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white font-semibold cursor-pointer underline"
          >
            Mark all read
          </button>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {notifications.length === 0 ? (
          <p className="text-xs text-neutral-500 text-center py-4">No notifications right now.</p>
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              className={`p-2.5 rounded-lg border transition-colors ${
                n.read
                  ? 'bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                  : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white font-medium'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <h5 className="text-xs font-bold text-neutral-900 dark:text-white">{n.title}</h5>
                <span className="text-[10px] text-neutral-400 whitespace-nowrap font-mono">
                  {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-[11px] text-neutral-700 dark:text-neutral-300 mt-1 leading-snug">{n.message}</p>
              {n.linkLeadId && (
                <button
                  onClick={() => {
                    onSelectLead();
                    onClose();
                  }}
                  className="mt-2 text-[10px] font-bold text-black dark:text-white hover:underline flex items-center gap-1 cursor-pointer"
                >
                  View Lead Details <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
