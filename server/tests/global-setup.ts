import teardown from "./teardown.js";
import { configureDatabaseTests } from "../src/utils/testDatabaseSafety.js";
import { getPrisma } from "../src/prisma.js";

export async function setup() {
  configureDatabaseTests();
  const prisma = getPrisma();
  const [identity] = await prisma.$queryRaw<{ database: string; username: string }[]>`
    SELECT current_database() AS database, current_user AS username
  `;
  if (identity?.database !== "techtent_test" || identity?.username !== "techtent_test") {
    await prisma.$disconnect();
    throw new Error("Refusing database tests: connected database identity is not techtent_test.");
  }
  // Return the teardown callback to run when Vitest finishes testing
  return async () => {
    await teardown();
  };
}
