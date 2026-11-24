# Sprint 1 Continuity & Change Register (Part A)

---

## 1. Accepted Sprint 1 Baseline & Continuous Domain Journey

### 1.1 Accepted Sprint 1 Immutable Tag & Commit
- **Sprint 1 Accepted Release Tag**: `R1` (Git Commit SHA: `9ff3341`)
- **Integrated Lab 5 Deployment Tag**: `lab5` (Git Commit SHA: `e17f136`)
- **Main Line Base for Sprint 2**: `1badd6c` (Branch: `sprint-2-staging` / `S2-00/Docs`)
- **Cloud Run Deployment URL**: [https://techtent-693107188088.asia-southeast1.run.app](https://techtent-693107188088.asia-southeast1.run.app)

### 1.2 Original Critical Domain Journey Continuity
The core vertical slice verified in Sprint 1 remains fully functional and protected against regressions across all subsequent deployments:
1. **Customer Authentication**: Customer logs in via `POST /api/auth/login` (`customer1@example.com` / `Password123!`), receiving an authenticated HTTP-only session cookie (`connect.sid`).
2. **Catalog Browsing & Real-time Stock**: Customer queries `GET /api/products`, viewing authoritative consumer electronics devices (Smartphones, Tablets, Smart TVs, Keyboards, Chargers) with live stock counts and out-of-stock badges (`F-02`).
3. **Multi-Item Order Assembly & Atomic Reservation**: Customer posts multi-item checkout to `POST /api/orders`. The backend validates positive quantities, ignores any client-supplied prices, calculates line subtotals and grand totals authoritatively from active catalog database records, creates `Order` with `status: PENDING`, and decrements inventory atomically within `prisma.$transaction` (`F-03`).
4. **Order History & Receipt Isolation**: Customer inspects receipts at `GET /api/orders/:id`, verifying preserved historic purchase unit prices (`BR-02`) and cross-customer access isolation (`BR-04`).
5. **Operator Queue & Fulfillment**: Operator logs in via `operator1@example.com`, accesses `GET /api/operator/orders`, inspects order line items, and accepts (`ACCEPTED`) or rejects (`REJECTED`) the order. Rejections atomically restore reserved inventory back to PostgreSQL (`F-05`).

---

## 2. Comprehensive Change & Defect Register (Labs 5–7 Findings)

The table below records all deployment, cross-team UAT, and maintenance findings gathered across Labs 5, 6, and 7, their root-cause analysis, accepted decisions, and verification re-test outcomes.

| Defect / Change ID | Source | Affected Requirement / Feature | Finding & Root Cause | Accepted Decision & Remediation | Resolved / Remaining Status | Fix / Change Commit & Release | Re-test Outcome |
|---|---|---|---|---|---|---|---|
| **CR-01** | Lab 5 Deployment | NFR-01, Cloud Run Ingress | Unauthenticated requests to public Cloud Run URL returned `403 Forbidden` for `/`, `/api/health`, and `/api/ready` because the Cloud Run service had not bound `roles/run.invoker` to `allUsers`. | Granted `roles/run.invoker` to `allUsers` on Cloud Run service `techtent`. Re-enabled public access to root and health checks while retaining session cookie authentication for protected API routes. | **RESOLVED** | `docs/labs/lab-05/deployment.md`, commit `e17f136` | `curl -f https://techtent-693107188088.asia-southeast1.run.app/api/ready` returns HTTP 200 with `{ "status": "ready" }`. |
| **CR-02** | Lab 5 Deployment | Seed / Testing Foundation | Cloud SQL migration job in production required explicit seed verification credentials for grading without exposing secrets in source code. | Added Episode 8 one-time demo customer provisioning logic (`feature/episode8-customer-provisioning`), generating deterministic demonstration accounts only when `SEED_DEMO_DATA=true`. | **RESOLVED** | Commit `6c67391`, PR `#46` merged into `main` (`fc2ca1c`) | Verified seed creates demo customer and operator accounts without overwriting existing data. |
| **CR-03** | Sprint 1 Review & Lab 6 UAT | F-02, BR-03 | Starter codebase contained legacy test SKU `SIM-ATOM-FAIL` which caused deliberate simulated checkout failure despite showing positive stock in catalog. | Clarified demonstration nature of `SIM-ATOM-FAIL`; in catalog view, isolated demo item so normal customers interact exclusively with genuine everyday tech SKUs (`PHON-PRO-256`, `TAB-ULTRA-11`, etc.). | **RESOLVED** | Documented in `README.md` and integration review | Public catalog lists genuine devices cleanly; intentional failure retained only for automated rollback test suite. |
| **CR-04** | Lab 6 Cross-Team UAT | F-04, FR-12, BR-08 | UAT testers noted that customers had no capability to cancel accidentally submitted orders, requiring manual operator intervention. | Formulated requirement **FR-12** and business rule **BR-08**: Customer Order Cancellation with automated atomic stock restoral for `PENDING` orders. Allocated to **Sprint 2 (F-07)**. | **IN PROGRESS (Sprint 2)** | Contract elaborated in `docs/sprints/sprint-2/feature-specs.md`; implementation on `F-07/CustomerCancellation` | Pending implementation and verification in Sprint 2 candidate. |
| **CR-05** | Lab 6 Cross-Team UAT | F-03, F-05, FR-13 | Testers requested visual differentiation between "Order Received / Pending" and "Paid", noting that real retailers distinguish payment confirmation from warehouse packaging. | Formulated requirement **FR-13** and business rules **BR-09, BR-10**: Simulated Payment State Machine (`paymentStatus`: `UNPAID`, `PAID`, `REFUNDED`) and extended fulfillment states (`ACCEPTED`, `PACKED`, `SHIPPED`). Allocated to **Sprint 2 (F-08)**. | **IN PROGRESS (Sprint 2)** | Contract elaborated in `docs/sprints/sprint-2/feature-specs.md`; implementation on `F-08/PaymentStateMachine` | Pending implementation and verification in Sprint 2 candidate. |
| **CR-06** | Lab 7 Maintenance & Architecture | F-06, FR-11, BR-07 | Catalog product prices and warehouse stock quantities were hardcoded in database seed with no UI/API mechanism for store managers to restock or introduce new devices. | Formulated requirement **FR-11** and business rule **BR-07**: Operator/Admin Catalog Curation & Atomic Inventory Restocking. Disallows hard deletion to preserve historic `OrderItem` foreign keys; provides soft toggle (`isActive`) and atomic restock endpoint. Allocated to **Sprint 2 (F-06)**. | **IN PROGRESS (Sprint 2)** | Contract elaborated in `docs/sprints/sprint-2/feature-specs.md`; implementation on `F-06/CatalogManagement` | Pending implementation and verification in Sprint 2 candidate. |
| **CR-07** | Lab 7 Maintenance & Code Quality | NFR-02, Error Handling | Backend error responses across older endpoints used inconsistent JSON structures (some returned `{ message: string }`, others `{ error: { code, message } }`). | Standardized global error contract: all API error responses return structured envelope `{ error: { code: string, message: string, details?: any } }`. Implemented centralized error handler middleware. | **RESOLVED** | Standardized across Sprint 2 contracts and error middleware | 100% of negative API test assertions check `{ error: { code, message } }`. |

---

## 3. Approved Baseline Revisions & Rationale

1. **Revision REV-01 (Dual-Status State Architecture)**:
   - *Previous Baseline*: Single order status attribute (`status: PENDING | ACCEPTED | REJECTED`).
   - *Revised Baseline*: Separated fulfillment status (`Order.status: PENDING | ACCEPTED | PACKED | SHIPPED | CANCELLED | REJECTED`) and payment status (`Order.paymentStatus: UNPAID | PAID | REFUNDED | VOID`).
   - *Approved Rationale*: Prevents state proliferation, models real e-commerce domain accurately, and allows customers to pay before or after operator acceptance while guaranteeing atomic refund on cancellation.
2. **Revision REV-02 (Soft Deletion for Catalog Management)**:
   - *Previous Baseline*: Catalog was static seed data; no deletion policy specified.
   - *Revised Baseline*: Disallow hard `DELETE` queries on products. Require soft-deletion via `isActive: false`.
   - *Approved Rationale*: Referential integrity in relational databases requires that historical order line items (`OrderItem`) maintain valid product links for customer receipts and sales audits.
3. **Revision REV-03 (Customer Cancellation Window)**:
   - *Previous Baseline*: Only operators could transition orders out of `PENDING` via accept/reject.
   - *Revised Baseline*: Customers can cancel orders while `status === 'PENDING'`, triggering atomic stock restoral and payment refund. Once `ACCEPTED`, cancellation is blocked with `409 Conflict`.
   - *Approved Rationale*: Aligns with consumer protection standards and eliminates customer anxiety while preserving operational certainty once warehouse fulfillment begins.
