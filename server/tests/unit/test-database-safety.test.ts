import { describe, expect, it } from "vitest";
import { assertDatabaseTestConnection, configureDatabaseTests, disposableTestDatabaseUrl } from "../../src/utils/testDatabaseSafety.js";

const target = "postgresql://techtent_test:techtent_test_local_only@127.0.0.1:55435/techtent_test?schema=public";
const approved = () => ({ TECHTENT_ALLOW_DATABASE_TESTS: "1", TECHTENT_TEST_DATABASE_URL: target, DATABASE_URL: target });

describe("disposable database safeguards (no database connection)", () => {
  it("requires explicit opt-in", () => {
    expect(() => disposableTestDatabaseUrl({ ...approved(), TECHTENT_ALLOW_DATABASE_TESTS: undefined })).toThrow("disabled");
  });
  it("never falls back to DATABASE_URL", () => {
    expect(() => disposableTestDatabaseUrl({ ...approved(), TECHTENT_TEST_DATABASE_URL: undefined })).toThrow("explicitly");
  });
  it.each([
    "not-a-url", target.replace("postgresql:", "postgres:"),
    target.replace("127.0.0.1", "localhost"), target.replace("127.0.0.1", "database.example.com"),
    target.replace(":55435/", ":5432/"), target.replace("/techtent_test?", "/ecommerce_db?"),
    target.replace("techtent_test:", "postgres:"), target.replace("schema=public", "schema=private"),
    `${target}&host=development`, `${target}&dbname=ecommerce_db`, `${target}#fragment`,
  ])("rejects unsupported target %s", (url) => {
    expect(() => disposableTestDatabaseUrl({ ...approved(), TECHTENT_TEST_DATABASE_URL: url })).toThrow();
  });
  it("rejects DATABASE_URL changes after configuration", () => {
    expect(() => assertDatabaseTestConnection({ ...approved(), DATABASE_URL: "postgresql://postgres:password@127.0.0.1:5432/ecommerce_db" })).toThrow("differs");
  });
  it("explicitly redirects test workers to the approved disposable target", () => {
    const env = { ...approved(), DATABASE_URL: "development-placeholder" };
    expect(configureDatabaseTests(env)).toBe(target);
    expect(env.DATABASE_URL).toBe(target);
    expect(assertDatabaseTestConnection(env)).toBe(target);
  });
});
