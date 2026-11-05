# Feature Inventory
## CPE 334 — TechTent Everyday Electronics Ordering System
**Document Version**: 1.1.0 | **Date**: November 2026

### Team Information
> **Fill in the student details below:**
- **Student 1**: `Pattarapon Sribuathong 67070503434`
- **Student 2**: `Wai Phyo 67070503487`
- **Repository URL**: `https://github.com/PAKATO123/CPE-334-E-Commerce-or-Ordering-System.git`
- **Submitted Release Tag / Commit**: `[FILL IN: Release Tag / Commit SHA]`

---

## 1. Feature Catalog Overview

The product backlog is planned across three engineering sprints. Sprint 1 implements the complete vertical slice (catalog browsing, customer multi-item order placement, authoritative pricing, and operator order queue/acceptance) for the **TechTent** everyday consumer tech store. Subsequent sprints expand into catalog maintenance, payment status lifecycle, and operational analytics.

---

## 2. Comprehensive Feature Breakdown

### Sprint 1: Engineering Baseline & Minimum Viable Product

#### F-01: User Authentication & Role-Based Session Control
- **Description**: Provides secure authentication with session cookies for `CUSTOMER`, `OPERATOR`, and `ADMIN` users. Enforces route guards on the frontend and authorization middleware on the backend.
- **Linked Requirements**: NFR-01, BR-04, BR-05
- **Dependencies**: None (Core Foundation)
- **Planned Sprint**: Sprint 1

#### F-02: TechTent Everyday Tech Catalog Browsing & Stock Display
- **Description**: Displays all active consumer tech devices (Phones, Tablets, TVs, Keyboards, Chargers) with SKU, name, category, unit price, description, and available stock. Real-time visual indications for out-of-stock items.
- **Linked Requirements**: FR-01, FR-02, BR-01
- **Dependencies**: F-01
- **Planned Sprint**: Sprint 1

#### F-03: Multi-Item Order Assembly, Price Computation & Persistence
- **Description**: Enables customers to build a cart with positive quantities, submit the order, and have the backend authoritatively calculate subtotals and grand totals from active catalog prices while reserving stock atomically.
- **Linked Requirements**: FR-03, FR-04, FR-05, BR-01, BR-02, BR-03, NFR-02
- **Dependencies**: F-01, F-02
- **Planned Sprint**: Sprint 1

#### F-04: Customer Order History & Itemized Receipt Details
- **Description**: Allows customers to view their chronological order history and drill down into individual itemized order receipts with historical preserved unit prices. Prevents cross-customer order access.
- **Linked Requirements**: FR-06, FR-07, BR-02, BR-04
- **Dependencies**: F-01, F-03
- **Planned Sprint**: Sprint 1

#### F-05: Operator Order Queue & Fulfillment Processing
- **Description**: Dedicated operational dashboard for operators to view pending incoming orders across all customers, inspect line items, and formally accept or reject orders with automated inventory handling.
- **Linked Requirements**: FR-08, FR-09, FR-10, BR-05, BR-06
- **Dependencies**: F-01, F-03
- **Planned Sprint**: Sprint 1
- **Implementation**: Queue retrieval and filters, operator/admin receipt navigation, conditional terminal transitions, transactional stock restoration, and rejection confirmation are implemented on `F-05/OperatorOrderProcessing`.
- **Verification**: All four F-05 acceptance criteria have passing automated evidence. Real PostgreSQL competition and rollback checks passed. Browser visual/native-dialog keyboard checks remain outstanding; this branch has not been merged or published.
- **Evidence**: [Integration review](sprints/sprint-1/f05-integration-review.md) and [safe test setup/results](sprints/sprint-1/f05-test-environment.md).

---

### Sprint 2: Core Expansion & Lifecycle Management

#### F-06: Catalog Curation & Inventory Restocking
- **Description**: Operator/Admin interface to create new electronics products, update existing device specifications, toggle product availability, and restock warehouse quantities.
- **Linked Requirements**: FR-11, BR-07
- **Dependencies**: F-01, F-02
- **Planned Sprint**: Sprint 2

#### F-07: Customer Order Cancellation & Stock Restoral
- **Description**: Allows customers to cancel orders that are still in `PENDING` state prior to operator acceptance, with automated, atomic restoral of reserved stock.
- **Linked Requirements**: FR-12, BR-08
- **Dependencies**: F-03, F-04, F-05
- **Planned Sprint**: Sprint 2

#### F-08: Simulated Payment Status State Machine
- **Description**: Introduces simulated payment workflows (`PENDING_PAYMENT`, `PAID`, `REFUNDED`) alongside physical fulfillment states (`ACCEPTED`, `PACKED`, `SHIPPED`).
- **Linked Requirements**: FR-13, BR-09
- **Dependencies**: F-03, F-05
- **Planned Sprint**: Sprint 2

---

### Sprint 3: Reporting, System Hardening & Final Polish

#### F-09: Operational Metrics & Sales Summaries
- **Description**: Executive dashboard summarizing daily order volumes, gross revenue, component turnover rates, and operator fulfillment processing times.
- **Linked Requirements**: FR-14, NFR-03
- **Dependencies**: F-05, F-08
- **Planned Sprint**: Sprint 3

#### F-10: System Hardening, Error Resilience & Production Readiness
- **Description**: End-to-end regression validation, edge case error formatting, deployment verification on containerized infrastructure, and documentation freeze.
- **Linked Requirements**: NFR-02, NFR-03, NFR-04, NFR-05
- **Dependencies**: All preceding features
- **Planned Sprint**: Sprint 3
