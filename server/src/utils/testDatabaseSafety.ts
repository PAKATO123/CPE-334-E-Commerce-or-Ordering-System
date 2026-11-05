interface DatabaseTestEnvironment {
  TECHTENT_ALLOW_DATABASE_TESTS?: string;
  TECHTENT_TEST_DATABASE_URL?: string;
  DATABASE_URL?: string;
}

/** Fail closed before Prisma or a database-writing test can use a connection. */
export function disposableTestDatabaseUrl(env: DatabaseTestEnvironment): string {
  if (env.TECHTENT_ALLOW_DATABASE_TESTS !== "1") {
    throw new Error("Database tests are disabled. Explicit approval and TECHTENT_ALLOW_DATABASE_TESTS=1 are required.");
  }
  const value = env.TECHTENT_TEST_DATABASE_URL;
  if (!value) throw new Error("TECHTENT_TEST_DATABASE_URL must explicitly identify the disposable database.");
  let url: URL;
  try { url = new URL(value); }
  catch { throw new Error("Invalid disposable test database URL."); }
  if (
    url.protocol !== "postgresql:" || url.hostname !== "127.0.0.1" || url.port !== "55435" ||
    url.pathname !== "/techtent_test" || url.username !== "techtent_test" ||
    url.password !== "techtent_test_local_only" || url.hash ||
    url.search !== "?schema=public"
  ) {
    throw new Error("Refusing database tests: use only the dedicated loopback test container on port 55435, database/user techtent_test, schema public.");
  }
  return value;
}

export function configureDatabaseTests(env: DatabaseTestEnvironment = process.env): string {
  const target = disposableTestDatabaseUrl(env);
  env.DATABASE_URL = target;
  return target;
}

export function assertDatabaseTestConnection(env: DatabaseTestEnvironment = process.env): string {
  const target = disposableTestDatabaseUrl(env);
  if (env.DATABASE_URL !== target) {
    throw new Error("Refusing database tests: DATABASE_URL differs from the approved disposable target.");
  }
  return target;
}
