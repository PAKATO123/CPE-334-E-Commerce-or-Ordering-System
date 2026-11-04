# Software Requirements Specification (SRS)
## CPE 334 — TechTent Everyday Electronics Ordering System
**Document Version**: 1.1.0 | **Date**: November 2026

### Team Information
> **Fill in the student details below:**
- **Student 1**: `Pattarapon Sribuathong 67070503434`
- **Student 2**: `[FILL IN: Student 2 Full Name — Student ID]`
- **Repository URL**: `https://github.com/PAKATO123/CPE-334-E-Commerce-or-Ordering-System.git`
- **Submitted Release Tag / Commit**: `[FILL IN: Release Tag / Commit SHA]`

---

## 1. Executive Summary & Problem Context

### 1.1 Context & Problem Statement
Consumer electronics retailers frequently face challenges managing fulfillment of high-demand consumer tech gadgets—including mobile phones, smart TVs, tablets, mechanical keyboards, and fast chargers. Without an integrated, authoritative ordering system, manual or social-commerce ordering leads to:
1. **Overselling High-Demand Inventory**: Accepting orders for popular devices when physical stock is already exhausted.
2. **Pricing Discrepancies & Stale Cart Totals**: Customers submitting checkout requests with outdated or client-manipulated prices, creating reconciliation overhead.
3. **Fulfillment Bottlenecks**: Lack of a centralized operator queue where incoming purchase requests can be inspected, stock verified, and orders formally accepted for warehouse packaging.

### 1.2 System Purpose: TechTent
**TechTent** is an authoritative, full-stack ordering platform engineered to manage the sales and fulfillment pipeline of everyday consumer technology products (Smartphones, Tablets, Smart TVs, Keyboards, and Power/Chargers). The system guarantees that:
- Customers can only purchase currently stocked devices at authoritative, server-enforced prices.
- Historic purchase prices are permanently preserved at the moment of order placement.
- Stock is reserved atomically upon order placement, preventing overselling.
- Operators maintain dedicated operational visibility to review line items and formally accept incoming orders.
- Strict data isolation prevents customers from viewing or modifying other customers' orders.

### 1.3 Scope of the Product
- **In-Scope (Full Lifecycle)**:
  - User identity and role-based authentication (`CUSTOMER`, `OPERATOR`, `ADMIN`).
  - Active product catalog with categorical grouping (Smartphones, Tablets, TVs, Keyboards, Chargers), descriptions, authoritative prices (USD), and real-time inventory levels.
  - Multi-item shopping cart and order placement with atomic transactional stock reservation.
  - Itemized customer order history and receipt retrieval.
  - Dedicated operator order management queue with one-click status transitions.
  - Later Sprints: Catalog administration, restocking, customer cancellation workflows, simulated payment state tracking, and aggregate sales analytics.
- **Explicit Exclusions**:
  - Real financial gateway integration (Stripe, Omise, PayPal); payment statuses are simulated through internal order state transitions.
  - External courier logistics tracking (FedEx, Kerry Express, Thailand Post APIs).
  - Multi-merchant marketplace / third-party vendor storefronts.

---

## 2. Actors & Stakeholder Responsibilities

| Actor | Role Identifier | Responsibilities & Access Scope |
|---|---|---|
| **Customer** | `CUSTOMER` | Authenticated consumer. Browses the TechTent tech catalog, reviews real-time device availability, constructs multi-item orders, submits orders, and reviews personal order receipts. Strictly prohibited from modifying prices or inspecting other users' transactions. |
| **Operator** | `OPERATOR` | Fulfillment and store operations staff. Monitors the incoming order queue, inspects customer order line items, verifies warehouse stock allocation, and transitions order status (e.g., `PENDING` ➔ `ACCEPTED` or `REJECTED`). |
| **Administrator** | `ADMIN` | Store supervisor. Possesses all Operator permissions, plus user account lifecycle oversight and upcoming catalog curation/price updates. |
| **Guest / Anonymous** | `ANONYMOUS` | Unauthenticated visitor. May access health check endpoints and login screen. Directed to authenticate before accessing catalog, cart, or order capabilities. |

---

## 3. Functional Requirements (FR)

### 3.1 Catalog & Product Browsing
- **FR-01 (Product Catalog Listing)**: The system shall provide an endpoint and UI view to list all active electronic products, displaying SKU, name, category, description, unit price (USD), and stock quantity.
- **FR-02 (Catalog Real-time Availability)**: The system shall reflect immediate stock availability, visibly marking items with zero stock as "Out of Stock" and disabling addition to order.

### 3.2 Order Assembly & Submission
- **FR-03 (Multi-Item Order Construction)**: Customers shall be able to select multiple distinct products, specify requested quantities for each item, and view a preview of line item subtotals and estimated total.
- **FR-04 (Order Submission & Atomic Persistence)**: The customer shall be able to submit an order. The system shall validate item availability, authoritatively compute pricing, create the order record with status `PENDING`, create corresponding line item snapshots, and reserve/decrement available stock within an atomic database transaction.
- **FR-05 (Unique Order Identification)**: The system shall generate a human-readable, unique order reference identifier for every created order conforming to `ORD-YYYYMMDD-XXXX`.

### 3.3 Customer Order History & Receipt Retrieval
- **FR-06 (Order History List)**: Authenticated customers shall be able to view a chronological list of their own submitted orders, showing Order Number, Creation Date, Status, Total Amount, and total item count.
- **FR-07 (Itemized Order Receipt)**: Customers shall be able to retrieve detailed receipts for any of their own orders, displaying the preserved unit prices, line item quantities, calculated line subtotals, grand total, and current status.

### 3.4 Operator Order Management Queue
- **FR-08 (Operator Incoming Queue)**: Operators shall have access to an operational queue displaying all incoming orders across all customers with filter controls by status (`PENDING`, `ACCEPTED`, `REJECTED`).
- **FR-09 (Operator Order Acceptance)**: Operators shall be able to accept an incoming `PENDING` order, transitioning its status to `ACCEPTED`.
- **FR-10 (Operator Order Rejection)**: Operators shall be able to reject an incoming `PENDING` order, immediately releasing reserved stock back to active inventory.

---

## 4. Business Rules (BR)

- **BR-01 (Authoritative Server-Side Price Calculation)**:
  - All line item subtotals (`unitPrice * quantity`) and order grand totals (`SUM(subtotals)`) must be computed authoritatively by the server using active catalog database records.
  - Client-submitted totals, subtotals, or price overrides must be ignored or rejected with `400 BAD_REQUEST`.
- **BR-02 (Historic Price Preservation)**:
  - At the moment an order is created, the active unit price of each catalog item must be copied into the `OrderItem` record.
  - Subsequent updates to catalog product prices shall have zero effect on historic order items or past order totals.
- **BR-03 (Quantity & Stock Integrity Validation)**:
  - Requested item quantities must be strictly positive integers (`quantity >= 1`). Non-integers, zero, or negative numbers must be rejected (`400 INVALID_QUANTITY`).
  - An order must contain at least one line item (`items.length >= 1`). Empty orders must be rejected (`400 EMPTY_ORDER`).
  - If any requested product is marked `isActive = false` or the requested quantity exceeds the current `stockQuantity`, the entire order transaction must be aborted and rejected with `409 INSUFFICIENT_STOCK`.
- **BR-04 (Customer Access Isolation)**:
  - Customers may only query and view orders where `order.customerId == session.user.id`.
  - Any attempt by a Customer to retrieve an order belonging to another customer via API (`GET /api/orders/:id`) must be rejected with `403 FORBIDDEN` (or `404 NOT_FOUND` to prevent ID enumeration).
- **BR-05 (Operator Fulfillment Authority)**:
  - Only authenticated users with role `OPERATOR` or `ADMIN` are authorized to query the operator queue (`GET /api/operator/orders`) or transition order statuses (`PATCH /api/operator/orders/:id/status`).
  - Customers attempting to access operator endpoints must receive `403 FORBIDDEN`.
- **BR-06 (Order Status Transition State Machine - Sprint 1)**:
  - Valid transitions:
    - `PENDING` ➔ `ACCEPTED` (Operator accept)
    - `PENDING` ➔ `REJECTED` (Operator reject; restores stock)
  - `ACCEPTED` and `REJECTED` are terminal for Sprint 1 (further shipping/completion states will be introduced in Sprint 2).
  - Orders cannot transition backwards to `PENDING`.

---

## 5. Non-Functional Requirements (NFR)

| NFR ID | Requirement Name | Measurable Target & Constraint | Verification Method |
|---|---|---|---|
| **NFR-01** | Session Security | All non-public endpoints require active cookie-based session authentication (`express-session`). Cookies must be `HttpOnly`, `SameSite=Lax`. Passwords must be hashed using `bcrypt` with salt rounds >= 10. | Automated test suite verifying 401 on unauthenticated requests and checking DB hash format. |
| **NFR-02** | Atomic Transaction Integrity | Order creation and stock decrement must execute within a database transaction. Partial creations (e.g. order saved but stock not decremented) must never occur. | Automated concurrency/transaction tests with intentionally failing line items verifying complete rollback. |
| **NFR-03** | Sub-Second API Response | Baseline catalog and order creation API calls must respond within < 200ms under standard local load. | Automated API test timing assertions. |
| **NFR-04** | Responsive & Accessible UI | Application layout must render cleanly across Mobile (375px), Tablet (768px), and Desktop (1200px+) viewports using standard CSS tokens. Form inputs must have accessible labels. | Playwright responsive viewport validation and visual inspection. |
| **NFR-05** | Traceability & TDD Discipline | Every Sprint 1 Acceptance Criteria must map to an executable test in the Software Test Specification (STS). | Traceability matrix and passing Vitest test suites. |

---

## 6. Assumptions & Engineering Decisions

1. **Local Authentication & Seed Users**: Sprint 1 uses seeded demo accounts for grading (`customer1@example.com`, `operator1@example.com`, `admin@example.com`) to allow instant evaluation without external email or SMS dependencies.
2. **Immediate Stock Reservation**: Stock is decremented immediately upon order placement in `PENDING` state. If an operator rejects the order, stock is restored. This guarantees that an order cannot be placed if stock is depleted.
3. **Currency & Precision**: All financial amounts are stored as `Decimal(10, 2)` in PostgreSQL and presented in US Dollars (`$`) formatted to two decimal places to prevent floating-point rounding inaccuracies.
