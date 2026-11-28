# Sprint 3 Engineering Implementation Plan

---

## 1. Sprint 3 Executive Summary & Objectives

- **Sprint Checkpoint**: Deliverable 2 (29 November 2026, 70 pts) & Final Project Delivery (13 December 2026, 100 pts)
- **Sprint Goal**: Deliver the final missing capabilities from the course stakeholder brief—**Operational Reporting & Sales Summaries (`F-09`)** and **Production Security Hardening & Rate Limiting (`F-10`)**—while establishing complete requirements and test traceability, running regression suites across all three sprints, and preparing deployment-verified releases.
- **Key Milestones**:
  - Deliverable 2 Part C Checkpoint: Formal Sprint 3 contracts and at least one verified working domain workflow (`F-09` backend reporting service & API).
  - Final Release Checkpoint: Complete frontend reporting dashboard, production rate limiting, zero-regression full-stack automated tests, live GCP Cloud Run deployment, and final submission artifacts.

---

## 2. Feature Inventory & Allocation

| Feature ID | Feature Name | Linked Requirements | Key Deliverables | Verification Strategy |
|---|---|---|---|---|
| **F-09** | Sales Reports & Operational Metrics | `FR-14`, `BR-05`, `NFR-01`, `NFR-03` | • `GET /api/reports/sales-summary`<br>• `GET /api/reports/turnaround`<br>• `OperatorReportsPage.tsx` UI | Unit, API integration & component tests (`reports.test.ts`, `reports.test.tsx`) |
| **F-10** | Production Hardening & Sanitization | `FR-15`, `NFR-01`, `NFR-03`, `NFR-05` | • `express-rate-limit` on login<br>• Centralized Error Sanitizer<br>• Deep `/api/ready` probe | Unit, rate limit stress & security tests (`rate-limit.test.ts`) |

---

## 3. Git Branching & Progression Strategy

```mermaid
flowchart TD
    S2["sprint-2-staging (All Sprint 2 Features)"] --> S3Docs["S3-00/Docs (Contracts & Plan)"]
    S3Docs --> F09["F-09/OperationalReports (Sales & Turnaround Metrics)"]
    F09 --> F10["F-10/ProductionHardening (Rate Limit & Error Sanitization)"]
    F10 --> S3Staging["sprint-3-staging (Integrated Candidate)"]
    S3Staging --> Main["main (GCP Cloud Run Production Release)"]
```

---

## 4. Phase-by-Phase Implementation & Verification Plan

### Phase 1: `S3-00/Docs` — Contracts, Test Specs & Architecture Baseline
- **Goal**: Lock in versioned contracts, Acceptance Criteria, STS test specifications, and architectural designs before writing code.
- **Files Created / Updated**:
  - `docs/sprints/sprint-3/feature-specs.md`: Detailed contracts for `F-09` and `F-10`.
  - `docs/sprints/sprint-3/sts.md`: Software Test Specifications with explicit input/output assertions.
  - `docs/sprints/sprint-3/decisions_and_clarifications.md`: Architectural decisions (aggregation engine, rate limits).
  - `docs/sprints/sprint-3/change-register.md`: Change tracking log.
  - `docs/sprints/sprint-3/implementation-plan.md`: This step-by-step roadmap.
- **Verification Command**:
  ```powershell
  git status -s docs/
  ```

---

### Phase 2: `F-09/OperationalReports` — Reporting Service, API & Dashboard UI
- **Goal**: Implement `FR-14` to aggregate store revenue, volume by status, and fulfillment turnaround metrics.

#### Step 2.1: Backend Reporting Service (`server/src/services/reports.ts`)
- Implement `getSalesSummary(filters?: { startDate?: string; endDate?: string })`:
  - Calculate `totalRevenue`: Sum of `totalAmount` for non-cancelled and non-rejected orders.
  - Calculate `totalOrders`: Count of all matching orders in the period.
  - Calculate `averageOrderValue`: `totalRevenue / validOrderCount` formatted to 2 decimals.
  - Partition counts by fulfillment status (`PENDING`, `ACCEPTED`, `PACKED`, `SHIPPED`, `CANCELLED`, `REJECTED`).
  - Partition counts by payment status (`UNPAID`, `PAID`, `REFUNDED`, `VOID`).
- Implement `getTurnaroundMetrics()`:
  - Query orders in `SHIPPED` status.
  - Compute average turnaround time in hours and minutes: `avg(updatedAt - createdAt)`.
  - Compute min and max turnaround durations.

#### Step 2.2: Backend API Routes (`server/src/routes/reports.ts`)
- Mount endpoints at `/api/reports`:
  - `GET /api/reports/sales-summary`: Guarded by `requireRole(['OPERATOR', 'ADMIN'])`.
  - `GET /api/reports/turnaround`: Guarded by `requireRole(['OPERATOR', 'ADMIN'])`.
- Mount router in `server/src/app.ts`.

#### Step 2.3: Backend Unit & Integration Tests
- `server/tests/unit/reports.test.ts`: Unit test service methods with mocked Prisma aggregates.
- `server/tests/reports.test.ts`: Integration test verifying live database aggregation, role barriers (401/403 for Customer), and date filtering.

#### Step 2.4: Frontend Client API & Dashboard Page
- `client/src/api.ts`: Add `getSalesSummaryApi(startDate?, endDate?)` and `getTurnaroundMetricsApi()`.
- `client/src/pages/OperatorReportsPage.tsx`:
  - Quick filter buttons: Today, Last 7 Days, Last 30 Days, All Time.
  - Metric summary cards: Total Gross Revenue ($), Completed Orders, Average Order Value (AOV), and Average Turnaround Time.
  - Status Breakdown cards with visual percentage bars.
  - Turnaround distribution table.
- `client/src/App.tsx`: Register route `/operator/reports` inside `RoleGuard` (`OPERATOR`, `ADMIN`).
- `client/src/components/layout/Navbar.tsx`: Add "📊 Reports" link for Operators and Admins.
- `client/tests/reports.test.tsx`: Test dashboard rendering, date filtering, and KPI card values.

- **Verification Commands**:
  ```powershell
  npm.cmd --prefix server test -- reports.test.ts
  npm.cmd --prefix client test -- reports.test.tsx
  ```

---

### Phase 3: `F-10/ProductionHardening` — Rate Limiting, Sanitization & Probes
- **Goal**: Implement `FR-15` to secure public attack surfaces and eliminate information leakage.

#### Step 3.1: Login Rate Limiter Middleware (`server/src/middleware/rateLimit.ts`)
- Install `express-rate-limit`.
- Configure `loginRateLimiter`: 10 requests per 15 minutes per IP.
- Return 429 Too Many Requests with code `TOO_MANY_REQUESTS` and `Retry-After` header.
- Apply strictly to `POST /api/auth/login` in `server/src/app.ts`.

#### Step 3.2: Centralized Error Sanitizer
- Enhance global Express error handler in `server/src/app.ts`.
- In non-development mode (`NODE_ENV === 'production'`), sanitize error messages and strip stack traces.

#### Step 3.3: Deep Readiness Probe (`/api/ready`)
- Add `GET /api/ready` executing `prisma.$queryRaw\`SELECT 1\``.
- Return 200 OK `{ "status": "ok", "database": "connected" }` when healthy; 503 when disconnected.

#### Step 3.4: Automated Security Tests (`server/tests/unit/rate-limit.test.ts`)
- Assert 11th request to `/api/auth/login` yields 429.
- Assert `/api/products` and `/api/health` remain accessible under rate limit.
- Assert database errors in production suppress SQL error text.

- **Verification Command**:
  ```powershell
  npm.cmd --prefix server test -- rate-limit.test.ts
  ```

---

### Phase 4: `sprint-3-staging` — Release Candidate Integration & Full Regression
- **Goal**: Integrate all features, execute full regression suite, and verify production builds.
- **Verification Checklist**:
  - [ ] Merge `F-09` and `F-10` into `sprint-3-staging`.
  - [ ] Run complete database-free test suites:
    ```powershell
    npm.cmd --prefix server run test:unit
    npm.cmd --prefix client test
    npm.cmd --prefix server run build
    npm.cmd --prefix client run build
    ```
  - [ ] Run full database integration regression suite across all 3 sprints:
    ```powershell
    $env:TECHTENT_ALLOW_DATABASE_TESTS="1"
    $env:TECHTENT_TEST_DATABASE_URL="postgresql://techtent_test:techtent_test_local_only@127.0.0.1:55435/techtent_test?schema=public"
    npm.cmd --prefix server test
    ```

---

### Phase 5: Production Deployment & Deliverable Documentation
- **Goal**: Deploy the candidate to GCP Cloud Run and generate final submission PDFs.
- **Checklist**:
  - [ ] Open release PR from `sprint-3-staging` into `main`.
  - [ ] GitHub Actions CI/CD automatically deploys to Cloud Run.
  - [ ] Run live post-deployment smoke test on Cloud Run URL.
  - [ ] Generate Deliverable 2 self-contained PDF (covering Sprint 1, complete Sprint 2, and Sprint 3 progress).
  - [ ] Finalize Final Delivery PDF and 10-minute demo video.
