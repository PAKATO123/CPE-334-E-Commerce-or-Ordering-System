# Sprint 2 verification

This report includes the original release audit and the [local remediation run](#local-remediation-run). The GCP release remains blocked.

- Verification date — 24 November 2026 (Asia/Bangkok).
- Tested commit — `6f7c3a7bbe30e596ffa317fe524c825e6ac977d6`.
- Release PR — [#52](https://github.com/PAKATO123/CPE-334-E-Commerce-or-Ordering-System/pull/52), approved and merged.
- Verdict — **Blocked. The Sprint 2 release is not accepted and the `sprint-2` tag was not created or pushed.**

## Repository

Local `main` was fast-forwarded to `origin/main` after an ancestry check. The separate verification worktree started clean. The original feature-branch checkout had an edited `package-lock.json` and untracked `cloud-sql-proxy.exe`. Both were preserved. The remote staging tip is an ancestor of the tested commit and its history contains the docs and feature PRs [#48](https://github.com/PAKATO123/CPE-334-E-Commerce-or-Ordering-System/pull/48), [#49](https://github.com/PAKATO123/CPE-334-E-Commerce-or-Ordering-System/pull/49), [#50](https://github.com/PAKATO123/CPE-334-E-Commerce-or-Ordering-System/pull/50), and [#51](https://github.com/PAKATO123/CPE-334-E-Commerce-or-Ordering-System/pull/51). The local and remote tag queries returned no existing `sprint-2` tag.

## Executed checks

| Environment and command | Passed | Failed | Skipped | Result |
|---|---:|---:|---:|---|
| Exact-commit CI, server `npm test` | 113 | 0 | 0 | PostgreSQL 16 API and regression tests |
| Exact-commit CI, server `npm run test:unit` | 101 | 0 | 0 | Server unit tests |
| Exact-commit CI, client `npm test` | 68 | 0 | 0 | Client component and API-client tests |
| Exact-commit CI, `python3 -B -m unittest discover -s deploy/tests -p 'test_*.py'` | 11 | 0 | 0 | Deployment-tool tests |
| Local `npm.cmd --prefix client test -- --silent` | 68 | 0 | 0 | Client component and API-client tests |
| Local `npm.cmd --prefix server run test:unit -- --silent` | 101 | 0 | 0 | Server unit tests |
| Local server `npm.cmd test -- --silent` | 113 | 0 | 0 | All eight PostgreSQL API and regression suites passed |
| Local `python -B -m unittest discover -s deploy/tests` | 11 | 0 | 0 | Deployment-tool tests. Optional login skip text is part of a simulated scenario. |
| Local `node --test server/scripts/tests/provision-episode8-customer.test.mjs` | 9 | 0 | 0 | Provisioning unit tests |
| Local `../node_modules/.bin/playwright.cmd test --list` and `../node_modules/.bin/playwright.cmd test` | 0 | 0 | 0 | Both exited 1 with “No tests found”. No tracked tests in the configured `e2e` directory. |

The [exact-commit CI job](https://github.com/PAKATO123/CPE-334-E-Commerce-or-Ordering-System/actions/runs/45388547401/job/138425811872) logged checkout of the full tested SHA. Server and client `npm ci`, `npx prisma migrate deploy`, `npm run prisma:seed`, client `npm run build`, and `docker build -t techtent:latest .` succeeded. The unified Docker build includes the server build. Both Sprint 2 migrations applied to fresh PostgreSQL. The [PR CI job](https://github.com/PAKATO123/CPE-334-E-Commerce-or-Ordering-System/actions/runs/45388009413/job/138423925028) also succeeded.

Local `npm.cmd --prefix server run prisma:generate`, `npm.cmd --prefix client run build`, and `npm.cmd --prefix server run build` passed using copies of the installed dependencies. Local `docker compose -f docker-compose.test.yml config --quiet` and `docker compose -f docker-compose.yml config --quiet` exited 0. `git ls-files --eol server/docker-entrypoint.sh` confirmed LF in the index and worktree. `docker desktop start --timeout 40` timed out, but the engine subsequently responded to `docker info --format '{{.ServerVersion}}'`. The working-tree `git diff --check` passed. The release-range `git diff --check 218836e..main` reported whitespace issues in the assignment brief.

Git and CI queries used `git fetch --no-tags origin main sprint-2-staging`, `git merge-base --is-ancestor main origin/main`, `git branch -f main origin/main`, `git worktree add .sprint2-verification main`, `git rev-parse main origin/main`, `git merge-base --is-ancestor origin/sprint-2-staging HEAD`, `git tag -l sprint-2`, and `git ls-remote origin 'refs/tags/sprint-2*'`. GitHub evidence was read with `gh pr view 52`, `gh run list --branch main`, and `gh run view 45388547401 --job <job-id> --log` against the project repository.

The first local `docker compose -p techtent-sprint2-audit -f docker-compose.test.yml up -d --wait --wait-timeout 45` timed out on health checks. The retry with project `techtent-sprint2-audit-retry` and `--wait-timeout 90` became healthy. From `server`, `./node_modules/.bin/prisma.cmd migrate deploy` applied all three migrations, then `npm.cmd run prisma:seed` and `npm.cmd test -- --silent` passed. Tests used the repository's dedicated disposable database on loopback port 55435. Both verification projects were removed with `docker compose -p <project> -f docker-compose.test.yml down`.

## Initial acceptance criteria assessment

Reviewed `docs/sprints/sprint-2/feature-specs.md` and mapped executed tests to their assertions. Partial means the cited assertions passed while some contract behavior remains unverified.

| Acceptance criteria | Status | Exact-commit evidence |
|---|---|---|
| F-06 `AC-CAT-MGMT-01` | Partial | `TEST-CAT-M01` verifies admin creation and database persistence. Operator creation was not independently exercised by that case. |
| F-06 `AC-CAT-MGMT-02–05` | Passed | `TEST-CAT-M02–05` cover duplicate SKU, invalid price/stock, product updates and availability, and database stock increment. |
| F-06 `AC-CAT-MGMT-06` | Partial | `TEST-CAT-M06` verifies anonymous/customer denial on creation. Direct API denial assertions for update and restock were not established. |
| F-07 `AC-ORD-CAN-01–02` | Passed for the exercised journey | Cancellation API suite places a pending order, verifies reserved stock, cancels as owner, reads back the cancelled order and timestamp, and verifies stock restoration. Service unit tests cover multiple line items. A PostgreSQL rollback test for cancellation was not established. |
| F-07 `AC-ORD-CAN-03` | Partial | API coverage verifies conflict on accepted and rejected orders. Packed and shipped cancellation cases were not established. |
| F-07 `AC-ORD-CAN-04` | Passed | Cancellation API suite verifies denial when another customer tries to cancel the order. |
| F-07 `AC-ORD-CAN-05–06` | Partial | Service unit tests cover paid cancellation/refund and repeat-cancellation conflict. PostgreSQL paid-cancellation persistence, concurrent cancellation, and exactly-once restoration across repeat requests were not established by the executed tests. |
| F-08 `AC-PAY-01–03` | Passed | `TEST-PAY-01–03` verify unpaid initialization, successful payment and metadata, and duplicate-payment conflict. |
| F-08 `AC-PAY-04` | Passed at covered levels | Cancelled order verified in API test; cancelled and rejected orders verified in service unit tests. |
| F-08 `AC-PAY-05` | Passed | `TEST-PAY-05` exercises acceptance, packing, and shipping. |
| F-08 `AC-PAY-06` | Partial | `TEST-PAY-06` verifies stage skipping is rejected. Explicit rejection of regression from shipped was not established. |
| F-08 `AC-PAY-07` | Partial | `TEST-PAY-07` verifies operator rejection refunds a paid order and restores stock. Customer paid cancellation was tested at unit level only. |

The full CI run includes Sprint 1 authentication, catalog, checkout, receipt, order ownership and operator processing regression suites. Cross-feature coverage includes checkout followed by cancellation, payment followed by rejection/refund with stock restoration, and fulfillment progression. No browser-level continuity run was established.

## Initial blockers and findings

1. **Deployment failure.** The existing [automatic main deployment](https://github.com/PAKATO123/CPE-334-E-Commerce-or-Ordering-System/actions/runs/45388547401/job/138426567594) failed executing `techtent-migrate`. The GitHub log establishes the failed job but does not establish the underlying Cloud Run error. No deployment was triggered as part of this audit.
2. **Payment/cancellation race identified by code review.** Cancellation chooses `VOID` or `REFUNDED` from a payment status read before its transaction and claims the order using only its fulfillment status. A payment that commits between that read and the cancellation write can yield a paid transaction recorded as voided, without a refund timestamp. This is a source-review finding, not an executed reproduction.
3. **Acceptance evidence gaps.** The partial rows above and the absent browser E2E suite prevent full acceptance.
4. **Root lockfile mismatch.** The committed root manifest specifies TypeScript `^5.7.2`, while the committed root lockfile declares `^7.0.2`. Client and server CI installs use their own lockfiles. Local Playwright used the existing root dependency installation.

Before tagging, investigate the Cloud Run migration execution, resolve the payment/cancellation consistency issue, and close the outstanding acceptance and browser verification gaps on the final candidate SHA.

## Blocker investigation

Investigated the same merge commit, `6f7c3a7bbe30e596ffa317fe524c825e6ac977d6`. Original suite totals above remain historical. The diagnostic results below are a separate run.

### Confirmed transaction defects

`server/src/services/cancellation.ts`, `cancelCustomerOrder`, reads the payment status before opening the transaction. Its conditional update checks `PENDING` without matching the payment status used to choose `VOID` or `REFUNDED`. `server/src/services/payment.ts`, `simulateOrderPayment`, checks the fulfillment status before its transaction and claims based on `UNPAID` alone. On a lost claim it handles `PAID` but does not reclassify a newly terminal order. `server/src/app.ts` wires these services to the pay and cancel endpoints.

In a detached worktree, a temporary Vitest test used a barrier before one service entered its transaction and let the other service commit through a real Prisma connection. The test then read the persisted order and inventory from a fresh, disposable PostgreSQL 16 container.

| Forced ordering | Observed | Contract |
|---|---|---|
| Cancellation reads `PENDING/UNPAID`, payment commits, cancellation resumes | `CANCELLED/VOID`, `paidAt` present, `refundedAt` null. Stock restored to 5 from 3 for a two-unit reservation. | **Failed** `AC-ORD-CAN-05` and the customer path of `AC-PAY-07`. The order must be `REFUNDED` with a refund timestamp. |
| Payment reads `PENDING/UNPAID`, cancellation commits, payment resumes | `CANCELLED/VOID`, no payment/refund timestamp, stock restored to 5. Payment returned `400 PAYMENT_FAILED`. | **Failed** `AC-PAY-04`. Expected `422 CANNOT_PAY_TERMINAL_ORDER`. |

Commands were `docker compose -p techtent-sprint2-diagnostics -f docker-compose.test.yml up -d --wait --wait-timeout 70`, server `./node_modules/.bin/prisma.cmd generate`, `./node_modules/.bin/prisma.cmd migrate deploy`, and `npm.cmd test -- tests/sprint2-race.diagnostic.test.ts`. Vitest reported **0 passed, 2 failed, 0 skipped**. Both fixture stock checks passed. Compose removed the disposable container and network after the run.

Source review found the same stale-payment window in `server/src/services/operatorOrders.ts`, `processOperatorOrder`, on rejection. It uses Read Committed, reads payment state, then claims by fulfillment status alone. This rejection interleaving was not exercised by the two diagnostic cases.

**Smallest fix.** For cancellation and rejection, make the refund decision from the order row after acquiring its write lock, inside the transaction that restores inventory. An implementation using Prisma can first conditionally claim the fulfillment transition, then inspect the claimed row and set the payment state before committing. An equivalent compare-and-swap must match both expected statuses and retry the whole transaction after a payment-state change. Add a nonterminal fulfillment predicate to the payment write and return the contractual `422` on a terminal-row reread, preserving duplicate-payment `409`. Keep stock increments after the successful claim and in the same transaction. Verify both commit orders for cancellation and rejection, plus duplicate requests and rollback.

### Acceptance evidence to close

This review corrects the earlier `AC-CAT-MGMT-01` entry. Admin creation is verified in `TEST-CAT-M01`, and operator creation is also exercised successfully in the existing catalog update and restock cases. `AC-CAT-MGMT-04` needs narrower verification than originally recorded because the existing API test edits name/price and deactivates the product.

| Criterion | Classification | Required automated verification |
|---|---|---|
| `AC-CAT-MGMT-03` | Create validation passed. Update validation exists and needs direct coverage. | In `server/tests/catalog-management.test.ts`, PATCH zero/negative price and negative stock. Assert 400 and unchanged persisted values. |
| `AC-CAT-MGMT-04` | Update implementation exists. Category, description and reactivation lack direct API assertions. | Update category and description, deactivate and reactivate. Assert persisted values and customer catalog visibility after both status changes. |
| `AC-CAT-MGMT-05` | Single restock passed. Concurrent increment safeguard needs an independent test. | Run two simultaneous positive restocks against one product and assert final stock includes both increments. |
| `AC-CAT-MGMT-06` | Role guards exist. Creation denial passed. | Test anonymous and customer PATCH and restock requests on an existing product. Assert 401/403 and unchanged metadata/stock. |
| `AC-ORD-CAN-02` | Single-line persistence passed. Full multi-line rollback is unverified. | In `server/tests/order-cancellation.test.ts`, verify successful restoration of multiple lines, then inject a transaction failure after the first stock write and verify order, timestamps and all stock values roll back in PostgreSQL. |
| `AC-ORD-CAN-03` | Pending-only guard exists. Accepted conflict passed. | Parameterize accepted, packed and shipped cases. Verify 409 and unchanged status and stock for each. |
| `AC-ORD-CAN-05` | Sequential refund logic exists. Overlap defect confirmed. | Pay then cancel via API and verify persisted refund/timestamp/stock. Add the deterministic payment-first concurrency case. |
| `AC-ORD-CAN-06` | Conditional fulfillment claim exists. Database-level exactly-once evidence is missing. | Cancel twice sequentially and then test two overlapping requests on a fresh order. Assert one success, one 409, and exactly one restoration in each case. |
| `AC-PAY-04` | Sequential cancelled API and rejected service-unit coverage. Overlap defect confirmed. | In `server/tests/payment-lifecycle.test.ts`, pay a rejected order over HTTP and test cancel-first/reject-first races. Assert 422 and unchanged payment metadata. |
| `AC-PAY-06` | Skipping test passed. Shipped terminal guard exists. | Advance to shipped, attempt a backward transition and verify the rejection and unchanged persisted status. |
| `AC-PAY-07` | Sequential operator refund passed. Customer overlap defect confirmed; operator overlap risk identified by inspection. | Verify both paid terminal paths using the API and persisted state. Force payment-first overlap with cancellation and rejection and assert refund timestamp and exactly-once stock restoration. |

Keep ownership assertions at API level. In addition to the existing cross-customer cancellation case, add a direct payment API denial for a different customer and assert no persisted payment change. The service-unit test already covers this payment ownership rule.

### Playwright and browser evidence

The root `playwright.config.ts` targets `./e2e`. The tested commit has no tracked files there. Seven specs exist under `_reference_old/e2e` for a separate ticketing application, with its own configuration. The client `*.test.tsx` suites use Vitest and are not browser tests. The root Playwright configuration also lacks a `webServer` entry, so discovered tests will require explicitly started app services or a configured test server. The existing root lockfile mismatch should be corrected to make a clean E2E install reproducible.

Deliverable 2 calls for selected acceptance journeys and program evidence, so a practical release suite is a Sprint 1 customer login/catalog/checkout/history/receipt journey followed by operator processing, a Sprint 2 catalog management journey verifying visibility and stock after reload, and a Sprint 2 paid-order cancellation journey verifying refund, persistence and stock restoration. The latter covers F-07 and F-08 together. Show one meaningful rule rejection and retain backend role/ownership denial evidence from API tests. The Deliverable 2 candidate additionally needs a tested Sprint 3 demonstration. It is separate from the Sprint 2 acceptance checkpoint.

### Cloud Run migration failure

Read-only GitHub and GCP inspection tied the failure to execution `techtent-migrate-v7gqq`, project `pakatopat-project`, region `asia-southeast1`. The image imported and the container started. The job command is `sh -c 'npx prisma migrate deploy && npm run prisma:seed'`. GitHub successfully updated the job image before running it. Cloud Run reported exit code 1.

Cloud Logging shows that the Cloud SQL connector could not obtain an ephemeral certificate for `techtent-pg`. Cloud SQL returned **HTTP 409 `invalidState`**. The socket was unavailable, which caused Prisma **`P1001`** on both task attempts. A read-only instance query reported **`STOPPED` with activation policy `NEVER`**. The newest listed Cloud SQL operation completed on 21 November 2026 UTC, before this 24 November run. The logs and instance state point to the stopped database as the infrastructure cause. The evidence does not establish who set that policy or why. The migration failed before applying SQL, the seed command was gated by `&&`, and the workflow stopped before updating the service.

Relevant configuration is in `.github/workflows/deploy.yml`, `deploy/release.sh`, and `deploy/deploy.sh`. The provisioning script configures the Cloud SQL attachment and the Secret Manager-backed database URL. The release script changes the image and executes the existing job. No secret contents were read and no cloud resources were changed.

Evidence commands included `gh run view 45388547401 --job 138426567594 --log`, `gcloud run jobs executions describe techtent-migrate-v7gqq --region asia-southeast1 --project pakatopat-project`, `gcloud logging read` for the migration job between 11:56:00 and 11:59:30 UTC on 24 November 2026, `gcloud sql instances describe techtent-pg --project pakatopat-project` with state and activation-policy projection, and `gcloud sql operations list --instance techtent-pg --project pakatopat-project --limit 15`. See the [GitHub deployment job](https://github.com/PAKATO123/CPE-334-E-Commerce-or-Ordering-System/actions/runs/45388547401/job/138426567594) and [Cloud Run execution logs](https://console.cloud.google.com/run/jobs/executions/details/asia-southeast1/techtent-migrate-v7gqq?project=693107188088).

### Remediation order

1. Fix the transaction invariants in `cancellation.ts`, `payment.ts`, and the rejection path in `operatorOrders.ts`. Add the deterministic PostgreSQL concurrency cases to the permanent test suite and recheck status, timestamps, refund and stock.
2. Restore Cloud SQL readiness through the existing operational process when authorized. Verify the instance state and the job's socket connection before attempting any deployment. Capture the migration task output for the final candidate.
3. Close the remaining API and rollback evidence gaps, add the selected Playwright journeys under `e2e/`, and reconcile the root lockfile. Run all applicable suites and builds on one immutable candidate SHA before deciding whether it can be accepted.

## Local remediation run

- Verification date — 24 November 2026 (Asia/Bangkok).
- Branch — `fix/sprint-2-release-blockers` in the isolated `.sprint2-remediation` worktree, based on `origin/main` at `6f7c3a7bbe30e596ffa317fe524c825e6ac977d6`.
- These results were collected locally before committing. The SHA identifies the base only. It does not identify a CI-verified remediation candidate.

### Transaction fix and TDD evidence

Before changing the services, `npm.cmd test -- tests/payment-concurrency.test.ts` from `server` ran four deterministic interleavings against PostgreSQL. All four failed. In both payment-first cases, the persisted status was `VOID` instead of `REFUNDED`. In both terminal-first cases, payment returned `400 PAYMENT_FAILED` instead of `422 CANNOT_PAY_TERMINAL_ORDER`. This also reproduced the operator-rejection race identified earlier by source review.

Cancellation and rejection now claim the fulfillment transition with a conditional row update, then read payment state under that write lock. Refund/void metadata and stock restoration are written in the same transaction. Concurrent terminal requests cannot both restore stock. The payment write requires an unpaid, nonterminal order and classifies a terminal row as 422 when its claim fails. The same test command after the fix reported **4 passed, 0 failed, 0 skipped**. The cases assert the persisted terminal state, payment and refund timestamps, and stock.

### Acceptance criteria results

| Criteria | Executed verification |
|---|---|
| AC-CAT-MGMT-03–06 | `TEST-CAT-M07` verified PATCH validation, persisted edits, deactivation/reactivation and visibility, staff-only PATCH/restock, and additive concurrent restocking. |
| AC-ORD-CAN-02 | `TEST-CAN-09/10` verified successful restoration of two line items and rollback of order, refund and stock after a real restoration write. |
| AC-ORD-CAN-03 | `TEST-CAN-08` denied cancellation of accepted, packed and shipped orders with unchanged persisted status and stock. |
| AC-ORD-CAN-05, 06 | `TEST-CAN-09` verified a paid order is refunded with timestamps and stock is restored exactly once for sequential and overlapping requests. `TEST-PAY-09` covered payment-first cancellation. |
| AC-PAY-04 | `TEST-PAY-04/08/09` verified cancellation and rejection return 422, including terminal-first races. `TEST-PAY-08` also verified cross-customer payment denial and unchanged persistence. |
| AC-PAY-06 | `TEST-PAY-05/06` verified skipped and backward transitions are rejected and the stored shipped status is preserved. |
| AC-PAY-07 | `TEST-PAY-07/09` and `TEST-CAN-09` verified refund and stock restoration for paid cancellation and rejection, including concurrent payment. |

The numbered contracts were preserved. The remediation test designs and actual test locations are mapped in the Sprint 2 STS and requirements traceability.

### Local verification commands and results

Disposable database setup used `docker compose -p techtent-sprint2-remediation -f docker-compose.test.yml up -d --wait --wait-timeout 70`. With the approved test database environment, server Prisma `generate` and `migrate deploy` passed and `migrate status` reported all three migrations up to date. `npm.cmd --prefix server run prisma:seed` seeded demo data for integration and browser tests. Both Compose configurations passed `docker compose -f <file> config --quiet`.

| Worktree command | Passed | Failed | Skipped | Result |
|---|---:|---:|---:|---|
| `npm.cmd --prefix server test -- --silent` | 125 | 0 | 0 | PostgreSQL API, integration and Sprint 1 regression, including the 4 race cases |
| `npm.cmd --prefix server run test:unit` | 101 | 0 | 0 | Backend unit tests |
| `npm.cmd --prefix client test -- --silent` | 68 | 0 | 0 | Frontend component and API-client tests |
| `npm.cmd run test:e2e` | 3 | 0 | 0 | Chromium on the built TechTent app with real PostgreSQL |
| `python -B -m unittest discover -s deploy/tests` | 11 | 0 | 0 | Offline deployment-tool tests |
| `node --test server/scripts/tests/provision-episode8-customer.test.mjs` | 9 | 0 | 0 | Provisioning unit tests |

`npm.cmd --prefix client run build`, `npm.cmd --prefix server run build`, root `tsc --noEmit`, and root `npm.cmd ci --offline` passed. The regeneration of the root lockfile fixed the committed TypeScript version mismatch. Git Bash syntax checks and both offline shell stub scripts passed. No GCP resources were contacted by the stubs.

Installed Chromium with `npm.cmd exec -- playwright install chromium` using a worktree-local browser cache. Earlier browser attempts found a missing browser binary and test locator mistakes around SKU normalization and the two receipt payment badges. One intermediate API rerun on the browser-used database failed the legacy catalog search because the synthetic browser product names matched its fixture search. The browser names were changed, the API suite passed again on a fresh database, and another full API run after browser fixture creation also passed **125/125**. The existing catalog search assertions were preserved.

The screenshot run passed **3/3** in 8.5 seconds. The three captures were kept locally and excluded from Git as generated artifacts.

The pre-commit review moved the browser fixture password to the `DEMO_USER_PASSWORD` environment variable. On a fresh disposable PostgreSQL database, the review applied all three migrations, seeded with a generated fixture password, and reran root TypeScript checking and `npm.cmd run test:e2e`. All three browser tests passed again. The fixture password was never written to a file.

- Sprint 1 continuity after operator acceptance.
- F-06 restocked product visible in the customer catalog after reload.
- F-07/F-08 cancelled receipt with persisted refund after reload. The same run verified restored stock and a 422 for terminal repayment.

The disposable database was removed with `docker compose -p techtent-sprint2-remediation -f docker-compose.test.yml down`. Final local verification passed. **Release acceptance remains blocked** pending review and CI on an immutable remediation commit and an authorized verification of the Cloud SQL migration and deployment. The verification run made no GCP changes.
