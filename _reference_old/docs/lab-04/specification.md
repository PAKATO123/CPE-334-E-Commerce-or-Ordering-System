# Lab 4 Sprint Engineering Specification
TokTickIT Actions Taken, Dashboards, and Final Regression

## 1. Sprint Goal
Complete the core TokTickIT service-desk application by introducing Actions Taken for work planning and auditing, role-appropriate dashboards for Requesters, IT Staff, and Administrators, enforcing permitted ticket status transitions, standardizing user URL routes under role namespaces (`/requester/xxx`, `/staff/xxx`, `/admin/xxx`), and performing final regression testing and hardening across all application features under the Zen Green design language.

---

## 2. Stakeholder Request Interpretation
- **Actions Taken Tracking & Follow-Up Lifecycle**: IT Staff and Administrators require a structured way to plan, record, and track actual work performed on tickets. Each Action Taken entry records Action Date/Time, Action Description, Result, Performed by (auto-populated with authenticated user), Follow-Up Required?, Follow-up Note (required when follow-up is needed), and Attachment Notes. Follow-up entries support three explicit tracking states:
  1. `Follow-Up Required` (Yellow gold background `#FEFCBF`, border `#D69E2E`, text `#744210` - initial state when follow-up is required).
  2. `Followed up` (Teal green background `#E6FFFA`, border `#319795`, text `#234E52` - state reached after clicking "Mark done" and confirming via custom modal).
  3. `No Follow-Up Needed` (Muted gray background `#EDF2F7` - default state when follow-up is not required).
  - A custom sort toggle on Actions Taken defaults to ON, ordering items: `Oldest Follow-Up Required` > `Newest Follow-Up Required` > `Newest No Follow-Up Needed` > `Oldest No Follow-Up Needed`.
  - Requesters can view Actions Taken on their tickets in read-only mode, but cannot create, edit, or mark follow-ups done.
- **Ticket Ownership & Status Rules**: The primary Ticket Owner remains responsible for coordinating the overall ticket. IT Staff and Administrators can update ticket status (including `Resolved` and `Closed`) at any time in accordance with permitted status transitions. Requesters may indicate that a problem appears resolved (`isRequesterResolved = true`), which serves as an advisory indicator.
- **Staff Queue & My Tickets UI Refinements**: Staff Queue filter bar uses a structured 2-row layout (4 controls per row) with `Follow-up<br />Required` label. Queue table displays a single `Last Updated` (`updatedAt`) date column to eliminate crowding. Ticket links are styled in Zen Green (`var(--color-primary-green)`), rows highlight in pale green on hover (`var(--color-pale-green)`), status badges use compact text (`Waiting` for `Waiting for Requester`, `Pending` for `Pending Verification`), and the queue follow-up column renders compact `Yes` (gold) or `No` (muted) badges.
- **Role-Appropriate Dashboards & Uniform URLs**: Provide clean, concise operational dashboards for Requesters (`/requester/dashboard`), IT Staff (`/staff/dashboard`), and Administrators (`/admin/dashboard`) with uniform URL prefixing (`/requester/xxx`, `/staff/xxx`, `/admin/xxx`) and direct drill-down links to filtered ticket lists. Urgent & High priority shortcut lists sort by IT priority descending (`Urgent` > `High` > `Medium` > `Low`). All active ticket status breakdown entries (including `Cancelled`, `Reopened`, and `Pending Verification`) render inside styled badge frames.
- **Final Product Hardening & Regression**: Hardened full-stack application ensuring all features from Labs 1, 2, and 3 (Authentication, Authorization, Requester workflows, Staff queue, Admin user management, Comments, Notes, Attachments) continue to operate seamlessly under the Zen Green design language with zero regression, robust error handling, accessible controls, and clean responsive layouts.

---

## 3. Scope

### Included

#### 1. Actions Taken Parent-Child Work Structure & Follow-Up Lifecycle
- Database model `ActionTaken` related to `Ticket` (1 Ticket to Many Actions Taken).
- Capture `actionDate`, `description`, `result`, `performedById` (auto-bound), `followUpRequired`, `followUpNote`, and `attachmentNotes`.
- Three distinct follow-up tracking states (`Follow-Up Required`, `Followed up`, `No Follow-Up Needed`).
- "Mark done" action on `Follow-Up Required` entries matching Edit link design (frameless, underlined text).
- Custom modal popup confirmation dialog (`data-testid="mark-done-confirmation-modal"`) before marking follow-up as done.
- Default-on follow-up priority sort toggle (`Oldest Follow-Up Required` > `Newest Follow-Up Required` > `Newest No Follow-Up Needed` > `Oldest No Follow-Up Needed`).
- Create and edit Actions Taken by authorized IT Staff and Administrators on accessible tickets.
- Read-only viewing of Actions Taken by Requesters on owned tickets.

#### 2. Ticket Status Lifecycle & Transition Rules
- Strict permitted transition state machine: `New`, `Open`, `In Progress`, `Waiting for Requester`, `Resolved`, `Closed`, `Reopened`, `Cancelled`.
- IT Staff and Administrators can change status to `Resolved` or `Closed` at any time without gating barriers.
- Advisory Requester resolution status handling (`isRequesterResolved = true`) providing clear feedback.
- Compact status badges (`Waiting`, `Pending`) on table views and full styled badge frames on dashboard breakdown for all statuses.

#### 3. Role-Appropriate Operational Dashboards & Uniform Routing
- **Requester Dashboard** (`/requester/dashboard`): Metrics for total open tickets, tickets waiting for user response, recently updated tickets, recently resolved tickets, with quick action links.
- **IT Staff Dashboard** (`/staff/dashboard`): Metrics for unassigned tickets, user-owned tickets, urgent/high priority tickets (sorted by IT priority descending), tickets requiring follow-up, active status breakdown with framed badges, and recent activity log.
- **Administrator Dashboard** (`/admin/dashboard`): Reuses IT Staff dashboard metrics plus user account statistics (total users, active counts by role).
- All Requester routes formatted uniformly: `/requester/dashboard`, `/requester/tickets`, `/requester/tickets/new`, `/requester/tickets/:id`.
- Interactive card drill-downs connecting dashboard summaries directly to filtered Ticket Queue and My Tickets screens.

#### 4. Staff Queue & Ticket UI Refinements
- 2-row filter bar layout (Row 1: Search, Status, IT Priority, Assignment; Row 2: Category, Related System, `Follow-up<br />Required`, Clear All Filters — max 4 controls per row).
- Single `Last Updated` date column in Staff Queue table (creation date removed to streamline display).
- Zen Green ticket title links with pale green row hover state.
- Compact `Yes` / `No` follow-up cell values.
- Muted table header styling (13px, font weight 600).

#### 5. Prisma Migration, Seed & API Increment
- Evolve database schema with `ActionTaken` model and `isFollowedUp` tracking state without data loss.
- Migration script preserving existing users, tickets, attachments, comments, and notes.
- Idempotent seed script ensuring lower ticket numbers (`TCK-001`, `TCK-002`) have earlier creation dates.
- Seed data covering zero, one, and multiple Actions Taken per ticket, covering all major statuses and follow-up states.
- REST API increment for Actions Taken CRUD, follow-up status resolution, and role dashboard data endpoints.

#### 6. Final Regression & Product Hardening
- Verification and preservation of all Lab 1-3 capabilities (Authentication, First-login password change, Requester ticket creation/filtering/attachments, Staff Queue/Detail, Public Comments, Internal Notes, Admin User Management).
- Full application polish under Zen Green design language with responsive layouts (desktop, tablet, mobile), keyboard accessibility, and safe error states.

### Excluded
- Automatic SLA clocks, escalation engines, on-call scheduling, and breach notifications.
- Email, SMS, LINE, push, or external notification services.
- Inventory consumption, spare-parts management, purchasing, or cost accounting.
- Time-sheet billing, payroll, or detailed labor-cost calculation.
- Multi-level approval workflows and electronic signatures.
- Advanced business-intelligence tools, custom report builders, or export warehouses.
- Multi-tenant organizations and production-scale cloud operations.

---

## 4. Functional Requirements

### Actions Taken Management & Follow-Up Lifecycle
- **FR-01: Parent-Child Relationship**  
  The system shall maintain a parent-child relationship where one Ticket contains zero, one, or many Actions Taken records.
- **FR-02: Create Action Taken**  
  The system shall allow IT Staff and Administrators to create Action Taken entries for accessible tickets, automatically recording `performedById` from the authenticated session user.
- **FR-03: Action Taken Fields Validation & Follow-Up States**  
  The system shall enforce that `description` and `result` are required. If `followUpRequired = true`, `followUpNote` shall be mandatory. The system shall support three distinct follow-up states (`Follow-Up Required`, `Followed up`, `No Follow-Up Needed`).
- **FR-04: Edit & Mark Done Action Taken**  
  The system shall allow IT Staff and Administrators to edit existing Action Taken records. When an entry is in `Follow-Up Required` state, a "Mark done" button (styled identically to Edit with simple text underline) shall open a custom modal confirmation dialog (`data-testid="mark-done-confirmation-modal"`). Upon user confirmation, the system shall transition the entry state to `Followed up`.
- **FR-05: Follow-Up Priority Sort Toggle**  
  The system shall provide a toggle on the Actions Taken section (default ON) that sorts entries by follow-up urgency: `Oldest Follow-Up Required` > `Newest Follow-Up Required` > `Newest No Follow-Up Needed` > `Oldest No Follow-Up Needed`. When toggled OFF, entries revert to standard chronological order.
- **FR-06: Read-Only Actions Taken for Requesters**  
  The system shall allow Requesters to view all Actions Taken records on tickets owned by their authenticated account, while prohibiting creation, editing, or marking follow-ups done.

### Ticket Status & Workflow Rules
- **FR-07: Permitted Status Transition Matrix**  
  The system shall enforce allowed ticket status transitions on the backend:
  - `New` ➔ `Open`, `In Progress`, `Cancelled`
  - `Open` ➔ `In Progress`, `Waiting for Requester`, `Resolved`, `Cancelled`
  - `In Progress` ➔ `Waiting for Requester`, `Resolved`, `Cancelled`
  - `Waiting for Requester` ➔ `In Progress`, `Resolved`, `Cancelled`
  - `Resolved` ➔ `Closed`, `Reopened`
  - `Closed` ➔ `Reopened`
  - `Reopened` ➔ `In Progress`, `Resolved`, `Cancelled`
  - `Cancelled` ➔ Terminal (no further transitions allowed).
- **FR-08: Direct Status Transition**  
  The system shall allow IT Staff and Administrators to transition ticket status to `Resolved` or `Closed` at any time in accordance with the permitted transition matrix.
- **FR-09: Advisory Requester Resolution Indicator**  
  The system shall treat Requester resolution indications (`isRequesterResolved = true`) as advisory signals without automatically updating ticket status to `Resolved`.
- **FR-10: Compact Status Labels & Framed Breakdown Badges**  
  The system shall render compact status labels (`Waiting` for `Waiting for Requester`, `Pending` for `Pending Verification`) on table queues. On dashboard status breakdowns, every status (including `Cancelled`, `Reopened`, `Pending Verification`) shall be rendered inside a styled badge frame.

### Dashboard Operations & Route Formatting
- **FR-11: Requester Dashboard & Uniform Route**  
  The system shall provide a Requester Dashboard accessible at `/requester/dashboard` displaying:
  - Total Open Tickets count (owned by user).
  - Tickets Waiting for Requester count.
  - Recently Updated Tickets list (top 5).
  - Recently Resolved Tickets list (top 5).
  - Quick actions ("+ Create Ticket" -> `/requester/tickets/new`, "View My Tickets" -> `/requester/tickets`).
- **FR-12: IT Staff Dashboard**  
  The system shall provide an IT Staff Dashboard at `/staff/dashboard` displaying:
  - Unassigned Tickets count.
  - My Owned Tickets count.
  - Urgent/High Priority Tickets count (sorted by IT Priority descending: Urgent > High > Medium > Low).
  - Tickets Requiring Follow-Up count.
  - Active Ticket Status Breakdown with framed badges.
  - Recently Updated Tickets list (top 5).
- **FR-13: Administrator Dashboard**  
  The system shall provide an Administrator Dashboard at `/admin/dashboard` displaying all IT Staff metrics plus user account statistics (`Total Users`, `Active Requesters`, `Active IT Staff`, `Active Admins`).
- **FR-14: Dashboard Metric Drill-Down**  
  The system shall enable interactive drill-down from dashboard cards to the corresponding filtered views in the Ticket Queue or My Tickets screens.

### Staff Queue Layout & Refinements
- **FR-15: 2-Row Filter Bar & Queue Layout**  
  The system shall render the Staff Queue filter bar across 2 rows (max 4 controls/row), with the follow-up filter labeled `Follow-up<br />Required`. The queue table shall display a single `Last Updated` date column, compact `Yes`/`No` follow-up values, Zen Green ticket links, pale green hover highlights, and 13px font-weight 600 headers.

### Regression & Application Shell
- **FR-16: Unified Role Navigation Shell (`/requester/xxx`, `/staff/xxx`, `/admin/xxx`)**  
  The system shell shall provide role-appropriate top navigation tabs (`Dashboard`, `Ticket Queue`, `My Tickets`, `User Management`) with visible active tab indicators and matching URL formatting.
- **FR-17: Access Control Preservation**  
  The system shall maintain all RBAC rules from Lab 3 across all existing API endpoints and frontend screens.

---

## 5. Business Rules

| BR ID | Business Rule Statement |
|---|---|
| **BR-01** | Action Taken belongs to exactly one Ticket. |
| **BR-02** | The Ticket Owner coordinates the Ticket, but an Action Taken may be performed by a different IT Staff member. |
| **BR-03** | `performedById` is automatically set to the authenticated user ID at creation and cannot be forged by client payload. |
| **BR-04** | If `followUpRequired` is set to `true`, `followUpNote` must not be empty or whitespace-only. |
| **BR-05** | An Action Taken entry with `followUpRequired = true` remains in `Follow-Up Required` state until explicitly marked done via staff action, transitioning it to `Followed up` (`followUpRequired = false`, `isFollowedUp = true`). |
| **BR-06** | Marking an Action Taken entry done requires explicit user confirmation via a custom modal confirmation dialog (`data-testid="mark-done-confirmation-modal"`). Browser-native `window.confirm` dialogs are prohibited. |
| **BR-07** | When the follow-up sort toggle is active (default ON), Action Taken entries are prioritized as: `Oldest Follow-Up Required` > `Newest Follow-Up Required` > `Newest No Follow-Up Needed` > `Oldest No Follow-Up Needed`. |
| **BR-08** | Requesters can only view Actions Taken on tickets where `requesterId == session.userId`. Attempts to view Actions Taken on unowned tickets return `403 Forbidden`. |
| **BR-09** | Requesters cannot create, update, delete, or mark done Action Taken records (`403 Forbidden`). |
| **BR-10** | Actions Taken records cannot be deleted by any user role (append/update audit log model). |
| **BR-11** | Status transitions must strictly adhere to the approved status transition matrix. Invalid transitions return `400 Bad Request`. |
| **BR-12** | Authorized IT Staff and Administrators may transition a ticket to `Resolved` or `Closed` at any time without requiring pre-existing Actions Taken. |
| **BR-13** | Requesters marking a ticket problem as resolved (`isRequesterResolved = true`) updates the advisory flag but does not change `status` to `Resolved`. |
| **BR-14** | Terminal statuses `Cancelled` accept no further updates to status, ownership, priority, comments, notes, or Actions Taken. |
| **BR-15** | Requester dashboard calculations strictly aggregate tickets where `requesterId == session.userId`. |
| **BR-16** | IT Staff dashboard calculations aggregate open, unassigned, priority, and follow-up metrics across all active system tickets. Dashboard Urgent & High priority lists sort by IT priority descending (`Urgent` > `High` > `Medium` > `Low`). |
| **BR-17** | Admin dashboard statistics calculate authoritative real-time user counts from the `User` table. |
| **BR-18** | Stale update detection: Updating an Action Taken or Ticket status evaluates concurrent modifications and rejects conflicting stale writes (`409 Conflict`). |

---

## 6. UI Specification Summary

- **Zen Green Theme Extension**: Preserves Emerald-700 primary actions (`#15803D`), Slate backgrounds (`#F8FAFC`), rounded card containers, responsive flex grids, and accessible color contrast.
- **Role Navigation Shell (`/requester/xxx`, `/staff/xxx`, `/admin/xxx`)**: Top navigation bar dynamically renders tabs based on user role:
  - `REQUESTER`: `Dashboard` (`/requester/dashboard`) | `My Tickets` (`/requester/tickets`) | `Create Ticket` (`/requester/tickets/new`)
  - `IT_STAFF`: `Dashboard` (`/staff/dashboard`) | `Ticket Queue` (`/staff/queue`) | `My Assigned Tickets` (`/staff/queue?assignment=me`)
  - `ADMINISTRATOR`: `Dashboard` (`/admin/dashboard`) | `User Management` (`/admin/users`) | `Ticket Queue` (`/staff/queue`)
- **Actions Taken Component (Ticket Detail)**:
  - Card section under Ticket Detail (`/requester/tickets/:id` or `/staff/tickets/:id`).
  - Displays 3 follow-up tracking states:
    - `Follow-Up Required` pill (Gold `#FEFCBF`, border `#D69E2E`, text `#744210`).
    - `Followed up` pill (Teal `#E6FFFA`, border `#319795`, text `#234E52`).
    - `No Follow-Up Needed` pill (Muted `#EDF2F7`).
  - Follow-up pill under ticket title matches exact color palette of Action Taken item badge.
  - "Mark done" button appears on `Follow-Up Required` entries, styled identically to Edit (frameless, underlined text). Clicking triggers custom modal overlay (`data-testid="mark-done-confirmation-modal"`).
  - Default-on follow-up priority sort checkbox ("Put 'Follow-Up Required' first").
- **Staff Queue Screen (`/staff/queue`)**:
  - Filter Bar: 2-row layout with up to 4 controls per row. Row 1: Search, Status, IT Priority, Assignment. Row 2: Category, Related System, `Follow-up<br />Required`, Clear All Filters.
  - Table Columns: Single `Last Updated` column (creation date omitted).
  - Cell Styles: Zen Green ticket title links (`var(--color-primary-green)`), pale green row hover (`var(--color-pale-green)`), muted table headers (13px, font weight 600), compact `Yes` (gold) / `No` (muted) follow-up indicators.
  - Compact Status Badges: `Waiting` (for `Waiting for Requester`), `Pending` (for `Pending Verification`).
- **Requester Dashboard Screen (`/requester/dashboard`)**:
  - Greeting header + 4 metric summary cards (`Total Open`, `Waiting for You`, `Recently Updated`, `Recently Resolved`).
  - Quick Action shortcuts buttons (`+ Create Ticket` -> `/requester/tickets/new`, `View All My Tickets` -> `/requester/tickets`).
- **IT Staff / Admin Dashboard Screen (`/staff/dashboard`)**:
  - Greeting header + 4 primary metric cards (`Unassigned Tickets`, `My Owned Tickets`, `Urgent / High Priority`, `Follow-Up Needed`).
  - Urgent & High priority list sorted by IT Priority descending (`Urgent` > `High` > `Medium` > `Low`).
  - Active Ticket Status Breakdown grid with styled badge frames for all statuses including `Cancelled`, `Reopened`, and `Pending Verification`.
  - Direct metric card click handles automatic navigation to filtered queue (`/staff/queue?status=UNASSIGNED`, etc.).

---

## 7. Data Changes

### 7.1 Prisma Schema Model (`ActionTaken`)

```prisma
model ActionTaken {
  id               String   @id @default(cuid())
  ticketId         String
  ticket           Ticket   @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  actionDate       DateTime @default(now())
  description      String   @db.Text
  result           String   @db.Text
  performedById    String
  performedBy      User     @relation(fields: [performedById], references: [id])
  followUpRequired Boolean  @default(false)
  isFollowedUp     Boolean  @default(false)
  followUpNote     String?  @db.Text
  attachmentNotes  String?  @db.Text
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@index([ticketId])
  @@index([performedById])
}
```

### 7.2 Database Indexing & Migrations
- Foreign key indexes on `ActionTaken(ticketId)` and `ActionTaken(performedById)` for performant join queries.
- Prisma migration script `add_actions_taken_lab04` created without loss of existing `User`, `Ticket`, `Attachment`, `PublicComment`, or `InternalNote` data.

### 7.3 Seed Data Increment & Ordering
- Idempotent seed script adding realistic `ActionTaken` entries covering all three follow-up tracking states (`Follow-Up Required`, `Followed up`, `No Follow-Up Needed`).
- Sequential creation date assignment ensuring lower ticket numbers (`TCK-001`, `TCK-002`) correspond to earlier creation dates.
- Seed dataset populating all major statuses, priorities, and dashboard metric indicators.

---

## 8. API Contract Summary

| Method | Endpoint Path | Role Access | Description | Status Codes |
|---|---|---|---|---|
| `GET` | `/api/tickets/:ticketId/actions-taken` | Authenticated | List Actions Taken for a ticket (Scoped to owner for Requesters) | `200`, `401`, `403`, `404` |
| `POST` | `/api/tickets/:ticketId/actions-taken` | IT Staff, Admin | Create a new Action Taken record on a ticket | `201`, `400`, `401`, `403`, `404` |
| `PUT` | `/api/tickets/:ticketId/actions-taken/:actionId` | IT Staff, Admin | Update an existing Action Taken record (including follow-up status resolution) | `200`, `400`, `401`, `403`, `404` |
| `GET` | `/api/dashboard/requester` | Requester, Admin | Retrieve Requester dashboard metrics and recent tickets | `200`, `401`, `403` |
| `GET` | `/api/dashboard/staff` | IT Staff, Admin | Retrieve IT Staff dashboard metrics and recent queue activity | `200`, `401`, `403` |
| `GET` | `/api/dashboard/admin` | Admin | Retrieve Admin dashboard metrics including user account statistics | `200`, `401`, `403` |

---

## 9. Acceptance Criteria

- **AC-01**: Given an authenticated IT Staff user, when valid Action Taken details are submitted for an accessible ticket, then the record is saved with `performedById` bound to the user's session ID and returned with HTTP 201 Created.
- **AC-02**: Given an IT Staff user setting `followUpRequired = true`, when `followUpNote` is empty, then the system rejects the submission with HTTP 400 Bad Request and validation error details.
- **AC-03**: Given an Action Taken entry in `Follow-Up Required` state, when an IT Staff member clicks "Mark done", then a custom confirmation modal popup (`data-testid="mark-done-confirmation-modal"`) is displayed. Upon confirmation, the entry transitions to `Followed up` state.
- **AC-04**: Given an authenticated Requester viewing an owned ticket at `/requester/tickets/:id`, when Actions Taken are retrieved, then all Actions Taken entries recorded by IT Staff are displayed in read-only format.
- **AC-05**: Given an authenticated Requester, when attempting to create, update, or mark done an Action Taken entry, then the system rejects the request with HTTP 403 Forbidden.
- **AC-06**: Given the Actions Taken follow-up sort toggle is active (default ON), entries are ordered as: `Oldest Follow-Up Required` > `Newest Follow-Up Required` > `Newest No Follow-Up Needed` > `Oldest No Follow-Up Needed`.
- **AC-07**: Given an IT Staff member updating a ticket status to `Resolved` or `Closed`, the transition succeeds at any time provided it adheres to the permitted status transition matrix.
- **AC-08**: Given a Requester indicating problem resolution (`isRequesterResolved = true`), when ticket data is fetched, then status remains in active review state until IT Staff formally transitions status.
- **AC-09**: Given an authenticated Requester viewing `/requester/dashboard`, then only metrics and recent tickets owned by that authenticated Requester are returned.
- **AC-10**: Given an authenticated IT Staff member viewing `/staff/dashboard`, then accurate system counts for unassigned tickets, owned tickets, priority tickets (sorted by IT Priority descending), and follow-up alerts are returned, with all active status breakdown entries framed in styled badge containers.
- **AC-11**: Given an authenticated IT Staff member clicking a dashboard metric card (e.g. "Unassigned Tickets"), then the UI navigates to `/staff/queue` pre-filtered by that metric.
- **AC-12**: Given an Administrator viewing `/admin/dashboard`, then accurate user account metrics (total users, active counts) are displayed alongside staff operational metrics.
- **AC-13**: Given the Staff Queue view, the filter bar renders across 2 rows (max 4 controls/row), table headers are styled muted (13px 600), ticket links render in Zen Green with pale green row hover, compact status badges (`Waiting`, `Pending`) are displayed, and a single `Last Updated` date column is shown.
- **AC-14**: Given a ticket in `Cancelled` status, when any user attempts to add an Action Taken or change status, then the system rejects the action with HTTP 400 Bad Request.
- **AC-15**: Given concurrent updates to an Action Taken or ticket status, when stale data is detected, then the backend safely rejects the overwrite with HTTP 409 Conflict.
- **AC-16**: Given screen resolutions from mobile (375px) to desktop (1440px), then all Lab 4 dashboard, queue, and Actions Taken components render without horizontal page scrolling or control overlap.
- **AC-17**: Given keyboard-only navigation, then all dashboard metric cards, drill-down buttons, Action Taken forms, and confirmation modals are fully operable with visible focus indicators.
- **AC-18**: Given all automated test suites executed on `main`, then 100% of unit, API, UI, and E2E regression tests pass without error.

---

## 10. Definition of Done for Sprint 4

1. **Specification & Test DD Completed**: `docs/lab-04/specification.md`, `ui-spec.md`, `api-spec.md`, and `tests.md` created, reviewed, and updated to reflect all final UI and behavioral refinements before final sign-off.
2. **Database Increment & Seed**: Prisma schema updated with `ActionTaken` model, migration script created, and seed script updated with sequential creation dates and realistic Actions Taken covering all three follow-up tracking states.
3. **Backend API Endpoints**: Actions Taken CRUD, follow-up status resolution, and role dashboard API endpoints fully implemented with RBAC, validation, conflict handling, and automated unit/API test coverage.
4. **Frontend UI Implementation**: Requester Dashboard (`/requester/dashboard`), Staff/Admin Dashboard (`/staff/dashboard`), Actions Taken component with 3 follow-up states and modal confirmation popup, and refined Staff Queue filter bar built under Zen Green design language.
5. **Full Regression Hardening**: All Lab 1-3 features (Auth, Requester, Queue, Admin User Management, Comments, Notes, Attachments) verified and passing full test regression suite under `/requester/xxx` routes.
6. **Automated Testing Suite**: All unit, API, React component, and Playwright E2E test suites pass with 100% green status.
7. **Documentation & Deliverables**: `reviewer.md`, `ai-use.md`, `submission_evidence_guide.md`, and screenshots captured under `artifacts/lab-04/screenshots/`.

---

## 11. Assumptions and Decisions

1. **Session Context**: User identity and authorization role are derived exclusively from verified HTTP-only session cookies.
2. **Append/Update Audit Strategy**: Actions Taken records are append and update only; hard deletion is prohibited to preserve ticket audit trail integrity.
3. **Metric Calculation Boundaries**: Dashboard calculations are executed live against PostgreSQL indexes without background caching timers to ensure immediate operational accuracy.
4. **Follow-Up State Management**: The 3 follow-up tracking states (`Follow-Up Required`, `Followed up`, `No Follow-Up Needed`) provide an explicit, unambiguous audit history for staff workflow coordination.

