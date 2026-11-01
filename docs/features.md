# Feature Inventory
## CPE 334 — E-Commerce / Ordering System (Electronics Store)

### Team Information
> **Fill in the student details below:**
- **Student 1**: `[FILL IN: Student 1 Full Name — Student ID]`
- **Student 2**: `[FILL IN: Student 2 Full Name — Student ID]`
- **Repository URL**: `[FILL IN: GitHub Repository URL]`
- **Submitted Release Tag / Commit**: `[FILL IN: Release Tag / Commit SHA]`

---

| Feature ID | Feature Name | Description | Linked Requirements | Planned Sprint |
|---|---|---|---|---|
| **F-01** | User Authentication & Session Control | Authenticate users (Customer, Operator, Admin) via session-based cookies; enforce role authorization. | NFR-01, BR-04, BR-05 | Sprint 1 |
| **F-02** | Product Catalog Browsing | Display available electronic products, stock availability, and prices to authenticated users. | FR-01, BR-01 | Sprint 1 |
| **F-03** | Order Creation & Price Computation | Allow customers to submit multi-item orders with server-authoritative pricing and inventory validation. | FR-02, BR-01, BR-02, BR-03 | Sprint 1 |
| **F-04** | Customer Order Details & History | Allow customers to review their past orders and inspect detailed line items and preserved prices. | FR-03, BR-04 | Sprint 1 |
| **F-05** | Operator Order Queue & Processing | Allow operators to inspect incoming orders, accept orders, and transition statuses. | FR-04, FR-05, BR-05 | Sprint 1 |
| **F-06** | Catalog Management & Inventory Restocking | Allow operators/admins to add, edit, or discontinue electronic components and adjust inventory levels. | FR-06 | Sprint 2 |
| **F-07** | Order Cancellation & Lifecycle Expansion | Support order cancellation workflows with inventory restock and lifecycle constraints. | FR-07, BR-06 | Sprint 2 |
| **F-08** | Simulated Payment & Settlement States | Model payment state machine (PENDING, PAID, REFUNDED) alongside order fulfillment. | FR-08 | Sprint 2 |
| **F-09** | Reporting & Sales Summaries | Summary dashboards for daily order counts, total revenue, and operator fulfillment metrics. | FR-09 | Sprint 3 |
| **F-10** | System Hardening & Boundary Polish | Final security audits, edge case handling, and deployment readiness. | NFR-02, NFR-03 | Sprint 3 |
