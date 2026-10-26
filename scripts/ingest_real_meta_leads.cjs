const fs = require('fs');
const path = require('path');

const leadsPath = path.join(__dirname, '../data/facebook_leads.json');
if (!fs.existsSync(leadsPath)) {
  console.error('facebook_leads.json not found!');
  process.exit(1);
}

const allRawLeads = JSON.parse(fs.readFileSync(leadsPath, 'utf8'));
console.log('Total raw Meta leads to convert:', allRawLeads.length);

function mapProject(formName) {
  const f = (formName || '').toLowerCase();
  if (f.includes('row house')) return { projectId: 'proj-002', projectName: 'Fia Woods' };
  if (f.includes('fia woods') || f.includes('fia')) return { projectId: 'proj-002', projectName: 'Fia Woods' };
  if (f.includes('nivas')) return { projectId: 'proj-001', projectName: 'Jeevika Heights' };
  if (f.includes('tembhode') || f.includes('decent')) return { projectId: 'proj-004', projectName: 'Decent Touch' };
  if (f.includes('kiara')) return { projectId: 'proj-003', projectName: 'Fia Kiara' };
  if (f.includes('prithvi') || f.includes('prebook')) return { projectId: 'proj-005', projectName: 'Prithvi Anand' };
  if (f.includes('k bafna')) return { projectId: 'proj-004', projectName: 'Decent Touch' };
  return { projectId: 'proj-001', projectName: 'Jeevika Heights' };
}

function formatPropertyType(config, formName) {
  const f = (formName || '').toLowerCase();
  const c = (config || '').toLowerCase();
  if (f.includes('row house') || c.includes('row_house')) return '2 BHK';
  if (c.includes('2_bhk') || c.includes('2 bhk')) return '2 BHK';
  if (c.includes('3_bhk') || c.includes('3 bhk')) return '3 BHK';
  if (c.includes('1_bhk') || c.includes('1 bhk')) return '1 BHK';
  return '1 BHK';
}

function parseBudget(config, propType) {
  const c = (config || '').toLowerCase();
  if (c.includes('35_lakh') || c.includes('35 lakh')) return { min: 3500000, max: 4200000 };
  if (c.includes('25_lakh') || c.includes('25 lakh')) return { min: 2500000, max: 3200000 };
  if (c.includes('20_lakh') || c.includes('20 lakh')) return { min: 2000000, max: 2600000 };
  if (c.includes('17.50_lakh') || c.includes('17.5')) return { min: 1750000, max: 2200000 };
  if (c.includes('16.23')) return { min: 1623000, max: 2100000 };
  if (propType === '2 BHK') return { min: 3800000, max: 4800000 };
  if (propType === '3 BHK') return { min: 5500000, max: 7500000 };
  return { min: 2200000, max: 3000000 };
}

// Sales representatives
const employees = [
  { id: 'emp-001', name: 'Surendra' },
  { id: 'emp-002', name: 'Mahi' },
  { id: 'emp-003', name: 'Varsha' },
  { id: 'emp-004', name: 'Vishal' },
  { id: 'emp-005', name: 'Saloni' },
  { id: 'emp-006', name: 'Hema' },
  { id: 'emp-007', name: 'Mohini' },
  { id: 'emp-008', name: 'Achal' },
  { id: 'admin-002', name: 'Heena' }
];

const stagesDistribution = [
  { stage: 'Opportunity', subStatus: 'Interested' },
  { stage: 'Whatsapp', subStatus: 'Brochure Sent' },
  { stage: 'Ringing', subStatus: 'Callback Requested' },
  { stage: 'Opportunity', subStatus: 'Contacted' },
  { stage: 'Visit done', subStatus: 'Site Visit Scheduled' },
  { stage: 'Whatsapp', subStatus: 'Chat Ongoing' },
  { stage: 'Ringing', subStatus: 'Ringing' },
  { stage: 'Opportunity', subStatus: 'Highly Interested' }
];

const convertedLeads = allRawLeads.map((raw, idx) => {
  const proj = mapProject(raw.formName);
  const propType = formatPropertyType(raw.configuration, raw.formName);
  const budget = parseBudget(raw.configuration, propType);

  // First 40 most recent leads from today/yesterday are unassigned in Inbox!
  const isInbox = idx < 40;
  
  // For row house leads, prioritize Mahi (Sales Head Row House)
  let emp;
  if (isInbox) {
    emp = { id: '', name: '' };
  } else if ((raw.formName || '').toLowerCase().includes('row house')) {
    emp = { id: 'emp-002', name: 'Mahi' };
  } else {
    emp = employees[idx % employees.length];
  }

  const stageObj = isInbox
    ? { stage: 'New lead', subStatus: 'Unassigned' }
    : stagesDistribution[idx % stagesDistribution.length];

  const createdDate = raw.createdTime ? new Date(raw.createdTime).toISOString() : new Date().toISOString();
  
  // Extract extra details from rawFieldData
  let noteParts = [`Meta Lead from form "${raw.formName}".`];
  if (raw.configuration) {
    noteParts.push(`Interested in: ${raw.configuration.replace(/_/g, ' ')}`);
  }
  if (raw.city) {
    noteParts.push(`Location/City: ${raw.city}`);
  }
  if (raw.rawFieldData) {
    for (const [k, v] of Object.entries(raw.rawFieldData)) {
      if (typeof v === 'string' && v.trim() && !['full_name', 'phone_number', 'email', 'city', 'inbox_url'].includes(k)) {
        const cleanKey = k.replace(/^[^\w]+/, '').replace(/_/g, ' ');
        noteParts.push(`${cleanKey}: ${v.replace(/_/g, ' ')}`);
      }
    }
  }

  return {
    id: `meta-${raw.leadId}`,
    customerName: raw.fullName || 'Meta Lead',
    phone: raw.phone || '+91 90000 00000',
    email: raw.email || '',
    city: raw.city || 'Palghar',
    projectId: proj.projectId,
    projectName: proj.projectName,
    propertyType: propType,
    budgetMin: budget.min,
    budgetMax: budget.max,
    purchasePurpose: 'Self-use',
    purchaseTimeline: '1-3 Months',
    loanRequirement: true,
    source: 'Facebook Ads',
    metaLeadId: raw.leadId,
    metaFormName: raw.formName,
    metaCampaignName: 'Palghar_Lead_Campaign',
    assignedEmployeeId: emp.id,
    assignedEmployeeName: emp.name,
    assigned_to: emp.id,
    assignedTo: emp.id,
    stage: stageObj.stage,
    subStatus: stageObj.subStatus,
    priority: idx < 100 ? 'Hot' : idx < 500 ? 'Warm' : 'Cold',
    score: idx < 100 ? 90 : 75,
    nextFollowupDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    notes: noteParts.join(' | '),
    createdAt: createdDate,
    updatedAt: createdDate
  };
});

fs.writeFileSync(
  path.join(__dirname, '../data/crm_imported_leads.json'),
  JSON.stringify(convertedLeads, null, 2),
  'utf8'
);

console.log(`Successfully converted and saved ${convertedLeads.length} real estate leads into data/crm_imported_leads.json!`);
