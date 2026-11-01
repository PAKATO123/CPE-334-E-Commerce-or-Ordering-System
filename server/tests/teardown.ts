import { getPrisma } from "../src/prisma.js";

export default async function teardown() {
  const prisma = getPrisma();
  try {
    await prisma.$disconnect();
  } catch (error) {
    console.error("Error in test teardown cleanup:", error);
  }
}
