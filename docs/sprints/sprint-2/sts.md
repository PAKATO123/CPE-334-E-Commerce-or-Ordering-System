# Sprint 2 Software Test Specification (STS) & Verification Matrix

---

## 1. Test Strategy & Verification Levels (Sprint 2)

Sprint 2 verification expands the TechTent automated test suite across four rigorous levels:
1. **Unit Tests (Business Logic & Validation)**: Input schemas, boundary numerical limits, SKU formatting, and state transition rule engines.
2. **Database Integration Tests (Transactions, Persistence & Concurrency)**: Real PostgreSQL transaction testing with atomic stock increments, rollback injection, and race condition prevention.
3. **Security & Authorization Tests**: Enforcement of RBAC (`CUSTOMER`, `OPERATOR`, `ADMIN`) across all new catalog and payment endpoints.
4. **End-to-End / Component Tests**: Frontend interaction testing covering modals, state badge transitions, and button enablement states.

---

## 2. Software Test Specification (STS) Matrix

| Test ID | Linked Feature & AC | Test Level | Preconditions / Setup | Execution / Input Payload | Expected Observable Outcome |
|---|---|---|---|---|---|
| **TEST-CAT-M01** | F-06 / AC-CAT-MGMT-01 | Integration | Admin session active; SKU `CHG-WIRELESS-15W` does not exist | `POST /api/products` with valid product JSON (price: 39.99, stock: 20) | Status `201 Created`; product persisted in DB with generated ID and timestamps |
| **TEST-CAT-M02** | F-06 / AC-CAT-MGMT-02 | Integration | Product with SKU `PHON-PRO-256` already exists | `POST /api/products` with SKU `PHON-PRO-256` | Status `409 Conflict`, error code `SKU_ALREADY_EXISTS`, zero DB alterations |
| **TEST-CAT-M03** | F-06 / AC-CAT-MGMT-03 | Unit / API | Admin session active | `POST /api/products` with `price = -5.00` and `stockQuantity = -1` | Status `400 Bad Request`, error code `VALIDATION_ERROR` |
| **TEST-CAT-M04** | F-06 / AC-CAT-MGMT-04 | Integration | Active product #1 exists | `PATCH /api/products/1` with `{ "isActive": false }` | Status `200 OK`; product excluded from `GET /api/products`, existing orders unaffected |
| **TEST-CAT-M05** | F-06 / AC-CAT-MGMT-05 | Integration / Concurrency | Product #4 has stock = 10 | `POST /api/products/4/restock` with `{ "quantity": 15 }` | Status `200 OK`, `newStock` = 25, DB reflects 25 |
| **TEST-CAT-M06** | F-06 / AC-CAT-MGMT-06 | Security | Authenticated as `CUSTOMER` | `POST /api/products` or `PATCH /api/products/1` | Status `403 Forbidden`, error code `FORBIDDEN` |
| **TEST-CAN-01** | F-07 / AC-ORD-CAN-01, AC-ORD-CAN-02 | Integration / DB | Customer 1 has order #10 in `PENDING` state reserving 2 Keyboards (stock 13) | Customer 1 sends `POST /api/orders/10/cancel` | Status `200 OK`, order status becomes `CANCELLED`, `cancelledAt` populated, Keyboard stock restored to 15 |
| **TEST-CAN-02** | F-07 / AC-ORD-CAN-03 | Integration / State Guard | Order #11 was accepted by operator (`status = ACCEPTED`) | Customer 1 sends `POST /api/orders/11/cancel` | Status `409 Conflict`, error code `ORDER_ALREADY_PROCESSED`, order remains `ACCEPTED`, stock unchanged |
| **TEST-CAN-03** | F-07 / AC-ORD-CAN-04 | Security | Customer 2 authenticated; Order #10 belongs to Customer 1 | Customer 2 sends `POST /api/orders/10/cancel` | Status `403 Forbidden`, order status unchanged |
| **TEST-CAN-04** | F-07 / AC-ORD-CAN-06 | Concurrency / DB | Order #12 is `PENDING`; two simultaneous cancel requests sent | Send parallel `POST /api/orders/12/cancel` | Exactly one returns `200 OK`; second returns `409 Conflict`; stock restored exactly once |
| **TEST-CAN-05** | F-07 / AC-ORD-CAN-05 | Integration / State Machine | Order #14 is `PENDING` and `paymentStatus = PAID` | Customer sends `POST /api/orders/14/cancel` | Status `200 OK`, order status `CANCELLED`, `paymentStatus` transitions to `REFUNDED`, `refundedAt` stamped |
| **TEST-CAN-06** | F-07 / NFR-02 | Transaction Rollback | Injected DB failure on restoring second line item | Customer sends `POST /api/orders/15/cancel` | Database transaction rolls back completely: status remains `PENDING`, first line item stock restored |
| **TEST-PAY-01** | F-08 / AC-PAY-01 | Integration | Customer places order via `POST /api/orders` | Query created order | Order record contains `paymentStatus = "UNPAID"` |
| **TEST-PAY-02** | F-08 / AC-PAY-02 | Integration | Order #20 exists with `paymentStatus = "UNPAID"` | Customer sends `POST /api/orders/20/pay` with `{ "paymentMethod": "SIMULATED_CARD" }` | Status `200 OK`, `paymentStatus = "PAID"`, `paidAt` timestamp populated |
| **TEST-PAY-03** | F-08 / AC-PAY-03 | Integration / Idempotency | Order #20 is already `PAID` | Customer sends `POST /api/orders/20/pay` again | Status `409 Conflict`, error code `ORDER_ALREADY_PAID` |
| **TEST-PAY-04** | F-08 / AC-PAY-04 | Integration / State Guard | Order #21 is `CANCELLED` | Customer sends `POST /api/orders/21/pay` | Status `422 Unprocessable Entity`, error code `CANNOT_PAY_TERMINAL_ORDER` |
| **TEST-PAY-05** | F-08 / AC-PAY-05 | Integration | Order #22 is `ACCEPTED` and `PAID` | Operator sends `PATCH /api/operator/orders/22/status` with `{"status":"PACKED"}`, then `{"status":"SHIPPED"}` | Status `200 OK` for each call; status advances through `PACKED` then `SHIPPED` |
| **TEST-PAY-06** | F-08 / AC-PAY-06 | Integration / Invalid Step | Order #23 is `PENDING` | Operator sends `PATCH /api/operator/orders/23/status` with `{"status":"SHIPPED"}` | Status `400 Bad Request`, error code `INVALID_TRANSITION` |
| **TEST-PAY-07** | F-08 / AC-PAY-07 | Integration / Refund | Order #24 is `PAID` and `PENDING` | Operator sends `PATCH /api/operator/orders/24/status` with `{"status":"REJECTED"}` | Status `200 OK`, order status `REJECTED`, `paymentStatus = "REFUNDED"`, stock restored |
| **TEST-REG-S1** | Part A Continuity | Regression Suite | Candidate commit deployed or run locally | Execute all Sprint 1 tests (`auth`, `products`, `orders`, `operator-orders`) | 100% of Sprint 1 tests pass without regression |

---

## 3. TDD Test-First Evidence Strategy

For each feature branch in Sprint 2, the team executes strict Test-Driven Development (TDD):
1. **Red Stage**: Implement the STS test file before creating route handlers or database migrations. Verify test runner collects tests and fails with descriptive assertion errors (`Cannot POST /api/orders/:id/cancel` or missing column).
2. **Green Stage**: Apply the database migration and implement service functions and routes until all tests pass.
3. **Refactor Stage**: Optimize transaction locking, extract reusable middleware, and add frontend UI components with unit tests.
4. **Git Evidence**: Commit history records the initial failing test commit, followed by the passing implementation commit, establishing traceable TDD evidence for grading.

## 4. Release remediation verification

| Test | Acceptance criteria | Execution and expected outcome |
|---|---|---|
| TEST-CAT-M07 | AC-CAT-MGMT-03–06 | PostgreSQL API. Reject invalid edits and unauthorized writes. Persist edits and reactivation. Two restocks add both quantities. |
| TEST-CAN-08 | AC-ORD-CAN-03 | PostgreSQL API. Attempt cancellation in accepted, packed and shipped states. Each returns 409 and preserves the order and stock. |
| TEST-CAN-09 | AC-ORD-CAN-02, 05, 06 and AC-PAY-07 | PostgreSQL API. Pay a two-line order, then attempt cancellation twice sequentially and concurrently. One succeeds, one conflicts, a refund is recorded, and both stocks are restored once. |
| TEST-CAN-10 | AC-ORD-CAN-02 | PostgreSQL service integration. Fail after the first real inventory update. Order, payment, timestamps and both stock values roll back. |
| TEST-PAY-05, 06 | AC-PAY-05, 06 | PostgreSQL API. Reject forward skips and a backward transition after shipping. The stored state remains shipped. |
| TEST-PAY-08 | AC-PAY-04 and BR-04 | PostgreSQL API. A different customer receives 403. Payment after rejection receives 422 without changing persisted payment metadata. |
| TEST-PAY-09 | AC-ORD-CAN-05 and AC-PAY-04, 07 | PostgreSQL service integration. Force payment-first and terminal-first schedules for customer cancellation and operator rejection. Preserve the correct refund, terminal error and inventory. |
| TechTent browser journeys | Sprint 1 continuity, F-06, F-07/F-08 | `e2e/sprint-2.spec.ts`. Verify checkout through acceptance, catalog visibility and persisted stock, and payment through cancellation/refund including a rejected terminal repayment. |

The [Sprint 2 verification report](../../evidence/sprint-2-verification.md) records the local red and green runs. The remediation worktree was verified before any commit or CI run of the changes.

## CR-LAB7-01 payment and cancellation regression scope

Retain TEST-CAN-01 through 06, TEST-CAN-08 through 10, and TEST-PAY-01 through 09. Run the applicable payment, cancellation, state-guard and ownership cases with both legacy and new pricing fixtures. Cross-reference [LAB7-STS-04 through 06](../sprint-1/sts.md#cr-lab7-01-maintenance-test-plan-phase-2-review-draft) for the persisted-total, refund, inventory and isolation expectations. Phase 2 has not executed these cases.
