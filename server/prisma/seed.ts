import { getPrisma } from "../src/prisma.js";
import bcrypt from "bcryptjs";
import type { PrismaClient } from "@prisma/client";
import { pathToFileURL } from "node:url";

const DEMO_USERS = [
  // Customers
  {
    email: "customer1@example.com",
    name: "Alice Customer",
    role: "CUSTOMER" as const,
    isActive: true,
    mustChangePassword: false,
  },
  {
    email: "customer2@example.com",
    name: "Bob Customer",
    role: "CUSTOMER" as const,
    isActive: true,
    mustChangePassword: false,
  },
  {
    email: "customer3@example.com",
    name: "David NewCustomer",
    role: "CUSTOMER" as const,
    isActive: true,
    mustChangePassword: true,
  },
  {
    email: "deactivated@example.com",
    name: "Eve Deactivated",
    role: "CUSTOMER" as const,
    isActive: false,
    mustChangePassword: false,
  },
  // Operators
  {
    email: "operator1@example.com",
    name: "Charlie Operator",
    role: "OPERATOR" as const,
    isActive: true,
    mustChangePassword: false,
  },
];

export const PRODUCTS = [
  {
    sku: "PHON-PRO-256",
    name: "Flagship Pro Smartphone 256GB",
    category: "Smartphones",
    description: "6.7-inch Super Retina OLED display, 5G flagship processor, pro triple-camera array.",
    price: 899.00,
    stockQuantity: 10,
    isActive: true,
  },
  {
    sku: "TAB-ULTRA-11",
    name: "Ultra Tablet 11\" 128GB",
    category: "Tablets",
    description: "11-inch Liquid Crystal 120Hz display, stylus compatible, lightweight aluminum chassis.",
    price: 549.00,
    stockQuantity: 8,
    isActive: true,
  },
  {
    sku: "TV-SMART-55",
    name: "55\" 4K Smart OLED TV",
    category: "Smart TVs",
    description: "Cinematic 4K UHD OLED screen, HDR10+, Dolby Atmos, voice remote with smart OS.",
    price: 699.00,
    stockQuantity: 5,
    isActive: true,
  },
  {
    sku: "KB-MECH-RGB",
    name: "Wireless Mechanical Keyboard",
    category: "Keyboards",
    description: "Multi-device Bluetooth/2.4GHz RGB mechanical keyboard with hot-swappable tactile switches.",
    price: 79.00,
    stockQuantity: 15,
    isActive: true,
  },
  {
    sku: "CHG-GAN-65W",
    name: "65W GaN Fast Charger USB-C",
    category: "Chargers & Power",
    description: "Compact dual-port USB-C + USB-A GaN wall charger with high-speed power delivery.",
    price: 29.00,
    stockQuantity: 25,
    isActive: true,
  },
  {
    sku: "PHON-FLIP-LTD",
    name: "Flip Smartphone Limited Edition",
    category: "Smartphones",
    description: "Foldable AMOLED flexible display, compact folding form-factor, dual battery system.",
    price: 999.00,
    stockQuantity: 0, // Demonstrates Out-of-Stock handling (AC-CAT-03)
    isActive: true,
  },
  {
    sku: "DISCONT-OLD-GEN",
    name: "Discontinued 30-Pin Legacy Cable",
    category: "Chargers & Power",
    description: "Legacy sync and charge cable for obsolete equipment.",
    price: 9.99,
    stockQuantity: 50,
    isActive: false, // Demonstrates Inactive exclusion (AC-CAT-02)
  },
  {
    sku: "SIM-ATOM-FAIL",
    name: "[Simulation] Atomicity Stress Test Device",
    category: "Smartphones",
    description: "Special simulation device displaying 1 in stock to simulate race conditions and test atomic transaction rollback upon checkout.",
    price: 99.00,
    stockQuantity: 1, // Displays 1 in stock, triggers 409 rollback at checkout
    isActive: true,
  },
];

type SeedEnvironment = Record<string, string | undefined>;

export function seedUsers(env: SeedEnvironment) {
  const production = env.NODE_ENV === "production";
  if (env.SEED_DEMO_DATA !== undefined && !["true", "false"].includes(env.SEED_DEMO_DATA)) {
    throw new Error("SEED_DEMO_DATA must be true or false.");
  }
  const demo = env.SEED_DEMO_DATA === "true";
  if (production && !env.ADMIN_PASSWORD?.trim()) throw new Error("ADMIN_PASSWORD is required in production.");
  if (production && demo && !env.DEMO_USER_PASSWORD?.trim()) {
    throw new Error("DEMO_USER_PASSWORD is required when production demo seeding is enabled.");
  }
  const adminPassword = env.ADMIN_PASSWORD || "Password123!"; // Local/test only fallback.
  const users = [{
    email: "admin@example.com", name: "System Admin", role: "ADMIN" as const,
    isActive: true, mustChangePassword: true, passwordHash: bcrypt.hashSync(adminPassword, 10),
  }];
  return [
    ...users,
    ...(demo ? DEMO_USERS.map(user => ({
      ...user, passwordHash: bcrypt.hashSync(env.DEMO_USER_PASSWORD || "Password123!", 10),
    })) : []),
  ];
}

export async function main(env: SeedEnvironment = process.env, client?: Pick<PrismaClient, "user" | "product">) {
  // Validate all credentials before opening a connection or writing any records.
  const users = seedUsers(env);
  const prisma = client ?? getPrisma();
  for (const user of users) {
    await prisma.user.upsert({ where: { email: user.email }, update: {}, create: user });
  }
  for (const product of PRODUCTS) {
    await prisma.product.upsert({ where: { sku: product.sku }, update: {}, create: product });
  }
  console.log("TechTent seed completed; existing users, inventory and orders preserved.");
}

// Importing the seed from tests or tooling must never execute it automatically.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(() => {
    // Driver errors can contain connection details; do not print raw errors.
    console.error("TechTent seed failed. Check required seed variables and database availability privately.");
    process.exitCode = 1;
  }).finally(async () => { await getPrisma().$disconnect(); });
}
