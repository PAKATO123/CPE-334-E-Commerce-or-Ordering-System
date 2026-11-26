import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { getPrisma } from "../src/prisma.js";

describe("Feature 9: Sales Reporting & Turnaround API Integration Tests (F-09)", () => {
  const prisma = getPrisma();
  let operatorAgent: any;
  let customerAgent: any;
  const unauthenticatedAgent = request(app);

  beforeAll(async () => {
    // Ensure operator does not have mustChangePassword
    await prisma.user.updateMany({
      where: { email: "operator1@example.com" },
      data: { mustChangePassword: false },
    });

    operatorAgent = request.agent(app);
    await operatorAgent.post("/api/auth/login").send({
      email: "operator1@example.com",
      password: "Password123!",
    });

    customerAgent = request.agent(app);
    await customerAgent.post("/api/auth/login").send({
      email: "customer1@example.com",
      password: "Password123!",
    });
  });

  afterAll(async () => {
    try {
      await prisma.$disconnect();
    } catch {}
  });

  it("TEST-REP-07: rejects unauthenticated requests with 401", async () => {
    const resSummary = await unauthenticatedAgent.get("/api/reports/sales-summary");
    expect(resSummary.status).toBe(401);

    const resTurnaround = await unauthenticatedAgent.get("/api/reports/turnaround");
    expect(resTurnaround.status).toBe(401);
  });

  it("TEST-REP-06: rejects customer requests with 403 Forbidden", async () => {
    const resSummary = await customerAgent.get("/api/reports/sales-summary");
    expect(resSummary.status).toBe(403);

    const resTurnaround = await customerAgent.get("/api/reports/turnaround");
    expect(resTurnaround.status).toBe(403);
  });

  it("TEST-REP-01: allows operator to retrieve sales summary with structured totals and counts", async () => {
    const res = await operatorAgent.get("/api/reports/sales-summary");
    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();

    const data = res.body.data;
    expect(typeof data.totalRevenue).toBe("string");
    expect(typeof data.totalOrders).toBe("number");
    expect(typeof data.averageOrderValue).toBe("string");
    expect(data.statusCounts).toBeDefined();
    expect(typeof data.statusCounts.PENDING).toBe("number");
    expect(typeof data.statusCounts.ACCEPTED).toBe("number");
    expect(typeof data.statusCounts.SHIPPED).toBe("number");
    expect(typeof data.statusCounts.CANCELLED).toBe("number");
    expect(data.paymentStatusCounts).toBeDefined();
    expect(typeof data.paymentStatusCounts.UNPAID).toBe("number");
    expect(typeof data.paymentStatusCounts.PAID).toBe("number");
  });

  it("TEST-REP-02: supports filtering sales summary by date range", async () => {
    const startDate = "2020-01-01T00:00:00.000Z";
    const endDate = "2099-12-31T23:59:59.999Z";

    const res = await operatorAgent.get(
      `/api/reports/sales-summary?startDate=${startDate}&endDate=${endDate}`
    );
    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
  });

  it("TEST-REP-05: allows operator to retrieve turnaround metrics", async () => {
    const res = await operatorAgent.get("/api/reports/turnaround");
    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();

    const data = res.body.data;
    expect(typeof data.shippedOrderCount).toBe("number");
    expect(typeof data.averageTurnaroundHours).toBe("number");
    expect(typeof data.averageTurnaroundMinutes).toBe("number");
    expect(typeof data.fastestTurnaroundMinutes).toBe("number");
    expect(typeof data.slowestTurnaroundMinutes).toBe("number");
  });
});
