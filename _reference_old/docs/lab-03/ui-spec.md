# TokTickIT - UI Specification (Lab 3)
## Users, Roles, IT Staff Ticketing, and Admin Screens (Zen Green Design System)

---

## 1. Design System Tokens & Foundations (Zen Green)

Lab 3 fully adheres to and extends the **Zen Green** design language introduced in Lab 2. All color tokens, typography scales, card layouts, form fields, badges, and responsive rules are preserved and reused.

### Color Palette Tokens
- **Primary Brand / Action**: `#15803D` (Emerald-700 / Zen Primary Green)
- **Primary Hover / Active**: `#166534` (Emerald-800)
- **Primary Light / Background Accent**: `#F0FDF4` (Emerald-50)
- **Primary Border / Divider**: `#DCFCE7` (Emerald-100) / `#BBF7D0` (Emerald-200)
- **Secondary / Neutral Muted**: `#475569` (Slate-600)
- **Dark Text / Surface**: `#0F172A` (Slate-900)
- **Card Background**: `#FFFFFF`
- **Page Canvas**: `#F8FAFC` (Slate-50)

### Status & Role Badge Tokens
- **Status Badges**:
  - `New`: Blue (`bg-blue-50 text-blue-700 border-blue-200`)
  - `Open`: Emerald Green (`bg-emerald-50 text-emerald-700 border-emerald-200`)
  - `In Progress`: Amber (`bg-amber-50 text-amber-700 border-amber-200`)
  - `Waiting for Requester`: Purple (`bg-purple-50 text-purple-700 border-purple-200`)
  - `Pending Verification`: Cyan/Emerald (`bg-emerald-50 text-emerald-800 border-emerald-300 font-medium`)
  - `Resolved`: Teal (`bg-teal-50 text-teal-700 border-teal-200`)
  - `Closed`: Gray (`bg-slate-100 text-slate-700 border-slate-300`)
  - `Reopened`: Orange (`bg-orange-50 text-orange-700 border-orange-200`)
  - `Cancelled`: Red (`bg-red-50 text-red-700 border-red-200`)
- **Priority Badges**:
  - `Urgent`: Crimson Red (`bg-rose-100 text-rose-800 border-rose-300 font-semibold`)
  - `High`: Amber Red (`bg-amber-100 text-amber-800 border-amber-300`)
  - `Medium`: Blue (`bg-sky-100 text-sky-800 border-sky-300`)
  - `Low`: Slate (`bg-slate-100 text-slate-700 border-slate-300`)
- **Role Badges**:
  - `Requester`: Slate Tag (`bg-slate-100 text-slate-700`)
  - `IT Staff`: Zen Green Tag (`bg-emerald-100 text-emerald-800 font-medium`)
  - `Administrator`: Indigo Tag (`bg-indigo-100 text-indigo-800 font-semibold`)

---

## 2. Main Navigation Shell Extensions

In Lab 3, the top navigation header replaces the Lab 2 `Development Requester` selector with real authenticated session controls.

### Top Bar Elements
1. **Brand Logo**: TokTickIT logo with Zen Green accent.
2. **Role-Based Navigation Tabs**:
   - `Requester`: "My Tickets", "Create Ticket"
   - `IT Staff`: "Ticket Queue", "My Assigned Tickets"
   - `Administrator`: "User Management", "Ticket Queue"
3. **Authenticated User Profile & Logout Dropdown**:
   - Displays User's Name and Role Badge (e.g. `Jane Staff [IT Staff]`).
   - Dropdown Menu Options:
     - `Change Password` (opens password update modal)
     - `Sign Out` (executes logout API and redirects to `/login`)

---

## 3. Screen Specifications

### Screen 1: Login Screen (`/login`)
- **Layout**: Centered card overlay on subtle slate gradient canvas.
- **Card Elements**:
  - Header: TokTickIT logo and title "Sign in to your account".
  - Form Fields:
    - `Email Address` (text input with email validation)
    - `Password` (password input with show/hide toggle)
  - Action Button: "Sign In" (Primary Zen Green button).
  - Feedback Area: Alert banner showing invalid credentials or account deactivation messages.

### Screen 2: Mandatory Password Change Screen (`/change-password`)
- **Layout**: Centered modal card blocking main app shell access when `mustChangePassword = true`.
- **Card Elements**:
  - Banner Alert: "Password Change Required: Your account was assigned an initial password. Please set a secure new password before continuing."
  - Form Fields:
    - `Current Password`
    - `New Password` (with live password strength / rule checklist: 8+ chars, uppercase, lowercase, digit)
    - `Confirm New Password`
  - Action Button: "Save New Password" (Disabled until rules pass).

### Screen 3: IT Staff Ticket Queue (`/staff/queue`)
- **Layout**: Header summary row + Filter/Search control bar + Data-dense queue table + Pagination footer.
- **Queue Controls**:
  - `Search Box`: Search input filtering by Ticket Number, Summary, or Requester Name.
  - `Status Filter`: Dropdown selector (`All Statuses`, `New`, `Open`, `In Progress`, `Waiting for Requester`, `Resolved`, `Closed`).
  - `IT Priority Filter`: Dropdown selector (`All Priorities`, `Urgent`, `High`, `Medium`, `Low`).
  - `Assignment Filter`: Toggle buttons (`All Tickets`, `Unassigned`, `Assigned to Me`).
- **Table Columns**:
  1. `Ticket #` (linked to Detail view)
  2. `Requester` (Name & Email)
  3. `Summary` & Category
  4. `IT Priority` (Badge)
  5. `Status` (Badge)
  6. `Assigned To` (User name or `[Unassigned]`)
  7. `Created` (Relative timestamp)
  8. `Actions` ("View / Claim" button)

### Screen 4: IT Staff Ticket Detail (`/staff/tickets/:id`)
- **Layout**: Dual-column layout.
  - **Left Main Column**:
    - Ticket Summary & Description card.
    - Requester information block.
    - Attachments list (Download, preview metadata).
    - Tabbed Activity Feed:
      - **Public Comments Tab**: Chronological feed of public comments + comment posting box.
      - **Internal Notes Tab**: Confidentially styled (yellow tint card) feed of operational internal notes + note posting box.
  - **Right Control Sidebar**:
    - **Ownership Card**: Shows current assignee. Contains "Claim Ticket" button or "Reassign Ownership" dropdown.
    - **IT Priority Card**: Dropdown selector to change IT Priority immediately.
    - **Status Transition Card**: Dropdown selector and action button to perform valid status transitions based on the transition matrix.
    - **Requester Resolution Request Panel**:
      - For Requesters: "Mark as Resolved" button. Clicking opens a confirmation popup modal (*"Are you sure you want to mark this problem as resolved?"*). Once confirmed, ticket moves to `Pending Verification` status and button becomes disabled/greyed-out showing `"Resolution Requested ✓"`.
      - For IT Staff: Shows `"Pending Verification"` badge. IT Staff can confirm resolution (`Resolved` / `Closed`) or click "Revert to In Progress" if deemed unsolved.

### Screen 5: Administrator User Management (`/admin/users`)
- **Layout**: Header with "Create User" primary button + Search & Role filter bar + User Table.
- **Controls**:
  - `Search Input`: Filter by Name or Email.
  - `Role Filter`: Select dropdown (`All Roles`, `Requester`, `IT Staff`, `Administrator`).
  - `Create User Button`: Opens Create User Modal.
- **User Table Columns**:
  1. `User Name`
  2. `Email`
  3. `Role` (Role Badge)
  4. `Status` (`Active` green pill / `Inactive` gray pill)
  5. `Initial Pass Required` (`Yes` warning badge / `No`)
  6. `Actions`: "Edit Account" button & "Set Password" button.
- **Create / Edit User Modal**:
  - Fields: Name, Email, Role (Single select dropdown), Active Checkbox (for Edit mode).
  - For Create: Initial Password field.
- **Set Initial Password Modal**:
  - Fields: User Email (read-only), New Initial Password field, "Force Password Change on Next Login" checkbox (checked & disabled by default).

---

## 4. Responsive Rules & Breakpoints

- **Desktop (>= 1024px)**: Full dual-column Ticket Detail layout, full 8-column Queue table, sidebar filters.
- **Tablet (768px - 1023px)**: Single-column stacked Ticket Detail layout, responsive scrollable table, collapse search bar controls.
- **Mobile (< 768px)**: Stacked cards instead of tables for queue and user list, sticky bottom modal action drawers.
