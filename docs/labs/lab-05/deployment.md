# TechTent Lab 5 deployment

This runbook follows Sections 4.3, 8 and 12 of the updated Lab 5 handout. Evidence
for grading belongs in the team PDF. Record the command or run link, result and
tested commit for each check.

## Deployment status

Reviewed against GitHub `main` at `e17f136` on 18 November 2026.
Unauthenticated requests to the [Cloud Run service](https://techtent-693107188088.asia-southeast1.run.app)
returned HTTP 403 for `/`, `/api/health` and `/api/ready`. Check the service's
public access settings and rerun the public smoke test before live verification
or submission. The successful release results below are from 15 November 2026.

| Episode | Status |
| --- | --- |
| 5 - Manual deployment | The operator reported a successful deployment after manual Cloud Build recovery. The evidence checklist remains open. |
| 6 - Keyless authentication and merge protection | GitHub Actions authenticated successfully through WIF, and GitHub lists the [active main ruleset](https://github.com/PAKATO123/CPE-334-E-Commerce-or-Ordering-System/rules/27308438). Complete the configuration evidence checklist below. |
| 7 - Automated releases | Two successful automatic releases are recorded below, with immutable image digests and Cloud Run revisions. |
| 8 - Persistence and image rollback | Public access must pass before the live checks. Order, inventory, session, restart and A/B restore evidence is still outstanding. |

## Stack and changes from the reference

TechTent uses React and Vite, an Express API, Prisma 5, and PostgreSQL 16. The root
Dockerfile serves the UI and API from one non-root container on port 3000 in Cloud
Run. Local Compose uses separate Nginx, API and database containers. PostgreSQL
stores catalog, inventory, orders and sessions outside the application container.

TechTent adapts the starter smoke test to its cookie-based customer login and
the `{data: string[]}` categories response. For persistence checks, compare an
order, its stored totals, catalog stock and the customer session. The example
ticket and attachment workflow does not apply to TechTent.

## Configuration sources

Use the tracked [server/.env.example](../../../server/.env.example) and
[client/.env.example](../../../client/.env.example) for local configuration.
Their values are local defaults or placeholders. Keep real credentials and
populated `.env` files out of Git and screenshots. Production secrets come from
Secret Manager. The optional smoke password comes from GitHub Actions secrets.

### Environment variable table

| Variable | Secret? | Source and purpose |
| --- | --- | --- |
| PROJECT_ID / REGION | No | Cloud Shell exports for manual bootstrap and GitHub Actions mappings for automated releases. See GCP resources below. |
| DRY_RUN | No | Set exactly 1 for deploy/teardown preview; never run release.sh as a preview |
| NODE_ENV | No | Deployment sets production; local Compose uses development for HTTP cookies |
| PORT | No | Cloud Run/container port 3000; backend binds 0.0.0.0 |
| TZ | No | Deployment sets Asia/Bangkok |
| DATABASE_URL | Yes | Secret Manager injected into job and service; Prisma and pg session store |
| ADMIN_PASSWORD | Yes | Generated in Secret Manager; migration job only; required in production |
| SEED_DEMO_DATA | No | Explicit true enables demo users; false by default; deploy --demo sets true |
| DEMO_USER_PASSWORD | Yes | Generated optional secret; required in production when demos enabled |
| SESSION_SECRET | Yes | Generated once as 32 random bytes encoded in hex; service only; retain across releases |
| COOKIE_SECURE | No | Deployment true; production always uses secure cookies; local HTTP defaults false |
| CORS_ORIGIN | No | Optional comma-separated origin allowlist; existing behavior retained when unset |
| VITE_API_URL | No | Empty at build time for same-origin /api; Vite development proxy targets port 3000 |
| POSTGRES_USER / POSTGRES_PASSWORD / POSTGRES_DB | Password only | Local Compose database settings; never cloud credentials |
| TECHTENT_ALLOW_DATABASE_TESTS / TECHTENT_TEST_DATABASE_URL | URL credentials | Explicit disposable-test safety gate; never target production |
| IMAGE_TAG / ROLLBACK | No | Episode 7 pipeline: full 40-character SHA; rollback true skips migration/seed |
| SERVICE_NAME / MIGRATE_JOB_NAME | No | release.sh defaults match resource table |
| GITHUB_ENV | No | GitHub-provided file for release outputs; not application configuration |
| GCP_PROJECT_ID / GCP_REGION | No | Episode 6 GitHub demo environment, mapped to PROJECT_ID / REGION |
| WIF_PROVIDER / WIF_SERVICE_ACCOUNT | No | GitHub demo variables containing the full workload identity provider resource name and deployer service account email |
| SMOKE_EMAIL / SMOKE_PASSWORD | Password only | Optional dedicated CUSTOMER account; variable plus GitHub secret; leave BOTH unset for Episode 5 |

### GitHub Actions demo environment

In GitHub, open **Settings > Environments > demo**. Restrict deployment to
`main` and configure these non-secret variables.

| Variable | Value or source |
| --- | --- |
| `GCP_PROJECT_ID` | `pakatopat-project` |
| `GCP_REGION` | `asia-southeast1` |
| `WIF_PROVIDER` | Full provider resource name from GCP Workload Identity Federation |
| `WIF_SERVICE_ACCOUNT` | `techtent-deployer@pakatopat-project.iam.gserviceaccount.com` |

Set the optional `SMOKE_EMAIL` variable and `SMOKE_PASSWORD` secret together
for a dedicated CUSTOMER account, or leave both unset. Capture the four variable names in the GitHub settings evidence.

## Build, test and run

From the repository root, run the application builds and offline checks. On
Windows use Git Bash for the shell commands and `npm.cmd` in PowerShell.

```bash
npm --prefix server ci
npm --prefix client ci
npm --prefix server run build
npm --prefix client run build
npm --prefix server run test:unit
npm --prefix client test
python -B -m unittest discover -s deploy/tests -p 'test_*.py'
bash deploy/tests/test_deploy_stub.sh
bash deploy/tests/test_release_stub.sh
```

The shell stubs do not contact GCP. Run database integration tests only with
the [disposable test database](../../sprints/sprint-1/f05-test-environment.md).

### C-03 clean-clone container evidence

From a fresh checkout, review the root [Dockerfile](../../../Dockerfile) and
[.dockerignore](../../../.dockerignore). Build the production image and start the
local application and PostgreSQL stack with Docker Compose.

```bash
docker build --no-cache -t techtent:local .
docker compose build --no-cache
docker compose up -d
docker compose ps -a
curl --fail http://localhost:3000/api/ready
```

The root build produces the unified Cloud Run image. The local Compose stack uses
separate client and API images. Verify that `db` is healthy, `migrate` exited 0,
and `server` and `client` are running. Open http://localhost:5173.

Capture the checked-out commit, successful fresh build, Compose status, and
readiness response for C-03. Link the tracked
[server/.env.example](../../../server/.env.example) and
[client/.env.example](../../../client/.env.example) alongside the
[environment variable table](#environment-variable-table). The examples use local defaults and
placeholders. Production credentials come from Secret Manager. Include only
variable names and sources in the evidence.

### Migrate and seed

Compose starts `migrate` after PostgreSQL becomes healthy and starts the API
after migration and seed succeed. To run the same commands explicitly against
the intended local database, set the server environment from its example and
run from `server/`.

```bash
npx prisma migrate deploy
npm run prisma:seed
```

The first seed creates `admin@example.com` with a mandatory password change.
Seed inserts missing rows and preserves existing accounts, password changes,
catalog entries, stock and orders. Set `SEED_DEMO_DATA=true` to create demo
accounts. Keep the production session key stable across releases.

## GCP resources

| Setting/resource | Value |
| --- | --- |
| Project ID | pakatopat-project |
| Region | asia-southeast1 |
| Artifact Registry repository / image | techtent / techtent |
| Cloud SQL instance / database / user | techtent-pg / techtent / techtent |
| Cloud Run service / migration job | techtent / techtent-migrate |
| Runtime identity | techtent-runner@pakatopat-project.iam.gserviceaccount.com |
| Cloud Build identity | techtent-builder@pakatopat-project.iam.gserviceaccount.com |
| GitHub Actions deployer | techtent-deployer@pakatopat-project.iam.gserviceaccount.com |
| Database URL secret | techtent-database-url |
| Bootstrap administrator password secret | techtent-admin-password |
| Optional demo password secret | techtent-demo-password |
| Persistent session signing secret | techtent-session-secret |
| Git integration branch | lab-5-staging |

## First-time deployment

Use Cloud Shell after confirming billing, the project, and the dedicated build
identity. Preview the bootstrap from the root of the reviewed checkout before
running it.

```bash
export PROJECT_ID=pakatopat-project
export REGION=asia-southeast1
DRY_RUN=1 bash deploy/deploy.sh
bash deploy/deploy.sh
gcloud sql instances patch techtent-pg --no-storage-auto-increase --project "$PROJECT_ID"
```

Bootstrap creates the infrastructure, builds the unified image, waits for the
migration and seed job, and deploys the service. Step 9 uses
`techtent-builder@pakatopat-project.iam.gserviceaccount.com` and the
`pakatopat-project_cloudbuild` staging and logging bucket. Confirm that the
submitter can act as that identity and that the builder can access the bucket.
The original bootstrap stopped at Cloud Build. The operator finished the
build, migration, and deployment with separate commands.

Verify the public URL, then change the bootstrap administrator password
privately. Keep Secret Manager values out of the evidence.

```bash
SERVICE_URL=$(gcloud run services describe techtent --region "$REGION" --project "$PROJECT_ID" --format='value(status.url)')
python deploy/smoke_test.py "$SERVICE_URL"
```

### Episode 5 deployment record and evidence

The following results were supplied by the operator.

| Item | Verified result supplied by operator |
| --- | --- |
| Project / region | pakatopat-project / asia-southeast1 |
| Public URL | https://techtent-693107188088.asia-southeast1.run.app |
| Cloud Run service / revision | techtent / techtent-00001-b5s |
| Revision traffic | 100% |
| Cloud SQL | techtent-pg, PostgreSQL 16 |
| Storage auto-increase | Disabled |
| Migration job / successful execution | techtent-migrate / techtent-migrate-2h7w4 |
| Migration result | 1/1 tasks succeeded; exit code 0 |
| GET /api/health | HTTP 200 |
| GET /api/ready | HTTP 200; database connected |
| Frontend | Successfully loaded |
| Administrator login | Successfully tested |
| Initial administrator password change | Confirmed by operator |
| Deployed Git commit | `771945036d260dcf7f8150a5bf628e7f7396df83` |
| Cloud Build ID / status | `17f37a21-c095-4178-992f-1469f76abce8` / SUCCESS |
| Image digest | `sha256:6acab3358466f55c1c9b988b4fb1cfdb574e6d59f789e73cf0186ab0680e6446` |
| Cloud Build duration | Approximately 1 minute 32 seconds |

For the team PDF, add the original deployment timestamp and operator,
screenshots or links for the revision and SQL settings, and sanitized evidence
of the administrator password change and manual smoke run.

## Release procedure

1. Link the Lab 5 Issue to a feature PR into `lab-5-staging`. Get a specific
   teammate review and a passing CI check.
2. Open a release PR from `lab-5-staging` into `main`. The active
   [protect-main ruleset](https://github.com/PAKATO123/CPE-334-E-Commerce-or-Ordering-System/rules/27308438)
   requires one approval and the strict `test-and-docker` check. The
   [merge-gate test PR](https://github.com/PAKATO123/CPE-334-E-Commerce-or-Ordering-System/pull/39)
   records a failed check. GitHub also reports conflicts and review required on
   that PR, so distinguish those conditions when documenting C-02.
3. Once the PR merges, [Deploy demo](../../../.github/workflows/deploy.yml)
   runs CI and uses Workload Identity Federation to authenticate. It builds and
   pushes the full-SHA image, resolves the digest, waits for migration and seed,
   updates Cloud Run traffic, and runs the public smoke tests.
4. In the run summary, record the full image tag, digest, URL and smoke result.
   In Cloud Run, find the revision receiving traffic and match its image digest
   to the summary and Artifact Registry. For an image restore, use the input
   SHA in the summary as the released commit. The workflow itself runs from
   `main`.

If migration fails, inspect the job logs before retrying. Smoke checks run after
traffic moves, so a failed smoke check can leave the new revision serving.
Inspect the actual serving revision before choosing a recovery.

### Verified release record

GitHub Actions logs show both releases passed CI, keyless authentication,
migration and deployment, and public smoke checks. Cloud Run reported 100%
traffic to the revision shown for each run at deployment time. Health, readiness,
HTML and categories passed on both runs. Optional customer login was skipped on both.

| Release | Merge and workflow run | Full image tag | Image digest | Cloud Run revision | Migration execution | Catalog heading in release source |
| --- | --- | --- | --- | --- | --- | --- |
| A | [PR #43](https://github.com/PAKATO123/CPE-334-E-Commerce-or-Ordering-System/pull/43) / [Deploy demo](https://github.com/PAKATO123/CPE-334-E-Commerce-or-Ordering-System/actions/runs/43718682232) | `717257ff78a5af4b575d2aeac98ca788370da2f8` | `sha256:b5dccdcffe6bdabb7ce7fcdfba9e37ecc2b6f49441148e02996ff561c1f0ad31` | `techtent-00002-brv` | `techtent-migrate-lgr27` | Everyday Tech Essentials |
| B | [PR #45](https://github.com/PAKATO123/CPE-334-E-Commerce-or-Ordering-System/pull/45) / [Deploy demo](https://github.com/PAKATO123/CPE-334-E-Commerce-or-Ordering-System/actions/runs/43722710791) | `e17f136f543a4ebb1336e36b714149bb598febc8` | `sha256:a33e30cbfd7ba8dc82d22d47cb810ee5ebfdd5248ca2d0ec0060e2f302772cfc` | `techtent-00003-smt` | `techtent-migrate-lh2dh` | Discover Your Next Tech Upgrade |

The [first automatic attempt](https://github.com/PAKATO123/CPE-334-E-Commerce-or-Ordering-System/actions/runs/43711691833)
authenticated successfully, then failed before migration because whitespace in the region
produced an invalid Docker tag. [PR #42](https://github.com/PAKATO123/CPE-334-E-Commerce-or-Ordering-System/pull/42)
added region trimming. The next two releases passed.

## Persistence and image restore

1. Confirm public readiness, that B is serving, and that both recorded digests
   remain available and compatible with the current schema.
2. Sign in as a customer, place one order for an active, in-stock product, and
   record the order ID, quantities, stored prices, total, post-checkout stock and
   signed-in identity. Mask private details.
3. Capture an application restart separately. For an isolated Compose stack,
   take a baseline in that stack, run `docker compose restart server`, and
   compare the order, stock and session. Label the environment in the evidence.
   For a cloud restart, confirm the operation and record its observable result.
4. In **Actions > Deploy demo > Run workflow**, choose `main` and enter the
   full A SHA as `image_tag`. Verify smoke results, serving revision and digest,
   100% traffic, the A catalog heading, and the same order, stock and session.
5. Dispatch the full B SHA and repeat the checks. Verify B's catalog heading is
   back. SHA-based restores reuse existing images and skip tests, image build,
   migration and seed. They leave the database schema in place.

| Stage | Evidence to capture | Status |
| --- | --- | --- |
| Baseline on B | Order, post-checkout stock, session and B revision | Pending |
| App restart | Restart event and the same records afterward | Pending |
| Restore A | Run link, revision, A heading and the same records | Pending |
| Restore B | Run link, revision, B heading and the same records | Pending |

## Submission evidence

| Check | Evidence for the team PDF |
| --- | --- |
| C-01 | Passing PR CI run and test summary |
| C-02 | Failing test PR, required check and blocked merge |
| C-03 | Dockerfile, .dockerignore, .env.example, variable table, fresh build and running app/database output |
| C-04 | Public customer sign-in, checkout, and a rule rejection or access restriction |
| C-05 | Same order and inventory after both application restart and redeploy |
| C-06 | Issue, teammate review, staging PR, release PR, CI, deployment run and serving commit |

Use the handout's **Answer Part 0** through **Answer Part 4** headings in the PDF.
Give direct links and caption screenshots with the check and tested version.
Keep the service available through grading. Cloud SQL continues to incur charges
while running. Review end-of-course teardown separately because it deletes data.
