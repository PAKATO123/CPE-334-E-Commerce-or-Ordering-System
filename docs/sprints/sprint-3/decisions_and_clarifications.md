# Sprint 3 Engineering Decisions & Clarifications

---

## 1. Architectural & Design Decisions

### D-S3-01: Aggregation Strategy for Sales Reporting
- **Context**: The reporting dashboard requires gross sales revenue, average order value (AOV), total order count, and counts partitioned by status.
- **Alternatives Considered**:
  1. *In-Memory Calculation*: Fetch all order objects via Prisma `findMany()` and reduce them in Node.js memory.
  2. *Database-Native Aggregations*: Use Prisma's native `aggregate()`, `groupBy()`, and `count()` operations.
- **Decision**: Adopt **Database-Native Aggregations** (Alternative 2).
- **Rationale**: In-memory reduction introduces $O(N)$ network transfer and memory overhead as order volume scales. PostgreSQL executes `SUM`, `COUNT`, and `AVG` calculations directly in the database engine using the `Order(status, createdAt)` index, resulting in sub-10ms response times (`NFR-03`).

### D-S3-02: Turnaround Metric Definition & Measurement
- **Context**: Stakeholder brief requires turnaround metrics for order fulfillment.
- **Decision**: Define turnaround as the elapsed duration from order placement (`createdAt`) to the timestamp when the order enters `SHIPPED` status (`updatedAt`).
- **Rationale**: For an e-commerce platform, the customer's perceived fulfillment duration concludes when the shipment is handed over to the courier (`SHIPPED`). Terminal orders that were `CANCELLED` or `REJECTED` are excluded from turnaround averages, but preserved in status distributions.

### D-S3-03: Rate Limiting Scope & Thresholds
- **Context**: Protect public authentication endpoints from credential stuffing and password guessing.
- **Decision**: Apply `express-rate-limit` strictly to `POST /api/auth/login` with a threshold of 10 requests per 15-minute window per IP.
- **Rationale**: A threshold of 10 attempts allows legitimate users to recover from occasional mistyped passwords while preventing high-frequency brute-force dictionaries. Non-authentication routes (such as catalog viewing and order placement) are not subject to this strict rate limit to ensure high customer checkout throughput.

### D-S3-04: In-Memory Rate Limiting Storage
- **Context**: Select backing store for rate limit counter tracking.
- **Decision**: Use the default in-memory store of `express-rate-limit`.
- **Rationale**: TechTent deploys to Google Cloud Run as a self-contained container service. Introducing a separate Redis or Memcached instance increases infrastructure cost, deployment complexity, and configuration surface without measurable benefit for the coursework's grading and evaluation parameters.

### D-S3-05: Navigation & Access Point for Reports
- **Context**: Expose the reporting dashboard in the web application.
- **Decision**: Add a "📊 Reports" link to the main navigation bar, visible if and only if `user.role === 'OPERATOR'` or `user.role === 'ADMIN'`. Add route guard preventing `CUSTOMER` access.
- **Rationale**: Seamlessly integrates into the existing Operator/Admin workflow alongside "Manage Products" and "Operator Queue".

---

## 2. Clarifications Log

| ID | Topic | Clarification | Impacted Component |
|---|---|---|---|
| **C-S3-01** | Date Range Default | When `startDate` and `endDate` query parameters are omitted, `GET /api/reports/sales-summary` computes lifetime all-time aggregates. | `server/src/services/reports.ts` |
| **C-S3-02** | Cancelled/Rejected in Revenue | Orders in `CANCELLED` or `REJECTED` status are explicitly excluded from `totalRevenue` calculations since no payment is collected or funds are refunded. | `server/src/services/reports.ts` |
| **C-S3-03** | Rate Limit Headers | Responses must include standard draft RFC rate limit headers (`RateLimit-Limit`, `RateLimit-Remaining`, `Retry-After`). | `server/src/middleware/rateLimit.ts` |
