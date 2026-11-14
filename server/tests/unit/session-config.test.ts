import { describe, expect, it } from "vitest";
import { sessionConfig } from "../../src/utils/sessionConfig.js";

describe("production session settings", () => {
  it.each([undefined, "", "short", " ".repeat(64)])("rejects missing or inadequate production signing keys", secret => {
    expect(() => sessionConfig({ NODE_ENV: "production", SESSION_SECRET: secret })).toThrow("SESSION_SECRET");
  });
  it("uses the persistent injected key and secure cookies even if COOKIE_SECURE is false", () => {
    const secret = "test-only-session-key-".repeat(3);
    expect(sessionConfig({ NODE_ENV: "production", SESSION_SECRET: secret, COOKIE_SECURE: "false" })).toEqual({ secret, secure: true });
  });
  it("retains HTTP development and test behavior", () => {
    expect(sessionConfig({ NODE_ENV: "test" }).secure).toBe(false);
    expect(sessionConfig({ NODE_ENV: "development", COOKIE_SECURE: "true" }).secure).toBe(true);
  });
});
