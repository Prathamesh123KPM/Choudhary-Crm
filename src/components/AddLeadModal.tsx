import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createLead, localStore } from '../services/crmService';
import { Lead } from '../types/crm';
import { X, UserPlus, AlertCircle, Building, Users } from 'lucide-react';
import ErrorBoundary from './ErrorBoundary';

interface AddLeadModalProps {
  onClose: () => void;
}

const AddLeadFormContent: React.FC<AddLeadModalProps> = ({ onClose }) => {
  const { currentUser, usersList, isOwner, isTeamLeader } = useAuth();

  // Safely guard projects and users against undefined or null
  const safeProjects = Array.isArray(localStore?.projects) ? localStore.projects : [];
  const safeUsers = Array.isArray(usersList) ? usersList : [];
  const employeeUsers = safeUsers.filter(u => u && (u.role === 'employee' || u.role === 'team_leader'));

  const defaultProjectName = safeProjects[0]?.name || 'Jeevika Heights';

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('Palghar');
  const [occupation, setOccupation] = useState('');
  const [projectName, setProjectName] = useState(defaultProjectName);
  const [propertyType, setPropertyType] = useState<'1 BHK' | '2 BHK' | '3 BHK' | '4 BHK Villa' | 'Plot' | 'Commercial Office'>('2 BHK');
  const [budgetMax, setBudgetMax] = useState(0);
  const [source, setSource] = useState<Lead['source']>('Manual Call');
  const [priority, setPriority] = useState<Lead['priority']>('Hot');
  const [assignedEmployeeId, setAssignedEmployeeId] = useState<string>(
    currentUser?.role === 'employee' ? currentUser?.uid || '' : ''
  );
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      const assignedEmp = safeUsers.find(u => u && u.uid === assignedEmployeeId);
      const actor = {
        id: currentUser?.uid || 'admin-001',
        name: currentUser?.displayName || 'Administrator',
        role: currentUser?.role || 'owner'
      };

      const bMax = Number(budgetMax) || 0;
      const bMin = bMax > 1000000 ? bMax - 1000000 : 0;

      await createLead(
        {
          customerName: customerName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          city: city.trim() || 'Palghar',
          occupation: occupation.trim(),
          projectName: projectName || 'General Inquiry',
          propertyType: propertyType || '2 BHK',
          budgetMin: bMin,
          budgetMax: bMax,
          source: source || 'Manual Call',
          priority: priority || 'Hot',
          assignedEmployeeId: assignedEmployeeId || '',
          assignedEmployeeName: assignedEmp ? assignedEmp.displayName : '',
          stage: 'New lead',
          subStatus: assignedEmployeeId ? 'Assigned' : 'Unassigned',
          notes: notes.trim()
        },
        actor
      );

      onClose();
    } catch (err: any) {
      console.error('Error creating lead in AddLeadModal:', err);
      setFormError(err?.message || 'Failed to save lead. Please check entered details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 text-neutral-900 dark:text-neutral-100 space-y-4 shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-black text-white dark:bg-white dark:text-black flex items-center justify-center shadow-xs">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">
                Add New Customer Lead
              </h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Direct intake for phone inquiries, walk-ins, and manual calls
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {formError && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-red-900 dark:text-red-200 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Customer Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-semibold">
                Customer Full Name *
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                className="w-full bg-neutral-50 dark:bg-neutral-800/90 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2.5 text-neutral-900 dark:text-neutral-100 font-medium focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                placeholder="e.g. Anand Kulkarni"
              />
            </div>
            <div>
              <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-semibold">
                Mobile Phone Number *
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full bg-neutral-50 dark:bg-neutral-800/90 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2.5 text-neutral-900 dark:text-neutral-100 font-mono focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                placeholder="+91 98220 00000"
              />
            </div>
          </div>

          {/* Email & City */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-semibold">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-neutral-50 dark:bg-neutral-800/90 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2.5 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                placeholder="anand@gmail.com"
              />
            </div>
            <div>
              <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-semibold">City / Location</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-neutral-50 dark:bg-neutral-800/90 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2.5 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                placeholder="e.g. Palghar, Mumbai"
              />
            </div>
          </div>

          {/* Project & Property Type (Safe with Empty Projects) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-semibold flex items-center justify-between">
                <span>Project Preference</span>
                {safeProjects.length === 0 && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-normal">
                    (No projects loaded)
                  </span>
                )}
              </label>
              <select
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full bg-neutral-50 dark:bg-neutral-800/90 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2.5 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-black dark:focus:border-white transition-colors cursor-pointer"
              >
                {safeProjects.length > 0 ? (
                  safeProjects.map(p => {
                    const loc = typeof p?.location === 'string' && p.location.trim()
                      ? (p.location.includes(',') ? p.location.split(',')[0].trim() : p.location.trim())
                      : typeof p?.address === 'string' && p.address.trim()
                      ? (p.address.includes(',') ? p.address.split(',')[0].trim() : p.address.trim())
                      : 'Palghar';

                    return (
                      <option key={p?.id || `proj-${Math.random()}`} value={p?.name || ''}>
                        {p?.name || 'Unnamed Project'} {loc ? `(${loc})` : ''}
                      </option>
                    );
                  })
                ) : (
                  <option value="General Inquiry">General Inquiry (All Projects)</option>
                )}
              </select>
            </div>
            <div>
              <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-semibold">Property Type</label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value as any)}
                className="w-full bg-neutral-50 dark:bg-neutral-800/90 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2.5 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-black dark:focus:border-white transition-colors cursor-pointer"
              >
                <option value="1 BHK">1 BHK</option>
                <option value="2 BHK">2 BHK</option>
                <option value="3 BHK">3 BHK</option>
                <option value="4 BHK Villa">4 BHK Villa / Row House</option>
                <option value="Commercial Office">Commercial Office / Shop</option>
                <option value="Plot">NA Residential Plot</option>
              </select>
            </div>
          </div>

          {/* Budget, Source, Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-semibold">Budget Max (₹)</label>
              <input
                type="number"
                value={budgetMax || ''}
                onChange={(e) => setBudgetMax(Number(e.target.value) || 0)}
                className="w-full bg-neutral-50 dark:bg-neutral-800/90 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2.5 text-neutral-900 dark:text-neutral-100 font-mono focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                placeholder="0 (Staff will update)"
              />
            </div>
            <div>
              <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-semibold">Lead Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as any)}
                className="w-full bg-neutral-50 dark:bg-neutral-800/90 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2.5 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-black dark:focus:border-white transition-colors cursor-pointer"
              >
                <option value="Manual Call">Manual Call</option>
                <option value="Walk-in">Walk-in</option>
                <option value="Facebook Ads">Facebook Ads</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Website Form">Website Form</option>
                <option value="Referral">Referral</option>
              </select>
            </div>
            <div>
              <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-semibold">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-neutral-50 dark:bg-neutral-800/90 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2.5 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-black dark:focus:border-white transition-colors cursor-pointer"
              >
                <option value="Hot">🔥 Hot</option>
                <option value="Warm">⚡ Warm</option>
                <option value="Cold">❄️ Cold</option>
              </select>
            </div>
          </div>

          {/* Staff Assignment (Safe with Empty Staff / Role Filtered) */}
          {(isOwner || isTeamLeader) && (
            <div>
              <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-semibold flex items-center justify-between">
                <span>Assign Sales Representative</span>
                {employeeUsers.length === 0 && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-normal">
                    (No sales representatives registered)
                  </span>
                )}
              </label>
              <select
                value={assignedEmployeeId}
                onChange={(e) => setAssignedEmployeeId(e.target.value)}
                className="w-full bg-neutral-50 dark:bg-neutral-800/90 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2.5 text-neutral-900 dark:text-neutral-100 text-xs font-semibold focus:outline-none focus:border-black dark:focus:border-white transition-colors cursor-pointer"
              >
                <option value="">Auto-Assign / Unassigned (Shared Inbox)</option>
                {employeeUsers.length > 0 ? (
                  employeeUsers.map(emp => (
                    <option key={emp?.uid || `emp-${Math.random()}`} value={emp?.uid || ''}>
                      {emp?.displayName || 'Sales Rep'} — {emp?.designation || emp?.employeeCode || 'Sales'}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>No employees available</option>
                )}
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-semibold">
              Initial Inquiry Remarks
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full bg-neutral-50 dark:bg-neutral-800/90 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2.5 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-black dark:focus:border-white transition-colors"
              placeholder="Record customer preferences, timeline, budget notes..."
            />
          </div>

          {/* Modal Action Buttons */}
          <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-lg font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-black hover:bg-neutral-800 text-white dark:bg-white dark:text-black dark:hover:bg-neutral-200 rounded-lg font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? 'Creating...' : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const AddLeadModal: React.FC<AddLeadModalProps> = ({ onClose }) => {
  return (
    <ErrorBoundary
      fallbackTitle="Add Lead Modal Error"
      onReset={onClose}
    >
      <AddLeadFormContent onClose={onClose} />
    </ErrorBoundary>
  );
};

export default AddLeadModal;
