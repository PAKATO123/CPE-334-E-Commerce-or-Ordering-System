import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { configureDatabaseTests } from "../server/dist/utils/testDatabaseSafety.js";
import { getPrisma } from "../server/dist/prisma.js";

configureDatabaseTests();
const prisma = getPrisma();
try {
  const [identity] = await prisma.$queryRaw`
    SELECT current_database() AS database, current_user AS username
  `;
  if (identity?.database !== "techtent_test" || identity?.username !== "techtent_test") {
    throw new Error("Refusing browser tests outside the disposable test database.");
  }
} finally {
  await prisma.$disconnect();
}

if (!existsSync(new URL("../client/dist/index.html", import.meta.url))) {
  throw new Error("Build the client before running the browser tests.");
}
process.chdir(fileURLToPath(new URL("../server/", import.meta.url)));
process.env.NODE_ENV = "development";
process.env.COOKIE_SECURE = "false";
const { app } = await import("../server/dist/app.js");
app.listen(55436, "127.0.0.1");
