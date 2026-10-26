import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, Crown, ArrowLeft, ShieldAlert } from 'lucide-react';

export const ImpersonationBanner: React.FC = () => {
  const { isImpersonating, currentUser, realUser, stopImpersonation } = useAuth();
  const navigate = useNavigate();

  if (!isImpersonating) {
    return null;
  }

  return (
    <div
      role="banner"
      aria-label="Owner Impersonation Banner"
      className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white px-4 py-2.5 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3 text-xs z-50 transition-all border-b border-amber-800/40"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-7 h-7 rounded-lg bg-black/20 flex items-center justify-center shrink-0">
          <Eye className="w-4 h-4 text-white animate-pulse" />
        </div>
        <div className="min-w-0">
          <div className="font-bold tracking-tight text-white flex items-center gap-2 flex-wrap">
            <span>Viewing as:</span>
            <span className="bg-black/30 px-2 py-0.5 rounded font-extrabold underline decoration-white/50">
              {currentUser.displayName}
            </span>
            <span className="font-mono text-[11px] bg-white/20 px-1.5 py-0.5 rounded font-bold">
              {currentUser.employeeCode || currentUser.role}
            </span>
            <span className="opacity-90 hidden md:inline">
              — {currentUser.designation || 'Sales Executive'}
            </span>
          </div>
          <div className="text-[11px] text-amber-100 flex items-center gap-1.5 mt-0.5">
            <ShieldAlert className="w-3 h-3 text-white shrink-0" />
            <span>
              Authorized by Owner <strong>({realUser?.displayName || 'Kishan Choudhary'})</strong> • All actions are audit-logged on the server
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={async () => {
          await stopImpersonation();
          navigate('/dashboard', { replace: true });
        }}
        className="w-full sm:w-auto px-4 py-1.5 rounded-lg bg-black text-white hover:bg-neutral-900 active:scale-98 transition-all font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm shrink-0 cursor-pointer border border-white/20"
      >
        <Crown className="w-3.5 h-3.5 text-amber-400" />
        <span>Exit Impersonation (Return to Owner)</span>
      </button>
    </div>
  );
};

export default ImpersonationBanner;
