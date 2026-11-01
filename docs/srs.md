# Software Requirements Specification (SRS)
## CPE 334 — E-Commerce / Ordering System (Electronics Store)

### Team Information
> **Fill in the student details below:**
- **Student 1**: `[FILL IN: Student 1 Full Name — Student ID]`
- **Student 2**: `[FILL IN: Student 2 Full Name — Student ID]`
- **Repository URL**: `[FILL IN: GitHub Repository URL]`
- **Submitted Release Tag / Commit**: `[FILL IN: Release Tag / Commit SHA]`

---

### 1. Stakeholder Problem & Context
- **Domain / Context**: **VoltCraft Electronics** — A specialized electronics and hardware store supplying computer peripherals, dev boards, audio equipment, sensors, and cables.
- **Problem Statement**: The business currently manages customer orders and inventory tracking manually. This leads to discrepancies in stock availability, calculated order totals, and fulfillment tracking.
- **Product Scope**: A full-stack ordering platform that enables authenticated customers to browse an electronic parts and accessories catalog, assemble multi-item orders with authoritative pricing, and monitor order status. Operators access a live operational order queue to review and accept incoming orders.
- **Explicit Exclusions**:
  - Real payment gateways / financial transactions (simulated payment transitions only).
  - External logistics and courier delivery API integrations.
  - Multi-vendor marketplace support.

---

### 2. Actors & Roles
| Actor | Role Key | Responsibilities & Scope |
|---|---|---|
| **Customer** | `CUSTOMER` | Browse electronic components catalog, add items to order, submit order with line items, view own order history and order details. Cannot alter prices or view/accept others' orders. |
| **Operator** | `OPERATOR` | Review incoming electronics order queue, accept/process orders, monitor inventory allocations. |
| **Administrator** | `ADMIN` | System administration, user account management, and catalog administration (Sprint 2/3). |

---

### 3. Functional Requirements (FR) & Business Rules (BR)

#### Functional Requirements
- **FR-01 (Catalog Browsing)**: The system shall provide a catalog of electronic products displaying SKU, name, category, description, unit price, and real-time stock availability.
- **FR-02 (Order Creation)**: Authenticated customers shall be able to create an order containing one or more electronic items from the catalog.
- **FR-03 (Order Details & History)**: Customers shall be able to view their past orders and retrieve detailed itemized receipts (SKU, item name, unit price at purchase, quantity, subtotal, and total).
- **FR-04 (Operator Order Queue)**: Operators shall be able to view an operational queue of all pending/incoming customer orders.
- **FR-05 (Order Acceptance / Transition)**: Operators shall be able to accept incoming orders and transition their state from `PENDING` to `ACCEPTED`.

#### Business Rules
- **BR-01 (Authoritative Price Calculation)**: All order line item subtotals and the overall order total must be computed authoritatively by the backend server using active catalog prices. Client-supplied totals or price overrides must be rejected.
- **BR-02 (Price Preservation)**: When an order is created, the unit price of each item at that instant must be permanently recorded into the order line item. Subsequent changes to catalog prices must not alter historic orders.
- **BR-03 (Inventory Availability & Quantity Validation)**: Orders must only be accepted if requested item quantities are positive integers (> 0) and do not exceed currently available stock. Out-of-stock items or quantities exceeding stock must be rejected with descriptive error messages.
- **BR-04 (Customer Access Isolation)**: Customers may only view and retrieve their own orders. Attempting to view or modify an order belonging to another customer must be rejected (403 Forbidden or 404 Not Found).
- **BR-05 (Operator Permission Enforcement)**: Only authenticated users with the `OPERATOR` or `ADMIN` role may access the operator queue or transition order fulfillment statuses.

---

### 4. Non-Functional Requirements (NFR)
- **NFR-01 (Security & Session Lifecycle)**: All protected API endpoints must require active session authentication with HTTP-only cookies. Passwords must be hashed using bcrypt (salt rounds >= 10). Plaintext passwords must never be stored.
- **NFR-02 (Data Integrity)**: Orders and order line items must be stored in PostgreSQL with foreign key constraints, unique SKU constraints, and transactional consistency.
- **NFR-03 (Automated Verification)**: All business rules, access controls, and edge cases must have automated test specifications and passing execution suites.

---

### 5. Assumptions & Design Decisions
- Seeded test accounts are provided for grading and local verification; public self-registration is deferred.
- Simulated payment status will be integrated in later sprints alongside delivery stages.
