# Lab 7 Maintenance Change Request (CR-LAB7-01)
## Tiered Order Volume Discount & Free Shipping Calculation Engine

---

## 1. Executive Summary & Change Authorization

* **Change Request ID**: `CR-LAB7-01`
* **Target Feature / Rule**: `F-03 Order Assembly & Atomic Persistence` / `BR-01 Authoritative Server-Side Price Calculation`
* **Maintenance Type**: Adaptive / Enhancement Maintenance (Requirement Evolution)
* **Course approval requirement:** The team reports that the instructor waived instructor/TA approval. The team holds the announcement screenshot for separate inclusion in the final submission. It has not been embedded here.
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

- Orders created before the Lab 7 pricing change retain the original stored `totalAmount`. Their effective subtotal equals that stored total, and discount and shipping are both $0.00. Never apply current pricing retrospectively.
- New orders use the Lab 7 rules at checkout and retain the resulting persisted breakdown. History, receipts, operator views, payment responses and cancellation use the authoritative persisted total. Catalog price changes do not affect stored line snapshots.
- Preserve ownership checks, stock reservation and restoration, and atomic checkout and terminal transitions. A zero pricing field alone is not a reliable version marker. Review legacy identification or backfill before implementation.
   - Customer Order Detail (`FR-07`) and Operator Order Queue (`FR-08`) render the complete breakdown.

---

## 4. Acceptance Criteria (AC)

| AC ID | Description | Exact Boundary / Condition |
|---|---|---|
| **AC-PRC-01** | Standard Order with Shipping Fee | `itemsSubtotal < $200.00` $\implies$ `discountAmount = $0.00`, `shippingFee = $15.00`, `totalAmount = itemsSubtotal + $15.00`. |
| **AC-PRC-02** | Free Shipping Threshold Boundary | `itemsSubtotal == $199.99` $\implies$ `shippingFee = $15.00`.<br>`itemsSubtotal == $200.00` $\implies$ `shippingFee = $0.00` (Free Shipping). |
| **AC-PRC-03** | 5% Tier 1 Volume Discount Boundary | `itemsSubtotal == $499.99` $\implies$ `discountRate = 0%`, `shippingFee = $0.00`.<br>`itemsSubtotal == $500.00` $\implies$ `discountRate = 5%` ($-\$25.00$), `shippingFee = $0.00`, `totalAmount = $475.00`. |
| **AC-PRC-04** | 10% Tier 2 Volume Discount Boundary | `itemsSubtotal == $999.99` $\implies$ `discountRate = 5%` ($-\$50.00$), `totalAmount = $949.99`.<br>`itemsSubtotal == $1,000.00` $\implies$ `discountRate = 10%` ($-\$100.00$), `totalAmount = $900.00`. |
| **AC-PRC-05** | Discount and shipping interaction | At $205.00, discount and shipping are $0.00 and total is $205.00. At $500.00, discount is $25.00, net and total are $475.00, and shipping is $0.00. The minimum discounted net is $475.00 in the 5% tier and $900.00 in the 10% tier, so every discounted order qualifies for free shipping. |
| **AC-PRC-06** | Authoritative Server Calculation | Client payloads attempting to specify or manipulate `totalAmount`, `discountAmount`, or `shippingFee` have no effect. |
| **AC-PRC-07** | Persisted pricing and historical orders | A pre-Lab 7 order stored at $500.00 returns subtotal and total of $500.00 and discount and shipping of $0.00. Receipts, history, operator views, payment responses, and cancellation use that stored total. New orders use their persisted Lab 7 pricing breakdown. Ownership, transaction, and inventory guarantees are preserved. |

---

## 5. Traceability & Impact Analysis

| Requirement ID | Feature | Affected Docs | Acceptance Criteria | Planned STS Test | Target Code Files |
|---|---|---|---|---|---|
| BR-01, FR-03, FR-04 | F-03 checkout | SRS sections 3.2 and 4, Sprint 1 Feature SDS and STS, System SDS | AC-PRC-01..06, AC-ORD-01/02, AC-BR-01 | LAB7-STS-01, 02, 04 | `server/src/utils/pricingEngine.ts`, `server/src/app.ts`, `client/src/components/cart/CartDrawer.tsx` |
| BR-02, FR-06, FR-07, FR-08 | F-04 history/receipt and F-05 queue | Sprint 1 Feature SDS and STS, SRS, System SDS | AC-PRC-07, AC-BR-02, AC-ORD-04/05, AC-OP-01 | LAB7-STS-03 | `server/src/app.ts`, `server/src/services/operatorOrders.ts`, `client/src/pages/OrderDetailPage.tsx`, `client/src/pages/OrderHistoryPage.tsx`, `client/src/pages/OperatorOrdersPage.tsx` |
| FR-12, FR-13, BR-08, BR-10, NFR-02 | F-07 cancellation and F-08 payment | Sprint 2 Feature SDS and STS, SRS, System SDS | AC-PRC-07, AC-ORD-CAN-02/05/06, AC-PAY-02/03/04/07 | LAB7-STS-04, 05 | `server/src/services/cancellation.ts`, `server/src/services/payment.ts`, `server/src/services/operatorOrders.ts` |
| BR-04, BR-05 | Ownership and role restrictions | Sprint 1 and Sprint 2 Feature SDS and STS | AC-SEC-01/02, AC-ORD-CAN-04 | LAB7-STS-06 | `server/src/app.ts`, `server/src/services/payment.ts`, `server/src/services/cancellation.ts`, `client/src/components/RoleGuard.tsx` |

## 6. Review status

- **Original pre-implementation teammate review**: Conducted on 27 November 2026 by Wai Phyo (`@Joey-pku`) for the initial contract update (`b3f7de8d350367f083d941864147eb866d9b0ca5`).
- **Phase 2 remediation contract review & PR merge**: Completed on 28 November 2026 by Wai Phyo (`@Joey-pku`) through PR #62 (`c83436b`) and PR #64 (`ab3f354d205596a6cab4e7e62245c7a4de871821`, merge commit `e1f097e23bdf18cb62c4e9a3cd0ad8526e2c0b6a`), verifying historical pricing preservation and deployment readiness.

## 7. Post-Implementation Verification & Test Evidence

* **Verification Date**: 28 November 2026
* **Verification Status**: **VERIFIED & PASSING** (Release Candidate SHA: `ab3f354d205596a6cab4e7e62245c7a4de871821`, Cloud Run Revision: `techtent-00007-n4k`).
* **Summary of Test Runs**:
  1. **Red Test Evidence (Pre-Implementation)**:
     - Ran `npm --prefix server run test:unit tests/unit/pricing-engine.test.ts` on pre-change commit `67d81736b0ce208eb606428e36780c74f51eeb29`: 7 intentional boundary failures (`TC-PRC-01` through `TC-PRC-07`) confirming clean test-first red state before business logic was applied.
  2. **Green Test Evidence (Post-Implementation)**:
     - `server/tests/unit/pricing-engine.test.ts`: 11 passed (11) including all boundary checks ($199.99 vs $200, $499.99 vs $500, $999.99 vs $1,000).
     - Full Server Unit Suite: 8 test files, 112 passed (112), 0 failed.
     - Full Client Suite: 10 test files, 70 passed (70), 0 failed.
     - Total Automated Tests: 182 passed across client and server.
     - Production Builds: `npm --prefix server run build` (`tsc`) and `npm --prefix client run build` (`tsc && vite build`) passed with zero errors.
     - Deployment Workflow Guards: `python deploy/tests/test_workflow_guards.py` passed (4/4 OK).
* **UI Delivery**:
  - **Cart Drawer (`CartDrawer.tsx`)**: Displays crossed-out original total next to discounted price, itemized breakdown (subtotal, volume discount amount, and delivery fee), and active threshold progress banner.
  - **Order Confirmation Modal (`OrderConfirmationModal.tsx`)**: Displays crossed-out pre-discount total, savings pill, delivery status, and authoritative grand total.
  - **Order Details / Receipt (`OrderDetailPage.tsx`)**: Prominent green savings banner (`"🎉 You saved $X.XX with our volume discount!"`), crossed-out original total, and itemized receipt breakdown.
  - **Order History List (`OrderHistoryPage.tsx`)**: Crossed-out pre-discount price and green savings callout next to the authoritative total.

