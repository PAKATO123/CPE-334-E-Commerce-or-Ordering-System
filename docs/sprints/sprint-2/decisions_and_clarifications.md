# Sprint 2 Decisions & Clarifications Sheet

---

## 1. Confirmed Strategic & Architectural Decisions (Sprint 2)

The following architectural and domain design decisions govern Sprint 2 implementation for the **TechTent** everyday consumer electronics ordering platform.

### 1.1 Dual-Track State Machine: Fulfillment Status vs. Payment Status (F-07, F-08)
- **Decision**: Decouple physical fulfillment status from financial payment lifecycle:
  - **Fulfillment Status (`Order.status`)**:
    - `PENDING` ➔ `ACCEPTED` ➔ `PACKED` ➔ `SHIPPED` (Normal fulfillment flow)
    - `PENDING` ➔ `CANCELLED` (Customer cancellation; BR-08)
    - `PENDING` ➔ `REJECTED` (Operator rejection; BR-06)
  - **Payment Status (`Order.paymentStatus`)**:
    - `UNPAID` ➔ `PAID` (Simulated customer payment via `POST /api/orders/:id/pay`)
    - `PAID` ➔ `REFUNDED` (Triggered automatically if an order is `CANCELLED` or `REJECTED`)
    - `UNPAID` ➔ `VOID` (If an unpaid order is cancelled or rejected)
- **Rationale**: Combining fulfillment and payment into a single string enum leads to combinatorial explosion (e.g. `ACCEPTED_AND_UNPAID`, `ACCEPTED_AND_PAID`, `SHIPPED_AND_PAID`). Separating the concerns mirrors real-world enterprise architectures and guarantees that financial reconciliation operates independently of warehouse packing.

### 1.2 Customer Order Cancellation Scope & Concurrency Boundaries (F-07, BR-08)
- **Decision**:
  - Customers may cancel an order if and only if its fulfillment status is currently `PENDING`.
  - Once an operator marks an order as `ACCEPTED`, `PACKED`, or `SHIPPED`, customer unilateral cancellation is rejected with `409 Conflict` (`ORDER_ALREADY_ACCEPTED`).
  - Cancellation must be executed within an atomic database transaction (`prisma.$transaction`) using a conditional write (`WHERE id = :id AND status = 'PENDING'`).
  - Upon successful cancellation:
    1. `Order.status` is set to `CANCELLED`.
    2. `Order.cancelledAt` timestamp is recorded.
    3. If `paymentStatus === 'PAID'`, `Order.paymentStatus` is set to `REFUNDED` and `Order.refundedAt` timestamp is recorded.
    4. Reserved quantities for all line items are atomically restored back to `Product.stockQuantity`.
- **Rationale**: Eliminates race conditions where an operator accepts an order while the customer clicks cancel at the same instant. Guarantees inventory conservation.

### 1.3 Catalog Curation & Restocking Architecture (F-06, BR-07)
- **Decision**:
  - Dedicated administrative management under `/operator/products` and API `/api/products`.
  - **Role Authorization**: Both `OPERATOR` and `ADMIN` roles can curate products and restock inventory. `CUSTOMER` access is rejected with `403 Forbidden`.
  - **Immutability & Soft Deletion**: Hard deletion (`DELETE /api/products/:id`) is disallowed because `OrderItem` records maintain foreign keys to `Product.id`. Discontinuing a product sets `isActive = false`, immediately excluding it from public catalog browsing (`F-02`) while preserving historic order receipts (`F-04`).
  - **Dual Mutation Endpoints**:
    1. General Product Edit (`PATCH /api/products/:id`): Updates `name`, `category`, `description`, `price`, `isActive`. Price updates validate strictly that `price > 0`.
    2. Atomic Restock (`POST /api/products/:id/restock`): Requires `{ "quantity": positive_integer }`. Increments `stockQuantity` atomically (`increment: quantity`), preventing overwriting concurrent checkout reservations.

### 1.4 Database Schema Migrations for Sprint 2
- **Decision**: Extend Prisma schema with backwards-compatible attributes:
  - `Order.paymentStatus`: String / Enum default `"UNPAID"` (values: `UNPAID`, `PAID`, `REFUNDED`, `VOID`).
  - `Order.paidAt`: Optional `DateTime` recording timestamp of simulated payment.
  - `Order.cancelledAt`: Optional `DateTime` recording timestamp of cancellation.
  - `Order.refundedAt`: Optional `DateTime` recording timestamp of refund.
  - `Order.cancellationReason`: Optional `String` for customer cancellation note.
- **Rationale**: Existing Sprint 1 orders remain completely valid with default `UNPAID` status. No destructive column drops.

### 1.5 Simulated Payment Execution Model (F-08, BR-09, BR-10)
- **Decision**:
  - Payment is simulated via `POST /api/orders/:id/pay`.
  - Only the authenticated order owner (`CUSTOMER`) or store `ADMIN` can execute payment.
  - Valid precondition: `Order.paymentStatus === 'UNPAID'` and `Order.status` is not `CANCELLED` or `REJECTED`.
  - Simulated payment payload accepts payment method identifier (e.g., `SIMULATED_CARD`, `SIMULATED_PROMPTPAY`).
  - Re-paying an already paid order returns `409 Conflict` (`ORDER_ALREADY_PAID`).

---

## 2. Summary Table: Status Transition Matrix

| Current State (`status`, `paymentStatus`) | Action | Actor | New State (`status`, `paymentStatus`) | Inventory Effect |
|---|---|---|---|---|
| `(PENDING, UNPAID)` | Place Order | Customer | Initial creation | Decrement stock atomically |
| `(PENDING, UNPAID)` | Pay Order | Customer | `(PENDING, PAID)` | None (already reserved) |
| `(PENDING, PAID)` | Operator Accept | Operator | `(ACCEPTED, PAID)` | None (reservation finalized) |
| `(PENDING, UNPAID)` | Operator Accept | Operator | `(ACCEPTED, UNPAID)` | None (reservation finalized) |
| `(PENDING, UNPAID)` | Customer Cancel | Customer | `(CANCELLED, VOID)` | **Increment stock atomically** |
| `(PENDING, PAID)` | Customer Cancel | Customer | `(CANCELLED, REFUNDED)` | **Increment stock atomically** |
| `(PENDING, UNPAID)` | Operator Reject | Operator | `(REJECTED, VOID)` | **Increment stock atomically** |
| `(PENDING, PAID)` | Operator Reject | Operator | `(REJECTED, REFUNDED)` | **Increment stock atomically** |
| `(ACCEPTED, PAID)` | Operator Pack | Operator | `(PACKED, PAID)` | None |
| `(PACKED, PAID)` | Operator Ship | Operator | `(SHIPPED, PAID)` | None |
| `(ACCEPTED / PACKED / SHIPPED, *)` | Customer Cancel | Customer | **REJECTED (409 Conflict)** | None |
