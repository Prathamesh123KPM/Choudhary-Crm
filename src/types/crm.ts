export type UserRole = 'owner' | 'team_leader' | 'employee' | 'admin';

export interface CRMUser {
  uid: string;
  id?: string;
  username?: string;
  email: string;
  displayName: string;
  role: UserRole;
  designation?: string; // e.g. "Owner & Managing Director", "Sales Head & Lead Manager"
  employeeCode?: string; // e.g. OWNER-01, HEAD-01, EMP-01
  teamId?: string;
  teamName?: string;
  managedEmployeeIds?: string[];
  phone?: string;
  avatarUrl?: string;
  active: boolean;
  createdAt: string;
  lastActiveAt?: string;
  mustChangePassword?: boolean;
  passwordHash?: string;
}

export type LeadStage =
  | 'New lead'
  | 'Ringing'
  | 'Whatsapp'
  | 'Opportunity'
  | 'Site Visit'
  | 'Visit done'
  | 'Revisit'
  | 'Unqualified'
  | 'Lost';

export type LeadSubStatus =
  // New lead
  | 'Unassigned'
  | 'Assigned'
  | 'Not Contacted'
  // Ringing
  | 'Ringing'
  | 'No Answer'
  | 'Busy'
  | 'Switched Off'
  | 'Not Reachable'
  | 'Wrong Number'
  | 'Callback Requested'
  // Whatsapp
  | 'Message Sent'
  | 'Chat Ongoing'
  | 'Brochure Sent'
  | 'Details Shared'
  | 'Replied'
  // Opportunity
  | 'Contacted'
  | 'Interested'
  | 'Highly Interested'
  | 'Budget Discussion'
  | 'Loan Discussion'
  | 'Token Received'
  | 'Negotiation'
  // Visit done
  | 'Site Visit Completed'
  | 'Site Visit Scheduled'
  | 'Site Visit Confirmed'
  | 'Feedback Positive'
  | 'Decision Pending'
  | 'Booked'
  // Revisit
  | 'Revisit Scheduled'
  | 'Revisit Completed'
  | 'Family Revisit'
  // Unqualified
  | 'Budget Mismatch'
  | 'Location Mismatch'
  | 'Not Interested'
  | 'Invalid Lead'
  | 'Duplicate'
  // Lost
  | 'Lost'
  | 'Lost to Competitor'
  | 'Dropped Plan'
  | 'Price Too High'
  | 'No Response'
  | 'Closed Won';

export const LEAD_SUB_STATUS_OPTIONS: Record<LeadStage, LeadSubStatus[]> = {
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

export type LeadPriority = 'Hot' | 'Warm' | 'Cold';

export interface LeadRequirement {
  propertyType: '1 BHK' | '2 BHK' | '3 BHK' | '4 BHK Villa' | 'Plot' | 'Commercial Office' | 'Retail Shop';
  budgetMin: number;
  budgetMax: number;
  purchasePurpose: 'Self-use' | 'Investment';
  purchaseTimeline: 'Immediate' | '1-3 Months' | '3-6 Months' | '6+ Months';
  loanRequirement: boolean;
  preferredPossession?: string;
  additionalNotes?: string;
}

export interface Lead {
  id: string;
  customerName: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  whatsappNumber?: string;
  city?: string;
  occupation?: string;
  preferredLanguage?: string;
  
  // Requirement
  projectId?: string;
  projectName?: string;
  propertyType?: string;
  budgetMin?: number;
  budgetMax?: number;
  purchasePurpose?: string;
  purchaseTimeline?: string;
  loanRequirement?: boolean;
  
  // Source & Meta Ingestion
  source: 'Facebook Ads' | 'Instagram Ads' | 'Manual Call' | 'WhatsApp' | 'Website Form' | 'Walk-in' | 'Referral';
  metaLeadId?: string;
  metaFormName?: string;
  metaCampaignName?: string;
  metaAdsetName?: string;
  metaAdName?: string;
  
  // CRM Ownership & Status
  assignedEmployeeId?: string; // empty string or null if unassigned
  assignedEmployeeName?: string;
  assigned_to?: string; // Explicit alias for assignedEmployeeId
  assignedTo?: string;
  stage: LeadStage;
  subStatus: LeadSubStatus;
  priority: LeadPriority;
  score?: number; // 0 - 100
  
  // Dates & Notes
  nextFollowupDate?: string;
  lastContactedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Followup {
  id: string;
  leadId: string;
  leadName: string;
  leadPhone: string;
  employeeId: string;
  employeeName: string;
  type: 'Phone Call' | 'WhatsApp' | 'Site Visit Meeting' | 'Office Meeting' | 'Documentation' | 'Loan Discussion';
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime?: string; // HH:mm
  notes?: string;
  priority?: 'High' | 'Medium' | 'Low';
  status: 'Upcoming' | 'Due Today' | 'Overdue' | 'Completed' | 'Rescheduled' | 'Cancelled';
  outcome?: string;
  createdAt: string;
  completedAt?: string;
}

export interface SiteVisit {
  id: string;
  leadId: string;
  leadName: string;
  leadPhone: string;
  projectId: string;
  projectName: string;
  projectNames?: string[]; // Multiple properties visited / scheduled
  employeeId: string;
  employeeName: string;
  visitDate: string; // YYYY-MM-DD
  visitTime: string; // HH:mm
  visitorsCount: number;
  transportNeeded: boolean;
  status: 'Requested' | 'Scheduled' | 'Confirmed' | 'Completed' | 'Rescheduled' | 'Cancelled' | 'No-Show' | 'Revisit';
  feedback?: string;
  bookingProbability?: 'High' | 'Medium' | 'Low';
  createdAt: string;
  completedAt?: string;
}

export interface InventoryUnit {
  id: string;
  projectId: string;
  projectName: string;
  buildingWing: string;
  floorNumber: number;
  unitNumber: string; // e.g. A-102
  unitType: '1 BHK' | '2 BHK' | '3 BHK' | '4 BHK Villa' | 'Plot' | 'Commercial Office';
  carpetAreaSqFt: number;
  price: number;
  status: 'Available' | 'On Hold' | 'Booked' | 'Sold';
  bookedByLeadId?: string;
  bookedByEmployeeId?: string;
}

export interface Project {
  id: string;
  name: string;
  location: string;
  address: string;
  category: 'Residential Apartment' | 'Luxury Villas' | 'Commercial Hub' | 'Residential Plots';
  startingPrice: number; // in INR e.g. 4500000
  description: string;
  possessionDate: string;
  status: 'Under Construction' | 'Ready to Move' | 'Newly Launched';
  reraNumber: string;
  imageUrl?: string;
  mapUrl?: string;
  availableConfigurations: string;
  createdAt: string;
}

export interface Booking {
  id: string;
  leadId: string;
  customerName: string;
  customerPhone: string;
  projectId: string;
  projectName: string;
  unitId: string;
  unitNumber: string;
  agreedPrice: number;
  tokenAmount: number;
  paymentMode: 'UPI' | 'Bank Transfer / NEFT' | 'Cheque' | 'Credit Card';
  tokenDate: string;
  employeeId: string;
  employeeName: string;
  status: 'Booking Requested' | 'Token Pending' | 'Token Received' | 'Confirmed' | 'Agreement Completed' | 'Cancelled';
  remarks?: string;
  adminApproved: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  leadId?: string;
  eventType: 'LEAD_CREATED' | 'LEAD_ASSIGNED' | 'LEAD_TRANSFERRED' | 'STATUS_UPDATED' | 'NOTE_ADDED' | 'FOLLOWUP_SCHEDULED' | 'FOLLOWUP_COMPLETED' | 'SITE_VISIT_SCHEDULED' | 'SITE_VISIT_COMPLETED' | 'BOOKING_REQUESTED' | 'BOOKING_APPROVED' | 'META_INGESTION' | 'IMPERSONATION_STARTED' | 'IMPERSONATION_ENDED' | 'LEAD_EXPORTED';
  description: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  previousValue?: string;
  newValue?: string;
  timestamp: string;
}

export interface MetaIntegration {
  id: string;
  pageName: string;
  pageId: string;
  appId: string;
  verifyToken: string;
  webhookStatus: 'Connected' | 'Pending Verification' | 'Disconnected';
  autoAssignmentEnabled: boolean;
  assignmentMode: 'Round Robin' | 'Workload Balanced' | 'Manual Admin Review';
  lastSyncAt: string;
  totalLeadsIngested: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'assignment' | 'followup' | 'visit' | 'booking' | 'system';
  targetUserId?: string; // empty means for all admins
  read: boolean;
  createdAt: string;
  linkLeadId?: string;
}

export interface DailyTask {
  id: string;
  title: string;
  description?: string;
  assignedToId: string;
  assignedToName: string;
  assignedById?: string;
  assignedByName?: string;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // e.g. "11:00 AM"
  priority: 'High' | 'Medium' | 'Low';
  category: 'Call / Follow-up' | 'Site Visit' | 'Rent Department' | 'Car & Transport' | 'Documentation / Accounts' | 'General';
  relatedLeadId?: string;
  relatedLeadName?: string;
  relatedProjectName?: string;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
}
