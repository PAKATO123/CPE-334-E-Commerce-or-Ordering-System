# Feature 5 disposable test environment

Database-writing verification requires explicit user approval. No test command initializes a database automatically.

## Isolation

- Dedicated Compose project: `techtent-tests`, configured in `docker-compose.test.yml`.
- PostgreSQL 16, bound only to `127.0.0.1:55435` (development uses port 5432).
- Database and role: `techtent_test`; schema: `public`.
- Ephemeral data directory on tmpfs; no development volume or directory is mounted.
- Local test-only password: `techtent_test_local_only`.
- Guard requires an explicit URL and opt-in. Host, port, database, role, password, schema and URL parameters are allowlisted.
- Vitest checks the target before collecting integration tests and configures every worker before test imports. The Prisma factory also rejects a changed connection in test mode.
- Global setup verifies PostgreSQL's reported database and role before test bodies can run.
- Legacy regression tests still reset demo data and delete orders. Run them only in this disposable environment. New F-05 integration tests scope cleanup to their fixture accounts/products.

## Commands after approval only

Start Docker Desktop first. From the repository root:

```powershell
docker compose -f docker-compose.test.yml up -d --wait
$env:TECHTENT_TEST_DATABASE_URL = "postgresql://techtent_test:techtent_test_local_only@127.0.0.1:55435/techtent_test?schema=public"
$env:TECHTENT_ALLOW_DATABASE_TESTS = "1"
npm.cmd --prefix server run test:db:prepare
npm.cmd --prefix server test
```

`test:db:prepare` validates the dedicated connection and actual database identity before pushing the schema and seeding demo accounts/catalog for regression tests. It does not run automatically during installation or builds. This is disposable schema preparation, not a substitute for committed application migrations.

To run only the new integration suite after preparation:

```powershell
npm.cmd --prefix server test -- tests/operator-orders.test.ts
```

Stop/remove the test container after approved testing:

```powershell
docker compose -f docker-compose.test.yml down
```

Do not use the development Compose file for test execution.

## Database-free verification

```powershell
npm.cmd --prefix server run test:unit
npm.cmd --prefix client test
npm.cmd --prefix server run build
npm.cmd --prefix client run build
```

The backend unit configuration has no database setup; unit suites do not instantiate a real Prisma client. Its retry tests use mocks and do not establish PostgreSQL concurrency or rollback correctness.

The integration suite gates two independently authenticated HTTP requests at transaction entry, then executes real competing PostgreSQL transactions. Rollback testing injects a failure on the second stock restoration inside a real transaction, after the first database update has executed. These guarantees must remain unverified until the suite actually runs against PostgreSQL.

## Phase E verification results

Executed against the approved PostgreSQL 16 disposable container after validating its
loopback binding, tmpfs data mount, absence of persistent/bind mounts, guarded URL,
and actual database/user identity (`techtent_test`).

| Verification | Passed | Failed | Skipped |
|---|---:|---:|---:|
| F-05 integration suite alone | 47 | 0 | 0 |
| Full backend integration/regression suite (includes those 47) | 93 | 0 | 0 |
| Database-free backend unit suite | 48 | 0 | 0 |
| Full frontend suite | 41 | 0 | 0 |

Both backend and frontend builds passed. The opt-in-disabled integration runner
stopped before test collection, as intended. The targeted integration run is a
subset of the full backend run, not an additional 47 distinct tests.

Real database checks passed for concurrent reject/reject, accept/reject and
accept/accept requests: one response was 200 and one 409, with inventory matching
the winning transition. An injected second restoration failure rolled back the
first stock update and the status/timestamp change. Customer history, receipt
prices, cross-customer isolation and operator/admin receipt access also passed.

The injected rollback error is expected test output, not a failing test.
Browser visual layout, native dialog focus trapping and broader inherited
checkout concurrency defects are outside these results.
