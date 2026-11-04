# Lab 4 — Implementation Plan & Feature Breakdown
**TokTickIT · Actions Taken, Dashboards, and Final Regression**

> Each feature below is scoped to be a self-contained, peer-reviewable Pull Request.
> Features are grouped into 4 complete, testable increments to avoid unnecessary fragmentation.

---

## Current Baseline (Lab 3, Merged)

| Component | Status / Baseline |
|---|---|
| PostgreSQL Schema | `User`, `Ticket`, `Category`, `RelatedSystem`, `Attachment`, `PublicComment`, `InternalNote` |
| Authentication & RBAC | Session auth, password complexity, mandatory first-login password change, Requester/Staff/Admin roles |
| IT Staff Operations | Shared queue, claim/reassign, IT priority, permitted status state machine, comments, internal notes |
| Admin Operations | User Management screen (`/admin/users`), account creation, status edit, password reset, safety guards |
| Design Language | Zen Green theme tokens, component conventions, cards, badges, buttons, form controls |

---

## Feature Roadmap & Status Overview

| Feature | Branch Name | Scope Summary | Status |
|---|---|---|---|
| **F-00** | `feature/lab04-00-foundations` | Sprint 4 Engineering Contract, Prisma `ActionTaken` schema, migration, seed increment, test file stubs | ✅ Merged |
| **F-01** | `feature/lab04-01-actions-taken` | Actions Taken backend APIs, RBAC authorization, Ticket Detail `ActionsTaken` UI component (list & drawer), unit/API tests | ✅ Completed |
| **F-02** | `feature/lab04-02-role-dashboards` | Role Dashboard APIs, uniform `/requester/xxx` routing refactor, Requester/Staff/Admin Dashboard UI, card drill-down, component tests | ✅ Completed |
| **F-03** | `feature/lab04-03-e2e-and-hardening` | Playwright E2E test suite, full Labs 1-4 regression testing, Zen Green visual polish, accessibility audit, final documentation | ⏳ Planned |

---

## Detailed Feature Specifications

### F-00 · Foundations, Prisma Schema Evolution & Seed Increment
**Prerequisites:** Lab 3 baseline  
**Branch:** `feature/lab04-00-foundations`  

Establish the Sprint 4 contract, data model, migration, seed data, and initial project structure.

**Scope:**
- **Engineering Contract Documentation**:
  - `docs/lab-04/specification.md`
  - `docs/lab-04/api-spec.md`
  - `docs/lab-04/ui-spec.md`
  - `docs/lab-04/tests.md`
  - `docs/lab-04/decisions_and_clarifications.md`
  - `docs/lab-04/implementation_plan.md`
- **Prisma Schema Update (`ActionTaken`)**:
  - `ActionTaken` model: `id` (cuid), `ticketId` (FK to Ticket), `actionDate` (DateTime @default(now())), `description` (Text), `result` (Text), `performedById` (FK to User), `followUpRequired` (Boolean), `followUpNote` (Text?), `attachmentNotes` (Text?), `createdAt`, `updatedAt`.
  - Indexes on `ticketId` and `performedById`.
  - Migration script: `add_actions_taken_lab04`.
- **Seed Script Update (`server/prisma/seed.ts`)**:
  - Idempotent seed script updated to populate realistic `ActionTaken` entries (tickets with 0, 1, and multiple actions taken, follow-up flags, and attachment notes).
- **Directory Structure & Placeholder Test Files**:
  - `server/tests/lab-04/actions-taken.api.test.ts`
  - `server/tests/lab-04/ticket-workflow.api.test.ts`
  - `server/tests/lab-04/requester-dashboard.api.test.ts`
  - `server/tests/lab-04/staff-dashboard.api.test.ts`
  - `client/tests/lab-04/ActionsTaken.test.tsx`
  - `client/tests/lab-04/TicketWorkflow.test.tsx`
  - `client/tests/lab-04/RequesterDashboard.test.tsx`
  - `client/tests/lab-04/StaffDashboard.test.tsx`
  - `e2e/lab-04/actions-taken-flow.spec.ts`
  - `e2e/lab-04/ticket-resolution.spec.ts`
  - `e2e/lab-04/dashboards.spec.ts`
  - `artifacts/lab-04/screenshots/staff-dashboard/`
  - `artifacts/lab-04/screenshots/requester-dashboard/`
  - `artifacts/lab-04/screenshots/actions-taken/`

**Testable when F-00 is done:**
- `npx prisma migrate dev` creates migration cleanly without data loss.
- `npm run prisma:seed` executes twice with 0 errors, seeding tickets and actions taken.
- Test runner identifies all Lab 4 placeholder test suites.

---

### F-01 · Actions Taken Backend & Frontend Component
**Prerequisites:** F-00  
**Branch:** `feature/lab04-01-actions-taken`  

Implement backend REST APIs and frontend UI components for creating, editing, and viewing Actions Taken on tickets.

**Scope:**
- **Backend APIs (`server/src/controllers/actionsTakenController.ts`)**:
  - `GET /api/tickets/:ticketId/actions-taken`: Retrieve Actions Taken list (ownership check for Requesters).
  - `POST /api/tickets/:ticketId/actions-taken`: Create Action Taken (IT Staff/Admin only; server auto-binds `performedById = session.userId`; validates required `description`, `result`, and mandatory `followUpNote` when `followUpRequired = true`).
  - `PUT /api/tickets/:ticketId/actions-taken/:actionId`: Update Action Taken record (IT Staff/Admin only).
- **Frontend Component (`client/src/components/ActionsTakenSection.tsx`)**:
  - Rendered on Ticket Detail screens (`/requester/tickets/:id` and `/staff/tickets/:id`).
  - Displays Actions Taken list/table (`Action Date`, `Description`, `Result`, `Performed By` badge, `Follow-Up` pill badge, `Follow-up Note`, `Attachment Notes`).
  - Add / Edit Drawer Modal (IT Staff/Admin only) with live client-side validation.
  - Read-only card list presentation for Requester accounts.
- **Automated Tests**:
  - API Integration tests (`server/tests/lab-04/actions-taken.api.test.ts`).
  - Component tests (`client/tests/lab-04/ActionsTaken.test.tsx`).

**Testable when F-01 is done:**
- Log in as IT Staff, open a ticket detail page, click "+ Add Action Taken", enter action details, toggle follow-up required (verifying validation), save, and see entry render in table.
- Log in as Requester, view owned ticket detail page, confirm Actions Taken list renders in read-only mode with "+ Add Action Taken" button hidden.
- Automated API and component test suites pass 100%.

---

### F-02 · Role Operational Dashboards & Uniform Routing
**Prerequisites:** F-01  
**Branch:** `feature/lab04-02-role-dashboards`  

Implement backend dashboard metric APIs, uniform `/requester/xxx` URL routing, and interactive frontend dashboards for Requesters, IT Staff, and Administrators.

**Scope:**
- **Uniform Route Refactor**:
  - Requester routes updated to `/requester/dashboard`, `/requester/tickets`, `/requester/tickets/new`, `/requester/tickets/:id`.
  - AppShell navigation bar updated with role-aware active tabs.
- **Backend Dashboard APIs (`server/src/controllers/dashboardController.ts`)**:
  - `GET /api/dashboard/requester`: Total open, waiting for requester, recently updated, recently resolved metrics for authenticated Requester.
  - `GET /api/dashboard/staff`: Unassigned, owned, priority, follow-up metrics, and status distribution breakdown for IT Staff.
  - `GET /api/dashboard/admin`: Staff metrics + User account statistics for Administrators.
- **Frontend Dashboard Components**:
  - `RequesterDashboard.tsx` (`/requester/dashboard`): Greeting, metric cards, quick action buttons (`+ Create Ticket`, `View My Tickets`).
  - `StaffDashboard.tsx` (`/staff/dashboard`): Metric cards, status breakdown grid, recent activity feed.
  - `AdminDashboard.tsx` (`/admin/dashboard`): Staff metrics + User statistics.
  - Interactive drill-down support (clicking metric cards navigates to pre-filtered queue views).
- **Automated Tests**:
  - API Integration tests (`server/tests/lab-04/requester-dashboard.api.test.ts`, `server/tests/lab-04/staff-dashboard.api.test.ts`).
  - Component tests (`client/tests/lab-04/RequesterDashboard.test.tsx`, `client/tests/lab-04/StaffDashboard.test.tsx`).

**Testable when F-02 is done:**
- Log in as Requester -> lands on `/requester/dashboard`, displays real-time ticket metrics, clicking "+ Create Ticket" opens `/requester/tickets/new`.
- Log in as IT Staff -> lands on `/staff/dashboard`, displays unassigned/owned/priority metrics, clicking "Unassigned Tickets" card navigates to `/staff/queue?assignment=unassigned`.
- Log in as Administrator -> lands on `/admin/dashboard`, displays staff operational metrics plus user account statistics.
- Automated API and component test suites pass 100%.

---

### F-03 · Playwright E2E Testing, Full Regression & Final Hardening
**Prerequisites:** F-00, F-01, F-02  
**Branch:** `feature/lab04-03-e2e-and-hardening`  

Implement Playwright end-to-end user journeys, conduct full application regression testing across Labs 1-4, perform accessibility/responsive audits, and complete submission documentation.

**Scope:**
- **Playwright E2E Suites**:
  - `e2e/lab-04/actions-taken-flow.spec.ts`: Full workflow of IT Staff creating and updating Actions Taken on a ticket.
  - `e2e/lab-04/ticket-resolution.spec.ts`: Ticket status transitions to Resolved/Closed and Requester advisory resolution feedback.
  - `e2e/lab-04/dashboards.spec.ts`: Role authentication, dashboard metric display, and interactive drill-down navigation.
- **Full Project Regression Audit**:
  - Verification of Authentication, Mandatory Password Change, Requester Ticket Creation/Filtering/Attachments (`/requester/xxx`), Staff Queue/Detail (`/staff/xxx`), Comments, Internal Notes, and Admin User Management (`/admin/users`).
- **Zen Green Polish & Accessibility**:
  - Responsive audit across 375px (mobile), 768px (tablet), and 1440px (desktop).
  - Keyboard focus ring verification (`ring-2 ring-emerald-600`), contrast check, zero horizontal scrolling.
- **Documentation Finalization**:
  - Finalize `docs/lab-04/reviewer.md` and `docs/lab-04/ai-use.md`.
  - Capture screenshot evidence in `artifacts/lab-04/screenshots/`.

**Testable when F-03 is done:**
- `npm test` runs full backend and frontend Vitest suites with 100% pass rate.
- `npx playwright test` executes all E2E specs across chromium, firefox, webkit with 100% pass rate.
- Clean git status ready for final release integration.
