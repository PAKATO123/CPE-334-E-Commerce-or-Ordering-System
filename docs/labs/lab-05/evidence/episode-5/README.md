# Episode 5 deployment evidence index

See the [deployment record and recovery command](../../deployment.md#episode-5-deployment-record-and-evidence).
This index records operator-supplied verification, not newly executed tests. Verified
release identifiers are recorded below. Screenshots are being collected in a Word report;
repository screenshot attachments and the report filename/link remain **[PENDING]**.
No Word report or screenshot files were inspected or attached by this documentation update.

## Deployment identity

- Project/region: pakatopat-project / asia-southeast1.
- URL: https://techtent-693107188088.asia-southeast1.run.app.
- Service/revision: techtent / techtent-00001-b5s; traffic 100% (operator verified).
- SQL: techtent-pg, PostgreSQL 16; storage auto-increase disabled (operator verified).
- Migration: techtent-migrate / techtent-migrate-2h7w4; 1/1 tasks succeeded, exit code 0 (operator verified).
- Deployed full commit SHA: `771945036d260dcf7f8150a5bf628e7f7396df83`.
- Cloud Build ID: `17f37a21-c095-4178-992f-1469f76abce8`; status SUCCESS. Build run link: **[PENDING]**.
- Immutable image digest: `sha256:6acab3358466f55c1c9b988b4fb1cfdb574e6d59f789e73cf0186ab0680e6446`. Registry link: **[PENDING]**.
- Administrator first-login password change: confirmed by operator; supporting attachment pending.
- Deployment date/time/timezone and operator: **[PENDING]**.
- Episode 5 Issue/evidence-comment URL and closure status: **[PENDING]**.

## Evidence manifest

All file/link cells are explicitly pending; they do not claim files or screenshots exist.
Number actual figures when attaching them and replace placeholders with verified relative
file links or direct Console/run links. Link results to the actual deployed SHA and time.

| ID | Check and reported result | Screenshot/direct link | Evidence state |
| --- | --- | --- | --- |
| E5-01 | Cloud Run techtent-00001-b5s, 100% traffic | [PENDING: revision screenshot/link]; verified digest recorded above | Operator verified; artifact missing |
| E5-02 | techtent-migrate-2h7w4: 1/1 tasks succeeded, exit code 0 | [PENDING: execution screenshot/link] | Operator verified; artifact missing |
| E5-03 | techtent-pg PostgreSQL 16; storage auto-increase off | [PENDING: SQL configuration screenshot/link] | Operator verified; artifact missing |
| E5-04 | GET /api/health HTTP 200 | [PENDING: sanitized output/screenshot with URL and time] | Operator verified; artifact missing |
| E5-05 | GET /api/ready HTTP 200, DB connected | [PENDING: sanitized output/screenshot with URL and time] | Operator verified; artifact missing |
| E5-06 | Public frontend loaded | [PENDING: browser screenshot with public URL] | Operator verified; artifact missing |
| E5-07 | Administrator login successful | [PENDING: sanitized signed-in UI screenshot] | Operator verified; artifact missing |
| E5-08 | Build `17f37a21-c095-4178-992f-1469f76abce8` SUCCESS; approximately 1m32s | [PENDING: run link and result screenshot] | Operator verified; artifact missing |
| E5-09 | Build identity roles: project builder, objectAdmin on Cloud Build bucket | [PENDING: scoped IAM evidence] | Operator supplied configuration; artifact missing |
| E5-10 | Runtime IAM, secret names/env sources and min/max instances | [PENDING: sanitized Console evidence] | Not yet verified in supplied results |
| E5-11 | Initial administrator password change confirmed | [PENDING: sanitized supporting evidence; no password retrieval screenshot] | Operator confirmed; repository attachment pending |
| E5-12 | Full public smoke script (health, ready, HTML, categories) | [PENDING: command, result, timestamp and commit] | Not yet verified in supplied results |
| E5-13 | Issue evidence comment/closure | [PENDING: Issue/comment link] | Not yet verified |

Example caption format only: "Figure N. E5-01: serving revision and 100% traffic;
release <verified SHA>, URL <actual URL>, captured <actual time>." Replace placeholders
only with actual values; do not fabricate deployment time, IDs, screenshots or PASS results.

## Execution limitation and completion

The initial deploy/deploy.sh run FAILED at Cloud Build because the default build account
was unavailable. The operator subsequently built using techtent-builder and explicit
source/log bucket settings, then completed migration and Cloud Run deployment separately.
The complete script has NOT been verified end-to-end. Attach sanitized recovery command
history/links when available; do not label this an automatic deployment.

Do not include passwords, connection strings, tokens, cookie headers, secret values or
private credential-retrieval screens. Mask unnecessary personal information. Preserve
original evidence securely and use only sanitized copies here. Archived TokTickIT lab
screenshots are not evidence for this deployment.

Episode 5.8 remains evidence-pending until the manifest is populated and reviewed.
Episodes 6-8 live WIF, automatic releases and persistence/rollback are outside this record.
