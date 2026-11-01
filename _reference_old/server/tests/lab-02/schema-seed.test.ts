import { describe, it, expect } from "vitest";
import { getPrisma } from "../../src/prisma.js";

describe("Lab 02 Feature 1 — Schema & Seed Verification", () => {
  const prisma = getPrisma();

  it("seeds 4 active categories", async () => {
    const categories = await prisma.category.findMany({ orderBy: { id: "asc" } });
    expect(categories.length).toBe(4);
    expect(categories.every((c) => c.isActive === true)).toBe(true);
    expect(categories.map((c) => c.name)).toEqual([
      "Account and Access",
      "Hardware",
      "Software",
      "Network",
    ]);
  });

  it("seeds 5 requesters (4 active, 1 inactive)", async () => {
    const requesters = await prisma.requester.findMany({ orderBy: { id: "asc" } });
    expect(requesters.length).toBe(5);

    const activeRequesters = requesters.filter((r) => r.isActive);
    const inactiveRequesters = requesters.filter((r) => !r.isActive);

    expect(activeRequesters.length).toBe(4);
    expect(inactiveRequesters.length).toBe(1);
    expect(inactiveRequesters[0].email).toBe("eve.inactive@example.com");
  });

  it("seeds at least 6 active related systems", async () => {
    const systems = await prisma.relatedSystem.findMany({ orderBy: { id: "asc" } });
    expect(systems.length).toBeGreaterThanOrEqual(6);
    expect(systems.every((s) => s.isActive === true)).toBe(true);
  });
});
