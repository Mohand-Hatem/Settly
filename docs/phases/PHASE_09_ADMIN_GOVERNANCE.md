# Phase 09: Governance, Trust & Administration

> **Status**: ⬜ Not Started  
> **Milestone**: 4 Admin Command Screens (Screens 30–33) & Fiduciary Governance  
> **Governing Candidates**: `docs/design/candidates/settly-landing/admin/`  

---

## 1. Phase Goal
Build the administrative command center (Screens 30–33) for property listing moderation, broker compliance vetting, user disputes resolution, and immutable append-only audit trail inspection.

---

## 2. Scope Breakdown

### Frontend (Screens 30–33)
- **Shared Admin Layout (`/admin/layout.tsx`)**: Security badge, administrative navigation, system status.
- **Screen 30 — Moderation Queue (`/admin/moderation`)**: Review submitted listings with diff view, Approve/Reject controls.
- **Screen 31 — Agent Verification Console (`/admin/verification`)**: Review broker licenses, FRA certificates, identity documents.
- **Screen 32 — Reports & Disputes (`/admin/reports`)**: Flagged property investigations, user message disputes.
- **Screen 33 — Immutable Audit Log (`/admin/audit-log`)**: Security event trail with JSON payload diff inspection.

### Backend APIs
- `GET /api/v1/admin/moderation` & `POST /api/v1/admin/moderation/:id/action` (Approve/Reject listing).
- `GET /api/v1/admin/reports` & `PATCH /api/v1/admin/reports/:id` (Dispute management).
- `GET /api/v1/admin/audit-log` (Paginated security audit trail).
- Role requirement: `Role.ADMIN` enforced strictly.

### Database
- PostgreSQL trigger enforcing append-only behavior on `AuditLog` (disallows `UPDATE` and `DELETE`).
- Models: `AuditLog`, `Report`.

---

## 3. Step-by-Step Execution Plan

| Step | Step Name | Objective | Status |
|---|---|---|---|
| **9.1** | Shared Admin Command Layout | Implement admin layout and security indicators | ⬜ Not Started |
| **9.2** | Screen 30: Property Moderation Queue (`/admin/moderation`) | Build listing review queue with side-by-side diff | ⬜ Not Started |
| **9.3** | Screen 31: Agent Verification Console (`/admin/verification`) | Build broker verification dashboard | ⬜ Not Started |
| **9.4** | Screen 32: Reports & Dispute Resolution (`/admin/reports`) | Build dispute investigation interface | ⬜ Not Started |
| **9.5** | Screen 33: Immutable Audit Log Viewer (`/admin/audit-log`) | Build security audit trail with JSON payload modal | ⬜ Not Started |
