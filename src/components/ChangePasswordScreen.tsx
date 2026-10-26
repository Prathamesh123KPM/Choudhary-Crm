import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Lock, KeyRound, ShieldAlert, CheckCircle2, ArrowRight, Eye, EyeOff, LogOut, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ChangePasswordScreen: React.FC = () => {
  const { currentUser, changePassword, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanCurrent = currentPassword.trim();
    const cleanNew = newPassword.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanCurrent) {
      setError('Please enter your current temporary password.');
      return;
    }

    if (!cleanNew) {
      setError('Please enter your new password.');
      return;
    }

    if (cleanNew.toLowerCase() === 'admin') {
      setError("The password 'admin' is permanently disabled. Please choose a strong, unique password.");
      return;
    }

    if (cleanNew.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (cleanNew !== cleanConfirm) {
      setError('New password and confirmation do not match.');
      return;
    }

    if (cleanNew === cleanCurrent) {
      setError('New password must be different from your current temporary password.');
      return;
    }

    setLoading(true);
    try {
      const res = await changePassword(cleanCurrent, cleanNew);
      if (res.success) {
        navigate('/dashboard', { replace: true });
      } else {
        setError(res.error || 'Failed to update password. Please check your current password.');
      }
    } catch (err: any) {
      setError(err?.message || 'A network error occurred while updating password.');
    } finally {
      setLoading(false);
    }
  };

  const isLengthValid = newPassword.length >= 8;
  const isNotAdmin = newPassword.length > 0 && newPassword.toLowerCase() !== 'admin';
  const isMatching = Boolean(newPassword && confirmPassword && newPassword === confirmPassword);

  return (
    <div className="min-h-screen w-full bg-neutral-100 dark:bg-black text-neutral-900 dark:text-neutral-100 flex flex-col justify-between font-sans transition-colors duration-200">
      {/* Top Bar */}
      <header className="w-full flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-black/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="h-10 w-24 sm:w-28 flex items-center justify-center shrink-0 overflow-hidden">
            <img
              src={theme === 'dark' ? '/logo.webp' : '/logo-black.webp'}
              alt="Choudhary Real Estate Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-neutral-900 dark:text-white">
              Choudhary Estate CRM
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400">
              Security Action Required
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 hover:border-black dark:hover:border-white transition-all text-xs font-semibold cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-white" /> : <Moon className="w-3.5 h-3.5 text-neutral-900" />}
            <span className="hidden sm:inline">{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>

          {/* Logout button */}
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 hover:bg-red-100 transition-all text-xs font-semibold cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Center Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-10">
        <div className="w-full max-w-lg bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-xl transition-all">
          
          {/* Header Icon & Title */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mb-3 text-amber-600 dark:text-amber-400">
              <KeyRound className="w-6 h-6" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-neutral-900 dark:text-neutral-50">
              Set Your Secure Password
            </h1>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1.5 max-w-sm">
              Welcome, <strong className="text-neutral-900 dark:text-white">{currentUser?.displayName || 'User'}</strong> ({currentUser?.employeeCode || currentUser?.role}).
              The default <code className="bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded font-mono text-red-500 font-bold">admin</code> password has been permanently disabled. Please set a new password to secure your CRM account.
            </p>
          </div>

          {/* Security Alert Banner */}
          <div className="mb-5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div>
              <div className="font-bold">Mandatory Password Update</div>
              <div className="text-[11px] text-amber-800 dark:text-amber-300/80 mt-0.5">
                Passwords must be at least 8 characters long and are encrypted with bcrypt on the server.
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-300 dark:border-red-900/50 text-xs text-red-700 dark:text-red-300 font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Password Change Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current Temporary Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                Current Temporary Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                  className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                New Password (Min 8 Characters)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Create new password"
                  required
                  className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showNew ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                />
              </div>
            </div>

            {/* Security Requirements Checklist */}
            <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className={`w-3.5 h-3.5 ${isLengthValid ? 'text-emerald-500' : 'text-neutral-400'}`} />
                <span className={isLengthValid ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-neutral-500'}>
                  At least 8 characters
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className={`w-3.5 h-3.5 ${isNotAdmin ? 'text-emerald-500' : 'text-neutral-400'}`} />
                <span className={isNotAdmin ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-neutral-500'}>
                  Cannot be 'admin' or trivial passwords
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className={`w-3.5 h-3.5 ${isMatching ? 'text-emerald-500' : 'text-neutral-400'}`} />
                <span className={isMatching ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-neutral-500'}>
                  New passwords match
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !isLengthValid || !isMatching || !isNotAdmin}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-black text-white dark:bg-white dark:text-black font-bold text-sm hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all shadow-md disabled:opacity-50 cursor-pointer mt-2"
            >
              {loading ? (
                <span>Securing Account...</span>
              ) : (
                <>
                  <span>Save Password & Open CRM</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 px-6 text-center text-xs text-neutral-400 dark:text-neutral-500 border-t border-neutral-200 dark:border-neutral-800">
        © {new Date().getFullYear()} Choudhary Estate Realty CRM • End-to-End Encrypted Auth
      </footer>
    </div>
  );
};

export default ChangePasswordScreen;
