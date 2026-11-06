# Lab 4 Specification Decisions & Clarifications Sheet

This document highlights the key design decisions, baseline choices, and operational rules for Lab 4 (TokTickIT Actions Taken, Dashboards, and Final Regression).

---

## 1. Confirmed Decisions & Defaults

### 1.1 Actions Taken Parent-Child Data Model
- **Schema Entity**: `ActionTaken` model in Prisma schema.
- **Fields**:
  - `id`: String (`cuid` primary key).
  - `ticketId`: Foreign Key referencing `Ticket.id` (Cascades on delete if ticket deleted).
  - `actionDate`: `DateTime` (Defaults to `now()`; editable in UI to allow backdating if necessary).
  - `description`: Text (Required; detailed description of action performed).
  - `result`: Text (Required; outcome or status of action).
  - `performedById`: Foreign Key referencing `User.id` (Auto-bound to the authenticated IT Staff / Admin user creating the entry).
  - `followUpRequired`: Boolean (Required; default `false`).
  - `followUpNote`: Text (Optional; mandatory validation enforced on server & client if `followUpRequired = true`).
  - `attachmentNotes`: Text (Optional; text notes detailing associated file names/images).
  - `createdAt` & `updatedAt`: Automatic timestamps.
- **Audit & History**: Action Taken entries cannot be deleted by users to ensure complete service-desk auditability. IT Staff and Administrators may edit existing Action Taken records.

### 1.2 Authorization Matrix for Actions Taken
- **Requester**:
  - Can view Actions Taken list on owned tickets only (`ticket.requesterId == session.userId`).
  - **Cannot** create, edit, or delete Actions Taken (`403 Forbidden` enforced by backend API).
- **IT Staff**:
  - Can view Actions Taken on all accessible system tickets.
  - Can create new Actions Taken on any accessible ticket.
  - Can update Actions Taken on accessible tickets.
- **Administrator**:
  - Retains full IT Staff permissions plus administrative access.

### 1.3 Ticket Status & Resolution Rules (No Resolution Gate Barrier)
- **Permitted Transition Matrix**:
  - `New` ➔ `Open`, `In Progress`, `Cancelled`
  - `Open` ➔ `In Progress`, `Waiting for Requester`, `Resolved`, `Cancelled`
  - `In Progress` ➔ `Waiting for Requester`, `Resolved`, `Cancelled`
  - `Waiting for Requester` ➔ `In Progress`, `Resolved`, `Cancelled`
  - `Resolved` ➔ `Closed`, `Reopened`
  - `Closed` ➔ `Reopened`
  - `Reopened` ➔ `In Progress`, `Resolved`, `Cancelled`
  - `Cancelled` ➔ Terminal state (no further transitions permitted).
- **Direct Status Transition**:
  - IT Staff and Administrators may transition a ticket status to `Resolved` or `Closed` at any time according to permitted transitions. A pre-existing Action Taken is **not** required as a gate barrier for status changes.
  - Requester advisory resolution request (`isRequesterResolved = true` / `Pending Verification`) provides user feedback but does not restrict IT Staff status management.

### 1.4 Uniform URL Routing Scheme (`/requester/xxx`)
- To ensure full route consistency across all user roles, all Requester URLs follow the `/requester/xxx` prefix pattern:
  - Dashboard: `/requester/dashboard`
  - My Tickets Queue: `/requester/tickets`
  - Create Ticket: `/requester/tickets/new`
  - Ticket Detail: `/requester/tickets/:id`
- Matching existing Staff (`/staff/queue`, `/staff/tickets/:id`, `/staff/dashboard`) and Admin (`/admin/dashboard`, `/admin/users`) conventions.

### 1.5 Role-Appropriate Dashboard Calculations
- **Requester Dashboard** (`/requester/dashboard`):
  - `Total Open Tickets`: Count of non-closed/non-cancelled tickets owned by authenticated Requester (`status NOT IN ('Closed', 'Cancelled')`).
  - `Waiting for Requester`: Count of tickets owned by Requester in `Waiting for Requester` status.
  - `Recently Updated Tickets`: Top 5 tickets owned by Requester ordered by `updatedAt DESC`.
  - `Recently Resolved Tickets`: Top 5 tickets owned by Requester in `Resolved` or `Closed` status.
- **IT Staff Dashboard** (`/staff/dashboard`):
  - `Unassigned Tickets`: Count of open tickets where `assignedToId IS NULL`.
  - `Tickets Owned by Me`: Count of open tickets assigned to authenticated user (`assignedToId == session.userId`).
  - `Urgent / High Priority`: Count of open tickets with `itPriority IN ('Urgent', 'High')`.
  - `Follow-Up Required`: Count of open tickets containing at least one `ActionTaken` where `followUpRequired == true`.
  - `Status Breakdown`: Grouped count of tickets across all active statuses.
  - `Recently Updated Tickets`: Top 5 system tickets ordered by `updatedAt DESC`.
- **Administrator Dashboard** (`/admin/dashboard`):
  - Integrates all IT Staff dashboard metrics plus User Account statistics (`Total Users`, `Active Requesters`, `Active IT Staff`, `Active Admins`).

### 1.6 Ticket Detail UI Refinements (Actions Taken & Comments)
- **Actions Taken UI**:
  - **Collapsible**: Uses standard arrow toggle (`▼`/`▶`).
  - **Plain Text Record Count**: Displays `(X Records)` as plain text without pill/badge styling.
  - **Pagination**: Paginated at max 5 records per page.
  - **Bordered Text Areas**: `Action Description` and `Result / Outcome` are formatted in individual bordered container boxes (`1px solid var(--color-border)`).
  - **Autofilled Local Datetime**: Action date and time defaults to current date/time matching local system timezone (`YYYY-MM-DDTHH:mm`).
- **Comments & Activity Feed UI**:
  - **Collapsible Header Base**: Matches Actions Taken header design base with arrow toggle (`▼`/`▶`), title "Comments", and plain text count `(X Comments)`.
  - **Invisible Tab Control for Requesters**: Staff tab control strip is hidden from Requesters. Staff and Admins see a sub-header control strip to switch between `Comments` and `Confidential Internal Notes`.
  - **Newest-First Sort Order**: Comments and Internal Notes are ordered descending (`createdAt DESC`) from newest to oldest.
  - **Renamed Terminology**: Renamed "Public Comment" to "Comment".
  - **Persistent Top Input Form**: The `Add a Comment` form stays at the top above comments across page changes.
  - **Pagination**: Paginated at max 10 comments per page.

### 1.7 Actions Taken Follow-Up States & Queue UI Enhancements
- **3-State Follow-Up Tracking**:
  - `Follow-Up Required`: Rendered with yellow background `#FEFCBF`, border `#D69E2E`, and brown text `#744210` (matches header badge below ticket title).
  - `Followed up`: Rendered with green background `#E6FFFA`, border `#319795`, and green text `#234E52` when `followUpRequired = false` and a `followUpNote` exists.
  - `No Follow-Up Needed`: Rendered with gray badge when `followUpRequired = false` and no `followUpNote` exists.
- **Mark Done Action Transition**:
  - Clicking "Mark done" updates `followUpRequired` to `false` while setting or preserving `followUpNote: "Followed up"`, ensuring immediate visual transition to the green `Followed up` state.
  - "Mark done" button design matches the "Edit" button (clean text link, no frame, green text with hover underline).
- **Follow-Up Sorting Order**:
  - When *"Put 'Follow-Up Required' first"* is toggled on:
    $$\text{Oldest Follow-Up Required} \rightarrow \text{Newest Follow-Up Required} \rightarrow \text{Newest Non-Follow-Up} \rightarrow \text{Oldest Non-Follow-Up}$$
- **Staff Queue Page Refinements** (`/staff/queue`):
  - **Filter Bar Grid**: 2-row layout (Row 1: Search, Status, IT Priority, Assignment; Row 2: Category, Related System, `Follow-up Required`, Clear All Filters — 4 controls per line).
  - **Muted Table Headers**: Styled with `color: var(--color-text-muted)`, `fontSize: 13px`, `fontWeight: 600`. Header for follow-up column uses `Follow-up<br />Required`.
  - **Single Date Column**: Removed `Submitted` date column; `Last Updated` (`updatedAt`) remains as sole date column.
  - **Follow-up Cell**: Formatted as simple `Yes` (gold) or `No` (muted text).
  - **Ticket Link & Hover**: Ticket numbers are styled in green (`var(--color-primary-green)`), and table rows highlight with pale green (`var(--color-pale-green)`) on hover, matching Requester list styling.
- **Compact Status Badge Display**:
  - Status badges in tables display `Waiting` (for `Waiting for Requester`) and `Pending` (for `Pending Verification`).
  - Status pills across Staff & Admin Dashboards render bordered pill frames for all statuses including `Cancelled`, `Reopened`, and `Pending`.
