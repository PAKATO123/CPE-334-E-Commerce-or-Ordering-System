import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { configureDatabaseTests } from "../src/utils/testDatabaseSafety.js";

// Never run automatically from install, builds, or test setup. Requires approval.
configureDatabaseTests();
process.env.NODE_ENV = "test";
const { getPrisma } = await import("../src/prisma.js");
const prisma = getPrisma();
try {
  const [identity] = await prisma.$queryRaw<{ database: string; username: string }[]>`
    SELECT current_database() AS database, current_user AS username
  `;
  if (identity?.database !== "techtent_test" || identity?.username !== "techtent_test") {
    throw new Error("Refusing schema initialization: unexpected database identity.");
  }
  const cwd = fileURLToPath(new URL("../", import.meta.url));
  const cli = fileURLToPath(new URL("../node_modules/prisma/build/index.js", import.meta.url));
  const result = spawnSync(process.execPath, [cli, "db", "push", "--skip-generate"], {
    cwd, env: process.env, stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error("Disposable test schema initialization failed.");
  const { main } = await import("../prisma/seed.js");
  await main({ ...process.env, SEED_DEMO_DATA: "true" });
} finally {
  await prisma.$disconnect();
}
