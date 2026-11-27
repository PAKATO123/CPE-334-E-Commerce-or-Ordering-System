# Software Requirements Specification (SRS)

---

## 1. Executive Summary & Problem Context

### 1.1 Context & Problem Statement
Consumer electronics retailers frequently face challenges managing fulfillment of high-demand consumer tech gadgets—including mobile phones, smart TVs, tablets, mechanical keyboards, and fast chargers. Without an integrated, authoritative ordering system, manual or social-commerce ordering leads to:
1. **Overselling High-Demand Inventory**: Accepting orders for popular devices when physical stock is already exhausted.
2. **Pricing Discrepancies & Stale Cart Totals**: Customers submitting checkout requests with outdated or client-manipulated prices, creating reconciliation overhead.
3. **Fulfillment Bottlenecks**: Lack of a centralized operator queue where incoming purchase requests can be inspected, stock verified, and orders formally accepted for warehouse packaging.
4. **Lack of Lifecycle Controls**: Inability for customers to cancel accidental purchases prior to fulfillment, or for operators to curate catalog inventory and observe sales status.

### 1.2 System Purpose: TechTent
**TechTent** is an authoritative, full-stack ordering platform engineered to manage the sales and fulfillment pipeline of everyday consumer technology products (Smartphones, Tablets, Smart TVs, Keyboards, and Power/Chargers). The system guarantees that:
- Customers can only purchase currently stocked devices at authoritative, server-enforced prices.
- Historic purchase prices are permanently preserved at the moment of order placement.
- Stock is reserved atomically upon order placement, preventing overselling.
- Customers can cancel `PENDING` orders, triggering automated atomic stock restoral and payment refund.
- Operators maintain dedicated operational visibility to review line items, accept/reject incoming orders, advance fulfillment states (`ACCEPTED` ➔ `PACKED` ➔ `SHIPPED`), and curate catalog inventory with atomic restocking.
- Simulated payment lifecycle (`UNPAID` ➔ `PAID` ➔ `REFUNDED`) operates seamlessly alongside physical fulfillment.
- Strict data isolation prevents customers from viewing or modifying other customers' orders.

### 1.3 Scope of the Product
- **In-Scope (Sprint 1 Baseline + Sprint 2 Core Expansion)**:
  - User identity and role-based authentication (`CUSTOMER`, `OPERATOR`, `ADMIN`).
  - Active product catalog with categorical grouping (Smartphones, Tablets, TVs, Keyboards, Chargers), descriptions, authoritative prices (USD), and real-time inventory levels.
  - Multi-item shopping cart and order placement with atomic transactional stock reservation.
  - Itemized customer order history and receipt retrieval.
  - Operator order queue with status filters and fulfillment progression (`PENDING`, `ACCEPTED`, `PACKED`, `SHIPPED`, `CANCELLED`, `REJECTED`).
  - Catalog curation and atomic inventory restocking by store operators (`F-06`).
  - Customer order cancellation with automated atomic stock restoral (`F-07`).
  - Simulated payment status tracking (`UNPAID`, `PAID`, `REFUNDED`, `VOID`) (`F-08`).
- **Deferred to Sprint 3**:
  - Executive sales summaries and fulfillment turnaround metrics (`F-09`).
  - Comprehensive rate limiting, error envelope sanitation, and production hardening (`F-10`).
- **Explicit Exclusions**:
  - Real financial gateway integration (Stripe, Omise, PayPal); payment statuses are simulated through internal order state transitions.
  - External courier logistics tracking (FedEx, Kerry Express, Thailand Post APIs).
  - Multi-merchant marketplace / third-party vendor storefronts.

---

## 2. Actors & Stakeholder Responsibilities

| Actor | Role Identifier | Responsibilities & Access Scope |
|---|---|---|
| **Customer** | `CUSTOMER` | Authenticated consumer. Browses TechTent tech catalog, reviews real-time device availability, constructs multi-item orders, submits orders, executes simulated payments, cancels pending orders, and reviews personal order receipts. Strictly prohibited from modifying prices or inspecting other users' transactions. |
| **Operator** | `OPERATOR` | Fulfillment and store operations staff. Monitors incoming order queue, inspects customer line items, accepts/rejects orders, progresses order fulfillment (`PACKED`, `SHIPPED`), curates product catalog, and restocks warehouse inventory. |
| **Administrator** | `ADMIN` | Store supervisor. Possesses all Operator permissions, plus user account lifecycle oversight and system configuration. |
| **Guest / Anonymous** | `ANONYMOUS` | Unauthenticated visitor. May access health check endpoints and login screen. Directed to authenticate before accessing catalog, cart, or order capabilities. |

---

## 3. Functional Requirements (FR)

### 3.1 Catalog & Product Browsing (Sprint 1)
- **FR-01 (Product Catalog Listing)**: The system shall provide an endpoint and UI view to list all active electronic products, displaying SKU, name, category, description, unit price (USD), and stock quantity.
- **FR-02 (Catalog Real-time Availability)**: The system shall reflect immediate stock availability, visibly marking items with zero stock as "Out of Stock" and disabling addition to order.

### 3.2 Order Assembly & Submission (Sprint 1)
- **FR-03 (Multi-Item Order Construction)**: Customers shall be able to select multiple distinct products, specify requested quantities for each item, and view a preview of line item subtotals and estimated total.
- **FR-04 (Order Submission & Atomic Persistence)**: The customer shall be able to submit an order. The system shall validate item availability, authoritatively compute pricing, create the order record with status `PENDING`, create corresponding line item snapshots, and reserve/decrement available stock within an atomic database transaction.
- **FR-05 (Unique Order Identification)**: The system shall generate a human-readable, unique order reference identifier for every created order conforming to `ORD-YYYYMMDD-XXXX`.

### 3.3 Customer Order History & Receipt Retrieval (Sprint 1)
- **FR-06 (Order History List)**: Authenticated customers shall be able to view a chronological list of their own submitted orders, showing Order Number, Creation Date, Status, Payment Status, Total Amount, and total item count.
- **FR-07 (Itemized Order Receipt)**: Customers shall be able to retrieve detailed receipts for any of their own orders, displaying the preserved unit prices, line item quantities, calculated line subtotals, grand total, fulfillment status, and payment status.

### 3.4 Operator Order Management Queue (Sprint 1)
- **FR-08 (Operator Incoming Queue)**: Operators shall have access to an operational queue displaying all incoming orders across all customers with filter controls by status (`PENDING`, `ACCEPTED`, `PACKED`, `SHIPPED`, `CANCELLED`, `REJECTED`).
- **FR-09 (Operator Order Acceptance)**: Operators shall be able to accept an incoming `PENDING` order, transitioning its status to `ACCEPTED`.
- **FR-10 (Operator Order Rejection)**: Operators shall be able to reject an incoming `PENDING` order, immediately and atomically releasing reserved stock back to active inventory.

### 3.5 Catalog Administration & Restocking (Sprint 2)
- **FR-11 (Catalog Curation & Restocking)**: The system shall allow authorized Operators and Administrators to create new electronic products with unique SKUs, update existing product specifications and active state, and atomically increment warehouse inventory stock quantities.

### 3.6 Customer Order Cancellation (Sprint 2)
- **FR-12 (Customer Order Cancellation)**: Authenticated customers shall be able to cancel their own orders while the order remains in `PENDING` status. The system shall transition the order to `CANCELLED`, record the cancellation timestamp and reason, and atomically restore all reserved line item quantities to inventory.

### 3.7 Simulated Payment Lifecycle & Fulfillment Progression (Sprint 2)
- **FR-13 (Simulated Payment & Fulfillment Progression)**: The system shall support a decoupled simulated payment state machine (`UNPAID` ➔ `PAID` ➔ `REFUNDED` / `VOID`) and extended fulfillment progression (`ACCEPTED` ➔ `PACKED` ➔ `SHIPPED`). Simulated payment can be executed by the customer, and cancellation/rejection of paid orders shall automatically trigger a refund.

### 3.8 Operational Reporting & Analytics (Sprint 3 Scope)
- **FR-14 (Sales & Operational Metrics Dashboard)**: The system shall provide aggregated reporting endpoints (`GET /api/reports/sales-summary`, `GET /api/reports/turnaround`) and an operational UI dashboard for Operators and Administrators, calculating:
  - Total gross sales revenue and total completed orders across filtered date ranges.
  - Distribution breakdown of orders across fulfillment statuses (`PENDING`, `ACCEPTED`, `PACKED`, `SHIPPED`, `CANCELLED`, `REJECTED`).
  - Average fulfillment turnaround duration (time elapsed from order creation to `SHIPPED` status).

### 3.9 Production Security Hardening & Rate Limiting (Sprint 3 Scope)
- **FR-15 (API Rate Limiting & Sensitive Data Sanitization)**: The system shall protect public authentication endpoints (`/api/auth/login`) against brute-force credential stuffing via token bucket rate limiting (`express-rate-limit`), and enforce strict error envelope sanitization across all environments to eliminate internal stack trace leakage in API responses.

---

## 4. Business Rules (BR)

- **BR-01 (Authoritative Server-Side Price Calculation & Tiered Incentives)**:
  - All line item subtotals (`unitPrice * quantity`), merchandise subtotal (`SUM(subtotals)`), volume discounts, and shipping fees must be computed authoritatively by the server inside the database transaction.
  - **Volume Discount Tiers**:
    - Items Subtotal $\ge \$1,000.00 \implies 10\%$ volume discount on merchandise subtotal.
    - Items Subtotal $\ge \$500.00$ and $< \$1,000.00 \implies 5\%$ volume discount on merchandise subtotal.
    - Items Subtotal $< \$500.00 \implies 0\%$ volume discount.
  - **Shipping Fee & Free Shipping Threshold**:
    - Net merchandise value = $\text{subtotal} - \text{discountAmount}$.
    - If net merchandise value $\ge \$200.00 \implies \text{shippingFee} = \$0.00$ (Free Shipping).
    - If net merchandise value $< \$200.00 \implies \text{shippingFee} = \$15.00$ (Flat Delivery Fee).
  - **Grand Total Calculation**:
    - $\text{totalAmount} = \text{round}(\text{subtotal} - \text{discountAmount} + \text{shippingFee}, 2)$.
  - Client-submitted totals, subtotals, discount overrides, or shipping fee overrides must be ignored or rejected. The server calculation is 100% authoritative.
  - The `Order` entity permanently records `subtotal`, `discountAmount`, `shippingFee`, and `totalAmount` for new orders. At $205.00 both discount and shipping are zero. Discounted orders always ship free because the minimum discounted net is $475.00.
  - Orders created before the Lab 7 pricing change retain the original stored `totalAmount`. Their effective subtotal equals that stored total, and discount and shipping are both $0.00. Never apply current pricing retrospectively.
  - New orders use the Lab 7 rules at checkout and retain the resulting persisted breakdown. History, receipts, operator views, payment responses and cancellation use the authoritative persisted total. Catalog price changes do not affect stored line snapshots.
  - Preserve ownership checks, stock reservation and restoration, and atomic checkout and terminal transitions. A zero pricing field alone is not a reliable version marker. Review legacy identification or backfill before implementation.
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
  - Only authenticated users with role `OPERATOR` or `ADMIN` are authorized to query the operator queue (`GET /api/operator/orders`), transition fulfillment statuses, or manage catalog inventory.
  - Customers attempting to access operator endpoints must receive `403 FORBIDDEN`.
- **BR-06 (Order Status Transition State Machine - Fulfillment)**:
  - Valid fulfillment transitions:
    - `PENDING` ➔ `ACCEPTED` (Operator accept)
    - `PENDING` ➔ `REJECTED` (Operator reject; restores stock)
    - `PENDING` ➔ `CANCELLED` (Customer cancel; restores stock)
    - `ACCEPTED` ➔ `PACKED` (Operator pack)
    - `PACKED` ➔ `SHIPPED` (Operator ship)
  - `REJECTED`, `CANCELLED`, and `SHIPPED` are terminal fulfillment states.
  - Orders cannot regress backwards (e.g. `ACCEPTED` cannot return to `PENDING`).
- **BR-07 (Catalog Soft Deletion & Positive Price Integrity)**:
  - Products cannot be hard-deleted from PostgreSQL once created, protecting referential integrity of historic `OrderItem` foreign keys.
  - Discontinuing a product must be performed by setting `isActive = false`. Inactive products are immediately excluded from public catalog queries.
  - Product unit prices must be strictly positive numbers (`price > 0.00`).
- **BR-08 (Customer Cancellation Window & Stock Restoral)**:
  - A customer may cancel an order if and only if its current status is `PENDING`.
  - Once an operator accepts an order (`ACCEPTED`, `PACKED`, or `SHIPPED`), customer cancellation must be rejected with `409 Conflict` (`ORDER_ALREADY_ACCEPTED`).
  - Successful cancellation must atomically restore all reserved line item quantities in PostgreSQL within a single database transaction.
- **BR-09 (Simulated Payment State Machine)**:
  - Orders initialize with `paymentStatus = 'UNPAID'`.
  - Customers may transition `UNPAID` to `PAID` via `POST /api/orders/:id/pay`.
  - Re-paying an already paid order must be rejected with `409 Conflict` (`ORDER_ALREADY_PAID`).
  - Attempting to pay a `CANCELLED` or `REJECTED` order must be rejected with `422 Unprocessable Entity`.
- **BR-10 (Automatic Refund on Cancellation/Rejection)**:
  - If an order with `paymentStatus = 'PAID'` is subsequently cancelled by the customer or rejected by the operator, `paymentStatus` must automatically transition to `REFUNDED` and `refundedAt` must be stamped.
  - If an order was `UNPAID`, cancellation/rejection sets `paymentStatus = 'VOID'`.

---

## 5. Non-Functional Requirements (NFR)

| NFR ID | Requirement Name | Measurable Target & Constraint | Verification Method |
|---|---|---|---|
| **NFR-01** | Session Security & RBAC | All non-public endpoints require active cookie-based session authentication (`express-session`). Cookies must be `HttpOnly`, `SameSite=Lax`. Passwords must be hashed using `bcrypt` with salt rounds >= 10. Role checks enforce strict 403 barriers. | Automated test suite verifying 401/403 on unauthenticated and unauthorized requests. |
| **NFR-02** | Atomic Transaction Integrity | Order creation, cancellation, rejection, and inventory restocking must execute within isolated database transactions. Partial executions must never occur. | Automated concurrency and fault-injection rollback tests asserting stock conservation. |
| **NFR-03** | Sub-Second Performance | Catalog browsing, order placement, and status updates must respond within < 200ms under standard load. | Automated API test timing assertions. |
| **NFR-04** | Responsive & Accessible UI | Application layout must render cleanly across Mobile (375px), Tablet (768px), and Desktop (1200px+) viewports. Forms must contain accessible semantic labels and focus states. | Component tests and Playwright responsive viewport validation. |
| **NFR-05** | Traceability & TDD Discipline | Every Acceptance Criteria across Sprint 1 and Sprint 2 must map to an executable automated test in the Software Test Specification (STS). | Bidirectional traceability matrix and passing Vitest test suites. |

---

## 6. Assumptions & Engineering Decisions

1. **Local Authentication & Seed Users**: Demo accounts (`customer1@example.com`, `operator1@example.com`, `admin@example.com`) are seeded deterministically for local testing and grading without third-party email dependencies.
2. **Immediate Stock Reservation & Atomic Restoral**: Stock is decremented upon order placement in `PENDING` state, eliminating overselling. Customer cancellation or operator rejection restores inventory atomically.
3. **Currency & Precision**: All financial amounts are stored as `Decimal(10, 2)` in PostgreSQL and presented in US Dollars (`$`) formatted to two decimal places.
4. **Decoupled Payment Architecture**: Payment status operates independently of fulfillment status, modeling realistic retail operations and preventing combinatorial state explosions.
