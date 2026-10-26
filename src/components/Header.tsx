import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Building2,
  Bell,
  Users,
  UserCheck,
  ChevronDown,
  ShieldAlert,
  ShieldCheck,
  LogOut,
  Sparkles,
  Search,
  Sun,
  Moon,
  Menu,
  X,
  Plus,
  Crown,
  Check,
  RotateCcw,
  Shield,
  ArrowLeft
} from 'lucide-react';
import NotificationCenter from './NotificationCenter';

interface HeaderProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenNewLeadModal: () => void;
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
  canGoBack?: boolean;
  onGoBack?: () => void;
  previousPageName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenNewLeadModal,
  onToggleMobileMenu,
  isMobileMenuOpen = false,
  canGoBack = false,
  onGoBack,
  previousPageName
}) => {
  const {
    currentUser,
    selectedEmployeeFilter,
    setEmployeeFilter,
    usersList,
    isAdmin,
    isImpersonating,
    realUser,
    stopImpersonation,
    logout
  } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [logoLoadError, setLogoLoadError] = useState(false);

  const accountDropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click or Escape key
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(e.target as Node)) {
        setShowAccountDropdown(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setShowNotificationCenter(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAccountDropdown(false);
        setShowNotificationCenter(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const teamLeaders = usersList.filter(u => u.role === 'team_leader');
  const salesEmployees = usersList.filter(u => u.role === 'employee');
  const selectableUsers = usersList.filter(u => u.role === 'team_leader' || u.role === 'employee');

  return (
    <header className="sticky top-0 z-40 shrink-0 flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 py-2 sm:py-2.5 glass-ios !rounded-none !border-t-0 !border-x-0 border-b text-neutral-900 dark:text-neutral-100 shadow-xs transition-colors duration-200 w-full max-w-full">
      {/* Zone 1: Mobile Hamburger + Brand Logo & Title */}
      <div className="flex items-center gap-2 sm:gap-3 shrink min-w-0">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer shrink-0"
            aria-label="Toggle navigation"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        )}

        <div className="flex items-center justify-center h-9 sm:h-12 w-20 sm:w-28 rounded-lg overflow-hidden shrink-0">
          {!logoLoadError ? (
            <img
              src={theme === 'dark' ? '/logo.webp' : '/logo-black.webp'}
              alt="Choudhary Real Estate Logo"
              className="w-full h-full object-contain"
              onError={() => setLogoLoadError(true)}
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full bg-black text-white dark:bg-white dark:text-black font-extrabold text-sm tracking-wide rounded-lg">
              CE
            </div>
          )}
        </div>
        <div className="hidden sm:block min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold tracking-tight text-neutral-900 dark:text-white whitespace-nowrap">
              Choudhary Real Estate CRM
            </span>
          </div>
          <span className="hidden md:inline-block text-xs font-normal text-neutral-500 dark:text-neutral-400">
            Real Estate Sales & CRM
          </span>
        </div>

        {/* Global Back Button */}
        {canGoBack && onGoBack && (
          <button
            onClick={onGoBack}
            className="flex items-center gap-1.5 px-2.5 py-1 sm:py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-neutral-100 transition-all text-xs font-medium shadow-2xs cursor-pointer group shrink-0 ml-1 sm:ml-2"
            title={previousPageName ? `Back to ${previousPageName} (Alt + ←)` : 'Back to previous page (Alt + ←)'}
            aria-label="Back to last page"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform text-black dark:text-white shrink-0" />
            <span className="hidden sm:inline">Back</span>
            {previousPageName && (
              <span className="hidden xl:inline text-[10px] text-neutral-500 dark:text-neutral-400 font-normal">
                ({previousPageName})
              </span>
            )}
          </button>
        )}
      </div>

      {/* Zone 2: Middle Filter / Employee Switch Mode Indicator */}
      <div className="hidden md:flex items-center gap-2.5">
        {isAdmin ? (
          <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-200">
            <Users className="w-3.5 h-3.5 text-neutral-900 dark:text-white shrink-0" />
            <span className="hidden lg:inline font-medium text-neutral-500 dark:text-neutral-400 whitespace-nowrap">Viewing:</span>
            <select
              value={selectedEmployeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="bg-transparent text-neutral-900 dark:text-white font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-semibold">All Employees (Company Total)</option>
              {teamLeaders.map(tl => (
                <option key={tl.uid} value={tl.uid} className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-bold">
                  {tl.displayName} ({tl.designation || 'Team Leader Choudhary Estate'})
                </option>
              ))}
              {salesEmployees.map(emp => (
                <option key={emp.uid} value={emp.uid} className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white">
                  {emp.displayName} {emp.designation ? `(${emp.designation})` : `(${emp.employeeCode})`}
                </option>
              ))}
            </select>
            {selectedEmployeeFilter !== 'ALL' && (
              <button
                onClick={() => setEmployeeFilter('ALL')}
                className="ml-1 text-[11px] font-bold text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white underline cursor-pointer"
                title="Reset to All Employees"
              >
                Reset
              </button>
            )}
          </div>
        ) : isImpersonating ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-lg px-3 py-1 text-xs text-amber-900 dark:text-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="font-semibold">Impersonating: {currentUser.displayName}</span>
              <span className="text-[10px] font-mono opacity-80">({currentUser.employeeCode || 'REP'})</span>
            </div>
            <button
              onClick={() => stopImpersonation()}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg bg-black text-white dark:bg-white dark:text-black hover:opacity-85 transition-opacity shadow-xs cursor-pointer"
              title="Click to restore Kishan Choudhary (Owner) full admin access"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Back to Owner</span>
            </button>
          </div>
        ) : null}
      </div>

      {/* Zone 3: Quick Action + Theme Toggle + Notifications + Account Switcher */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        <button
          onClick={onOpenNewLeadModal}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl liquid-glass-primary whitespace-nowrap cursor-pointer"
          title="Add New Lead"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Add Lead</span>
        </button>

        {/* Theme Toggle with Liquid Glass Effect */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl liquid-glass-btn text-neutral-800 dark:text-neutral-200 text-xs font-medium cursor-pointer"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? (
            <>
              <Moon className="w-3.5 h-3.5 text-neutral-900" />
              <span className="hidden md:inline text-[11px] font-semibold">Dark Mode</span>
            </>
          ) : (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline text-[11px] font-semibold">Light Mode</span>
            </>
          )}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotificationCenter(!showNotificationCenter)}
            className="p-2 rounded-lg text-neutral-600 hover:text-black dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors relative border border-transparent hover:border-neutral-200 dark:hover:border-neutral-800 cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-black dark:bg-white animate-pulse" />
          </button>
          {showNotificationCenter && (
            <NotificationCenter onClose={() => setShowNotificationCenter(false)} onSelectLead={() => onSelectTab('leads')} />
          )}
        </div>

        {/* User Account Switcher Dropdown */}
        <div className="relative" ref={accountDropdownRef}>
          <button
            onClick={() => setShowAccountDropdown(!showAccountDropdown)}
            className="flex items-center gap-2 p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 transition-colors cursor-pointer"
            title="Click to switch between Owner, Manager, and Sales Reps"
          >
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.displayName}
              className="w-6 h-6 rounded-full object-cover border border-neutral-300 dark:border-neutral-700"
            />
            <span className="hidden md:inline text-xs font-semibold text-neutral-900 dark:text-white max-w-[120px] truncate">
              {currentUser.displayName}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
          </button>

          {showAccountDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl p-2.5 z-50 animate-fadeIn">
              {/* Active Profile Header */}
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200/70 dark:border-neutral-800 mb-2">
                <div className="flex items-center gap-2.5">
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.displayName}
                    className="w-10 h-10 rounded-full object-cover border border-neutral-300 dark:border-neutral-700 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">{currentUser.displayName}</p>
                      <span className="text-[10px] font-mono text-neutral-400 font-bold ml-1">{currentUser.employeeCode}</span>
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono truncate">{currentUser.email}</p>
                    <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-black text-white dark:bg-white dark:text-black">
                      {currentUser.designation || (isAdmin ? 'Admin' : `Sales Rep (${currentUser.employeeCode})`)}
                    </span>
                  </div>
                </div>

              </div>

              {/* Impersonation Status Notice (If Owner is currently impersonating) */}
              {isImpersonating && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl text-xs space-y-2 mb-2">
                  <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-200 font-bold">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>Owner Impersonation Active</span>
                  </div>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300/90 leading-relaxed">
                    Viewing CRM as <strong>{currentUser.displayName}</strong>. Session authorized by Owner <strong>({realUser?.displayName || 'Kishan Choudhary'})</strong>.
                  </p>
                  <button
                    onClick={async () => {
                      setShowAccountDropdown(false);
                      await stopImpersonation();
                      onSelectTab('dashboard');
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                  >
                    <Crown className="w-3.5 h-3.5" />
                    <span>Exit Impersonation (Return to Owner)</span>
                  </button>
                </div>
              )}

              {/* Security Status Tag */}
              {!isImpersonating && (
                <div className="p-2.5 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200/70 dark:border-neutral-800 text-[11px] text-neutral-600 dark:text-neutral-400 flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-semibold text-neutral-900 dark:text-neutral-200 block">Authenticated Session</span>
                    <span className="text-[10px] text-neutral-400">Password-Protected • Bcrypt Secured</span>
                  </div>
                </div>
              )}

              {/* Logout Option */}
              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  onClick={() => {
                    setShowAccountDropdown(false);
                    logout();
                    onSelectTab('dashboard');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors text-left cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
