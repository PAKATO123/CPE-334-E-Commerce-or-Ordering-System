# Sprint 1 Decisions & Clarifications Sheet
## CPE 334 — TechTent Everyday Electronics Ordering System
**Document Version**: 1.1.0 | **Date**: November 2026

### Team Information
> **Fill in the student details below:**
- **Student 1**: `Pattarapon Sribuathong 67070503434`
- **Student 2**: `Wai Phyo 67070503487`
- **Repository URL**: `https://github.com/PAKATO123/CPE-334-E-Commerce-or-Ordering-System.git`
- **Submitted Release Tag / Commit**: `[FILL IN: Release Tag / Commit SHA]`

---

## 1. Confirmed Strategic & Architectural Decisions

The following decisions have been reviewed, aligned, and confirmed for Sprint 1:

### 1.1 Domain & Brand Identity: "TechTent" Everyday Consumer Tech
- **Decision**: Rebranded to **TechTent**, specializing in consumer everyday technology products:
  - **Smartphones**: Flagship mobile devices.
  - **Tablets**: Productivity and entertainment tablets.
  - **Smart TVs**: Home entertainment OLED/4K displays.
  - **Keyboards**: Wireless mechanical input devices.
  - **Chargers & Power**: High-speed GaN power adapters and cables.
- **Rationale**: Familiar, straightforward consumer domain making test scenarios and requirement validations immediately intuitive and observable for graders.

### 1.2 Immediate Inventory Reservation with Atomic Restoral on Rejection (BR-03)
- **Decision**:
  - Decrement `stockQuantity` **immediately** inside an atomic database transaction (`prisma.$transaction`) when the customer places the order (`status = PENDING`).
  - If an Operator accepts the order (`status = ACCEPTED`), the reservation becomes permanent.
  - If an Operator rejects the order (`status = REJECTED`), the reserved quantities are atomically restored back to the product's `stockQuantity` in PostgreSQL.
- **Rationale**: Eliminates race conditions where two customers attempt to purchase the final in-stock device simultaneously.

### 1.3 Scope Boundary: Customer Order Cancellation Deferred to Sprint 2
- **Decision**: In Sprint 1, customers submit orders and operators accept/reject them. Customer-side cancellation workflows are deferred to Sprint 2 as prescribed in the course syllabus.
- **Rationale**: Keeps Sprint 1 focused on the core vertical slice (catalog, checkout, authoritative price calculation, operator queue) without bloating scope before Deliverable 1.

### 1.4 Authoritative Server Pricing & Historic Preservation (BR-01, BR-02)
- **Decision**:
  - Client checkout payloads only supply `productId` and `quantity`. Any submitted `price`, `subtotal`, or `total` in the request body is discarded.
  - The server queries current active prices from PostgreSQL, calculates line item subtotals and grand total, and persists the price snapshot in `OrderItem.unitPrice`.
  - Future catalog price updates have zero effect on historic order receipts.

### 1.5 Order Identification Format
- **Decision**: Human-readable, date-stamped identifier: `ORD-YYYYMMDD-XXXX` (e.g. `ORD-20261101-0001`).

### 1.6 Currency Representation
- **Decision**: Stored as `Decimal(10, 2)` in PostgreSQL and displayed in US Dollars (`$` / USD) across all customer and operator views.

---

## 2. Seed Everyday Tech Catalog Lineup (Sprint 1)

| SKU | Product Name | Category | Unit Price (USD) | Initial Stock | Role / Test Purpose |
|---|---|---|---|---|---|
| `PHON-PRO-256` | Flagship Pro Smartphone 256GB | Smartphones | $899.00 | 10 | High-value device; multi-quantity ordering test |
| `TAB-ULTRA-11` | Ultra Tablet 11" 128GB | Tablets | $549.00 | 8 | Mid-range device; boundary quantity check |
| `TV-SMART-55` | 55" 4K Smart OLED TV | Smart TVs | $699.00 | 5 | Heavy goods; operator accept/reject test |
| `KB-MECH-RGB` | Wireless Mechanical Keyboard | Keyboards | $79.00 | 15 | Everyday accessory; cart combination test |
| `CHG-GAN-65W` | 65W GaN Fast Charger USB-C | Chargers & Power | $29.00 | 25 | High-volume everyday essential; stock decrement test |
| `PHON-FLIP-LTD`| Flip Smartphone Limited Edition | Smartphones | $999.00 | **0** | **Out-of-Stock Demo**: verifies UI disablement & backend 409 rejection |
| `DISCONT-OLD-GEN`| Discontinued 30-Pin Cable | Chargers & Power | $9.99 | 50 | **Inactive Demo (`isActive = false`)**: verifies AC-CAT-02 exclusion |
