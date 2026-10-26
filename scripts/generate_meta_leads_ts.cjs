const fs = require('fs');
const path = require('path');

const leadsPath = path.join(__dirname, '../data/crm_imported_leads.json');
const leads = JSON.parse(fs.readFileSync(leadsPath, 'utf8'));

const tsContent = `import { Lead } from '../types/crm';

export const REAL_META_LEADS: Lead[] = ${JSON.stringify(leads, null, 2)};
`;

fs.writeFileSync(path.join(__dirname, '../src/data/metaLeads.ts'), tsContent);
console.log('Successfully generated src/data/metaLeads.ts with', leads.length, 'leads');
