import { getPrisma } from "../src/prisma.js";
import bcrypt from "bcryptjs";

const DEFAULT_SEED_PASSWORD = process.env.SEED_DEFAULT_PASSWORD || "Password123!";
const DEFAULT_PASSWORD_HASH = bcrypt.hashSync(DEFAULT_SEED_PASSWORD, 10);

export const USERS = [
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

  console.log("Seeding TechTent catalog products (USD)...");
  for (const p of PRODUCTS) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        name: p.name,
        category: p.category,
        description: p.description,
        price: p.price,
        stockQuantity: p.stockQuantity,
        isActive: p.isActive,
      },
      create: p,
    });
  }
  console.log("TechTent catalog seeded successfully.");
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
