import { CRMUser, Project, InventoryUnit, Lead, Followup, SiteVisit, Booking, ActivityLog, MetaIntegration, NotificationItem, DailyTask } from '../types/crm';

export const SEED_USERS: CRMUser[] = [
  {
    uid: 'admin-001',
    id: 'admin-001',
    username: 'kishan',
    email: 'kishan@choudharyestate.com',
    displayName: 'Kishan Choudhary',
    role: 'owner',
    designation: 'Owner & Managing Director',
    employeeCode: 'OWNER-01',
    phone: '+91 98220 11223',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    lastActiveAt: new Date().toISOString()
  },
  {
    uid: 'admin-002',
    id: 'admin-002',
    username: 'heena',
    email: 'heena@choudharyestate.com',
    displayName: 'Heena',
    role: 'team_leader',
    designation: 'Team Leader Choudhary Estate',
    employeeCode: 'HEAD-01',
    teamName: "Heena's Sales Team",
    managedEmployeeIds: ['emp-001', 'emp-002', 'emp-003', 'emp-004', 'emp-005', 'emp-006', 'emp-007', 'emp-008'],
    phone: '+91 98220 88776',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    lastActiveAt: new Date().toISOString()
  },
  {
    uid: 'emp-001',
    id: 'emp-001',
    username: 'surendra',
    email: 'surendra.crm@choudharycrm.in',
    displayName: 'Surendra',
    role: 'employee',
    designation: 'CRM and management',
    employeeCode: 'EMP-01',
    phone: '+91 98901 23451',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    active: true,
    createdAt: '2026-01-05T00:00:00.000Z',
    lastActiveAt: new Date().toISOString()
  },
  {
    uid: 'emp-002',
    id: 'emp-002',
    username: 'mahi',
    email: 'mahi@choudharycrm.in',
    displayName: 'Mahi',
    role: 'employee',
    designation: 'Sales head Row house',
    employeeCode: 'EMP-02',
    phone: '+91 98902 34562',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    active: true,
    createdAt: '2026-01-05T00:00:00.000Z',
    lastActiveAt: new Date().toISOString()
  },
  {
    uid: 'emp-003',
    id: 'emp-003',
    username: 'varsha',
    email: 'varsha@choudharycrm.in',
    displayName: 'Varsha',
    role: 'employee',
    designation: 'Sales executive + Rent Department',
    employeeCode: 'EMP-03',
    phone: '+91 98903 45673',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
    active: true,
    createdAt: '2026-01-06T00:00:00.000Z',
    lastActiveAt: new Date().toISOString()
  },
  {
    uid: 'emp-004',
    id: 'emp-004',
    username: 'vishal',
    email: 'vishal@choudharycrm.in',
    displayName: 'Vishal',
    role: 'employee',
    designation: 'Car management and sales executive',
    employeeCode: 'EMP-04',
    phone: '+91 98904 56784',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    active: true,
    createdAt: '2026-01-07T00:00:00.000Z',
    lastActiveAt: new Date().toISOString()
  },
  {
    uid: 'emp-005',
    id: 'emp-005',
    username: 'saloni',
    email: 'saloni@choudharycrm.in',
    displayName: 'Saloni',
    role: 'employee',
    designation: 'Telly caller n sales executive',
    employeeCode: 'EMP-05',
    phone: '+91 98905 67895',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    active: true,
    createdAt: '2026-01-08T00:00:00.000Z',
    lastActiveAt: new Date().toISOString()
  },
  {
    uid: 'emp-006',
    id: 'emp-006',
    username: 'hema',
    email: 'hema@choudharycrm.in',
    displayName: 'Hema',
    role: 'employee',
    designation: 'Telly caller n sales executive',
    employeeCode: 'EMP-06',
    phone: '+91 98906 78906',
    avatarUrl: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150',
    active: true,
    createdAt: '2026-01-10T00:00:00.000Z',
    lastActiveAt: new Date().toISOString()
  },
  {
    uid: 'emp-007',
    id: 'emp-007',
    username: 'mohini',
    email: 'mohini@choudharycrm.in',
    displayName: 'Mohini',
    role: 'employee',
    designation: 'Telly caller n sales executive',
    employeeCode: 'EMP-07',
    phone: '+91 98907 89017',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    active: true,
    createdAt: '2026-01-12T00:00:00.000Z',
    lastActiveAt: new Date().toISOString()
  },
  {
    uid: 'emp-008',
    id: 'emp-008',
    username: 'achal',
    email: 'achal@choudharycrm.in',
    displayName: 'Achal',
    role: 'employee',
    designation: 'Telly caller n sales executive',
    employeeCode: 'EMP-08',
    phone: '+91 98908 90128',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
    active: true,
    createdAt: '2026-01-15T00:00:00.000Z',
    lastActiveAt: new Date().toISOString()
  },
  {
    uid: 'emp-009',
    id: 'emp-009',
    username: 'nitesh',
    email: 'nitesh@choudharycrm.in',
    displayName: 'Nitesh',
    role: 'employee',
    designation: 'Rent Head',
    employeeCode: 'EMP-09',
    phone: '+91 98909 01239',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
    active: true,
    createdAt: '2026-01-18T00:00:00.000Z',
    lastActiveAt: new Date().toISOString()
  },
  {
    uid: 'emp-010',
    id: 'emp-010',
    username: 'surendra-acc',
    email: 'surendra.accounts@choudharycrm.in',
    displayName: 'Surendra (Accountant)',
    role: 'employee',
    designation: 'Accountant',
    employeeCode: 'EMP-10',
    phone: '+91 98910 12340',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
    active: true,
    createdAt: '2026-01-20T00:00:00.000Z',
    lastActiveAt: new Date().toISOString()
  }
];

export const SEED_PROJECTS: Project[] = [
  {
    id: 'proj-001',
    name: 'Jeevika Heights',
    location: 'Palghar East',
    address: 'Palghar East, Palghar, Maharashtra 401404',
    category: 'Residential Apartment',
    startingPrice: 3800000, // 38 Lakhs
    description: 'Contemporary 1 & 2 BHK high-rise residences with modern amenities, rooftop terrace lounge, and children play area in Palghar East.',
    possessionDate: 'December 2026',
    status: 'Under Construction',
    reraNumber: 'P52100062145',
    imageUrl: '',
    availableConfigurations: '1 BHK (450 sqft), 2 BHK (680 sqft)',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'proj-002',
    name: 'Fia Woods',
    location: 'Palghar East',
    address: 'Palghar East, Palghar, Maharashtra 401404',
    category: 'Luxury Villas',
    startingPrice: 7500000, // 75 Lakhs
    description: 'Serene nature-integrated 2 & 3 BHK luxury residences and row houses surrounded by landscaped gardens in Palghar East.',
    possessionDate: 'March 2027',
    status: 'Newly Launched',
    reraNumber: 'P52100063289',
    imageUrl: '',
    availableConfigurations: '2 BHK (780 sqft), 3 BHK (1150 sqft)',
    createdAt: '2026-01-02T00:00:00.000Z'
  },
  {
    id: 'proj-003',
    name: 'Fia Kiara',
    location: 'Palghar West',
    address: 'Palghar West, Palghar, Maharashtra 401404',
    category: 'Residential Apartment',
    startingPrice: 4200000, // 42 Lakhs
    description: 'Premium modern urban residences featuring spacious 1 & 2 BHK flats with designer lobby, gym, and lifestyle amenities in Palghar West.',
    possessionDate: 'June 2027',
    status: 'Under Construction',
    reraNumber: 'P52100064102',
    imageUrl: '',
    availableConfigurations: '1 BHK (475 sqft), 2 BHK (720 sqft)',
    createdAt: '2026-01-03T00:00:00.000Z'
  },
  {
    id: 'proj-004',
    name: 'Decent Touch',
    location: 'Palghar East',
    address: 'Palghar East, Palghar, Maharashtra 401404',
    category: 'Residential Apartment',
    startingPrice: 3200000, // 32 Lakhs
    description: 'Affordable modern 1 & 2 BHK apartments offering optimal space planning, clubhouse, power backup, and 24x7 security in Palghar East.',
    possessionDate: 'Ready to Move',
    status: 'Ready to Move',
    reraNumber: 'P52100065781',
    imageUrl: '',
    availableConfigurations: '1 BHK (420 sqft), 2 BHK (610 sqft)',
    createdAt: '2026-01-04T00:00:00.000Z'
  },
  {
    id: 'proj-005',
    name: 'Prithvi Anand',
    location: 'Palghar East',
    address: 'Palghar East, Palghar, Maharashtra 401404',
    category: 'Residential Apartment',
    startingPrice: 3500000, // 35 Lakhs
    description: 'Vastu-compliant 1 & 2 BHK residences designed with excellent cross-ventilation, landscaped walkways, gym, and community hall in Palghar East.',
    possessionDate: 'December 2026',
    status: 'Under Construction',
    reraNumber: 'P52100066920',
    imageUrl: '',
    availableConfigurations: '1 BHK (440 sqft), 2 BHK (650 sqft)',
    createdAt: '2026-01-05T00:00:00.000Z'
  }
];

export const SEED_INVENTORY: InventoryUnit[] = [
  // 1. Jeevika Heights
  { id: 'unit-101', projectId: 'proj-001', projectName: 'Jeevika Heights', buildingWing: 'Tower A', floorNumber: 1, unitNumber: 'JH-101', unitType: '2 BHK', carpetAreaSqFt: 780, price: 5800000, status: 'Available' },
  { id: 'unit-102', projectId: 'proj-001', projectName: 'Jeevika Heights', buildingWing: 'Tower A', floorNumber: 1, unitNumber: 'JH-102', unitType: '2 BHK', carpetAreaSqFt: 780, price: 5850000, status: 'Booked', bookedByLeadId: 'lead-003', bookedByEmployeeId: 'emp-001' },
  { id: 'unit-103', projectId: 'proj-001', projectName: 'Jeevika Heights', buildingWing: 'Tower A', floorNumber: 2, unitNumber: 'JH-201', unitType: '3 BHK', carpetAreaSqFt: 1120, price: 8200000, status: 'On Hold' },
  { id: 'unit-104', projectId: 'proj-001', projectName: 'Jeevika Heights', buildingWing: 'Tower B', floorNumber: 5, unitNumber: 'JH-504', unitType: '2 BHK', carpetAreaSqFt: 810, price: 6100000, status: 'Available' },

  // 2. Fia Woods
  { id: 'unit-201', projectId: 'proj-002', projectName: 'Fia Woods', buildingWing: 'Woodland Block', floorNumber: 0, unitNumber: 'FW-02', unitType: '4 BHK Villa', carpetAreaSqFt: 3100, price: 19500000, status: 'Available' },
  { id: 'unit-202', projectId: 'proj-002', projectName: 'Fia Woods', buildingWing: 'Pine Block', floorNumber: 0, unitNumber: 'FW-08', unitType: '3 BHK', carpetAreaSqFt: 1850, price: 13500000, status: 'Sold', bookedByLeadId: 'lead-004', bookedByEmployeeId: 'emp-003' },

  // 3. Fia Kiara
  { id: 'unit-301', projectId: 'proj-003', projectName: 'Fia Kiara', buildingWing: 'Tower 1', floorNumber: 2, unitNumber: 'FK-201', unitType: '2 BHK', carpetAreaSqFt: 850, price: 7400000, status: 'Available' },
  { id: 'unit-302', projectId: 'proj-003', projectName: 'Fia Kiara', buildingWing: 'Tower 2', floorNumber: 5, unitNumber: 'FK-504', unitType: '3 BHK', carpetAreaSqFt: 1220, price: 9800000, status: 'Available' },

  // 4. Decent Touch
  { id: 'unit-401', projectId: 'proj-004', projectName: 'Decent Touch', buildingWing: 'Wing A', floorNumber: 1, unitNumber: 'DT-103', unitType: '1 BHK', carpetAreaSqFt: 520, price: 4200000, status: 'Available' },
  { id: 'unit-402', projectId: 'proj-004', projectName: 'Decent Touch', buildingWing: 'Wing B', floorNumber: 3, unitNumber: 'DT-302', unitType: '2 BHK', carpetAreaSqFt: 740, price: 5900000, status: 'Available' },

  // 5. Prithvi Anand
  { id: 'unit-501', projectId: 'proj-005', projectName: 'Prithvi Anand', buildingWing: 'Phase 1', floorNumber: 2, unitNumber: 'PA-201', unitType: '2 BHK', carpetAreaSqFt: 790, price: 6600000, status: 'Available' },
  { id: 'unit-502', projectId: 'proj-005', projectName: 'Prithvi Anand', buildingWing: 'Phase 1', floorNumber: 4, unitNumber: 'PA-403', unitType: '3 BHK', carpetAreaSqFt: 1150, price: 9100000, status: 'Available' }
];

export const SEED_LEADS: Lead[] = [];

export const SEED_FOLLOWUPS: Followup[] = [];

export const SEED_SITE_VISITS: SiteVisit[] = [];

export const SEED_BOOKINGS: Booking[] = [];

export const SEED_META_INTEGRATION: MetaIntegration = {
  id: 'meta-main',
  pageName: 'Choudhary Estate Palghar',
  pageId: '648120298387969',
  appId: '1086271164015475',
  verifyToken: 'choudhary_crm_secure_webhook_token_2026',
  webhookStatus: 'Connected',
  autoAssignmentEnabled: true,
  assignmentMode: 'Round Robin',
  lastSyncAt: new Date().toISOString(),
  totalLeadsIngested: 2241
};

export const SEED_ACTIVITY_LOGS: ActivityLog[] = [];

export const SEED_NOTIFICATIONS: NotificationItem[] = [];

export const SEED_DAILY_TASKS: DailyTask[] = [];
