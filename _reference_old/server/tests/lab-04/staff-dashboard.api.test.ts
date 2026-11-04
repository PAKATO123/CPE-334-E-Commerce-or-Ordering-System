import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import app from "../../src/app";
import { getPrisma } from "../../src/prisma";

describe("Lab 04 - Staff & Admin Dashboard API Integration Tests", () => {
  beforeEach(async () => {
    const prisma = getPrisma();
    const defaultHash = bcrypt.hashSync("Password123!", 10);
    await prisma.user.updateMany({
      where: {
        email: {
          in: [
            "requester1@toktickit.local",
            "staff1@toktickit.local",
            "admin@toktickit.local",
          ],
        },
      },
      data: { passwordHash: defaultHash, mustChangePassword: false },
    });
  });

  it("should return unassigned, owned, priority, and follow-up metrics for IT Staff", async () => {
    const agent = request.agent(app);

    // Login as IT Staff
    const loginRes = await agent.post("/api/auth/login").send({
      email: "staff1@toktickit.local",
      password: "Password123!",
    });
    expect(loginRes.status).toBe(200);

    // Request Staff Dashboard data
    const res = await agent.get("/api/dashboard/staff");
    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.metrics).toBeDefined();
    expect(typeof res.body.data.metrics.unassignedCount).toBe("number");
    expect(typeof res.body.data.metrics.myOwnedCount).toBe("number");
    expect(typeof res.body.data.metrics.urgentHighCount).toBe("number");
    expect(typeof res.body.data.metrics.followUpCount).toBe("number");
    expect(res.body.data.statusDistribution).toBeDefined();
    expect(Array.isArray(res.body.data.recentActivity)).toBe(true);
  });

  it("should return staff metrics plus user account statistics for Administrator", async () => {
    const agent = request.agent(app);

    // Login as Admin
    const loginRes = await agent.post("/api/auth/login").send({
      email: "admin@toktickit.local",
      password: "Password123!",
    });
    expect(loginRes.status).toBe(200);

    // Request Admin Dashboard data
    const res = await agent.get("/api/dashboard/admin");
    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.metrics).toBeDefined();
    expect(res.body.data.userStats).toBeDefined();
    expect(typeof res.body.data.userStats.totalUsers).toBe("number");
    expect(typeof res.body.data.userStats.requesterCount).toBe("number");
    expect(typeof res.body.data.userStats.staffCount).toBe("number");
    expect(typeof res.body.data.userStats.adminCount).toBe("number");
  });

  it("should reject Requester access to Staff and Admin dashboard endpoints with 403 Forbidden", async () => {
    const agent = request.agent(app);

    // Login as Requester
    await agent.post("/api/auth/login").send({
      email: "requester1@toktickit.local",
      password: "Password123!",
    });

    const staffRes = await agent.get("/api/dashboard/staff");
    expect(staffRes.status).toBe(403);

    const adminRes = await agent.get("/api/dashboard/admin");
    expect(adminRes.status).toBe(403);
  });
});
