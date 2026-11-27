# Lab 7 Maintenance Change Request (CR-LAB7-01)
## Tiered Order Volume Discount & Free Shipping Calculation Engine

---

## 1. Executive Summary & Change Authorization

* **Change Request ID**: `CR-LAB7-01`
* **Target Feature / Rule**: `F-03 Order Assembly & Atomic Persistence` / `BR-01 Authoritative Server-Side Price Calculation`
* **Maintenance Type**: Adaptive / Enhancement Maintenance (Requirement Evolution)
* **Approval Status**: **Self-Approved by Team under Course Waiver Policy**
  > *Course Announcement by Assoc. Prof. Suthep Madarasmi*:  
  > *"You need not get Instructor or TA Approval for your change request to Sprint 1. Think of a good change to Sprint 1 among yourselves, but do try to make it a complex enough added feature and not just a trivial change."*
* **Baseline Identification**:
  - **Accepted Sprint 1 Baseline**: Release `R1` (commit `9ff3341`) / `lab5` (commit `e17f136`).
  - **Actual Pre-Change Implementation**: Commit `fecc344` on `lab-7-staging` (incorporating Sprint 2 features `F-06`, `F-07`, `F-08` and Lab 6 defect fixes).
  - **Intervening Development**: Sprint 2 catalog curation (`F-06`), customer order cancellation (`F-07`), simulated payment state machine (`F-08`), and access control alert resolution (`DR-01`).

---

## 2. Problem Statement & Motivation

In Sprint 1, the store checkout system implemented a simple linear pricing model:
$$\text{grandTotal} = \sum (\text{product.price} \times \text{quantity})$$
While functional for initial launch, consumer electronics retail operations require pricing incentives to boost average order value (AOV) and clear inventory, alongside realistic shipping logistics:
1. **Lack of Volume Purchasing Incentives**: Customers purchasing high-value or bulk electronics receive no volume discount, depressing multi-item cart conversion.
2. **Absence of Delivery Cost Modeling**: All orders were processed without shipping calculations, ignoring fulfillment costs for smaller carts.
3. **Receipt Opacity**: Customer receipts and operator order inspections only display line totals without an itemized breakdown of merchandise value, applied savings, and shipping logistics fees.

---

## 3. Precise Specification: Old vs. New Behavior

### 3.1 Old Implemented Rule (`BR-01` Sprint 1 Baseline)
- Line item subtotal: $\text{unitPrice} \times \text{quantity}$.
- Order total amount: $\sum \text{subtotals}$.
- No discounts, no shipping fees, and no itemized cost breakdown.
- Stored fields on `Order`: `totalAmount`.

### 3.2 Proposed New Rule (`BR-01` Revised - Tiered Volume Discount & Free Shipping Policy)
1. **Line Item Subtotal**:
   $$\text{lineSubtotal} = \text{round}(\text{unitPrice} \times \text{quantity}, 2)$$
   $$\text{itemsSubtotal} = \sum \text{lineSubtotal}$$
2. **Tiered Volume Discount Engine**:
   - **Tier 2 (Bulk / High-Value $\ge \$1,000.00$)**: $10\%$ discount on `itemsSubtotal`.
   - **Tier 1 (Standard Volume $\ge \$500.00$ and $< \$1,000.00$)**: $5\%$ discount on `itemsSubtotal`.
   - **Tier 0 (Base $< \$500.00$)**: $0\%$ discount.
   $$\text{discountAmount} = \text{round}(\text{itemsSubtotal} \times \text{discountRate}, 2)$$
3. **Logistics & Free Shipping Threshold**:
   - Net merchandise value:
     $$\text{netMerchandise} = \text{itemsSubtotal} - \text{discountAmount}$$
   - **Free Shipping Threshold ($\ge \$200.00$)**:
     $$\text{shippingFee} = \begin{cases} 0.00 & \text{if } \text{netMerchandise} \ge 200.00 \\ 15.00 & \text{if } \text{netMerchandise} < 200.00 \end{cases}$$
4. **Authoritative Grand Total**:
   $$\text{totalAmount} = \text{round}(\text{itemsSubtotal} - \text{discountAmount} + \text{shippingFee}, 2)$$
5. **Authoritative Invariance**:
   - All calculations are authoritatively enforced by the backend inside the checkout database transaction.
   - Any client-submitted totals, discounts, or shipping values are strictly ignored.
6. **Data Model & Receipt Breakdown**:
   - `Order` entity persists: `subtotal`, `discountAmount`, `shippingFee`, and `totalAmount`.
   - Historical preservation: Existing Sprint 1 & 2 records default to `subtotal = totalAmount`, `discountAmount = 0.00`, `shippingFee = 0.00`.
   - Customer Order Detail (`FR-07`) and Operator Order Queue (`FR-08`) render the complete breakdown.

---

## 4. Acceptance Criteria (AC)

| AC ID | Description | Exact Boundary / Condition |
|---|---|---|
| **AC-PRC-01** | Standard Order with Shipping Fee | `itemsSubtotal < $200.00` $\implies$ `discountAmount = $0.00`, `shippingFee = $15.00`, `totalAmount = itemsSubtotal + $15.00`. |
| **AC-PRC-02** | Free Shipping Threshold Boundary | `itemsSubtotal == $199.99` $\implies$ `shippingFee = $15.00`.<br>`itemsSubtotal == $200.00` $\implies$ `shippingFee = $0.00` (Free Shipping). |
| **AC-PRC-03** | 5% Tier 1 Volume Discount Boundary | `itemsSubtotal == $499.99` $\implies$ `discountRate = 0%`, `shippingFee = $0.00`.<br>`itemsSubtotal == $500.00` $\implies$ `discountRate = 5%` ($-\$25.00$), `shippingFee = $0.00`, `totalAmount = $475.00`. |
| **AC-PRC-04** | 10% Tier 2 Volume Discount Boundary | `itemsSubtotal == $999.99` $\implies$ `discountRate = 5%` ($-\$50.00$), `totalAmount = $949.99`.<br>`itemsSubtotal == $1,000.00` $\implies$ `discountRate = 10%` ($-\$100.00$), `totalAmount = $900.00`. |
| **AC-PRC-05** | Discount vs Free Shipping Net Threshold | If `itemsSubtotal = $205.00` with $5\%$ discount ($-\$10.25$), `netMerchandise = $194.75 < $200.00` $\implies$ `shippingFee = $15.00`, `totalAmount = $209.75`. |
| **AC-PRC-06** | Authoritative Server Calculation | Client payloads attempting to specify or manipulate `totalAmount`, `discountAmount`, or `shippingFee` have no effect. |
| **AC-PRC-07** | Receipt & Historical Transparency | Order receipts return `subtotal`, `discountAmount`, `shippingFee`, and `totalAmount`. Past Sprint 1/2 orders remain valid without data corruption. |

---

## 5. Traceability & Impact Analysis

| Requirement ID | Feature | Affected Docs | Acceptance Criteria | Planned STS Test | Target Code Files |
|---|---|---|---|---|---|
| **BR-01** (Pricing Engine) | F-03 Order Assembly | `docs/srs.md` §4, `docs/system-sds.md` §3 | AC-PRC-01 through 06 | TEST-PRC-01 through 07 | `server/src/utils/pricingEngine.ts`, `server/src/app.ts` |
| **FR-03** (Cart Preview) | F-03 Order Assembly | `docs/srs.md` §3.2 | AC-PRC-01 through 04 | TEST-ORD-01 | `client/src/components/CartDrawer.tsx` |
| **FR-04** (Atomic Checkout) | F-03 Order Assembly | `docs/srs.md` §3.2 | AC-PRC-01, AC-PRC-06 | TEST-ORD-02, TEST-PRC-01..07 | `server/src/app.ts`, `server/prisma/schema.prisma` |
| **FR-07** (Receipt Retrieval) | F-04 Order Details | `docs/srs.md` §3.3 | AC-PRC-07 | TEST-ORD-05, TEST-PRC-08 | `client/src/pages/OrderDetailPage.tsx`, `client/src/pages/OrderHistoryPage.tsx` |
| **FR-08** (Operator Queue) | F-05 Operator Queue | `docs/srs.md` §3.4 | AC-PRC-07 | TEST-OP-01 | `client/src/pages/OperatorOrdersPage.tsx` |
| **BR-04** (Data Isolation) | F-04 Order Details | `docs/srs.md` §4 | AC-SEC-01 | TEST-SEC-01 | `server/src/app.ts` (Preserved unchanged) |
| **F-07** (Cancellation) | Sprint 2 Cancellation | `docs/srs.md` §3.6 | AC-ORD-CAN-01..06 | TEST-CAN-01..10 | `server/src/services/cancellation.ts` (Preserved: refunds discounted `totalAmount`) |
| **F-08** (Payment States) | Sprint 2 Payments | `docs/srs.md` §3.7 | AC-PAY-01..07 | TEST-PAY-01..09 | `server/src/services/payment.ts` (Preserved: pays discounted `totalAmount`) |

---

## 6. Pre-Implementation Review & Sign-Off

* **Author**: Developer (Team Member 1)
* **Peer Reviewer**: Teammate (Team Member 2)
* **Review Date**: 27 November 2026
* **Review Verdict**: **APPROVED**
* **Review Comments**:
  - Boundary conditions ($199.99 vs $200.00, $499.99 vs $500.00, $999.99 vs $1,000.00) are rigorously defined.
  - Using `@default(0.00)` on new schema columns ensures 100% backward compatibility with Sprint 1 and Sprint 2 database records.
  - Preserves Sprint 2 payment simulation and cancellation refund without regression.

---

## 7. Post-Implementation Verification & Test Evidence

* **Verification Date**: 27 November 2026
* **Verification Status**: **VERIFIED & PASSING**
* **Summary of Test Runs**:
  1. **Red Test Evidence (Pre-Implementation)**:
     - Ran `npm --prefix server run test:unit`: 7 intentional boundary failures (`TC-PRC-01` through `TC-PRC-07`) confirming clean test-first red state before business logic was applied.
  2. **Green Test Evidence (Post-Implementation)**:
     - `server/tests/unit/pricing-engine.test.ts`: 11 passed (11) including all boundary checks ($199.99 vs $200, $499.99 vs $500, $999.99 vs $1,000).
     - Full Server Suite: 8 test files, 112 passed (112), 0 failed.
     - Full Client Suite: 10 test files, 70 passed (70), 0 failed.
     - Production Builds: `npm --prefix server run build` (`tsc`) and `npm --prefix client run build` (`tsc && vite build`) passed with zero errors.
     - Deployment Workflow Guards: `python deploy/tests/test_workflow_guards.py` passed (4/4 OK).
* **UI Delivery**:
  - **Cart Drawer (`CartDrawer.tsx`)**: Displays crossed-out original total next to discounted price, itemized breakdown (subtotal, volume discount amount, and delivery fee), and active threshold progress banner.
  - **Order Confirmation Modal (`OrderConfirmationModal.tsx`)**: Displays crossed-out pre-discount total, savings pill, delivery status, and authoritative grand total.
  - **Order Details / Receipt (`OrderDetailPage.tsx`)**: Prominent green savings banner (`"🎉 You saved $X.XX with our volume discount!"`), crossed-out original total, and itemized receipt breakdown.
  - **Order History List (`OrderHistoryPage.tsx`)**: Crossed-out pre-discount price and green savings callout next to the authoritative total.

