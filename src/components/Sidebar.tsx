import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard,
  CalendarCheck2,
  Inbox,
  Users,
  CalendarCheck,
  MapPin,
  CheckCircle2,
  Building,
  BarChart3,
  UserCheck2,
  Share2,
  Settings,
  History,
  X
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  unassignedCount: number;
  todayFollowupsCount: number;
  todayWorkCount?: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  unassignedCount,
  todayFollowupsCount,
  todayWorkCount,
  isOpenMobile = false,
  onCloseMobile
}) => {
  const { isOwner, isTeamLeader, isEmployee, currentUser } = useAuth();
  const { theme } = useTheme();

  const leadsLabel = isOwner
    ? 'All Leads (Company)'
    : isTeamLeader
    ? 'Team Leads (Sales)'
    : 'My Leads';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'work', label: "Today's Work", icon: CalendarCheck2, badge: todayWorkCount && todayWorkCount > 0 ? todayWorkCount : undefined, badgeColor: 'bg-emerald-600' },
    { id: 'leads', label: leadsLabel, icon: Users },
    { id: 'inbox', label: 'New Leads Inbox', icon: Inbox, badge: unassignedCount > 0 ? unassignedCount : undefined, badgeColor: 'bg-blue-600' },
    { id: 'followups', label: 'Follow-ups', icon: CalendarCheck, badge: todayFollowupsCount > 0 ? todayFollowupsCount : undefined, badgeColor: 'bg-amber-600' },
    { id: 'visits', label: 'Site Visits', icon: MapPin },
    { id: 'bookings', label: 'Bookings', icon: CheckCircle2 },
    { id: 'projects', label: 'Projects & Inventory', icon: Building },
    // Team Leader & Owner see Performance & Reports
    ...((isOwner || isTeamLeader)
      ? [
          { id: 'team', label: isOwner ? 'Sales Team Performance' : "My Team's Performance", icon: UserCheck2 },
          { id: 'reports', label: 'Analytics & Reports', icon: BarChart3 }
        ]
      : []),
    // Strictly Owner ONLY: Meta Integration and Audit Logs (Forbidden to Team Leaders & Employees)
    ...(isOwner
      ? [
          { id: 'meta', label: 'Meta Lead Integration', icon: Share2 },
          { id: 'audit', label: 'Audit Logs', icon: History }
        ]
      : [])
  ];

  const handleTabClick = (tabId: string) => {
    onSelectTab(tabId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation (Desktop Static / Mobile Slide-Over) */}
      <aside
        className={`fixed lg:static inset-y-0 lg:inset-auto left-0 z-50 lg:z-30 h-full w-72 lg:w-64 shrink-0 bg-white dark:bg-black border-r border-neutral-200 dark:border-neutral-800 flex flex-col justify-between p-4 select-none transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Mobile Header Inside Drawer */}
        <div className="flex lg:hidden items-center justify-between pb-3 mb-2 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="h-8 w-20 flex items-center justify-center overflow-hidden">
              <img
                src={theme === 'dark' ? '/logo.webp' : '/logo-black.webp'}
                alt="Choudhary Estate Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-bold text-xs text-neutral-900 dark:text-white">
              Menu
            </span>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="space-y-1 flex-1 overflow-y-auto overscroll-contain">
          <p className="px-3 text-[11px] uppercase tracking-wider font-medium text-neutral-400 dark:text-neutral-500 mb-2">
            Navigation
          </p>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white dark:text-black' : 'text-neutral-500 dark:text-neutral-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className={`px-1.5 py-0.5 rounded text-[11px] font-normal font-mono transition-colors ${
                    isActive
                      ? 'bg-white/20 text-white dark:bg-black/20 dark:text-black'
                      : 'text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-300'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="pt-3 border-t border-neutral-100 dark:border-neutral-900 shrink-0 px-3 flex items-center justify-between text-[11px] text-neutral-400">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-neutral-500 dark:text-neutral-400">Webhook Active</span>
          </span>
          <span className="font-mono text-[10px] text-neutral-400">Palghar</span>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
