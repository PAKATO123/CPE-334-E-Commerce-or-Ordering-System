import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import app from "../../src/app";
import { getPrisma } from "../../src/prisma";

describe("Lab 04 - Requester Dashboard API Integration Tests", () => {
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

  it("should return user-isolated open, waiting, and recent ticket metrics for Requester", async () => {
    const agent = request.agent(app);

    // Login as Requester
    const loginRes = await agent.post("/api/auth/login").send({
      email: "requester1@toktickit.local",
      password: "Password123!",
    });
    expect(loginRes.status).toBe(200);

    // Request Requester Dashboard data
    const res = await agent.get("/api/dashboard/requester");
    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.metrics).toBeDefined();
    expect(typeof res.body.data.metrics.totalOpen).toBe("number");
    expect(typeof res.body.data.metrics.waitingForRequester).toBe("number");
    expect(Array.isArray(res.body.data.recentlyUpdated)).toBe(true);
    expect(Array.isArray(res.body.data.recentlyResolved)).toBe(true);
  });

  it("should prevent unauthenticated access to Requester dashboard endpoint", async () => {
    const res = await request(app).get("/api/dashboard/requester");
    expect(res.status).toBe(401);
  });
});
