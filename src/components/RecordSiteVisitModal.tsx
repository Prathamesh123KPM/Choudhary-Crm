import React, { useState } from 'react';
import { Lead, SiteVisit, LeadSubStatus } from '../types/crm';
import { useAuth } from '../context/AuthContext';
import { scheduleSiteVisit, localStore } from '../services/crmService';
import {
  Calendar,
  Clock,
  Building,
  Plus,
  X,
  MapPin,
  Car,
  Users,
  FileText,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface RecordSiteVisitModalProps {
  lead: Lead;
  onClose: () => void;
  onSuccess?: (visit: SiteVisit) => void;
}

export const RecordSiteVisitModal: React.FC<RecordSiteVisitModalProps> = ({
  lead,
  onClose,
  onSuccess
}) => {
  const { currentUser } = useAuth();
  const actor = { id: currentUser.uid, name: currentUser.displayName, role: currentUser.role };

  const todayStr = new Date().toISOString().split('T')[0];

  // Helper to compute upcoming weekend dates
  const getUpcomingDate = (dayOffset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    return d.toISOString().split('T')[0];
  };

  const getUpcomingWeekend = (targetDay: 6 | 0) => {
    // 6 = Sat, 0 = Sun
    const d = new Date();
    const currentDay = d.getDay();
    let diff = targetDay - currentDay;
    if (diff <= 0) diff += 7;
    d.setDate(d.getDate() + diff);
    return d.toISOString().split('T')[0];
  };

  // State
  const [visitDate, setVisitDate] = useState(todayStr);
  const [visitTime, setVisitTime] = useState('11:00');
  
  // Properties: support MULTIPLE properties as requested
  const initialProperties: string[] = [];
  if (lead.projectName && lead.projectName.trim()) {
    initialProperties.push(lead.projectName.trim());
  } else if (localStore.projects && localStore.projects.length > 0) {
    initialProperties.push(localStore.projects[0].name);
  } else {
    initialProperties.push('Jeevika Heights');
  }

  const [selectedProperties, setSelectedProperties] = useState<string[]>(initialProperties);
  const [customPropertyInput, setCustomPropertyInput] = useState('');
  const [subStatus, setSubStatus] = useState<LeadSubStatus>('Site Visit Scheduled');
  const [visitorsCount, setVisitorsCount] = useState(2);
  const [transportNeeded, setTransportNeeded] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Available registered projects
  const registeredProjects = Array.isArray(localStore.projects) ? localStore.projects : [];

  const handleAddProperty = (propName: string) => {
    const trimmed = propName.trim();
    if (!trimmed) return;
    if (selectedProperties.some(p => p.toLowerCase() === trimmed.toLowerCase())) {
      setError(`"${trimmed}" is already added.`);
      setTimeout(() => setError(''), 2500);
      return;
    }
    setSelectedProperties(prev => [...prev, trimmed]);
    setCustomPropertyInput('');
    setError('');
  };

  const handleRemoveProperty = (propName: string) => {
    if (selectedProperties.length <= 1) {
      setError('At least one property is required for a site visit.');
      setTimeout(() => setError(''), 2500);
      return;
    }
    setSelectedProperties(prev => prev.filter(p => p !== propName));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProperties.length === 0) {
      setError('Please select or add at least one property to visit.');
      return;
    }
    if (!visitDate) {
      setError('Please choose a valid visit date.');
      return;
    }
    if (!visitTime) {
      setError('Please choose a visit time.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Find matching project for projectId reference
      const matchedProj = registeredProjects.find(
        p => p.name.toLowerCase() === selectedProperties[0].toLowerCase()
      );
      const projectId = matchedProj?.id || lead.projectId || 'proj-001';

      const combinedProjectNames = selectedProperties.join(', ');

      const newVisit = await scheduleSiteVisit(
        {
          leadId: lead.id,
          leadName: lead.customerName,
          leadPhone: lead.phone,
          projectId,
          projectName: combinedProjectNames,
          projectNames: selectedProperties,
          employeeId: lead.assignedEmployeeId || currentUser.uid,
          employeeName: lead.assignedEmployeeName || currentUser.displayName,
          visitDate,
          visitTime,
          visitorsCount: Number(visitorsCount) || 1,
          transportNeeded,
          status: subStatus === 'Site Visit Completed' ? 'Completed' : 'Scheduled',
          feedback: notes.trim() ? `[Site Visit Notes]: ${notes.trim()}` : ''
        },
        actor
      );

      if (onSuccess) {
        onSuccess(newVisit);
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to record site visit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="record-site-visit-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-2xl text-neutral-900 dark:text-neutral-100 space-y-4 my-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 id="record-site-visit-title" className="text-base font-semibold text-neutral-900 dark:text-white">
                Record Site Visit
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Moving <strong className="text-neutral-800 dark:text-neutral-200">{lead.customerName}</strong> ({lead.phone}) to <strong>Site Visit</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Section 1: Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Visit Date */}
            <div>
              <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                <span>Visit Date *</span>
              </label>
              <input
                type="date"
                required
                value={visitDate}
                onChange={e => setVisitDate(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none"
              />
              {/* Quick Date Pills */}
              <div className="flex flex-wrap gap-1 mt-1.5">
                <button
                  type="button"
                  onClick={() => setVisitDate(todayStr)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                    visitDate === todayStr
                      ? 'bg-purple-600 text-white font-bold'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setVisitDate(getUpcomingDate(1))}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                    visitDate === getUpcomingDate(1)
                      ? 'bg-purple-600 text-white font-bold'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  }`}
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => setVisitDate(getUpcomingWeekend(6))}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                    visitDate === getUpcomingWeekend(6)
                      ? 'bg-purple-600 text-white font-bold'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  }`}
                >
                  This Saturday
                </button>
                <button
                  type="button"
                  onClick={() => setVisitDate(getUpcomingWeekend(0))}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                    visitDate === getUpcomingWeekend(0)
                      ? 'bg-purple-600 text-white font-bold'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  }`}
                >
                  This Sunday
                </button>
              </div>
            </div>

            {/* Visit Time */}
            <div>
              <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-neutral-400" />
                <span>Visit Time *</span>
              </label>
              <input
                type="time"
                required
                value={visitTime}
                onChange={e => setVisitTime(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none"
              />
              {/* Quick Time Pills */}
              <div className="flex flex-wrap gap-1 mt-1.5">
                {['10:00', '11:30', '14:00', '16:30'].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setVisitTime(t)}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                      visitTime === t
                        ? 'bg-purple-600 text-white font-bold'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                    }`}
                  >
                    {t === '10:00' ? '10 AM' : t === '11:30' ? '11:30 AM' : t === '14:00' ? '2 PM' : '4:30 PM'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Properties to Visit (Multiple Selection) */}
          <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-purple-500" />
                <span>Properties to Visit ({selectedProperties.length})</span>
                <span className="text-[10px] font-normal text-neutral-400 font-mono">(Multiple allowed)</span>
              </label>
            </div>

            {/* Selected Property Chips */}
            <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg">
              {selectedProperties.map(prop => (
                <span
                  key={prop}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80 shadow-2xs"
                >
                  <Building className="w-3 h-3 opacity-70" />
                  <span>{prop}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveProperty(prop)}
                    className="p-0.5 hover:bg-purple-200 dark:hover:bg-purple-900 rounded transition-colors cursor-pointer text-purple-500 hover:text-purple-700 dark:hover:text-purple-200"
                    title={`Remove ${prop}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            {/* Quick-add available projects */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Click to add from company projects:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {registeredProjects.map(proj => {
                  const isSelected = selectedProperties.includes(proj.name);
                  return (
                    <button
                      key={proj.id}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          handleRemoveProperty(proj.name);
                        } else {
                          handleAddProperty(proj.name);
                        }
                      }}
                      className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer border ${
                        isSelected
                          ? 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/80 dark:text-purple-200 dark:border-purple-800'
                          : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-purple-300 dark:hover:border-purple-700'
                      }`}
                    >
                      {isSelected ? (
                        <CheckCircle2 className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                      ) : (
                        <Plus className="w-3 h-3 text-neutral-400" />
                      )}
                      <span>{proj.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Property Input */}
            <div className="flex items-center gap-1.5 pt-1">
              <input
                type="text"
                placeholder="Or type custom property / plot name..."
                value={customPropertyInput}
                onChange={e => setCustomPropertyInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddProperty(customPropertyInput);
                  }
                }}
                className="flex-1 px-2.5 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <button
                type="button"
                onClick={() => handleAddProperty(customPropertyInput)}
                disabled={!customPropertyInput.trim()}
                className="px-3 py-1.5 bg-neutral-900 hover:bg-black dark:bg-neutral-200 dark:hover:bg-white text-white dark:text-black rounded-lg text-xs font-semibold disabled:opacity-40 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Section 3: Sub-status & Visitors & Transport */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Sub-status */}
            <div>
              <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Initial Stage Sub-Status
              </label>
              <select
                value={subStatus}
                onChange={e => setSubStatus(e.target.value as LeadSubStatus)}
                className="w-full px-2.5 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none cursor-pointer"
              >
                <option value="Site Visit Scheduled">Site Visit Scheduled</option>
                <option value="Site Visit Confirmed">Site Visit Confirmed</option>
                <option value="Site Visit Completed">Site Visit Completed</option>
                <option value="Feedback Positive">Feedback Positive</option>
                <option value="Decision Pending">Decision Pending</option>
              </select>
            </div>

            {/* Visitors Count */}
            <div>
              <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-neutral-400" />
                <span>Visitors Count</span>
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={visitorsCount}
                onChange={e => setVisitorsCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            {/* Transport Needed */}
            <div>
              <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1">
                <Car className="w-3.5 h-3.5 text-neutral-400" />
                <span>Transport Pickup</span>
              </label>
              <button
                type="button"
                onClick={() => setTransportNeeded(!transportNeeded)}
                className={`w-full px-3 py-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  transportNeeded
                    ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
                    : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>{transportNeeded ? 'Cab Pickup: YES' : 'No Cab Needed'}</span>
              </button>
            </div>
          </div>

          {/* Section 4: Notes */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-neutral-400" />
              <span>Visit Notes / Client Preferences</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Client visiting with family, looking for higher floor 2BHK with balcony..."
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 text-xs placeholder-neutral-400 focus:ring-1 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs font-bold shadow-md hover:shadow-lg flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Recording Visit...' : 'Confirm & Save Site Visit'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecordSiteVisitModal;
