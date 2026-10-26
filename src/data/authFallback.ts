export interface UserAuthRecord {
  uid: string;
  id: string;
  username: string;
  email: string;
  employeeCode: string;
  displayName: string;
  role: 'owner' | 'team_leader' | 'employee' | 'admin';
  passwordHash: string;
  mustChangePassword: boolean;
  createdAt: string;
  passwordChangedAt?: string;
}

export const INITIAL_USER_AUTH: UserAuthRecord[] = [
  {
    "uid": "admin-001",
    "id": "admin-001",
    "username": "kishan",
    "email": "kishan@choudharyestate.com",
    "employeeCode": "OWNER-01",
    "displayName": "Kishan Choudhary",
    "role": "owner",
    "passwordHash": "$2b$10$paZs62Udf/rawFNzYzgx0u860MavPr4KbxEOUbKthvyKaN0I2nxSa",
    "mustChangePassword": false,
    "createdAt": "2026-10-22T04:59:01.580Z"
  },
  {
    "uid": "admin-002",
    "id": "admin-002",
    "username": "heena",
    "email": "heena@choudharyestate.com",
    "employeeCode": "HEAD-01",
    "displayName": "Heena",
    "role": "team_leader",
    "passwordHash": "$2b$10$7P43dY75xFrYbIeABtcvPeGy3CvXkywY8nq7SAedWM7dkP3Adi4q2",
    "mustChangePassword": false,
    "createdAt": "2026-10-22T04:59:01.715Z"
  },
  {
    "uid": "emp-001",
    "id": "emp-001",
    "username": "surendra",
    "email": "surendra.crm@choudharycrm.in",
    "employeeCode": "EMP-01",
    "displayName": "Surendra",
    "role": "employee",
    "passwordHash": "$2b$10$UI/WBix6YrhnC1QAlG8FwuKbcK9wf7XX0ULdDtGY02./RkX84vTCO",
    "mustChangePassword": false,
    "createdAt": "2026-10-22T04:59:01.782Z"
  },
  {
    "uid": "emp-002",
    "id": "emp-002",
    "username": "mahi",
    "email": "mahi@choudharycrm.in",
    "employeeCode": "EMP-02",
    "displayName": "Mahi",
    "role": "employee",
    "passwordHash": "$2b$10$uhG16XIJje028/yL4McGHuD9gi7dLUQnVwWwmGs3SpfZ/njWd9zai",
    "mustChangePassword": false,
    "createdAt": "2026-10-22T04:59:01.849Z"
  },
  {
    "uid": "emp-003",
    "id": "emp-003",
    "username": "varsha",
    "email": "varsha@choudharycrm.in",
    "employeeCode": "EMP-03",
    "displayName": "Varsha",
    "role": "employee",
    "passwordHash": "$2b$10$OTNMWiJmLpM4qeps25NUOue2ahgrcR7vpaD69ey31oMPq2xsKJAtS",
    "mustChangePassword": false,
    "createdAt": "2026-10-22T04:59:01.914Z"
  },
  {
    "uid": "emp-004",
    "id": "emp-004",
    "username": "vishal",
    "email": "vishal@choudharycrm.in",
    "employeeCode": "EMP-04",
    "displayName": "Vishal",
    "role": "employee",
    "passwordHash": "$2b$10$H0lQUUhmk0JuCQ6F1LTCouy5jgFddVxTIryhWXfiRZzhrzyw60/hK",
    "mustChangePassword": false,
    "createdAt": "2026-10-22T04:59:01.980Z"
  },
  {
    "uid": "emp-005",
    "id": "emp-005",
    "username": "saloni",
    "email": "saloni@choudharycrm.in",
    "employeeCode": "EMP-05",
    "displayName": "Saloni",
    "role": "employee",
    "passwordHash": "$2b$10$JQdVjszDNSgrRxdNUjppxOp1GtVvjO40NFuwwBmgJO0XQXa/7GT4q",
    "mustChangePassword": false,
    "createdAt": "2026-10-22T04:59:02.046Z"
  },
  {
    "uid": "emp-006",
    "id": "emp-006",
    "username": "hema",
    "email": "hema@choudharycrm.in",
    "employeeCode": "EMP-06",
    "displayName": "Hema",
    "role": "employee",
    "passwordHash": "$2b$10$U6FSyKWhknw3SSCGDIdOCeH/0ll/.Dn2DeJ/VXxn5GML0ca.GLtAC",
    "mustChangePassword": false,
    "createdAt": "2026-10-22T04:59:02.113Z"
  },
  {
    "uid": "emp-007",
    "id": "emp-007",
    "username": "mohini",
    "email": "mohini@choudharycrm.in",
    "employeeCode": "EMP-07",
    "displayName": "Mohini",
    "role": "employee",
    "passwordHash": "$2b$10$hEryvtRiIvIG8687DTfzSeLjMAgozhHK2E80WlEGNNObiWl3eUuv.",
    "mustChangePassword": false,
    "createdAt": "2026-10-22T04:59:02.179Z"
  },
  {
    "uid": "emp-008",
    "id": "emp-008",
    "username": "achal",
    "email": "achal@choudharycrm.in",
    "employeeCode": "EMP-08",
    "displayName": "Achal",
    "role": "employee",
    "passwordHash": "$2b$10$1G55c4xZJMH4u152tXzEJu3XE.jW5cIw521/an4p0aA3I1JccFRk2",
    "mustChangePassword": false,
    "createdAt": "2026-10-22T04:59:02.245Z"
  },
  {
    "uid": "emp-009",
    "id": "emp-009",
    "username": "nitesh",
    "email": "nitesh@choudharycrm.in",
    "employeeCode": "EMP-09",
    "displayName": "Nitesh",
    "role": "employee",
    "passwordHash": "$2b$10$9krAg8FfmAs5azFrGWcHleFp2yBeR8PnDzxWoYr5cCJiOFVwe2YXe",
    "mustChangePassword": false,
    "createdAt": "2026-10-22T04:59:02.310Z"
  },
  {
    "uid": "emp-010",
    "id": "emp-010",
    "username": "surendra-acc",
    "email": "surendra.accounts@choudharycrm.in",
    "employeeCode": "EMP-10",
    "displayName": "Surendra (Accountant)",
    "role": "employee",
    "passwordHash": "$2b$10$ahbWeesDQvRyeJTcpM1tguNyjLabMgfa8lIGq04x1g4HP2N7M2xTy",
    "mustChangePassword": false,
    "createdAt": "2026-10-22T04:59:02.374Z"
  }
];

/**
 * Universal User Lookup Helper
 * Consistently resolves a user whether given:
 * - uid: 'emp-001', 'admin-001', 'admin-002'
 * - id: 'emp-001', 'admin-001'
 * - employeeCode: 'EMP-01', 'EMP-001', 'OWNER-01', 'HEAD-01'
 * - username: 'surendra', 'kishan', 'heena'
 * - displayName: 'Surendra', 'Kishan Choudhary', 'Heena'
 * - email or email prefix: 'surendra.crm@choudharycrm.in'
 */
export function findUserByIdentifier<T extends { uid: string; id?: string; email?: string; employeeCode?: string; displayName?: string; username?: string }>(
  users: T[],
  rawIdentifier: string
): T | undefined {
  if (!rawIdentifier) return undefined;
  const cleanId = String(rawIdentifier).trim().toLowerCase();

  // Normalize code format (e.g., 'emp-001' -> 'emp-1', 'emp-01' -> 'emp-1')
  const cleanNormalized = cleanId.replace(/^emp-0*/, 'emp-');

  return users.find((u) => {
    const uid = String(u.uid || '').toLowerCase();
    const id = String(u.id || '').toLowerCase();
    const email = String(u.email || '').toLowerCase();
    const employeeCode = String(u.employeeCode || '').toLowerCase();
    const displayName = String(u.displayName || '').toLowerCase();
    const username = String(u.username || '').toLowerCase();

    // 1. Direct equality checks on primary identifiers
    if (uid === cleanId || id === cleanId) return true;
    if (email === cleanId) return true;
    if (employeeCode === cleanId) return true;
    if (username && username === cleanId) return true;
    if (displayName === cleanId) return true;

    // 2. Email username (before @)
    const emailPrefix = email.split('@')[0];
    if (emailPrefix === cleanId) return true;

    // 3. Normalized Employee Code matching (e.g. emp-001 matches EMP-01)
    const uEmpNormalized = employeeCode.replace(/^emp-0*/, 'emp-');
    const uUidNormalized = uid.replace(/^emp-0*/, 'emp-');
    if (cleanNormalized && (uEmpNormalized === cleanNormalized || uUidNormalized === cleanNormalized)) {
      return true;
    }

    // 4. First name match (e.g. "Kishan" matches "Kishan Choudhary")
    const firstName = displayName.split(' ')[0];
    if (firstName && firstName === cleanId) return true;

    // 5. Special aliases
    if (cleanId === 'kishan' && (uid === 'admin-001' || employeeCode === 'owner-01')) return true;
    if (cleanId === 'heena' && (uid === 'admin-002' || employeeCode === 'head-01')) return true;
    if (cleanId === 'surendra' && (uid === 'emp-001' || employeeCode === 'emp-01')) return true;

    return false;
  });
}
