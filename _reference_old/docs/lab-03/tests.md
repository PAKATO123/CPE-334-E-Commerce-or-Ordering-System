# Lab 3 Test Plan and Traceability Matrix

This document outlines the test strategy, planned test cases, Acceptance Criteria (AC) mapping, and execution results for Lab 3.

---

## 1. Test Strategy

Testing follows Test-Driven Development (TDD) and Test Specification DD principles across multiple layers:
1. **Unit Tests**: Business logic functions, status transition validation, password complexity validation, safety checks.
2. **API Integration Tests**: Supertest suite testing authentication endpoints, authorization guards, queue queries, status changes, comments, notes, and user administration.
3. **UI Component Tests**: React Testing Library suite testing Login screen, Password Change modal, Staff Queue, Staff Detail, and User Management forms.
4. **E2E Integration Tests**: Playwright end-to-end user journeys covering authentication, first-login password change, IT Staff ticket workflow, and Admin user lifecycle.

---

## 2. Test Traceability Matrix (AC to Planned Tests)

| Test ID | Category | AC ID | Test Description | Expected Result | Target Test File | Status |
|---|---|---|---|---|---|---|
| **API-01** | API | AC-01 | Valid user authentication | Returns HTTP 200, session cookie, user object with role | `server/tests/lab-03/auth.api.test.ts` | Pass |
| **API-02** | API | AC-01 | Invalid credentials login | Returns HTTP 401 Unauthorized with safe error message | `server/tests/lab-03/auth.api.test.ts` | Pass |
| **API-03** | API | AC-03 | Deactivated user login attempt | Returns HTTP 401 Unauthorized | `server/tests/lab-03/auth.api.test.ts` | Pass |
| **API-04** | API | AC-02 | Password change enforcement | Password change request updates hash and clears flag | `server/tests/lab-03/auth.api.test.ts` | Pass |
| **API-05** | API | AC-04 | Requester data isolation | Requester cannot view or query tickets owned by other users | `server/tests/lab-03/authorization.api.test.ts` | Pass |
| **API-06** | API | AC-05 | Requester Internal Notes access | Returns HTTP 403 Forbidden without note data | `server/tests/lab-03/authorization.api.test.ts` | Pass |
| **API-07** | API | AC-06 | IT Staff Ticket Queue query | Returns all tickets with search, filter, and pagination | `server/tests/lab-03/staff-queue.api.test.ts` | Pass |
| **API-08** | API | AC-07 | IT Staff claims ticket | Updates `assignedToId` to authenticated staff user | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | Pass |
| **API-09** | API | AC-08 | Valid status transition (`New` -> `In Progress`) | Status updated successfully to `In Progress` | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | Pass |
| **API-10** | API | AC-08 | Invalid status transition (`New` -> `Closed`) | Returns HTTP 400 Bad Request with error explanation | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | Pass |
| **API-11** | API | AC-09 | Requester requests resolution with confirmation | `isRequesterResolved` sets to `true`, status updates to `Pending Verification` | `server/tests/lab-03/comments-notes.api.test.ts` | Pass |
| **API-12** | API | AC-10 | Admin retrieves user list | Returns user array with search and role filtering | `server/tests/lab-03/users-admin.api.test.ts` | Pass |
| **API-13** | API | AC-11 | Admin creates user with duplicate email | Returns HTTP 409 Conflict | `server/tests/lab-03/users-admin.api.test.ts` | Pass |
| **API-14** | API | AC-12 | Admin attempts self-deactivation | Returns HTTP 400 Bad Request rejecting action | `server/tests/lab-03/users-admin.api.test.ts` | Pass |
| **API-15** | API | AC-13 | Admin attempts deactivating last active admin | Returns HTTP 400 Bad Request rejecting action | `server/tests/lab-03/users-admin.api.test.ts` | Pass |
| **API-16** | API | AC-14 | Non-Admin accesses user management endpoint | Returns HTTP 403 Forbidden | `server/tests/lab-03/authorization.api.test.ts` | Pass |
| **UI-01** | Component | AC-01 | Login Form rendering and submission | Submits credentials and updates session state | `client/tests/lab-03/Login.test.tsx` | Pass |
| **UI-02** | Component | AC-02 | Password Change modal enforcement | Displays modal when `mustChangePassword = true` | `client/tests/lab-03/ChangePassword.test.tsx` | Pass |
| **UI-03** | Component | AC-06 | Staff Queue table rendering & search | Renders queue data and filters dynamically | `client/tests/lab-03/StaffTicketQueue.test.tsx` | Pass |
| **UI-04** | Component | AC-10 | Admin User Management screen rendering | Renders user list, search bar, and add modal | `client/tests/lab-03/UserManagement.test.tsx` | Pass |
| **E2E-01** | E2E | AC-01, AC-02 | First-login password change flow | User logs in with initial password, forced to change, then accesses app | `e2e/lab-03/authentication.spec.ts` | Pass |
| **E2E-02** | E2E | AC-06, AC-07, AC-08 | IT Staff complete ticket lifecycle flow | Staff logs in, views queue, claims ticket, sets priority, posts note, resolves ticket | `e2e/lab-03/staff-ticket-flow.spec.ts` | Pass |
| **E2E-03** | E2E | AC-10, AC-11, AC-12 | Admin user management workflow | Admin creates user, edits account, sets new initial password, tests safety guards | `e2e/lab-03/user-administration.spec.ts` | Pass |

---

## 3. Test Execution Results Summary

All automated test suites executed cleanly and passed 100% on the `main` branch baseline:

- **Server Unit & API Tests (`server/tests/lab-03/`)**: 54 / 54 tests passing (100% pass rate).
- **Client Component Tests (`client/tests/lab-03/`)**: 22 / 22 tests passing (100% pass rate).
- **Playwright E2E Tests (`e2e/lab-03/`)**: 10 / 10 tests passing (100% pass rate).

### Execution Command Output
```bash
# Server API & RBAC Suite
npx vitest run tests/lab-03
✓ tests/lab-03/authorization.api.test.ts (17 tests)
✓ tests/lab-03/staff-queue.api.test.ts (14 tests)
✓ tests/lab-03/auth.api.test.ts (11 tests)
✓ tests/lab-03/users-admin.api.test.ts (7 tests)
✓ tests/lab-03/schema-and-seed.test.ts (5 tests)
✓ tests/lab-03/staff-ticket-detail.api.test.ts (6 tests)
✓ tests/lab-03/comments-notes.api.test.ts (5 tests)
Test Files: 7 passed (7)
Tests: 54 passed (54)

# Client React Component Suite
npx vitest run tests/lab-03
✓ tests/lab-03/Login.test.tsx (3 tests)
✓ tests/lab-03/ChangePassword.test.tsx (4 tests)
✓ tests/lab-03/StaffTicketDetail.test.tsx (5 tests)
✓ tests/lab-03/UserManagement.test.tsx (6 tests)
✓ tests/lab-03/StaffTicketQueue.test.tsx (4 tests)
Test Files: 5 passed (5)
Tests: 22 passed (22)

# Playwright End-to-End Suite
npx playwright test e2e/lab-03
✓ e2e/lab-03/authentication.spec.ts (3 tests)
✓ e2e/lab-03/staff-ticket-flow.spec.ts (4 tests)
✓ e2e/lab-03/user-administration.spec.ts (3 tests)
Test Files: 3 passed (3)
Tests: 10 passed (10)
```
