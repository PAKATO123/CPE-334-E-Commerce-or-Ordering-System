# Requirements to Feature & Sprint Traceability Matrix

---

## 1. Traceability Overview & Policy

This matrix establishes bidirectional traceability connecting every system requirement (Functional Requirements `FR-01` to `FR-14`, Business Rules `BR-01` to `BR-10`, and Non-Functional Requirements `NFR-01` to `NFR-05`) to its allocated feature, target sprint, Acceptance Criteria (AC), planned Software Test Specification (STS), implementation file, test suite, and verified status.

Requirements currently under development in Sprint 2 are marked **IN PROGRESS (CONTRACTED)** with their target Sprint 2 test specifications.

---

## 2. Requirements Traceability Matrix

| Req ID | Requirement Description | Allocated Feature | Target Sprint | Acceptance Criteria (AC) | Planned Test (STS) | Implementation Target File | Executable Test File / Suite | Result | Verified Version |
|---|---|---|---|---|---|---|---|:---:|---|
| **FR-01** | Active catalog listing with everyday tech & stock | F-02 Catalog Browsing | Sprint 1 | AC-CAT-01, AC-CAT-02 | TEST-CAT-01, TEST-CAT-02 | `server/src/routes/products.ts`, `client/src/pages/CatalogPage.tsx` | `server/tests/products.test.ts`, `client/tests/catalog.test.tsx` | **PASS** | `R1` (`9ff3341`) |
| **FR-02** | Real-time stock display & out-of-stock badge | F-02 Catalog Browsing | Sprint 1 | AC-CAT-03 | TEST-CAT-03 | `client/src/components/ProductCard.tsx` | `client/tests/catalog.test.tsx` | **PASS** | `R1` (`9ff3341`) |
| **FR-03** | Multi-item cart construction with quantity | F-03 Order Assembly | Sprint 1 | AC-ORD-01 | TEST-ORD-01 | `client/src/components/CartDrawer.tsx` | `client/tests/cart.test.tsx` | **PASS** | `R1` (`9ff3341`) |
| **FR-04** | Atomic order persistence with PENDING status | F-03 Order Assembly | Sprint 1 | AC-ORD-02 | TEST-ORD-02 | `server/src/services/orders.ts` | `server/tests/orders.test.ts` | **PASS** | `R1` (`9ff3341`) |
| **FR-05** | Unique order reference generation (`ORD-...`) | F-03 Order Assembly | Sprint 1 | AC-ORD-03 | TEST-ORD-03 | `server/src/utils/orderNumber.ts` | `server/tests/unit/orderNumber.test.ts` | **PASS** | `R1` (`9ff3341`) |
| **FR-06** | Chronological customer order history list | F-04 Order Details | Sprint 1 | AC-ORD-04 | TEST-ORD-04 | `client/src/pages/OrderHistoryPage.tsx` | `server/tests/orders.test.ts`, `client/tests/orders.test.tsx` | **PASS** | `R1` (`9ff3341`) |
| **FR-07** | Itemized order receipt with preserved prices | F-04 Order Details | Sprint 1 | AC-ORD-05 | TEST-ORD-05 | `client/src/pages/OrderDetailPage.tsx` | `server/tests/orders.test.ts`, `client/tests/orders.test.tsx` | **PASS** | `R1` (`9ff3341`) |
| **FR-08** | Operator operational queue with status filters | F-05 Operator Queue | Sprint 1 | AC-OP-01 | TEST-OP-01 | `server/src/services/operatorOrders.ts`, `client/src/pages/OperatorOrdersPage.tsx` | `server/tests/operator-orders.test.ts`, `client/tests/operator.test.tsx` | **PASS** | `lab5` (`e17f136`) |
| **FR-09** | Operator order acceptance (`PENDING` ➔ `ACCEPTED`)| F-05 Operator Queue | Sprint 1 | AC-OP-02 | TEST-OP-02 | `server/src/services/operatorOrders.ts` | `server/tests/operator-orders.test.ts` | **PASS** | `lab5` (`e17f136`) |
| **FR-10** | Operator order rejection and stock restoration | F-05 Operator Queue | Sprint 1 | AC-OP-03 | TEST-OP-03 | `server/src/services/operatorOrders.ts` | `server/tests/operator-orders.test.ts` | **PASS** | `lab5` (`e17f136`) |
| **FR-11** | Catalog curation and atomic restocking | F-06 Catalog Mgmt | Sprint 2 | AC-CAT-MGMT-01 through 06 | TEST-CAT-M01 through M06 | `server/src/routes/products.ts`, `client/src/pages/ProductManagementPage.tsx` | `server/tests/catalog-management.test.ts` | **IN PROGRESS** | Sprint 2 Candidate |
| **FR-12** | Customer order cancellation & stock release | F-07 Cancellation | Sprint 2 | AC-ORD-CAN-01 through 06 | TEST-CAN-01 through 06 | `server/src/services/cancellation.ts`, `client/src/pages/OrderDetailPage.tsx` | `server/tests/order-cancellation.test.ts` | **IN PROGRESS** | Sprint 2 Candidate |
| **FR-13** | Simulated payment status state transitions | F-08 Payment States | Sprint 2 | AC-PAY-01 through 07 | TEST-PAY-01 through 07 | `server/src/routes/orders.ts`, `client/src/components/PaymentModal.tsx` | `server/tests/payment-lifecycle.test.ts` | **IN PROGRESS** | Sprint 2 Candidate |
| **FR-14** | Sales summary and turnaround reports | F-09 Sales Reports | Sprint 3 | AC-REP-01 through 05 | TEST-REP-01 through 05 | Deferred to Sprint 3 | Deferred to Sprint 3 | **PLANNED** | Sprint 3 |
| **BR-01** | Authoritative backend price & total calculation | F-03 Order Assembly | Sprint 1 | AC-BR-01 | TEST-BR-01 | `server/src/services/orders.ts` | `server/tests/orders.test.ts` | **PASS** | `R1` (`9ff3341`) |
| **BR-02** | Historic price preservation at time of order | F-03 / F-04 | Sprint 1 | AC-BR-02 | TEST-BR-02 | `server/src/services/orders.ts` | `server/tests/orders.test.ts` | **PASS** | `R1` (`9ff3341`) |
| **BR-03** | Stock availability & positive quantity validation | F-03 Order Assembly | Sprint 1 | AC-BR-03, AC-BR-04 | TEST-BR-03, TEST-BR-04 | `server/src/services/orders.ts` | `server/tests/orders.test.ts`, `server/tests/unit/orderValidation.test.ts` | **PASS** | `R1` (`9ff3341`) |
| **BR-04** | Customer order data isolation (no cross-access) | F-04 Order Details | Sprint 1 | AC-SEC-01 | TEST-SEC-01 | `server/src/routes/orders.ts` | `server/tests/orders.test.ts` | **PASS** | `R1` (`9ff3341`) |
| **BR-05** | Operator endpoint role authorization (`403`) | F-05 Operator Queue | Sprint 1 | AC-SEC-02 | TEST-SEC-02 | `server/src/middleware/auth.ts` | `server/tests/operator-orders.test.ts` | **PASS** | `lab5` (`e17f136`) |
| **BR-06** | Fulfillment order status transition rules | F-05 / F-08 | S1 / S2 | AC-OP-02, AC-OP-03, AC-PAY-05 | TEST-BR-05, TEST-PAY-05 | `server/src/services/operatorOrders.ts` | `server/tests/operator-orders.test.ts`, `server/tests/payment-lifecycle.test.ts` | **PASS (S1) / IN PROGRESS (S2)** | `lab5` / Sprint 2 |
| **BR-07** | Catalog soft deletion & price integrity | F-06 Catalog Mgmt | Sprint 2 | AC-CAT-MGMT-03, 04 | TEST-CAT-M03, TEST-CAT-M04 | `server/src/services/products.ts` | `server/tests/catalog-management.test.ts` | **IN PROGRESS** | Sprint 2 Candidate |
| **BR-08** | Customer cancellation window & atomic restoral | F-07 Cancellation | Sprint 2 | AC-ORD-CAN-02, 03 | TEST-CAN-01, TEST-CAN-02 | `server/src/services/cancellation.ts` | `server/tests/order-cancellation.test.ts` | **IN PROGRESS** | Sprint 2 Candidate |
| **BR-09** | Decoupled simulated payment state machine | F-08 Payment States | Sprint 2 | AC-PAY-01, 02, 03 | TEST-PAY-01, TEST-PAY-03 | `server/src/services/orders.ts` | `server/tests/payment-lifecycle.test.ts` | **IN PROGRESS** | Sprint 2 Candidate |
| **BR-10** | Terminal state payment invariance & refund | F-07 / F-08 | Sprint 2 | AC-ORD-CAN-05, AC-PAY-07 | TEST-CAN-05, TEST-PAY-07 | `server/src/services/cancellation.ts`, `server/src/services/operatorOrders.ts` | `server/tests/order-cancellation.test.ts` | **IN PROGRESS** | Sprint 2 Candidate |
| **NFR-01** | Session auth, password hashing & RBAC route guard | F-01 Authentication | Sprint 1 | AC-AUTH-01, AC-AUTH-02 | TEST-AUTH-01, TEST-AUTH-02 | `server/src/middleware/auth.ts`, `client/src/App.tsx` | `server/tests/auth.test.ts`, `client/tests/operator-access.test.tsx` | **PASS** | `R1` (`9ff3341`) |
| **NFR-02** | Atomic transaction integrity & DB constraints | F-03, F-05, F-07 | S1, S2 | AC-NFR-01, AC-ORD-CAN-02 | TEST-NFR-01, TEST-CAN-06 | `server/src/services/orders.ts`, `cancellation.ts` | `server/tests/orders.test.ts`, `server/tests/operator-orders.test.ts` | **PASS (S1) / IN PROGRESS (S2)** | `R1` / Sprint 2 |
| **NFR-03** | Sub-second API response (< 200ms) | All Features | S1, S2 | AC-NFR-02 | TEST-NFR-02 | Express server API handlers | API automated timing benchmarks | **PASS** | Continuous |
| **NFR-04** | Responsive UI (375px–1200px) & accessible labels | All UI Views | S1, S2 | AC-NFR-03 | TEST-NFR-03 | React App CSS tokens & forms | `client/tests/*.test.tsx`, Playwright viewport checks | **PASS (Component) / PLANNED (Visual E2E)** | `R1` / Final |
| **NFR-05** | Traceability & TDD discipline | Engineering Process | S1, S2 | AC-NFR-04 | TEST-NFR-04 | Git commit history & test suites | Vitest test runners (182 passing baseline tests) | **PASS** | Continuous |
