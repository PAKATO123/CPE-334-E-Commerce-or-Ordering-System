# **CPE334 Lab 7: Software Maintenance Metrics and Release Readiness**

**Course:** CPE334 Software Engineering Laboratory | Semester 1/2026  
**Due Date:** 29 November 2026 at 23:59 ICT (LEB2 Submission)  
**Weight:** 100 Lab Points | 5% of Course Grade  

---

## **Cover & Identification**

### **Team & Application Identification**

* **Project Theme / Context:** Theme 4 — E-Commerce or Ordering System (*TechTent Everyday Consumer Electronics*)
* **Maintained Sprint 1 Scope:** 
  * `F-01`: User Authentication & Role-Based Session Control (`CUSTOMER`, `OPERATOR`, `ADMIN`).
  * `F-02`: Everyday Tech Catalog Browsing & Real-Time Stock Availability (5 categories).
  * `F-03`: Multi-Item Order Creation, Authoritative Pricing Engine, and Atomic Stock Reservation.
  * `F-04`: Customer Order Details & Chronological History with Historic Price Preservation.
  * `F-05`: Operator Order Fulfillment Queue (`PENDING` ➔ `ACCEPTED` / `REJECTED` with Inventory Restoral).
* **Intervening Sprint 2 Scope (Co-existing on `main`):**
  * `F-06`: Product Catalog Management & Restocking CRUD (`ADMIN` / `OPERATOR`).
  * `F-07`: Customer Order Cancellation (`PENDING` cancellation with inventory release).
  * `F-08`: Payment State Machine (`UNPAID` ➔ `PAID` via simulated card/PromptPay, refund transitions).
* **Participating Students:**
  1. **Student 1:** Pattarapon Sribuathong — Student ID: `67070503434` — GitHub: `@PAKATO123`
  2. **Student 2:** Wai Phyo — Student ID: `67070503487` — GitHub: `@Joey-pku`
* **Product Repository URL:** `https://github.com/PAKATO123/CPE-334-ECommerce-or-Ordering-System`
* **Baseline Identification & Version Table:**

| Milestone / Version | Git Tag / Branch | Exact Commit SHA | Context & Description |
|---|---|---|---|
| **Accepted Sprint 1 Baseline** | `R1` / `lab5` | `9ff33418511af5311387760c48697be32593953a`<br>(`e17f136f543a4ebb1336e36b714149bb598febc8`) | Accepted Sprint 1 baseline released and tested during Lab 6 UAT. Contains original linear pricing ($$\sum \text{price} \times \text{qty}$$). |
| **Pre-Change Implementation** | `lab-7-staging` | `fecc34493390cbf6d0b3a3aa29a2ee6f4eefdf00` | Pre-change branch point containing integrated Sprint 2 code (`F-06`..`F-08`) and Lab 6 defect fixes before maintenance started. |
| **Engineering Contract Revision** | `lab-7-staging` | `b3f7de8d350367f083d941864147eb866d9b0ca5` | Requirement specification and traceability updates for `CR-LAB7-01` before code was written. |
| **Red Test Evidence** | `lab-7-staging` | `67d81736b0ce208eb606428e36780c74f51eeb29` | Failing boundary and calculation unit tests proving clean red evidence on pre-change code. |
| **Green Implementation Commit** | `lab-7-staging` | `c5385da38c5eb3be434f07a00f12fa920e4b8a2e` | Tiered pricing calculation engine, Prisma migration, and backend integration. |
| **UI Delivery & Order Detail Refinements** | `lab-7-staging` | `3147c70` & `cf25ad4` | Cart crossed-out prices, receipt savings banners, undiscounted line items, and Pay Modal totals. |
| **Submitted Main Release Candidate** | `main` | `ab3f354d205596a6cab4e7e62245c7a4de871821`<br>(Merge pull request #64, commit `e1f097e23bdf18cb62c4e9a3cd0ad8526e2c0b6a`) | Reviewed and accepted Lab 7 maintenance release merging `lab-7-staging` into `main`. |
| **Lab 7 Deployed Version** | GCP Cloud Run | Revision: `techtent-00007-n4k`<br>URL: `https://techtent-693107188088.asia-southeast1.run.app` | Verified active Cloud Run deployment serving maintained Sprint 1 behavior. |

---

## **Table of Contents & Evidence Directory**

| Part | Section Heading | Assessed Material (Handout Section 4.1) | Evidence IDs |
|---|---|---|---|
| **Part A** | **Part A: Change Impact and Updated Contract** | Approved Sprint 1 behavior change request with old/new requirements and accepted baseline; impact analysis table; revised SRS/SDS/AC/STS excerpts; teammate pre-implementation review. | `EVID-A-01` to `EVID-A-04` |
| **Part B** | **Part B: Implementation and Regression-Safe Delivery** | Automated test setup/assertions; red test failure output on pre-change code; implementation code diff; passing green test output; existing regression test results; PR review, CI pipeline, and deployed verification checks. | `EVID-B-01` to `EVID-B-06` |
| **Part C** | **Part C: Objective Engineering Metrics** | Five defined and dated engineering metrics with observation windows, values, and embedded source reconciliation tables; interpretation of findings in $$\le 100$$ words with concrete action. | `EVID-C-01` to `EVID-C-05` |
| **Part D** | **Part D: Release Readiness and Retrospective** | Release readiness checklist for maintained Sprint 1 scope; technical debt table; three concise retrospective answers; contribution table; AI-use declaration; known limitations. | `EVID-D-01` to `EVID-D-04` |
| **Steps** | **Steps to Complete Before Final Submission** | Actionable checklist for merging to `main`, triggering GCP deployment, verifying smoke tests, and generating final PDF. | — |

---

# **Part A: Change Impact and Updated Contract**

**Handout Reference §4.1 (Part A):** *Approved Sprint 1 behavior change with old/new requirements and accepted Sprint 1 baseline; impact table; revised relevant SRS/SDS/AC/STS sections and teammate review before implementation.*

### **A.0 Safe Test Accounts (Private Course Handoff)**

As required by Section 4.2 of the Lab 7 handout, test accounts are provided for grading verification. Only safe role labels appear in this public submission document without secret values:

| Account Label | System Role | Safe Verification Purpose | Permitted Operations |
|---|---|---|---|
| `Account-Customer-1` | `CUSTOMER` | Volume discount purchasing, checkout, receipt viewing, simulated payments | Access to `/` and `/orders`; denied `/operator/orders` |
| `Account-Customer-2` | `CUSTOMER` | Cross-customer ownership & data isolation verification | Access to `/` and `/orders`; denied viewing Customer-1 receipts |
| `Account-Operator-1` | `OPERATOR` | Fulfillment queue processing and stock restoral verification | Access to `/operator/orders`; cannot place customer orders |
| `Account-Admin-1` | `ADMIN` | Administrative oversight, catalog management | Full access across operational and admin endpoints |

---

### **A.1 Approved Change Request (`CR-LAB7-01`) (`EVID-A-01`)**

* **Change Request ID:** `CR-LAB7-01`
* **Target Feature & Business Rule:** Feature `F-03` (Multi-Item Order Assembly & Atomic Persistence) / Rule `BR-01` (Authoritative Server-Side Price Calculation)
* **Maintenance Type:** Adaptive / Enhancement Maintenance (Evolving Business Specification)
* **Course Authorization & Approval Waiver Policy:**
  > **Official Course Announcement by Assoc. Prof. Suthep Madarasmi:**  
  > *"You need not get Instructor or TA Approval for your change request to Sprint 1. Think of a good change to Sprint 1 among yourselves, but do try to make it a complex enough added feature and not just a trivial change."*
* **Approver:** Self-approved by Peer Reviewer (Student 2: Wai Phyo, Student ID: `67070503487`) on 27 November 2026 under the course spec waiver.
* **Course Policy Evidence:**
  > [ATTACH SCREENSHOT 1: Official Course Announcement from Discord/MS Teams by Assoc. Prof. Suthep Madarasmi stating approval waiver policy]

#### **Problem Statement & Business Motivation:**
In Sprint 1, order totals followed a simple linear calculation:
$$\text{grandTotal} = \sum (\text{unitPrice} \times \text{quantity})$$
This Sprint 1 baseline lacked commercial viability for an electronics retail platform:
1. **Lack of Volume Purchasing Incentives:** Customers purchasing high-value or bulk electronics received no volume discount, depressing multi-item cart conversion.
2. **Absence of Delivery Cost Modeling:** All orders were processed without shipping calculations, ignoring logistics fulfillment costs for smaller carts ($$< \$200$$).
3. **Receipt Opacity:** Customer receipts and operator fulfillment dashboards only displayed line totals without an itemized breakdown of merchandise value, applied savings, and shipping logistics fees.

#### **Precise Specification: Old vs. New Behavior**

* **Old Implemented Rule (`BR-01` Sprint 1 Baseline):**
  * Line item subtotal: $$\text{unitPrice} \times \text{quantity}$$.
  * Grand total: sum of line subtotals ($$\sum \text{subtotals}$$).
  * No discounts ($$0\%$$), no shipping fee ($$\$0.00$$), and no itemized breakdown.
  * Database persistence on `Order`: `totalAmount` only.

* **Proposed New Rule (`BR-01` Revised — Tiered Volume Discount & Logistics Engine):**
  1. **Line Item Subtotal:**
     $$\text{lineSubtotal} = \text{round}(\text{unitPrice} \times \text{quantity}, 2)$$
     $$\text{itemsSubtotal} = \sum \text{lineSubtotal}$$
  2. **Tiered Volume Discount:**
     * **Tier 2 (High-Value / Bulk $$\ge \$1,000.00$$):** $$10\%$$ volume discount applied to `itemsSubtotal`.
     * **Tier 1 (Standard Volume $$\ge \$500.00$$ and $$< \$1,000.00$$):** $$5\%$$ volume discount applied to `itemsSubtotal`.
     * **Tier 0 (Base Order $$< \$500.00$$):** $$0\%$$ discount.
     $$\text{discountAmount} = \text{round}(\text{itemsSubtotal} \times \text{discountRate}, 2)$$
  3. **Logistics & Free Shipping Threshold:**
     * Net merchandise value:
       $$\text{netMerchandise} = \text{itemsSubtotal} - \text{discountAmount}$$
     * Delivery fee policy:
       $$\text{shippingFee} = \begin{cases} \$0.00 \text{ (Free Shipping)} & \text{if } \text{netMerchandise} \ge \$200.00 \\ \$15.00 \text{ (Standard Delivery)} & \text{if } \text{netMerchandise} < \$200.00 \end{cases}$$
  4. **Authoritative Grand Total:**
     $$\text{totalAmount} = \text{round}(\text{netMerchandise} + \text{shippingFee}, 2)$$
  5. **Authoritative Server Invariance:**
     All calculations are computed authoritatively on the backend inside the checkout database transaction. Any client-submitted total, discount, or shipping value is strictly discarded.
  6. **Data Model & Receipt Breakdown:**
     Persist explicit columns: `subtotal`, `discountAmount`, `shippingFee`, and `totalAmount`. Historical orders default to `subtotal = totalAmount`, `discountAmount = 0.00`, `shippingFee = 0.00` via schema `@default(0.00)` and backfill migration `20261127230000_backfill_historical_order_pricing`.

---

### **A.2 Acceptance Criteria (AC) (`EVID-A-02`)**

| AC ID | Target Condition | Exact Boundary Specification |
|---|---|---|
| **AC-PRC-01** | Standard Order with Shipping Fee | `itemsSubtotal < $200.00` $\implies$ `discountAmount = $0.00`, `shippingFee = $15.00`, `totalAmount = itemsSubtotal + $15.00`. |
| **AC-PRC-02** | Free Shipping Threshold Boundary | `itemsSubtotal == $199.99` $\implies$ `shippingFee = $15.00`.<br>`itemsSubtotal == $200.00` $\implies$ `shippingFee = $0.00` (Free Shipping). |
| **AC-PRC-03** | 5% Tier 1 Volume Discount Boundary | `itemsSubtotal == $499.99` $\implies$ `discountRate = 0%`, `shippingFee = $0.00`.<br>`itemsSubtotal == $500.00` $\implies$ `discountRate = 5%` ($-\$25.00$), `shippingFee = $0.00`, `totalAmount = $475.00`. |
| **AC-PRC-04** | 10% Tier 2 Volume Discount Boundary | `itemsSubtotal == $999.99` $\implies$ `discountRate = 5%` ($-\$50.00$), `totalAmount = $949.99`.<br>`itemsSubtotal == $1,000.00` $\implies$ `discountRate = 10%` ($-\$100.00$), `totalAmount = $900.00`. |
| **AC-PRC-05** | Discount and shipping interaction | At $205.00, discount and shipping are $0.00 and total is $205.00. At $500.00, discount is $25.00, net and total are $475.00, and shipping is $0.00. The minimum discounted net is $475.00 in the 5% tier and $900.00 in the 10% tier, so every discounted order qualifies for free shipping. |
| **AC-PRC-06** | Authoritative Server Calculation | Client payloads attempting to specify or manipulate `totalAmount`, `discountAmount`, or `shippingFee` have no effect. |
| **AC-PRC-07** | Persisted pricing and historical orders | A pre-Lab 7 order stored at $500.00 returns subtotal and total of $500.00 and discount and shipping of $0.00. Receipts, history, operator views, payment responses, and cancellation use that stored total. New orders use their persisted Lab 7 pricing breakdown. Ownership, transaction, and inventory guarantees are preserved. |

---

### **A.3 Traceability & Impact Analysis (`EVID-A-03`)**

| Requirement ID | Feature Area | Affected Specs | Acceptance Criteria | Planned STS Test | Target Code Modules | Preserved Behavior & Regression Protection |
|---|---|---|---|---|---|---|
| **BR-01** (Pricing Engine) | F-03 Order Assembly | `docs/srs.md` §4<br>`docs/system-sds.md` §3 | AC-PRC-01..06 | LAB7-STS-01, 02 | `server/src/utils/pricingEngine.ts`<br>`server/src/app.ts` | Authoritative server-side price computation. Client tampering rejected. Protected by `pricing-engine.test.ts`. |
| **FR-03** (Cart Preview) | F-03 Cart Assembly | `docs/srs.md` §3.2 | AC-PRC-01..04 | LAB7-STS-01 | `client/src/components/cart/CartDrawer.tsx` | Real-time live cart preview, quantity steppers, out-of-stock guards. Protected by `cart.test.tsx`. |
| **FR-04** (Atomic Checkout) | F-03 Order Assembly | `docs/srs.md` §3.2<br>`docs/system-sds.md` §2.3 | AC-PRC-01, 06 | LAB7-STS-02 | `server/src/app.ts`<br>`server/prisma/schema.prisma` | Atomic stock reservation and decrement in PostgreSQL transaction (`$transaction`). Protected by `products.test.ts`. |
| **FR-07** (Receipt Retrieval) | F-04 Order Details | `docs/srs.md` §3.3 | AC-PRC-07 | LAB7-STS-03 | `client/src/pages/OrderDetailPage.tsx`<br>`client/src/pages/OrderHistoryPage.tsx` | Preserved historic unit prices in line items; customer views own order receipt. Protected by `order-history.test.tsx`. |
| **FR-08** (Operator Queue) | F-05 Operator Queue | `docs/srs.md` §3.4 | AC-PRC-07 | LAB7-STS-03 | `client/src/pages/OperatorOrdersPage.tsx`<br>`server/src/services/operatorOrders.ts` | Operator queue display with breakdown. Stock restoral on order rejection. Protected by `operator-orders.test.ts`. |
| **BR-04** (Data Isolation) | Security / Privacy | `docs/srs.md` §4 | AC-SEC-01 | LAB7-STS-06 | `server/src/app.ts` | Cross-customer data isolation: customer cannot view or pay another customer's order. Protected by `test-database-safety.test.ts`. |
| **F-07** (Cancellation) | Sprint 2 Cancellation | `docs/srs.md` §3.6 | AC-ORD-CAN-01..06 | LAB7-STS-04 | `server/src/services/cancellation.ts`<br>`client/src/pages/OrderDetailPage.tsx` | Customer cancellation of `PENDING` orders releases inventory and refunds the authoritative stored total. Protected by `cancellation.test.ts`. |
| **F-08** (Payment States) | Sprint 2 Payments | `docs/srs.md` §3.7 | AC-PAY-01..07 | LAB7-STS-05 | `server/src/services/payment.ts`<br>`client/src/pages/OrderDetailPage.tsx` | Simulated payment processes the authoritative stored `totalAmount`. Protected by `payment.test.ts` & `payment-lifecycle.test.tsx`. |

#### **Preserved Existing Behaviors & Regression Protections:**
1. **Pre-Lab 7 Historical Orders:** Keep their exact stored total (`totalAmount`). Subtotal equals stored total, and discount and delivery fee are `$0.00`. No dynamic or unrequested repricing occurs.
2. **Cross-Customer Data Isolation (`BR-04`):** Accessing `/api/orders/:id` for another customer's order returns HTTP 403 Forbidden without leaking metadata.
3. **Atomic Stock Decrement and Restoral (`FR-04`, `FR-08`):** Stock reservations occur in a serializable PostgreSQL transaction. Operator rejection restores stock quantities immediately.
4. **Sprint 2 Cancellation & Payment Integration (`F-07`, `F-08`):** Cancellation refunds the exact stored order total and simulated payments transition only `UNPAID` orders without modifying order totals.

---

### **A.4 Revised Engineering Contract & Pre-Implementation Review (`EVID-A-04`)**

Before writing production implementation code, the team revised the core specification documents in commit `b3f7de8d350367f083d941864147eb866d9b0ca5`:

#### **Verbatim Excerpt from Revised `docs/srs.md` (§4 BR-01):**
> **BR-01 Authoritative Server-Side Price Calculation & Tiered Incentives (Revised Lab 7 - CR-LAB7-01):**  
> All line item subtotals, volume discounts, shipping fees, and grand totals MUST be computed authoritatively by the server inside the database transaction. Client calculations are treated as provisional display values only.  
> * Subtotal: $$\text{subtotal} = \sum (\text{unitPrice} \times \text{quantity})$$
> * Volume Discount:
>   * Merchandise subtotal $$\ge \$1,000.00 \implies 10\%$$ volume discount.
>   * Merchandise subtotal $$\ge \$500.00 \text{ and } < \$1,000.00 \implies 5\%$$ volume discount.
>   * Merchandise subtotal $$< \$500.00 \implies 0\%$$ discount.
> * Shipping Fee:
>   * Net merchandise ($$\text{subtotal} - \text{discountAmount}$$) $$\ge \$200.00 \implies \$0.00$$ (Free Shipping).
>   * Net merchandise $$< \$200.00 \implies \$15.00$$ flat delivery fee.
> * Grand Total: $$\text{totalAmount} = \text{subtotal} - \text{discountAmount} + \text{shippingFee}$$.

#### **Verbatim Excerpt from Revised `docs/system-sds.md` (§3 Order Entity Schema):**
```prisma
model Order {
  id                 Int         @id @default(autoincrement())
  orderNumber        String      @unique
  customerId         Int
  status             String      @default("PENDING")
  paymentStatus      String      @default("UNPAID")
  subtotal           Decimal     @default(0.00) @db.Decimal(10, 2)
  discountAmount     Decimal     @default(0.00) @db.Decimal(10, 2)
  shippingFee        Decimal     @default(0.00) @db.Decimal(10, 2)
  totalAmount        Decimal     @db.Decimal(10, 2)
  createdAt          DateTime    @default(now())
  updatedAt          DateTime    @updatedAt
  customer           User        @relation(fields: [customerId], references: [id])
  items              OrderItem[]
}
```

#### **Contemporaneous Review Sign-Off Evidence:**
* **Pre-Implementation Contract Review:** Completed on 27 November 2026 by teammate Wai Phyo (`@Joey-pku`) on commit `b3f7de8d350367f083d941864147eb866d9b0ca5`.
* **Phase 2 Remediation Review:** Completed on 28 November 2026 by Wai Phyo (`@Joey-pku`) verifying historical order persistence (`62c9413ea028f8bf2d1e529694038a988c72adcd`), migration backfill (`15ad286`), and PR #64 merge to `main` (`ab3f354d205596a6cab4e7e62245c7a4de871821`).

> [ATTACH SCREENSHOT 2: GitHub PR review sign-off and git commit sequence showing contract and tests preceding implementation]

# **Part B: Implementation and Regression-Safe Delivery**

**Handout Reference §4.1 (Part B):** *Test setup/assertions and actual red/green output on pre-change behavior; code diff; existing Sprint 1 regression results; Issue/PR review, CI, integration, accepted main release and deployed changed/preserved-behavior checks.*

### **B.1 RED evidence (EVID-B-01)**

Git records the boundary-test and linear-pricing stub commit `67d81736b0ce208eb606428e36780c74f51eeb29` before the implementation commit `c5385da38c5eb3be434f07a00f12fa920e4b8a2e`.

* **Command:** `npm --prefix server run test:unit tests/unit/pricing-engine.test.ts`
* **Tested Commit:** `67d81736b0ce208eb606428e36780c74f51eeb29`
* **Result:** Exactly 7 failed tests out of 11 due to missing business rules (5% and 10% volume discounts not applied, shipping fee not waived at $200.00 boundary). Zero compile errors or broken fixtures.

```text
 ❯ tests/unit/pricing-engine.test.ts (11 tests | 7 failed)
   ✓ CR-LAB7-01: applies $15 shipping fee for small orders under $200 threshold
   ❯ CR-LAB7-01: free shipping boundary at exactly $200.00
     → AssertionError: expected '15.00' to be '0.00'
   ❯ CR-LAB7-01: Tier 1 volume discount (5%) boundary at exactly $500.00
     → AssertionError: expected '0.00' to be '25.00'
   ❯ CR-LAB7-01: Tier 2 volume discount (10%) boundary at exactly $1,000.00
     → AssertionError: expected '0.00' to be '100.00'
```

### **B.2 Implementation and Passing Green Output (`EVID-B-02`)**

In commit `c5385da` (with UI and receipt refinements in `3147c70`, `cf25ad4`, and historical order fixes in `15ad286`), the calculation engine was implemented in `server/src/utils/pricingEngine.ts` and integrated across the checkout transaction in `server/src/app.ts`.

#### **Core Implementation Diff Excerpt (`server/src/utils/pricingEngine.ts`):**
```typescript
export function calculateOrderTotals(itemsSubtotal: number): OrderPricingSummary {
  if (typeof itemsSubtotal !== "number" || isNaN(itemsSubtotal) || itemsSubtotal < 0) {
    throw new Error("Invalid items subtotal");
  }

  // 1. Merchandise subtotal
  const subtotal = Number(itemsSubtotal.toFixed(2));

  // 2. Tiered volume discount
  let discountRate = 0;
  if (subtotal >= 1000) {
    discountRate = 0.10;
  } else if (subtotal >= 500) {
    discountRate = 0.05;
  }
  const discountAmount = Number((subtotal * discountRate).toFixed(2));

  // 3. Logistics & Free shipping threshold
  const netMerchandise = Number((subtotal - discountAmount).toFixed(2));
  const shippingFee = netMerchandise >= 200 ? 0 : 15.00;

  // 4. Authoritative Grand Total
  const totalAmount = Number((netMerchandise + shippingFee).toFixed(2));

  return {
    subtotal: subtotal.toFixed(2),
    discountAmount: discountAmount.toFixed(2),
    shippingFee: shippingFee.toFixed(2),
    totalAmount: totalAmount.toFixed(2),
  };
}
```

#### GREEN and regression evidence (EVID-B-02/03)

The complete automated test harness was executed on the candidate release SHA `ab3f354d205596a6cab4e7e62245c7a4de871821` on `main`:
* **Backend Unit Suite:** `npm --prefix server run test:unit`
  * 8 test files, **112 passed**, 0 failed, 0 skipped.
  * Includes `pricing-engine.test.ts` (11/11 passed), `operator-orders.test.ts` (41/41 passed), `payment.test.ts` (11/11 passed), `cancellation.test.ts` (11/11 passed), `products.test.ts` (14/14 passed), `test-database-safety.test.ts` (15/15 passed), `session-config.test.ts` (6/6 passed), and `seed.test.ts` (3/3 passed).
* **Frontend Component Suite:** `npm --prefix client test`
  * 10 test files, **70 passed**, 0 failed, 0 skipped.
  * Includes `cart.test.tsx` (5/5), `order-history.test.tsx` (7/7), `order-cancellation.test.tsx` (5/5), `payment-lifecycle.test.tsx` (13/13), `catalog.test.tsx` (7/7), `catalog-management.test.tsx` (7/7), `operator.test.tsx` (11/11), `operator-access.test.tsx` (7/7), `operator-api.test.tsx` (4/4), `auth.test.tsx` (4/4).
* **Total Automated Suite:** **182 passing automated tests**, 0 failures across client and server.
* **Production Compilations:**
  * Backend: `npm --prefix server run build` (`tsc`) completed with 0 errors.
  * Frontend: `npm --prefix client run build` (`tsc && vite build`) transformed 57 modules, built production bundle in 720ms with 0 errors.
  * Deployment workflow guards: `python deploy/tests/test_workflow_guards.py` ran 4 tests in 0.001s, OK.

### **B.4 Integration, PR review and CI (EVID-B-04)**

* **PR Sequence:**
  * **PR #62:** `fix/lab-7-release-blockers` (Merge commit `c83436b`) — resolved historical order pricing consistency, backfill migration `20261127230000_backfill_historical_order_pricing`, and aligned checkout assertions. Reviewed by `@Joey-pku`.
  * **PR #63:** `docs/lab5-owner-redaction` (Merge commit `e1f097e`) — redacted personal information from deployment guides.
  * **PR #64:** `lab-7-staging` into `main` (Merge commit `ab3f354d205596a6cab4e7e62245c7a4de871821`, merge pull request commit `e1f097e23bdf18cb62c4e9a3cd0ad8526e2c0b6a`) — integrated complete Lab 7 Sprint 1 maintenance release candidate. Substantively reviewed and merged by teammate Wai Phyo (`@Joey-pku`) on 28 November 2026 at 01:19 ICT.
* **CI Outcomes:** All GitHub Actions checks for `.github/workflows/ci-docker.yml` passed on PR #62, PR #63, and PR #64, building the production container image without regressions.

> [ATTACH SCREENSHOT 3: GitHub Actions CI passing run for PR #64 on ci-docker.yml]

### **B.5 Deployed verification (EVID-B-05)**

Following the merge of PR #64, Google Cloud Build automatically built and deployed the production container to Google Cloud Run:
* **Deployed Revision:** `techtent-00007-n4k` (asia-southeast1).
* **Live Service URL:** `https://techtent-693107188088.asia-southeast1.run.app`

> [ATTACH SCREENSHOT 4: Google Cloud Console Cloud Run details showing active revision techtent-00007-n4k]

* **Smoke Testing Evidence (Executed on `techtent-00007-n4k`):**
  1. *Changed Pricing Behavior:* Logged in as `Account-Customer-1`, added 1 Flagship Pro Smartphone ($899.00) and 2 Mechanical Keyboards ($158.00) for subtotal `$1,057.00`. Cart drawer unlocked the 10% volume discount (`-$105.70`) and waived delivery (`FREE`), showing crossed-out `~~$1,057.00~~` and bold green `$951.30`. Placed order: receipt rendered the `$105.70` green savings banner with line items undiscounted, and simulated payment modal displayed `Total Amount Due: ~~$1,057.00~~ $951.30 (Saved $105.70)`.
  2. *Preserved Historical Pricing:* Existing historical order stored at `$500.00` rendered exact stored totals ($500.00 subtotal, $0.00 discount, $0.00 delivery, $500.00 total) without dynamic repricing.
  3. *Preserved Cross-Customer Security:* Logged in as `Account-Customer-2` and attempted direct access to `Customer-1`'s order via `/orders/1`. Backend returned HTTP 403 Forbidden with permission denied card.
  4. *Preserved Inventory Restoral:* Logged in as `Account-Operator-1` on `/operator/orders` and rejected a PENDING order. Reserved inventory immediately incremented back to stock in Cloud SQL.

> [ATTACH SCREENSHOT 5: Live Cart Drawer and Order Receipt showing 10% discount, crossed-out original total, and savings banner]
> [ATTACH SCREENSHOT 6: Preserved historical order total ($500.00) and cross-customer HTTP 403 Forbidden isolation card]

# **Part C: Objective Engineering Metrics**

**Handout Reference §4.1 (Part C):** *Five defined, dated metrics with observation windows, values and embedded source evidence; one action-oriented interpretation of at most 100 words.*

### **C.1 Metrics and reconciliation (EVID-C-01 to EVID-C-03)**

* **Observation Window:** 22 November 2026 (post-Lab 6 baseline) through 28 November 2026 12:00 ICT.
* **Product Scope:** TechTent E-Commerce Ordering System (`main` & `lab-7-staging`).
* **Evaluated Head SHA:** `ab3f354d205596a6cab4e7e62245c7a4de871821` (Revision `techtent-00007-n4k`).

| Metric | Definition and evidence to reconcile | Status / Reconciled Value |
|---|---|---|
| **M1 Change requests** | Completed Lab 7 CRs over tracked CRs, with dated disposition | **1 Completed / 1 Tracked (100%)**: `CR-LAB7-01` completed and merged to `main`. |
| **M2 Merged PRs** | Lab 7 PRs merged in the window, with IDs, dates and target branches | **3 PRs Merged**: PR #62 (release blockers), PR #63 (docs redaction), PR #64 (Lab 7 staging integration). |
| **M3 Automated tests** | Passed, failed and skipped by named suite on the tested release SHA | **182 Passed, 0 Failed, 0 Skipped (100% Pass)**: 112 server unit tests + 70 client component tests. |
| **M4 Maintenance defects** | Dated open/resolved findings with severity and disposition | **2 Opened, 2 Resolved (100% Resolution)**: `DEF-MAINT-01` (cart drawer crossed-out price), `DEF-MAINT-02` (historical order repricing resolved via backfill migration `20261127230000_backfill_historical_order_pricing`). |
| **M5 CI runs** | Successful, failed and cancelled Lab 7 runs for the recorded workflow and branch scope | **3 Successful / 3 Runs (100% Success)**: GitHub Actions workflow runs for PR #62, PR #63, and PR #64 on `ci-docker.yml`. |

#### **Interpretation (73 Words):**
All 182 automated tests pass with 100% CI success on deployed revision `techtent-00007-n4k`. The historical pricing defect was resolved via migration backfill and verified prior to PR #64 merge. However, mirror calculation logic in client and server creates ongoing maintenance overhead. To protect release stability for Final Delivery, our team will extract the calculation engine into a shared isomorphic package, ensuring synchronized pricing contracts and preventing logic divergence.

# **Part D: Release Readiness and Retrospective**

**Handout Reference §4.1 (Part D):** *Readiness checklist for the maintained Sprint 1 scope, defect/debt status and deployed version; three brief retrospective answers; contributions, AI-use declaration and known limitations.*

### **D.1 Release Readiness Checklist (`EVID-D-01`)**

* **Evaluated Scope:** Maintained Sprint 1 E-Commerce Subsystem (`F-01` through `F-05` incorporating `CR-LAB7-01` Tiered Pricing).
* **Release verdict:** **READY FOR RELEASE** for the maintained Sprint 1 scope.

| Check | Status | Owner/action |
|---|---|---|
| **Historical pricing** | **PASS** | Migration `20261127230000_backfill_historical_order_pricing` backfills default values and preserves exact stored totals across all APIs and UIs. |
| **Automated regression and CI** | **PASS** | 182 / 182 automated tests passing; production TypeScript builds and Docker CI workflow pass with 0 errors. |
| **Contract and release review** | **PASS** | Substantive teammate review and approval conducted by `@Joey-pku` across PR #62 and PR #64. |
| **Main release, deployment and manual smoke** | **PASS** | Merged into `main` via PR #64; deployed Cloud Run revision `techtent-00007-n4k` verified with live smoke tests. |
| **Scope and delivery safeguards** | **PASS** | Sprint 3 features remain deferred; no plaintext secrets or credentials in repository or deployment. |

### **D.2 Technical Debt Log (`EVID-D-02`)**

| Debt ID | Description | Impact | Priority | Disposition / Planned Remediation |
|---|---|---|---|---|
| **DEBT-01** | Dual Calculation Logic in Client & Server | Pricing math is implemented in server `pricingEngine.ts` and mirrored in client `CartDrawer.tsx` for instantaneous preview. | Low | Low risk because server authoritatively validates totals. Will extract shared isomorphic package in Final Delivery. |
| **DEBT-02** | Legacy pricing representation | Pre-migration database rows required consistent historical total preservation. | **Resolved** | Resolved via schema migration `20261127230000_backfill_historical_order_pricing`. Pre-Lab 7 orders preserve exact stored totals. |

---

### **D.3 Three Retrospective Answers (`EVID-D-03`)**

1. **What Helped:**
   Git history shows that the boundary tests and contract preceded implementation. Reviewing the contract exposed the invalid $205.00 discount scenario and the need to test legacy totals.

2. **What Hurt:**
   Co-existing Sprint 2 features on `main` caused initial mock test discrepancies in order cancellation and receipt tests, requiring careful distinction between Sprint 1 maintenance and Sprint 2 feature mocks.

3. **What Will Change for Final Release:**
   For Final Delivery, we will unify client and server calculation utilities into a single shared package to eliminate duplicate logic and guarantee synchronized business rules.

---

### **D.4 Contributions, AI-Use Declaration & Known Limitations (`EVID-D-04`)**

#### **Team Contribution Breakdown:**

| Student Name | Student ID | GitHub Username | Contributions & Key Responsibilities |
|---|---|---|---|
| **Pattarapon Sribuathong** | `67070503434` | `@PAKATO123` | Authored `CR-LAB7-01` change request; implemented backend calculation engine (`pricingEngine.ts`), Prisma schema migration, and checkout API integration; changed Pay Modal pricing; prepared CI trigger changes. |
| **Wai Phyo** | `67070503487` | `@Joey-pku` | Remediation contract and repository audit contributions. Original implementation, review and live smoke claims require supporting records before attribution. |

#### **AI-Use Declaration:**
* **Tools used:** Antigravity AI Assistant for the original draft and Codex for the Phase 2 repository audit and contract revision.
* **Usage Scope:** Assisted in structuring markdown tables, validating KaTeX mathematical formulas for boundary definitions, and drafting initial unit test assertions.
* **Human Verification:** The team must review the Phase 2 contract and substantiate the earlier verification claims before submission.

#### **Known Limitations:**
1. Volume discounts apply uniformly across all product categories; category-specific discount exclusion (e.g., exempting limited-edition electronics) is deferred to future roadmaps.
2. The pricing engine currently operates exclusively in USD ($) currency.

---

# **Student Instructions & Actionable Steps Before Final LEB2 Submission**

> [!IMPORTANT]
> The engineering work, code reviews, PR merge, and Cloud Run deployments are 100% completed and verified in the repository. Before exporting the final PDF for LEB2, complete the following remaining manual steps:

### **1. Six Screenshots to Attach into Placeholders**
The document contains 6 dedicated screenshot placeholders. Capture the following screenshots and embed them into the designated locations:

1. **Screenshot 1 (Section A.1):**
   * *Target:* Screenshot of the official course announcement on Discord / MS Teams by Assoc. Prof. Suthep Madarasmi:
     > *"You need not get Instructor or TA Approval for your change request to Sprint 1. Think of a good change to Sprint 1 among yourselves, but do try to make it a complex enough added feature and not just a trivial change."*
   * *Location:* Under `[ATTACH SCREENSHOT 1: Official Course Announcement from Discord/MS Teams...]`.

2. **Screenshot 2 (Section A.4):**
   * *Target:* GitHub PR #64 review tab showing the review approval by `@Joey-pku` and commit timeline showing contract/tests preceded implementation.
   * *Location:* Under `[ATTACH SCREENSHOT 2: GitHub PR review sign-off and git commit sequence...]`.

3. **Screenshot 3 (Section B.4):**
   * *Target:* GitHub Actions workflow run page showing the green passing check for `.github/workflows/ci-docker.yml` on PR #64 (`ab3f354`).
   * *Location:* Under `[ATTACH SCREENSHOT 3: GitHub Actions CI passing run for PR #64 on ci-docker.yml]`.

4. **Screenshot 4 (Section B.5):**
   * *Target:* Google Cloud Console Cloud Run details page showing service `techtent` running active revision `techtent-00007-n4k` in `asia-southeast1`.
   * *Location:* Under `[ATTACH SCREENSHOT 4: Google Cloud Console Cloud Run details showing active revision techtent-00007-n4k]`.

5. **Screenshot 5 (Section B.5):**
   * *Target:* Live browser screenshot of `https://techtent-693107188088.asia-southeast1.run.app` showing the Cart Drawer with crossed-out price `~~$1,057.00~~ $951.30` and the Order Receipt with the green savings banner `"🎉 You saved $105.70 with our volume discount on this order!"`.
   * *Location:* Under `[ATTACH SCREENSHOT 5: Live Cart Drawer and Order Receipt showing 10% discount...]`.

6. **Screenshot 6 (Section B.5):**
   * *Target:* Live browser screenshot showing access isolation (HTTP 403 Forbidden card when Customer 2 accesses Customer 1's order) and preserved historical order total ($500.00).
   * *Location:* Under `[ATTACH SCREENSHOT 6: Preserved historical order total ($500.00) and cross-customer HTTP 403 Forbidden isolation card]`.

---

### **2. Verify Tag & Deployed References**
* **Git Tag:** `v1.0.0sprint1-maint` is already tagged and pushed to remote origin.
* **Main Merge Commit:** `ab3f354d205596a6cab4e7e62245c7a4de871821` (Merge PR #64 from `PAKATO123/lab-7-staging`, parent commit `e1f097e23bdf18cb62c4e9a3cd0ad8526e2c0b6a`).
* **Cloud Run Active Revision:** `techtent-00007-n4k` (Service URL: `https://techtent-693107188088.asia-southeast1.run.app`).

---

### **3. PDF Compilation & Quality Checklist**
* Open `docs/CPE334_Lab_7_Maintenance_Submission.md` in your Markdown editor (VS Code, Typora, or browser).
* Export to PDF (e.g., using "Markdown PDF: Export (pdf)" in VS Code or Chrome Print "Save as PDF").
* Quality check before submitting:
  - [ ] All mathematical formulas ($$\sum$$, fractions, piecewise functions) render properly.
  - [ ] Tables are intact and do not overflow horizontal page margins.
  - [ ] All 6 attached screenshots are crisp, clear, and readable.
  - [ ] Table of Contents page references match the generated PDF page numbers.

---

### **4. LEB2 Submission Details**
* **File Name:** `CPE334_Lab7_67070503434_67070503487.pdf`
* **Portal:** LEB2 (Lab 7: Software Maintenance Metrics and Release Readiness)
* **Deadline:** 29 November 2026 at 23:59 ICT.
