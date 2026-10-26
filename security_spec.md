# Choudhary CRM Firestore Security Specification

## 1. Data Invariants & Security Directives
1. Every authenticated user must be assigned either 'admin' or 'employee' role.
2. Admins can read and write all documents across users, leads, followups, siteVisits, bookings, projects, inventory, activityLogs, and metaIntegrations.
3. Employees can read and write assigned leads, public project listings, inventory, their own followups, siteVisits, and booking requests.
4. Unassigned new leads are visible in the shared inbox for read/claim according to CRM rules.
5. All timestamps and audit activity logs are validated for structural integrity.

## 2. The Dirty Dozen Security Tests
1. Attempt to escalate role from 'employee' to 'admin' in user profile => REJECTED
2. Attempt to view all leads as non-authenticated anonymous user => REJECTED
3. Attempt to delete a lead document as a sales employee => REJECTED
4. Attempt to edit another employee's private follow-up without admin privileges => REJECTED
5. Attempt to create a booking without valid unit reference or missing token amount => REJECTED
6. Attempt to modify metaIntegrations tokens as sales employee => REJECTED
7. Attempt to inject invalid junk strings into document ID paths => REJECTED
8. Attempt to set negative budget in lead document => REJECTED
9. Attempt to create user document with spoofed UID => REJECTED
10. Attempt to erase activity logs as sales employee => REJECTED
11. Attempt to corrupt project starting price with non-numeric value => REJECTED
12. Attempt to list all internal audit logs as unauthenticated user => REJECTED
