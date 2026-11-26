# Sprint 3 Change & Defect Register

---

## 1. Overview & Policy

This register tracks changes, adjustments, UAT findings, and maintenance items originating from Sprint 2 evaluation and Sprint 3 implementation. Each entry records the defect/change ID, source, affected requirement/feature, decision, resolution status, and re-test outcome.

---

## 2. Change & Defect Log

| Entry ID | Source | Affected Req / Component | Description of Finding or Scope Change | Accepted Decision / Action Taken | Resolved Status | Target Release / Version | Re-test Outcome |
|---|---|---|---|---|:---:|---|---|
| **CR-S3-01** | Sprint 2 UAT | `F-08` / Order Details UI | Customer cancellation success banner previously mentioned internal stock restoral mechanics. | Removed warehouse inventory restoral jargon from customer-facing notification. | **RESOLVED** | Sprint 2 (`782a964`) | Verified with unit & component tests. |
| **CR-S3-02** | Sprint 2 Review | `F-08` / Order Confirmation | "Order Placed Successfully!" modal navigated to generic order history list. | Updated modal action to "View Order Details" navigating directly to `/orders/:id`. | **RESOLVED** | Sprint 2 (`782a964`) | Verified in `payment-lifecycle.test.tsx`. |
| **CR-S3-03** | Course Spec | `FR-14` / Reporting | Stakeholder brief Theme 4 requires order/sales summaries and fulfillment metrics. | Formalized `F-09` feature contract and API specifications in Sprint 3 baseline. | **IN PROGRESS** | Sprint 3 (`F-09`) | Pending implementation & verification. |
| **CR-S3-04** | Lab 5 Deployment | `NFR-01` / Security | Public login endpoint lacked rate limiting against brute-force attacks. | Implemented `F-10` rate limiting (10 attempts / 15 min) on `POST /api/auth/login`. | **IN PROGRESS** | Sprint 3 (`F-10`) | Pending implementation & verification. |
| **CR-S3-05** | Production Readiness | `NFR-01` / Error Handling | Express error handlers in development mode could leak internal database error messages. | Implemented centralized error envelope sanitizer suppressing internal traces in production. | **IN PROGRESS** | Sprint 3 (`F-10`) | Pending implementation & verification. |
