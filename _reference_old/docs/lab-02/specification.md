# Lab 2 Sprint Engineering Specification
Requester Ticketing MVP with UI Foundation
## 1. Sprint Goal
- Implement core features of a customer service ticketing system, allowing requesters to create, view, and manage tickets with attachments. The system will support searching, filtering, and sorting tickets, provide detailed ticket views, and enforce requester-specific data access. All user interfaces will adhere to a consistent Zen Green theme.
## 2. Stakeholder Request Interpretation
- Create a Responsive, Customer service ticket system where the requester is able to write,attach files,fill out form to submit a ticket, and view his/her tickets, and is able to edit/add/remove the attachments past the creation period.
- These Tickets are not public to all users, but only to the user that created them. and the user cannot access another user's ticket.
- No login is present yet, use seeded developer data to simulate the logged-in user.
- Use the Zen Green Theme on all views, make it consistent

## 3. Scope
### Included
#### Development Requester Context
- Select an active seeded Development Requester.
- Treat that selection as the current Requester for the session/testing context.
- Display the current Requester in the application shell.
- Allow changing the selected Requester.
- Reload Requester-specific data after switching (e.g., My Tickets list and detail access).

#### Ticket Creation
- Create a new Ticket.
- Capture the required Ticket information (Category, Related System, Summary, Description, Requested Priority).
- Validate submitted information on both client and server.
- Generate the official Ticket Number on the backend.
- Persist the Ticket with initial status `New`.
- Handle permitted attachments associated with creation atomically.

#### My Tickets
- Display Tickets belonging to the currently selected Requester.
- Search Tickets by keyword (Ticket Number, Summary, Description).
- Filter Tickets by Status, Priority, Category, and Related System.
- Sort Tickets (defaulting to Requested Priority followed by Current Status).
- Paginate results.
- Provide loading, empty, no-results, and failure states.

#### Requester Ticket Detail
- Open a Ticket belonging to the current Requester.
- Display ticket information as read-only.
- Display active attachment metadata.
- Prevent access to another Requester's Ticket (403 Forbidden).

#### Attachment Lifecycle
- Add permitted attachments to an existing Ticket.
- Inspect attachment metadata.
- Download active attachments.
- Soft-remove permitted attachments.
- Prevent removed attachments from being downloaded or accessed.
- Note: Attachment preview is explicitly excluded from Lab 2.

#### UI Foundation
- Zen Green visual design system.
- Reusable form, list, badge, validation, loading, empty, and error components.
- Responsive layouts (desktop, tablet, mobile).
- Keyboard accessibility and visible focus indicators.
- Application shell and navigation.

#### Supporting Data & API Foundation
- PostgreSQL data models for Requesters, Tickets, Attachments, Categories, and Related Systems.
- Idempotent seed data for Requesters, Categories, and Related Systems.
- REST APIs required to support the above workflows.

### Excluded
- Authentication and security: Login, logout, passwords, password hashing, sessions, tokens, authenticated identities, and real role-based authorization. The Development Requester selector is strictly a testing mechanism.
- IT Staff workflow: IT Staff dashboard/queue, claiming or reassigning tickets, changing IT Priority, and internal management.
- Ticket collaboration and work tracking: Public Comments, Internal Notes, and Actions Taken.
- Post-creation ticket lifecycle: Status changes beyond the initial `New` status (resolving, closing, reopening, cancelling).
- Administration functions: Administrator management of users, Requesters, roles, and reference data.

## 4. Functional Requirements

### Development Requester Context
- **FR-01 : Select Development Requester**  
  The system shall allow the user to select an active Development Requester before accessing the Requester-facing ticket functionality. If no Requester is selected (e.g. on initial application launch), the application shall prompt the user to select an active Development Requester.

- **FR-02 : Load Active Requesters**  
  The system shall retrieve the available active Development Requesters from the database.

- **FR-03 : Display Current Requester**  
  The application shall display the currently selected Development Requester in the application shell.

- **FR-04 : Change Requester**  
  The system shall allow the user to switch the currently selected Development Requester at any time.

- **FR-05 : Reload Requester-Specific Data on Switch**  
  The system shall reload Requester-specific ticket data when the selected Development Requester changes, replacing the previous requester's data with the newly selected requester's data.

- **FR-06 : Abandon Ticket Creation on Context Reset**  
  The system shall abandon all unsaved ticket creation changes and reset the creation form when the selected Requester is switched or when the page is reloaded.

### Ticket Creation
- **FR-07 : Display Create Ticket Interface**  
  The system shall provide a Create Ticket screen containing the required ticket form fields and attachment upload interface.

- **FR-08 : Submit Ticket**  
  The system shall allow the selected Requester to submit a new Ticket.

- **FR-09 : Validate Ticket Data**  
  The system shall validate all submitted Ticket fields on both frontend and backend before creating the Ticket.

- **FR-10 : Backend Ticket Number Generation**  
  The backend shall generate a unique official Ticket Number for every newly created Ticket.

- **FR-11 : Assign Initial Ticket Status**  
  The system shall initialize every newly created Ticket with the status `New`.

- **FR-12 : Persist Ticket**  
  The system shall save a successfully submitted and validated Ticket to the database.

- **FR-13 : Display Creation Result**  
  After successful creation, the system shall display the generated Ticket Number and navigate or present an appropriate success confirmation.

- **FR-14 : Atomic Ticket and Attachment Creation**  
  If attachment upload fails during initial ticket creation, the system shall roll back the entire transaction so that no orphaned ticket or partial record is saved.

### My Tickets (List, Search, Filter, Sort, Paginate)
- **FR-15 : Retrieve Owned Tickets**  
  The system shall retrieve only tickets belonging to the currently selected Development Requester.

- **FR-16 : Display My Tickets List**  
  The system shall display the selected Requester's tickets in the My Tickets view with their key summary details.

- **FR-17 : Search Tickets**  
  The system shall allow the Requester to search tickets using keyword matching across Ticket Number, Summary, and Description.

- **FR-18 : Filter Tickets**  
  The system shall allow the Requester to filter their tickets by Current Status, Requested Priority, Category, and Related System.

- **FR-19 : Sort Tickets**  
  The system shall allow the Requester to sort their tickets by Requested Priority or Current Status, and toggle between Ascending and Descending order.

- **FR-20 : Paginate Tickets**  
  The system shall allow the Requester to navigate through paginated ticket results and choose between page sizes of 10, 25, or 50 tickets per page (defaulting to 10).

- **FR-21 : Open Ticket Detail**  
  The system shall allow the Requester to select and open an individual ticket from the My Tickets list.

### Ticket Detail & Ownership
- **FR-22 : Retrieve Owned Ticket Detail**  
  The system shall retrieve the full details of a specific ticket belonging to the currently selected Requester.

- **FR-23 : Display Ticket Detail**  
  The system shall display the ticket information as read-only in the Requester Ticket Detail screen.

- **FR-24 : Enforce Ticket Ownership**  
  The system shall reject any direct attempt to view or access a ticket belonging to another Requester with a `403 Forbidden` response.

### Attachment Management
- **FR-25 : Upload Attachments During Ticket Creation**  
  The system shall allow a Requester to attach permitted supporting files during initial ticket submission.

- **FR-26 : Add Attachments to Existing Ticket**  
  The system shall allow the owner of an existing ticket to add permitted attachments from the Ticket Detail view.

- **FR-27 : Retrieve Attachment Metadata**  
  The system shall retrieve active attachment metadata (file name, file size, content type, upload date) associated with a ticket.

- **FR-28 : Download Active Attachment**  
  The system shall allow the owner of a ticket to download any active attachment associated with that ticket.

- **FR-29 : Soft-Remove Attachment**  
  The system shall allow the owner of a ticket to soft-remove an attachment from their ticket.

- **FR-30 : Prevent Access to Removed Attachments**  
  The system shall prevent soft-removed attachments from being downloaded or displayed in user views.

### Reference Data
- **FR-31 : Retrieve Categories**  
  The system shall retrieve active Ticket Categories for selection in ticket workflows.

- **FR-32 : Retrieve Related Systems**  
  The system shall retrieve active Related Systems for selection in ticket workflows.

### UI & Interaction Foundation
- **FR-33 : Loading States**  
  The application shall provide visual loading indicators while asynchronous data operations are in progress.

- **FR-34 : Empty States**  
  The application shall provide clear empty states when the Requester has not created any tickets.

- **FR-35 : No-Results States**  
  The My Tickets interface shall provide an explicit no-results state distinguishing an empty search/filter outcome from an empty ticket list.

- **FR-36 : Error States and Failure Feedback**  
  The application shall provide clear, non-destructive error feedback when an API operation or validation fails.

- **FR-37 : Responsive Layout**  
  The Requester-facing screens shall adapt responsively to desktop, tablet, and mobile viewport sizes using the Zen Green theme.

- **FR-38 : Accessible Interactions**  
  The application shall support keyboard navigation, accessible form labeling, and visible focus indicators across all interactive controls.

## 5. Business Rules

### Ticket Identity & Defaults
- **BR-01 : Backend-Generated Unique Ticket Number**  
  The official Ticket Number shall be generated exclusively by the backend and must be globally unique.

- **BR-02 : Initial Ticket Status**  
  Every newly created Ticket shall automatically be assigned an initial Current Status of `New`.

- **BR-03 : Single Requester Ownership**  
  Every Ticket must be associated with exactly one Development Requester upon creation. A Requester may own multiple Tickets.

### Development Requester Context & Session
- **BR-04 : Active Requesters Only & Initial Selection Prompt**  
  Only active Development Requesters shall appear in and be selectable from the Development Requester selector. Inactive Requesters must be excluded. On cold start or when no Requester is selected, the application shall prompt the user to select an active Development Requester before loading Requester-scoped data.

- **BR-05 : Testing Context Isolation**  
  The selected Development Requester defines the active testing session context. All Requester-facing queries, lists, and operations must strictly scope data to this Requester.

- **BR-06 : Switching Requester on My Tickets**  
  When the selected Requester is changed while on the My Tickets page, the view shall reload to display only the newly selected Requester's tickets.

- **BR-07 : Switching Requester on Ticket Detail**  
  When the selected Requester is changed while viewing an existing Ticket, the application shall navigate the user back to the My Tickets view of the newly selected Requester.

- **BR-08 : Switching Requester During Creation**  
  When the selected Requester is changed during ticket creation, the in-progress creation session shall be abandoned, unsaved input discarded, and the creation form restarted under the new Requester context.

### Ticket Ownership & Access Control
- **BR-09 : Strict Requester Data Isolation**  
  A Requester shall only view, query, or modify Tickets and Attachments that belong to their own account.

- **BR-10 : Cross-Requester Access Rejection**  
  Any direct request (via UI or API) to view, modify, or download a Ticket or Attachment belonging to another Requester shall be rejected with `403 Forbidden`.

### Ticket Validation & Submission Constraints
- **BR-11 : Mandatory Fields**  
  A Ticket cannot be created without a selected Category, a selected Related System, a Ticket Summary (title), and a Ticket Description.

- **BR-12 : Non-Empty Description Requirement**  
  A Ticket Description must contain non-empty text (at least 1 character) to be valid for submission.

- **BR-13 : Optional Ticket Fields**  
  Requested Priority and initial Attachments are optional; a Requester may submit a Ticket without selecting a Requested Priority or attaching files.

- **BR-14 : Read-Only and System-Generated Values**  
  System-managed attributes (Ticket Number, Ticket Date/Created At, Initial Status `New`, Requester identity) cannot be supplied or overwritten by user input.

- **BR-15 : Server-Side Validation Authority**  
  All validation rules must be enforced by the backend API regardless of client-side validation checks.

### Ticket Creation Failure & Rate Limiting
- **BR-16 : Input Preservation on Failure**  
  If ticket submission fails due to validation errors, attachment issues, or network failure, the application shall preserve all entered form data so the user can correct errors and retry.

- **BR-17 : User Notification on Failure**  
  When Ticket creation fails, the application shall display an informative error notification and allow the user to retry.

- **BR-18 : Duplicate Submission Throttling (15-Second Window)**  
  The backend shall prevent a Requester from submitting another Ticket creation request within 15 seconds of their previous creation attempt, throttled by `requester_id`.

- **BR-19 : Throttled Request Response (HTTP 429)**  
  When a creation request is throttled within the 15-second window, the backend shall respond with HTTP `429 Too Many Requests`. The application shall display a non-technical error notification allowing the user to retry after the cooldown.

### Search, Filter, Sort & Pagination
- **BR-20 : Requester-Scoped Keyword Search**  
  Ticket keyword search shall perform case-insensitive substring matching against `Ticket Number`, `Ticket Summary`, and `Ticket Description` strictly within the selected Requester's tickets.

- **BR-21 : Supported Filters**  
  The My Tickets list can be filtered by `Current Status`, `Requested Priority`, `Category`, and `Related System`.

- **BR-22 : Single Value per Filter Category**  
  A filter type accepts at most one selected value at a time (single-select per filter category), but multiple distinct filter categories can be applied simultaneously.

- **BR-23 : Sorting Precedence & Ranking**  
  Priority values are ranked in descending order: `Urgent` -> `High` -> `Medium` -> `Low` (with unassigned/optional priority ordered last).  
  - When sorting by **Requested Priority**: Primary sort is `Requested Priority`, secondary sort is `Current Status`, and tertiary sort is `Ticket Number`.  
  - When sorting by **Current Status**: Primary sort is `Current Status`, secondary sort is `Requested Priority`, and tertiary sort is `Ticket Number`.

- **BR-24 : Sort Direction & Allowed Fields**  
  Users may sort tickets by `Requested Priority` or `Current Status` and toggle sort direction between Ascending and Descending. The chosen sort direction applies across primary, secondary, and tertiary sorting levels.

- **BR-25 : Server-Side Pagination & Page Sizes**  
  Pagination shall operate on the filtered and sorted result set belonging to the current Requester. The system shall support page sizes of 10, 25, and 50 tickets per page, with a default page size of 10.

### Attachment Management & Lifecycle
- **BR-26 : Allowed Attachment Types & Database Storage**  
  Only files with MIME types and extensions for JPG/JPEG, PNG, WEBP, and PDF are permitted. All other file types must be rejected. Attachment binary data shall be stored directly in PostgreSQL using the `bytea` column type.

- **BR-27 : Maximum Attachment File Size**  
  An individual attachment file must not exceed 5 MB in size.

- **BR-28 : Maximum Active Attachments per Ticket**  
  A Ticket shall have a maximum of five (5) active (non-deleted) attachments at any given time.

- **BR-29 : Atomic Creation on Attachment Failure**  
  If any attachment fails validation or upload during initial Ticket creation, the entire creation process shall fail and no ticket record shall be created.

- **BR-30 : Soft Deletion of Attachments & Removal Reason**  
  Removing an attachment from a created ticket requires the requester to enter a removal reason (non-empty text, minimum 1 character). Removing an attachment sets `isDeleted = true`, stores `removalReason`, and sets the `deletedAt` timestamp on the attachment record rather than physically deleting it from the database.

- **BR-31 : Soft-Deleted Attachment Inaccessibility & Requester Perspective**  
  Soft-deleted attachments cannot be downloaded, previewed, or restored. In the requester perspective on created tickets, soft-deleted attachments remain visible at the **bottom of the attachment list**, rendered in **greyed-out text** with an **"X" cross icon** (`❌`) next to the filename metadata, displaying the removal reason and deletion timestamp with preview and download actions disabled.

### Reference Data & Seed Constraints
- **BR-32 : Mandatory Categories Seed Data**  
  The reference seed data must include at least the following active categories: `Account and Access`, `Hardware`, `Software`, and `Network`.

- **BR-33 : Mandatory Related Systems Seed Data**  
  The reference seed data must include at least six (6) realistic active Related Systems.

- **BR-34 : Mandatory Requesters Seed Data**  
  The reference seed data must include at least four (4) active Development Requesters and at least one (1) inactive Development Requester.

- **BR-35 : Idempotent Seed Execution**  
  All database seeding operations must be idempotent, safely executing repeatedly without creating duplicate rows or conflicting constraints.



## 6. UI Specification Summary

The UI foundation strictly adheres to the **Zen Green** visual design system with enterprise-grade typography, spacing, and accessible interaction patterns.

### 6.1 Design Tokens & Element Required Styles

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

---

### 6.2 Key Screen Workflows & Interactions

1. **Development Requester Selection Screen (`/` or Selection Modal)**:
   - **Title & Purpose**: "TokTickIT" title with prominent explanatory text:
     > *"Select a Development Requester to test requester-specific ticket behavior. This is not a login screen. Authentication and role-based access will be introduced in Lab 3."*
   - **Dropdown & Actions**: Dropdown listing active Development Requesters loaded from PostgreSQL (`GET /api/requesters`) and a primary "Continue" button (`#006B3C`).
   - **Screen States**: Handles loading spinner/skeleton, empty state (if no active requesters exist, preventing continuation), and safe API-failure state.
   - **Post-Selection**: Application shell displays the selected Requester's name with a "Change Requester" action; switching context reloads all requester-specific data.
   - **Context Switch Protection**: If the requester is changed while an unsaved ticket creation form is dirty, a confirmation modal prompts the user before discarding the draft and switching context.
2. **Ticket Creation (`/tickets/new`)**:
   - Capture required fields (Category, Related System, Summary, Description min 20 chars) and optional Requested Priority.
   - Form validation highlights the description field border in red (`#C53030`) with inline error text immediately below when below 20 characters upon submission.
   - Attachments (up to 5 files, 5 MB max per file, JPG/PNG/WEBP/PDF) are staged in client memory with a live counter (`X / 5 files`) and submitted atomically.
   - Removing a staged file during creation is instant without confirmation.
   - "Submit Ticket" button enters a 15-second disabled cooldown state to prevent duplicate submissions (`BR-18`).
   - On successful creation, the app immediately redirects to the Ticket Detail view with a Zen Green success toast showing the new Ticket Number.
3. **My Tickets (`/tickets`)**:
   - Keyword search across Ticket Number, Summary, and Description.
   - Filter dropdowns (single value per category) for Category, Related System, Status, and Priority. Applying a search or filter resets pagination to Page 1.
   - **Table Header Sorting**: Clickable headers for *Priority* and *Status* cycle through `Not Applied` → `Sorted` → `Reverse Sorted` → `Not Applied`. Active sort headers are darkened with an indicator. Clicking a different header immediately resets the previous sort.
   - Priority Sort: Ascending (`Urgent` → `High` → `Medium` → `Low` → `None`) / Descending (Reverse).
   - Status Sort: Ascending (`New` → `In Progress` → `Resolved` → `Closed`) / Descending (Reverse).
   - Multi-tier sorting cascade: Priority (`Priority` → `Status` → `Ticket Number`); Status (`Status` → `Priority` → `Ticket Number`).
   - Server-side pagination with page size options (10, 25, 50).
   - Distinct states: Loading skeleton/spinner, Empty list state, and No-results filter state with "Clear Filters" button.
4. **Requester Ticket Detail (`/tickets/:id`)**:
   - Read-only display of ticket attributes with soft gray-green background shading, status badge (`New` pale green), and priority badge.
   - Active attachments list with file metadata and download buttons.
   - Soft-delete attachment action with a confirmation modal before removal.
   - Enforces 403 Forbidden error view when attempting to view another requester's ticket.

---

## 7. Data Changes

### 7.1 Development Requester

Create a `Requester` (Development Requester) data model.

| Field | Type | Constraints / Attributes | Description |
|---|---|---|---|
| `id` | Integer | Primary key, auto-generated (`@id @default(autoincrement())`) | Unique requester identifier |
| `name` | String | Required | Full name of the requester |
| `email` | String | Required, unique (`@unique`) | Corporate email address |
| `department` | String | Optional | Department or team name |
| `isActive` | Boolean | Required, default `true` (`@default(true)`) | Controls requester eligibility for selection (`BR-04`, `BR-34`) |
| `createdAt` | DateTime | Required, default `now()` (`@default(now())`) | Record creation timestamp |
| `updatedAt` | DateTime | Required, auto-updated (`@updatedAt`) | Last update timestamp |

*A Development Requester may own multiple Tickets.*

---

### 7.2 Category

Create or update the `Category` reference-data model.

| Field | Type | Constraints / Attributes | Description |
|---|---|---|---|
| `id` | Integer | Primary key, auto-generated (`@id @default(autoincrement())`) | Unique category identifier |
| `name` | String | Required, unique (`@unique`) | Category name (`BR-32`) |
| `isActive` | Boolean | Required, default `true` (`@default(true)`) | Category active status flag |
| `createdAt` | DateTime | Required, default `now()` (`@default(now())`) | Record creation timestamp |
| `updatedAt` | DateTime | Required, auto-updated (`@updatedAt`) | Last update timestamp |

*A Category may be referenced by multiple Tickets.*

**Mandatory Seed Categories (`BR-32`)**:
1. `Account and Access`
2. `Hardware`
3. `Software`
4. `Network`

---

### 7.3 Related System

Create the `RelatedSystem` reference-data model.

| Field | Type | Constraints / Attributes | Description |
|---|---|---|---|
| `id` | Integer | Primary key, auto-generated (`@id @default(autoincrement())`) | Unique system identifier |
| `name` | String | Required, unique (`@unique`) | System name (`BR-33`) |
| `description` | String | Optional | Description of the system |
| `isActive` | Boolean | Required, default `true` (`@default(true)`) | System active status flag |
| `createdAt` | DateTime | Required, default `now()` (`@default(now())`) | Record creation timestamp |
| `updatedAt` | DateTime | Required, auto-updated (`@updatedAt`) | Last update timestamp |

*A Related System may be referenced by multiple Tickets.*

**Mandatory Seed Related Systems (`BR-33`)**:
At least six (6) realistic Related Systems:
1. `Email & Collaboration`
2. `VPN & Remote Access`
3. `HR & Payroll Portal`
4. `Financial & Billing System`
5. `CRM & Customer Support`
6. `ERP & Operations`

---

### 7.4 Ticket

Create the core `Ticket` entity model.

| Field | Type | Constraints / Attributes | Description |
|---|---|---|---|
| `id` | Integer | Primary key, auto-generated (`@id @default(autoincrement())`) | Internal database identifier |
| `ticketNumber` | String | Required, unique (`@unique`), indexed | Backend-generated official ID (e.g. `TICK-2026-0001`, `BR-01`) |
| `requesterId` | Integer | Required, Foreign Key -> `Requester.id` | Owning requester (`BR-03`, `BR-09`) |
| `categoryId` | Integer | Required, Foreign Key -> `Category.id` | Selected category (`BR-11`) |
| `relatedSystemId` | Integer | Required, Foreign Key -> `RelatedSystem.id` | Selected related system (`BR-11`) |
| `summary` | String | Required (max 255 chars) | Brief summary / title of the issue (`BR-11`) |
| `description` | Text | Required (min 20 chars, `BR-12`) | Full detailed explanation of the request |
| `requestedPriority` | String | Optional (Nullable: `Urgent`, `High`, `Medium`, `Low`, `BR-13`) | Requester's requested urgency ranking |
| `currentStatus` | String | Required, default `"New"` (`@default("New")`, `BR-02`) | Current lifecycle state |
| `createdAt` | DateTime | Required, default `now()` (`@default(now())`) | Ticket submission timestamp |
| `updatedAt` | DateTime | Required, auto-updated (`@updatedAt`) | Last ticket update timestamp |

*A Ticket belongs to exactly one Requester, Category, and Related System, and may contain up to 5 active Attachments.*

---

### 7.5 Attachment

Create the `Attachment` entity model with PostgreSQL `bytea` binary storage.

| Field | Type | Constraints / Attributes | Description |
|---|---|---|---|
| `id` | Integer | Primary key, auto-generated (`@id @default(autoincrement())`) | Unique attachment identifier |
| `ticketId` | Integer | Required, Foreign Key -> `Ticket.id`, Cascade Delete | Associated ticket record |
| `fileName` | String | Required | Original upload filename |
| `contentType` | String | Required | MIME type (`image/jpeg`, `image/png`, `image/webp`, `application/pdf`, `BR-26`) |
| `fileSize` | Integer | Required | Binary file size in bytes (max 5 MB / 5,242,880 bytes, `BR-27`) |
| `fileData` | Bytes | Required (`@db.ByteA`, `BR-26`) | Direct binary storage in PostgreSQL |
| `isDeleted` | Boolean | Required, default `false` (`@default(false)`, `BR-30`) | Soft-deletion flag (`BR-31`) |
| `removalReason` | String | Optional (`removalReason String?`, `BR-30`) | User-provided reason for removing attachment (min 1 char) |
| `deletedAt` | DateTime | Optional (`deletedAt DateTime?`) | Soft-deletion timestamp |
| `createdAt` | DateTime | Required, default `now()` (`@default(now())`) | Upload timestamp |

---

### 7.6 Database Indexes & Optimization

1. **Ticket Indexes**:
   - `@@unique([ticketNumber])`: Fast lookup by generated ticket number.
   - `@@index([requesterId, currentStatus])`: Optimized requester ticket filtering.
   - `@@index([requesterId, requestedPriority])`: Optimized requester ticket sorting (`BR-23`).
   - `@@index([requesterId, createdAt])`: Chronological fallback ordering.
2. **Attachment Indexes**:
   - `@@index([ticketId, isDeleted])`: High-speed retrieval of active attachments and enforcement of the 5 active attachments limit (`BR-28`).

---

### 7.7 Seed Data Specifications (`BR-32` - `BR-35`)

- **Requesters (`BR-34`)**:
  - Active:
    1. `Alice Chen` (`alice.chen@example.com`, Dept: `Engineering`, `isActive: true`)
    2. `Bob Smith` (`bob.smith@example.com`, Dept: `Marketing`, `isActive: true`)
    3. `Carlos Ray` (`carlos.ray@example.com`, Dept: `Finance`, `isActive: true`)
    4. `Diana Prince` (`diana.prince@example.com`, Dept: `Operations`, `isActive: true`)
  - Inactive:
    5. `Eve Inactive` (`eve.inactive@example.com`, Dept: `Contractor`, `isActive: false`)
- **Idempotency (`BR-35`)**:
  - Seed execution uses upsert operations (`prisma.upsert` or `ON CONFLICT DO NOTHING`) ensuring scripts can run repeatedly without duplicate or conflicting records.

---
## 8. API Contract

All REST endpoints operate under the `/api` base path and require the selected Development Requester (`requesterId`) for testing session isolation.

### 8.1 API Endpoints Summary

| Method | Endpoint | Description | Key Query / Body Params | Success Status | Error Codes |
|---|---|---|---|---|---|
| `GET` | `/api/requesters` | List all active Development Requesters (`BR-04`, `BR-34`) | None | `200 OK` | `500` |
| `GET` | `/api/categories` | List active Ticket Categories (`BR-32`) | None | `200 OK` | `500` |
| `GET` | `/api/related-systems` | List active Related Systems (`BR-33`) | None | `200 OK` | `500` |
| `POST` | `/api/tickets` | Create a new Ticket with optional atomic attachments (`BR-01`–`BR-19`, `BR-29`) | Multipart form: `requesterId`, `categoryId`, `relatedSystemId`, `summary`, `description`, `requestedPriority?`, `attachments?` | `201 Created` | `400`, `413`, `415`, `422`, `429`, `500` |
| `GET` | `/api/tickets` | List paginated, filtered, sorted tickets for current requester (`BR-15`–`BR-25`) | Query: `requesterId` (req), `search?`, `status?`, `priority?`, `categoryId?`, `relatedSystemId?`, `sortBy?`, `sortDirection?`, `page?`, `pageSize?` | `200 OK` | `400`, `404`, `500` |
| `GET` | `/api/tickets/:id` | Get full ticket detail and active attachments (`FR-22`–`FR-24`, `BR-09`–`BR-10`) | Query: `requesterId` (req) | `200 OK` | `400`, `403`, `404`, `500` |
| `POST` | `/api/tickets/:id/attachments` | Add attachment to an existing ticket (`FR-26`, `BR-26`–`BR-28`) | Multipart: `requesterId`, `file` | `201 Created` | `400`, `403`, `404`, `409`, `413`, `415`, `500` |
| `GET` | `/api/tickets/:id/attachments` | List active attachment metadata for a ticket (`FR-27`) | Query: `requesterId` (req) | `200 OK` | `400`, `403`, `404`, `500` |
| `GET` | `/api/attachments/:id/download` | Download attachment binary data stream (`FR-28`, `BR-31`) | Query: `requesterId` (req) | `200 OK` (binary stream) | `400`, `403`, `404`, `500` |
| `GET` | `/api/attachments/:id/preview` | Preview attachment binary stream inline (`Content-Disposition: inline`) | Query: `requesterId` (req) | `200 OK` (binary stream) | `400`, `403`, `404`, `500` |
| `DELETE` | `/api/attachments/:id` | Soft-remove attachment with removal reason (`isDeleted = true`, `BR-30`) | JSON Body: `requesterId` (req), `reason` (req, min 1 char) | `200 OK` | `400`, `403`, `404`, `422`, `500` |

---

### 8.2 Detailed Endpoint Contracts

#### 1. `POST /api/tickets` (Create Ticket)
- **Request**: `multipart/form-data`
  - `requesterId` (Int, Required): ID of active requester
  - `categoryId` (Int, Required): ID of active category
  - `relatedSystemId` (Int, Required): ID of active related system
  - `summary` (String, Required): Max 255 chars
  - `description` (String, Required): Min 20 chars
  - `requestedPriority` (String, Optional): `URGENT`, `HIGH`, `MEDIUM`, `LOW`
  - `attachments` (Files, Optional): Up to 5 files, $\le$ 5 MB each (`.jpg`, `.jpeg`, `.png`, `.webp`, `.pdf`)
- **Responses**:
  - `201 Created`: Returns created ticket object with official `ticketNumber`, status `"New"`, and attachment metadata.
  - `422 Unprocessable Entity`: Validation failure (e.g. description $< 20$ chars, invalid category).
  - `413 Payload Too Large`: Attachment exceeds 5 MB.
  - `415 Unsupported Media Type`: Disallowed attachment MIME type.
  - `429 Too Many Requests`: Submitting within 15-second cooldown window (`BR-18`, `BR-19`).

#### 2. `GET /api/tickets` (My Tickets List)
- **Query Parameters**:
  - `requesterId` (Int, Required)
  - `search` (String, Optional): Case-insensitive substring match on `ticketNumber`, `summary`, `description`
  - `status`, `priority`, `categoryId`, `relatedSystemId` (Optional filters)
  - `sortBy` (`priority` \| `status`), `sortDirection` (`asc` \| `desc`)
  - `page` (Int, Default 1), `pageSize` (`10` \| `25` \| `50`, Default 10)
- **Sorting Cascades**:
  - `sortBy=priority`: Priority ranking (`URGENT` $\rightarrow$ `HIGH` $\rightarrow$ `MEDIUM` $\rightarrow$ `LOW` $\rightarrow$ unassigned) $\rightarrow$ `currentStatus` $\rightarrow$ `ticketNumber`.
  - `sortBy=status`: `currentStatus` $\rightarrow$ `requestedPriority` $\rightarrow$ `ticketNumber`.
- **Response `200 OK`**:
  ```json
  {
    "data": [
      {
        "id": 1,
        "ticketNumber": "TICK-2026-0001",
        "summary": "Laptop cannot connect to email",
        "category": { "id": 2, "name": "Hardware" },
        "relatedSystem": { "id": 1, "name": "Email & Collaboration" },
        "requestedPriority": "HIGH",
        "currentStatus": "New",
        "createdAt": "2026-08-26T09:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "totalItems": 1,
      "totalPages": 1,
      "hasPreviousPage": false,
      "hasNextPage": false
    }
  }
  ```

#### 3. `GET /api/tickets/:id` (Ticket Detail)
- **Query**: `requesterId` (Int, Required)
- **Responses**:
  - `200 OK`: Full ticket detail with list of active (non-deleted) attachments.
  - `403 Forbidden`: Attempting to access another requester's ticket (`BR-10`).
  - `404 Not Found`: Ticket does not exist.

#### 4. `POST /api/tickets/:id/attachments` (Add Attachment)
- **Request**: `multipart/form-data` with `requesterId` and `file`.
- **Responses**:
  - `201 Created`: Returns metadata of newly attached file.
  - `403 Forbidden`: Requester does not own parent ticket.
  - `409 Conflict`: Ticket already has 5 active attachments (`BR-28`).
  - `413 Payload Too Large`: File exceeds 5 MB (`BR-27`).
  - `415 Unsupported Media Type`: Disallowed file type (`BR-26`).

#### 5. `GET /api/attachments/:id/download` (Download Attachment)
- **Query**: `requesterId` (Int, Required)
- **Responses**:
  - `200 OK`: Binary file stream with `Content-Type`, `Content-Disposition`, and `Content-Length` headers.
  - `403 Forbidden`: Parent ticket not owned by requester.
  - `404 Not Found`: Attachment does not exist or has been soft-deleted (`BR-31`).

#### 6. `DELETE /api/attachments/:id` (Soft-Remove Attachment)
- **Request**: `requesterId` in JSON body or query parameter.
- **Behavior**: Updates `isDeleted = true` (`BR-30`). The file remains in database for audit but is immediately hidden from all user views.
- **Responses**:
  - `200 OK`: `{ "data": { "id": 1, "isDeleted": true } }`
  - `403 Forbidden`: Parent ticket not owned by requester.
  - `404 Not Found`: Attachment does not exist or already removed.

---

### 8.3 Standard Error Response Envelope

All API errors return a uniform, secure JSON envelope:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The submitted ticket data is invalid.",
    "details": [
      {
        "field": "description",
        "message": "Description must contain at least 20 characters."
      }
    ]
  }
}
```

---

## 9. Acceptance Criteria

### Development Requester Selection

- **AC-01** Given the application has active Development Requesters, when the user opens the Development Requester Selection screen, then the active Requesters are loaded from the database and are available for selection.

- **AC-02** Given no active Development Requesters exist, when the Selection screen loads, then an empty state is displayed and the user cannot continue without selecting a Requester.

- **AC-03** Given the Development Requester API fails, when the Selection screen attempts to load, then a safe error state is displayed without exposing internal server details.

- **AC-04** Given an inactive Development Requester exists, when the Selection screen loads, then the inactive Requester is not available for selection.

- **AC-05** Given a Development Requester is selected, when the user continues into the application, then the selected Requester's identity is displayed in the application shell and becomes the current testing context.

- **AC-06** Given a Requester is currently selected, when the user chooses Change Requester and selects another active Requester, then requester-specific data is reloaded using the newly selected Requester.

- **AC-07** Given no Development Requester is selected, when the user attempts to access requester-specific ticket functionality, then the Development Requester Selection screen is shown.

### Ticket Creation

- **AC-08** Given valid Ticket data and a selected active Requester, when the Requester submits the Create Ticket form, then exactly one Ticket is saved with the selected Requester's ID.

- **AC-09** Given a valid Ticket submission, when the Ticket is created, then the backend generates a unique official Ticket Number and the UI displays that Ticket Number after successful creation.

- **AC-10** Given a newly created Ticket, when its saved data is retrieved, then its Current Status is `New` and its system-generated values are preserved.

- **AC-11** Given valid Ticket data, when the Requester submits the form, then the selected Category, Related System, Summary, Description, and Requested Priority are saved with the Ticket.

- **AC-12** Given the Create Ticket form contains missing or invalid required fields, when the Requester attempts to submit, then field-level validation messages are displayed and the Ticket creation API is not called.

- **AC-13** Given a Summary exceeds its specified maximum length, when the Requester attempts to submit, then the Summary is rejected with a field-level validation message.

- **AC-14** Given a Description does not satisfy its specified length requirement, when the Requester attempts to submit, then the Description is rejected with a field-level validation message.

- **AC-15** Given invalid Ticket data is submitted directly to the API, when the API receives the request, then backend validation rejects the request and no invalid Ticket is saved.

- **AC-16** Given the Ticket creation request is being processed, when the Requester views the Create Ticket form, then the Submit button is disabled and displays a busy state to prevent duplicate submission.

- **AC-17** Given Ticket creation fails after the Requester has entered valid form data, when the API returns an error, then a safe error message is displayed and the Requester's entered form values remain available.

- **AC-18** Given a Ticket has been successfully created, when the success state is displayed, then the official Ticket Number and an appropriate next action are clearly presented.

### Attachment Creation

- **AC-19** Given a valid JPG, JPEG, PNG, WEBP, or PDF attachment that is no larger than 5 MB, when the Requester adds it to a Ticket within the attachment limit, then the attachment is accepted.

- **AC-20** Given an attachment is larger than 5 MB, when the Requester attempts to upload it, then the attachment is rejected and a clear validation error is displayed.

- **AC-21** Given an attachment is not JPG, JPEG, PNG, WEBP, or PDF, when the Requester attempts to upload it, then the attachment is rejected and a clear validation error is displayed.

- **AC-22** Given a Ticket already has five active Attachments, when the Requester attempts to add another Attachment, then the upload is rejected and the existing Attachments remain unchanged.

- **AC-23** Given an initial Ticket submission contains an invalid Attachment, when Ticket creation is processed, then the Ticket is not partially created and the failure is reported safely.

- **AC-24** Given a valid Attachment is added to an existing owned Ticket, when the upload succeeds, then the Attachment metadata is stored and the Attachment is available in the Ticket Detail view.

### My Tickets

- **AC-25** Given Requester A is selected, when My Tickets is opened, then only Tickets owned by Requester A are returned and displayed.

- **AC-26** Given Requester A has no Tickets, when My Tickets is opened, then a meaningful empty state is displayed.

- **AC-27** Given Tickets exist but the current search and filter conditions match none of them, when My Tickets is displayed, then a meaningful no-results state is displayed.

- **AC-28** Given the My Tickets API fails, when the Ticket list is loaded, then a safe failure state is displayed without exposing internal server details.

- **AC-29** Given multiple Tickets exist for the selected Requester, when the Requester enters a supported search term, then only Tickets matching the specified searchable fields are returned.

- **AC-30** Given multiple Tickets exist, when the Requester applies a supported filter, then only Tickets satisfying that filter are displayed.

- **AC-31** Given multiple Tickets exist, when the Requester applies multiple supported filters, then only Tickets satisfying all active filters are displayed.

- **AC-32** Given multiple Tickets exist, when the Requester changes the supported sort option or direction, then the Ticket list is displayed in the requested order using the specified secondary sorting rules.

- **AC-33** Given more Tickets exist than fit on one page, when the Requester changes page, then the API returns the corresponding page of Tickets and the pagination metadata reflects the available pages.

- **AC-34** Given the Requester selects a permitted page size, when the Ticket list is loaded, then no more than the selected number of Tickets is displayed on the page.

- **AC-35** Given an invalid search, filter, sort, page, or page-size parameter is supplied to the API, when the request is processed, then the API rejects the invalid parameter with a safe validation error.

### Ticket Detail and Ownership

- **AC-36** Given a Ticket belongs to the selected Requester, when the Requester opens the Ticket, then the Ticket Detail screen displays the Ticket information and its active Attachment metadata.

- **AC-37** Given the Ticket Detail screen is opened, when the Ticket information is displayed, then the Ticket fields are presented as read-only and the screen does not provide Lab 3 or IT Staff workflow controls.

- **AC-38** Given Requester A is selected, when Requester A opens a Ticket owned by Requester B directly through its Ticket ID, then the API rejects the request and does not return Requester B's Ticket data.

- **AC-39** Given Requester A is selected, when Requester A attempts to access an Attachment belonging to Requester B's Ticket, then the API rejects the request and does not return the Attachment.

- **AC-40** Given a requested Ticket does not exist, when the Ticket Detail API is called, then the API returns a safe not-found response.

### Attachment Retrieval and Removal

- **AC-41** Given an active Attachment belongs to the selected Requester's Ticket, when the Requester requests its metadata, then the API returns the Attachment metadata.

- **AC-42** Given an active Attachment belongs to the selected Requester's Ticket, when the Requester downloads it, then the stored Attachment contents are returned.

- **AC-43** Given an Attachment has been soft-removed, when the Requester attempts to download or preview it, then the Attachment is unavailable.

- **AC-44** Given an active Attachment belongs to the selected Requester's Ticket, when the Requester confirms its removal with the required removal reason, then the Attachment is soft-removed rather than physically deleted.

- **AC-45** Given an Attachment has been soft-removed, when the Ticket's active Attachment list is loaded, then the removed Attachment is excluded from the active Attachment list.

- **AC-46** Given an Attachment has been soft-removed, when its retained metadata is inspected through the permitted removal/history representation, then the Attachment record and required removal metadata remain stored.

- **AC-47** Given an Attachment belongs to another Requester's Ticket, when the current Requester attempts to remove it, then the API rejects the operation and the Attachment remains unchanged.

### Failure and State Preservation

- **AC-48** Given a reference-data API fails while Create Ticket is loading, when the failure is received, then the UI displays a safe error state and does not present incomplete reference data as valid selections.

- **AC-49** Given a Ticket-list request is loading, when the Requester views My Tickets, then a loading state is displayed and the UI does not incorrectly display the result as empty.

- **AC-50** Given a Ticket Detail request is loading, when the Requester opens a Ticket, then a loading state is displayed until the request succeeds or fails.

- **AC-51** Given an API operation fails after the Requester has entered data that can safely be retained, when the failure is displayed, then the retained data remains available for retry rather than being silently discarded.

### Responsive and Accessibility Behavior

- **AC-52** Given the application is displayed at a desktop viewport of at least 992 px, when the Create Ticket, My Tickets, or Ticket Detail screen is rendered, then the layout follows the desktop responsive specification without clipped or overlapping content.

- **AC-53** Given the application is displayed at a tablet viewport between 768 px and 991 px, when the required screens are rendered, then the layout remains usable and provides sufficient space for Summary and Description.

- **AC-54** Given the application is displayed at a mobile viewport below 768 px, when the required screens are rendered, then fields stack appropriately, controls remain touch-friendly, and the page does not require horizontal scrolling.

- **AC-55** Given any required screen is rendered at a supported viewport, when validation messages, buttons, filters, pagination controls, or Attachment names are displayed, then none are clipped, overlapped, hidden, or unreadable.

- **AC-56** Given a Requester navigates the application using a keyboard, when they move through the interactive controls, then all required controls can be reached and visible focus indicators are provided.

- **AC-57** Given an icon-only control is present, when the Requester focuses or interacts with it, then the control provides an accessible label and tooltip describing its action.

- **AC-58** Given a required form field is displayed, when the field is required, then its required state is visibly indicated and its validation message is displayed near the field when validation fails.

- **AC-59** Given the Create Ticket, My Tickets, or Ticket Detail screen is rendered, when the user views the interface, then it conforms to the approved Zen Green UI specification, including the defined field states, button hierarchy, badges, spacing, and responsive behavior.

## 10. Definition of Done

The Lab 2 product increment is considered complete only when all applicable items below are satisfied.

### Scope and Functionality

- [ ] All approved Lab 2 functionality is implemented.
- [ ] Development Requester Selection works using seeded active Requesters.
- [ ] The selected Requester is correctly used as the current testing context.
- [ ] Requester switching reloads requester-specific data correctly.
- [ ] Ticket creation works with all required fields and defined validation rules.
- [ ] Backend-generated Ticket Numbers are unique and displayed after successful creation.
- [ ] Newly created Tickets begin with Current Status `New`.
- [ ] My Tickets supports requester ownership, search, filtering, sorting, and pagination.
- [ ] Requester Ticket Detail displays the required Ticket information as read-only.
- [ ] Attachments can be added, retrieved, downloaded, and soft-removed according to the defined rules.
- [ ] Ownership checks prevent a Requester from accessing or modifying another Requester's Tickets or Attachments.
- [ ] Authentication, IT Staff workflow, comments, internal notes, Actions Taken, and later Ticket lifecycle operations have not been added to the Lab 2 scope.

### Data and API

- [ ] The PostgreSQL schema implements the approved Ticket, Development Requester, Category, Related System, and Attachment models.
- [ ] Required relationships, foreign keys, unique constraints, indexes, enums/reference data, timestamps, and soft-removal fields are implemented as specified.
- [ ] Seed data is safe to run repeatedly without creating duplicate records.
- [ ] Required active and inactive Development Requesters and reference data are available.
- [ ] All documented REST API endpoints are implemented.
- [ ] API request and response shapes conform to `api-spec.md`.
- [ ] Backend validation is enforced independently of frontend validation.
- [ ] API ownership checks are enforced server-side.
- [ ] API success, validation, missing-resource, ownership, attachment, conflict, and unexpected-error responses conform to the documented contract.
- [ ] API errors do not expose stack traces, database errors, filesystem paths, or other internal implementation details.

### Validation and Failure Handling

- [ ] Required fields and all documented validation limits are enforced.
- [ ] Invalid frontend input produces field-level validation feedback where applicable.
- [ ] Invalid API input is rejected by backend validation.
- [ ] Duplicate Ticket submission is prevented according to the defined rules.
- [ ] Ticket creation failures do not leave unintended partial data.
- [ ] Attachment upload failures follow the documented transaction or compensation behavior.
- [ ] Failed API requests preserve user-entered data where the specification requires it.
- [ ] Loading, empty, no-results, and failure states are implemented for the required screens.
- [ ] Removed Attachments cannot be downloaded or previewed.

### UI and Responsive Behavior

- [ ] Create Ticket, My Tickets, and Requester Ticket Detail conform to `ui-spec.md`.
- [ ] The Development Requester Selection screen conforms to the specified UI behavior.
- [ ] Zen Green theme tokens and reusable UI conventions are applied consistently.
- [ ] Required fields, read-only fields, validation messages, buttons, badges, and states use the specified presentation rules.
- [ ] Submit controls display a busy state and prevent interaction while processing.
- [ ] Required success states clearly communicate the generated Ticket Number and next action.
- [ ] Desktop layout works correctly at widths of at least 992 px.
- [ ] Tablet layout works correctly from 768–991 px.
- [ ] Mobile layout works correctly below 768 px.
- [ ] No supported viewport has clipped labels, overlapping content, hidden controls, unreadable Attachment names, or unintended horizontal scrolling.
- [ ] Keyboard users can reach all required interactive controls.
- [ ] Visible focus indicators are maintained.
- [ ] Icon-only controls have accessible labels and tooltips.
- [ ] The UI does not rely on color alone to communicate validation, warning, success, status, or priority.

### Testing

- [ ] Planned unit tests are implemented and passing.
- [ ] Planned API/integration tests are implemented and passing.
- [ ] Planned UI component tests are implemented and passing.
- [ ] Planned UI style tests are implemented and passing.
- [ ] Planned responsive tests are implemented and passing.
- [ ] Required end-to-end tests are implemented and passing.
- [ ] Every Acceptance Criterion in this specification maps to at least one planned test.
- [ ] Every planned automated test has an actual test-file path documented in `tests.md`.
- [ ] No required test is skipped, disabled, commented out, or ignored.
- [ ] Tests cover happy paths, validation failures, boundaries, ownership failures, API failures, loading states, empty states, requester switching, and Attachment lifecycle behavior.
- [ ] Final tests pass from the documented commands in the final `main` branch.

### Documentation and Review

- [ ] `specification.md` reflects the final approved behavior.
- [ ] `tests.md` reflects the final planned and implemented test coverage.
- [ ] `ui-spec.md` reflects the implemented UI behavior and visual rules.
- [ ] `api-spec.md` reflects the implemented API contract.
- [ ] Any implementation decision that changes the approved specification is documented and approved before being treated as complete.
- [ ] README setup and test instructions remain current.
- [ ] The implementation has been reviewed against every Acceptance Criterion.
- [ ] No known required functionality remains incomplete.
- [ ] The final implementation, tests, data model, API, UI, validation, responsive behavior, and documentation are consistent with one another.

### Completion Evidence

The implementation may be reported as complete only when:

1. All applicable Definition of Done items are satisfied.
2. All Acceptance Criteria have corresponding test evidence.
3. All required automated tests pass.
4. The implemented application conforms to the approved specification documents.
5. Required success, failure, boundary, ownership, empty, loading, and responsive states have been verified.
6. The final `main` branch contains the reviewed and tested implementation.

## 11. Assumptions and Decisions

- **AD-01 (Requester Cold Start)**: Cold-start without an active requester selection will display an empty state card in the main view directing the user to the header selector rather than a blocking modal overlay.
- **AD-02 (Dirty Form Context Switch)**: A confirmation dialog will protect users from losing unsaved ticket input when switching the active Development Requester during creation.
- **AD-03 (Post-Creation Navigation)**: Upon successful ticket creation, the UI will redirect directly to the newly created ticket's detail view (`/tickets/:id`) with a floating success toast containing the official Ticket Number.
- **AD-04 (Attachment Validation & Deletion UX)**: The attachment staging area will display a live counter (`X / 5 files`) with instant client-side file size and format validation. Soft-deleting an existing attachment requires a confirmation dialog.
- **AD-05 (Table Header Sorting)**: Table sorting is triggered by clicking column headers, cycling `Not Applied` → `Sorted` → `Reverse Sorted` → `Not Applied`, resetting other active column sorts on selection.
- **AD-06 (Rate Limiting & Validation Feedback)**: The submission button will enforce a client-side 15-second cooldown state post-submission. Description fields with fewer than 20 characters will trigger red borders and inline helper text.
- **AD-07 (Badge Styling)**: Status `New` uses a pale Zen Green badge; priorities use distinct semantic badges (Urgent: Coral/Red, High: Amber, Medium: Blue/Yellow, Low: Slate Gray).