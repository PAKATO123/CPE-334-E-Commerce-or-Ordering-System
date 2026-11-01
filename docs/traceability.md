# Requirements to Feature & Sprint Traceability Matrix
## CPE 334 — TechTent Everyday Electronics Ordering System
**Document Version**: 1.1.0 | **Date**: November 2026

### Team Information
> **Fill in the student details below:**
- **Student 1**: `Pattarapon Sribuathong 67070503434`
- **Student 2**: `[FILL IN: Student 2 Full Name — Student ID]`
- **Repository URL**: `https://github.com/PAKATO123/CPE-334-E-Commerce-or-Ordering-System.git`
- **Submitted Release Tag / Commit**: `[FILL IN: Release Tag / Commit SHA]`

---

## 1. Traceability Overview

This matrix establishes bidirectional traceability between system requirements (FR, BR, NFR), assigned features, target sprints, acceptance criteria (AC), and executable test specifications (STS).

---

## 2. Requirements Traceability Matrix

| Req ID | Requirement Description | Allocated Feature | Sprint | Acceptance Criteria (AC) | Software Test Spec (STS) |
|---|---|---|---|---|---|
| **FR-01** | Active catalog listing with everyday tech & stock | F-02 Catalog Browsing | Sprint 1 | AC-CAT-01, AC-CAT-02 | TEST-CAT-01, TEST-CAT-02 |
| **FR-02** | Real-time stock display & out-of-stock badge | F-02 Catalog Browsing | Sprint 1 | AC-CAT-03 | TEST-CAT-03 |
| **FR-03** | Multi-item cart construction with quantity | F-03 Order Assembly | Sprint 1 | AC-ORD-01 | TEST-ORD-01 |
| **FR-04** | Atomic order persistence with PENDING status | F-03 Order Assembly | Sprint 1 | AC-ORD-02 | TEST-ORD-02 |
| **FR-05** | Unique order reference generation (`ORD-...`) | F-03 Order Assembly | Sprint 1 | AC-ORD-03 | TEST-ORD-03 |
| **FR-06** | Chronological customer order history list | F-04 Order Details | Sprint 1 | AC-ORD-04 | TEST-ORD-04 |
| **FR-07** | Itemized order receipt with preserved prices | F-04 Order Details | Sprint 1 | AC-ORD-05 | TEST-ORD-05 |
| **FR-08** | Operator operational queue with status filters | F-05 Operator Queue | Sprint 1 | AC-OP-01 | TEST-OP-01 |
| **FR-09** | Operator order acceptance (`PENDING` ➔ `ACCEPTED`) | F-05 Operator Queue | Sprint 1 | AC-OP-02 | TEST-OP-02 |
| **FR-10** | Operator order rejection and stock restoration | F-05 Operator Queue | Sprint 1 | AC-OP-03 | TEST-OP-03 |
| **BR-01** | Authoritative backend price & total calculation | F-03 Order Assembly | Sprint 1 | AC-BR-01 | TEST-BR-01 (API) |
| **BR-02** | Historic price preservation at time of order | F-03 / F-04 | Sprint 1 | AC-BR-02 | TEST-BR-02 (API/DB) |
| **BR-03** | Stock availability & positive quantity validation | F-03 Order Assembly | Sprint 1 | AC-BR-03, AC-BR-04 | TEST-BR-03, TEST-BR-04 |
| **BR-04** | Customer order data isolation (prevent cross-access) | F-04 Order Details | Sprint 1 | AC-SEC-01 | TEST-SEC-01 (API) |
| **BR-05** | Operator endpoint role authorization (`403 Forbidden`) | F-05 Operator Queue | Sprint 1 | AC-SEC-02 | TEST-SEC-02 (API) |
| **BR-06** | Order status transition validation | F-05 Operator Queue | Sprint 1 | AC-BR-05 | TEST-BR-05 (API) |
| **NFR-01**| Session auth, password hashing & route protection | F-01 Authentication | Sprint 1 | AC-AUTH-01, AC-AUTH-02 | TEST-AUTH-01, TEST-AUTH-02 |
| **NFR-02**| Atomic transaction integrity & DB constraints | F-03 Order Assembly | Sprint 1 | AC-NFR-01 | TEST-NFR-01 (DB Integration) |
| **NFR-03**| API response time < 200ms under local conditions | All Features | Sprint 1 | AC-NFR-02 | TEST-NFR-02 (Performance) |
| **NFR-04**| Responsive UI & accessible form labels | UI Views | Sprint 1 | AC-NFR-03 | TEST-NFR-03 (E2E / UI) |
| **NFR-05**| Automated test verification and TDD evidence | Test Suites | Sprint 1 | AC-NFR-04 | TEST-NFR-04 (Vitest Run) |
| **FR-11** | Catalog management and component restocking | F-06 Catalog Mgmt | Sprint 2 | Deferred to Sprint 2 | Deferred to Sprint 2 |
| **FR-12** | Customer order cancellation and stock release | F-07 Cancellation | Sprint 2 | Deferred to Sprint 2 | Deferred to Sprint 2 |
| **FR-13** | Simulated payment status state transitions | F-08 Payment States | Sprint 2 | Deferred to Sprint 2 | Deferred to Sprint 2 |
| **FR-14** | Sales summary and fulfillment turnaround reports | F-09 Sales Reports | Sprint 3 | Deferred to Sprint 3 | Deferred to Sprint 3 |
