# Lab 2 — Implementation Plan
**TokTickIT · Requester Ticketing MVP with UI Foundation**

> Each feature below is scoped to be a self-contained, peer-reviewable Pull Request.
> A feature is testable once it **and every feature listed under its prerequisites** are merged.
> **Note:** This implementation plan is written by Claude model, so if you are other than Claude model, you don't have to follow it exactly, just make sure the specifications are met and code is clean and follow the standard coding practices. This is just a plan to get you started.

---

## Current Baseline (Lab 1, already merged)

| What exists | Where |
|---|---|
| Prisma `Category` model + `GET /api/categories` | `server/src/app.ts`, `prisma/schema.prisma` |
| Category seed (4 rows, idempotent) | `prisma/seed.ts` |
| `GET /api/health` | `server/src/app.ts` |
| Vite + React scaffold (Bootstrap, plain `App.tsx`) | `client/src/` |

---

## Feature List

### F-01 · Data Model & Seed — Full Schema + Reference Data
**Prerequisites:** none (builds on Lab 1 schema)

Expand the Prisma schema and seed to the full Lab 2 data model.

**Scope:**
- Add `isActive` + `updatedAt` to the existing `Category` model
- New models: `Requester`, `RelatedSystem`, `Ticket`, `Attachment`
- All indexes from §7.6 of the spec (`@@index`, `@@unique`)
- `Attachment.fileData` stored as `@db.ByteA`
- Expand `prisma/seed.ts`:
  - Upsert 4 active + 1 inactive `Requester` (BR-34)
  - Upsert ≥ 6 `RelatedSystem` rows (BR-33)
  - Upsert 4 `Category` rows (BR-32) — keep existing, add `isActive`/`updatedAt`
- All upserts remain idempotent (BR-35)

**Testable when F-01 is done:**
- `npx prisma migrate dev` succeeds without errors
- `npm run prisma:seed` runs twice without errors or duplicate rows
- DB inspection shows correct row counts and field values

**Branch:** `feature/lab02-01-schema-and-seed`

---

### F-02 · Reference Data APIs — `GET /api/requesters` + `GET /api/related-systems`
**Prerequisites:** F-01

Add the two remaining reference-data endpoints so the frontend can populate selectors.

**Scope:**
- `GET /api/requesters` — returns only `isActive = true` requesters (FR-02, BR-04), ordered by `id asc`, shape: `{ id, name, email, department }`
- `GET /api/related-systems` — returns only `isActive = true` systems (FR-32), ordered by `id asc`, shape: `{ id, name, description }`
- Update existing `GET /api/categories` to filter `isActive = true` and include `updatedAt` field
- All three endpoints return `500` with a safe error envelope on DB failure (§8.3)
- API integration tests for all three endpoints:
  - `200` happy path with correct shape
  - `500` safe error handling

**Testable when F-02 is done:**
- `GET /api/requesters` returns 4 active requesters (Eve is excluded)
- `GET /api/related-systems` returns ≥ 6 systems
- `GET /api/categories` returns 4 active categories

**Branch:** `feature/lab02-02-reference-data-apis`

---

### F-03 · UI Foundation — Zen Green Design System + Application Shell
**Prerequisites:** none (parallel to F-01/F-02, but should be merged after F-01)

Replace the Lab 1 Bootstrap scaffold with the Zen Green design system and a proper app shell.

**Scope:**
- Global CSS (`client/src/index.css`): all design tokens from §6.1 (colors, typography, spacing, shadows, radii)
- Google Fonts import (`Inter` or `Outfit`)
- Reusable CSS classes / component stubs: badge, card/surface, form field (editable vs read-only), error text, loading spinner, empty-state, toast notification
- Application shell component: top navbar with "TokTickIT" wordmark + placeholder for selected Requester display + "Change Requester" button slot
- React Router v6 setup with routes: `/` (requester selector), `/tickets` (My Tickets), `/tickets/new` (Create Ticket), `/tickets/:id` (Ticket Detail)
- Responsive layout skeleton: desktop ≥992 px, tablet 768–991 px, mobile <768 px
- All focus indicators and keyboard tab order wired up (FR-38)
- No backend calls yet — static shell only

**Testable when F-03 is done:**
- Visiting `http://localhost:5173/` renders the styled shell (not Bootstrap default)
- All four routes render a placeholder page without errors
- Resize viewport through desktop/tablet/mobile breakpoints — no overflow or clipped content
- Tab key reaches all interactive controls visually

**Branch:** `feature/lab02-03-ui-foundation`

--- NOTE : This is where i realized that i have been writing my branches in wrong names for previous features as well but it's too late to change them now since i have already committed and pushed them to github.

### F-04 · Development Requester Selector
**Prerequisites:** F-02 (API), F-03 (shell)

Implement the Requester Selection screen and persist the active requester in React context for the rest of the app.

**Scope:**
- `RequesterContext` (React Context + Provider): stores `selectedRequester`, exposes `setSelectedRequester`
- Requester Selection screen (`/`):
  - Loads `GET /api/requesters` on mount
  - Handles loading spinner, empty state (no active requesters → Continue disabled, AC-02), API failure safe state (AC-03)
  - Dropdown lists only active requesters (AC-04)
  - "Continue" button → sets context, navigates to `/tickets`
- App shell shows selected requester name + "Change Requester" button (FR-03)
- "Change Requester" → navigates back to `/`, clears context
- Guard: any route under `/tickets/*` redirects to `/` if no requester is selected (AC-07)
- Dirty-form guard hook placeholder (wired in F-07)
- Requester switch reloads requester-scoped data (FR-05): implemented via context change triggering React Query invalidation (or equivalent)
- **Context-switch rules from BR-06/07/08** are enforced in subsequent features; the guard hook is the mechanism wired here

**Testable when F-04 is done:**
- Open app → Requester Selection screen shows 4 names
- Select "Alice Chen", click Continue → app shell shows "Alice Chen"
- Navigate to `/tickets` directly without selecting → redirected to `/`
- Click "Change Requester" → back to selection screen

**Branch:** `feature/lab02-04-requester-selector`

---

### F-05 · Ticket Creation — Backend (`POST /api/tickets`)
**Prerequisites:** F-01

Implement the Create Ticket API endpoint with full validation and atomic attachment handling.

**Scope:**
- `multer` (or equivalent) for `multipart/form-data` parsing
- `POST /api/tickets`:
  - Parse: `requesterId`, `categoryId`, `relatedSystemId`, `summary`, `description`, `requestedPriority?`, `attachments?` (files)
  - Backend validation (BR-11–15):
    - All required fields present → `422` with error envelope if missing
    - `summary` ≤ 255 chars
    - `description` ≥ 20 chars
    - `requestedPriority` one of `URGENT | HIGH | MEDIUM | LOW` if provided
    - `categoryId` and `relatedSystemId` exist and are active → `422`
    - `requesterId` exists and is active → `422`
  - Attachment validation per file (BR-26, BR-27):
    - MIME type: `image/jpeg`, `image/png`, `image/webp`, `application/pdf` only → `415`
    - File size ≤ 5 MB → `413`
    - Count ≤ 5 files → `422`
  - Rate limit (BR-18, BR-19): in-memory store (or DB field) tracking last creation timestamp per `requesterId`; reject with `429` if within 15 s
  - Generate `ticketNumber` (format `TICK-YYYY-NNNN`, globally unique, backend only — BR-01)
  - Atomic transaction: create `Ticket` + all `Attachment` rows inside a single `prisma.$transaction`; if any attachment step fails, the whole transaction rolls back (BR-29, FR-14)
  - Set `currentStatus = "New"` (BR-02)
  - Response `201` with full ticket object + attachment metadata
- Standard error envelope on all error responses (§8.3)
- API integration tests:
  - Happy path (no attachments, with attachments)
  - Each validation failure case
  - Rate limiting (429)
  - Atomic rollback on attachment failure

**Testable when F-05 is done:**
- `POST /api/tickets` with valid body → `201` with `ticketNumber`
- Missing `description` → `422`
- Description < 20 chars → `422`
- Bad MIME attachment → `415`
- Oversized attachment → `413`
- Two requests within 15 s for same requester → second returns `429`

**Branch:** `feature/lab02-05-create-ticket-api`

---

### F-06 · My Tickets API — `GET /api/tickets`
**Prerequisites:** F-01

Implement the paginated, filterable, sortable My Tickets list endpoint.

**Scope:**
- `GET /api/tickets`:
  - Required query param: `requesterId` (validate exists + active → `400`)
  - Optional filters: `search` (case-insensitive substring on `ticketNumber`, `summary`, `description` — BR-20), `status`, `priority`, `categoryId`, `relatedSystemId` (BR-21, BR-22)
  - Sorting (BR-23, BR-24):
    - `sortBy=priority`: primary `requestedPriority` (custom enum rank), secondary `currentStatus`, tertiary `ticketNumber`
    - `sortBy=status`: primary `currentStatus`, secondary `requestedPriority`, tertiary `ticketNumber`
    - `sortDirection=asc|desc` applies to all tiers
    - Default: `sortBy=priority`, `sortDirection=desc`
  - Pagination (BR-25): `page` (default 1), `pageSize` (10 | 25 | 50, default 10)
  - Response shape from §8.2: `{ data: [...], pagination: { page, pageSize, totalItems, totalPages, hasPreviousPage, hasNextPage } }`
  - Each ticket in `data`: `{ id, ticketNumber, summary, category: {id,name}, relatedSystem: {id,name}, requestedPriority, currentStatus, createdAt }`
  - Invalid query params → `400` with safe error envelope (AC-35)
- API integration tests:
  - Requester isolation (AC-25)
  - Keyword search (AC-29)
  - Each filter type (AC-30, AC-31)
  - Sort by priority + sort by status, both directions (AC-32)
  - Pagination page/pageSize combinations (AC-33, AC-34)
  - Invalid params (AC-35)

**Testable when F-06 is done:**
- `GET /api/tickets?requesterId=1` returns only Alice's tickets with pagination metadata
- Search, filters, and sort all function correctly via curl / test suite

**Branch:** `feature/lab02-06-my-tickets-api`

---

### F-07 · Ticket Creation — Frontend
**Prerequisites:** F-04 (requester context), F-05 (backend)

Implement the full Create Ticket screen.

**Scope:**
- Route `/tickets/new`
- On mount: fetch `GET /api/categories` and `GET /api/related-systems` to populate dropdowns
- Form fields (all from §6.2):
  - Category (required dropdown)
  - Related System (required dropdown)
  - Summary (required text, max 255)
  - Description (required textarea, min 20 chars, live char count hint)
  - Requested Priority (optional select: Urgent / High / Medium / Low)
- Attachment staging area:
  - Client-side file picker (JPG/JPEG/PNG/WEBP/PDF, max 5 MB, max 5 files)
  - Live counter `X / 5 files`
  - Instant client-side rejection with inline error for bad type or oversized file (AC-20, AC-21)
  - Remove staged file instantly without confirmation (AD-04)
- Frontend validation on submit before calling API: highlight invalid fields red (`#C53030`), inline error text below field (FR-09, BR-15 client layer)
- Submit:
  - Disable button + show busy state while in-flight (AC-16)
  - 15-second client-side cooldown after submission (AD-06, BR-18 UX layer)
  - `multipart/form-data` POST with `requesterId` from context
  - On `201`: navigate to `/tickets/:id` (new ticket), show Zen Green success toast with `ticketNumber` (AD-03, FR-13, AC-18)
  - On `422` / `413` / `415`: display field-level or banner error; preserve all form values (BR-16, BR-17)
  - On `429`: display non-technical "Please wait before submitting again" message (BR-19)
  - On network failure: preserve form values, show retry-friendly error (AC-17)
- Dirty-form context-switch guard (AD-02, BR-08): if requester changes while form has unsaved input, show confirmation dialog before discarding and switching

**Testable when F-07 is done:**
- Fill valid form → submit → redirect to detail page, toast shows ticket number
- Missing required field → error shown, API not called
- Description < 20 chars → red border + inline error
- Upload file > 5 MB or wrong type → instant rejection in staging area
- Change requester with dirty form → confirmation dialog appears

**Branch:** `feature/lab02-07-create-ticket-ui`

---

### F-08 · My Tickets — Frontend
**Prerequisites:** F-04 (requester context), F-06 (backend)

Implement the My Tickets list view.

**Scope:**
- Route `/tickets`
- On mount (and on requester switch — BR-06): fetch `GET /api/tickets?requesterId=...`
- Display table/card list: Ticket Number, Summary, Category, Related System, Priority badge, Status badge, Created Date
- Priority badges: Urgent = coral/red, High = amber, Medium = blue/yellow, Low = slate gray (AD-07)
- Status badge: New = pale Zen Green
- **Search bar**: debounced keyword search across `ticketNumber`, `summary`, `description` (FR-17) → resets to page 1
- **Filter dropdowns** (single-select per category, BR-22): Status, Priority, Category, Related System → each change resets to page 1
- **Table header sorting** (AD-05, BR-23, BR-24):
  - Clickable "Priority" and "Status" column headers
  - Cycle: Not Applied → Sorted → Reverse Sorted → Not Applied
  - Clicking a new header resets the other
  - Active header darkened with sort indicator arrow
- **Pagination bar**: Previous / page numbers / Next; Page Size selector (10/25/50, default 10); shows "Page X of Y, Z results" (FR-20, BR-25)
- **UI states**:
  - Loading: skeleton rows or spinner
  - Empty list: meaningful empty-state card (AC-26, FR-34)
  - No-results: explicit no-results state with "Clear Filters" button (AC-27, FR-35)
  - API failure: safe error card without internal details (AC-28, FR-36)
- Row click → navigate to `/tickets/:id`
- On requester switch while on this page: reload with new requester (BR-06)

**Testable when F-08 is done:**
- Select Alice → My Tickets shows only Alice's tickets
- Type search term → list updates
- Apply Status filter → only matching tickets shown
- Click Priority header → sorts by priority ranking
- Navigate pages → correct page of results
- Empty requester → empty-state card shown
- Search with no results → no-results state + Clear Filters button

**Branch:** `feature/lab02-08-my-tickets-ui`

---

### F-09 · Ticket Detail & Ownership — Backend + Frontend
**Prerequisites:** F-05 (tickets exist), F-04 (requester context)

Implement the `GET /api/tickets/:id` endpoint and the read-only Ticket Detail screen.

**Backend scope:**
- `GET /api/tickets/:id`:
  - Required query param: `requesterId`
  - Returns full ticket detail: all fields + list of **active** (non-deleted) attachments with metadata (`fileName`, `fileSize`, `contentType`, `createdAt`) — FR-27
  - `403 Forbidden` if ticket `requesterId` ≠ query `requesterId` (BR-10, FR-24, AC-38)
  - `404 Not Found` if ticket doesn't exist (AC-40)
  - `500` safe error envelope on DB failure
- API integration tests: happy path, 403, 404

**Frontend scope:**
- Route `/tickets/:id`
- Fetch `GET /api/tickets/:id?requesterId=...` on mount
- Display all ticket fields as **read-only** with soft gray-green shading (`#F0F4F1`) on field areas (FR-23, AC-37)
- Status badge (pale Zen Green for "New"), Priority badge (semantic color)
- Active attachments section: list with file name, size, upload date, and download button (FR-27)
- "Back to My Tickets" breadcrumb/button → `/tickets`
- Error states: 403 → dedicated Forbidden view, 404 → Not Found view, loading spinner, API failure safe state
- On requester switch while on this page: navigate to `/tickets` of new requester (BR-07)

**Testable when F-09 is done:**
- Navigate to a ticket owned by selected requester → full detail displayed
- Navigate to ticket ID owned by another requester (via URL manipulation) → 403 view shown
- Navigate to non-existent ticket ID → 404 view shown
- Active attachments listed with metadata

**Branch:** `feature/lab02-09-ticket-detail`

---

### F-10 · Attachment Management — Add, Download & Soft-Remove
**Prerequisites:** F-09 (ticket detail screen exists)

Complete the full attachment lifecycle on the Ticket Detail screen.

**Backend scope:**
- `POST /api/tickets/:id/attachments` (FR-26):
  - Multipart: `requesterId` + single `file`
  - Ownership check → `403`
  - Count check: if ticket already has 5 active attachments → `409` (BR-28)
  - MIME validation → `415` (BR-26)
  - Size validation → `413` (BR-27)
  - Store binary in `fileData` (`bytea`), return `201` with metadata
- `GET /api/attachments/:id/download` (FR-28):
  - Ownership check → `403`
  - `isDeleted = true` → `404` (BR-31)
  - Stream binary with `Content-Type`, `Content-Disposition: attachment; filename=...`, `Content-Length` headers
- `DELETE /api/attachments/:id` (FR-29, FR-30):
  - `requesterId` in body or query
  - Ownership check → `403`
  - Already deleted → `404`
  - Sets `isDeleted = true` (BR-30) → `200 { data: { id, isDeleted: true } }`
- `GET /api/tickets/:id/attachments` (FR-27):
  - Returns only non-deleted attachments
  - Ownership check → `403`
- API integration tests for all four endpoints: happy paths, 403, 404, 409, 413, 415

**Frontend scope (on Ticket Detail screen):**
- "Add Attachment" button → file picker (same MIME/size rules, client-side pre-validation)
- Live counter update (X / 5) after successful upload
- "Download" button per attachment → triggers `GET /api/attachments/:id/download`
- "Remove" button per attachment → confirmation dialog (AD-04) → `DELETE /api/attachments/:id` → attachment disappears from list
- Error feedback for failed uploads (409 "Maximum 5 attachments", 413 "File too large", 415 "File type not allowed")

**Testable when F-10 is done:**
- Add a new attachment to an existing ticket → appears in list
- Attempt to add a 6th attachment → 409 error shown
- Download an attachment → file downloads in browser
- Soft-remove an attachment → confirmation shown, then attachment disappears
- Attempt to download a removed attachment URL directly → 404 returned
- Upload oversized file → 413 error shown in UI

**Branch:** `feature/lab02-10-attachment-lifecycle`

---

## Implementation Order Summary

```
F-01 (Schema)
    ├── F-02 (Reference APIs)
    │       └── F-04 (Requester Selector) ← also needs F-03
    ├── F-05 (Create Ticket API)
    │       └── F-07 (Create Ticket UI)   ← also needs F-04
    └── F-06 (My Tickets API)
            └── F-08 (My Tickets UI)      ← also needs F-04

F-03 (UI Foundation) → feeds F-04, F-07, F-08, F-09, F-10

F-05 + F-04 → F-09 (Ticket Detail)
F-09 → F-10 (Attachment Lifecycle)
```

**Suggested merge order:** F-01 → F-03 → F-02 → F-04 → F-05 → F-06 → F-07 → F-08 → F-09 → F-10

---

## Acceptance Criteria Coverage

| Feature | ACs covered |
|---|---|
| F-01 | BR-32–35 (seed/schema) |
| F-02 | AC-01–04 (partial), FR-31–32 |
| F-03 | FR-33–38, §6.1 tokens |
| F-04 | AC-01–07, BR-04–08 |
| F-05 | AC-08–15, AC-19–23, BR-01–02, BR-11–19, BR-26–29 |
| F-06 | AC-25, AC-29–35, BR-20–25 |
| F-07 | AC-08, AC-12–18, AC-19–23 (UI layer) |
| F-08 | AC-25–35 (UI layer) |
| F-09 | AC-36–40, BR-09–10 |
| F-10 | AC-24, AC-41–47, BR-26–31 |
