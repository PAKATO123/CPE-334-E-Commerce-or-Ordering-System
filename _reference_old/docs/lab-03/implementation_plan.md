# Lab 3 — Implementation Plan & Feature Breakdown
**TokTickIT · Users, Roles, IT Staff Ticketing, and Admin Screens**

> Each feature below is scoped to be a self-contained, peer-reviewable Pull Request.
> A feature is testable once it **and every feature listed under its prerequisites** are merged.

---

## Current Baseline (Lab 2, Merged)

| Component | Status / Baseline |
|---|---|
| PostgreSQL Schema | `Category`, `Requester`, `RelatedSystem`, `Ticket`, `Attachment` |
| Requester Ticketing MVP | Ticket creation, attachments (upload/download/soft-delete), search, filter, sort, pagination |
| Design Language | Zen Green theme tokens, reusable cards, badges, buttons, form controls |
| Reference Data Seed | Idempotent seed script (`prisma/seed.ts`) |

---

## Feature Roadmap & Status Overview

| Feature | Branch Name | Scope Summary | Status |
|---|---|---|---|
| **F-01** | `feature/lab03-01-schema-and-migration` | Database Schema Evolution (`User`, `Role`, `PublicComment`, `InternalNote`), Data Migration, Seed Script | ✅ Merged |
| **F-02** | `feature/lab03-02-auth-backend` | Authentication Backend, Password Hashing, Session Management (`express-session`), Auth Middleware | ✅ Merged |
| **F-03** | `feature/lab03-03-authorization-and-requester-refactor` | Server-Side Authorization Guards, Requester Isolation, Resolution Indication Backend | ✅ Merged |
| **F-04** | `feature/lab03-04-staff-queue-and-workflow-backend` | IT Staff Queue Backend, Claim/Assign API, Status State Machine, Comments & Notes API | ✅ Merged |
| **F-05** | `feature/lab03-05-auth-ui` | Authentication UI (Login Form, Mandatory Password Change Modal, AppShell with User Context) | ✅ Merged |
| **F-06** | `feature/lab03-06-requester-resolution-ui` | Requester Resolution Indication UI ("I consider this issue resolved"), Confirmation Modal, Badges | 📤 Pushed |
| **F-07** | `feature/lab03-07-staff-queue-ui` | IT Staff Ticket Queue Page UI (Search, Status/Priority/Assignment Filters, Sort, Pagination) | 📤 Pushed |
| **F-08** | `feature/lab03-08-staff-ticket-detail-ui` | IT Staff Ticket Detail View (Claim, Reassign, Status Transition, Public Comments & Internal Notes Feed) | 📤 Pushed |
| **F-09** | `feature/lab03-09-admin-users` | Administrator User Management Backend & UI (`/api/users`, User List, Create/Edit Modals, Safety Guards) | ✅ Completed |
| **F-10** | `feature/lab03-10-e2e-and-docs` | Playwright E2E Testing, Visual Audits, Documentation & Definition of Done Verification | ✅ Completed |

---

## Detailed Feature Specifications

### F-01 · Database Schema Evolution & Data Migration
**Prerequisites:** Lab 2 baseline  
**Branch:** `feature/lab03-01-schema-and-migration`  
**Status:** ✅ Merged

Expand the PostgreSQL Prisma schema and seed script to support real users, authentication, roles, ticket ownership, comments, notes, and status workflow.

**Scope:**
- Update `server/prisma/schema.prisma`:
  - `Role` Enum: `REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`
  - `User` model: `id`, `email` (unique), `passwordHash`, `name`, `role`, `isActive`, `mustChangePassword`, `createdAt`, `updatedAt`
  - `Ticket` model additions: `assignedToId` (User relation), `itPriority` (enum string), `isRequesterResolved` (boolean), timestamps
  - `PublicComment` model: `id`, `ticketId`, `authorId`, `content`, `createdAt`
  - `InternalNote` model: `id`, `ticketId`, `authorId`, `content`, `createdAt`
- Data Migration Script:
  - Migrate Lab 2 `Requester` rows into `User` records (`role = REQUESTER`, `passwordHash` hashed `Password123!`, `mustChangePassword = true`).
  - Link `Ticket.requesterId` directly to `User.id`.
- Idempotent Seed Script (`prisma/seed.ts`):
  - 4 active + 1 inactive Requesters (`requester1@toktickit.local` ... `requester5@toktickit.local`)
  - 3 active + 1 inactive IT Staff (`staff1@toktickit.local` ... `staff4@toktickit.local`)
  - 1 active Administrator (`admin@toktickit.local`)
  - 10+ realistic Tickets distributed across statuses (`New`, `Open`, `In Progress`, `Waiting for Requester`, `Pending Verification`, `Resolved`, `Closed`), priorities, and assignments
  - Sample Public Comments and confidential Internal Notes

**Testable when F-01 is done:**
- `npx prisma migrate dev` executes without errors.
- `npm run prisma:seed` runs twice without errors or duplicate records.
- Database inspection confirms migrated `User` rows, `Ticket.assignedToId`, `PublicComment`, and `InternalNote` structures.

---

### F-02 · Authentication Backend & Auth Middleware
**Prerequisites:** F-01  
**Branch:** `feature/lab03-02-auth-backend`  
**Status:** ✅ Merged

Implement backend session management, credential validation, password hashing, and authentication API endpoints.

**Scope:**
- Password Hashing: `bcryptjs` with salt rounds >= 10.
- Auth Middleware & Guards:
  - Session tracking using HttpOnly cookies (`express-session`).
  - `requireAuth`: Verifies active session, checks `isActive = true`.
  - `requireRole(...roles)`: Enforces role-based route authorization.
  - `requireFirstLoginCompleted`: Redirects/blocks users with `mustChangePassword = true`.
- Authentication Endpoints:
  - `POST /api/auth/login`: Validates active user credentials, establishes session, returns user identity and role.
  - `POST /api/auth/logout`: Destroys session and clears cookie.
  - `GET /api/auth/me`: Returns current authenticated user context.
  - `POST /api/auth/change-password`: Validates password complexity (8+ chars, uppercase, lowercase, digit), updates hash, sets `mustChangePassword = false`.
- API Integration Tests (`server/tests/lab-03/auth.api.test.ts`):
  - Happy path login, logout, profile fetch, password change.
  - Invalid password (401), inactive account (401), weak new password (400).

**Testable when F-03 is done:**
- `POST /api/auth/login` returns `200 OK` with session cookie for valid credentials.
- Deactivated user login returns `401 Unauthorized`.
- User with `mustChangePassword = true` attempting restricted endpoints receives forced password change error.
- All auth unit and API tests in `auth.api.test.ts` pass.

---

### F-03 · Server-Side Authorization & Requester Refactoring
**Prerequisites:** F-02  
**Branch:** `feature/lab03-03-authorization-and-requester-refactor`  
**Status:** ✅ Merged

Refactor Lab 2 Requester endpoints to use session identity and enforce server-side data isolation.

**Scope:**
- Remove reliance on client-supplied `requesterId` parameters; bind all Requester queries to `req.user.id`.
- Scoping guards:
  - `GET /api/tickets`: Returns only tickets where `requesterId === req.user.id`.
  - `POST /api/tickets`: Sets `requesterId = req.user.id` automatically.
  - `GET /api/tickets/:id` & attachments: Rejects cross-requester access with `403 Forbidden`.
- Requester Resolution Request Endpoint (`PATCH /api/tickets/:id/resolve-indication`):
  - Requesters can request problem resolution on their owned ticket.
  - Sets `isRequesterResolved = true` and updates status to `Pending Verification`.
- API Integration Tests (`server/tests/lab-03/authorization.api.test.ts`):
  - Requester isolation verification.
  - Cross-user ticket access rejection (`403 Forbidden`).

**Testable when F-03 is done:**
- Requesters can only access their own tickets and attachments.
- Passing another user's `requesterId` in request bodies is ignored.
- Requester resolution request updates ticket status to `Pending Verification`.
- `authorization.api.test.ts` passes.

---

### F-04 · IT Staff Ticket Queue & Workflow Backend
**Prerequisites:** F-02, F-03  
**Branch:** `feature/lab03-04-staff-queue-and-workflow-backend`  
**Status:** ✅ Merged

Implement the shared IT Staff Ticket Queue API, ticket ownership management, priority management, status state machine workflow, and comments/notes APIs.

**Scope:**
- Queue Retrieval (`GET /api/tickets/staff-queue`):
  - Accessible to `IT_STAFF` and `ADMINISTRATOR` roles only (`403` for Requesters).
  - Search: Substring keyword match on `ticketNumber`, `summary`, `description`.
  - Filters: `status`, `itPriority`, `assignment` (`unassigned`, `me`, `assignedToId`).
  - Sorting: `createdAt`, `itPriority`, `currentStatus` (`asc` / `desc`).
  - Pagination: `page`, `pageSize` (10, 25, 50).
- Ownership Endpoints:
  - `PATCH /api/tickets/:id/claim`: Sets `assignedToId = req.user.id`.
  - `PATCH /api/tickets/:id/assign`: Reassigns `assignedToId` to specified IT Staff user.
- Priority Endpoint (`PATCH /api/tickets/:id/priority`):
  - Updates `itPriority` (`Urgent`, `High`, `Medium`, `Low`).
- Status Workflow Endpoint (`PATCH /api/tickets/:id/status`):
  - Validates status transitions per state machine matrix:
    - `New` ➔ `Open`, `In Progress`, `Cancelled`
    - `Open` / `In Progress` / `Waiting for Requester` ➔ `Pending Verification` (Requester) or `Resolved` / `Closed` / `Cancelled` (Staff)
    - `Pending Verification` ➔ `Resolved` / `Closed` (Staff confirm) OR `In Progress` / `Open` (Staff revert if unsolved, resetting `isRequesterResolved = false`)
    - `Resolved` ➔ `Closed`, `Reopened`
    - `Closed` ➔ `Reopened`
- Public Comments & Confidential Internal Notes APIs:
  - `GET / POST /api/tickets/:id/comments`: Public comments for ticket owner, staff, admin.
  - `GET / POST /api/tickets/:id/notes`: Confidential notes for staff and admin only (`403` for Requesters).
- API Integration Tests (`staff-queue.api.test.ts`, `staff-ticket-detail.api.test.ts`, `comments-notes.api.test.ts`).

**Testable when F-04 is done:**
- `GET /api/tickets/staff-queue` returns paginated system tickets for Staff/Admin, returns `403` for Requester.
- Ticket claiming and reassignment update `assignedToId`.
- Invalid status transition (e.g. `New` ➔ `Closed`) returns `400 Bad Request`.
- Staff revert resets status to `In Progress` and clears `isRequesterResolved`.
- All backend integration tests pass.

---

### F-05 · Authentication & Password Change UI
**Prerequisites:** F-02, F-03  
**Branch:** `feature/lab03-05-auth-ui`  
**Status:** ✅ Merged

Implement frontend Login form, Mandatory Password Change modal, and updated Application Shell with user context.

**Scope:**
- Login Form (`LoginForm.tsx`): Email/Password input fields, error alert banner.
- Mandatory Password Change Modal (`ChangePasswordModal.tsx`): Non-dismissible modal when `mustChangePassword = true`, real-time password complexity checklist.
- Application Shell Update (`AppShell.tsx`):
  - Active user display badge (`Name (Role)`).
  - Navigation tabs filtered by user role.
  - Sign Out action clearing session state.
- Component Tests (`client/src/lab-03/__tests__/Login.test.tsx`, `ChangePassword.test.tsx`).

**Testable when F-05 is done:**
- Logging in with valid credentials opens the role-based shell.
- User requiring password change sees non-dismissible modal until saved.
- Logout clears context and returns to login form.
- Component tests pass.

---

### F-06 · Requester Resolution Indication UI & Status Display Updates
**Prerequisites:** F-03, F-05  
**Branch:** `feature/lab03-06-requester-resolution-ui`  
**Status:** 📤 Pushed

Build the Requester resolution indication UI button, confirmation modal, and status badge updates.

**Scope:**
- Action Button & Modal (`TicketDetailPage.tsx`):
  - "I consider this issue resolved" button (`data-testid="request-resolution-button"`).
  - Confirmation modal (`data-testid="resolution-confirmation-modal"`) with `[Cancel]` and `[Yes, Mark as Resolved]`.
- Disabled State:
  - Displays disabled "Resolution Requested ✓" badge (`data-testid="resolution-requested-badge"`).
- Status Badges:
  - Yellow `Pending Verification` badge on ticket detail view and `/tickets` list.
  - Styled `Cancelled` status badge (`border: 1px solid #A0AEC0`, `backgroundColor: #E2E8F0`).
- Post-Authentication Navigation Fixes:
  - Automatically redirects authenticated users away from root `/` selector to `/tickets` or `/staff/queue`.

**Testable when F-06 is done:**
- Requester can indicate resolution on owned active tickets.
- Confirmation modal opens and updates status to `Pending Verification`.
- Resolution button updates to disabled "Resolution Requested ✓" badge.
- Navigation redirects authenticated users to `/tickets` seamlessly.

---

### F-07 · IT Staff Ticket Queue & Filter Bar UI
**Prerequisites:** F-04, F-05  
**Branch:** `feature/lab03-07-staff-queue-ui`  
**Status:** 📤 Pushed

Build the dedicated IT Staff Ticket Queue page (`/staff/queue`).

**Scope:**
- Ticket Queue View (`/staff/queue`):
  - Search bar (matching ticket number, summary, description).
  - Filter bar: Status dropdown, IT Priority dropdown, Assignment filter (`All`, `Unassigned`, `Assigned to Me`).
  - Data table: Ticket #, Requester Name, Category, Related System, IT Priority badge, Status badge, Assignee column, Submission timestamp.
  - Sorting headers (Ticket #, Priority, Status, Date) and pagination controls (page size selector, prev/next).
- Component Tests (`client/src/lab-03/__tests__/StaffQueue.test.tsx`).

**Testable when F-07 is done:**
- Staff Queue renders system tickets with working search, filters, and pagination.
- Staff can filter by status, priority, and assignment (`unassigned`, `me`).
- Component tests pass.

---

### F-08 · IT Staff Ticket Detail Management & Activity Feed UI
**Prerequisites:** F-04, F-05, F-07  
**Branch:** `feature/lab03-08-staff-ticket-detail-ui`  
**Status:** ✅ Completed

Build the IT Staff management controls and activity feed on ticket detail view (`TicketDetailPage.tsx`).

**Scope:**
- Sidebar Management Controls:
  - Claim / Re-claim button (`data-testid="claim-ticket-button"`). Claiming assigns ticket directly to the claimer.
  - Assignee select dropdown (`data-testid="assignee-select"`), filtered to active `IT_STAFF` members only (excluding requesters, admins, and inactive users).
  - IT Priority selector (`data-testid="it-priority-select"`), correctly displaying initial/updated priority values (`LOW`, `MEDIUM`, `HIGH`, `URGENT`).
  - Status transition dropdown (`data-testid="status-select"`).
- `Pending Verification` Resolution Actions:
  - Staff "Confirm Resolution" (`data-testid="confirm-verification-button"`) and "Revert to In Progress" (`data-testid="revert-verification-button"`).
- Tabbed Activity Feed & Communication:
  - Public Comments feed (`data-testid="comments-tab"`, `data-testid="comments-feed"`, `data-testid="comment-input"`, `data-testid="post-comment-button"`).
  - Confidential Internal Notes feed (`data-testid="notes-tab"`, `data-testid="notes-feed"`, `data-testid="note-input"`, `data-testid="post-note-button"`), with yellow confidential warning container (`#FEFCBF`).
- Role Clearance Badges:
  - Styled clearance badges (`IT Staff`, `Admin`, `Requester`) replace raw text strings.
- Navigation & Notification Enhancements:
  - Toast notifications positioned at bottom-right (`bottom: 24px; right: 24px`).
  - Automatic route protection redirecting IT Staff / Admin away from requester routes (`/tickets`, `/tickets/new`) to `/staff/queue`.
- Component Tests (`client/tests/lab-03/StaffTicketDetail.test.tsx`): 5/5 unit tests passed.

**Testable when F-08 is done:**
- Staff can claim/reassign tickets to active IT staff, change priority, and transition status on detail view.
- Staff can revert `Pending Verification` back to `In Progress` or confirm resolution.
- Public comments and confidential internal notes feeds post and display cleanly.
- Component tests pass.

---

### F-09 · Administrator User Management Backend & UI
**Prerequisites:** F-02, F-05  
**Branch:** `feature/lab03-09-admin-users`  
**Status:** ✅ Completed

Build Administrator user management backend endpoints, administration screen, and modals.

**Scope:**
- Backend API Endpoints (`/api/users`): Restricted to `ADMINISTRATOR` role (`403` for others).
  - `GET /api/users`: Search (name/email), role filter.
  - `POST /api/users`: Create user account (duplicate email `409` check).
  - `PATCH /api/users/:id`: Edit user details, role, `isActive` status (Admin self-deactivation and last-admin guards `400`).
  - `POST /api/users/:id/reset-password`: Reset initial password, setting `mustChangePassword = true`.
- User Management Screen (`/admin/users`):
  - Search bar (name/email) and Role filter dropdown.
  - User table: Name, Email, Role badge, Status pill (`Active`/`Inactive`), Password Change Required badge, Actions.
- Modals & Drawers:
  - Create User Modal, Edit User Modal, Reset Initial Password Modal.
  - Safety error feedback banners.
- Integration & Component Tests (`server/tests/lab-03/users-admin.api.test.ts`, `UserManagement.test.tsx`).

**Testable when F-09 is done:**
- Admin can view, search, filter, create, edit users, and reset initial passwords.
- Non-Admin accessing `/api/users` receives `403 Forbidden`.
- Duplicate email returns `409 Conflict`, self-deactivation returns `400 Bad Request`.
- Component and API tests pass.

---

### F-10 · Playwright E2E Testing, Visual Audits & Definition of Done Verification
**Prerequisites:** F-07, F-08, F-09  
**Branch:** `feature/lab03-10-e2e-and-docs`  
**Status:** ✅ Completed

Implement Playwright end-to-end test suites, perform responsive design audits, capture required submission evidence, and verify Product Definition of Done.

**Scope:**
- Playwright E2E Suites (`e2e/lab-03/`):
  - `authentication.spec.ts`: Login, mandatory first-login password change, invalid login, logout.
  - `staff-ticket-flow.spec.ts`: Staff login, queue search/filter, claiming ticket, setting priority, posting internal note, requester resolution request, staff revert, staff resolution.
  - `user-administration.spec.ts`: Admin login, user creation, editing account, initial password reset, safety guard verification.
- Visual Audit & Screenshots:
  - Save desktop (1440px), tablet (768px), and mobile (375px) screenshots.
- Reviewer & AI Documentation:
  - Finalize `docs/lab-03/reviewer.md` with PR links and partner review approvals.
  - Finalize `docs/lab-03/ai-use.md` with prompts and reflection.

**Testable when F-10 is done:**
- All Playwright E2E tests pass headlessly (`npx playwright test`).
- Full regression suite across Lab 2 and Lab 3 passes cleanly.
- Product Definition of Done checklist fully satisfied.