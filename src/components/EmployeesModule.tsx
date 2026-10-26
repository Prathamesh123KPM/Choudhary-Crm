import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toggleUserStatus, localStore } from '../services/crmService';
import { getEmployeePerformanceMetrics, getCompanyMetrics } from '../utils/crmMetrics';
import { UserCheck, Shield, PhoneCall, CheckCircle2, MapPin, Power, Eye, Crown, ShieldAlert } from 'lucide-react';

export const EmployeesModule: React.FC = () => {
  const { currentUser, usersList, isOwner, isTeamLeader, isEmployee, teamMemberUids, impersonateUser, setEmployeeFilter } = useAuth();
  const navigate = useNavigate();

  const handleImpersonate = async (targetUid: string) => {
    const res = await impersonateUser(targetUid);
    if (res.success) {
      navigate('/dashboard', { replace: true });
    }
  };

  // Scoped employee list: Owner sees team leaders and all staff; Team Leader sees her sales team members
  const employees = isOwner
    ? usersList.filter(u => u.role === 'team_leader' || u.role === 'employee')
    : usersList.filter(u => teamMemberUids.includes(u.uid) && u.role === 'employee');

  const companyMetrics = getCompanyMetrics();
  const heenaMetrics = getEmployeePerformanceMetrics('admin-002');

  const handleToggleActive = async (uid: string, active: boolean) => {
    if (!isOwner) return; // Server will also block this
    const actor = { id: currentUser.uid, name: currentUser.displayName, role: currentUser.role };
    await toggleUserStatus(uid, active, actor);
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs transition-colors">
        <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2 uppercase tracking-wide">
          {isOwner ? 'Company Sales Directory & Performance' : "Heena's Team Performance & Directory"}
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
          {isOwner
            ? 'Executive leadership and company-wide sales executives workload, follow-up execution, and booking conversion tracking.'
            : 'Performance metrics, site visit execution, and active pipeline for sales team members supervised by Heena.'}
        </p>
      </div>

      {/* Executive Leadership Cards */}
      <div className={`grid grid-cols-1 ${isOwner ? 'sm:grid-cols-2' : ''} gap-4`}>
        {/* Kishan Choudhary (Company Owner) - Visible to Owner */}
        {isOwner && (
          <div className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
                alt="Kishan Choudhary"
                className="w-12 h-12 rounded-full object-cover border-2 border-amber-400 shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-white truncate">Kishan Choudhary</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shrink-0">
                    Company Owner
                  </span>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 font-medium truncate">
                  Managing Director & Founder · Overall CRM Authority
                </p>
                <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-2 flex-wrap">
                  <span>{companyMetrics.activeLeadsCount} Active Leads</span>
                  <span>·</span>
                  <span>{companyMetrics.totalTasksCount} Tasks ({companyMetrics.tasksCompletedCount} Done)</span>
                  <span>·</span>
                  <span>{companyMetrics.siteVisitsTotalCount} Site Visits</span>
                </div>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded text-neutral-600 dark:text-neutral-300 shrink-0">
              OWNER-01
            </span>
          </div>
        )}

        {/* Heena */}
        <div className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150"
              alt="Heena"
              className="w-12 h-12 rounded-full object-cover border-2 border-emerald-400 shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm text-neutral-900 dark:text-white truncate">Heena</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                  Team Leader
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 font-medium truncate">
                Team Leader Choudhary Estate · Oversees All Lead Inflow & Routing
              </p>
              <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-2 flex-wrap">
                <span>{heenaMetrics.activeLeadsCount} Leads</span>
                <span>·</span>
                <span>{heenaMetrics.totalTasksCount} Tasks ({heenaMetrics.tasksCompletedCount} Done)</span>
                <span>·</span>
                <span>{heenaMetrics.siteVisitsTotalCount} Visits</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isOwner && currentUser.uid !== 'admin-002' && (
              <button
                onClick={() => handleImpersonate('admin-002')}
                className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                title="Audit-logged Owner Impersonation of Heena"
              >
                <Eye className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">View as Heena</span>
              </button>
            )}
            <span className="text-[10px] font-mono font-bold px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded text-neutral-600 dark:text-neutral-300 shrink-0">
              HEAD-01
            </span>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xs transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-100/75 dark:bg-neutral-950 text-neutral-600 dark:text-neutral-400 font-bold uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-800 text-sm">
              <tr>
                <th className="p-3.5">Employee Name & Role</th>
                <th className="p-3.5">Phone & Email</th>
                <th className="p-3.5">Active Assigned Leads</th>
                <th className="p-3.5">Tasks & Follow-ups</th>
                <th className="p-3.5">Site Visits</th>
                <th className="p-3.5">Confirmed Sales Volume</th>
                <th className="p-3.5">Account Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 text-neutral-800 dark:text-neutral-200 text-sm">
              {employees.map(emp => {
                const metrics = getEmployeePerformanceMetrics(emp.uid);

                return (
                  <tr key={emp.uid} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-2.5">
                        <img src={emp.avatarUrl} alt={emp.displayName} className="w-9 h-9 rounded-full object-cover border border-neutral-300 dark:border-neutral-700 shrink-0" />
                        <div className="min-w-0">
                          <div className="font-bold text-neutral-900 dark:text-white truncate text-base">{emp.displayName}</div>
                          {emp.designation && (
                            <div className="text-sm font-medium text-emerald-600 dark:text-emerald-400 truncate max-w-[220px]">
                              {emp.designation}
                            </div>
                          )}
                          <div className="font-mono text-neutral-500 dark:text-neutral-400 text-sm">{emp.employeeCode}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-neutral-700 dark:text-neutral-300 text-sm">
                      <div>{emp.phone}</div>
                      <div className="text-neutral-500 dark:text-neutral-400 text-sm">{emp.email}</div>
                    </td>
                    <td className="p-3.5 font-mono text-neutral-900 dark:text-white font-bold text-sm">{metrics.activeLeadsCount} Leads</td>
                    <td className="p-3.5 font-mono text-neutral-900 dark:text-white font-bold text-sm">
                      {metrics.totalTasksCount} Tasks ({metrics.tasksCompletedCount} Done)
                    </td>
                    <td className="p-3.5 font-mono text-neutral-900 dark:text-white font-bold text-sm">
                      {metrics.siteVisitsTotalCount} Visits ({metrics.siteVisitsCompletedCount} Done)
                    </td>
                    <td className="p-3.5 font-mono text-neutral-900 dark:text-white font-bold text-sm">
                      ₹{(metrics.salesVolume / 100000).toFixed(1)} Lakhs
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded text-sm font-bold ${emp.active ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700'}`}>
                        {emp.active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-2 text-sm">
                        {isOwner && currentUser.uid !== emp.uid && (
                          <button
                            onClick={() => handleImpersonate(emp.uid)}
                            className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 rounded-lg text-sm font-semibold shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                            title={`Audit-logged Owner Impersonation of ${emp.displayName}`}
                          >
                            <Eye className="w-4 h-4 text-amber-500" />
                            <span>View As</span>
                          </button>
                        )}
                        <button
                          onClick={() => setEmployeeFilter(emp.uid)}
                          className="px-3.5 py-1.5 bg-black hover:bg-neutral-800 text-white dark:bg-white dark:text-black dark:hover:bg-neutral-200 rounded-lg text-sm font-semibold shadow-xs transition-colors cursor-pointer"
                        >
                          Inspect
                        </button>
                        {isOwner && (
                          <button
                            onClick={() => handleToggleActive(emp.uid, !emp.active)}
                            className={`p-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${emp.active ? 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300' : 'bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 text-neutral-900 dark:text-white'}`}
                            title={emp.active ? 'Disable Account' : 'Activate Account'}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmployeesModule;
