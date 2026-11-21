# CityVet Firestore Security Specification (Phase 0)

## Data Invariants
1. Every document write requires an authenticated user with `request.auth.token.email_verified == true`.
2. Users cannot self-assign `role: 'doctor'`; only the verified clinic doctor email (`infinitysoftwaresolutions0@gmail.com`) can hold or access doctor-tier privileges.
3. PII (`email`, `phone`) in `/users/{userId}/private/info` is strictly isolated from `/users/{userId}` and readable only by the owning user or the verified doctor.
4. Every appointment must reference `patientUid == request.auth.uid` on creation, start in `status: 'upcoming'`, target `doctorId == 'dr-elena'`, and enforce server timestamps (`createdAt == request.time`, `updatedAt == request.time`).
5. Patients may only transition their own `upcoming` appointment to `cancelled` via `affectedKeys().hasOnly(['status', 'updatedAt'])`. Only the verified doctor may mark appointments `completed` or write `doctorNotes`.
6. Once an appointment reaches `completed` or `cancelled`, patients cannot reopen or modify it.

## Dirty Dozen Adversarial Payloads (Must Return PERMISSION_DENIED)
1. **Unauthenticated Appointment Read**: `get /appointments/Apt0001` with `auth == null`.
2. **Self-Assigned Doctor Privilege Escalation**: `create /users/uid123` with `{ role: 'doctor' }` from a non-doctor account.
3. **Cross-User PII Read**: `get /users/otherUid/private/info` signed in as `uid123`.
4. **Identity Spoofing on Appointment Create**: `create /appointments/Apt0099` with `patientUid: 'victimUid'` while signed in as `attackerUid`.
5. **Shadow / Ghost Field Injection**: `create /appointments/Apt0099` with valid fields plus `isAdminOverride: true`.
6. **Pre-Completed Status Bypass on Create**: `create /appointments/Apt0099` with `status: 'completed'`.
7. **Fee Tampering**: `create /appointments/Apt0099` with `fee: -50` or `fee: 'free'`.
8. **Backdated Timestamp Spoofing**: `create /appointments/Apt0099` with `createdAt: '2020-01-01T00:00:00Z'` instead of `request.time`.
9. **Oversized Document ID Poisoning**: `create /appointments/` + 200-char ID or invalid characters (`../`).
10. **Patient Editing Doctor Notes**: `update /appointments/Apt0001` by patient modifying `doctorNotes` or `fee`.
11. **Terminal State Reopening by Patient**: `update /appointments/Apt0004` (status `completed`) setting `status: 'upcoming'` as patient.
12. **Blanket List Scraping**: `list /appointments` as patient without `where('patientUid', '==', uid)` filter.
