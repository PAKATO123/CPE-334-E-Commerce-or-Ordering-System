import { getPrisma } from "../src/prisma.js";
import bcrypt from "bcryptjs";

const DEFAULT_PASSWORD_HASH = bcrypt.hashSync("Password123!", 10);

const USERS = [
  // Customers
  {
    email: "customer1@example.com",
    name: "Alice Customer",
    role: "CUSTOMER" as const,
    isActive: true,
    mustChangePassword: false,
    passwordHash: DEFAULT_PASSWORD_HASH,
  },
  {
    email: "customer2@example.com",
    name: "Bob Customer",
    role: "CUSTOMER" as const,
    isActive: true,
    mustChangePassword: false,
    passwordHash: DEFAULT_PASSWORD_HASH,
  },
  {
    email: "customer3@example.com",
    name: "David NewCustomer",
    role: "CUSTOMER" as const,
    isActive: true,
    mustChangePassword: true,
    passwordHash: DEFAULT_PASSWORD_HASH,
  },
  {
    email: "deactivated@example.com",
    name: "Eve Deactivated",
    role: "CUSTOMER" as const,
    isActive: false,
    mustChangePassword: false,
    passwordHash: DEFAULT_PASSWORD_HASH,
  },
  // Operators
  {
    email: "operator1@example.com",
    name: "Charlie Operator",
    role: "OPERATOR" as const,
    isActive: true,
    mustChangePassword: false,
    passwordHash: DEFAULT_PASSWORD_HASH,
  },
  // Admin
  {
    email: "admin@example.com",
    name: "System Admin",
    role: "ADMIN" as const,
    isActive: true,
    mustChangePassword: false,
    passwordHash: DEFAULT_PASSWORD_HASH,
  },
];

export async function main() {
  const prisma = getPrisma();
  console.log("Seeding baseline users...");

  for (const u of USERS) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.role,
        isActive: u.isActive,
        mustChangePassword: u.mustChangePassword,
        passwordHash: u.passwordHash,
      },
      create: u,
    });
  }

  console.log("Baseline users seeded successfully.");
}

if (process.env.NODE_ENV !== "test") {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      const prisma = getPrisma();
      await prisma.$disconnect();
    });
}
