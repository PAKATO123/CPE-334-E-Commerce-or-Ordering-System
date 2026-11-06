# Lab 3 Sprint Engineering Specification
TokTickIT Users, Roles, IT Staff Ticketing, and Admin Screens

## 1. Sprint Goal
Replace the temporary Development Requester selector from Lab 2 with secure authentication (email/password) and server-side role-based authorization for Requester, IT Staff, and Administrator roles. Introduce the operational IT Staff workflow (shared ticket queue, ticket detail, ownership claim/reassignment, IT priority management, permitted status transitions, public comments, and internal notes), minimalist Administrator user management, and mandatory first-login password change while maintaining strict backward compatibility with all completed Lab 2 Requester capabilities and the Zen Green design system.

---

## 2. Stakeholder Request Interpretation
- **Authentication & Security**: Remove the temporary Development Requester dropdown. Implement secure sign-in using email and password. Users logging in with an initial password assigned by an Administrator must be forced to set a new password before accessing application features.
- **Requester Identity**: Requesters must continue using all ticket creation, viewing, filtering, and attachment management features built in Lab 2, but the Requester identity must automatically be derived from the authenticated session context rather than a client-supplied selector. Requesters may post Public Comments on their tickets and flag that a problem appears resolved.
- **IT Staff Queue & Ticket Workflow**: Provide a dedicated, responsive Ticket Queue for IT Staff to find work, filter/search/sort/paginate tickets, claim or reassign ticket ownership, set IT Priority, update ticket status according to defined transition rules, communicate with Requesters via Public Comments, and record confidential Internal Notes.
- **Administrator User Management**: Provide a minimalist User Management screen where Administrators can view active and inactive users, search by name or email, filter by role, create new user accounts with one assigned role and an initial password, edit basic account details (name, email, role, active status), and set new initial passwords that force a first-login password change.
- **Backend Authorization**: Protect all API endpoints and server resources based on authenticated role and ticket ownership. UI control visibility (hiding/disabling buttons) is for user experience only and does not replace backend authorization enforcement.
- **Design Language**: Re-use and extend the established Zen Green theme tokens, component conventions, responsive behavior, and accessibility practices from Lab 2.

---

## 3. Scope

### Included

#### 1. Authentication & Session Management
- Login with email and password.
- Mandatory first-login password change when `mustChangePassword` flag is set.
- Secure session management via HttpOnly cookies (or Bearer tokens) and server-side verification.
- User logout and session destruction.
- Authenticated user profile retrieval (`/api/auth/me`).

#### 2. Authenticated Requester Workflow (Lab 2 Evolution)
- Requester identity automatically bound to authenticated user.
- Creation of Tickets with Category, Related System, Summary, Description, Requested Priority, and initial attachments.
- Requester ticket list, search, filter, sort, and pagination restricted strictly to owned tickets.
- Requester ticket detail view restricted strictly to owned tickets.
- Attachment viewing, downloading, adding post-creation, and soft-deleting with removal reason.
- Posting Public Comments on owned tickets.
- Indicating that a reported problem appears resolved (`isRequesterResolved` flag).

#### 3. IT Staff Ticket Queue & Detail Operations
- IT Staff Ticket Queue view displaying all system tickets.
- Queue search (ticket number, summary, description), filtering (status, IT priority, category, system, assignment), sorting, and pagination.
- Opening Ticket Detail as IT Staff.
- Ticket ownership claim (assigning self as owner) and reassignment to any active IT Staff or Administrator.
- Setting/updating IT Priority (`Urgent`, `High`, `Medium`, `Low`).
- Updating Ticket Status following strict permitted transition matrix (`New`, `Open`, `In Progress`, `Waiting for Requester`, `Resolved`, `Closed`, `Reopened`, `Cancelled`).
- Posting Public Comments (visible to Requester, IT Staff, Admin).
- Posting and viewing Internal Notes (visible ONLY to IT Staff and Admin).

#### 4. Minimalist Administrator User Management
- User listing table displaying Name, Email, Role, Status, and Actions.
- Real-time client-side / server-side search by name or email.
- Optional filtering by Role (`All`, `Requester`, `IT Staff`, `Administrator`).
- Create User dialog: Name, Email, Role (single role selection), Initial Password. Sets `mustChangePassword = true` and `isActive = true`.
- Edit User dialog: Update Name, Email, Role, and Active/Inactive status.
- Set Initial Password dialog: Assign a new initial password to an existing user, forcing `mustChangePassword = true`.
- Safety Rules: Block self-deactivation by Administrator; prevent deactivating or removing the last active Administrator; reject duplicate email addresses.

#### 5. Data Model, Seed & Migration
- Extend PostgreSQL Prisma schema with `User`, `PublicComment`, and `InternalNote` models.
- Migrate Lab 2 `Requester` records into `User` records with `REQUESTER` role.
- Update `Ticket` model to include `assignedToId` (User relation), `itPriority` (enum), `isRequesterResolved` (boolean), and timestamps.
- Idempotent seed script creating 4 active Requesters, 1 inactive Requester, 3 active IT Staff, 1 inactive IT Staff, 1 active Administrator, and realistic tickets with comments/notes.

### Excluded
- Self-registration / public sign-up.
- Password reset via email links, email invitations, or multi-factor authentication (MFA).
- Social login / Single Sign-On (SSO).
- Multiple roles per user (each user has exactly one assigned role).
- User deletion, bulk user actions, CSV import/export, and user activity audit history.
- Departments, organizations, or profile photos.
- Actions Taken entity and workflow (explicitly deferred to Lab 4).
- Formal SLA calculations, escalation rules, and email notification services.
- Dashboards and complex KPI analytics (queue stats limited to list filters/counts).

---

## 4. Functional Requirements

### Authentication & First-Login Password Change
- **FR-01: Authenticate User**  
  The system shall authenticate users using email and password. Upon successful validation of an active user's credentials, the backend shall establish an authenticated session.
- **FR-02: Enforce Mandatory Password Change**  
  If an authenticated user has `mustChangePassword = true`, the system shall restrict access to all normal application routes and enforce redirection to the Password Change screen until a valid new password is saved.
- **FR-03: Change Password**  
  The system shall allow users with `mustChangePassword = true` (or users updating their password from profile) to submit a new password that meets validation rules (min 8 chars, 1 uppercase, 1 lowercase, 1 digit), updating the credential and setting `mustChangePassword = false`.
- **FR-04: Retrieve Current User Profile**  
  The system shall provide an endpoint returning the authenticated user's ID, name, email, role, and password-change requirement status.
- **FR-05: User Logout**  
  The system shall invalidate the authenticated session upon user logout request and redirect the user to the Login screen.
- **FR-06: Reject Inactive User Authentication**  
  The system shall reject authentication attempts from deactivated user accounts (`isActive = false`) with an appropriate credentials error.

### Authenticated Requester Workflow
- **FR-07: Bind Ticket Ownership to Authenticated Identity**  
  The system shall assign newly created tickets to the authenticated user ID without relying on any client-provided requester identifier.
- **FR-08: Restrict Requester Data Access**  
  The system shall ensure Requesters can only view, search, filter, and access details of tickets owned by their authenticated account.
- **FR-09: Requester Attachment Management**  
  The system shall maintain all Lab 2 attachment rules (upload during creation, post-creation upload, download, soft-delete with removal reason) strictly scoped to the ticket owner.
- **FR-10: Requester Public Comment Submission**  
  The system shall allow the ticket owner to view and post Public Comments on their tickets.
- **FR-11: Requester Problem Resolution Request & Confirmation**  
  The system shall allow the ticket owner to request marking their problem as resolved. When requested:
  - The UI shall present a confirmation popup modal (*"Are you sure you want to mark this problem as resolved?"*).
  - Upon user confirmation, the system updates `isRequesterResolved = true` and transitions the ticket status to `Pending Verification`.
  - The button becomes disabled and greyed out showing `"Resolution Requested ✓"` to clearly indicate submission.
  - A user-friendly badge `"Pending Verification"` (or `"User Marked Resolved"`) is displayed on the ticket detail and queue views.
  - IT Staff viewing the ticket can either confirm and transition status to `Resolved` / `Closed`, or revert the ticket back to `In Progress` / `Open` if deemed unsolved.

### IT Staff Ticket Queue & Operations
- **FR-12: Display Shared IT Staff Ticket Queue**  
  The system shall display a queue of all system tickets for users with `IT_STAFF` or `ADMINISTRATOR` roles.
- **FR-13: Queue Search and Filtering**  
  The system shall allow IT Staff to search tickets by keyword (Ticket Number, Summary, Description) and filter by Status, IT Priority, Category, Related System, and Ownership Assignment (Unassigned, Assigned to Me, Assigned to Specific Staff).
- **FR-14: Queue Sorting and Pagination**  
  The system shall allow IT Staff to sort the ticket queue by Created Date, IT Priority, or Status, with configurable page sizes (10, 25, 50).
- **FR-15: Claim Ticket Ownership**  
  The system shall allow an IT Staff member to claim an unassigned or assigned ticket, setting `assignedToId` to their authenticated user ID.
- **FR-16: Reassign Ticket Ownership**  
  The system shall allow IT Staff or Administrators to reassign a ticket's ownership to any active IT Staff or Administrator user.
- **FR-17: Manage IT Priority**  
  The system shall allow IT Staff or Administrators to update the ticket's `itPriority` field (`Urgent`, `High`, `Medium`, `Low`). Initial `itPriority` defaults to `requestedPriority`.
- **FR-18: Execute Permitted Ticket Status Transitions**  
  The system shall allow IT Staff or Administrators to update a ticket's status in accordance with the strict status transition state machine.
- **FR-19: Create and View Public Comments**  
  The system shall allow IT Staff and Administrators to view all Public Comments and add new Public Comments to any ticket.
- **FR-20: Create and View Internal Notes**  
  The system shall allow IT Staff and Administrators to view and post confidential Internal Notes associated with a ticket. Internal Notes must be completely inaccessible to Requester accounts.

### Minimalist Administrator User Management
- **FR-21: Display User List**  
  The system shall provide an Administrator-only screen listing user accounts with fields: Name, Email, Role, Active Status, and Action buttons.
- **FR-22: Search and Filter Users**  
  The system shall allow Administrators to search users by Name or Email and filter by Role (`All`, `REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`).
- **FR-23: Create User**  
  The system shall allow Administrators to create a new user with Name, Email, single Role selection, and Initial Password. The newly created user is initialized with `isActive = true` and `mustChangePassword = true`.
- **FR-24: Validate User Email Uniqueness**  
  The system shall reject user creation or update if the email address is already registered in the system.
- **FR-25: Edit User Account Details**  
  The system shall allow Administrators to update a user's Name, Email, Role, and Active/Inactive status.
- **FR-26: Set New Initial Password**  
  The system shall allow Administrators to reset a user's password by specifying a new initial password, automatically resetting `mustChangePassword = true` for that user.
- **FR-27: Prevent Administrator Self-Deactivation**  
  The system shall prevent an Administrator from deactivating their own active account.
- **FR-28: Protect Minimum Active Administrator Count**  
  The system shall block any action that would result in zero active Administrator accounts in the system.

---

## 5. Business Rules

### Authentication & Passwords
- **BR-01: Credentials & Active State**  
  Only users with `isActive = true` and valid matching email/password credentials may authenticate.
- **BR-02: First-Login Password Change Requirement**  
  A user with `mustChangePassword = true` cannot access normal application screens or endpoints (except password change and logout) until a valid new password has been successfully saved.
- **BR-03: Password Complexity Rules**  
  All passwords (initial and user-changed) must contain a minimum of 8 characters, at least one uppercase letter, one lowercase letter, and one numerical digit.
- **BR-04: Secure Password Storage**  
  Passwords must never be stored in plain text. All passwords must be hashed using `bcrypt` (with salt rounds >= 10).

### Role & Server-Side Authorization Matrix
- **BR-05: Single Permitted Role**  
  Every user belongs to exactly one role: `REQUESTER`, `IT_STAFF`, or `ADMINISTRATOR`.
- **BR-06: Authorization Matrix**  
  Server-side authorization rules are defined as follows:

| Endpoint / Operation | Requester | IT Staff | Administrator |
|---|---|---|---|
| `POST /api/auth/login` | Public | Public | Public |
| `POST /api/auth/logout` | Authenticated | Authenticated | Authenticated |
| `GET /api/auth/me` | Authenticated | Authenticated | Authenticated |
| `POST /api/auth/change-password` | Authenticated | Authenticated | Authenticated |
| `GET /api/tickets/my-tickets` | Owned Only | Forbidden (Use Queue) | Forbidden |
| `POST /api/tickets` | Permitted (Self) | Permitted (Self) | Permitted (Self) |
| `GET /api/tickets/:id` | Owned Only | All Tickets | All Tickets |
| `GET /api/tickets/staff-queue` | Forbidden (403) | Permitted | Permitted |
| `PATCH /api/tickets/:id/claim` | Forbidden (403) | Permitted | Permitted |
| `PATCH /api/tickets/:id/assign` | Forbidden (403) | Permitted | Permitted |
| `PATCH /api/tickets/:id/priority` | Forbidden (403) | Permitted | Permitted |
| `PATCH /api/tickets/:id/status` | Forbidden (403) | Permitted | Permitted |
| `PATCH /api/tickets/:id/resolve-indication` | Owned Only | Forbidden | Forbidden |
| `GET /api/tickets/:id/comments` | Owned Only | All Tickets | All Tickets |
| `POST /api/tickets/:id/comments` | Owned Only | All Tickets | All Tickets |
| `GET /api/tickets/:id/notes` | Forbidden (403) | Permitted | Permitted |
| `GET /api/users` | Forbidden (403) | Permitted (Staff List) | Permitted |
| `POST /api/users` | Forbidden (403) | Forbidden (403) | Permitted |
| `PUT/PATCH /api/users/:id` | Forbidden (403) | Forbidden (403) | Permitted |
| `POST /api/users/:id/reset-password` | Forbidden (403) | Forbidden (403) | Permitted |

- **BR-07: Safe Error Behavior**  
  Requests attempting unauthorized access to resources belonging to another user must return `403 Forbidden` without exposing whether the resource exists.

### Ticket Ownership, Priority, and Status Workflow
- **BR-08: Ticket Ownership**  
  A Ticket has one Requester owner (creator) and zero or one assigned IT Staff owner (`assignedToId`). The assignee options strictly consist of active users with the `IT_STAFF` role (excluding customers/requesters, administrators, and inactive staff members). Any IT Staff member claiming or re-claiming a ticket assigns ownership directly to themselves.
- **BR-09: IT Priority Defaults & Modification**  
  When a Ticket is created, `itPriority` is initialized to the value of `requestedPriority` (or `Medium` if `requestedPriority` was omitted). `requestedPriority` remains immutable after creation. `itPriority` can only be changed by IT Staff or Administrators.
- **BR-10: Ticket Status State Machine & Permitted Transitions**  
  Ticket statuses follow this strict state transition table:

| Current Status | Permitted Target Statuses | Trigger / Role |
|---|---|---|
| `New` | `Open`, `In Progress`, `Cancelled` | IT Staff / Admin |
| `Open` | `In Progress`, `Waiting for Requester`, `Pending Verification`, `Resolved`, `Cancelled` | IT Staff / Admin (Requester for `Pending Verification`) |
| `In Progress` | `Waiting for Requester`, `Pending Verification`, `Resolved`, `Cancelled` | IT Staff / Admin (Requester for `Pending Verification`) |
| `Waiting for Requester` | `In Progress`, `Pending Verification`, `Resolved`, `Cancelled` | IT Staff / Admin (Requester for `Pending Verification`) |
| `Pending Verification` | `Resolved`, `Closed`, `In Progress`, `Open` | IT Staff / Admin (Confirm -> `Resolved`/`Closed`, Revert -> `In Progress`/`Open`) |
| `Resolved` | `Closed`, `Reopened` | IT Staff / Admin |
| `Closed` | `Reopened` | IT Staff / Admin |
| `Reopened` | `In Progress`, `Pending Verification`, `Resolved`, `Cancelled` | IT Staff / Admin |
| `Cancelled` | None (Terminal state) | N/A |

- **BR-11: Requester Resolution Request & Staff Revert Rules**  
  - Requester confirmation modal is required before submitting resolution request.
  - Upon confirmation, `isRequesterResolved` becomes `true` and status becomes `Pending Verification`. The UI button becomes greyed out (`Resolution Requested ✓`).
  - If IT Staff deems the issue unsolved, IT Staff may revert the status back to `In Progress` or `Open`, which resets `isRequesterResolved = false` and re-enables the resolution request button for the Requester.

### Public Comments & Internal Notes
- **BR-12: Append-Only Comments & Notes**  
  Both Public Comments and Internal Notes are strictly append-only. Editing and deleting existing entries is prohibited.
- **BR-13: Author and Timestamp Integrity**  
  The system automatically attaches the authenticated user's ID and backend server timestamp to each comment or note. Client-supplied timestamps or author IDs are ignored.
- **BR-14: Content Validation & Sanitization**  
  Comment and note content must be non-empty text (minimum 1 character after trimming) and maximum 2,000 characters. Plain text rendering must sanitize HTML/script tags to prevent XSS.
- **BR-15: Visibility Restrictions**  
  Public Comments are readable by Ticket Owner, IT Staff, and Administrators. Internal Notes are strictly invisible to Requester accounts (backend returns `403 Forbidden` if requested by a Requester).

### User Management Safety Rules
- **BR-16: User Deactivation Over Deletion**  
  User records cannot be hard deleted from the database to preserve historical ticket ownership and audit integrity. Account deactivation (`isActive = false`) is used instead.
- **BR-17: Unique Email Requirement**  
  Email addresses must be unique across all active and inactive user accounts (case-insensitive).
- **BR-18: Admin Self-Deactivation Guard**  
  An Administrator user cannot change their own account status to `isActive = false`.
- **BR-19: Minimum Active Admin Guard**  
  The system must reject any attempt to deactivate or change the role of an Administrator if it would leave zero active `ADMINISTRATOR` accounts in the database.

---

## 6. UI Specification Summary
Full visual design, layout structures, Zen Green theme tokens, and component behavior are detailed in [ui-spec.md](file:///c:/Users/pakat/Projects/School/CPE334/toktickit/toktickit/toktickit/docs/lab-03/ui-spec.md). Key screen summaries include:

1. **Login Screen**: Clean Zen Green card centered on viewport with Email, Password, submit button, and alert banner for auth errors.
2. **Mandatory Password Change Modal / Screen**: Displayed automatically when `mustChangePassword = true`. Contains New Password and Confirm Password fields with real-time complexity validation checklist.
3. **Updated Application Header & Shell**: Replaces Development Requester selector with active User Name, Role badge (`Requester`, `IT Staff`, `Admin`), navigation tabs filtered by role, and Profile/Logout dropdown.
4. **IT Staff Ticket Queue**: Data-dense table with search input, status/priority/assignment dropdown filters, sorting controls, pagination footer, and status/priority badges.
5. **IT Staff Ticket Detail**: Dual-column layout featuring Ticket Info & Metadata card, Claim/Assign & Status transition panel, Attachment viewer, and Tabbed activity feed (Public Comments vs Confidential Internal Notes).
6. **Administrator User Management Screen**: User list table with Search by name/email, Role filter, "Add User" action button, and per-row Edit and Reset Password trigger actions.

---

## 7. Data Changes & Migration

### Schema Model Modifications (`server/prisma/schema.prisma`)

```prisma
enum Role {
  REQUESTER
  IT_STAFF
  ADMINISTRATOR
}

model User {
  id                 Int              @id @default(autoincrement())
  email              String           @unique
  passwordHash       String
  name               String
  role               Role             @default(REQUESTER)
  isActive           Boolean          @default(true)
  mustChangePassword Boolean          @default(true)
  createdAt          DateTime         @default(now())
  updatedAt          DateTime         @updatedAt
  ticketsSubmitted   Ticket[]         @relation("TicketRequester")
  ticketsAssigned    Ticket[]         @relation("TicketAssignee")
  publicComments     PublicComment[]
  internalNotes      InternalNote[]
}

// Update Ticket Model:
model Ticket {
  id                  Int             @id @default(autoincrement())
  ticketNumber        String          @unique
  requesterId         Int
  requester           User            @relation("TicketRequester", fields: [requesterId], references: [id])
  assignedToId        Int?
  assignedTo          User?           @relation("TicketAssignee", fields: [assignedToId], references: [id])
  categoryId          Int
  category            Category        @relation(fields: [categoryId], references: [id])
  relatedSystemId     Int
  relatedSystem       RelatedSystem   @relation(fields: [relatedSystemId], references: [id])
  summary             String
  description         String
  requestedPriority   String?
  itPriority          String?
  currentStatus       String          @default("New")
  isRequesterResolved Boolean         @default(false)
  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @updatedAt
  attachments         Attachment[]
  publicComments      PublicComment[]
  internalNotes       InternalNote[]

  @@index([requesterId, currentStatus])
  @@index([assignedToId, currentStatus])
  @@index([itPriority])
  @@index([createdAt])
}

model PublicComment {
  id        Int      @id @default(autoincrement())
  ticketId  Int
  ticket    Ticket   @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  authorId  Int
  author    User     @relation(fields: [authorId], references: [id])
  content   String
  createdAt DateTime @default(now())

  @@index([ticketId, createdAt])
}

model InternalNote {
  id        Int      @id @default(autoincrement())
  ticketId  Int
  ticket    Ticket   @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  authorId  Int
  author    User     @relation(fields: [authorId], references: [id])
  content   String
  createdAt DateTime @default(now())

  @@index([ticketId, createdAt])
}
```

### Data Migration Strategy
- Lab 2 `Requester` table data will be migrated into `User` records with `role = REQUESTER`, setting `passwordHash` to a default hashed initial password (`Password123!`) and `mustChangePassword = true`.
- Existing `Ticket.requesterId` foreign keys will be linked directly to migrated `User.id` primary keys.
- `itPriority` values for existing tickets will be backfilled from `requestedPriority` (or defaulted to `Medium`).

### Seed Decisions
Seed script (`server/prisma/seed.ts`) will generate:
- **Requesters**: 4 active (`requester1@toktickit.local` through `requester4@toktickit.local`), 1 inactive. Initial password: `Password123!`.
- **IT Staff**: 3 active (`staff1@toktickit.local`, `staff2@toktickit.local`, `staff3@toktickit.local`), 1 inactive. Initial password: `Password123!`.
- **Administrator**: 1 active (`admin@toktickit.local`). Initial password: `AdminPassword123!`.
- **Tickets**: 10+ tickets in various statuses (`New`, `Open`, `In Progress`, `Waiting for Requester`, `Resolved`, `Closed`), assigned and unassigned, with sample public comments and internal notes.

---

## 8. API Contract Summary
Complete REST endpoints, HTTP methods, payload schemas, and status codes are documented in [api-spec.md](file:///c:/Users/pakat/Projects/School/CPE334/toktickit/toktickit/toktickit/docs/lab-03/api-spec.md).

Primary API Routes:
- `POST /api/auth/login`: Authenticates credentials, returns session cookie + user object.
- `POST /api/auth/logout`: Clears session cookie.
- `GET /api/auth/me`: Returns current user info.
- `POST /api/auth/change-password`: Updates password, sets `mustChangePassword = false`.
- `GET /api/tickets/staff-queue`: Queue list for IT Staff/Admin with search, filter, sort, pagination.
- `PATCH /api/tickets/:id/claim`: Claims ticket ownership for current IT Staff user.
- `PATCH /api/tickets/:id/assign`: Assigns ticket to specified IT Staff user.
- `PATCH /api/tickets/:id/priority`: Updates `itPriority`.
- `PATCH /api/tickets/:id/status`: Updates `currentStatus` per transition rules.
- `GET /api/tickets/:id/comments` & `POST /api/tickets/:id/comments`: Public comments API.
- `GET /api/tickets/:id/notes` & `POST /api/tickets/:id/notes`: Internal notes API (IT Staff/Admin only).
- `GET /api/users`: Returns user list for Admin.
- `POST /api/users`: Creates user account.
- `PATCH /api/users/:id`: Updates user basic info and active status.
- `POST /api/users/:id/reset-password`: Resets user initial password.

---

## 9. Acceptance Criteria

- **AC-01**: Given an active user with valid credentials, when the user logs in, then the backend establishes authenticated access and returns the user identity and role.
- **AC-02**: Given a user with `mustChangePassword = true`, when login succeeds, then normal application screens remain unavailable until a valid new password is saved.
- **AC-03**: Given an inactive user (`isActive = false`), when attempting login with valid credentials, then login is rejected with an invalid credentials message.
- **AC-04**: Given an authenticated Requester, when accessing ticket endpoints, then only tickets owned by the Requester's authenticated ID are accessible.
- **AC-05**: Given an authenticated Requester, when requesting Internal Notes for a ticket, then the backend rejects the request with HTTP `403 Forbidden`.
- **AC-06**: Given an IT Staff user, when viewing the Ticket Queue, then all system tickets are visible with search, status/priority/assignment filtering, sorting, and pagination.
- **AC-07**: Given an IT Staff user, when claiming an unassigned ticket, then `assignedToId` is updated to the IT Staff user's ID.
- **AC-08**: Given an IT Staff user, when attempting an invalid status transition (e.g. `New` -> `Closed`), then the backend rejects the change with HTTP `400 Bad Request`.
- **AC-09**: Given a Requester, when indicating a problem appears resolved, then `isRequesterResolved` becomes `true` without altering `currentStatus`.
- **AC-10**: Given an Administrator, when viewing User Management, then all user accounts are displayed with search by name/email and role filter.
- **AC-11**: Given an Administrator, when creating a user with an existing email, then the request fails with HTTP `409 Conflict`.
- **AC-12**: Given an Administrator, when attempting to deactivate their own account, then the request fails with HTTP `400 Bad Request`.
- **AC-13**: Given an Administrator, when attempting to deactivate the single active Administrator, then the request fails with HTTP `400 Bad Request`.
- **AC-14**: Given a non-Administrator user, when requesting `/api/users`, then the request returns HTTP `403 Forbidden`.

---

## 10. Product Definition of Done

- [x] All code for authentication, mandatory password change, IT Staff queue, IT Staff ticket detail, public comments, internal notes, and user management is implemented.
- [x] Database schema is updated and migrated; seed data is idempotent and fully populated.
- [x] All unit tests, API integration tests, UI tests, and Playwright E2E tests pass cleanly.
- [x] Direct API authorization tests verify server-side security on every protected route.
- [x] Responsive design verified on desktop (1440px), tablet (768px), and mobile (375px) viewports using Zen Green theme tokens.
- [x] Engineering contract docs (`specification.md`, `ui-spec.md`, `api-spec.md`, `tests.md`, `reviewer.md`, `ai-use.md`) are complete and consistent.

---

## 11. Assumptions and Decisions

1. **Session Mechanism**: Use express session / HTTP-only cookie with secure token for session tracking, preventing token theft via XSS.
2. **Password Hashing**: `bcryptjs` algorithm with 10 salt rounds used for all stored passwords.
3. **Role Independence**: Administrator and IT Staff responsibilities are strictly separated in UI navigation, but Administrators possess supervisory authorization to access IT Staff ticket operations when needed.
4. **Lab 2 Selector Removal**: The top bar `Development Requester` dropdown is completely removed and replaced by the authenticated user's name, role badge, and profile menu.
