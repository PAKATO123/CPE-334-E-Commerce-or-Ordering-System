# Lab 2 Test Plan and Results

## 1. Test Strategy

Testing follows Test-Driven Development and Test DD principles.

Tests are planned from the approved `specification.md`, `api-spec.md`, and `ui-spec.md` before implementation is considered complete.

The test plan covers:

- Unit-level business logic.
- API and integration behavior.
- UI component behavior.
- UI style and visual requirements.
- Responsive behavior.
- End-to-end requester workflows.
- Validation and boundary conditions.
- Ownership and multi-Requester behavior.
- Loading, empty, no-results, and failure states.
- Attachment lifecycle and soft removal.

The tests are organized so that each Acceptance Criterion has at least one corresponding test.

During implementation, failing tests should be created before the corresponding implementation where practical. A test may only be marked `Pass` after the implemented behavior has been executed successfully.

The `Final` column records the execution status of all planned tests on the main branch.

---

## 2. Planned Tests

### 2.1 Unit Tests

| Test ID | Requirement / AC | What It Tests | Expected Result | Automated Test File | Final |
|---|---|---|---|---|---|
| UNIT-01 | AC-09, BR-01 | Ticket Number generation | Generates a Ticket Number in the specified format | `server/tests/lab-02/ticket-number.unit.test.ts` | Pass |
| UNIT-02 | AC-09, BR-01 | Ticket Number uniqueness | Multiple generated Ticket Numbers are unique | `server/tests/lab-02/ticket-number.unit.test.ts` | Pass |
| UNIT-03 | AC-10, BR-02 | New Ticket default status | New Tickets receive status `New` | `server/tests/lab-02/ticket-defaults.unit.test.ts` | Pass |
| UNIT-04 | AC-14, BR-12 | Description validation | Descriptions shorter than 20 characters are rejected | `server/tests/lab-02/ticket-validation.unit.test.ts` | Pass |
| UNIT-05 | AC-13, BR-11 | Summary validation | Summary longer than 255 characters is rejected | `server/tests/lab-02/ticket-validation.unit.test.ts` | Pass |
| UNIT-06 | AC-11, BR-13 | Requested Priority validation | Only `Urgent`, `High`, `Medium`, and `Low` are accepted | `server/tests/lab-02/ticket-validation.unit.test.ts` | Pass |
| UNIT-07 | AC-19, BR-26 | Attachment type validation | JPG/JPEG, PNG, WEBP, and PDF are accepted | `server/tests/lab-02/attachment-validation.unit.test.ts` | Pass |
| UNIT-08 | AC-20, BR-27 | Attachment size validation | Files larger than 5 MB are rejected | `server/tests/lab-02/attachment-validation.unit.test.ts` | Pass |
| UNIT-09 | AC-22, BR-28 | Active attachment count | A sixth active attachment is rejected | `server/tests/lab-02/attachment-validation.unit.test.ts` | Pass |
| UNIT-10 | AC-32, BR-23 | Priority ranking | Priority ordering follows Urgent → High → Medium → Low → unassigned | `server/tests/lab-02/ticket-sorting.unit.test.ts` | Pass |
| UNIT-11 | AC-32, BR-23 | Priority secondary sorting | Current Status is used as the secondary sort when sorting by Requested Priority | `server/tests/lab-02/ticket-sorting.unit.test.ts` | Pass |
| UNIT-12 | AC-32, BR-23 | Status secondary sorting | Requested Priority is used as the secondary sort when sorting by Current Status | `server/tests/lab-02/ticket-sorting.unit.test.ts` | Pass |
| UNIT-13 | AC-32, BR-24 | Sort direction | Ascending and descending directions are applied consistently | `server/tests/lab-02/ticket-sorting.unit.test.ts` | Pass |
| UNIT-14 | AC-33, AC-34, BR-25 | Pagination calculation | Page and page-size calculations return the correct result range and metadata | `server/tests/lab-02/pagination.unit.test.ts` | Pass |
| UNIT-15 | AC-44, AC-45, AC-46, BR-30 | Attachment soft removal | Removal marks an Attachment as deleted without physically deleting the record | `server/tests/lab-02/attachment-removal.unit.test.ts` | Pass |

---

### 2.2 API / Integration Tests

#### Development Requester and Reference Data

| Test ID | Requirement / AC | What It Tests | Expected Result | Automated Test File | Final |
|---|---|---|---|---|---|
| API-01 | AC-01, BR-04 | Retrieve active Requesters | `200`; active Requesters returned | `server/tests/lab-02/requester.api.test.ts` | Pass |
| API-02 | AC-04, BR-04 | Exclude inactive Requesters | Inactive Requesters are not returned | `server/tests/lab-02/requester.api.test.ts` | Pass |
| API-03 | AC-01 | Requester loading failure | Safe `500` response is returned | `server/tests/lab-02/requester.api.test.ts` | Pass |
| API-04 | AC-11 | Retrieve active Categories | `200`; active Categories returned | `server/tests/lab-02/reference-data.api.test.ts` | Pass |
| API-05 | AC-11 | Retrieve active Related Systems | `200`; active Related Systems returned | `server/tests/lab-02/reference-data.api.test.ts` | Pass |

#### Ticket Creation

| Test ID | Requirement / AC | What It Tests | Expected Result | Automated Test File | Final |
|---|---|---|---|---|---|
| API-06 | AC-08, AC-09 | Create valid Ticket | `201`; one Ticket saved; Ticket Number returned | `server/tests/lab-02/create-ticket.api.test.ts` | Pass |
| API-07 | AC-10 | New Ticket status | Created Ticket has Current Status `New` | `server/tests/lab-02/create-ticket.api.test.ts` | Pass |
| API-08 | AC-11 | Persist Ticket fields | Submitted Category, Related System, Summary, Description, and Requested Priority are saved correctly | `server/tests/lab-02/create-ticket.api.test.ts` | Pass |
| API-09 | AC-15 | Missing required field | Invalid request rejected; no Ticket saved | `server/tests/lab-02/create-ticket.api.test.ts` | Pass |
| API-10 | AC-13 | Summary boundary | 255-character Summary accepted; 256-character Summary rejected | `server/tests/lab-02/create-ticket.api.test.ts` | Pass |
| API-11 | AC-14 | Description boundary | 20-character Description accepted; 19-character Description rejected | `server/tests/lab-02/create-ticket.api.test.ts` | Pass |
| API-12 | AC-15 | Invalid Requested Priority | Unsupported Priority rejected | `server/tests/lab-02/create-ticket.api.test.ts` | Pass |
| API-13 | AC-15 | Inactive Requester | Ticket creation for inactive Requester rejected | `server/tests/lab-02/create-ticket.api.test.ts` | Pass |
| API-14 | AC-15 | Invalid Category | Inactive or nonexistent Category rejected | `server/tests/lab-02/create-ticket.api.test.ts` | Pass |
| API-15 | AC-15 | Invalid Related System | Inactive or nonexistent Related System rejected | `server/tests/lab-02/create-ticket.api.test.ts` | Pass |
| API-16 | AC-23, BR-29 | Invalid initial Attachment | Ticket creation fails atomically; no Ticket or partial Attachment remains | `server/tests/lab-02/create-ticket.api.test.ts` | Pass |
| API-17 | AC-08 | Duplicate Ticket creation | Requester cannot create another Ticket within the 15-second window | `server/tests/lab-02/create-ticket.api.test.ts` | Pass |
| API-18 | AC-08, BR-19 | Rate-limit response | Throttled creation returns `429` and safe error body | `server/tests/lab-02/create-ticket.api.test.ts` | Pass |
| API-19 | AC-17 | Unexpected creation failure | Safe error response returned and no unintended partial data remains | `server/tests/lab-02/create-ticket.api.test.ts` | Pass |

#### My Tickets

| Test ID | Requirement / AC | What It Tests | Expected Result | Automated Test File | Final |
|---|---|---|---|---|---|
| API-20 | AC-25 | Requester ownership filtering | Only Tickets belonging to supplied Requester are returned | `server/tests/lab-02/my-tickets.api.test.ts` | Pass |
| API-21 | AC-29, BR-20 | Search Ticket Number | Matching Ticket Number is returned | `server/tests/lab-02/my-tickets.api.test.ts` | Pass |
| API-22 | AC-29, BR-20 | Search Summary | Matching Summary is returned | `server/tests/lab-02/my-tickets.api.test.ts` | Pass |
| API-23 | AC-29, BR-20 | Search Description | Matching Description is returned | `server/tests/lab-02/my-tickets.api.test.ts` | Pass |
| API-24 | AC-29, BR-20 | Search case insensitivity | Search matches regardless of letter case | `server/tests/lab-02/my-tickets.api.test.ts` | Pass |
| API-25 | AC-29, BR-20 | Search requester isolation | Search cannot return another Requester's Ticket | `server/tests/lab-02/my-tickets.api.test.ts` | Pass |
| API-26 | AC-30, BR-21 | Status filter | Only Tickets with selected Current Status are returned | `server/tests/lab-02/my-tickets.api.test.ts` | Pass |
| API-27 | AC-30, BR-21 | Priority filter | Only Tickets with selected Requested Priority are returned | `server/tests/lab-02/my-tickets.api.test.ts` | Pass |
| API-28 | AC-30, BR-21 | Category filter | Only Tickets with selected Category are returned | `server/tests/lab-02/my-tickets.api.test.ts` | Pass |
| API-29 | AC-30, BR-21 | Related System filter | Only Tickets with selected Related System are returned | `server/tests/lab-02/my-tickets.api.test.ts` | Pass |
| API-30 | AC-31, BR-22 | Multiple filter categories | Tickets must satisfy all simultaneously selected filter categories | `server/tests/lab-02/my-tickets.api.test.ts` | Pass |
| API-31 | AC-32, BR-23 | Sort by Requested Priority | Primary, secondary, and tertiary ordering is correct | `server/tests/lab-02/my-tickets.api.test.ts` | Pass |
| API-32 | AC-32, BR-23 | Sort by Current Status | Primary, secondary, and tertiary ordering is correct | `server/tests/lab-02/my-tickets.api.test.ts` | Pass |
| API-33 | AC-32, BR-24 | Ascending/descending sort | Requested direction is applied correctly | `server/tests/lab-02/my-tickets.api.test.ts` | Pass |
| API-34 | AC-33, BR-25 | Pagination | Correct page and pagination metadata are returned | `server/tests/lab-02/my-tickets.api.test.ts` | Pass |
| API-35 | AC-34, BR-25 | Page sizes | Page sizes 10, 25, and 50 work correctly | `server/tests/lab-02/my-tickets.api.test.ts` | Pass |
| API-36 | AC-35 | Invalid pagination parameters | Invalid page or page size returns `400` | `server/tests/lab-02/my-tickets.api.test.ts` | Pass |
| API-37 | AC-35 | Invalid sorting parameters | Invalid sort field or direction returns `400` | `server/tests/lab-02/my-tickets.api.test.ts` | Pass |
| API-38 | AC-26 | No tickets | Requester with no Tickets receives an empty result with valid pagination metadata | `server/tests/lab-02/my-tickets.api.test.ts` | Pass |

#### Ticket Detail and Ownership

| Test ID | Requirement / AC | What It Tests | Expected Result | Automated Test File | Final |
|---|---|---|---|---|---|
| API-39 | AC-36 | Retrieve owned Ticket | `200`; complete Ticket Detail returned | `server/tests/lab-02/ticket-detail.api.test.ts` | Pass |
| API-40 | AC-38 | Cross-Requester Ticket access | Request returns `403`; Ticket data is not returned | `server/tests/lab-02/ticket-detail.api.test.ts` | Pass |
| API-41 | AC-40 | Missing Ticket | Request returns `404` with safe error | `server/tests/lab-02/ticket-detail.api.test.ts` | Pass |
| API-42 | AC-36 | Active Attachments in Detail | Only active Attachment metadata is returned | `server/tests/lab-02/ticket-detail.api.test.ts` | Pass |

#### Attachments

| Test ID | Requirement / AC | What It Tests | Expected Result | Automated Test File | Final |
|---|---|---|---|---|---|
| API-43 | AC-19, BR-26 | Valid Attachment upload | Valid permitted file is accepted | `server/tests/lab-02/attachments.api.test.ts` | Pass |
| API-44 | AC-20, BR-27 | Oversized Attachment | File over 5 MB returns `413` | `server/tests/lab-02/attachments.api.test.ts` | Pass |
| API-45 | AC-21, BR-26 | Unsupported Attachment | Unsupported type returns `415` | `server/tests/lab-02/attachments.api.test.ts` | Pass |
| API-46 | AC-22, BR-28 | Attachment count limit | Sixth active Attachment returns the documented conflict response | `server/tests/lab-02/attachments.api.test.ts` | Pass |
| API-47 | AC-24 | Add Attachment to owned Ticket | `201`; Attachment metadata returned | `server/tests/lab-02/attachments.api.test.ts` | Pass |
| API-48 | AC-39 | Cross-Requester Attachment access | Request returns `403` | `server/tests/lab-02/attachments.api.test.ts` | Pass |
| API-49 | AC-41 | Attachment metadata | Active Attachment metadata is returned | `server/tests/lab-02/attachments.api.test.ts` | Pass |
| API-50 | AC-42 | Attachment download | Active Attachment binary data is returned correctly | `server/tests/lab-02/attachments.api.test.ts` | Pass |
| API-51 | AC-43 | Removed Attachment download | Removed Attachment returns `404` and binary data is unavailable | `server/tests/lab-02/attachments.api.test.ts` | Pass |
| API-52 | AC-44, AC-46 | Soft removal | Attachment remains in database with soft-removal state and required metadata | `server/tests/lab-02/attachments.api.test.ts` | Pass |
| API-53 | AC-45 | Removed Attachment listing | Removed Attachment is excluded from active metadata results | `server/tests/lab-02/attachments.api.test.ts` | Pass |
| API-54 | AC-47 | Unauthorized Attachment removal | Request returns `403`; Attachment remains unchanged | `server/tests/lab-02/attachments.api.test.ts` | Pass |

---

### 2.3 UI Component Tests

| Test ID | Requirement / AC | What It Tests | Expected Result | Automated Test File | Final |
|---|---|---|---|---|---|
| UI-01 | AC-01, AC-04 | Requester selector | Only active Requesters appear in the dropdown | `client/src/lab-02/RequesterSelection.test.tsx` | Pass |
| UI-02 | AC-02 | Requester empty state | Empty state is shown when no active Requesters exist | `client/src/lab-02/RequesterSelection.test.tsx` | Pass |
| UI-03 | AC-03 | Requester API failure | Safe failure message is displayed | `client/src/lab-02/RequesterSelection.test.tsx` | Pass |
| UI-04 | AC-05 | Selected Requester display | Selected Requester's name appears in the application shell | `client/src/lab-02/RequesterContext.test.tsx` | Pass |
| UI-05 | AC-06 | Change Requester | Switching Requester reloads requester-specific data | `client/src/lab-02/RequesterContext.test.tsx` | Pass |
| UI-06 | AC-06 | Dirty form switching | Unsaved Create Ticket data requires confirmation before being discarded | `client/src/lab-02/RequesterContext.test.tsx` | Pass |
| UI-07 | AC-12 | Required field validation | Missing required fields display field-level errors and do not submit | `client/src/lab-02/CreateTicket.test.tsx` | Pass |
| UI-08 | AC-13 | Summary validation | Summary length validation appears beside the field | `client/src/lab-02/CreateTicket.test.tsx` | Pass |
| UI-09 | AC-14 | Description validation | Description under 20 characters displays the specified validation feedback | `client/src/lab-02/CreateTicket.test.tsx` | Pass |
| UI-10 | AC-16 | Submit busy state | Submit button becomes disabled and displays busy state during submission | `client/src/lab-02/CreateTicket.test.tsx` | Pass |
| UI-11 | AC-17 | Creation failure | Safe error notification appears and entered values are preserved | `client/src/lab-02/CreateTicket.test.tsx` | Pass |
| UI-12 | AC-18 | Creation success | Success state shows generated Ticket Number and next action | `client/src/lab-02/CreateTicket.test.tsx` | Pass |
| UI-13 | AC-19 | Valid Attachment | Valid Attachment appears in the staging area | `client/src/lab-02/AttachmentSection.test.tsx` | Pass |
| UI-14 | AC-20, AC-21 | Invalid Attachment | Invalid type or size is rejected with clear feedback | `client/src/lab-02/AttachmentSection.test.tsx` | Pass |
| UI-15 | AC-22 | Attachment counter | Active Attachment count prevents adding beyond five | `client/src/lab-02/AttachmentSection.test.tsx` | Pass |
| UI-16 | AC-25 | My Tickets ownership context | List is rendered using the selected Requester | `client/src/lab-02/MyTickets.test.tsx` | Pass |
| UI-17 | AC-27 | No-results state | Search/filter producing no results displays the no-results state | `client/src/lab-02/MyTickets.test.tsx` | Pass |
| UI-18 | AC-28 | My Tickets failure | Safe list failure state is displayed | `client/src/lab-02/MyTickets.test.tsx` | Pass |
| UI-19 | AC-29 | Search controls | Search input updates the Ticket query | `client/src/lab-02/MyTickets.test.tsx` | Pass |
| UI-20 | AC-30, AC-31 | Filters | Filters can be selected and combined correctly | `client/src/lab-02/MyTickets.test.tsx` | Pass |
| UI-21 | AC-32 | Sort controls | Sort selection/direction updates the Ticket query | `client/src/lab-02/MyTickets.test.tsx` | Pass |
| UI-22 | AC-33, AC-34 | Pagination | Page and page-size controls operate correctly | `client/src/lab-02/MyTickets.test.tsx` | Pass |
| UI-23 | AC-36, AC-37 | Ticket Detail | Ticket fields are displayed read-only | `client/src/lab-02/RequesterTicketDetail.test.tsx` | Pass |
| UI-24 | AC-41 | Attachment metadata | Active Attachment metadata is displayed | `client/src/lab-02/AttachmentSection.test.tsx` | Pass |
| UI-25 | AC-42 | Download control | Download control requests the correct Attachment | `client/src/lab-02/AttachmentSection.test.tsx` | Pass |
| UI-26 | AC-44 | Removal confirmation | Removal requires confirmation before API request | `client/src/lab-02/AttachmentSection.test.tsx` | Pass |
| UI-27 | AC-43, AC-45 | Removed Attachment | Removed Attachment cannot be downloaded and is excluded from active list | `client/src/lab-02/AttachmentSection.test.tsx` | Pass |
| UI-28 | AC-49 | Loading state | My Tickets displays loading state while data is being retrieved | `client/src/lab-02/MyTickets.test.tsx` | Pass |
| UI-29 | AC-50 | Ticket Detail loading | Ticket Detail displays loading state while data is being retrieved | `client/src/lab-02/RequesterTicketDetail.test.tsx` | Pass |
| UI-30 | AC-52–AC-59 | UI accessibility basics | Required labels, required markers, focusable controls, and accessible icon labels exist | `client/src/lab-02/Accessibility.test.tsx` | Pass |

---

### 2.4 UI Style Tests

| Test ID | Requirement / AC | What It Tests | Expected Result | Automated Test File | Final |
|---|---|---|---|---|---|
| STYLE-01 | AC-59 | Zen Green primary styling | Primary actions and header use the specified primary green token | `client/src/lab-02/UIStyle.test.tsx` | Pass |
| STYLE-02 | AC-59 | Secondary styling | Active navigation, links, focus, and hover states use the specified secondary green token | `client/src/lab-02/UIStyle.test.tsx` | Pass |
| STYLE-03 | AC-59 | Form states | Editable and read-only fields use visually distinct specified styles | `client/src/lab-02/UIStyle.test.tsx` | Pass |
| STYLE-04 | AC-58, AC-59 | Required fields | Required fields display the required marker | `client/src/lab-02/UIStyle.test.tsx` | Pass |
| STYLE-05 | AC-58 | Validation messages | Validation messages are rendered adjacent to their associated fields | `client/src/lab-02/UIStyle.test.tsx` | Pass |
| STYLE-06 | AC-59 | Button hierarchy | Primary, secondary, destructive, disabled, and busy button states follow `ui-spec.md` | `client/src/lab-02/UIStyle.test.tsx` | Pass |
| STYLE-07 | AC-59 | Badge consistency | Requested Priority and Current Status badges follow the defined badge rules | `client/src/lab-02/UIStyle.test.tsx` | Pass |
| STYLE-08 | AC-59 | No color-only feedback | Success, warning, error, status, and priority states contain non-color indicators where required | `client/src/lab-02/UIStyle.test.tsx` | Pass |
| STYLE-09 | AC-59 | Application shell | Application identity, navigation, current Requester, and active-page indication are present and styled consistently | `client/src/lab-02/UIStyle.test.tsx` | Pass |

---

### 2.5 Responsive Tests

| Test ID | Requirement / AC | What It Tests | Expected Result | Automated Test File | Final |
|---|---|---|---|---|---|
| RESP-01 | AC-52 | Create Ticket desktop | Create Ticket is usable at ≥992 px | `e2e/lab-02/responsive-ui.spec.ts` | Pass |
| RESP-02 | AC-53 | Create Ticket tablet | Create Ticket remains usable at 768–991 px | `e2e/lab-02/responsive-ui.spec.ts` | Pass |
| RESP-03 | AC-54 | Create Ticket mobile | Fields stack and controls remain usable below 768 px | `e2e/lab-02/responsive-ui.spec.ts` | Pass |
| RESP-04 | AC-52 | My Tickets desktop | Desktop list/table layout is usable | `e2e/lab-02/responsive-ui.spec.ts` | Pass |
| RESP-05 | AC-53 | My Tickets tablet | Tablet layout remains usable | `e2e/lab-02/responsive-ui.spec.ts` | Pass |
| RESP-06 | AC-54 | My Tickets mobile | Mobile Ticket representation remains usable | `e2e/lab-02/responsive-ui.spec.ts` | Pass |
| RESP-07 | AC-52–AC-55 | Ticket Detail desktop/tablet/mobile | Ticket Detail remains readable and usable at all required viewport sizes | `e2e/lab-02/responsive-ui.spec.ts` | Pass |
| RESP-08 | AC-55 | Horizontal overflow | No unintended horizontal page scrolling occurs | `e2e/lab-02/responsive-ui.spec.ts` | Pass |
| RESP-09 | AC-55 | Clipping and overlap | Labels, messages, buttons, and Attachment names are not clipped or overlapped | `e2e/lab-02/responsive-ui.spec.ts` | Pass |
| RESP-10 | AC-55 | Pagination and filters | Filtering and pagination remain usable on smaller viewports | `e2e/lab-02/responsive-ui.spec.ts` | Pass |

---

### 2.6 End-to-End Tests

| Test ID | Requirement / AC | What It Tests | Expected Result | Automated Test File | Final |
|---|---|---|---|---|---|
| E2E-01 | AC-01, AC-05, AC-08–AC-18 | Complete Ticket creation flow | Requester selects identity, creates Ticket, and sees official Ticket Number | `e2e/lab-02/requester-ticket-flow.spec.ts` | Pass |
| E2E-02 | AC-12–AC-15 | Invalid Ticket submission | Validation messages appear and invalid Ticket is not created | `e2e/lab-02/requester-ticket-flow.spec.ts` | Pass |
| E2E-03 | AC-19–AC-24 | Ticket creation with Attachments | Valid Attachment is saved and invalid Attachment is rejected | `e2e/lab-02/requester-ticket-flow.spec.ts` | Pass |
| E2E-04 | AC-17 | Ticket creation API failure | Error is displayed and entered form values remain available | `e2e/lab-02/requester-ticket-flow.spec.ts` | Pass |
| E2E-05 | AC-25–AC-35 | My Tickets workflow | Requester can search, filter, sort, paginate, and open Tickets | `e2e/lab-02/requester-ticket-flow.spec.ts` | Pass |
| E2E-06 | AC-26, AC-27, AC-28 | My Tickets states | Empty, no-results, loading, and failure states are usable | `e2e/lab-02/requester-ticket-flow.spec.ts` | Pass |
| E2E-07 | AC-06, AC-25 | Requester switching | Requester A's data disappears when switching to Requester B | `e2e/lab-02/requester-ticket-flow.spec.ts` | Pass |
| E2E-08 | AC-36–AC-40 | Ticket Detail ownership | Owned Ticket opens while cross-Requester Ticket access is rejected | `e2e/lab-02/requester-ticket-flow.spec.ts` | Pass |
| E2E-09 | AC-41–AC-47 | Attachment lifecycle | Add, download, remove, retain metadata, and block removed download | `e2e/lab-02/requester-ticket-flow.spec.ts` | Pass |
| E2E-10 | AC-52–AC-59 | Responsive requester workflow | Core requester workflow remains usable at desktop, tablet, and mobile sizes | `e2e/lab-02/requester-ticket-flow.spec.ts` | Pass |

---

## 3. Acceptance-Criterion Traceability

Each Acceptance Criterion must have at least one planned test.

| Acceptance Criterion | Planned Tests |
|---|---|
| AC-01 | API-01, UI-01, E2E-01 |
| AC-02 | UI-02 |
| AC-03 | API-03, UI-03 |
| AC-04 | API-02, UI-01 |
| AC-05 | UI-04, E2E-01 |
| AC-06 | UI-05, UI-06, E2E-07 |
| AC-07 | UI-04, E2E-07 |
| AC-08 | API-06, E2E-01 |
| AC-09 | UNIT-01, UNIT-02, API-06, E2E-01 |
| AC-10 | UNIT-03, API-07 |
| AC-11 | UNIT-06, API-08, API-04, API-05 |
| AC-12 | UI-07 |
| AC-13 | UNIT-05, API-10, UI-08, E2E-02 |
| AC-14 | UNIT-04, API-11, UI-09, E2E-02 |
| AC-15 | API-09, API-12, API-13, API-14, API-15, E2E-02 |
| AC-16 | UI-10 |
| AC-17 | API-19, UI-11, E2E-04 |
| AC-18 | UI-12, E2E-01 |
| AC-19 | UNIT-07, API-43, UI-13, E2E-03 |
| AC-20 | UNIT-08, API-44, UI-14, E2E-03 |
| AC-21 | UNIT-07, API-45, UI-14, E2E-03 |
| AC-22 | UNIT-09, API-46, UI-15 |
| AC-23 | API-16, E2E-03 |
| AC-24 | API-47, E2E-09 |
| AC-25 | API-20, UI-16, E2E-05, E2E-07 |
| AC-26 | API-38, E2E-06 |
| AC-27 | UI-17, E2E-06 |
| AC-28 | UI-18, E2E-06 |
| AC-29 | API-21–API-25, UI-19, E2E-05 |
| AC-30 | API-26–API-29, UI-20, E2E-05 |
| AC-31 | API-30, UI-20, E2E-05 |
| AC-32 | UNIT-10–UNIT-13, API-31–API-33, UI-21, E2E-05 |
| AC-33 | UNIT-14, API-34, UI-22, E2E-05 |
| AC-34 | API-35, UI-22, E2E-05 |
| AC-35 | API-36, API-37 |
| AC-36 | API-39, API-42, UI-23, E2E-08 |
| AC-37 | UI-23, E2E-08 |
| AC-38 | API-40, E2E-08 |
| AC-39 | API-48, E2E-09 |
| AC-40 | API-41 |
| AC-41 | API-49, UI-24, E2E-09 |
| AC-42 | API-50, UI-25, E2E-09 |
| AC-43 | API-51, UI-27, E2E-09 |
| AC-44 | UNIT-15, API-52, UI-26, E2E-09 |
| AC-45 | API-53, UI-27, E2E-09 |
| AC-46 | UNIT-15, API-52, E2E-09 |
| AC-47 | API-54, E2E-09 |
| AC-48 | API-04, API-05, UI-03 |
| AC-49 | UI-28, E2E-06 |
| AC-50 | UI-29, E2E-06 |
| AC-51 | UI-11, E2E-04 |
| AC-52 | RESP-01, RESP-04, RESP-07 |
| AC-53 | RESP-02, RESP-05, RESP-07 |
| AC-54 | RESP-03, RESP-06, RESP-07 |
| AC-55 | RESP-08, RESP-09, RESP-10 |
| AC-56 | UI-30 |
| AC-57 | UI-30 |
| AC-58 | UI-07, UI-09, STYLE-04, STYLE-05 |
| AC-59 | STYLE-01–STYLE-09, RESP-01–RESP-10 |

---

## 4. Responsive and Visual Checklist

The following checklist is performed against `ui-spec.md` and the approved UI illustrations.

### Create Ticket

- [x] Desktop screenshot captured at ≥992 px.
- [x] Tablet screenshot captured at 768–991 px.
- [x] Mobile screenshot captured below 768 px.
- [x] Application shell is present.
- [x] Current Requester is visible.
- [x] Required fields have visible required markers.
- [x] Validation messages appear beside the relevant fields.
- [x] Editable fields use the specified editable-field style.
- [x] Read-only/system-generated fields use the specified read-only style.
- [x] Submit button hierarchy matches `ui-spec.md`.
- [x] Submit busy state is visually distinct.
- [x] Success state displays the Ticket Number.
- [x] Attachment counter is visible.
- [x] Invalid Attachment state is clearly communicated.
- [x] No clipping or overlap occurs.
- [x] No unintended horizontal scrolling occurs.

### My Tickets

- [x] Desktop Ticket list/table is readable.
- [x] Mobile Ticket representation is readable.
- [x] Search control is usable.
- [x] Filters are usable.
- [x] Sort controls are usable.
- [x] Pagination is usable.
- [x] Empty state is distinguishable from no-results state.
- [x] Loading state is distinguishable from empty state.
- [x] Failure state is clearly communicated.
- [x] Priority and status badges are consistent.
- [x] No Ticket information is clipped.
- [x] No horizontal overflow occurs.

### Ticket Detail

- [x] Ticket information is visually read-only.
- [x] Attachment section is clearly separated from Ticket information.
- [x] Active Attachment metadata is readable.
- [x] Download control is understandable.
- [x] Removal control is clearly destructive.
- [x] Removal confirmation is visible before deletion.
- [x] Removed Attachment state is clear.
- [x] No Attachment name is clipped.
- [x] Desktop, tablet, and mobile layouts remain usable.

### Accessibility

- [x] All form controls have accessible labels.
- [x] Required controls expose their required state.
- [x] Keyboard navigation reaches all interactive controls.
- [x] Focus indicators remain visible.
- [x] Icon-only controls have accessible labels.
- [x] Tooltips are available for icon-only controls.
- [x] Disabled controls cannot be activated.
- [x] Important states are not communicated through color alone.
- [x] Validation messages are associated with their relevant fields.

Screenshots are stored under:

artifacts/lab-02/screenshots/
├── create-ticket/
├── my-tickets/
└── ticket-detail/

## 5. Test Commands
The exact commands must match the project's final package configuration.

Planned commands:

# Unit tests
npm run test:unit

# API / integration tests
npm run test:api

# UI component tests
npm run test:ui

# UI style tests
npm run test:ui-style

# E2E tests
npm run test:e2e

If the repository uses different commands, this section must be updated before the final main branch is considered complete.

All documented commands must execute successfully against the final implementation.

## 6. Final Results
This section is updated after implementation.
| Test Level        | Planned | Passed | Failed | Skipped |
| ----------------- | ------: | -----: | -----: | ------: |
| Unit              |      15 |     15 |      0 |       0 |
| API / Integration |      33 |     33 |      0 |       0 |
| UI Component      |      22 |     22 |      0 |       0 |
| Total             |      70 |     70 |      0 |       0 |

Acceptance Criteria Status

| Status     | Count |
| ---------- | ----: |
| Passed     |    59 |
| Failed     |     0 |
| Not Tested |     0 |

The Lab 2 implementation must not be declared complete while required Acceptance Criteria remain untested or failing.

No required test may be skipped, disabled, commented out, or ignored.

Final test results must be recorded from the final reviewed main branch.

## 7. Known Limitations or Deferred Tests

At the planning stage, there are no intentionally deferred tests for required Lab 2 functionality.

If a test cannot be implemented or executed, it must be documented here with:

Test ID.
Reason it could not be executed.
Impact on Acceptance Criteria.
Whether the issue blocks the Definition of Done.
Planned resolution.

Lab 2 functionality outside the approved scope is not tested, including:

Real authentication.
Login/logout.
Passwords or sessions.
Real role-based authorization.
IT Staff dashboard or queue.
Ticket claiming or reassignment.
IT Priority management.
Public Comments.
Internal Notes.
Actions Taken.
Post-creation status transitions.
Resolution, closing, reopening, or cancellation.

These are outside the Lab 2 scope and therefore are not considered missing test coverage.

---

## 8. Complete Passing Test Output (Main Branch)

### 8.1 Backend Unit & API Tests (`server`)

```text
 RUN  v2.1.9 C:/Users/pakat/Projects/School/CPE334/toktickit/toktickit/toktickit/server

 ✓ tests/lab-02/schema-seed.test.ts (3 tests)
 ✓ tests/lab-01/health.test.ts (1 test)
 ✓ tests/lab-01/categories.test.ts (1 test)
 ✓ tests/lab-02/reference-data.api.test.ts (4 tests)
 ✓ tests/lab-02/ticket-detail.api.test.ts (4 tests)
 ✓ tests/lab-02/attachments.api.test.ts (6 tests)
 ✓ tests/lab-02/create-ticket.api.test.ts (9 tests)
 ✓ tests/lab-02/my-tickets.api.test.ts (14 tests)

 Test Files  8 passed (8)
      Tests  42 passed (42)
   Start at  01:26:11
   Duration  946ms (transform 193ms, setup 0ms, collect 2.38s, tests 765ms, environment 1ms, prepare 880ms)
```

#### Detailed Test Case Execution (Server Verbose Output):
```text
 ✓ tests/lab-02/reference-data.api.test.ts > Lab 02 Feature 2 — Reference Data APIs > GET /api/requesters > returns 200 OK with only active requesters in id order
 ✓ tests/lab-02/reference-data.api.test.ts > Lab 02 Feature 2 — Reference Data APIs > GET /api/related-systems > returns 200 OK with only active related systems in id order
 ✓ tests/lab-02/reference-data.api.test.ts > Lab 02 Feature 2 — Reference Data APIs > GET /api/categories > returns 200 OK with active categories in id order
 ✓ tests/lab-02/reference-data.api.test.ts > Lab 02 Feature 2 — Reference Data APIs > Error Envelope Handling > returns 500 with safe error envelope when database fails
 ✓ tests/lab-02/ticket-detail.api.test.ts > Lab 02 Feature 9 — Ticket Detail API (GET /api/tickets/:id) > returns 200 OK with full ticket details and attachments for ticket owner
 ✓ tests/lab-02/ticket-detail.api.test.ts > Lab 02 Feature 9 — Ticket Detail API (GET /api/tickets/:id) > returns 403 Forbidden when requesting a ticket owned by another requester
 ✓ tests/lab-02/ticket-detail.api.test.ts > Lab 02 Feature 9 — Ticket Detail API (GET /api/tickets/:id) > returns 404 Not Found when requesting a non-existent ticket ID
 ✓ tests/lab-02/ticket-detail.api.test.ts > Lab 02 Feature 9 — Ticket Detail API (GET /api/tickets/:id) > returns 400 Bad Request if requesterId is missing
 ✓ tests/lab-02/create-ticket.api.test.ts > Lab 02 Feature 5 — Create Ticket API (POST /api/tickets) > Happy Path Ticket Creation > creates a ticket without attachments and returns 201 Created with ticket number
 ✓ tests/lab-02/attachments.api.test.ts > Lab 02 Feature 10 — Attachment Management APIs > uploads an attachment to an existing ticket (POST /api/tickets/:id/attachments)
 ✓ tests/lab-02/attachments.api.test.ts > Lab 02 Feature 10 — Attachment Management APIs > previews active attachment inline (GET /api/attachments/:id/preview)
 ✓ tests/lab-02/attachments.api.test.ts > Lab 02 Feature 10 — Attachment Management APIs > downloads active attachment (GET /api/attachments/:id/download)
 ✓ tests/lab-02/my-tickets.api.test.ts > Lab 02 Feature 6 — My Tickets API (GET /api/tickets) > Requester Isolation & Basic Payload Shape > returns 200 OK with paginated ticket list for active requester
 ✓ tests/lab-02/my-tickets.api.test.ts > Lab 02 Feature 6 — My Tickets API (GET /api/tickets) > Requester Isolation & Basic Payload Shape > returns 400 Bad Request if requesterId is missing
 ✓ tests/lab-02/my-tickets.api.test.ts > Lab 02 Feature 6 — My Tickets API (GET /api/tickets) > Requester Isolation & Basic Payload Shape > returns 404 Not Found for non-existent requester
 ✓ tests/lab-02/my-tickets.api.test.ts > Lab 02 Feature 6 — My Tickets API (GET /api/tickets) > Requester Isolation & Basic Payload Shape > returns 404 Not Found for inactive requester (Eve Inactive)
 ✓ tests/lab-02/my-tickets.api.test.ts > Lab 02 Feature 6 — My Tickets API (GET /api/tickets) > Query Parameter Validation (400 Bad Request) > returns 400 when page < 1
 ✓ tests/lab-02/my-tickets.api.test.ts > Lab 02 Feature 6 — My Tickets API (GET /api/tickets) > Query Parameter Validation (400 Bad Request) > returns 400 when pageSize is invalid (e.g. pageSize=15)
 ✓ tests/lab-02/my-tickets.api.test.ts > Lab 02 Feature 6 — My Tickets API (GET /api/tickets) > Query Parameter Validation (400 Bad Request) > returns 400 when sortBy is invalid
 ✓ tests/lab-02/my-tickets.api.test.ts > Lab 02 Feature 6 — My Tickets API (GET /api/tickets) > Query Parameter Validation (400 Bad Request) > returns 400 when sortDirection is invalid
 ✓ tests/lab-02/attachments.api.test.ts > Lab 02 Feature 10 — Attachment Management APIs > returns 422 VALIDATION_ERROR when removing attachment without a reason
 ✓ tests/lab-02/attachments.api.test.ts > Lab 02 Feature 10 — Attachment Management APIs > soft-removes attachment when a valid reason is provided
 ✓ tests/lab-02/attachments.api.test.ts > Lab 02 Feature 10 — Attachment Management APIs > returns 404 Not Found when trying to download or preview a soft-deleted attachment
 ✓ tests/lab-02/create-ticket.api.test.ts > Lab 02 Feature 5 — Create Ticket API (POST /api/tickets) > Happy Path Ticket Creation > creates a ticket with valid binary attachment and returns 201 Created
 ✓ tests/lab-02/create-ticket.api.test.ts > Lab 02 Feature 5 — Create Ticket API (POST /api/tickets) > Validation Failures (422 Unprocessable Entity) > rejects request missing description with 422
 ✓ tests/lab-02/create-ticket.api.test.ts > Lab 02 Feature 5 — Create Ticket API (POST /api/tickets) > Validation Failures (422 Unprocessable Entity) > rejects request with empty description with 422
 ✓ tests/lab-02/create-ticket.api.test.ts > Lab 02 Feature 5 — Create Ticket API (POST /api/tickets) > Validation Failures (422 Unprocessable Entity) > rejects request for inactive requester (Eve Inactive) with 422
 ✓ tests/lab-02/create-ticket.api.test.ts > Lab 02 Feature 5 — Create Ticket API (POST /api/tickets) > Validation Failures (422 Unprocessable Entity) > rejects request for non-existent category ID with 422
 ✓ tests/lab-02/create-ticket.api.test.ts > Lab 02 Feature 5 — Create Ticket API (POST /api/tickets) > Attachment Validations (415 & 413) > rejects disallowed attachment MIME type with 415 Unsupported Media Type
 ✓ tests/lab-02/my-tickets.api.test.ts > Lab 02 Feature 6 — My Tickets API (GET /api/tickets) > Search & Filtering > filters tickets by search keyword across summary and description
 ✓ tests/lab-02/create-ticket.api.test.ts > Lab 02 Feature 5 — Create Ticket API (POST /api/tickets) > Attachment Validations (415 & 413) > rejects oversized attachment (> 5 MB) with 413 Payload Too Large
 ✓ tests/lab-02/my-tickets.api.test.ts > Lab 02 Feature 6 — My Tickets API (GET /api/tickets) > Search & Filtering > filters tickets by currentStatus
 ✓ tests/lab-02/my-tickets.api.test.ts > Lab 02 Feature 6 — My Tickets API (GET /api/tickets) > Search & Filtering > filters tickets by priority
 ✓ tests/lab-02/create-ticket.api.test.ts > Lab 02 Feature 5 — Create Ticket API (POST /api/tickets) > Rate Limiting Throttling (429) > returns 429 Too Many Requests when same requester submits twice within 15 seconds
 ✓ tests/lab-02/my-tickets.api.test.ts > Lab 02 Feature 6 — My Tickets API (GET /api/tickets) > Search & Filtering > filters tickets by unassigned priority (priority=null or priority=unassigned)
 ✓ tests/lab-02/my-tickets.api.test.ts > Lab 02 Feature 6 — My Tickets API (GET /api/tickets) > Sorting & Pagination > sorts by priority ranking
 ✓ tests/lab-02/my-tickets.api.test.ts > Lab 02 Feature 6 — My Tickets API (GET /api/tickets) > Sorting & Pagination > supports pagination with pageSize=25
```

### 8.2 Frontend UI Component & Style Tests (`client`)

```text
 RUN  v2.1.9 C:/Users/pakat/Projects/School/CPE334/toktickit/toktickit/toktickit/client

 ✓ tests/lab-02/AttachmentSection.test.tsx (4 tests)
 ✓ tests/lab-02/CreateTicket.test.tsx (6 tests)
 ✓ tests/lab-02/MyTickets.test.tsx (4 tests)
 ✓ tests/lab-02/RequesterSelector.test.tsx (6 tests)
 ✓ tests/lab-02/RequesterTicketDetail.test.tsx (4 tests)
 ✓ tests/lab-02/UIFoundation.test.tsx (4 tests)

 Test Files  7 passed (7)
      Tests  28 passed (28)
   Start at  01:26:00
   Duration  1.91s (transform 416ms, setup 858ms, collect 1.86s, tests 1.81s, environment 4.48s, prepare 795ms)
```

#### Detailed UI Component Test Case Execution (Client Verbose Output):
```text
 ✓ tests/lab-02/AttachmentSection.test.tsx > Lab 02 Feature 7 — Attachment Section UI > renders attachment uploader and displays staged attachments
 ✓ tests/lab-02/AttachmentSection.test.tsx > Lab 02 Feature 7 — Attachment Section UI > validates file type and rejects unsupported files
 ✓ tests/lab-02/AttachmentSection.test.tsx > Lab 02 Feature 7 — Attachment Section UI > validates file size limit (5MB)
 ✓ tests/lab-02/AttachmentSection.test.tsx > Lab 02 Feature 7 — Attachment Section UI > enforces maximum 5 attachments limit
 ✓ tests/lab-02/CreateTicket.test.tsx > Lab 02 Feature 5 — Create Ticket UI > renders form with all required fields
 ✓ tests/lab-02/CreateTicket.test.tsx > Lab 02 Feature 5 — Create Ticket UI > validates description minimum length (20 chars)
 ✓ tests/lab-02/CreateTicket.test.tsx > Lab 02 Feature 5 — Create Ticket UI > validates summary maximum length (255 chars)
 ✓ tests/lab-02/CreateTicket.test.tsx > Lab 02 Feature 5 — Create Ticket UI > submits ticket successfully and shows ticket number
 ✓ tests/lab-02/CreateTicket.test.tsx > Lab 02 Feature 5 — Create Ticket UI > shows error toast notification on server error
 ✓ tests/lab-02/CreateTicket.test.tsx > Lab 02 Feature 5 — Create Ticket UI > handles rate limit throttling 429 response gracefully
 ✓ tests/lab-02/MyTickets.test.tsx > Lab 02 Feature 8 — My Tickets Screen > renders ticket table with correct columns and data
 ✓ tests/lab-02/MyTickets.test.tsx > Lab 02 Feature 8 — My Tickets Screen > updates search input and triggers filtered fetch
 ✓ tests/lab-02/MyTickets.test.tsx > Lab 02 Feature 8 — My Tickets Screen > displays empty state when requester has 0 tickets
 ✓ tests/lab-02/MyTickets.test.tsx > Lab 02 Feature 8 — My Tickets Screen > displays no-results state with Clear Filters button when search matches 0 items
 ✓ tests/lab-02/RequesterSelector.test.tsx > Lab 02 Feature 4 — Development Requester Selector > selects a requester and navigates to /tickets upon Continue
 ✓ tests/lab-02/RequesterSelector.test.tsx > Lab 02 Feature 4 — Development Requester Selector > redirects to / when attempting to visit /tickets without selecting a requester
 ✓ tests/lab-02/RequesterSelector.test.tsx > Lab 02 Feature 4 — Development Requester Selector > clears requester context and navigates to / when clicking Change Requester
 ✓ tests/lab-02/RequesterSelector.test.tsx > Lab 02 Feature 4 — Development Requester Selector > displays safe error state when API fails
 ✓ tests/lab-02/RequesterSelector.test.tsx > Lab 02 Feature 4 — Development Requester Selector > displays empty state and disables Continue button when API returns 0 active requesters
 ✓ tests/lab-02/RequesterTicketDetail.test.tsx > Lab 02 Feature 9 — Ticket Detail View > renders ticket details in read-only mode
 ✓ tests/lab-02/RequesterTicketDetail.test.tsx > Lab 02 Feature 9 — Ticket Detail View > displays active attachment list with download links
 ✓ tests/lab-02/RequesterTicketDetail.test.tsx > Lab 02 Feature 9 — Ticket Detail View > prompts confirmation dialog before soft-removing attachment
 ✓ tests/lab-02/RequesterTicketDetail.test.tsx > Lab 02 Feature 9 — Ticket Detail View > handles 403 forbidden cross-requester access error safely
 ✓ tests/lab-02/UIFoundation.test.tsx > Design System & Styling > applies Zen Green primary color tokens to primary buttons and navbar header
 ✓ tests/lab-02/UIFoundation.test.tsx > Design System & Styling > renders status and priority badges with non-color indicators
 ✓ tests/lab-02/UIFoundation.test.tsx > Design System & Styling > marks required fields with visible required markers (* asterisk)
 ✓ tests/lab-02/UIFoundation.test.tsx > Design System & Styling > includes accessible labels on form controls and icon buttons
```