# TokTickIT - UI Specification (Lab 2)
## Requester Ticketing MVP with Zen Green UI Foundation

---

## 1. Design System & Tokens

The application strictly adheres to the required **Zen Green** visual design system.

### 1.1 Color Tokens & Element Required Styles

| Token / Element | Required Style / Value | Usage & Application |
|---|---|---|
| **Primary green** | `#006B3C` | App header, primary actions, and strong emphasis |
| **Secondary green** | `#0B7A46` | Active tabs, focus accents, links, and hover states |
| **Pale green** | `#EAF6EF` | Selected, success, and subtle section emphasis |
| **Page background** | `#F5F7F6` | Main application background (quiet near-white) |
| **Surface / cards** | White (`#FFFFFF`) | Cards and panels with subtle border (`#E2E8F0`) and restrained shadow |
| **Text** | Dark charcoal-green (`#1A2E22`) | Primary body and headings, not pure black, for comfortable reading |
| **Editable field** | White background (`#FFFFFF`) | Clear neutral border (`#CBD5E0`), standard interactive inputs |
| **Read-only field** | Soft gray-green (`#F0F4F1`) | Shading that is clearly distinct from editable fields but still readable |
| **Error** | Dark red (`#C53030`) | Dark red text and border; message appears immediately below the field |
| **Warning** | Amber (`#D69E2E`) | Amber callout or badge; not used as ordinary decoration |
| **Success** | Green confirmation (`#006B3C` / `#EAF6EF`) | Readable text with checkmark/icon; no reliance on color alone |
| **Urgent Red (Bg/Border)** | `#FFF5F5` / `#FEB2B2` | Urgent priority badge background and border |
| **Info / Blue** | `#3182CE` | Informational callouts and tooltips |

### 1.2 Typography & Spacing
- **Font Family**: Clean sans-serif font (`Inter, Roboto, system-ui, -apple-system, sans-serif`).
- **Headings**: `h1` (24px, bold), `h2` (20px, semibold), `h3` (16px, semibold) in `Dark charcoal-green`.
- **Body & Inputs**: 14px regular; Helper & Caption: 12px regular.
- **Spacing Scale**: Consistent scale based primarily around 8px increments (`8px`, `16px`, `24px`, `32px`, `48px`).
- **Border Radius**: `6px` for form controls/badges, `8px` for cards/panels, `12px` for modals.
- **Non-Color Indicators**: All status, priority, validation, success, and error feedback must include text labels or icons without relying on color alone.

---

## 2. Component Rules

All reusable UI components throughout the application strictly enforce the following rules:

1. **Control Labels**:
   - Labels always appear **above** controls and use consistent font weight (semibold) and spacing (4px–8px above input).
2. **Required Fields**:
   - Required fields display a visible red asterisk (`*` in `#C53030`). The asterisk indicates requiredness but does not replace field-level validation messages.
3. **Input Heights & Textarea Behavior**:
   - Single-line inputs (text inputs, selects) use one consistent height (`40px`–`44px`).
   - Multiline Description textarea is taller (`min-height: 120px`) and vertically resizable only where it does not break the layout.
4. **Button Hierarchy & Labels**:
   - Buttons include visible, self-explanatory text. Icons may support but must never replace unclear text.
   - Hierarchy: Primary Green (`#006B3C`), Secondary Green (`#0B7A46`), and Destructive Red (`#C53030`).
5. **Accessible Icon-Only Controls**:
   - Every icon-only control (such as remove `✕`, sort indicators, download icons) requires an accessible `aria-label` and visible browser tooltip (`title`).
6. **Disabled State Presentation**:
   - Disabled controls must be visually distinct (muted background `#E2E8F0`, muted text `#A0AEC0`, `cursor: not-allowed`) and cannot be activated or focused.
7. **Keyboard Focus Indicators**:
   - Visible Zen Green focus outlines (`2px solid #0B7A46`, `outline-offset: 2px`) must remain visible for keyboard users across all interactive controls.
8. **Submit Busy States**:
   - The Submit button shows a busy spinner/text and is disabled while a request is being processed to prevent duplicate submissions.
9. **Validation Message Placement**:
   - Validation error messages appear **immediately below the associated field**, highlighted in dark red (`#C53030`), rather than only in a generic top-of-page alert box.
10. **Success State Communication**:
    - The success state clearly displays the official generated Ticket Number and the next available action (e.g. view ticket or return to list).

---

## 3. Ambiguity Clarifications & Resolved Interaction Rules

### 3.1. Cold Start & Requester Selection UX (`FR-01`, `BR-04`, `BR-08`)
- **Initial Cold-Start Prompt**:
  - When no requester is selected on initial launch, the user is presented with the dedicated **Development Requester Selection Screen** (Screen 0) with the explicit explanatory text:
    > *"Select a Development Requester to test requester-specific ticket behavior. This is not a login screen. Authentication and role-based access will be introduced in Lab 3."*
- **Requester Switch Protection (Dirty Form Warning)**:
  - If the user switches the active requester while editing an unsaved ticket creation form, the UI displays a **Confirmation Modal**:
    - Message: *"Switching requester will discard your unsaved ticket draft. Do you want to continue?"*
    - Actions: `Cancel` (reverts selector) | `Discard & Switch` (abandons draft and switches context).

### 3.2. Post-Creation Navigation & Success Feedback (`FR-13`)
- **Submission Action**:
  - Upon successful ticket submission, the system **redirects immediately to the Ticket Detail view** (`/tickets/:id` or `/tickets/:ticketNumber`).
  - A floating **Zen Green Success Toast** appears at the top-right corner:
    - *"Ticket #<TICKET_NUMBER> created successfully."*
    - Auto-dismisses after 5 seconds or on close click.

### 3.3. Attachment Management & Lifecycle UX (`FR-25` - `FR-30`, `BR-26` - `BR-30`)
- **Staging During Creation (Pre-Upload)**:
  - Staged file list shows a live attachment counter: `Attachments (X / 5)`.
  - Client-side validation runs immediately upon file selection:
    - Rejects files exceeding **5 MB**.
    - Rejects disallowed file formats (only `JPG/JPEG`, `PNG`, `WEBP`, `PDF` allowed).
    - Prevents attaching more than **5 files** total.
    - Displays an inline red error message explaining any rejected file.
  - **Removal in Staging Area**: Clicking the remove (`✕`) button on a staged file immediately removes it from local form memory **without requiring a confirmation dialog** (since the file has not yet been uploaded to the server).
- **Removal on Ticket Detail View (Soft-Delete on Server)**:
  - On the Ticket Detail view, active attachments are already persisted in the database.
  - When the user clicks the `Delete / Remove` action for an existing attachment, a **Confirmation Modal** is required:
    - Message: *"Are you sure you want to remove attachment '<filename>'?"*
    - Actions: `Cancel` | `Remove Attachment`.
  - Upon confirmation, the backend performs a **Soft-Delete** (`isDeleted = true`). The attachment is immediately hidden from user views and cannot be downloaded.

### 3.4. Search, Filter, & Table Header Sorting Interaction (`FR-17` - `FR-20`, `BR-23`, `BR-24`)
- **Interactive Clickable Table Headers**:
  - Sortable column headers (`Requested Priority`, `Current Status`) are clickable buttons with sort indicator icons (`↕`, `▲`, `▼`).
  - **3-State Cycling**: Clicking a header cycles through:
    1. `Not Applied` (default)
    2. `Sorted (Ascending / Ranked)` (header background darkens with active indicator)
    3. `Reverse Sorted (Descending / Reverse Ranked)`
    4. `Not Applied` (returns to default)
  - **Single Column Precedence**: Clicking a different sortable column immediately resets the previous active column sort back to `Not Applied`.
- **Explicit Sort Order & Ranking Rules (`BR-23`, `BR-24`)**:
  - **When sorting by Requested Priority (`sortBy=priority`)**:
    - **Ascending / Ranked (`sortDirection=asc`)**: `Urgent` $\rightarrow$ `High` $\rightarrow$ `Medium` $\rightarrow$ `Low` $\rightarrow$ `Unassigned / None`.
    - **Descending / Reverse (`sortDirection=desc`)**: `Unassigned / None` $\rightarrow$ `Low` $\rightarrow$ `Medium` $\rightarrow$ `High` $\rightarrow$ `Urgent`.
    - **Cascade**: Primary = `Requested Priority` $\rightarrow$ Secondary = `Current Status` $\rightarrow$ Tertiary = `Ticket Number`.
  - **When sorting by Current Status (`sortBy=status`)**:
    - **Ascending (`sortDirection=asc`)**: `New` $\rightarrow$ `In Progress` $\rightarrow$ `Resolved` $\rightarrow$ `Closed`.
    - **Descending (`sortDirection=desc`)**: `Closed` $\rightarrow$ `Resolved` $\rightarrow$ `In Progress` $\rightarrow$ `New`.
    - **Cascade**: Primary = `Current Status` $\rightarrow$ Secondary = `Requested Priority` $\rightarrow$ Tertiary = `Ticket Number`.
- **Search & Filter Flow**:
  - Keyword search input filters dynamically across Ticket Number, Summary, and Description.
  - Dropdown filters for `Current Status`, `Requested Priority`, `Category`, and `Related System`.
  - Applying any filter or search query automatically resets pagination to **Page 1**.

### 3.5. Rate Limiting (HTTP 429) & Form Validation Constraints (`BR-12`, `BR-18`, `BR-19`)
- **Submit Cooldown**:
  - Upon submitting a ticket, the "Submit Ticket" button immediately enters a **Disabled State with a 15-Second Cooldown** (showing a countdown or spinner).
  - If a duplicate submission request reaches the backend within the 15-second window resulting in an HTTP `429 Too Many Requests`, an error alert banner is displayed: *"You are submitting tickets too quickly. Please wait a few moments and try again."*
- **Minimum Description Length Validation (BR-12)**:
  - Description must be at least 20 characters.
  - On submit (or when blurred with insufficient length), the textarea border turns **Red (`#C53030`)** and displays small red helper text immediately below the field: *"Description must be at least 20 characters."*

### 3.6. Zen Green Badges & Status Indicators
- **Status Badges**:
  - `New`: Pale green background (`#EAF6EF`), Dark green text (`#006B3C`), Green border (`#A3D9BC`).
- **Priority Badges**:
  - `Urgent`: Pale red background (`#FFF5F5`), Dark red text (`#C53030`), Red border (`#FEB2B2`).
  - `High`: Amber/orange background (`#FFFAF0`), Dark amber text (`#DD6B20`), Amber border (`#FBD38D`).
  - `Medium`: Soft blue/yellow background (`#EBF8FF`), Navy/slate text (`#2B6CB0`), Blue border (`#BEE3F8`).
  - `Low`: Neutral light gray (`#EDF2F7`), Dark gray text (`#4A5568`), Gray border (`#E2E8F0`).
  - `None / Optional`: Muted slate italic text or neutral tag.

---

## 4. Screen Specifications

### 4.1. Screen 0: Development Requester Selection Screen (`/` or Entry Modal)

When no Requester is selected, or when the user invokes the "Change Requester" action from the shell:

1. **Layout & Elements**:
   - **Application Title**: "TokTickIT" brand heading in Zen Green.
   - **Explanatory Callout Card**:
     > *"Select a Development Requester to test requester-specific ticket behavior. This is not a login screen. Authentication and role-based access will be introduced in Lab 3."*
   - **Development Requester Dropdown**:
     - Populated dynamically with active Requesters from PostgreSQL (`GET /api/requesters`).
     - Excludes inactive Requesters (`AC-04`, `BR-04`).
     - Form control with accessible `<label>` above and visible focus indicator.
   - **Continue Button**:
     - Primary Green action button (`#006B3C`).
     - Activates the selected Requester testing context and navigates to the My Tickets view.
     - Disabled if no active Requester is selected.
2. **Screen States**:
   - **Loading State**: Displays a Zen Green loading spinner/skeleton while `/api/requesters` is fetching (`AC-49`).
   - **Empty State**: Rendered if no active Requesters exist in the database, with a clear message preventing continuation (`AC-02`).
   - **Safe API-Failure State**: Rendered if the API call fails, showing user-safe error feedback without internal server details (`AC-03`).

---

### 4.2. Screen 1: My Tickets View (`/tickets`)

1. **Header & Context Bar**:
   - Page title: *"My Tickets"*.
   - Action button: `+ Create Ticket` (Primary Green).
2. **Search & Filter Panel**:
   - Keyword search bar with search icon and clear input button.
   - Filter dropdowns: Category, Related System, Status, Priority.
   - `Clear Filters` button (visible when filters are active).
3. **Tickets Data Presentation**:
   - **Desktop Table ($\ge 992\text{ px}$)**:
     - Columns: `Ticket Number`, `Summary`, `Category`, `Related System`, `Priority` (Sortable), `Status` (Sortable), `Created Date`.
     - Hover state on rows with pointer cursor to open Ticket Detail.
     - Active sorted header darkened with sort arrow (`▲` for ascending/ranked, `▼` for descending/reverse).
   - **Mobile Card View ($< 768\text{ px}$)**:
     - Responsive ticket cards displaying Ticket Number, Status badge, Priority badge, Category, Summary, and Created Date.
4. **Pagination Bar**:
   - Showing `X - Y of Z tickets`.
   - Page size selector: `10`, `25`, `50` per page.
   - Previous / Next navigation buttons.
5. **View States**:
   - **No Requester Selected**: Directs user to the Selection Screen.
   - **Loading State**: Zen Green skeleton rows or spinner.
   - **Empty List State**: *"You haven't submitted any tickets yet. Click '+ Create Ticket' to get started."*
   - **No Results State**: *"No tickets matched your search criteria. Try clearing your filters."* with `Clear Filters` button.
   - **Failure State**: Safe error banner if API fails (`AC-28`).

---

### 4.3. Screen 2: Create Ticket View (`/tickets/new`)

1. **Layout Structure**:
   - **Top (System / Read-Only Context)**:
     - Requester Name and Initial Status (`New`) displayed with soft gray-green background shading (`#F0F4F1`) and clear labels.
   - **Classification Section (Grouped)**:
     - **Category** `*`: Dropdown populated from reference data.
     - **Related System** `*`: Dropdown populated from reference data.
     - **Requested Priority** (Optional): Dropdown (`Urgent`, `High`, `Medium`, `Low`, `None`).
   - **Content Section (Full Width)**:
     - **Summary (Title)** `*`: Text input (max 255 chars).
     - **Description** `*`: Multi-line textarea (required, non-empty text). Displays red border (`#C53030`) and inline error text immediately below when blank on submit. Does NOT display a character counter or 20-char minimum text indicator.
   - **Attachment Staging Area (Below Main Fields)**:
     - Drag-and-drop zone with file picker button.
     - Live counter: `Attachments (X / 5)`.
     - List of staged files with file name, file size (MB), and a remove button (`✕`).
     - Clicking `✕` instantly removes the file from local staging without confirmation dialog.
     - Inline error display for invalid file types or oversized files (> 5MB).
   - **Bottom Actions**:
     - `Cancel` button (Secondary action, returns to My Tickets).
     - `Submit Ticket` button (Primary Green, enters busy/disabled state during submission and enforces 15s cooldown).

---

### 4.4. Screen 3: Ticket Detail View (`/tickets/:id`)

1. **Header Area**:
   - Ticket Number (e.g. `TICK-2026-0001`) with Status Badge (`New`) and Priority Badge.
   - `← Back to My Tickets` navigation link.
2. **Ticket Information (Read-Only)**:
   - Summary, Category, Related System, Created At timestamp, Requester Name presented with read-only styling (`#F0F4F1`).
   - Full Description formatted with preserved line breaks.
   - *Note*: Explicitly excludes Public Comments, Internal Notes, and IT workflow controls.
3. **Attachment Section**:
   - Distinct section separated from ticket information.
   - Title: `Attachments (X / 5 active)`.
   - **Active Attachments**:
     - File icon (image / PDF icon).
     - **File Metadata Name**: Clickable text link/button that opens the **Inline Attachment Preview Modal** rendering image/PDF preview.
     - File size (formatted KB/MB) and upload date.
     - `Download` button (Primary/Secondary Green, downloads stored binary).
     - `Delete / Remove` button (soft-delete, opens **Removal Reason Modal** requiring non-empty reason text before confirming).
   - **Removal Reason Modal**:
     - Modal dialog requesting: *"Please provide a reason for removing this attachment"*.
     - Text input / textarea for removal reason. Confirm button disabled while input is blank (min 1 char required).
   - **Soft-Removed Attachments**:
     - Positioned at the **bottom of the attachment list**.
     - Rendered in **greyed-out text** (`color: var(--color-text-muted)` / `#A0AEC0`) with an **"X" cross icon** (`❌` / `✕`) next to the filename metadata.
     - Displays removal reason (`Reason: "[reason]"`) and deletion timestamp.
     - Download and preview actions are disabled.
   - `+ Add Attachment` button (disabled if 5 active attachments exist).
4. **Access Control (403 Forbidden State)**:
   - If attempting to view a ticket belonging to another requester, render a dedicated **403 Forbidden Card**: *"Access Denied: You do not have permission to view this ticket."* with a button to return to My Tickets.

---

## 5. Responsive Requirements

| Viewport | Range | Required Layout & Behavior |
|---|---|---|
| **Desktop** | $\ge 992\text{ px}$ | Multi-column layout as specified; content centered with a sensible maximum width (`max-width: 1200px`). |
| **Tablet** | $768 - 991\text{ px}$ | Two-column layout where practical; Summary and Description receive sufficient width. |
| **Mobile** | $< 768\text{ px}$ | Fields stack vertically; buttons remain touch-friendly; no horizontal page scrolling. |
| **All sizes** | All | No clipped labels, overlapping messages, hidden buttons, or unreadable attachment names. |

---

## 6. UI Style Checking & Visual Verification

Automated tests and visual inspections must verify the following:

1. **Automated Style Assertions**:
   - CSS classes for Zen Green tokens (`#006B3C`, `#0B7A46`, `#EAF6EF`, `#F5F7F6`).
   - Field states (editable vs. read-only `#F0F4F1`).
   - Red asterisks (`*`) on all required field labels.
   - Error messages rendered immediately below their associated fields.
   - Button busy states and disabled behavior.
2. **Playwright Visual Verification**:
   - Screenshots captured at Desktop ($\ge 992\text{ px}$), Tablet ($768 - 991\text{ px}$), and Mobile ($< 768\text{ px}$) viewports stored under:
     ```text
     artifacts/lab-02/screenshots/
     ├── create-ticket/
     ├── my-tickets/
     └── ticket-detail/
     ```
3. **Visual Inspection Checklist**:
   - Confirm no clipping, overlap, or unintended horizontal scrolling occurs.
   - Consistent badge colors for Status and Priority across list and detail views.
   - Usability of search, filters, pagination, and attachment controls at all screen widths.