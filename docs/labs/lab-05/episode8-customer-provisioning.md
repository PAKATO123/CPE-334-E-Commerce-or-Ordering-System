# One-time Episode 8 CUSTOMER provisioning (proposal)

Prepared for review only. No database connection, insertion, deployment, commit or
push has been performed. Run the commands below only after explicit approval.

The standalone utility is `server/scripts/provision-episode8-customer.mjs`.
It never invokes seed or migrations. It can only insert
`episode8.customer@example.com`, using the application's bcryptjs cost of 10.
An existing account is always returned unchanged, including an inactive account,
a different role or one with an outstanding password-change requirement.
It cannot recover an existing password; do not assume a newly entered password
applies if the result is EXISTS_UNCHANGED.

## Before execution

1. Confirm Cloud Run's actual database is `techtent`, SQL user `techtent`, on
   `pakatopat-project:asia-southeast1:techtent-pg`. Those are the documented names;
   the script rejects another configuration. The database is not named techtent-pg.
2. Have an approved running SQL instance and an already authorized operator with
   Cloud SQL Client access and permission to privately view the existing
   `techtent-database-url` secret. Do not start SQL or alter IAM as part of this utility.
3. Use a trusted workstation and private interactive terminal, without screen
   recording, terminal input logging, transcription or DEBUG logging. Do not pipe
   credentials, put them in command arguments, .env files, GitHub or chat.
4. Use the existing `server/node_modules` Prisma client and bcryptjs dependencies.
   If dependencies are missing or Prisma Client is not generated, stop and prepare
   them separately; this procedure does not install, migrate or seed anything.
5. If another authorized CUSTOMER already has known credentials, prefer reusing it.
   An operator may check active customer metadata read-only in Cloud SQL Studio:

   ```sql
   SELECT id, email, role, "isActive", "mustChangePassword"
   FROM "User"
   WHERE role = 'CUSTOMER' AND "isActive" = true
   ORDER BY id;
   ```

   Never select passwordHash. A usable account also needs a known password and no
   outstanding password-change requirement. Do not reset existing accounts here.

## Secure connection (later, after approval)

Install the official Cloud SQL Auth Proxy v2 if it is not already available.
Use its documented operator authentication (Application Default Credentials);
if not already configured, `gcloud auth application-default login` is a separate
interactive authorization step. It stores credentials in gcloud's managed profile;
never create or download service-account JSON keys for this procedure.

In terminal A, run the proxy and leave it open:

```powershell
.\cloud-sql-proxy.exe --address 127.0.0.1 --port 5433 pakatopat-project:asia-southeast1:techtent-pg
```

Confirm it reports a successful listener for that exact instance. Port 5433 must
be unused before launch. Do not continue if the proxy fails: an unrelated local
database could otherwise be listening there. Do not bind to 0.0.0.0 or open a
database firewall rule. Proxy IAM authentication does not replace the existing
PostgreSQL username/password. For a private-IP-only instance, use an approved
machine with VPC connectivity and the proxy's private-IP option; do not change
instance networking just for this task.

Google reference: https://cloud.google.com/sql/docs/postgres/connect-auth-proxy

## Check, then create only if necessary

In terminal B, from the repository root:

```powershell
node server/scripts/provision-episode8-customer.mjs --check
```

Privately view `techtent-database-url` in Secret Manager and paste it at the hidden
prompt. The script verifies its documented socket target, then adapts it in memory
to 127.0.0.1:5433. The URL is not printed or stored in a file or environment variable.
Output contains only status and selected user metadata, never credentials or hashes.
--check only reads the target account; ABSENT does not mean no other CUSTOMER exists.

If ABSENT, and no other suitable authorized account is available, run:

```powershell
node server/scripts/provision-episode8-customer.mjs --create
```

Supply the database URL again at the hidden prompt. Only if the account is absent,
the utility requests a new customer password twice, with no echo. Use a unique
password stored in your password manager: at least 16 characters with uppercase,
lowercase and a digit, and no more than 72 UTF-8 bytes. The customer password is
different from the database and administrator passwords.

Hidden customer-password entry remains the default. To deliberately show both
customer password entries on your private terminal, use:

```powershell
node server/scripts/provision-episode8-customer.mjs --create --visible-password
```

This option is rejected with --check. The database URL prompt always stays hidden.
Visible entry echoes only during typing; the script does not log the password,
write it to files or include it in errors. Use it only without recording or
transcription, and clear terminal scrollback afterward because the echoed text
can remain visible. All validation and existing-account safeguards still apply.

The utility rechecks existence before insertion. A unique-email race returns
EXISTS_UNCHANGED rather than updating anything. Non-conflict errors stop without
printing raw database exceptions. A connection failure can make an insert's outcome
uncertain: rerun --check before deciding what to do; never reset the account.

## Verification and cleanup

- Run --check again. Expect the exact email, role CUSTOMER, isActive true and
  mustChangePassword false. CREATED means one row was inserted; EXISTS_UNCHANGED
  means the utility did not insert or update that account on that attempt.
- Sign in through the deployed HTTPS application using the privately stored customer
  password. Verify the expected identity and role through /api/auth/me without
  showing the session cookie. Login creates normal session data; the provisioning
  script itself does not create sessions, orders or product changes.
- After login works, begin the separately authorized Episode 8 order baseline.
  Keep the browser session through A/B restores. Provisioning alone is not proof
  of persistence or an Episode 8 pass.
- The utility disconnects Prisma in finally and clears secret references. JavaScript
  cannot guarantee immediate erasure of immutable strings from process memory;
  exit the process after use. Do not save heap dumps or raw diagnostic logs.
- Stop only the proxy started in terminal A using Ctrl+C, clear the clipboard and
  close the private terminal. Retain the test account/order for persistence evidence.
  Do not delete records or stop SQL as cleanup for this script. Do not revoke shared
  gcloud credentials; separately review any temporary operator login you created.

Offline validation, without constructing a database client:

```powershell
node --check server/scripts/provision-episode8-customer.mjs
node --test server/scripts/tests/provision-episode8-customer.test.mjs
```
