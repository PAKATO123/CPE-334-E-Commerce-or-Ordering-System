import { PrismaClient } from "@prisma/client";
import { assertDatabaseTestConnection } from "./utils/testDatabaseSafety.js";

// Lazy singleton: the client is created on first use, not at import time.
// This keeps route modules and tests that don't touch the DB (e.g. /api/health)
// free of database side effects.
let client: PrismaClient | null = null;

export function getPrisma(): PrismaClient {
  const testUrl = process.env.NODE_ENV === "test" ? assertDatabaseTestConnection() : undefined;
  if (!client) client = new PrismaClient(testUrl ? { datasources: { db: { url: testUrl } } } : undefined);
  return client;
}
