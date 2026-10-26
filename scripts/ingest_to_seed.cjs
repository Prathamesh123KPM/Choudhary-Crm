const fs = require('fs');
const path = require('path');

const leadsPath = path.join(__dirname, '../data/facebook_leads.json');
const allLeads = JSON.parse(fs.readFileSync(leadsPath, 'utf8'));

console.log('Total leads available:', allLeads.length);

// Map forms to CRM projects
function mapProject(formName) {
  const f = (formName || '').toLowerCase();
  if (f.includes('row house')) return { projectId: 'proj-002', projectName: 'Fia Woods' };
  if (f.includes('fia woods') || f.includes('fia')) return { projectId: 'proj-002', projectName: 'Fia Woods' };
  if (f.includes('jeeveeka') || f.includes('jeevika')) return { projectId: 'proj-001', projectName: 'Jeevika Heights' };
  if (f.includes('tembhode') || f.includes('decent')) return { projectId: 'proj-004', projectName: 'Decent Touch' };
  if (f.includes('kiara')) return { projectId: 'proj-003', projectName: 'Fia Kiara' };
  if (f.includes('prithvi')) return { projectId: 'proj-005', projectName: 'Prithvi Anand' };
  return { projectId: 'proj-001', projectName: 'Jeevika Heights' };
}

// Convert configuration string
function formatPropertyType(config) {
  if (!config) return '1 BHK';
  const c = config.toLowerCase();
  if (c.includes('2_bhk') || c.includes('2 bhk')) return '2 BHK';
  if (c.includes('3_bhk') || c.includes('3 bhk')) return '3 BHK';
  if (c.includes('row_house') || c.includes('row house')) return '2 BHK';
  return '1 BHK';
}

// Employees for round-robin assignment
const employees = [
  { id: 'emp-005', name: 'Saloni' },
  { id: 'emp-006', name: 'Hema' },
  { id: 'emp-007', name: 'Mohini' },
  { id: 'emp-008', name: 'Achal' },
  { id: 'emp-002', name: 'Mahi' },
  { id: 'emp-003', name: 'Varsha' },
  { id: 'emp-004', name: 'Vishal' },
  { id: 'emp-001', name: 'Surendra' }
];

// Let's take the 60 most recent leads and turn them into Lead items
const recentLeads = allLeads.slice(0, 60).map((l, index) => {
  const proj = mapProject(l.formName);
  const propType = formatPropertyType(l.configuration);
  // First 10 leads unassigned in Inbox for real inbox testing, rest assigned
  const isInbox = index < 10;
  const emp = isInbox ? { id: '', name: '' } : employees[index % employees.length];

  return {
    id: `fb-${l.leadId}`,
    customerName: l.fullName || 'Facebook Lead',
    phone: l.phone || '+91 90000 00000',
    email: l.email || undefined,
    city: l.city || 'Palghar',
    projectId: proj.projectId,
    projectName: proj.projectName,
    propertyType: propType,
    budgetMin: propType === '2 BHK' ? 3800000 : 2500000,
    budgetMax: propType === '2 BHK' ? 4500000 : 3200000,
    purchasePurpose: 'Self-use',
    purchaseTimeline: '1-3 Months',
    loanRequirement: true,
    source: 'Facebook Ads',
    metaLeadId: l.leadId,
    metaFormName: l.formName,
    metaCampaignName: 'Palghar_Lead_Campaign',
    assignedEmployeeId: emp.id,
    assignedEmployeeName: emp.name,
    stage: isInbox ? 'New lead' : 'Opportunity',
    subStatus: isInbox ? 'Unassigned' : 'Contacted',
    priority: index < 15 ? 'Hot' : 'Warm',
    score: 85,
    nextFollowupDate: new Date().toISOString().split('T')[0],
    notes: `Meta Lead captured from Form: "${l.formName}". Config: ${l.configuration || 'Interested'}. City: ${l.city || 'Palghar'}.`,
    createdAt: l.createdTime ? new Date(l.createdTime).toISOString() : new Date().toISOString(),
    updatedAt: l.createdTime ? new Date(l.createdTime).toISOString() : new Date().toISOString()
  };
});

fs.writeFileSync(path.join(__dirname, '../data/crm_imported_leads.json'), JSON.stringify(recentLeads, null, 2));
console.log('Saved 60 recent leads to crm_imported_leads.json');
