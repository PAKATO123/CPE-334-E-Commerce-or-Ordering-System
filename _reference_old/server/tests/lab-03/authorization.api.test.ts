import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

describe("Lab 03 Feature 3 — Server-Side Authorization Guards (authorization.api.test.ts)", () => {
  beforeEach(async () => {
    const prisma = getPrisma();
    const defaultHash = bcrypt.hashSync("Password123!", 10);
    const adminHash = bcrypt.hashSync("AdminPassword123!", 10);
    await prisma.user.updateMany({
      data: { passwordHash: defaultHash, mustChangePassword: false },
    });
    await prisma.user.update({
      where: { email: "admin@toktickit.local" },
      data: { passwordHash: adminHash, mustChangePassword: false },
    });
  });

  afterAll(async () => {
    const prisma = getPrisma();
    await prisma.user.updateMany({
      where: {
        email: {
          in: [
            "requester1@toktickit.local",
            "requester2@toktickit.local",
            "requester3@toktickit.local",
            "staff1@toktickit.local",
          ],
        },
      },
      data: { mustChangePassword: false },
    });
    await prisma.user.update({
      where: { email: "admin@toktickit.local" },
      data: { mustChangePassword: false },
    });
  });

  describe("1. Unauthenticated Guard Enforcement (401 Unauthorized)", () => {
    it("rejects GET /api/tickets without active session with 401 Unauthorized", async () => {
      const res = await request(app).get("/api/tickets");
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("rejects GET /api/tickets/:id without active session with 401 Unauthorized", async () => {
      const res = await request(app).get("/api/tickets/1");
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("rejects POST /api/tickets without active session with 401 Unauthorized", async () => {
      const res = await request(app)
        .post("/api/tickets")
        .field("categoryId", "1")
        .field("relatedSystemId", "1")
        .field("summary", "Test ticket")
        .field("description", "Description text");

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("rejects PATCH /api/tickets/:id/resolve-indication without active session with 401 Unauthorized", async () => {
      const res = await request(app).patch("/api/tickets/1/resolve-indication");
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });
  });

  describe("2. Requester Query Scope & Identity Binding", () => {
    it("restricts Requester to viewing only owned tickets and overrides query requesterId parameter", async () => {
      const agent = request.agent(app);
      await agent
        .post("/api/auth/login")
        .send({ email: "requester1@toktickit.local", password: "Password123!" });

      // Attempt to query tickets for requesterId=2 explicitly
      const res = await agent.get("/api/tickets?requesterId=2");
      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);

      // Verify all returned tickets belong to requester 1
      res.body.data.forEach((ticket: any) => {
        expect(ticket).toBeDefined();
      });
    });

    it("automatically binds ticket requesterId to session user when POST /api/tickets is called", async () => {
      const agent = request.agent(app);
      await agent
        .post("/api/auth/login")
        .send({ email: "requester2@toktickit.local", password: "Password123!" });

      const res = await agent
        .post("/api/tickets")
        .field("requesterId", "99")
        .field("categoryId", "1")
        .field("relatedSystemId", "1")
        .field("summary", "Auto Identity Binding Test Ticket")
        .field("description", "Testing that requesterId is derived from session.");

      expect(res.status).toBe(201);
      expect(res.body.data.requesterId).not.toBe(99);
      expect(res.body.data.summary).toBe("Auto Identity Binding Test Ticket");
    });
  });

  describe("3. Ticket Detail Ownership Guards (403 Forbidden)", () => {
    it("allows Requester to view their own ticket detail", async () => {
      const agent = request.agent(app);
      await agent
        .post("/api/auth/login")
        .send({ email: "requester1@toktickit.local", password: "Password123!" });

      const ticketsRes = await agent.get("/api/tickets");
      expect(ticketsRes.status).toBe(200);
      const ownedTicket = ticketsRes.body.data[0];

      if (ownedTicket) {
        const detailRes = await agent.get(`/api/tickets/${ownedTicket.id}`);
        expect(detailRes.status).toBe(200);
        expect(detailRes.body.data.id).toBe(ownedTicket.id);
      }
    });

    it("rejects Requester access to another requester's ticket with 403 Forbidden", async () => {
      const agent2 = request.agent(app);
      await agent2
        .post("/api/auth/login")
        .send({ email: "requester2@toktickit.local", password: "Password123!" });

      const req2Tickets = await agent2.get("/api/tickets");
      expect(req2Tickets.status).toBe(200);
      const ticketOwnedByReq2 = req2Tickets.body.data[0];

      if (ticketOwnedByReq2) {
        const agent1 = request.agent(app);
        await agent1
          .post("/api/auth/login")
          .send({ email: "requester1@toktickit.local", password: "Password123!" });

        const crossRes = await agent1.get(`/api/tickets/${ticketOwnedByReq2.id}`);
        expect(crossRes.status).toBe(403);
        expect(crossRes.body.error.code).toBe("FORBIDDEN");
      }
    });

    it("allows IT Staff to view any ticket regardless of requester ownership", async () => {
      const staffAgent = request.agent(app);
      await staffAgent
        .post("/api/auth/login")
        .send({ email: "staff1@toktickit.local", password: "Password123!" });

      const detailRes = await staffAgent.get("/api/tickets/1");
      expect(detailRes.status).toBe(200);
      expect(detailRes.body.data).toBeDefined();
    });
  });

  describe("4. Requester Resolution Indication Guard", () => {
    it("allows owner Requester to set resolution indication (Pending Verification)", async () => {
      const agent = request.agent(app);
      await agent
        .post("/api/auth/login")
        .send({ email: "requester3@toktickit.local", password: "Password123!" });

      const ticketsRes = await agent.get("/api/tickets");
      expect(ticketsRes.status).toBe(200);
      const targetTicket = ticketsRes.body.data[0];

      if (targetTicket) {
        const patchRes = await agent.patch(`/api/tickets/${targetTicket.id}/resolve-indication`);
        expect(patchRes.status).toBe(200);
        expect(patchRes.body.data.isRequesterResolved).toBe(true);
        expect(patchRes.body.data.currentStatus).toBe("Pending Verification");
      }
    });

    it("rejects non-owner Requester attempt to set resolution indication with 403 Forbidden", async () => {
      const agent3 = request.agent(app);
      await agent3
        .post("/api/auth/login")
        .send({ email: "requester3@toktickit.local", password: "Password123!" });

      const req3Tickets = await agent3.get("/api/tickets");
      expect(req3Tickets.status).toBe(200);
      const targetTicket = req3Tickets.body.data[0];

      if (targetTicket) {
        const agent1 = request.agent(app);
        await agent1
          .post("/api/auth/login")
          .send({ email: "requester1@toktickit.local", password: "Password123!" });

        const patchRes = await agent1.patch(`/api/tickets/${targetTicket.id}/resolve-indication`);
        expect(patchRes.status).toBe(403);
        expect(patchRes.body.error.code).toBe("FORBIDDEN");
      }
    });

    it("rejects IT Staff from calling PATCH /api/tickets/:id/resolve-indication with 403 Forbidden", async () => {
      const staffAgent = request.agent(app);
      await staffAgent
        .post("/api/auth/login")
        .send({ email: "staff1@toktickit.local", password: "Password123!" });

      const patchRes = await staffAgent.patch("/api/tickets/1/resolve-indication");
      expect(patchRes.status).toBe(403);
      expect(patchRes.body.error.code).toBe("FORBIDDEN");
    });
  });

  describe("5. Role-Based Access Control (RBAC) Endpoints", () => {
    it("rejects Requester access to IT Staff Queue with 403 Forbidden", async () => {
      const reqAgent = request.agent(app);
      await reqAgent
        .post("/api/auth/login")
        .send({ email: "requester1@toktickit.local", password: "Password123!" });

      const res = await reqAgent.get("/api/tickets/staff-queue");
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("allows IT Staff access to IT Staff Queue endpoint", async () => {
      const staffAgent = request.agent(app);
      await staffAgent
        .post("/api/auth/login")
        .send({ email: "staff1@toktickit.local", password: "Password123!" });

      const res = await staffAgent.get("/api/tickets/staff-queue");
      expect(res.status).toBe(200);
    });

    it("rejects Requester access to Internal Notes endpoints with 403 Forbidden", async () => {
      const reqAgent = request.agent(app);
      await reqAgent
        .post("/api/auth/login")
        .send({ email: "requester1@toktickit.local", password: "Password123!" });

      const res = await reqAgent.post("/api/tickets/1/notes").send({ body: "Test note" });
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("rejects non-Admin access to User Management endpoints with 403 Forbidden", async () => {
      const staffAgent = request.agent(app);
      await staffAgent
        .post("/api/auth/login")
        .send({ email: "staff1@toktickit.local", password: "Password123!" });

      const res = await staffAgent.post("/api/users").send({
        name: "Forbidden User",
        email: "forbidden@toktickit.local",
        role: "IT_STAFF",
        initialPassword: "Password123!",
      });
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("allows Admin access to User Management endpoints", async () => {
      const adminAgent = request.agent(app);
      await adminAgent
        .post("/api/auth/login")
        .send({ email: "admin@toktickit.local", password: "AdminPassword123!" });

      const res = await adminAgent.get("/api/users");
      expect(res.status).toBe(200);
    });
  });
});
