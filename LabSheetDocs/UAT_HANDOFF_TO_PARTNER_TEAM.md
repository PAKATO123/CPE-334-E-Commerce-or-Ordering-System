# TechTent Sprint 1 — User Acceptance Testing (UAT) Handoff Package

## 1. Scope Accepted for Sprint 1 UAT

This UAT package verifies the delivered **Sprint 1 increment** of TechTent:

1. **F-01 User Authentication & Session Control:** Sign in, sign out, role-based navigation guards (CUSTOMER, OPERATOR, ADMIN).
2. **F-02 Everyday Tech Catalog Browsing:** Categorical electronics products (Smartphones, Tablets, Smart TVs, Keyboards, Chargers), real-time stock levels, out-of-stock indicators.
3. **F-03 Multi-Item Order Creation & Atomic Reservation:** Multi-item cart checkout, server-authoritative price calculation, atomic inventory decrement in PostgreSQL, boundary stock limit enforcement (409 Conflict).
4. **F-04 Order History & Preserved Receipts:** Chronological customer order history, itemized receipts showing preserved historical unit prices (OrderItem.unitPrice), strict cross-customer isolation (403 Forbidden).
5. **F-05 Operator Order Queue & Fulfillment Processing:** Operational queue with status filters, order acceptance (ACCEPTED), order rejection (REJECTED with atomic stock restoration).

\[!NOTE\] **Explicit Exclusions (Deferred to Sprint 2 & 3):** Customer order self-cancellation (F-07), catalog editing/restocking CRUD (F-06), third-party payment gateways (F-08), and turnaround metrics (F-09) are planned for later sprints and are **not** part of this acceptance scope.

## 2. Safe Test Accounts & Handoff Credentials

_Credentials are provided privately via course Discord / LINE / email. Do not commit plaintext passwords to Git._

| Account Label        | System Role | Primary UAT Function                                    | Boundary Rules                                           |
| -------------------- | ----------- | ------------------------------------------------------- | -------------------------------------------------------- |
| `Account-Customer-1` | `CUSTOMER`  | Normal catalog shopping, checkout, viewing own receipts | Cannot access other customer receipts or operator routes |
| `Account-Customer-2` | `CUSTOMER`  | Cross-customer data isolation testing                   | Cannot access Customer-1 receipts or operator routes     |
| `Account-Operator-1` | `OPERATOR`  | Order queue review, order acceptance and rejection      | Cannot place customer orders                             |
| `Account-Admin-1`    | `ADMIN`     | Administrative supervisory access                       | Full operational queue access                            |

## email and password for login purposes

| Customer 1 | \`<customer1@example.com>\` | \`Password123!\` |

| Customer 2 | \`<customer2@example.com>\` | \`Password123!\` |

| Operator | \`<operator1@example.com>\` | \`Password123!\` |

| Admin | \`<admin1@example.com>\` | \`Password123!\` |

## 3. Synthetic Product Catalog & Test Inventory

The deployed environment is pre-populated with everyday electronics items:

| Product ID | SKU               | Product Name                    | Category         | Authoritative Price | Initial Stock | UAT Purpose                                  |
| ---------- | ----------------- | ------------------------------- | ---------------- | ------------------- | ------------- | -------------------------------------------- |
| `1`        | `PHON-PRO-256`    | Flagship Pro Smartphone 256GB   | Smartphones      | \$899.00            | 10            | Multi-item checkout & pricing                |
| `2`        | `TAB-ULTRA-11`    | Ultra Tablet 11" 128GB          | Tablets          | \$549.00            | 8             | Quantity boundary limits                     |
| `3`        | `TV-SMART-55`     | 55" 4K Smart OLED TV            | Smart TVs        | \$699.00            | 5             | Fulfillment acceptance test                  |
| `4`        | `KB-MECH-RGB`     | Wireless Mechanical Keyboard    | Keyboards        | \$79.00             | 15            | Everyday accessory cart test                 |
| `5`        | `CHG-GAN-65W`     | 65W GaN Fast Charger USB-C      | Chargers & Power | \$29.00             | 25            | High-volume item; stock restoral test        |
| `6`        | `PHON-FLIP-LTD`   | Flip Smartphone Limited Edition | Smartphones      | \$999.00            | **0**         | **Out-of-Stock Demo**: Button disabled       |
| `7`        | `DISCONT-OLD-GEN` | Discontinued 30-Pin Cable       | Chargers & Power | \$9.99              | 50            | **Inactive Demo (isActive = false)**: Hidden |

## 4. Reset & Cleanup Instructions

- **Inventory Restoration:** Rejecting an order in /operator/orders automatically restores all reserved inventory back to the product.
- **Session Cleanup:** Click "Sign Out" in the top navbar or clear browser cookies (connect.sid).
- **Assistance:** If test data becomes inconsistent or an account is locked, notify our team for an immediate automated seed reset (npm run prisma:seed).

## 5. Executable UAT Test Cases

Please execute the following 6 test cases and record your actual results, timestamps, and screenshots.

### Test Case UAT-TT-01: Customer Multi-Item Electronics Purchase & Receipt Verification

- **Category:** Category 1 — Normal Domain Journey
- **Requirement Reference:** FR-01, FR-03, FR-04, AC-ORD-01, AC-ORD-05
- **Assigned Tester Role:** Account-Customer-1 (CUSTOMER)
- **Preconditions:** Seeded products active; PHON-PRO-256 (Price: \$899.00, Stock: 10); KB-MECH-RGB (Price: \$79.00, Stock: 15).
- **Synthetic Inputs:**
  - 1 unit of PHON-PRO-256
  - 2 units of KB-MECH-RGB

#### Steps

1. Navigate to <https://techtent-693107188088.asia-southeast1.run.app/login> and sign in as Account-Customer-1.
2. On catalog page /, find Flagship Pro Smartphone 256GB and click **"Add to Cart"**.
3. Find Wireless Mechanical Keyboard, increment quantity to 2, and click **"Add to Cart"**.
4. Open Cart drawer. Verify calculation: (1 × \$899.00) + (2 × \$79.00) = **\$1,057.00 USD**.
5. Click **"Place Order"** and confirm order dialog. Note the generated Order ID (ORD-YYYYMMDD-XXXX).
6. Navigate to /orders and click **"View Receipt"** for the placed order.

#### Expected Results

- Order status is PENDING (yellow badge).
- Receipt displays exact itemized lines, quantities (1, 2), preserved unit prices (\$899.00, \$79.00), and grand total of **\$1,057.00**.
- Catalog stock for PHON-PRO-256 decrements from 10 to 9; KB-MECH-RGB stock decrements from 15 to 13.

### Test Case UAT-TT-02: Inventory Boundary Limit & Insufficient Stock Enforcement

- **Category:** Category 2 — Business-Rule / Boundary Case
- **Requirement Reference:** BR-03, NFR-02, AC-BR-03
- **Assigned Tester Role:** Account-Customer-1 (CUSTOMER)
- **Preconditions:** 55" 4K Smart OLED TV (TV-SMART-55) has available stock = 5.
- **Synthetic Inputs:** Quantity = 6 units of TV-SMART-55 (exceeds stock by 1).

#### Steps

1. Sign in as Account-Customer-1.
2. On /, locate 55" 4K Smart OLED TV.
3. Enter 6 in the quantity input and attempt to checkout / place order.

#### Expected Results

- UI client validation blocks order submission or backend responds with HTTP 409 Conflict (INSUFFICIENT_STOCK).
- Zero orders are created in the database.
- Product stock remains unchanged at 5 units.

### Test Case UAT-TT-03: Cross-Customer Order Isolation & Access Control

- **Category:** Category 3 — Forbidden Role / Ownership Case
- **Requirement Reference:** FR-06, AC-SEC-01, BR-04
- **Assigned Tester Role:** Account-Customer-2 (CUSTOMER)
- **Preconditions:** An order (e.g. Order #1) was placed by Account-Customer-1. Account-Customer-2 is an unrelated customer.
- **Synthetic Inputs:** Target URL /orders/1.

#### Steps

1. Sign in as Account-Customer-2.
2. Verify that /orders list does NOT contain Order #1.
3. In browser address bar, navigate manually to /orders/1.

#### Expected Results

- Customer-1's receipt data is NOT displayed.
- Page renders: _"Order not found or permission denied"_.
- Backend API responds with HTTP 403 Forbidden (FORBIDDEN). Zero line items or customer data are disclosed.

### Test Case UAT-TT-04: Role Boundary — Customer Denied Operator Endpoints

- **Category:** Category 3 — Forbidden Role / Access Control
- **Requirement Reference:** BR-05, AC-SEC-02
- **Assigned Tester Role:** Account-Customer-1 (CUSTOMER)
- **Preconditions:** Active customer session.
- **Synthetic Inputs:** URL /operator/orders and API GET /api/operator/orders.

#### Steps

1. Sign in as Customer (Account-Customer-1).
2. Navigate directly to /operator/orders in browser.
3. Execute fetch('/api/operator/orders') from browser console.

#### Expected Results

- Frontend navigation guard blocks route and redirects to / with an access alert.
- Backend API returns HTTP 403 Forbidden (FORBIDDEN). No operator order queue data is returned.

### Test Case UAT-TT-05: Out-of-Stock Product Disablement in Catalog

- **Category:** Category 2 — Business-Rule / Boundary Case
- **Requirement Reference:** FR-02, AC-CAT-03
- **Assigned Tester Role:** Anonymous / Customer
- **Preconditions:** Flip Smartphone Limited Edition (PHON-FLIP-LTD) has stockQuantity = 0.
- **Synthetic Inputs:** Product card for PHON-FLIP-LTD on /.

#### Steps

1. Open catalog page / and locate Flip Smartphone Limited Edition.

#### Expected Results

- Product card displays red/muted **"Out of Stock"** indicator badge.
- Quantity controls are disabled/hidden, and "Add to Cart" button is strictly disabled (disabled attribute in DOM).

### Test Case UAT-TT-06: Operator Fulfillment Lifecycle — Rejection & Atomic Stock Restoral

- **Category:** Category 4 — State / History / Persistence Case
- **Requirement Reference:** FR-08, FR-09, BR-06, AC-OP-03
- **Assigned Tester Role:** Account-Customer-1 then Account-Operator-1
- **Preconditions:** 65W GaN Fast Charger USB-C (CHG-GAN-65W) has initial stock = 25.
- **Synthetic Inputs:**
  - Customer-1 orders 3 units of CHG-GAN-65W.
  - Operator selects "Reject Order".

#### Steps

1. As Account-Customer-1, place order for 3 units of CHG-GAN-65W. Catalog stock drops to 22. Note Order ID (e.g. #42).
2. Sign in as Account-Operator-1 and open /operator/orders.
3. Under "Pending" tab, locate Order #42 and click **"Reject Order"**.
4. Confirm rejection in modal dialog.
5. Observe order status badge update to REJECTED.
6. Attempt to click "Accept" or "Reject" again on the same order.
7. Check public catalog stock for 65W GaN Fast Charger USB-C.

#### Expected Results

- Order status is permanently persisted as REJECTED.
- Subsequent status update attempts return HTTP 409 ORDER_ALREADY_PROCESSED.
- The 3 reserved units are atomically restored; catalog stock returns to exactly **25 units**.

## 6. How to Report Findings Back to Our Product Team

If you encounter an actual failure, unexpected behavior, or discrepancy against the expected results:

1. Record:
   - Linked Test Case ID (UAT-TT-01 to 06)
   - Preconditions and test account used
   - Step-by-step reproduction instructions(?)
   - Observed actual result vs expected result
   - Severity assessment (Critical, Major, Minor) with user impact justification
   - Screenshot or terminal log evidence
2. Notify us via our private course communication channel. (pat discord)
3. We will triage all reported findings, correct release-blocking defects, redeploy to Cloud Run, and notify you for independent retesting and final acceptance sign-off.