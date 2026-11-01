# Requirements to Feature & Sprint Traceability
## CPE 334 — E-Commerce / Ordering System (Electronics Store)

### Team Information
> **Fill in the student details below:**
- **Student 1**: `[FILL IN: Student 1 Full Name — Student ID]`
- **Student 2**: `[FILL IN: Student 2 Full Name — Student ID]`
- **Repository URL**: `[FILL IN: GitHub Repository URL]`
- **Submitted Release Tag / Commit**: `[FILL IN: Release Tag / Commit SHA]`

---

| Requirement ID | Requirement Description | Allocated Feature | Planned Sprint & Verification |
|---|---|---|---|
| **FR-01** | Active electronics catalog display with availability and prices | F-02 Catalog Browsing | Sprint 1; AC-02 / TEST-CAT-01 |
| **FR-02** | Customer order creation with multi-item selection | F-03 Order Creation | Sprint 1; AC-03 / TEST-ORD-01 |
| **FR-03** | Order retrieval and itemized order breakdown | F-04 Order Details | Sprint 1; AC-04 / TEST-ORD-02 |
| **FR-04** | Operator queue of pending incoming orders | F-05 Operator Queue | Sprint 1; AC-05 / TEST-OP-01 |
| **FR-05** | Operator order acceptance & status transition | F-05 Operator Queue | Sprint 1; AC-06 / TEST-OP-02 |
| **BR-01** | Authoritative backend price and total calculation | F-03 Order Creation | Sprint 1; AC-03 / TEST-BR-01 |
| **BR-02** | Order price preservation on submitted orders | F-03 Order Creation | Sprint 1; AC-03 / TEST-BR-02 |
| **BR-03** | Rejection of invalid quantities and out-of-stock items | F-03 Order Creation | Sprint 1; AC-03 / TEST-BR-03 |
| **BR-04** | Customer order isolation (no cross-access) | F-04 Order Details | Sprint 1; AC-04 / TEST-SEC-01 |
| **BR-05** | Operator/Admin enforcement on operational queue | F-05 Operator Queue | Sprint 1; AC-05 / TEST-SEC-02 |
| **NFR-01**| Session auth, password hashing & route protection | F-01 Authentication | Sprint 1; AC-01 / TEST-AUTH-01 |
| **NFR-02**| Relational schema constraints & data persistence | All Features | Sprints 1–3; Automated DB integration |
| **NFR-03**| Full automated test coverage and execution evidence | All Features | Sprints 1–3; Vitest / Supertest / Playwright |
