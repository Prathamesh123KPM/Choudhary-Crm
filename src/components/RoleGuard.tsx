import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft, Home, Lock } from 'lucide-react';

interface RoleGuardProps {
  allowedRoles: ('owner' | 'team_leader' | 'employee')[];
  moduleTitle?: string;
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRoles,
  moduleTitle = 'This Module',
  children
}) => {
  const { currentUser, isOwner, isTeamLeader, isEmployee } = useAuth();
  const navigate = useNavigate();

  const userRole = isOwner ? 'owner' : isTeamLeader ? 'team_leader' : 'employee';
  const hasAccess = allowedRoles.includes(userRole);

  if (!hasAccess) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-black border border-red-200 dark:border-red-900/60 rounded-2xl p-6 sm:p-8 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 flex items-center justify-center text-red-600 dark:text-red-400">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-100 text-red-800 dark:bg-red-900/80 dark:text-red-200 uppercase tracking-wider">
              403 Access Forbidden
            </span>
            <h2 className="text-xl font-black text-neutral-900 dark:text-neutral-50 tracking-tight">
              Access Restricted
            </h2>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              <strong>{moduleTitle}</strong> is strictly restricted to{' '}
              <span className="font-semibold text-neutral-900 dark:text-neutral-200">
                {allowedRoles.map(r => r.replace('_', ' ').toUpperCase()).join(' or ')}
              </span>
              . Your current role is{' '}
              <span className="font-mono font-bold text-red-600 dark:text-red-400">
                {isOwner ? 'Company Owner' : isTeamLeader ? 'Team Leader' : 'Employee'}
              </span>{' '}
              ({currentUser.displayName}).
            </p>
          </div>

          <div className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-xl text-[11px] text-neutral-500 font-mono text-left space-y-1 border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300 font-bold">
              <Lock className="w-3.5 h-3.5 text-red-500" /> Server Security Policy
            </div>
            <div>• Team Leaders: Access limited to team leads & reporting</div>
            <div>• Employees: Access limited to personally assigned leads</div>
            <div>• Company Owner: Full administrative & audit authority</div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="w-full sm:w-auto px-4 py-2 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-800 dark:text-neutral-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Go Back
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full sm:w-auto px-4 py-2 bg-black hover:bg-neutral-800 text-white dark:bg-white dark:text-black dark:hover:bg-neutral-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Home className="w-3.5 h-3.5" /> Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
