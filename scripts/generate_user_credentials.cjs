const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const users = [
  {
    uid: 'admin-001',
    email: 'kishan@choudharyestate.com',
    employeeCode: 'OWNER-01',
    displayName: 'Kishan Choudhary',
    role: 'admin',
    tempPassword: 'Choudhary@2026!'
  },
  {
    uid: 'admin-002',
    email: 'heena@choudharyestate.com',
    employeeCode: 'HEAD-01',
    displayName: 'Heena',
    role: 'admin',
    tempPassword: 'Heena#Palghar26'
  },
  {
    uid: 'emp-001',
    email: 'surendra.crm@choudharycrm.in',
    employeeCode: 'EMP-01',
    displayName: 'Surendra',
    role: 'employee',
    tempPassword: 'Surendra$CRM26'
  },
  {
    uid: 'emp-002',
    email: 'mahi@choudharycrm.in',
    employeeCode: 'EMP-02',
    displayName: 'Mahi',
    role: 'employee',
    tempPassword: 'Mahi#Villas2026'
  },
  {
    uid: 'emp-003',
    email: 'varsha@choudharycrm.in',
    employeeCode: 'EMP-03',
    displayName: 'Varsha',
    role: 'employee',
    tempPassword: 'Varsha*Rent2026'
  },
  {
    uid: 'emp-004',
    email: 'vishal@choudharycrm.in',
    employeeCode: 'EMP-04',
    displayName: 'Vishal',
    role: 'employee',
    tempPassword: 'Vishal@Fleet2026'
  },
  {
    uid: 'emp-005',
    email: 'saloni@choudharycrm.in',
    employeeCode: 'EMP-05',
    displayName: 'Saloni',
    role: 'employee',
    tempPassword: 'Saloni#Sales2026'
  },
  {
    uid: 'emp-006',
    email: 'hema@choudharycrm.in',
    employeeCode: 'EMP-06',
    displayName: 'Hema',
    role: 'employee',
    tempPassword: 'Hema$Palghar26'
  },
  {
    uid: 'emp-007',
    email: 'mohini@choudharycrm.in',
    employeeCode: 'EMP-07',
    displayName: 'Mohini',
    role: 'employee',
    tempPassword: 'Mohini%Estate26'
  },
  {
    uid: 'emp-008',
    email: 'achal@choudharycrm.in',
    employeeCode: 'EMP-08',
    displayName: 'Achal',
    role: 'employee',
    tempPassword: 'Achal@Prithvi26'
  },
  {
    uid: 'emp-009',
    email: 'nitesh@choudharycrm.in',
    employeeCode: 'EMP-09',
    displayName: 'Nitesh',
    role: 'employee',
    tempPassword: 'Nitesh^Rent2026'
  },
  {
    uid: 'emp-010',
    email: 'surendra.accounts@choudharycrm.in',
    employeeCode: 'EMP-10',
    displayName: 'Surendra (Accountant)',
    role: 'employee',
    tempPassword: 'Surendra&Acc2026'
  }
];

const authRecords = users.map(u => ({
  uid: u.uid,
  email: u.email,
  employeeCode: u.employeeCode,
  displayName: u.displayName,
  role: u.role,
  passwordHash: bcrypt.hashSync(u.tempPassword, 10),
  mustChangePassword: true,
  createdAt: new Date().toISOString()
}));

const outPath = path.join(__dirname, '../data/users_auth.json');
fs.writeFileSync(outPath, JSON.stringify(authRecords, null, 2));

console.log('Generated data/users_auth.json with', authRecords.length, 'records.');
users.forEach(u => {
  console.log(`- ${u.displayName} (${u.employeeCode} / ${u.email}): ${u.tempPassword}`);
});
