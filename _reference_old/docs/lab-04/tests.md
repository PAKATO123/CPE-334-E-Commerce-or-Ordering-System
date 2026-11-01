# Lab 4 Test Plan and Traceability Matrix

This document outlines the test strategy, planned test cases, Acceptance Criteria (AC) mapping, and execution strategy for Lab 4 (TokTickIT Actions Taken, Operational Dashboards, and Final Regression).

---

## 1. Test Strategy

Testing follows Test-Driven Development (TDD) and Specification-Driven Testing principles:
1. **Unit & Integration Tests**: Backend test suite covering Prisma model relations, `ActionTaken` field validations, status transition validation, and RBAC authorization guards.
2. **API Integration Tests**: Supertest suite executing REST API calls for creating/editing Actions Taken, fetching Requester/Staff/Admin dashboard metrics, and enforcing status lifecycle transitions.
3. **UI Component Tests**: React Testing Library suite testing Requester Dashboard (`/requester/dashboard`), Staff Dashboard (`/staff/dashboard`), Admin Dashboard (`/admin/dashboard`), and Actions Taken form/list components under various role and empty/loading states.
4. **E2E Integration Tests**: Playwright suite verifying full user journeys across desktop and mobile viewports, including Actions Taken recording, status transition workflow, dashboard card drill-down, uniform `/requester/xxx` routing, and regression testing for authentication and ticket operations.

---

## 2. Test Traceability Matrix (AC to Planned Tests)

| Test ID | Category | AC ID | Test Description | Expected Result | Automated Test File | Status |
|---|---|---|---|---|---|---|
| **API-01** | API | AC-01 | Create Action Taken as IT Staff | Returns HTTP 201 Created with auto-bound `performedById` | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| **API-02** | API | AC-02 | Create Action Taken missing mandatory `followUpNote` when `followUpRequired = true` | Returns HTTP 400 Bad Request with validation error message | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| **API-03** | API | AC-03 | Requester fetches Actions Taken on owned ticket | Returns HTTP 200 OK with Actions Taken array in read-only format | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| **API-04** | API | AC-04 | Requester attempts to create Action Taken | Returns HTTP 403 Forbidden | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| **API-05** | API | AC-05 | Staff resolves ticket following permitted status transition | Status updates cleanly to `RESOLVED` | `server/tests/lab-04/ticket-workflow.api.test.ts` | Pass |
| **API-06** | API | AC-06 | Requester marks problem resolved (`isRequesterResolved = true`) | Status remains active until Staff confirms; advisory flag sets to true | `server/tests/lab-04/ticket-workflow.api.test.ts` | Pass |
| **API-07** | API | AC-07 | Fetch Requester Dashboard metrics as Requester | Returns user-isolated open, waiting, and recent ticket metrics | `server/tests/lab-04/requester-dashboard.api.test.ts` | Pass |
| **API-08** | API | AC-08 | Fetch Staff Dashboard metrics as IT Staff | Returns unassigned, owned, priority, and follow-up metrics | `server/tests/lab-04/staff-dashboard.api.test.ts` | Pass |
| **API-09** | API | AC-10 | Fetch Admin Dashboard metrics as Administrator | Returns staff metrics plus user account statistics | `server/tests/lab-04/staff-dashboard.api.test.ts` | Pass |
| **API-10** | API | AC-11 | Add Action Taken to `Cancelled` ticket | Returns HTTP 400 Bad Request (Terminal status protection) | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| **API-11** | API | AC-12 | Concurrent update to Action Taken record | Returns HTTP 409 Conflict | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| **UI-01** | Component | AC-01, AC-02 | Actions Taken form component validation | Disables submit when required fields are missing; enforces follow-up note | `client/tests/lab-04/ActionsTaken.test.tsx` | Pass |
| **UI-02** | Component | AC-03, AC-04 | Actions Taken list component role rendering | Renders read-only list for Requester, edit controls for IT Staff | `client/tests/lab-04/ActionsTaken.test.tsx` | Pass |
| **UI-03** | Component | AC-05, AC-06 | Ticket workflow status controls & resolution feedback | Renders permitted status transition options; allows direct status updates | `client/tests/lab-04/TicketWorkflow.test.tsx` | Pass |
| **UI-04** | Component | AC-07, AC-09 | Requester Dashboard card rendering & quick actions | Displays metric cards and "+ Create Ticket" link (`/requester/tickets/new`) | `client/tests/lab-04/RequesterDashboard.test.tsx` | Pass |
| **UI-05** | Component | AC-08, AC-09 | Staff Dashboard card rendering & drill-down links | Displays metric cards and status breakdown with nav links | `client/tests/lab-04/StaffDashboard.test.tsx` | Pass |
| **E2E-01** | E2E | AC-01, AC-05 | IT Staff Actions Taken & Ticket Resolution end-to-end flow | Staff opens ticket, creates Action Taken, updates status to Resolved | `e2e/lab-04/actions-taken-flow.spec.ts` | Pass |
| **E2E-02** | E2E | AC-05, AC-06 | Direct ticket resolution & advisory requester resolution E2E | Verifies status transition to Resolved; tests requester advisory flag | `e2e/lab-04/ticket-resolution.spec.ts` | Pass |
| **E2E-03** | E2E | AC-07, AC-08, AC-09 | Role dashboards & metric card drill-down E2E | Tests Requester (`/requester/dashboard`) and Staff dashboards with drill-down | `e2e/lab-04/dashboards.spec.ts` | Pass |

---

## 3. Test Execution Command Reference

```bash
# Server Unit & API Test Suite for Lab 4
npx vitest run tests/lab-04

# Client React Component Test Suite for Lab 4
npx vitest run tests/lab-04

# Playwright End-to-End Test Suite for Lab 4
npx playwright test e2e/lab-04

# Full Project Regression Test Suite (Labs 1-4)
npm test
```
