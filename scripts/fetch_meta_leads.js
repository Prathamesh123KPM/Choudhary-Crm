require('dotenv').config();
const fs = require('fs');
const path = require('path');

const PAGE_ID = process.env.META_PAGE_ID || '648120298387969';
const PAGE_ACCESS_TOKEN = process.env.META_PAGE_ACCESS_TOKEN;

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return await res.json();
}

async function getAllForms() {
  let forms = [];
  let nextUrl = `https://graph.facebook.com/v20.0/${PAGE_ID}/leadgen_forms?access_token=${PAGE_ACCESS_TOKEN}&limit=50`;

  while (nextUrl) {
    console.log(`Fetching forms: ${nextUrl}`);
    const data = await fetchJson(nextUrl);
    if (data.data && Array.isArray(data.data)) {
      forms.push(...data.data);
    }
    nextUrl = data.paging?.next || null;
  }
  return forms;
}

async function getLeadsForForm(formId, formName) {
  let leads = [];
  let nextUrl = `https://graph.facebook.com/v20.0/${formId}/leads?access_token=${PAGE_ACCESS_TOKEN}&limit=100`;

  while (nextUrl) {
    const data = await fetchJson(nextUrl);
    if (data.data && Array.isArray(data.data)) {
      for (const item of data.data) {
        let parsed = {
          leadId: item.id,
          formId: formId,
          formName: formName,
          createdTime: item.created_time,
          fullName: '',
          phone: '',
          email: '',
          city: '',
          configuration: '',
          lookingInPalghar: '',
          rawFieldData: {}
        };

        if (item.field_data) {
          for (const field of item.field_data) {
            const val = field.values && field.values.length > 0 ? field.values[0] : '';
            parsed.rawFieldData[field.name] = val;

            const nameLow = (field.name || '').toLowerCase();
            if (nameLow.includes('name') || nameLow === 'full_name') {
              parsed.fullName = val;
            } else if (nameLow.includes('phone') || nameLow === 'phone_number') {
              parsed.phone = val;
            } else if (nameLow.includes('email')) {
              parsed.email = val;
            } else if (nameLow.includes('city')) {
              parsed.city = val;
            } else if (nameLow.includes('config') || nameLow.includes('bhk')) {
              parsed.configuration = val;
            } else if (nameLow.includes('palghar')) {
              parsed.lookingInPalghar = val;
            }
          }
        }
        leads.push(parsed);
      }
    }
    nextUrl = data.paging?.next || null;
  }
  return leads;
}

async function run() {
  try {
    console.log('Fetching forms for page:', PAGE_ID);
    const forms = await getAllForms();
    console.log(`Found ${forms.length} forms.`);

    let allLeads = [];
    let formSummary = [];

    for (const form of forms) {
      process.stdout.write(`Fetching leads for form "${form.name}" (${form.id})... `);
      try {
        const leads = await getLeadsForForm(form.id, form.name);
        console.log(`-> ${leads.length} leads`);
        formSummary.push({
          formId: form.id,
          formName: form.name,
          status: form.status,
          leadCount: leads.length
        });
        allLeads.push(...leads);
      } catch (err) {
        console.log(`Error: ${err.message}`);
      }
    }

    // Sort leads by createdTime desc
    allLeads.sort((a, b) => new Date(b.createdTime) - new Date(a.createdTime));

    console.log(`\n========================================`);
    console.log(`TOTAL LEADS FETCHED: ${allLeads.length}`);
    console.log(`========================================\n`);

    const outputDir = path.join(__dirname, '../data');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save JSON
    const jsonPath = path.join(outputDir, 'facebook_leads.json');
    fs.writeFileSync(jsonPath, JSON.stringify(allLeads, null, 2));
    console.log(`Saved JSON to: ${jsonPath}`);

    // Save CSV
    const csvPath = path.join(outputDir, 'facebook_leads.csv');
    const header = 'Created Time,Full Name,Phone Number,Email,City,Configuration,Form Name,Looking In Palghar,Lead ID\n';
    const rows = allLeads.map(l => {
      const clean = (str) => `"${(str || '').replace(/"/g, '""')}"`;
      return [
        clean(l.createdTime),
        clean(l.fullName),
        clean(l.phone),
        clean(l.email),
        clean(l.city),
        clean(l.configuration),
        clean(l.formName),
        clean(l.lookingInPalghar),
        clean(l.leadId)
      ].join(',');
    }).join('\n');

    fs.writeFileSync(csvPath, header + rows);
    console.log(`Saved CSV to: ${csvPath}`);

    // Save Form Summary
    const summaryPath = path.join(outputDir, 'forms_summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(formSummary, null, 2));

    console.log('\nTop 20 Most Recent Leads:');
    allLeads.slice(0, 20).forEach((l, idx) => {
      console.log(`${idx + 1}. [${l.createdTime}] ${l.fullName} | ${l.phone} | ${l.email} | ${l.city} | ${l.formName} | ${l.configuration}`);
    });

  } catch (error) {
    console.error('Fatal error:', error);
  }
}

run();
