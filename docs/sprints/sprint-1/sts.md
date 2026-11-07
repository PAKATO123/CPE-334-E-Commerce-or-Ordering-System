# Software Test Specification (STS) & Definition of Done

---

## 1. Test Strategy & Verification Levels

The Sprint 1 verification strategy ensures comprehensive test coverage across three distinct levels:
1. **Unit Tests (Logic)**: Business rule calculation, price computation, order number generator formatting, input validation.
2. **API & Database Integration Tests (Persistence & Security)**: Session authentication, role-based route blocking, atomic stock reservation, cross-customer isolation, and status state machine transitions.
3. **End-to-End Tests (Playwright / Critical Journeys)**: Complete user workflows through the React frontend, API layer, and PostgreSQL database.

---

## 2. Software Test Specification (STS) Matrix

| Test ID | Linked AC | Level | Preconditions / Input | Test Action / Execution | Expected Result |
|---|---|---|---|---|---|
| **TEST-AUTH-01** | AC-AUTH-01 | Integration | User exists: `customer1@example.com` / `Password123!` | Send `POST /api/auth/login` with valid payload | Status `200 OK`, `connect.sid` cookie returned, session user role `CUSTOMER` |
| **TEST-AUTH-02** | AC-AUTH-02 | Integration | Valid email, invalid password: `WrongPassword!` | Send `POST /api/auth/login` | Status `401 Unauthorized`, error code `INVALID_CREDENTIALS`, no session set |
| **TEST-AUTH-03** | AC-AUTH-03 | Integration | Active authenticated session | Send `POST /api/auth/logout` | Status `200 OK`, session destroyed, cookie cleared |
| **TEST-AUTH-04** | AC-AUTH-04 | Integration | No session cookies provided | Send `POST /api/orders` | Status `401 Unauthorized`, error code `UNAUTHORIZED` |
| **TEST-CAT-01** | AC-CAT-01 | Integration | Seeded database with active TechTent devices | Send `GET /api/products` | Status `200 OK`, returns array of active devices (Phones, Tablets, TVs, etc.) with SKUs, names, prices, and stock |
| **TEST-CAT-02** | AC-CAT-02 | Integration | Product exists with `isActive = false` | Send `GET /api/products` | Inactive product is not present in returned array |
| **TEST-CAT-03** | AC-CAT-03 | E2E / UI | Limited Phone has `stockQuantity = 0` | Open `/` catalog in browser | Card displays "Out of Stock" badge, add button is disabled |
| **TEST-ORD-01** | AC-ORD-01 | Integration | Customer authenticated, devices with stock available | Send `POST /api/orders` with 2 items | Status `201 Created`, order record saved with status `PENDING`, correct total computed |
| **TEST-ORD-02** | AC-ORD-02 | Integration | Keyboard stock = 15, order quantity = 2 | Send `POST /api/orders` with quantity 2 | Order created; subsequent product query confirms stock is now 13 |
| **TEST-ORD-03** | AC-ORD-03 | Unit | Order placed on 2026-11-01 | Execute order number generator | Generates string matching regex `^ORD-\d{8}-\d{4}$` |
| **TEST-ORD-04** | AC-ORD-04 | Integration | Customer 1 has 2 orders, Customer 2 has 1 order | Authenticate as Customer 1, `GET /api/orders` | Returns only Customer 1's 2 orders |
| **TEST-ORD-05** | AC-ORD-05 | Integration | Order placed with unit price $899.00; catalog price later updated to $950.00 | Retrieve order receipt `GET /api/orders/:id` | Receipt line item unit price remains exactly $899.00 (historic price preserved) |
| **TEST-BR-01** | AC-BR-01 | Integration | Client sends `POST /api/orders` with manipulated `"unitPrice": 0.01` and `"totalAmount": 0.02` | Execute order creation request | Server ignores client prices, calculates totals authoritatively from DB records |
| **TEST-BR-02** | AC-BR-02 | Integration | Pro Phone priced at $899.00 in DB | Send `POST /api/orders` | `OrderItem.unitPrice` in database is `899.00` |
| **TEST-BR-03** | AC-BR-03 | Integration | Tablet has stock = 2; order requests quantity = 5 | Send `POST /api/orders` | Status `409 Conflict`, error `INSUFFICIENT_STOCK`, stock remains unchanged at 2 |
| **TEST-BR-04** | AC-BR-04 | Unit / API | Order payload contains quantity = 0 or -1 | Send `POST /api/orders` | Status `400 Bad Request`, error `INVALID_QUANTITY` |
| **TEST-SEC-01** | AC-SEC-01 | Integration | Customer 1 logged in; order #99 belongs to Customer 2 | Send `GET /api/orders/99` | Status `403 Forbidden` (or 404), zero order details exposed |
| **TEST-SEC-02** | AC-SEC-02 | Integration | Customer role logged in | Send `GET /api/operator/orders` or `PATCH /api/operator/orders/:id/status` | Status `403 Forbidden`, error `FORBIDDEN` |
| **TEST-OP-01** | AC-OP-01 | Integration | Operator authenticated; orders across customers/statuses exist | Send `GET /api/operator/orders`; repeat with each status filter | Status `200 OK`; no filter returns all statuses, selected filter returns only matching orders, newest first |
| **TEST-OP-02** | AC-OP-02 | Integration | Operator authenticated; order status = `PENDING` | Send `PATCH /api/operator/orders/:id/status` with `{"status":"ACCEPTED"}` | Status `200 OK`, order status updated to `ACCEPTED` in database |
| **TEST-OP-03** | AC-OP-03 | Integration | Order #42 is `PENDING` with 1 Smart TV reserved; TV stock = 4 | Operator sends `PATCH` with `{"status":"REJECTED"}` | Status `200 OK`, order marked `REJECTED`, TV stock restored to 5 |
| **TEST-BR-05** | BR-06 | Integration | Order is already `ACCEPTED` or `REJECTED` | Operator attempts either valid terminal target | Status `409 ORDER_ALREADY_PROCESSED`, status/stock unchanged; invalid target `PENDING` is separately rejected with `400 INVALID_STATUS` |
| **TEST-E2E-01** | Critical Flow | E2E | Seeded database, browser running | Customer logs in, adds Charger and Keyboard to cart, submits order, checks history receipt | Order created, persists in DB, receipt shows correct line items and totals |
| **TEST-E2E-02** | Critical Flow | E2E | Pending order in queue | Operator logs in, opens Operator Queue, reviews order, clicks "Accept Order" | Order badge updates to "Accepted" live; customer view reflects update |

---

## 3. Product Definition of Done (DoD)

A Sprint 1 increment is formally **DONE** only when all of the following engineering conditions are satisfied:

1. **Contract Adherence**: All five Sprint 1 feature contracts (`F-01` through `F-05`) and their corresponding acceptance criteria are fully implemented.
2. **Authoritative Calculation & Atomic Persistence**: Business rules `BR-01`, `BR-02`, and `BR-03` are verified with automated tests demonstrating zero client price tampering and complete transactional rollback on failure.
3. **Automated Test Verification**:
   - All unit, integration, and security tests pass locally with 100% success (`npm test` in `server` and `client`).
   - Automated end-to-end smoke tests run cleanly via Playwright.
4. **Peer Review & Integration**:
   - All work implemented on feature branches branched from sprint staging.
   - Every pull request receives a substantive peer review by the teammate before merging into staging.
   - Sprint staging release PR reviewed and merged into `main`.
5. **Reproducibility**:
   - The repository can be cloned afresh, migrated, seeded, built, and executed following the instructions in `README.md` without undocumented manual tweaks.
6. **Documentation & Deliverable Readiness**:
   - Parts A through F documents (`docs/srs.md`, `docs/features.md`, `docs/traceability.md`, `docs/system-sds.md`, `docs/sprints/plan.md`, `docs/sprints/sprint-1/`) are complete, formatted, and ready for compilation into the Deliverable 1 PDF.

## 4. Feature 5 executable verification and results

The Feature 5 test increment has been executed. It does not establish every
Sprint 1 Definition of Done condition above; browser E2E and manual checks remain.

| Suite | Test file(s) | Passed | Failed | Skipped |
|---|---|---:|---:|---:|
| Backend F-01 through F-05 integration/regression | `server/tests/{auth,products,orders,operator-orders,health}.test.ts` | 93 | 0 | 0 |
| Backend database-free validation, safety and retry unit tests | `server/tests/unit/*.test.ts` | 48 | 0 | 0 |
| Frontend regression and operator interaction/access/API tests | `client/tests/*.test.tsx` | 41 | 0 | 0 |

Total: **182 distinct passing tests**. The 47 F-05 integration cases passed in a
separate focused run and are already included in the 93. Both TypeScript/build
commands passed. Expected negative-case logs, including the injected rollback
failure, did not represent failed tests.

### Coverage of fulfillment guarantees

- Both operator and administrator can list and process orders; anonymous and customer requests are denied.
- All/individual status filters, malformed filters, safe summaries and newest-first ordering are checked.
- Account deactivation, post-login role changes and newly imposed password policy are checked.
- Acceptance leaves stock unchanged; rejection restores every reserved quantity, including inactive products.
- Valid terminal targets on terminal orders receive 409; malformed targets/IDs receive 400; missing orders receive 404.
- Two HTTP requests are gated at entry to real Prisma transactions. Competing reject/reject, accept/reject and accept/accept requests yield one 200 and one 409, with stock matching the winner.
- Failure is injected on the second inventory restoration inside a real transaction. The first stock update and status/timestamp change are confirmed rolled back.
- Checkout/catalog/history/receipt integration preserves prices, updated statuses on retrieval, operator/admin receipt access and cross-customer isolation.
- Frontend coverage includes duplicate-click prevention, rejection confirmation/cancellation, conflict refresh, stale-response protection, processing-success versus refresh-failure feedback, receipt return filters and real application route guards.

### Execution safety

See [the disposable database instructions](f05-test-environment.md) and [the complete test coverage & results table](test-coverage-results.md). Plain backend
`npm test` refuses to run without an explicit allowlisted test URL and opt-in.
The disabled-opt-in dry run intentionally exited before collection, not as a
failed application test. Worker setup and the Prisma factory enforce the target;
global setup also checks the actual PostgreSQL database/user identity.

Unit and frontend suites are database-free. Integration/regression suites must
use only the dedicated temporary container, because inherited tests reset shared
demo accounts and delete orders. The test container was removed after execution.

### Remaining verification limits

- No browser E2E suite, responsive viewport inspection, print preview or native dialog keyboard-trapping verification was executed.
- Mocked retry tests cover the bounded P2034 retry path; an actual PostgreSQL deadlock was not deliberately induced.
- Passing fulfillment concurrency tests do not verify or repair the inherited concurrent customer-checkout stock and order-reference races.
