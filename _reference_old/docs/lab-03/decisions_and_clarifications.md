# Lab 3 Specification Decisions & Clarifications Sheet

This document highlights the key design decisions, default choices, and optional configuration points for Lab 3. Please review the defaults below. If you wish to adjust any of these choices before implementation begins, you can specify your preferences.

---

## 1. Decisions Answered with Standard Baseline Defaults (Extremely Obvious / Standard Choices)

### 1.1 Password Hashing & Password Complexity
- **Choice**: `bcryptjs` with 10 salt rounds.
- **Rule**: Password must be at least 8 characters, containing >= 1 uppercase letter, >= 1 lowercase letter, and >= 1 numerical digit.
- **Initial Passwords for Seed Users**:
  - Requesters & IT Staff: `Password123!` (with `mustChangePassword = true` on initial login)
  - Administrator: `AdminPassword123!` (with `mustChangePassword = false` for instant testing, or `true` if tested)

### 1.2 Data Migration from Lab 2
- **Choice**: Existing Lab 2 `Requester` entries are migrated into the new `User` model with `role = REQUESTER`.
- **Foreign Key Binding**: `Ticket.requesterId` maps directly to `User.id`. `Ticket.assignedToId` is added as an optional foreign key referencing `User.id` for IT Staff assignment.

### 1.3 Permitted Ticket Status Transition State Machine
- **State Flow**:
  - `New` ➔ `Open`, `In Progress`, `Cancelled`
  - `Open` ➔ `In Progress`, `Waiting for Requester`, `Resolved`, `Cancelled`
  - `In Progress` ➔ `Waiting for Requester`, `Resolved`, `Cancelled`
  - `Waiting for Requester` ➔ `In Progress`, `Resolved`, `Cancelled`
  - `Resolved` ➔ `Closed`, `Reopened`
  - `Closed` ➔ `Reopened`
  - `Reopened` ➔ `In Progress`, `Resolved`, `Cancelled`
  - `Cancelled` ➔ Terminal (no further transitions)

### 1.4 Comments & Notes Visibility
- **Public Comments**: Append-only; visible to Ticket Owner (Requester), IT Staff, and Administrators.
- **Internal Notes**: Append-only; visible ONLY to IT Staff and Administrators. Attempts by Requesters to fetch or post internal notes return `403 Forbidden`.

### 1.5 Administrator Safety Rules
- Admin cannot deactivate their own active account (`isActive = false` rejected).
- Deactivating or changing the role of the last active Administrator is strictly blocked.
- Account deactivation is used; hard deletion of user records is prohibited.

---

## 2. Options for User Review / Confirmation

Please confirm if you are happy with these default choices or if you prefer an alternative:

1. **Authentication Session Storage**:
   - **Default (Recommended)**: Cookie-based HTTP-only session token (`express-session` or signed session cookie).
   - **Alternative**: JWT stored in HTTP-only cookie.
2. **Administrator Navigation Access**:
   - **Default (Recommended)**: Administrators have access to User Management in the nav bar, but also have access to the Ticket Queue tab if they need to view/manage tickets.
   - **Alternative**: Administrators are strictly restricted to the User Management screen only.
3. **Requester Resolution Indication UI & Status Workflow**:
   - **User-Friendly Indicator**: When a user marks a problem as resolved, display a clean, user-friendly badge: `"Pending Resolution Verification"` (or `"User Marked Resolved"`).
   - **Confirmation Popup**: When the Requester clicks "Mark as Resolved", a confirmation dialog pops up asking: *"Are you sure you want to mark this problem as resolved?"* with "Confirm" and "Cancel" buttons.
   - **Disabled Button State**: Once confirmed, the request is sent, and the button becomes disabled/greyed out showing `"Resolution Requested ✓"` to clearly indicate it has already been submitted.
   - **Unique Status (`Pending Verification`)**: The ticket status transitions to `Pending Verification` (or `Resolved (Pending Review)`).
   - **IT Staff Revert Option**: IT Staff viewing the ticket can either formally confirm and transition status to `Resolved` / `Closed`, or revert the process back to `In Progress` (or `Open`) if they deem the problem is not fully solved, resetting the resolution request state.

---

## 3. Implemented Feature Refinements & User Feedback Decisions (Sprint 3)

### 3.1 IT Staff Queue Layout & Pagination Consistency (Feature 7)
- **Permanent "Clear Filters" Button**:
  - The "Clear All Filters" button is permanently positioned on the filter toolbar and rendered as greyed out (disabled) when no active filters or custom sorting are set. This prevents horizontal and vertical layout jumps when filters are enabled or cleared.
- **Header Sorting & Table Column Layout Stability**:
  - Fixed-width and flex-basis bounds are enforced on table columns (Status, IT Priority, Assignee, Related System) so header sorting buttons and variable-length text strings (e.g., 3-letter vs 2-word statuses) do not cause table shift.
- **Single-Line Pagination Footer**:
  - The "Per page:" dropdown selector, total item counter, and page navigation controls are rendered inline inside a single flex row container (`display: flex; flex-direction: row; align-items: center`) to prevent multi-line wrapping on standard screen resolutions.
- **Initial Password Change Exemption for IT Staff / Admins**:
  - Test and seed accounts for IT Staff and Administrators are initialized with `mustChangePassword: false` (or exempted upon initial setup) to ensure smooth role testing and operational flow without forcing password resets during development evaluations.

### 3.2 Staff Ticket Detail & Role-Based UI Scoping (Feature 8)
- **Assignee Dropdown Filtering**:
  - The Assignee select dropdown on the ticket detail page is strictly filtered to active users with the `IT_STAFF` role (`role = IT_STAFF`, `isActive = true`).
  - Customer/Requester accounts, Administrator accounts, and inactive staff members are omitted from assignment options.
  - Requesters cannot assign staff or access assignment controls.
- **Claim & Re-claim Ticket Action**:
  - Clicking "Claim Ticket" or reassigning a ticket directly reassigns `assignedToId` to the logged-in IT Staff user. If already assigned to another staff member, re-claiming updates assignment back to the current user cleanly.
- **Human-Readable Role Badges**:
  - Raw internal role strings (e.g. `(IT_STAFF)`, `(REQUESTER)`, `(ADMINISTRATOR)`) in the top navigation bar and comment/note author metadata are replaced with styled pill badges (`IT Staff`, `Admin`, `Requester`).
- **Toast Notifications Position**:
  - All application toast notifications are positioned at the bottom-right corner of the viewport (`bottom: 24px; right: 24px; z-index: 1200`) to prevent obstructing user profile details, role badges, and the Sign Out button in the top navigation bar.
- **Staff & Admin Route Scoping & Auto-Redirection**:
  - "My Tickets" and "Create Ticket" navigation links are hidden for `IT_STAFF` and `ADMINISTRATOR` roles in `AppShell`.
  - Direct URL access by IT Staff or Admin to requester routes (`/tickets` or `/tickets/new`) automatically redirects the user to `/staff/queue`.

