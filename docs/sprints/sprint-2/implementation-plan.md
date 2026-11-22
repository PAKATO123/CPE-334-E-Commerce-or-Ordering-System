# Sprint 2 Implementation & Branch Tracking Plan

---

## 1. Sprint 2 Overview & Delivery Strategy

- **Sprint Goal**: Implement the Sprint 2 core domain expansion for **TechTent**:
  - `F-06`: Catalog Curation & Inventory Restocking
  - `F-07`: Customer Order Cancellation & Stock Restoral
  - `F-08`: Simulated Payment Status State Machine & Fulfillment Progression
- **Base Integration Branch**: `sprint-2-staging` (branched from `main` after Lab 5 deployment tag `lab5`)
- **Release Target**: Integrated candidate on `main` for Deliverable 2 submission (Due 29 November 2026).
- **Engineering Principles**:
  - Every feature branch originates from `sprint-2-staging`.
  - Strict Test-Driven Development (TDD): commit failing test (Red), implement passing code (Green), refactor and verify.
  - Substantive peer review on every PR between PAKATO and Joey-pku before merging into staging.
  - Zero regression on existing Sprint 1 vertical slice (182 tests).

---

## 2. Sprint 2 Branch Tracking Matrix

| Branch Identifier | Base Branch | Target Branch | Feature / Scope | Owner | Reviewer | Status |
|---|---|---|---|---|---|:---:|
| **`S2-00/Docs`** | `sprint-2-staging` | `sprint-2-staging` | Sprint 2 baseline contracts, AC, STS, DoD, decisions, and traceability | PAKATO | Joey-pku | **READY FOR PR** |
| **`F-06/CatalogManagement`** | `sprint-2-staging` | `sprint-2-staging` | Product CRUD, soft-deletion toggle (`isActive`), sorting (price, stock, status), Zen Green theme, and atomic restocking endpoint + UI | PAKATO | Joey-pku | **IMPLEMENTED & VERIFIED** |
| **`F-07/CustomerCancellation`**| `sprint-2-staging` | `sprint-2-staging` | Customer cancellation for `PENDING` orders with atomic stock restoral + UI modal | Joey-pku | PAKATO | **IMPLEMENTED & VERIFIED** |
| **`F-08/PaymentStateMachine`** | `sprint-2-staging` | `sprint-2-staging` | Simulated payment (`UNPAID` ➔ `PAID` ➔ `REFUNDED`) and fulfillment progression (`PACKED`, `SHIPPED`) | PAKATO | Joey-pku | **PLANNED** |
| **`sprint-2-staging` (Integration)**| `main` | `main` | Sprint 2 release candidate integration, full regression suite execution, and GCP deployment | Both | Both | **PLANNED** |

---

## 3. Detailed Branch Implementation Blueprints

### Branch 1: `S2-00/Docs` (Documentation & Contract Foundation)
- **Primary Goal**: Establish complete, unambiguous engineering contracts, test specifications, and updated system baseline before code implementation begins.
- **Files Touched**:
  - `docs/sprints/sprint-2/feature-specs.md` (Contracts for F-06, F-07, F-08)
  - `docs/sprints/sprint-2/sts.md` (Software Test Specification for Sprint 2)
  - `docs/sprints/sprint-2/decisions_and_clarifications.md` (Domain rules & architecture decisions)
  - `docs/sprints/sprint-2/change-register.md` (Part A continuity & change register)
  - `docs/sprints/sprint-2/implementation-plan.md` (This branch execution tracker)
  - `docs/srs.md` (Updated baseline requirements FR-11 to FR-13, BR-07 to BR-10)
  - `docs/system-sds.md` (Updated data models, RBAC, state machine)
  - `docs/features.md` (Updated feature inventory)
  - `docs/traceability.md` (Updated traceability matrix)
  - `docs/sprints/plan.md` (Updated three-sprint plan)
- **Verification Checklist**:
  - [x] All 3 Sprint 2 contracts contain linked FR/BR/NFR, SDS, UI/API/Data specs, ACs, STS, and DoD.
  - [x] Layer impact explicitly states when no change is required.
  - [x] Bidirectional traceability verified across all documents.
- **Next Step**: Open PR from `S2-00/Docs` into `sprint-2-staging`, obtain peer review, and merge.

---

### Branch 2: `F-06/CatalogManagement` (Feature 6)
- **Primary Goal**: Enable store operators and admins to add new consumer electronics, edit specifications, toggle active status, and restock quantities.
- **Database / Schema**:
  - Existing `Product` table already contains necessary fields (`sku`, `name`, `category`, `description`, `price`, `stockQuantity`, `isActive`).
  - No destructive migrations.
- **Backend API Implementation**:
  - `server/src/routes/products.ts`:
    - `POST /api/products` (Require role: `OPERATOR` or `ADMIN`)
    - `PATCH /api/products/:id` (Require role: `OPERATOR` or `ADMIN`)
    - `POST /api/products/:id/restock` (Require role: `OPERATOR` or `ADMIN`)
  - `server/src/services/products.ts`:
    - Input validation (positive price `> 0`, non-negative stock `>= 0`, unique `sku`).
    - Atomic restock transaction: `{ stockQuantity: { increment: quantity } }`.
- **Frontend Presentation Implementation**:
  - Add `/operator/products` (ProductManagementPage) with category filter and search.
  - Product table displaying SKU, Name, Category, Price, Stock, Active status badge, and Action buttons.
  - "Add Product" modal with field validation.
  - "Restock Inventory" numeric modal.
  - Add navigation link in Navbar for Operator/Admin roles.
- **Test Specifications & Commands**:
  - Test File: `server/tests/catalog-management.test.ts`
  - Client Test File: `client/tests/catalog-management.test.tsx`
  - Execution Command:
    ```powershell
    npm.cmd --prefix server test -- catalog-management.test.ts
    npm.cmd --prefix client test -- catalog-management.test.tsx
    ```
- **Acceptance Criteria Verification**:
  - [x] AC-CAT-MGMT-01: Create valid product.
  - [x] AC-CAT-MGMT-02: Reject duplicate SKU with 409 Conflict.
  - [x] AC-CAT-MGMT-03: Reject negative price or stock with 400 Bad Request.
  - [x] AC-CAT-MGMT-04: Edit product metadata and toggle `isActive`.
  - [x] AC-CAT-MGMT-05: Atomic inventory restock increments quantity accurately.
  - [x] AC-CAT-MGMT-06: Customer role access rejected with 403 Forbidden.

---

### Branch 3: `F-07/CustomerCancellation` (Feature 7)
- **Primary Goal**: Allow authenticated customers to cancel their own `PENDING` orders with automated, atomic restoration of reserved stock in PostgreSQL.
- **Database / Schema Migration**:
  - Update `Order` in `server/prisma/schema.prisma`:
    - `cancelledAt DateTime?`
    - `cancellationReason String?`
  - Run `npx prisma migrate dev --name add_order_cancellation_fields`.
- **Backend API Implementation**:
  - `server/src/routes/orders.ts`:
    - `POST /api/orders/:id/cancel` (Require auth; enforce customer ownership or admin).
  - `server/src/services/cancellation.ts`:
    - Conditional status update: `UPDATE Order SET status = 'CANCELLED' WHERE id = :id AND status = 'PENDING'`.
    - If status was not `PENDING` (e.g. `ACCEPTED`), abort with `409 Conflict` (`ORDER_ALREADY_PROCESSED`).
    - Inside `prisma.$transaction`:
      1. Transition order status to `CANCELLED` and record `cancelledAt`.
      2. Loop over order items and execute `{ stockQuantity: { increment: item.quantity } }`.
      3. If `paymentStatus === 'PAID'`, transition `paymentStatus` to `REFUNDED` and set `refundedAt`.
- **Frontend Presentation Implementation**:
  - `client/src/pages/OrderDetailPage.tsx`:
    - Conditionally render "Cancel Order" button only when `order.status === 'PENDING'`.
    - Cancellation confirmation modal with optional reason input.
    - Updated status badges: Red badge for `CANCELLED`, showing cancellation timestamp and reason.
- **Test Specifications & Commands**:
  - Test File: `server/tests/order-cancellation.test.ts`
  - Client Test File: `client/tests/order-cancellation.test.tsx`
  - Execution Command:
    ```powershell
    npm.cmd --prefix server test -- order-cancellation.test.ts
    npm.cmd --prefix client test -- order-cancellation.test.tsx
    ```
- **Acceptance Criteria Verification**:
  - [x] AC-ORD-CAN-01: Customer can cancel their own `PENDING` order.
  - [x] AC-ORD-CAN-02: Reserved quantities atomically restored to products in PostgreSQL.
  - [x] AC-ORD-CAN-03: Cancelling `ACCEPTED` or terminal order returns 409 Conflict.
  - [x] AC-ORD-CAN-04: Cross-customer cancellation attempts return 403 Forbidden.
  - [x] AC-ORD-CAN-05: Cancelling a paid order transitions `paymentStatus` to `REFUNDED`.
  - [x] AC-ORD-CAN-06: Concurrent cancellation calls execute atomically without double-restoring stock.

---

### Branch 4: `F-08/PaymentStateMachine` (Feature 8)
- **Primary Goal**: Implement simulated payment state machine (`UNPAID` ➔ `PAID` ➔ `REFUNDED`) and extended fulfillment progression (`ACCEPTED` ➔ `PACKED` ➔ `SHIPPED`).
- **Database / Schema Migration**:
  - Update `Order` in `server/prisma/schema.prisma`:
    - `paymentStatus String @default("UNPAID")`
    - `paymentMethod String?`
    - `paidAt DateTime?`
    - `refundedAt DateTime?`
  - Run `npx prisma migrate dev --name add_order_payment_lifecycle`.
- **Backend API Implementation**:
  - `server/src/routes/orders.ts`:
    - `POST /api/orders/:id/pay` (Require auth; enforce customer ownership or admin).
  - `server/src/services/payment.ts`:
    - Validate `paymentStatus === 'UNPAID'` and order status is not terminal (`CANCELLED`, `REJECTED`).
    - Transition to `PAID`, record `paidAt` and `paymentMethod`.
  - `server/src/services/operatorOrders.ts`:
    - Extend allowed fulfillment status transitions:
      - `PENDING` ➔ `ACCEPTED` or `REJECTED`
      - `ACCEPTED` ➔ `PACKED`
      - `PACKED` ➔ `SHIPPED`
    - Invalidate backward transitions or skipped steps (e.g., `PENDING` ➔ `SHIPPED`).
- **Frontend Presentation Implementation**:
  - `client/src/pages/OrderDetailPage.tsx`:
    - Render "Pay Now (Simulated)" button for `UNPAID` non-cancelled orders.
    - Payment modal offering simulated payment methods (`Simulated Card`, `Simulated PromptPay`).
    - Distinct badges for payment status (`UNPAID`, `PAID`, `REFUNDED`).
  - `client/src/pages/OperatorOrdersPage.tsx`:
    - Action buttons to advance fulfillment: "Mark Packed" and "Mark Shipped".
- **Test Specifications & Commands**:
  - Test File: `server/tests/payment-lifecycle.test.ts`
  - Client Test File: `client/tests/payment-lifecycle.test.tsx`
  - Execution Command:
    ```powershell
    npm.cmd --prefix server test -- payment-lifecycle.test.ts
    npm.cmd --prefix client test -- payment-lifecycle.test.tsx
    ```
- **Acceptance Criteria Verification**:
  - [ ] AC-PAY-01: New orders initialize with `paymentStatus = 'UNPAID'`.
  - [ ] AC-PAY-02: Customer can simulate payment, setting `PAID` and `paidAt`.
  - [ ] AC-PAY-03: Duplicate payment calls rejected with 409 Conflict (`ORDER_ALREADY_PAID`).
  - [ ] AC-PAY-04: Cannot pay a cancelled or rejected order (422 Unprocessable).
  - [ ] AC-PAY-05: Operator progresses fulfillment through `ACCEPTED` ➔ `PACKED` ➔ `SHIPPED`.
  - [ ] AC-PAY-06: Disallowed transition skips rejected with 400 Bad Request.
  - [ ] AC-PAY-07: Operator rejection of a paid order automatically sets `paymentStatus = 'REFUNDED'`.

---

### Branch 5: `sprint-2-staging` (Release Candidate Integration & Verification)
- **Primary Goal**: Merge and integrate all three feature branches, execute complete regression test suites, verify live deployment on Cloud Run, and compile Deliverable 2 submission package.
- **Execution Checklist**:
  - [ ] All 3 feature PRs (`F-06`, `F-07`, `F-08`) peer reviewed and merged into `sprint-2-staging`.
  - [ ] Run complete database-free test suites:
    ```powershell
    npm.cmd --prefix server run test:unit
    npm.cmd --prefix client test
    npm.cmd --prefix server run build
    npm.cmd --prefix client run build
    ```
  - [ ] Run full database integration regression suite (Sprint 1 + Sprint 2):
    ```powershell
    $env:TECHTENT_ALLOW_DATABASE_TESTS="true"
    $env:TECHTENT_TEST_DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:55435/techtent_test?schema=public"
    npm.cmd --prefix server test
    ```
  - [ ] Open release PR from `sprint-2-staging` into `main`.
  - [ ] Verify automated Cloud Run deployment in GitHub Actions.
  - [ ] Run post-deployment smoke test on live Cloud Run service.
  - [ ] Generate Deliverable 2 self-contained PDF.
