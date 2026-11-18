# TechTent Lab 5 deployment

Use the updated Lab 5 handout (R-01 through R-12) and Student Guide V1.1,
Episodes 1-8. The handout takes precedence.

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

## Stack and resource names

TechTent uses React/Vite, Express cookie sessions, Prisma 5 and PostgreSQL 16.
The root Dockerfile serves UI and API together on port 3000 as the non-root node user.
Compose uses separate Nginx/API containers for local HTTP; Cloud Run uses the unified image.
The database and PostgreSQL session store keep data outside the app container.

| Setting/resource | Value |
| --- | --- |
| Project ID | pakatopat-project |
| Region | asia-southeast1 |
| Artifact Registry repository / image | techtent / techtent |
| Cloud SQL instance / database / user | techtent-pg / techtent / techtent |
| Cloud Run service / migration job | techtent / techtent-migrate |
| Runtime identity | techtent-runner@pakatopat-project.iam.gserviceaccount.com |
| Database URL secret | techtent-database-url |
| Bootstrap administrator password secret | techtent-admin-password |
| Optional demo password secret | techtent-demo-password |
| Persistent session signing secret | techtent-session-secret |
| Git integration branch | lab-5-staging |

## Configuration sources

All examples are placeholders or local-only values. Never copy a real secret into
Git, AI chat, Issues, screenshots, logs or the final evidence PDF.

| Variable | Secret? | Source and purpose |
| --- | --- | --- |
| PROJECT_ID / REGION | No | Operator shell; explicit project and region above; deployment scripts |
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
| WIF_PROVIDER / WIF_SERVICE_ACCOUNT | No | Episode 6 keyless deployer configuration; no JSON keys |
| SMOKE_EMAIL / SMOKE_PASSWORD | Password only | Optional dedicated CUSTOMER account; variable plus GitHub secret; leave BOTH unset for Episode 5 |

Seed behavior: admin@example.com is created with mustChangePassword=true. Existing
accounts (including changed passwords, roles and flags), catalog rows, inventory and
orders are never updated by seed. Products are inserted only when missing. Demo
accounts require SEED_DEMO_DATA=true; --demo generates their credentials privately.
Do not use seed to repair or rotate existing credentials. Production rejects missing
admin credentials and missing enabled-demo credentials before writing any records.
Local/test-only fallback passwords must never be used for production.

The session secret is reused, never regenerated by a normal deployment or release.
Production startup rejects a missing/short key. Trust proxy is enabled for Cloud Run
HTTPS; cookies are HttpOnly, SameSite=Lax and Secure in production. CORS is optional
and unchanged: the unified frontend requires no cross-origin API traffic. A separate
frontend origin would require an explicit deployment design and allowlist review.

## Local build and validation

From a clean clone install server/client dependencies with npm ci in each directory.
Run `npm --prefix server run build` and `npm --prefix client run build`.
Run `npm --prefix server run test:unit`, `npm --prefix client test`,
`python -B -m unittest discover -s deploy/tests -p test_smoke.py`, and
`bash deploy/tests/test_deploy_stub.sh` plus `bash deploy/tests/test_release_stub.sh`.
Stub tests replace gcloud and openssl and contact no cloud service. They use temporary files.
Integration tests require the [disposable test database](../../sprints/sprint-1/f05-test-environment.md).
CI explicitly enables demo seeding for this disposable database.

Local containers: `docker compose up --build -d`, then `docker compose ps -a`.
Migrate must exit 0; db/server/client must run. Set SEED_DEMO_DATA=true explicitly
if customer/operator demo accounts are needed locally. Open http://localhost:5173.
Do not delete the existing database volume to test persistence.
The root production image is built with `docker build -t techtent:local .`.
Migration command inside the server image: `npx prisma migrate deploy`.
Seed command: `npm run prisma:seed`. Startup: `node dist/index.js`.

## Episode 5 manual sequence (human execution only)

1. Finish Episode 1: active personal-account trial, billing enabled, teammate access,
   and alerts-only budget. If trial is pending, stop before real deployment.
2. Release prerequisite fixes through reviewed PRs: feature branch -> lab-5-staging -> main.
   Both PRs need passing CI and specific teammate review. Label Issues/PRs lab5.
   Use reviewed PRs for changes to main.
3. Use Cloud Shell for first-time provisioning. GitHub Actions assumes the Cloud Run
   service, migration job, registry, secrets and database already exist.
4. Open Cloud Shell in the correct account. Verify active account, project and billing
   as described in Guide Episodes 1 and 5. Set explicit non-secret values:

```bash
export PROJECT_ID=pakatopat-project
export REGION=asia-southeast1
gcloud auth list --filter=status:ACTIVE --format='value(account)'
gcloud config set project "$PROJECT_ID"
gcloud config get-value project
git clone https://github.com/PAKATO123/CPE-334-E-Commerce-or-Ordering-System.git
cd CPE-334-E-Commerce-or-Ordering-System
git rev-parse HEAD
```

Confirm the clone matches the reviewed release on GitHub main. For an existing clone,
inspect its state before updating; never overwrite local work.

5. Preview and review all commands before creating anything:

```bash
DRY_RUN=1 PROJECT_ID="$PROJECT_ID" REGION="$REGION" bash deploy/deploy.sh
```

Repeat preview after every script change. Expected order: APIs, registry, SQL instance
and database, runtime identity/IAM, generated secrets, Cloud Build, migration+seed job,
service. A dry-run completion message is simulation only.
6. Only after human review and approval, run the manual bootstrap. The first live
   attempt stopped at Cloud Build; the unmodified script is not yet an end-to-end verified
   procedure. See the deployment record below for the successful manual recovery and
   custom build-account settings before attempting a repeat run:

```bash
PROJECT_ID="$PROJECT_ID" REGION="$REGION" bash deploy/deploy.sh
```

Use --demo only when explicitly choosing demo accounts. Do not cancel normal provisioning.
If migration fails, read the printed job-log instructions first; do not blindly rerun.
7. Immediately disable storage auto-increase (Guide 5.4):

```bash
gcloud sql instances patch techtent-pg --no-storage-auto-increase --project "$PROJECT_ID"
```

8. Verify the service and database (Guide 5.5):

```bash
export SERVICE_URL=$(gcloud run services describe techtent --region "$REGION" --project "$PROJECT_ID" --format='value(status.url)')
curl --fail "$SERVICE_URL/api/health"
curl --fail "$SERVICE_URL/api/ready"
python3 deploy/smoke_test.py "$SERVICE_URL"
```

Open the public URL without Google sign-in. Smoke checks health, readiness, HTML and
nonempty TechTent `{data: [category strings]}`. Optional cookie-based login runs only
when both smoke settings exist; never use admin or seed accounts. It reads profile and logs out.
9. Privately retrieve the bootstrap password from techtent-admin-password in Secret Manager
   (Guide 5.6). Do not screenshot or paste it anywhere. Sign in as admin@example.com and
   immediately change the password. Later seed runs preserve the new password and flag.
10. Inspect Console settings and close the Episode 5 Issue with URL and sanitized evidence.

## Episode 5 deployment record and evidence

The operator verified the first manual deployment after recovering from a Cloud Build
failure. Use the table and checklist below to assemble the team's Lab 5 evidence report.

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

Record the original deployment date, timezone and operator, plus the final evidence
report filename or link. The original build and artifact can be located through
[Cloud Build history](https://console.cloud.google.com/cloud-build/builds;region=asia-southeast1/17f37a21-c095-4178-992f-1469f76abce8?project=pakatopat-project)
and [Artifact Registry](https://console.cloud.google.com/artifacts/docker/pakatopat-project/asia-southeast1/techtent/techtent?project=pakatopat-project).

### Cloud Build failure and verified manual recovery

The original deploy/deploy.sh attempt failed in its image-build step because the default
Cloud Build service account was unavailable. The full script did NOT complete successfully
end-to-end. After the failure, image build, migration job and Cloud Run deployment were
completed using separate commands. The exact migration/service recovery commands have not
yet been recorded. Add sanitized commands or execution links to the evidence report.

The operator created a dedicated build identity:
`techtent-builder@pakatopat-project.iam.gserviceaccount.com`.
The following permissions were configured (historical configuration, not a new IAM action):

| Scope | Configured role |
| --- | --- |
| Project pakatopat-project | roles/cloudbuild.builds.builder |
| Bucket gs://pakatopat-project_cloudbuild | roles/storage.objectAdmin |

This BUILD identity is distinct from the Cloud Run runtime identity techtent-runner and
any future Episode 6 WIF deployer. Do not grant their roles interchangeably. This records
the working setup, not a claim that the broad project builder role is the minimum possible.
Record its actual IAM evidence without exposing credentials or creating service-account keys.

The operator verified this command from the repository root in Cloud Shell. It builds and
pushes a real image, so it is documentation ONLY here; do not execute it as a local check:

```bash
gcloud builds submit . \
  --tag "asia-southeast1-docker.pkg.dev/pakatopat-project/techtent/techtent:latest" \
  --service-account "projects/pakatopat-project/serviceAccounts/techtent-builder@pakatopat-project.iam.gserviceaccount.com" \
  --gcs-source-staging-dir "gs://pakatopat-project_cloudbuild/source" \
  --gcs-log-dir "gs://pakatopat-project_cloudbuild/logs" \
  --region "asia-southeast1" \
  --project "pakatopat-project"
```

Step 9 now passes the explicit builder identity, source and log bucket paths, and
region. Before running it, confirm that the account and bucket exist and that the
submitter can act as the build identity. A complete bootstrap with the corrected
script still needs verification.

### Outstanding Episode 5.8 evidence

- Link the team report and Episode 5 Issue. Record the verification timestamps and Issue closure.
- Capture the revision, digest and traffic, successful migration, PostgreSQL version,
  storage auto-increase setting, public frontend, and original health and readiness results.
- Record runtime Cloud SQL Client access, per-secret permissions, secret names only,
  environment sources and actual minimum and maximum instance settings.
- Attach sanitized proof of the initial administrator password change and full manual
  smoke output, including categories, where available.

## Episode 6: WIF and the main merge gate

Follow Student Guide V1.1 sections 6.1-6.7 (pages 56-80); the Lab handout takes
precedence. Local preparation does not prove that external configuration exists.
Keep the Episode 6 Issue labelled lab5 and link specific teammate reviews.

### Repository and live configuration

CI runs on PRs into `main` and `lab-5-staging` with job `test-and-docker`.
The main-only deploy job uses the `demo` environment and grants `id-token: write`
for keyless authentication. Successful Episode 7 runs confirm WIF authentication
worked for those runs. Capture the actual provider conditions, IAM grants and
environment configuration for the submission evidence.

Read-only GitHub verification commands for a later authorized session:

```bash
gh repo view PAKATO123/CPE-334-E-Commerce-or-Ordering-System --json nameWithOwner,isPrivate,defaultBranchRef,viewerPermission
gh api repos/PAKATO123/CPE-334-E-Commerce-or-Ordering-System --jq '{repository_id: .id, owner_id: .owner.id}'
gh api repos/PAKATO123/CPE-334-E-Commerce-or-Ordering-System/actions/oidc/customization/sub
gh api repos/PAKATO123/CPE-334-E-Commerce-or-Ordering-System/rulesets
```

Record verified repository ID, owner ID, exact owner/repository spelling, project number,
region, runtime account email, registry, deployer email, pool/provider IDs and OIDC subject
format. An access error is not proof that a resource is absent. Do not copy example IDs.

### GCP configuration checklist

Use the Console sequence in 6.2-6.3 after explicit authorization. Verify/enable IAM Service
Account Credentials and Security Token Service APIs. Proposed names are `techtent-deployer`,
`github-actions` (pool) and `github-main` (OIDC provider); reuse only after inspecting them.
Keep the deployer separate from the existing runtime identity; never create/download JSON keys.

| Principal | Proposed permission | Scope |
| --- | --- | --- |
| Deployer | roles/run.developer | Verified application project, as in Guide 6.2 |
| Deployer | roles/artifactregistry.writer | Application repository only |
| Deployer | roles/iam.serviceAccountUser | Runtime service account only |
| Federated repository identity | roles/iam.workloadIdentityUser | Deployer service account only |

Retain runtime Cloud SQL Client and per-secret accessor bindings from Episode 5; verify
actual policies. Do not add Owner, Editor, database administration, project-wide secret
access, or Token Creator by default. The deployment identity does not need to read secret values.

Provider issuer: `https://token.actions.githubusercontent.com`. Keep the provider's default
audience as in the guide. Map `google.subject=assertion.sub` and
`attribute.repository_id=assertion.repository_id`. Restrict the attribute condition to ALL of:

- verified repository ID and owner ID;
- `assertion.ref == 'refs/heads/main'`;
- exact `assertion.workflow_ref` for this repository's `.github/workflows/deploy.yml@refs/heads/main`;
- exact `assertion.sub` for environment `demo`, using the verified immutable or legacy format.

Bind only the repository-specific principal set to the deployer. Its identifier uses the
verified project NUMBER and pool ID, ending in `/attribute.repository_id/REPOSITORY_ID`.
Review the full condition and binding before saving; do not broaden them to solve a mismatch.

### GitHub environment and ruleset

Create/verify environment `demo`; allow deployment from branch main only (no tags).
The environment name must match deploy.yml and the provider subject condition exactly.
Add these four environment VARIABLES, not secrets:

| Variable | Verified value to supply |
| --- | --- |
| GCP_PROJECT_ID | Actual Episode 5 project ID |
| GCP_REGION | Actual Episode 5 region |
| WIF_PROVIDER | Full provider resource name using project number and actual pool/provider IDs |
| WIF_SERVICE_ACCOUNT | Actual deployer service account email |

No new GitHub secret is required for Episode 6. Leave optional SMOKE_EMAIL/SMOKE_PASSWORD
unset; do not copy DATABASE_URL, SESSION_SECRET or bootstrap passwords into GitHub.

Create/verify an Active `protect-main` ruleset targeting main explicitly: empty bypass list,
restrict deletions, block force pushes, require a PR with one teammate approval, and require
branches to be up to date with the required CI check. Select the check from an actual PR run
(expected job `test-and-docker`); verify its exact context and source, not just typed text.
GitHub reports the main ruleset as active, with deletion and force-push protection,
one required PR approval, and the strict `test-and-docker` check. Capture the rule
settings for the report.

### Validation, evidence and recovery

1. Verify environment restrictions, four variables, WIF mappings/condition, scoped IAM,
   empty deployer key list and Active ruleset. This proves configuration, not authentication.
2. For C-02, use the existing [merge-gate test PR #39](https://github.com/PAKATO123/CPE-334-E-Commerce-or-Ordering-System/pull/39).
   Its required `test-and-docker` check failed. GitHub also reports merge conflicts and
   review required, so record those conditions alongside the check failure. Keep the
   failing test out of main and follow Guide 6.6 for closing the proof PR.
3. Close the setup Issue with direct links and numbered, readable screenshots: WIF condition
   and mappings; scoped account permissions and no keys; demo variables/main restriction;
   Active ruleset/required check/empty bypass; failed PR with blocked merge. Include commit/run
   IDs and the check proved. Hide secrets and project numbers per Guide 6.7; never show tokens.

If WIF rejects a token, compare repository/owner IDs, main ref, exact workflow path,
environment, subject format and audience; never print the token or relax the trust condition.
For permission failures, inspect the failing operation and the intended scoped binding before
adding rights; allow IAM propagation time. If a check cannot be selected, verify its prior run
and exact name. If merging is still possible, inspect enforcement, bypasses and target/check
selection. Recover a mistaken setting through the repository/project administrator, recording
the correction; do not bypass the gate or push directly to main.

Episode 6 needs no new database or service deployment. Existing Cloud SQL still costs while
running; budget alerts are not caps. PR validation consumes runner usage. Do not run bootstrap,
release or teardown scripts for WIF setup, and do not pause the app during grading.

## Episode 7: automated releases

GitHub `main` runs [Deploy demo](../../../.github/workflows/deploy.yml) on pushes.
The workflow runs CI, authenticates through WIF, builds and pushes a full-SHA image
tag, waits for migrations and seed, updates Cloud Run traffic, and runs public
smoke checks. Manual dispatch on `main` accepts an existing full SHA for an image
restore. An empty input runs the normal release path.

### Verified release record

GitHub Actions logs show both releases passed CI, keyless authentication,
migration and deployment, and public smoke checks. Cloud Run reported 100%
traffic to the revision shown for each run at deployment time. Health, readiness,
HTML and categories passed on both runs. Optional customer login was skipped on both.

| Release | Merge and workflow run | Full image tag | Image digest | Cloud Run revision | Migration execution | Catalog heading in release source |
| --- | --- | --- | --- | --- | --- |
| A | [PR #43](https://github.com/PAKATO123/CPE-334-E-Commerce-or-Ordering-System/pull/43) / [Deploy demo](https://github.com/PAKATO123/CPE-334-E-Commerce-or-Ordering-System/actions/runs/43718682232) | `717257ff78a5af4b575d2aeac98ca788370da2f8` | `sha256:b5dccdcffe6bdabb7ce7fcdfba9e37ecc2b6f49441148e02996ff561c1f0ad31` | `techtent-00002-brv` | `techtent-migrate-lgr27` | Everyday Tech Essentials |
| B | [PR #45](https://github.com/PAKATO123/CPE-334-E-Commerce-or-Ordering-System/pull/45) / [Deploy demo](https://github.com/PAKATO123/CPE-334-E-Commerce-or-Ordering-System/actions/runs/43722710791) | `e17f136f543a4ebb1336e36b714149bb598febc8` | `sha256:a33e30cbfd7ba8dc82d22d47cb810ee5ebfdd5248ca2d0ec0060e2f302772cfc` | `techtent-00003-smt` | `techtent-migrate-lh2dh` | Discover Your Next Tech Upgrade |

The [first automatic attempt](https://github.com/PAKATO123/CPE-334-E-Commerce-or-Ordering-System/actions/runs/43711691833)
authenticated successfully, then failed before migration because whitespace in the region
produced an invalid Docker tag. [PR #42](https://github.com/PAKATO123/CPE-334-E-Commerce-or-Ordering-System/pull/42)
added region trimming. The next two releases passed.

For future releases, open a reviewed feature PR into `lab-5-staging`, then a reviewed
release PR into `main`. Link the Issue, both PRs, CI and deployment run. Verify that the
summary's SHA and digest match Artifact Registry and the serving revision, then capture the
public catalog and relevant business workflow for the evidence report.

### Offline validation

From the repository root, with Bash and existing server dependencies available:

```bash
bash -n deploy/deploy.sh
bash -n deploy/release.sh
bash -n deploy/teardown.sh
bash deploy/tests/test_deploy_stub.sh
bash deploy/tests/test_release_stub.sh
python -B -m unittest discover -s deploy/tests -p 'test_*.py'
node server/node_modules/typescript/bin/tsc --noEmit -p server/tsconfig.json
npm --prefix server run test:unit
git diff --check
```

Use Git Bash on Windows and `npm.cmd` when running npm from PowerShell. The stubs replace
`gcloud` and `openssl`. The Python suite checks smoke behavior and workflow guards for
main-only triggers, CI, release gates, concurrency and token permissions.

### Failures, costs and evidence

CI/image-resolution/migration failures block service update. Migration failure may still
leave earlier database changes, so keep migrations additive/backward compatible and inspect
job logs before retrying. Service update or traffic failures require checking the actual
serving revision; do not assume nothing changed. Smoke runs AFTER traffic changes: failure
marks the run red but does not automatically roll back. Inspect revision logs and use only
an explicitly authorized rollback to a known SHA if needed; rollback does not undo the DB.

For WIF/settings/permission failures, follow Episode 6 recovery above; do not broaden trust,
grant Owner/Editor or print tokens. After correcting configuration (not code), an authorized
operator can rerun the failed workflow; code changes go through reviewed PRs. Do not deploy
while SQL is paused. Concurrency avoids interrupting a running deployment; do not cancel a
migration to hurry the next release. Existing SQL/storage and later CI/image use may incur
costs; this local preparation creates no GCP usage and does not stop existing cloud billing.

Evidence checkpoints for C-06 and the repeatable-release rubric:

- Direct Issue, reviewed staging PR, release PR and passing CI links, with specific teammate
  review and full release SHA; keep both members' contributions traceable.
- Successful Deploy demo run and smoke output; summary showing SHA, digest, URL and login
  PASS/SKIP. Prefer links; use screenshots where the link alone does not establish the result.
- Console screenshots: serving revision with 100% traffic and matching digest; successful
  migration execution; registry tag matching the release SHA.
- Second-release run/revision and public URL screenshot showing the visible change. Caption
  each screenshot with check/requirement, commit/run/URL; hide credentials, tokens and secrets.
- Keep restart/redeploy persistence and rollback/roll-forward evidence for Episode 8; do not
  claim that a green smoke check proves persistence. Keep the service available for grading.

## Episode 8: database persistence and image rollback

Follow Student Guide 8.1-8.3 (pages 92-95) and handout C-05/R-04. Capture
live results for each stage in the table below.

### Prerequisites and baseline

- Use the full A and B image tags in the [verified release record](#verified-release-record).
  Confirm both digests still exist in Artifact Registry and support the current schema.
  Confirm B is serving before creating the baseline order.
- Verify the public service, running SQL database, WIF, main-only demo environment and
  its four variables. Retain persistent DATABASE_URL and SESSION_SECRET across restores.
- Use a CUSTOMER account with password change completed; keep credentials and session
  cookies private. Agree on a quiet verification interval so other orders or operator
  actions do not change the observed order or stock unexpectedly.

While B is serving, sign in through /login and select an ordinary active, in-stock product
in the catalog (/). Do not use SIM-ATOM-FAIL. Record its actual product ID/SKU and stock
from the UI or GET /api/products/:id. Place one quantity-one order through the cart.
API equivalent, using the customer's existing cookie session, is POST /api/orders with
an items array containing the selected actual productId and quantity 1; do not invent IDs.
If a request times out, inspect order history before retrying: checkout has no idempotency
key and a blind retry could create another order.

Open /orders and /orders/:id, or authenticated GET /api/orders and GET /api/orders/:id.
Capture the actual order ID/number, customer identity (sanitized), status, product IDs/SKUs,
quantities, stored unit prices, subtotals, total and creation time. Record stock immediately
AFTER checkout as the comparison baseline; do not expect the pre-checkout stock to return.
Use GET /api/auth/me to check session identity without exposing the cookie. No API currently
supports an arbitrary persistence marker or order deletion; do not invent those operations.

| Evidence stage | Release SHA/digest/revision | Same order fields | Post-order stock | Session identity | Actual result/run link |
| --- | --- | --- | --- | --- | --- |
| Baseline on B | Record actual values | Record actual values | Record actual value | Record privately/sanitize | Not run |
| Application restart | Record actual environment/version | Compare baseline | Compare baseline | Compare baseline | Not run |
| Image restore A | Record actual values | Compare baseline | Compare baseline | Compare baseline | Not run |
| Image restore B | Record actual values | Compare baseline | Compare baseline | Compare baseline | Not run |

Product labels may be read from the current catalog; prioritize stored line-item prices,
quantities and order identifiers for historical integrity. Record legitimate concurrent
changes separately rather than labelling every stock/status difference a persistence failure.

### Restore image A, verify, then restore B (live authorization required)

1. Open Actions -> Deploy demo -> Run workflow, select main, and enter A's verified full
   SHA in image_tag. This is a real release operation; do not dispatch during local checks.
2. Confirm tests/build are skipped, the migration job is not executed, and deploy/smoke
   checks pass. Match DEPLOYED_IMAGE in the summary to A's actual registry digest.
3. In Cloud Run verify the resulting serving revision uses that digest with 100% traffic.
   Hard-refresh the browser: B's visible change should be absent. Without logging out,
   check the same order, stored amounts, post-order stock and signed-in identity.
4. Run the workflow on main with B's verified SHA. It reuses B's existing image with the
   same skip behavior; confirm digest/traffic, visible change and the baseline data again.
5. An empty image_tag instead performs a normal current-main release: CI, rebuild,
   migration and non-destructive seed. Use this only when explicitly choosing to verify
   that path. A SHA-based roll-forward does not exercise migration/seed again.

The current release.sh does NOT route traffic directly to a named existing Cloud Run
revision. It resolves the requested SHA tag to an existing image digest, updates the
service image, then requests --to-latest traffic. Cloud Run may create a new revision;
record the actual result, never assume the old revision name is restored. This is the
guide's image-based rollback. Neither the rollback nor SHA-based roll-forward reverses
Prisma migrations, deletes SQL data, executes seed, or provisions cloud resources.
The workflow's explicit image restore still smoke-tests the service.

### Separate application restart evidence

Restart, redeployment and image rollback are different events. An A/B workflow run proves
an image redeployment; it is not separate evidence that the same app process restarted.
For an approved isolated local stack, record its own baseline and running server identity,
then use docker compose restart server (no build, migration or volume deletion) and repeat
the UI/API checks. This restarts only the API container; do not restart/delete the database.
Label these screenshots LOCAL with the actual commit and environment; never present a local
order as a production record or local restart as proof of a cloud-instance restart.

If live cloud restart evidence is required, first agree on a supported app-instance
replacement/restart method and its observable proof after inspecting the actual environment.
Keep that operation separately authorized; do not improvise SQL restarts, service deletion,
volume removal, or claim that the deploy script has a restart-only mode. The final C-05
index must identify which event and environment each before/after pair actually proves.

### Offline validation and limits

Run shell syntax checks, deploy/release stubs, offline Python tests, backend no-emit
TypeScript validation, unit tests and git diff --check as listed in Episode 7. The release
stub uses synthetic A/B tags and distinct digests: it asserts exact image lookup/update,
update-before-traffic ordering, --to-latest selection and no migration/build/seed/provisioning
for either image restore. It fails closed on unknown cloud operations and blocks direct
build/seed tools. Its modeled traffic is not real Cloud Run revision verification.
Existing seed tests use a persistence double; no stub or green health check proves real
PostgreSQL data or sessions survived. Database-writing integration checks require a
separately approved disposable database. Do not use the production DB for test suites.

### Recovery, costs and screenshots

Stop on a missing image, failed smoke or unexpected record difference. Inspect workflow,
revision and migration logs privately before choosing recovery. The application may already
be receiving traffic when smoke fails; rollback is not automatic. Do not repair evidence by
re-seeding/resetting SQL, recreating orders or forcing original stock back into the catalog.
Choose only an available image compatible with the CURRENT schema. Old images with unsafe
seed behavior must never be run through the normal migration/seed path. Rotating a session
secret or logging out invalidates session-continuity evidence; document it honestly.

No additional paid resources are needed for the procedure, but running Cloud SQL, image
storage, pipeline runners and Cloud Run requests still cost. Local stubs cause no GCP usage
and do not stop existing cloud billing. Keep the service available during grading; do not
pause SQL during these checks. Preserve the test order unless later cleanup is separately
approved through supported application behavior.

Evidence checkpoints: direct links to releases A/B and rollback/forward runs; before/after
order receipts and catalog stock at the same public URL; session continuity without visible
cookies; skipped test/build and no new migration execution for image restores; summary SHA
and digest matched to actual serving revision/100% traffic; B's visible change absent on A
and restored on B; separately labelled restart evidence. Number each screenshot with its
check (C-05/R-04), actual commit/run/URL/environment and result. Mask passwords, tokens and
unneeded customer details. Attachments/checksums in the TokTickIT example do not apply:
TechTent has no supported customer attachment workflow. Close the Episode 8 Issue with
sanitized results only after live checks actually pass; never fill the table with assumed results.

## Release identification

Record full GitHub main SHA, successful Cloud Build, image digest and Cloud Run revision
for the manual release. Initial bootstrap uses :latest, so record its digest at deployment
time; do not use the mutable tag alone as proof. The current commit is not exposed by an API.
For automated releases, use the full SHA and digest from the Actions summary and
record the migration execution and serving revision. For image restores, use the
requested image SHA from the summary because GitHub executes the workflow from main.

## Evidence checklist

- Record each command/test name, result and tested commit; link CI runs rather than claiming
  that a local stub proves real cloud connectivity.
- Episode 5: public URL and browser login, health/readiness/smoke results; Console evidence
  of PostgreSQL 16/database, storage auto-increase OFF, registry image, runtime Cloud SQL
  Client role and per-secret accessor permissions, secret names only, service env sources,
  minimum 0 / maximum 3 instances. Close the setup Issue with sanitized evidence.
- C-01: passing PR builds/tests into staging and main. C-02 (Episode 6): temporary failing
  test PR with required check failure and blocked merge; never merge the broken test.
- C-03: clean-clone build/run and environment table. C-04: customer sign-in, order placement,
  and a stock-rule rejection or access restriction at the public URL (not just health).
- C-05 (Episode 8): same order and relevant inventory before/after BOTH restart and redeploy.
  C-06: Issue -> reviewed staging PR -> release PR -> CI -> deployment, matching serving commit.
- Final PDF: Answer Parts 0-4; evidence index with direct links, result and commit/version.
  Number screenshots and state their check, commit/run/URL. Keep text readable; hide secrets.
  Submit one team PDF named lab5_sec<section>_<group name>.pdf; keep repo public and service
  available until grading ends. Include both members' contributions and specific reviews.

Cloud SQL incurs charges while running; budget alerts do not cap spending. Do not pause
while grading or deployment is in progress. Teardown is end-of-term only with explicit
approval: it deletes data and now includes the session secret. Verify leftovers and billing;
the script does not remove Cloud Build buckets or Episode 6 deployer/WIF resources.
