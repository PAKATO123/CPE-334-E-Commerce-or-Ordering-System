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
| **Submitted Main Release Candidate** | Pending | Pending reviewed Lab 7 release merge | No Lab 7 release verified. |
| **Lab 7 Deployed Version** | Pending | Pending Cloud Run revision | The existing service URL is not evidence of a Lab 7 deployment. |

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

### **A.1 Approved Change Request (`CR-LAB7-01`) (`EVID-A-01`)**

The team reports that the instructor waived the separate instructor/TA approval requirement. The team holds the announcement screenshot for separate embedding in the final submission. It has not been embedded in this draft. The change updates Sprint 1 BR-01 to offer volume incentives, apply the stated delivery rule and show the pricing breakdown.

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
     Persist explicit columns: `subtotal`, `discountAmount`, `shippingFee`, and `totalAmount`. Historical orders default to `subtotal = totalAmount`, `discountAmount = 0.00`, `shippingFee = 0.00` via schema `@default(0.00)`.

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

### **A.3 Traceability & Impact Analysis (EVID-A-03)**

The [CR impact table](lab7-maintenance-change-request.md#5-traceability--impact-analysis) and [traceability matrix](traceability.md#cr-lab7-01-remediation-traceability) link original requirement and acceptance IDs to planned STS cases and source modules. Embed their relevant excerpts in the final PDF.

Pre-Lab 7 orders keep their exact stored total. Effective subtotal equals that total and delivery and discount are zero. New orders use the Lab 7 rules. Receipts, history, operator views, payment responses and cancellation use persisted amounts consistently. Preserve ownership and transaction/inventory guarantees.

### **A.4 Revised Engineering Contract & Pre-Implementation Review (`EVID-A-04`)**

Before writing production implementation code, the team revised the core specification documents in commit `b3f7de8d350367f083d941864147eb866d9b0ca5`:
* **`docs/srs.md` (§4 Business Rules & System Constraints):** Evolved `BR-01` from linear sum to tiered discounts (5% at $$\ge \$500$$, 10% at $$\ge \$1,000$$) and free delivery ($$\ge \$200$$).
* **`docs/system-sds.md` (§3 Data Architecture):** Added `subtotal Decimal(10,2) @default(0.00)`, `discountAmount Decimal(10,2) @default(0.00)`, and `shippingFee Decimal(10,2) @default(0.00)` to the `Order` entity.
* **`docs/traceability.md`:** Updated requirement rows for `BR-01`, `FR-03`, `FR-04`, and `FR-07`.

#### Review evidence

Original pre-implementation review: the earlier draft attributed approval to a teammate. A contemporaneous dated record is required to verify reviewer, timing, comments and verdict. Phase 2 remediation contract review is pending and must be recorded separately when it actually occurs.

# **Part B: Implementation and Regression-Safe Delivery**

**Handout Reference §4.1 (Part B):** *Test setup/assertions and actual red/green output on pre-change behavior; code diff; existing Sprint 1 regression results; Issue/PR review, CI, integration, accepted main release and deployed changed/preserved-behavior checks.*

### **B.1 RED evidence (EVID-B-01) - Pending reproduction**

Git records the boundary-test and linear-pricing stub commit `67d8173` before the implementation commit `c5385da`. The earlier transcript did not match the committed stub and tests. Preserve actual output tied to the tested commit and demonstrate the changed contract against pre-change checkout behavior. Record the command and counts.

### **B.2 Implementation and Passing Green Output (`EVID-B-02`)**

In commit `c5385da` (with UI and receipt refinements in `3147c70` and `cf25ad4`), the calculation engine was implemented in `server/src/utils/pricingEngine.ts` and integrated across the checkout transaction in `server/src/app.ts`.

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

#### GREEN and regression evidence (EVID-B-02/03) - Pending verification

Earlier local reports list 11 pricing tests, 112 backend unit tests (including pricing), 70 frontend component tests and successful builds. Treat those as reported historical results. The 182 total excludes backend integration. Capture actual outputs and exact SHAs for the corrected candidate, including migration-backed checkout, historical orders, authorization, payment, cancellation, and inventory tests.

### **B.4 Integration, PR review and CI (EVID-B-04)**

Pending. Record substantive review, the tested head SHA and completed CI result, staging integration, and the reviewed main release when verified.

### **B.5 Deployed verification (EVID-B-05)**

Pending. After an authorized deployment of the verified Lab 7 SHA, record the revision and actual synthetic-account smoke results for changed pricing and preserved customer isolation and inventory behavior. Capture evidence before marking any check passed.

# **Part C: Objective Engineering Metrics**

**Handout Reference §4.1 (Part C):** *Five defined, dated metrics with observation windows, values and embedded source evidence; one action-oriented interpretation of at most 100 words.*

### **C.1 Metrics and reconciliation (EVID-C-01 to EVID-C-03)**

Lab 7 metrics are pending a dated, reconciled release snapshot. Limit the scope to the Lab 7 maintenance work. Record the observation window, tested SHA where applicable, exact numerator and denominator, and underlying source list.

| Metric | Definition and evidence to reconcile | Status |
|---|---|---|
| M1 Change requests | Completed Lab 7 CRs over tracked CRs, with dated disposition | CR-LAB7-01 is tracked and remains open for remediation. |
| M2 Merged PRs | Lab 7 PRs merged in the window, with IDs, dates and target branches | Pending final reconciliation. Do not count Lab 6 or future PRs. |
| M3 Automated tests | Passed, failed and skipped by named suite on the tested release SHA | Pending. Earlier local reports cover 112 unit and 70 frontend tests and exclude backend integration. |
| M4 Maintenance defects | Dated open/resolved findings with severity and disposition | Historical repricing is open. Verify other findings before closing them in the metric. |
| M5 CI runs | Successful, failed and cancelled Lab 7 runs for the recorded workflow and branch scope | Pending actual run IDs and outcomes. No success percentage is established. |

Interpretation: duplicated pricing logic and the response-time legacy fallback can make displayed totals disagree with stored totals. The remediation author will preserve persisted pricing and demonstrate agreement across API and UI through legacy and new-order regression cases before R2 review. Reconcile the metrics before the final interpretation.

# **Part D: Release Readiness and Retrospective**

**Handout Reference §4.1 (Part D):** *Readiness checklist for the maintained Sprint 1 scope, defect/debt status and deployed version; three brief retrospective answers; contributions, AI-use declaration and known limitations.*

### **D.1 Release Readiness Checklist (`EVID-D-01`)**

* **Evaluated Scope:** Maintained Sprint 1 E-Commerce Subsystem (`F-01` through `F-05` incorporating `CR-LAB7-01` Tiered Pricing).
* **Release verdict:** **NOT READY** for the maintained Sprint 1 scope.

| Check | Status | Owner/action |
|---|---|---|
| Historical pricing | Open | Remediation author to preserve stored totals across all consumers. |
| Automated regression and CI | Pending | Verify corrected implementation, migration and complete suites on the candidate SHA. |
| Contract and release review | Pending | Record dated teammate review and separately substantiate any original review. |
| Main release, deployment and manual smoke | Pending | Record actual merge, revision and synthetic-account checks after approval. |
| Scope and delivery safeguards | Pending final acceptance | Verify no Sprint 3 changes, review migration and secret handling, and reconcile the final written evidence. |

### **D.2 Technical Debt Log (`EVID-D-02`)**

| Debt ID | Description | Impact | Priority | Disposition / Planned Remediation |
|---|---|---|---|---|
| **DEBT-01** | Dual Calculation Logic in Client & Server | Pricing math is implemented in server `pricingEngine.ts` and mirrored in client `CartDrawer.tsx` for instantaneous preview. | Low | Low risk of calculation drift because server authoritatively overrides client totals. Will extract shared isomorphic package in Final Delivery. |
| **DEBT-02** | Legacy pricing representation | Requires a consistent read or preservation-only backfill strategy. | Pending design review | The current repricing behavior is an open defect, tracked separately from the migration design debt. |

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

# Steps before final submission

1. Complete human contract review and substantiate the original review claims and course waiver.
2. Correct historical repricing and execute the planned RED/GREEN, migration and regression checks.
3. Record actual review and CI before any approved release. Keep Sprint 3 separate from R2.
4. Record the deployed Lab 7 version and smoke evidence, reconcile the metrics, and assemble the self-contained PDF with page references.
