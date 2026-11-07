# Sprint 1 Test Coverage & Verification Results Table

**Course:** CPE 334 Software Engineering — Semester 1/2026  
**Deliverable:** Project Deliverable 1 (Sprint 1 Working Increment & Engineering Baseline)  
**Project:** TechTent Everyday Electronics Ordering System  
**Tested Commit:** `8e2d5c5` (Staging integration on `Sprint-1-Staging`)  
**Overall Result:** **184 Automated Tests Passed (100% Success)**, 0 Failed, 0 Skipped; 4 Manual End-to-End Walkthroughs Verified.

---

## 1. Test Execution Summary

| Suite / Component | Test Framework / Runner | Total Tests | Passed | Failed | Skipped | Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Backend Integration & Regression** | Vitest + Supertest + PostgreSQL (`techtent_test`) | 93 | 93 | 0 | 0 | **PASS** |
| **Backend Unit & Safety Suites** | Vitest (Isolated Logic & Concurrency Mocks) | 48 | 48 | 0 | 0 | **PASS** |
| **Frontend Components & User Flows** | Vitest + React Testing Library + jsdom | 43 | 43 | 0 | 0 | **PASS** |
| **Manual UI & Print Verification** | Chromium / Firefox Browser Walkthroughs | 4 | 4 | 0 | 0 | **VERIFIED** |
| **Total Test Count** | **Full Verification Suite** | **188** | **188** | **0** | **0** | **100% PASS** |

---

## 2. Sprint 1 Acceptance Criteria to Test Results Mapping

The table below maps every Sprint 1 Acceptance Criterion (AC) across features F-01 through F-05 and system NFRs to its planned Software Test Specification (STS) ID, verification level, actual test suite/test name, and execution result.

| Req ID | AC ID | Planned STS ID | Verification Level | Executable Test File & Test Title / Verification Check | Result |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **FR-01** | **AC-CAT-01** | `TEST-CAT-01` | Automated Integration | `server/tests/products.test.ts`:<br>• `GET /api/products returns active products list with USD prices and current stock` | **PASS** |
| **FR-01** | **AC-CAT-01** | `TEST-CAT-01` | Automated Frontend | `client/tests/catalog.test.tsx`:<br>• `renders product card with authoritative USD price ($899.00) and in-stock badge` | **PASS** |
| **FR-01** | **AC-CAT-02** | `TEST-CAT-02` | Automated Integration | `server/tests/products.test.ts`:<br>• `GET /api/products excludes inactive products` | **PASS** |
| **FR-02** | **AC-CAT-03** | `TEST-CAT-03` | Automated Frontend | `client/tests/catalog.test.tsx`:<br>• `TEST-CAT-03: renders Out of Stock badge and disables button when stockQuantity is 0` | **PASS** |
| **FR-02** | **AC-CAT-03** | `TEST-CAT-03` | Automated Frontend | `client/tests/catalog.test.tsx`:<br>• `renders in-cart tracking badge and disables button when in-cart quantity reaches stock quantity` | **PASS** |
| **FR-03** | **AC-ORD-01** | `TEST-ORD-01` | Automated Frontend | `client/tests/cart.test.tsx`:<br>• `calculates running total accurately in USD ($) as items are added` | **PASS** |
| **FR-03** | **AC-ORD-01** | `TEST-ORD-01` | Automated Frontend | `client/tests/cart.test.tsx`:<br>• `steppers update quantities and prevent exceeding stock limit` | **PASS** |
| **FR-03** | **AC-ORD-01** | `TEST-ORD-01` | Automated Integration | `server/tests/orders.test.ts`:<br>• `POST /api/orders creates multi-item order with valid quantities` | **PASS** |
| **FR-04** | **AC-ORD-02** | `TEST-ORD-02` | Automated Integration | `server/tests/orders.test.ts`:<br>• `POST /api/orders atomically decrements product inventory on successful order` | **PASS** |
| **FR-04** | **AC-ORD-02** | `TEST-ORD-02` | Automated Integration | `server/tests/orders.test.ts`:<br>• `POST /api/orders creates order with initial PENDING status` | **PASS** |
| **FR-05** | **AC-ORD-03** | `TEST-ORD-03` | Automated Unit | `server/tests/unit/operator-orders.test.ts`:<br>• `generates sequential formatted order numbers with ORD prefix` | **PASS** |
| **FR-06** | **AC-ORD-04** | `TEST-ORD-04` | Automated Integration | `server/tests/orders.test.ts`:<br>• `GET /api/orders returns chronological order list for authenticated customer` | **PASS** |
| **FR-06** | **AC-ORD-04** | `TEST-ORD-04` | Automated Frontend | `client/tests/order-history.test.tsx`:<br>• `loads and displays customer order history with order numbers, status badges, and USD totals` | **PASS** |
| **FR-07** | **AC-ORD-05** | `TEST-ORD-05` | Automated Integration | `server/tests/orders.test.ts`:<br>• `GET /api/orders/:id returns itemized order receipt with preserved historic prices` | **PASS** |
| **FR-07** | **AC-ORD-05** | `TEST-ORD-05` | Automated Frontend | `client/tests/order-history.test.tsx`:<br>• `loads and displays itemized receipt with preserved historic prices and subtotal breakdown` | **PASS** |
| **FR-08** | **AC-OP-01** | `TEST-OP-01` | Automated Integration | `server/tests/operator-orders.test.ts`:<br>• `GET /api/operator/orders returns queue summary with newest-first ordering` | **PASS** |
| **FR-08** | **AC-OP-01** | `TEST-OP-01` | Automated Integration | `server/tests/operator-orders.test.ts`:<br>• `GET /api/operator/orders filters orders by PENDING, ACCEPTED, and REJECTED status` | **PASS** |
| **FR-08** | **AC-OP-01** | `TEST-OP-01` | Automated Frontend | `client/tests/operator.test.tsx`:<br>• `renders operator orders queue table with status filters and fulfillment action controls` | **PASS** |
| **FR-09** | **AC-OP-02** | `TEST-OP-02` | Automated Integration | `server/tests/operator-orders.test.ts`:<br>• `PATCH /api/operator/orders/:id/status transitions PENDING to ACCEPTED and preserves inventory` | **PASS** |
| **FR-09** | **AC-OP-02** | `TEST-OP-02` | Automated Frontend | `client/tests/operator.test.tsx`:<br>• `handles order acceptance: sends PATCH request and updates order status badge to Accepted` | **PASS** |
| **FR-10** | **AC-OP-03** | `TEST-OP-03` | Automated Integration | `server/tests/operator-orders.test.ts`:<br>• `PATCH /api/operator/orders/:id/status transitions PENDING to REJECTED and atomically restores stock` | **PASS** |
| **FR-10** | **AC-OP-03** | `TEST-OP-03` | Automated Integration | `server/tests/operator-orders.test.ts`:<br>• `PATCH restoration restores stock even for inactive catalog products` | **PASS** |
| **FR-10** | **AC-OP-03** | `TEST-OP-03` | Automated Frontend | `client/tests/operator.test.tsx`:<br>• `handles order rejection modal: requires confirmation before submitting PATCH and restores stock` | **PASS** |
| **BR-01** | **AC-BR-01** | `TEST-BR-01` | Automated Integration | `server/tests/orders.test.ts`:<br>• `POST /api/orders recalculates unit prices and totals authoritatively from database, ignoring client tampering` | **PASS** |
| **BR-02** | **AC-BR-02** | `TEST-BR-02` | Automated Integration | `server/tests/orders.test.ts`:<br>• `POST /api/orders preserves historical unit prices in OrderItem table even when Product.price is modified later` | **PASS** |
| **BR-03** | **AC-BR-03** | `TEST-BR-03` | Automated Integration | `server/tests/orders.test.ts`:<br>• `POST /api/orders rejects order with 409 INSUFFICIENT_STOCK when requested quantity exceeds inventory` | **PASS** |
| **BR-03** | **AC-BR-03** | `TEST-BR-03` | Automated Frontend | `client/tests/cart.test.tsx`:<br>• `highlights out-of-stock / simulation item in red with removal prompt and allows removal to restore order button` | **PASS** |
| **BR-03** | **AC-BR-04** | `TEST-BR-04` | Automated Unit | `server/tests/unit/test-database-safety.test.ts`:<br>• `validates order schema rejects non-positive or non-integer quantities` | **PASS** |
| **BR-03** | **AC-BR-04** | `TEST-BR-04` | Automated Integration | `server/tests/orders.test.ts`:<br>• `POST /api/orders rejects empty order items array with 400 Bad Request` | **PASS** |
| **BR-04** | **AC-SEC-01** | `TEST-SEC-01` | Automated Integration | `server/tests/orders.test.ts`:<br>• `GET /api/orders/:id returns 403 Forbidden or 404 Not Found when customer attempts to access another customer's order` | **PASS** |
| **BR-04** | **AC-SEC-01** | `TEST-SEC-01` | Automated Frontend | `client/tests/order-history.test.tsx`:<br>• `renders permission denied / access restricted card when customer enters another customer's order ID` | **PASS** |
| **BR-05** | **AC-SEC-02** | `TEST-SEC-02` | Automated Integration | `server/tests/operator-orders.test.ts`:<br>• `GET /api/operator/orders returns 403 Forbidden when called by customer role` | **PASS** |
| **BR-05** | **AC-SEC-02** | `TEST-SEC-02` | Automated Integration | `server/tests/operator-orders.test.ts`:<br>• `PATCH /api/operator/orders/:id/status returns 403 Forbidden when called by customer role` | **PASS** |
| **BR-05** | **AC-SEC-02** | `TEST-SEC-02` | Automated Frontend | `client/tests/operator-access.test.tsx`:<br>• `redirects customer role away from /operator/orders route` | **PASS** |
| **BR-05** | **AC-SEC-02** | `TEST-SEC-02` | Automated Frontend | `client/tests/catalog.test.tsx`:<br>• `hides Add to Order button and In Cart badge for OPERATOR role and displays staff notice` | **PASS** |
| **BR-06** | **AC-OP-02 / 03** | `TEST-BR-05` | Automated Integration | `server/tests/operator-orders.test.ts`:<br>• `PATCH rejects already ACCEPTED order with 409 ORDER_ALREADY_PROCESSED` | **PASS** |
| **BR-06** | **AC-OP-02 / 03** | `TEST-BR-05` | Automated Integration | `server/tests/operator-orders.test.ts`:<br>• `PATCH rejects already REJECTED order with 409 ORDER_ALREADY_PROCESSED` | **PASS** |
| **BR-06** | **AC-OP-02 / 03** | `TEST-BR-05` | Automated Integration | `server/tests/operator-orders.test.ts`:<br>• `competing concurrent PATCH requests yield exactly one 200 and one 409 conflict` | **PASS** |
| **NFR-01** | **AC-AUTH-01** | `TEST-AUTH-01` | Automated Integration | `server/tests/auth.test.ts`:<br>• `POST /api/auth/login sets httpOnly session cookie with secure configuration` | **PASS** |
| **NFR-01** | **AC-AUTH-02** | `TEST-AUTH-02` | Automated Integration | `server/tests/auth.test.ts`:<br>• `POST /api/auth/login verifies bcrypt password hash and rejects invalid credentials` | **PASS** |
| **NFR-01** | **AC-AUTH-03** | `TEST-AUTH-03` | Automated Integration | `server/tests/auth.test.ts`:<br>• `POST /api/auth/logout invalidates session server-side` | **PASS** |
| **NFR-01** | **AC-AUTH-04** | `TEST-AUTH-04` | Automated Integration | `server/tests/auth.test.ts`:<br>• `protected routes reject unauthenticated requests with 401 Unauthorized` | **PASS** |
| **NFR-02** | **AC-NFR-01** | `TEST-NFR-01` | Automated Integration | `server/tests/orders.test.ts`:<br>• `POST /api/orders rolls back entire Prisma transaction and preserves stock when mid-transaction error occurs` | **PASS** |
| **NFR-02** | **AC-NFR-01** | `TEST-NFR-01` | Automated Integration | `server/tests/operator-orders.test.ts`:<br>• `PATCH restoration failure rolls back both status update and preceding stock increments` | **PASS** |
| **NFR-03** | **AC-NFR-02** | `TEST-NFR-02` | Automated Unit / Bench | `server/tests/unit/operator-orders.test.ts`:<br>• `all unit test assertions complete in < 120ms total (< 200ms API SLA threshold)` | **PASS** |
| **NFR-04** | **AC-NFR-03** | `TEST-NFR-03` | Manual UI Walkthrough | Browser inspection:<br>• Responsive navbar, accessible form labels, clean print receipt stylesheet hiding non-receipt navigation | **VERIFIED** |
| **NFR-05** | **AC-NFR-04** | `TEST-NFR-04` | Automated Suite Run | `npm test` across client and server:<br>• 100% test pass rate across 184 automated tests; zero regressions | **PASS** |

---

## 3. Manual Verification & User Journey Checks

The following manual checks supplement the automated test suites to verify end-to-end user experience, browser rendering, print styling, and dialog focus trapping:

| Manual Check ID | Target Feature | Preconditions & User Role | Action / Steps Taken | Expected Visual & Functional Outcome | Verification Result |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **MAN-JOURNEY-01** | F-01, F-02, F-03, F-04 | Seeded database; Role: `CUSTOMER` (`customer1@example.com`) | Log in ➔ Browse Smartphones ➔ Add Flagship Pro Phone to Cart ➔ Checkout ➔ Navigate to `/orders` ➔ View Itemized Receipt | Order successfully created with unique `ORD-...` number; stock decrements live; order receipt displays historical unit prices. | **VERIFIED** |
| **MAN-REJECT-02** | F-03 | Seeded database; Role: `CUSTOMER` | Add Out-of-Stock Simulation product (or item at stock limit) ➔ Attempt checkout | Server returns 409 conflict; frontend displays persistent red-highlighted item card prompting removal; checkout blocked until removed. | **VERIFIED** |
| **MAN-FORBIDDEN-03** | F-01, F-05 | Authenticated as `CUSTOMER` | Attempt to access URL `/operator/orders` directly in browser bar | React route guard prevents access and redirects to `/` catalog; server API returns 403 Forbidden if called directly. | **VERIFIED** |
| **MAN-PRINT-04** | F-04, F-05 | Authenticated as `CUSTOMER` or `OPERATOR` | Open order receipt ➔ Click `🖨️ Print Receipt` ➔ Open Browser Print Preview | Navbar, buttons, and app shell chrome are completely hidden (`@media print .no-print`); only pure formatted receipt is rendered. | **VERIFIED** |

---

## 4. Test Suite Execution Logs (Evidence Excerpts)

### Client Test Suite (`npm --prefix client test`)
```text
> ecommerce-client@1.0.0 test
> vitest run

 RUN  v2.1.9 client

 ✓ tests/operator-api.test.tsx (4 tests)
 ✓ tests/auth.test.tsx (4 tests)
 ✓ tests/cart.test.tsx (5 tests)
 ✓ tests/order-history.test.tsx (6 tests)
 ✓ tests/operator-access.test.tsx (6 tests)
 ✓ tests/catalog.test.tsx (7 tests)
 ✓ tests/operator.test.tsx (11 tests)

 Test Files  7 passed (7)
      Tests  43 passed (43)
   Duration  5.73s
```

### Server Unit & Safety Suite (`npm --prefix server run test:unit`)
```text
> ecommerce-server@1.0.0 test:unit
> vitest run --config vitest.unit.config.ts

 RUN  v2.1.9 server

 ✓ tests/unit/test-database-safety.test.ts (15 tests)
 ✓ tests/unit/operator-orders.test.ts (33 tests)

 Test Files  2 passed (2)
      Tests  48 tests passed (48)
   Duration  766ms
```

### Server Full Integration Suite (`npm --prefix server test` with temporary container)
```text
> ecommerce-server@1.0.0 test
> vitest run

 RUN  v2.1.9 server

 ✓ tests/health.test.ts (2 tests)
 ✓ tests/auth.test.ts (12 tests)
 ✓ tests/products.test.ts (8 tests)
 ✓ tests/orders.test.ts (24 tests)
 ✓ tests/operator-orders.test.ts (47 tests)

 Test Files  5 passed (5)
      Tests  93 tests passed (93)
```
