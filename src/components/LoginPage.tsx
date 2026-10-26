import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  Sun,
  Moon,
  ArrowRight,
  KeyRound,
  Mail,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await login(identifier, password);
      if (result.success) {
        navigate('/dashboard', { replace: true });
      } else {
        setError(result.error || 'Authentication failed');
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (idVal: string, passVal: string) => {
    setIdentifier(idVal);
    setPassword(passVal);
    setError(null);
    setLoading(true);
    try {
      const result = await login(idVal, passVal);
      if (result.success) {
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-neutral-100 dark:bg-black text-neutral-900 dark:text-neutral-100 flex flex-col justify-between font-sans transition-colors duration-200">
      {/* Top Navbar */}
      <header className="w-full flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-black/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="h-10 w-24 sm:w-28 flex items-center justify-center shrink-0 overflow-hidden">
            <img
              src={theme === 'dark' ? '/logo.webp' : '/logo-black.webp'}
              alt="Choudhary Real Estate CRM"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-neutral-900 dark:text-white">
              Choudhary Real Estate CRM
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400">
              Enterprise
            </span>
          </div>
        </div>

        {/* Clear Theme Toggle */}
        <button
          onClick={toggleTheme}
          type="button"
          aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 hover:border-black dark:hover:border-white transition-all text-xs font-semibold shadow-2xs cursor-pointer"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-neutral-700" />
              <span>Dark Mode</span>
            </>
          )}
        </button>
      </header>

      {/* Main Login Card Center */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-10">
        <div className="w-full max-w-md bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-xl transition-all">
          
          {/* Logo & Unified Heading */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="h-16 w-40 sm:w-48 mb-3 flex items-center justify-center overflow-hidden">
              <img
                src={theme === 'dark' ? '/logo.webp' : '/logo-black.webp'}
                alt="Choudhary Real Estate CRM"
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
              Sign In to Choudhary Real Estate CRM
            </h1>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 max-w-xs">
              Real Estate Sales Pipeline & Lead Management Portal
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className={`mb-4 p-3 rounded-lg border text-xs font-medium flex items-center gap-2.5 ${
              error.toLowerCase().includes('locked')
                ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200 shadow-xs'
                : 'bg-neutral-100 dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white'
            }`}>
              {error.toLowerCase().includes('locked') ? (
                <ShieldCheck className="w-4 h-4 text-red-600 shrink-0" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
              )}
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-identifier" className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                User ID / Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="login-identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter User ID or Email"
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-xs text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white underline-offset-2 hover:underline cursor-pointer font-medium"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-black text-white dark:bg-white dark:text-black font-bold text-sm hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all shadow-md disabled:opacity-50 cursor-pointer mt-2"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Sign-In & Credential Assistant */}
          <div className="mt-6 pt-5 border-t border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                Authorized Team Sign In
              </p>
              <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                1-Click Access
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('kishan', 'Choudhary@2026!')}
                className="p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 hover:border-black dark:hover:border-white transition-all text-left group cursor-pointer"
              >
                <div className="font-bold text-neutral-900 dark:text-white group-hover:underline flex items-center gap-1">
                  <span>👑 Kishan</span>
                </div>
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Owner
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('heena', 'Heena#Palghar26')}
                className="p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 hover:border-black dark:hover:border-white transition-all text-left group cursor-pointer"
              >
                <div className="font-bold text-neutral-900 dark:text-white group-hover:underline flex items-center gap-1">
                  <span>⚡ Heena</span>
                </div>
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Team Leader
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('surendra', 'Surendra$CRM26')}
                className="p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 hover:border-black dark:hover:border-white transition-all text-left group cursor-pointer"
              >
                <div className="font-bold text-neutral-900 dark:text-white group-hover:underline">
                  Surendra
                </div>
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  CRM & Mgmt
                </div>
              </button>
            </div>
          </div>

          {/* Security Claim - Secure login */}
          <div className="mt-5 text-center text-xs text-neutral-500 dark:text-neutral-400 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-semibold">Secure login</span>
          </div>
        </div>
      </main>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                    Password Reset Assistance
                  </h3>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Choudhary Real Estate CRM
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-neutral-600 dark:text-neutral-300">
              <p>
                To maintain enterprise security and audit integrity, employee credentials cannot be self-reset via email. Please reach out to your system administrator or team lead:
              </p>

              <div className="space-y-2 p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-neutral-900 dark:text-white">
                      Kishan Choudhary (Owner & Admin)
                    </div>
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3" /> kishan@choudharyestate.com
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700/60 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-neutral-900 dark:text-white">
                      Heena (Team Leader)
                    </div>
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3" /> heena@choudharyestate.com
                    </div>
                  </div>
                </div>
              </div>

              {import.meta.env.DEV && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                  Tip: In DEV mode, you can close this and click any quick-login button below the login form.
                </p>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-neutral-200 dark:border-neutral-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                className="px-4 py-2 rounded-lg bg-black text-white dark:bg-white dark:text-black font-semibold text-xs hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer"
              >
                Understood, Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login Page Footer - Consistent Brand */}
      <footer className="w-full py-4 px-6 text-center text-xs text-neutral-500 dark:text-neutral-400 border-t border-neutral-200 dark:border-neutral-800">
        © {new Date().getFullYear()} Choudhary Real Estate CRM. All rights reserved.
      </footer>
    </div>
  );
};

export default LoginPage;
