import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Lead, LeadStage, LeadSubStatus, LeadPriority, Followup, SiteVisit } from '../types/crm';
import { useAuth } from '../context/AuthContext';
import {
  updateLead,
  scheduleFollowup,
  scheduleSiteVisit,
  createBooking,
  assignLead,
  addLeadActivity,
  localStore
} from '../services/crmService';
import {
  X,
  Phone,
  MessageSquare,
  Copy,
  Calendar,
  MapPin,
  Building,
  DollarSign,
  User,
  Clock,
  History,
  Check,
  Plus,
  Send,
  AlertCircle,
  Pencil,
  Coins,
  Save
} from 'lucide-react';
import { LeadSourceBadge, FacebookBrandIcon, InstagramBrandIcon } from './LeadSourceBadge';
import RecordSiteVisitModal from './RecordSiteVisitModal';

interface LeadDrawerProps {
  lead: Lead;
  onClose: () => void;
}

const BUDGET_PRESETS = [
  { label: '₹15L-₹25L (1 RK/Plot)', min: 1500000, max: 2500000 },
  { label: '₹25L-₹35L (1 BHK)', min: 2500000, max: 3500000 },
  { label: '₹35L-₹50L (2 BHK)', min: 3500000, max: 5000000 },
  { label: '₹50L-₹75L (3 BHK)', min: 5000000, max: 7500000 },
  { label: '₹75L-₹1.1Cr (Row House)', min: 7500000, max: 11000000 },
  { label: '₹1.1Cr+ (Luxury/Comm.)', min: 11000000, max: 20000000 }
];

export const LeadDrawer: React.FC<LeadDrawerProps> = ({ lead, onClose }) => {
  const { currentUser, usersList, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'followups' | 'visits' | 'booking'>('overview');

  // Quick Action Modals
  const [showFollowupModal, setShowFollowupModal] = useState(false);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showWhatsAppTemplates, setShowWhatsAppTemplates] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Form states
  const [stage, setStage] = useState<LeadStage>(lead.stage);
  const [subStatus, setSubStatus] = useState<LeadSubStatus>(lead.subStatus);
  const [priority, setPriority] = useState<LeadPriority>(lead.priority);
  const [assignedEmpId, setAssignedEmpId] = useState<string>(lead.assignedEmployeeId || '');
  const [notes, setNotes] = useState(lead.notes || '');

  // Manual Budget Modification state
  const [budgetMin, setBudgetMin] = useState<number>(Number(lead.budgetMin) || 0);
  const [budgetMax, setBudgetMax] = useState<number>(Number(lead.budgetMax) || 0);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetSavedFeedback, setBudgetSavedFeedback] = useState(false);
  const [isSavingBudget, setIsSavingBudget] = useState(false);

  // Synchronize internal state whenever selected lead changes
  React.useEffect(() => {
    setStage(lead.stage);
    setSubStatus(lead.subStatus);
    setPriority(lead.priority);
    setAssignedEmpId(lead.assignedEmployeeId || '');
    setNotes(lead.notes || '');
    setBudgetMin(Number(lead.budgetMin) || 0);
    setBudgetMax(Number(lead.budgetMax) || 0);
    setIsEditingBudget(false);
  }, [lead.id, lead.stage, lead.subStatus, lead.priority, lead.assignedEmployeeId, lead.notes, lead.budgetMin, lead.budgetMax]);

  const handleSaveBudget = async () => {
    setIsSavingBudget(true);
    try {
      const minNum = Number(budgetMin) || 0;
      const maxNum = Number(budgetMax) || minNum || 0;
      await updateLead(lead.id, { budgetMin: minNum, budgetMax: maxNum }, actor);
      setBudgetSavedFeedback(true);
      setTimeout(() => setBudgetSavedFeedback(false), 3000);
      setIsEditingBudget(false);
    } catch (err) {
      console.error('Error saving budget:', err);
    } finally {
      setIsSavingBudget(false);
    }
  };

  // Followup form
  const [folType, setFolType] = useState<Followup['type']>('Phone Call');
  const [folDate, setFolDate] = useState(new Date().toISOString().split('T')[0]);
  const [folTime, setFolTime] = useState('11:00 AM');
  const [folNotes, setFolNotes] = useState('');

  // Site Visit form
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [visitTime, setVisitTime] = useState('15:00');
  const [visitors, setVisitors] = useState(2);
  const [transport, setTransport] = useState(false);

  // Booking form
  const [selectedUnit, setSelectedUnit] = useState('A-101');
  const [agreedPrice, setAgreedPrice] = useState(lead.budgetMax || 6800000);
  const [tokenAmount, setTokenAmount] = useState(100000);
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'Bank Transfer / NEFT' | 'Cheque' | 'Credit Card'>('UPI');
  const [bookingRemarks, setBookingRemarks] = useState('');
  const [bookingError, setBookingError] = useState('');

  const actor = { id: currentUser.uid, name: currentUser.displayName, role: currentUser.role };

  const stagesList: LeadStage[] = [
    'New lead',
    'Ringing',
    'Whatsapp',
    'Opportunity',
    'Site Visit',
    'Revisit',
    'Unqualified',
    'Lost'
  ];

  // Sub-status options mapping
  const subStatusOptions: Record<LeadStage, LeadSubStatus[]> = {
    'New lead': ['Unassigned', 'Assigned', 'Not Contacted'],
    'Ringing': ['Ringing', 'No Answer', 'Busy', 'Switched Off', 'Not Reachable', 'Wrong Number', 'Callback Requested'],
    'Whatsapp': ['Message Sent', 'Chat Ongoing', 'Brochure Sent', 'Details Shared', 'Replied'],
    'Opportunity': ['Interested', 'Highly Interested', 'Contacted', 'Budget Discussion', 'Loan Discussion', 'Token Received', 'Negotiation'],
    'Site Visit': ['Site Visit Scheduled', 'Site Visit Confirmed', 'Site Visit Completed', 'Feedback Positive', 'Decision Pending', 'Booked'],
    'Visit done': ['Site Visit Scheduled', 'Site Visit Confirmed', 'Site Visit Completed', 'Feedback Positive', 'Decision Pending', 'Booked'],
    'Revisit': ['Revisit Scheduled', 'Revisit Completed', 'Family Revisit'],
    'Unqualified': ['Budget Mismatch', 'Location Mismatch', 'Not Interested', 'Invalid Lead', 'Duplicate'],
    'Lost': ['Lost', 'Lost to Competitor', 'Dropped Plan', 'Price Too High', 'No Response']
  };

  const handleStageChange = async (newStage: LeadStage) => {
    if (newStage === 'Site Visit' || newStage === 'Visit done') {
      setShowVisitModal(true);
      return;
    }
    setStage(newStage);
    const defaultSub = subStatusOptions[newStage]?.[0] || 'Not Contacted';
    setSubStatus(defaultSub);
    await updateLead(lead.id, { stage: newStage, subStatus: defaultSub }, actor);
  };

  const handleSubStatusChange = async (newSub: LeadSubStatus) => {
    setSubStatus(newSub);
    await updateLead(lead.id, { subStatus: newSub }, actor);
  };

  const handlePriorityChange = async (newPriority: LeadPriority) => {
    setPriority(newPriority);
    await updateLead(lead.id, { priority: newPriority }, actor);
  };

  const handleAssignChange = async (empId: string) => {
    setAssignedEmpId(empId);
    const emp = usersList.find(u => u.uid === empId);
    if (emp) {
      await assignLead(lead.id, emp.uid, emp.displayName, actor);
    }
  };

  const [newLogType, setNewLogType] = useState<'Call' | 'WhatsApp' | 'Meeting' | 'Site Visit' | 'Discussion' | 'Note'>('Call');
  const [newLogText, setNewLogText] = useState('');
  const [logSavedSuccess, setLogSavedSuccess] = useState(false);
  const [noteSavedFeedback, setNoteSavedFeedback] = useState(false);

  const handleSaveNotes = async () => {
    await updateLead(lead.id, { notes }, actor);
    setNoteSavedFeedback(true);
    setTimeout(() => setNoteSavedFeedback(false), 2000);
  };

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(lead.phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleCallClick = async () => {
    await addLeadActivity(
      lead.id,
      'NOTE_ADDED',
      `Outbound phone call initiated to ${lead.customerName} (${lead.phone})`,
      actor
    );
  };

  const sendWhatsAppMessage = async (templateText: string, templateTitle: string = 'WhatsApp Message') => {
    const cleanPhone = lead.phone.replace(/[^0-9]/g, '');
    const encoded = encodeURIComponent(templateText.replace('{{name}}', lead.customerName).replace('{{project}}', lead.projectName || 'Jeevika Heights'));
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
    await addLeadActivity(
      lead.id,
      'NOTE_ADDED',
      `Dispatched ${templateTitle} to ${lead.customerName} via WhatsApp`,
      actor
    );
  };

  const handleManualAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogText.trim()) return;
    await addLeadActivity(
      lead.id,
      newLogType === 'Call' ? 'NOTE_ADDED' : newLogType === 'Meeting' ? 'STATUS_UPDATED' : 'NOTE_ADDED',
      `[${newLogType.toUpperCase()}] ${newLogText.trim()}`,
      actor
    );
    setNewLogText('');
    setLogSavedSuccess(true);
    setTimeout(() => setLogSavedSuccess(false), 2500);
  };

  const handleScheduleFollowupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await scheduleFollowup(
      {
        leadId: lead.id,
        leadName: lead.customerName,
        leadPhone: lead.phone,
        employeeId: currentUser.uid,
        employeeName: currentUser.displayName,
        type: folType,
        scheduledDate: folDate,
        scheduledTime: folTime,
        notes: folNotes,
        status: 'Upcoming'
      },
      actor
    );
    setShowFollowupModal(false);
  };

  const handleScheduleSiteVisitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await scheduleSiteVisit(
      {
        leadId: lead.id,
        leadName: lead.customerName,
        leadPhone: lead.phone,
        projectId: lead.projectId || 'proj-001',
        projectName: lead.projectName || 'Jeevika Heights',
        employeeId: currentUser.uid,
        employeeName: currentUser.displayName,
        visitDate,
        visitTime,
        visitorsCount: Number(visitors),
        transportNeeded: transport,
        status: 'Scheduled'
      },
      actor
    );
    setShowVisitModal(false);
  };

  const handleCreateBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError('');
    try {
      await createBooking(
        {
          leadId: lead.id,
          customerName: lead.customerName,
          customerPhone: lead.phone,
          projectId: lead.projectId || 'proj-001',
          projectName: lead.projectName || 'Jeevika Heights',
          unitId: `unit-${selectedUnit}`,
          unitNumber: selectedUnit,
          agreedPrice: Number(agreedPrice),
          tokenAmount: Number(tokenAmount),
          paymentMode,
          tokenDate: new Date().toISOString().split('T')[0],
          employeeId: currentUser.uid,
          employeeName: currentUser.displayName,
          status: 'Token Received',
          remarks: bookingRemarks
        },
        actor
      );
      setShowBookingModal(false);
    } catch (err: any) {
      setBookingError(err.message || 'Error creating booking');
    }
  };

  const leadActivities = localStore.activityLogs.filter(a => a.leadId === lead.id);
  const leadFollowups = localStore.followups.filter(f => f.leadId === lead.id);
  const leadVisits = localStore.siteVisits.filter(v => v.leadId === lead.id);
  const leadBookings = localStore.bookings.filter(b => b.leadId === lead.id);

  const drawerContent = (
    <div className="fixed inset-0 z-[999999] flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl bg-white dark:bg-neutral-900 h-full border-l border-neutral-200 dark:border-neutral-800 flex flex-col shadow-2xl text-neutral-900 dark:text-neutral-100 overflow-hidden transition-colors">
        {/* Top Header */}
        <div className="p-5 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between shrink-0 sticky top-0 z-30">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-neutral-900 dark:text-white uppercase tracking-wide">{lead.customerName}</h2>
              <LeadSourceBadge source={lead.source} size="sm" />
              <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border shadow-2xs whitespace-nowrap shrink-0 ${
                priority === 'Hot'
                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                  : priority === 'Warm'
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                  : 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800'
              }`}>
                <span className="shrink-0">{priority === 'Hot' ? '🔥' : priority === 'Warm' ? '⚡' : '❄️'}</span>
                <span className="whitespace-nowrap">{priority}</span>
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 font-mono">Lead ID: {lead.id}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 shadow-sm hover:scale-105 transition-all cursor-pointer shrink-0 ml-3"
            title="Close (Esc)"
            aria-label="Close lead drawer"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Quick Communication & Action Ribbon */}
        <div className="px-5 py-3 bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
          <div className="flex items-center gap-2">
            <a
              href={`tel:${lead.phone}`}
              onClick={handleCallClick}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-black hover:bg-neutral-800 text-white dark:bg-white dark:text-black dark:hover:bg-neutral-200 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5" /> Call
            </a>
            <div className="relative">
              <button
                onClick={() => setShowWhatsAppTemplates(!showWhatsAppTemplates)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white dark:bg-neutral-200 dark:text-black dark:hover:bg-neutral-300 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
              </button>
              {showWhatsAppTemplates && (
                <div className="absolute left-0 mt-2 w-72 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl p-2 z-50">
                  <p className="text-[10px] uppercase font-bold text-neutral-400 px-2 py-1">Quick WhatsApp Templates</p>
                  <button
                    onClick={() => {
                      sendWhatsAppMessage(
                        "Hello {{name}}, thank you for inquiring about {{project}}. I'm your dedicated relationship manager at Choudhary Real Estate. When is a good time to connect?",
                        "Introduction & Welcome Note"
                      );
                      setShowWhatsAppTemplates(false);
                    }}
                    className="w-full text-left p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs text-neutral-800 dark:text-neutral-200"
                  >
                    1. Initial Inquiry Welcome
                  </button>
                  <button
                    onClick={() => {
                      sendWhatsAppMessage(
                        "Hi {{name}}, sharing project brochure and pricing details for {{project}}. Would you like to schedule a site visit this weekend?",
                        "Brochure & Price List"
                      );
                      setShowWhatsAppTemplates(false);
                    }}
                    className="w-full text-left p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs text-neutral-800 dark:text-neutral-200"
                  >
                    2. Share Brochure & Price List
                  </button>
                  <button
                    onClick={() => {
                      sendWhatsAppMessage(
                        "Hello {{name}}, confirming your site visit for {{project}}. Our site team looks forward to welcoming you!",
                        "Site Visit Confirmation"
                      );
                      setShowWhatsAppTemplates(false);
                    }}
                    className="w-full text-left p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs text-neutral-800 dark:text-neutral-200"
                  >
                    3. Site Visit Confirmation
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={handleCopyPhone}
              className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs shadow-xs transition-colors cursor-pointer"
              title="Copy Phone"
            >
              {copiedPhone ? <Check className="w-3.5 h-3.5 text-neutral-900 dark:text-white" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFollowupModal(true)}
              className="px-2.5 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              + Follow-up
            </button>
            <button
              onClick={() => setShowVisitModal(true)}
              className="px-2.5 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              + Site Visit
            </button>
            <button
              onClick={() => setShowBookingModal(true)}
              className="px-2.5 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              + Booking
            </button>
          </div>
        </div>

        {/* Stage & Assignment Controller Bar (Single Stage Control) */}
        <div className="px-5 py-3.5 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs uppercase font-bold text-neutral-500 dark:text-neutral-400">Lead Stage</label>
            <select
              value={stage === 'Visit done' ? 'Site Visit' : stage}
              onChange={(e) => handleStageChange(e.target.value as LeadStage)}
              className="w-full mt-1 bg-neutral-50 dark:bg-neutral-800/90 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:border-black dark:focus:border-white cursor-pointer"
            >
              {stagesList.map((stg) => (
                <option key={stg} value={stg}>{stg}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs uppercase font-bold text-neutral-500 dark:text-neutral-400">Priority Level</label>
            <select
              value={priority}
              onChange={(e) => handlePriorityChange(e.target.value as LeadPriority)}
              className="w-full mt-1 bg-neutral-50 dark:bg-neutral-800/90 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-black dark:focus:border-white cursor-pointer"
            >
              <option value="Hot">🔥 Hot Priority</option>
              <option value="Warm">⚡ Warm Priority</option>
              <option value="Cold">❄️ Cold Priority</option>
            </select>
          </div>

          <div>
            <label className="text-xs uppercase font-bold text-neutral-500 dark:text-neutral-400">Assigned Employee</label>
            <select
              value={assignedEmpId}
              disabled={!isAdmin}
              onChange={(e) => handleAssignChange(e.target.value)}
              className="w-full mt-1 bg-neutral-50 dark:bg-neutral-800/90 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-black dark:focus:border-white disabled:opacity-50 cursor-pointer"
            >
              <option value="">Unassigned</option>
              {usersList.filter(u => u.role === 'employee' || u.role === 'team_leader').map(emp => (
                <option key={emp.uid} value={emp.uid}>
                  {emp.displayName} {emp.designation ? `(${emp.designation})` : `(${emp.employeeCode})`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabs Header */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950 px-5">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'activity', label: `Timeline (${leadActivities.length})` },
            { id: 'followups', label: `Follow-ups (${leadFollowups.length})` },
            { id: 'visits', label: `Site Visits (${leadVisits.length})` },
            { id: 'booking', label: `Booking (${leadBookings.length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'border-black text-black dark:border-white dark:text-white font-bold'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Customer Contact Details */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Customer Details</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500">Primary Phone:</span>
                    <p className="font-semibold font-mono text-slate-900 mt-0.5">{lead.phone}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Email:</span>
                    <p className="font-medium text-slate-800 mt-0.5">{lead.email || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">City / Location:</span>
                    <p className="font-medium text-slate-800 mt-0.5">{lead.city || 'Pune'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Occupation:</span>
                    <p className="font-medium text-slate-800 mt-0.5">{lead.occupation || 'Service / Professional'}</p>
                  </div>
                </div>
              </div>

              {/* Property Requirements with Manual Staff Budget Editing */}
              <div className="p-4 bg-slate-50 dark:bg-neutral-850 border border-slate-200 dark:border-neutral-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-neutral-400 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-blue-600" />
                    <span>Property Requirements & Budget</span>
                  </h4>
                  {!isEditingBudget && (
                    <button
                      type="button"
                      onClick={() => setIsEditingBudget(true)}
                      className="px-2.5 py-1 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                      title="Manually update this customer's budget"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Edit Budget</span>
                    </button>
                  )}
                </div>

                {budgetSavedFeedback && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-1.5 animate-fadeIn">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Customer budget updated! Active pipeline value has been recalculated.</span>
                  </div>
                )}

                {/* Inline Manual Budget Editor */}
                {isEditingBudget ? (
                  <div className="p-3.5 bg-white dark:bg-neutral-900 border border-blue-200 dark:border-blue-800 rounded-xl space-y-3 shadow-xs">
                    <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2">
                      <span className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                        <Coins className="w-3.5 h-3.5 text-amber-500" />
                        <span>Update Customer Budget Manually</span>
                      </span>
                      <span className="text-[10px] text-neutral-500 font-mono">
                        Pipeline Value: ₹{((Number(budgetMax) || Number(budgetMin) || 0) / 100000).toFixed(1)} Lakhs
                      </span>
                    </div>

                    {/* Presets Chips */}
                    <div>
                      <span className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider">Quick Presets:</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {BUDGET_PRESETS.map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setBudgetMin(preset.min);
                              setBudgetMax(preset.max);
                            }}
                            className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium transition-all cursor-pointer border ${
                              budgetMin === preset.min && budgetMax === preset.max
                                ? 'bg-blue-600 text-white border-blue-600 font-bold'
                                : 'bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Min & Max inputs */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                          Min Budget (₹)
                        </label>
                        <input
                          type="number"
                          step={50000}
                          value={budgetMin}
                          onChange={(e) => setBudgetMin(Number(e.target.value))}
                          placeholder="4500000"
                          className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
                        />
                        <span className="text-[10px] text-neutral-400 font-mono mt-0.5 block">
                          = ₹{((Number(budgetMin) || 0) / 100000).toFixed(1)} Lakhs
                        </span>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                          Max Budget (₹)
                        </label>
                        <input
                          type="number"
                          step={50000}
                          value={budgetMax}
                          onChange={(e) => setBudgetMax(Number(e.target.value))}
                          placeholder="6500000"
                          className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
                        />
                        <span className="text-[10px] text-neutral-400 font-mono mt-0.5 block">
                          = ₹{((Number(budgetMax) || 0) / 100000).toFixed(1)} Lakhs
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-neutral-100 dark:border-neutral-800">
                      <button
                        type="button"
                        onClick={() => {
                          setBudgetMin(Number(lead.budgetMin) || 0);
                          setBudgetMax(Number(lead.budgetMax) || 0);
                          setIsEditingBudget(false);
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveBudget}
                        disabled={isSavingBudget}
                        className="px-3.5 py-1.5 bg-black hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black rounded-lg text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isSavingBudget ? 'Saving...' : 'Save & Update Pipeline'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 dark:text-neutral-400">Project Preference:</span>
                      <p className="font-semibold text-blue-700 dark:text-blue-400 mt-0.5">{lead.projectName || 'Jeevika Heights'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-neutral-400">Property Type:</span>
                      <p className="font-semibold text-slate-900 dark:text-neutral-100 mt-0.5">{lead.propertyType || '2 BHK'}</p>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-slate-500 dark:text-neutral-400">Budget Range / Pipeline:</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        {Number(lead.budgetMax || lead.budgetMin || 0) > 0 ? (
                          <p className="font-mono text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                            ₹{((Number(lead.budgetMin || 0)) / 100000).toFixed(1)}L - ₹{((Number(lead.budgetMax || 0)) / 100000).toFixed(1)}L
                          </p>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                            Budget Not Set (Click Edit Budget)
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-neutral-400">Purchase Purpose:</span>
                      <p className="font-medium text-slate-800 dark:text-neutral-200 mt-0.5">{lead.purchasePurpose || 'Self-use'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-neutral-400">Timeline:</span>
                      <p className="font-medium text-slate-800 dark:text-neutral-200 mt-0.5">{lead.purchaseTimeline || '1-3 Months'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-neutral-400">Home Loan Needed:</span>
                      <p className="font-medium text-slate-800 dark:text-neutral-200 mt-0.5">{lead.loanRequirement ? 'Yes (Bank Loan)' : 'Self Financed'}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Source & Meta Ads Ingestion Metadata */}
              {lead.metaLeadId && (
                <div className="p-3.5 bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/50 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    {lead.source?.toLowerCase().includes('instagram') ? (
                      <InstagramBrandIcon className="w-4 h-4" />
                    ) : (
                      <FacebookBrandIcon className="w-4 h-4 fill-[#1877F2]" />
                    )}
                    <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300">
                      {lead.source?.toLowerCase().includes('instagram') ? 'Instagram Ads' : 'Facebook Ads'} Campaign Metadata
                    </h4>
                  </div>
                  <div className="text-[11px] text-neutral-700 dark:text-neutral-300 space-y-1 font-mono">
                    <p><span className="text-neutral-500 dark:text-neutral-400">Form:</span> {lead.metaFormName || 'FB Lead Form'}</p>
                    <p><span className="text-neutral-500 dark:text-neutral-400">Campaign:</span> {lead.metaCampaignName || 'Wakad_Campaign_2026'}</p>
                    <p><span className="text-neutral-500 dark:text-neutral-400">Lead ID:</span> {lead.metaLeadId}</p>
                  </div>
                </div>
              )}

              {/* Call Notes & Internal Remarks */}
              <div className="p-4 bg-neutral-50 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 rounded-2xl space-y-2.5 transition-colors">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">Call Notes & Remarks</h4>
                  <div className="flex items-center gap-2">
                    {noteSavedFeedback && (
                      <span className="text-[11px] font-bold text-neutral-900 dark:text-white flex items-center gap-1">
                        <Check className="w-3 h-3" /> Saved!
                      </span>
                    )}
                    <button
                      onClick={handleSaveNotes}
                      className="px-3 py-1 bg-black hover:bg-neutral-800 text-white dark:bg-white dark:text-black dark:hover:bg-neutral-200 rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      Save Notes
                    </button>
                  </div>
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl p-3 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                  placeholder="Record customer discussion, preferences, loan status..."
                />
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-4">
              {/* Record New Activity Composer */}
              <form onSubmit={handleManualAddLog} className="p-4 bg-neutral-50 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 rounded-2xl space-y-3 transition-colors">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-2">
                    <History className="w-4 h-4" /> Record New Activity / Interaction
                  </h4>
                  {logSavedSuccess && (
                    <span className="text-[11px] font-bold text-neutral-900 dark:text-white flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Log Recorded!
                    </span>
                  )}
                </div>

                {/* Interaction Type Pills */}
                <div className="flex flex-wrap gap-1.5">
                  {(['Call', 'WhatsApp', 'Meeting', 'Site Visit', 'Discussion', 'Note'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewLogType(type)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                        newLogType === type
                          ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                          : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 hover:text-black dark:hover:text-white'
                      }`}
                    >
                      {type === 'Call' && '📞 Phone Call'}
                      {type === 'WhatsApp' && '💬 WhatsApp'}
                      {type === 'Meeting' && '🤝 Meeting'}
                      {type === 'Site Visit' && '📍 Site Visit'}
                      {type === 'Discussion' && '🗣️ Discussion'}
                      {type === 'Note' && '📝 Note'}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <textarea
                    value={newLogText}
                    onChange={(e) => setNewLogText(e.target.value)}
                    rows={2}
                    required
                    className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                    placeholder={`Describe details for this ${newLogType.toLowerCase()}... (e.g. Spoke with client regarding floor preference)`}
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!newLogText.trim()}
                      className="px-4 py-1.5 bg-black hover:bg-neutral-800 disabled:opacity-40 text-white dark:bg-white dark:text-black dark:hover:bg-neutral-200 rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      + Record Activity Log
                    </button>
                  </div>
                </div>
              </form>

              {/* Activity Timeline List */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    Audit Timeline History ({leadActivities.length})
                  </span>
                </div>

                {leadActivities.length === 0 ? (
                  <div className="p-8 text-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl">
                    <History className="w-6 h-6 text-neutral-400 mx-auto mb-2 opacity-50" />
                    <p className="text-xs text-neutral-400 dark:text-neutral-500">No activity history recorded yet for this lead.</p>
                  </div>
                ) : (
                  leadActivities.map(act => (
                    <div
                      key={act.id}
                      className="p-3.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs space-y-1.5 shadow-2xs transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-black text-white dark:bg-white dark:text-black font-mono">
                          {act.eventType.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                          {new Date(act.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                      <p className="text-neutral-900 dark:text-neutral-100 font-medium leading-relaxed">
                        {act.description}
                      </p>
                      <div className="flex items-center justify-between pt-1 border-t border-neutral-100 dark:border-neutral-800/80 text-[10px] text-neutral-500 dark:text-neutral-400 font-mono">
                        <span>Logged by: {act.actorName} ({act.actorRole})</span>
                        {act.newValue && (
                          <span className="text-neutral-700 dark:text-neutral-300 font-semibold">Value: {act.newValue}</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'followups' && (
            <div className="space-y-3">
              {leadFollowups.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No follow-ups scheduled for this lead.</p>
              ) : (
                leadFollowups.map(fol => (
                  <div key={fol.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{fol.type}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${fol.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {fol.status}
                      </span>
                    </div>
                    <p className="text-slate-700">Date: {fol.scheduledDate} {fol.scheduledTime}</p>
                    {fol.notes && <p className="text-slate-500 italic">"{fol.notes}"</p>}
                    {fol.outcome && <p className="text-emerald-700">Outcome: {fol.outcome}</p>}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'visits' && (
            <div className="space-y-3">
              {leadVisits.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No site visits scheduled.</p>
              ) : (
                leadVisits.map(vis => (
                  <div key={vis.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-700">{vis.projectName}</span>
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-[10px] font-bold">{vis.status}</span>
                    </div>
                    <p className="text-slate-700">Date: {vis.visitDate} at {vis.visitTime} ({vis.visitorsCount} visitors)</p>
                    {vis.feedback && <p className="text-slate-700 mt-1">Feedback: {vis.feedback}</p>}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'booking' && (
            <div className="space-y-3">
              {leadBookings.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No booking transaction recorded.</p>
              ) : (
                leadBookings.map(b => (
                  <div key={b.id} className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-900 text-sm">{b.projectName} (Unit {b.unitNumber})</span>
                      <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded font-bold text-[10px]">
                        {b.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-slate-700 font-mono">
                      <p>Agreed Value: ₹{b.agreedPrice.toLocaleString('en-IN')}</p>
                      <p>Token Paid: ₹{b.tokenAmount.toLocaleString('en-IN')}</p>
                      <p>Payment Mode: {b.paymentMode}</p>
                      <p>Admin Approved: {b.adminApproved ? 'Yes' : 'Pending'}</p>
                    </div>
                    {b.remarks && <p className="text-slate-600 italic text-[11px]">"{b.remarks}"</p>}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Schedule Followup Modal */}
      {showFollowupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-5 text-slate-900 space-y-3 shadow-2xl">
            <h3 className="text-sm font-bold text-blue-700">Schedule Next Follow-up</h3>
            <form onSubmit={handleScheduleFollowupSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 mb-1">Follow-up Type</label>
                <select value={folType} onChange={(e) => setFolType(e.target.value as any)} className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900">
                  <option value="Phone Call">Phone Call</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Site Visit Meeting">Site Visit Meeting</option>
                  <option value="Office Meeting">Office Meeting</option>
                  <option value="Documentation">Documentation</option>
                  <option value="Loan Discussion">Loan Discussion</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 mb-1">Date</label>
                  <input type="date" value={folDate} onChange={(e) => setFolDate(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900" />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Time</label>
                  <input type="text" value={folTime} onChange={(e) => setFolTime(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900" placeholder="11:00 AM" />
                </div>
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Notes / Action Item</label>
                <textarea value={folNotes} onChange={(e) => setFolNotes(e.target.value)} rows={2} className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900" placeholder="Call customer regarding SBI loan approval..." />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowFollowupModal(false)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded">Cancel</button>
                <button type="submit" className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold">Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule / Record Site Visit Modal */}
      {showVisitModal && (
        <RecordSiteVisitModal
          lead={lead}
          onClose={() => setShowVisitModal(false)}
          onSuccess={() => {
            setStage('Site Visit');
            setSubStatus('Site Visit Scheduled');
            setShowVisitModal(false);
          }}
        />
      )}

      {/* Record Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-5 text-slate-900 space-y-3 shadow-2xl">
            <h3 className="text-sm font-bold text-amber-700">Record Unit Booking</h3>
            {bookingError && (
              <div className="p-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{bookingError}</span>
              </div>
            )}
            <form onSubmit={handleCreateBookingSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 mb-1">Select Unit / Flat Number</label>
                <select value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900">
                  {localStore.inventory.filter(u => u.status === 'Available').map(u => (
                    <option key={u.id} value={u.unitNumber}>
                      {u.unitNumber} ({u.unitType} - {u.projectName})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 mb-1">Agreed Price (₹)</label>
                  <input type="number" value={agreedPrice} onChange={(e) => setAgreedPrice(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900 font-mono" />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Token Amount (₹)</label>
                  <input type="number" value={tokenAmount} onChange={(e) => setTokenAmount(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900 font-mono" />
                </div>
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Payment Mode</label>
                <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value as any)} className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900">
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="Bank Transfer / NEFT">Bank Transfer / NEFT</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Credit Card">Credit Card</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Booking Remarks</label>
                <textarea value={bookingRemarks} onChange={(e) => setBookingRemarks(e.target.value)} rows={2} className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900" placeholder="Token transaction ID, bank reference..." />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowBookingModal(false)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded">Cancel</button>
                <button type="submit" className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold">Submit Booking</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(drawerContent, document.body)
    : drawerContent;
};

export default LeadDrawer;
