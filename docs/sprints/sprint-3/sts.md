# Sprint 3 Software Test Specification (STS) & Verification Matrix

---

## 1. Test Strategy & Verification Levels (Sprint 3)

Sprint 3 verification focuses on:
1. **Reporting Aggregation Accuracy**: Verifying SQL aggregate functions (`SUM`, `COUNT`, `AVG`) across varying order statuses, payment statuses, and date boundaries.
2. **Turnaround Duration Calculations**: Verifying mathematical timestamp calculations (`updatedAt - createdAt`) for completed orders.
3. **Role-Based Security & Endpoint Guards**: Ensuring reporting endpoints are completely inaccessible to unauthenticated users and customers (`401` / `403`).
4. **Rate Limiting & Threat Mitigation**: Verifying that excessive rapid authentication calls are throttled with `429 Too Many Requests` without impeding regular catalog queries.
5. **Full System Regression Suite**: Executing the cumulative automated regression suite spanning Sprint 1, Sprint 2, and Sprint 3 to guarantee zero regressions before final release.

---

## 2. Software Test Specification (STS) Matrix

| Test ID | Linked Feature & AC | Test Level | Preconditions / Setup | Execution / Input Payload | Expected Observable Outcome |
|---|---|---|---|---|---|
| **TEST-REP-01** | F-09 / AC-REP-01, AC-REP-02 | Unit / Integration | Seeded database with orders #1 ($100, PENDING), #2 ($200, SHIPPED), #3 ($50, CANCELLED) | Operator sends `GET /api/reports/sales-summary` | Status `200 OK`, `totalRevenue = "300.00"` (excluding cancelled), `totalOrders = 3`, `averageOrderValue = "150.00"` |
| **TEST-REP-02** | F-09 / AC-REP-03 | Integration | Order A created 2026-11-01; Order B created 2026-11-15; Order C created 2026-11-25 | Operator sends `GET /api/reports/sales-summary?startDate=2026-11-10T00:00:00.000Z&endDate=2026-11-20T23:59:59.999Z` | Status `200 OK`; only Order B is included in totals and counts |
| **TEST-REP-03** | F-09 / AC-REP-04 | Unit / Integration | Orders seeded across multiple statuses: 2 PENDING, 3 ACCEPTED, 1 PACKED, 4 SHIPPED, 1 CANCELLED, 1 REJECTED | Operator sends `GET /api/reports/sales-summary` | `statusCounts` accurately reflects: `{ PENDING: 2, ACCEPTED: 3, PACKED: 1, SHIPPED: 4, CANCELLED: 1, REJECTED: 1 }` |
| **TEST-REP-04** | F-09 / AC-REP-05 | Unit / Integration | Orders seeded with payment statuses: 2 UNPAID, 8 PAID, 1 REFUNDED, 1 VOID | Operator sends `GET /api/reports/sales-summary` | `paymentStatusCounts` accurately reflects `{ UNPAID: 2, PAID: 8, REFUNDED: 1, VOID: 1 }` |
| **TEST-REP-05** | F-09 / AC-REP-06 | Unit / Integration | Two SHIPPED orders: Order 1 took 2 hours (120 min), Order 2 took 4 hours (240 min) | Operator sends `GET /api/reports/turnaround` | Status `200 OK`, `shippedOrderCount = 2`, `averageTurnaroundMinutes = 180`, `averageTurnaroundHours = 3` |
| **TEST-REP-06** | F-09 / AC-REP-07 | Security | Customer user session active | Customer sends `GET /api/reports/sales-summary` | Status `403 Forbidden`, error code `FORBIDDEN` |
| **TEST-REP-07** | F-09 / AC-REP-07 | Security | Unauthenticated request (no session cookie) | Visitor sends `GET /api/reports/sales-summary` | Status `401 Unauthorized`, error code `UNAUTHORIZED` |
| **TEST-HARD-01** | F-10 / AC-HARD-01, AC-HARD-02 | Security / Rate Limit | Single IP client | Send 11 rapid requests to `POST /api/auth/login` | Requests 1–10 proceed; request 11 returns `429 Too Many Requests`, error code `TOO_MANY_REQUESTS`, `Retry-After` header present |
| **TEST-HARD-02** | F-10 / AC-HARD-03 | Security / Scope | Single IP client rate-limited on `/api/auth/login` | Send request to `GET /api/products` or `GET /api/health` | Status `200 OK`; non-auth endpoints remain completely accessible |
| **TEST-HARD-03** | F-10 / AC-HARD-04 | Security / Sanitizer | `NODE_ENV = "production"` simulated | Trigger an internal database constraint or runtime exception | Status `500 Internal Server Error`, returns sanitized `{ error: { code: "INTERNAL_ERROR", message: "..." } }`, zero raw SQL text or stack traces leaked |
| **TEST-HARD-04** | F-10 / AC-HARD-05 | Integration / Probes | Database online vs offline | Send `GET /api/ready` | Returns `200 OK` `{ "status": "ok", "database": "connected" }` when up; `503 Service Unavailable` when disconnected |
| **TEST-REG-S123** | Complete Baseline | Regression Suite | All services online locally or in CI | Run full Vitest unit, integration, and component suites | 100% of tests pass across Sprint 1, Sprint 2, and Sprint 3 without regression |

---

## 3. Test File Mapping

- **Reporting Service Unit Tests**: `server/tests/unit/reports.test.ts`
- **Reporting API Integration Tests**: `server/tests/reports.test.ts`
- **Frontend Dashboard Tests**: `client/tests/reports.test.tsx`
- **Rate Limiting & Sanitization Tests**: `server/tests/unit/rate-limit.test.ts`
