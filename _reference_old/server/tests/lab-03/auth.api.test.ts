import { describe, it, expect, afterAll, beforeEach } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

describe("Lab 03 Feature 2 — Authentication & Password Change API (auth.api.test.ts)", () => {
  beforeEach(async () => {
    const prisma = getPrisma();
    const defaultHash = bcrypt.hashSync("Password123!", 10);
    await prisma.user.updateMany({
      where: { email: { in: ["requester1@toktickit.local", "requester4@toktickit.local"] } },
      data: { passwordHash: defaultHash, mustChangePassword: true },
    });
  });

  afterAll(async () => {
    const prisma = getPrisma();
    const defaultHash = bcrypt.hashSync("Password123!", 10);
    await prisma.user.updateMany({
      where: { email: { in: ["requester1@toktickit.local", "requester4@toktickit.local"] } },
      data: { passwordHash: defaultHash, mustChangePassword: true },
    });
  });
  it("rejects login attempt with missing email or password with 400 Bad Request", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "requester1@toktickit.local" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("MISSING_FIELDS");
  });

  it("rejects login attempt with invalid password with 401 Unauthorized", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "requester1@toktickit.local", password: "WrongPassword!" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("rejects login attempt for deactivated user account with 401 Unauthorized", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "requester5@toktickit.local", password: "Password123!" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("ACCOUNT_DEACTIVATED");
  });

  it("authenticates valid credentials, sets session cookie, and returns user object", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "requester1@toktickit.local", password: "Password123!" });

    expect(res.status).toBe(200);
    expect(res.header["set-cookie"]).toBeDefined();
    expect(res.body.user).toMatchObject({
      email: "requester1@toktickit.local",
      role: "REQUESTER",
      isActive: true,
      mustChangePassword: true,
    });
  });

  it("rejects GET /api/auth/me when unauthenticated with 401 Unauthorized", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns current user context for GET /api/auth/me when session cookie is provided", async () => {
    const agent = request.agent(app);
    await agent
      .post("/api/auth/login")
      .send({ email: "staff1@toktickit.local", password: "Password123!" });

    const meRes = await agent.get("/api/auth/me");
    expect(meRes.status).toBe(200);
    expect(meRes.body.user).toMatchObject({
      email: "staff1@toktickit.local",
      role: "IT_STAFF",
    });
  });

  it("invalidates session on POST /api/auth/logout", async () => {
    const agent = request.agent(app);
    await agent
      .post("/api/auth/login")
      .send({ email: "staff1@toktickit.local", password: "Password123!" });

    const logoutRes = await agent.post("/api/auth/logout");
    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.message).toContain("Logged out");

    const meRes = await agent.get("/api/auth/me");
    expect(meRes.status).toBe(401);
  });

  it("rejects password change if current password is incorrect", async () => {
    const agent = request.agent(app);
    await agent
      .post("/api/auth/login")
      .send({ email: "requester2@toktickit.local", password: "Password123!" });

    const res = await agent.post("/api/auth/change-password").send({
      currentPassword: "IncorrectPassword1!",
      newPassword: "NewValidPassword123!",
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_CURRENT_PASSWORD");
  });

  it("rejects weak new password with 400 Bad Request", async () => {
    const agent = request.agent(app);
    await agent
      .post("/api/auth/login")
      .send({ email: "requester3@toktickit.local", password: "Password123!" });

    const res = await agent.post("/api/auth/change-password").send({
      currentPassword: "Password123!",
      newPassword: "weak",
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("WEAK_PASSWORD");
  });

  it("updates password and clears mustChangePassword flag upon valid password change", async () => {
    const agent = request.agent(app);
    await agent
      .post("/api/auth/login")
      .send({ email: "requester4@toktickit.local", password: "Password123!" });

    const res = await agent.post("/api/auth/change-password").send({
      currentPassword: "Password123!",
      newPassword: "BrandNewSecurePass123!",
    });

    expect(res.status).toBe(200);
    expect(res.body.mustChangePassword).toBe(false);

    // Verify login with new password
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "requester4@toktickit.local", password: "BrandNewSecurePass123!" });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.user.mustChangePassword).toBe(false);
  });

  it("blocks user with mustChangePassword = true from accessing restricted application endpoints", async () => {
    const agent = request.agent(app);
    await agent
      .post("/api/auth/login")
      .send({ email: "requester1@toktickit.local", password: "Password123!" });

    const res = await agent.get("/api/tickets/next-number");
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("PASSWORD_CHANGE_REQUIRED");
  });
});
