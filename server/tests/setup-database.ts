import { configureDatabaseTests } from "../src/utils/testDatabaseSafety.js";

// Runs before each test module is imported, including legacy top-level Prisma calls.
configureDatabaseTests();
