# Feature Inventory

---

## 1. Feature Catalog Overview

The TechTent product backlog is organized across three progressive engineering sprints:
- **Sprint 1 (Accepted Baseline)**: Core vertical slice (authentication, catalog browsing, multi-item order placement with authoritative pricing and atomic reservation, customer receipts, and operator order queue processing).
- **Sprint 2 (Current Increment)**: Core domain expansion (catalog management and atomic restocking, customer order cancellation with automated stock restoral, and simulated payment state machine).
- **Sprint 3 (Future Hardening & Reporting)**: Operational analytics summaries, fulfillment turnaround metrics, brute-force rate limiting, and system hardening.

---

## 2. Comprehensive Feature Breakdown

### Sprint 1: Engineering Baseline & Minimum Viable Product

#### F-01: User Authentication & Role-Based Session Control
- **Description**: Provides secure authentication with session cookies for `CUSTOMER`, `OPERATOR`, and `ADMIN` users. Enforces route guards on the frontend and authorization middleware on the backend.
- **Linked Requirements**: NFR-01, BR-04, BR-05
- **Dependencies**: None (Core Foundation)
- **Status**: **ACCEPTED** (Tag `R1` / Commit `9ff3341`, integrated with `lab5` `e17f136`)

#### F-02: TechTent Everyday Tech Catalog Browsing & Stock Display
- **Description**: Displays all active consumer tech devices (Phones, Tablets, TVs, Keyboards, Chargers) with SKU, name, category, unit price, description, and available stock. Real-time visual indications for out-of-stock items.
- **Linked Requirements**: FR-01, FR-02, BR-01
- **Dependencies**: F-01
- **Status**: **ACCEPTED** (Tag `R1`)

#### F-03: Multi-Item Order Assembly, Price Computation & Persistence
- **Description**: Enables customers to build a cart with positive quantities, submit the order, and have the backend authoritatively calculate subtotals and grand totals from active catalog prices while reserving stock atomically.
- **Linked Requirements**: FR-03, FR-04, FR-05, BR-01, BR-02, BR-03, NFR-02
- **Dependencies**: F-01, F-02
- **Status**: **ACCEPTED** (Tag `R1`)

#### F-04: Customer Order History & Itemized Receipt Details
- **Description**: Allows customers to view their chronological order history and drill down into individual itemized order receipts with historical preserved unit prices. Prevents cross-customer order access.
- **Linked Requirements**: FR-06, FR-07, BR-02, BR-04
- **Dependencies**: F-01, F-03
- **Status**: **ACCEPTED** (Tag `R1`)

#### F-05: Operator Order Queue & Fulfillment Processing
- **Description**: Dedicated operational dashboard for operators to view pending incoming orders across all customers, inspect line items, and formally accept or reject orders with automated inventory handling.
- **Linked Requirements**: FR-08, FR-09, FR-10, BR-05, BR-06
- **Dependencies**: F-01, F-03
- **Status**: **ACCEPTED** (Tested on `F-05/OperatorOrderProcessing`; verified with 182 distinct automated tests)

---

### Sprint 2: Core Expansion & Lifecycle Management (Current Sprint)

#### F-06: Catalog Curation & Inventory Restocking
- **Description**: Operator/Admin interface to create new electronics products, update existing device specifications, toggle product availability (`isActive`), and atomically restock warehouse quantities.
- **Linked Requirements**: FR-11, BR-07, NFR-01, NFR-02
- **Dependencies**: F-01, F-02
- **Status**: **CONTRACT ELABORATED (Branch: `F-06/CatalogManagement`)**
- **Contract Reference**: [docs/sprints/sprint-2/feature-specs.md#1-feature-contract-f-06-catalog-curation--inventory-restocking](sprints/sprint-2/feature-specs.md#1-feature-contract-f-06-catalog-curation--inventory-restocking)

#### F-07: Customer Order Cancellation & Stock Restoral
- **Description**: Allows customers to cancel orders that are still in `PENDING` state prior to operator acceptance, with automated, atomic restoral of reserved stock in PostgreSQL.
- **Linked Requirements**: FR-12, BR-08, BR-04, NFR-02
- **Dependencies**: F-03, F-04, F-05
- **Status**: **CONTRACT ELABORATED (Branch: `F-07/CustomerCancellation`)**
- **Contract Reference**: [docs/sprints/sprint-2/feature-specs.md#2-feature-contract-f-07-customer-order-cancellation--stock-restoral](sprints/sprint-2/feature-specs.md#2-feature-contract-f-07-customer-order-cancellation--stock-restoral)

#### F-08: Simulated Payment Status State Machine
- **Description**: Introduces simulated payment workflows (`UNPAID`, `PAID`, `REFUNDED`, `VOID`) alongside physical fulfillment states (`ACCEPTED`, `PACKED`, `SHIPPED`).
- **Linked Requirements**: FR-13, BR-09, BR-10, NFR-01, NFR-02
- **Dependencies**: F-03, F-05
- **Status**: **CONTRACT ELABORATED (Branch: `F-08/PaymentStateMachine`)**
- **Contract Reference**: [docs/sprints/sprint-2/feature-specs.md#3-feature-contract-f-08-simulated-payment-status-state-machine](sprints/sprint-2/feature-specs.md#3-feature-contract-f-08-simulated-payment-status-state-machine)

---

### Sprint 3: Reporting & Hardening (Deferred Scope)

#### F-09: Operational Metrics & Sales Summaries
- **Description**: Executive dashboard summarizing daily order volumes, gross revenue, component turnover rates, and operator fulfillment turnaround durations.
- **Linked Requirements**: FR-14, BR-11, NFR-03
- **Dependencies**: F-05, F-08
- **Status**: **PLANNED FOR SPRINT 3**

#### F-10: System Hardening, Error Resilience & Production Readiness
- **Description**: End-to-end regression validation, rate limiting, standardized error formatting envelopes, deployment verification on Cloud Run, and documentation freeze.
- **Linked Requirements**: NFR-02, NFR-03, NFR-04, NFR-05, BR-12
- **Dependencies**: All preceding features
- **Status**: **PLANNED FOR SPRINT 3**
