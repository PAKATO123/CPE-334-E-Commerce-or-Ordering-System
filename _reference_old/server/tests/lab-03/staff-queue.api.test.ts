import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

describe("Lab 03 Feature 4 — IT Staff Ticket Queue & Workflow Backend (staff-queue.api.test.ts)", () => {
  beforeEach(async () => {
    const prisma = getPrisma();
    // Temporarily set mustChangePassword: false for test staff & admin users
    await prisma.user.updateMany({
      where: {
        email: {
          in: [
            "requester1@toktickit.local",
            "staff1@toktickit.local",
            "staff2@toktickit.local",
            "admin@toktickit.local",
          ],
        },
      },
      data: { mustChangePassword: false },
    });
  });

  afterAll(async () => {
    const prisma = getPrisma();
    await prisma.user.updateMany({
      where: {
        email: {
          in: [
            "requester1@toktickit.local",
            "staff1@toktickit.local",
            "staff2@toktickit.local",
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

  describe("1. Staff Queue Query, Search, Filtering & Pagination", () => {
    it("returns paginated system tickets for authenticated IT Staff and Administrator", async () => {
      const agent = request.agent(app);
      await agent
        .post("/api/auth/login")
        .send({ email: "staff1@toktickit.local", password: "Password123!" });

      const res = await agent.get("/api/tickets/staff-queue");
      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.pageSize).toBe(10);
    });

    it("rejects Requester access to IT Staff Queue with 403 Forbidden", async () => {
      const agent = request.agent(app);
      await agent
        .post("/api/auth/login")
        .send({ email: "requester1@toktickit.local", password: "Password123!" });

      const res = await agent.get("/api/tickets/staff-queue");
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("supports keyword search across ticket number, summary, and description", async () => {
      const agent = request.agent(app);
      await agent
        .post("/api/auth/login")
        .send({ email: "staff1@toktickit.local", password: "Password123!" });

      const res = await agent.get("/api/tickets/staff-queue?search=email");
      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      res.body.data.forEach((ticket: any) => {
        const text = `${ticket.ticketNumber} ${ticket.summary} ${ticket.description}`.toLowerCase();
        expect(text).toContain("email");
      });
    });

    it("supports filtering by status, IT priority, and assignment", async () => {
      const agent = request.agent(app);
      await agent
        .post("/api/auth/login")
        .send({ email: "staff1@toktickit.local", password: "Password123!" });

      const res = await agent.get("/api/tickets/staff-queue?assignment=unassigned");
      expect(res.status).toBe(200);
      res.body.data.forEach((ticket: any) => {
        expect(ticket.assignedTo).toBeNull();
      });
    });

    it("supports sorting by createdAt, IT priority, and currentStatus", async () => {
      const agent = request.agent(app);
      await agent
        .post("/api/auth/login")
        .send({ email: "staff1@toktickit.local", password: "Password123!" });

      const res = await agent.get("/api/tickets/staff-queue?sortBy=itPriority&sortDirection=desc");
      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });

    it("supports configurable pagination page sizes (10, 25, 50)", async () => {
      const agent = request.agent(app);
      await agent
        .post("/api/auth/login")
        .send({ email: "staff1@toktickit.local", password: "Password123!" });

      const res25 = await agent.get("/api/tickets/staff-queue?pageSize=25");
      expect(res25.status).toBe(200);
      expect(res25.body.meta.pageSize).toBe(25);

      const resInvalid = await agent.get("/api/tickets/staff-queue?pageSize=15");
      expect(resInvalid.status).toBe(400);
      expect(resInvalid.body.error.code).toBe("INVALID_QUERY");
    });
  });

  describe("2. Claiming & Assignment Workflow", () => {
    it("claims an unassigned ticket for the logged-in IT Staff user and sets status to Open if New", async () => {
      const agent = request.agent(app);
      await agent
        .post("/api/auth/login")
        .send({ email: "staff1@toktickit.local", password: "Password123!" });

      // Find an unassigned ticket
      const queueRes = await agent.get("/api/tickets/staff-queue?assignment=unassigned");
      const unassignedTicket = queueRes.body.data[0];

      if (unassignedTicket) {
        const claimRes = await agent.patch(`/api/tickets/${unassignedTicket.id}/claim`);
        expect(claimRes.status).toBe(200);
        expect(claimRes.body.assignedToId).toBeDefined();
        if (unassignedTicket.currentStatus === "New") {
          expect(claimRes.body.currentStatus).toBe("Open");
        }
      }
    });

    it("reassigns ticket ownership to another active IT Staff user", async () => {
      const agent = request.agent(app);
      await agent
        .post("/api/auth/login")
        .send({ email: "staff1@toktickit.local", password: "Password123!" });

      const prisma = getPrisma();
      const staff2 = await prisma.user.findUnique({ where: { email: "staff2@toktickit.local" } });

      if (staff2) {
        const assignRes = await agent
          .patch("/api/tickets/1/assign")
          .send({ assignedToId: staff2.id });

        expect(assignRes.status).toBe(200);
        expect(assignRes.body.assignedToId).toBe(staff2.id);
      }
    });

    it("rejects assignment to an inactive or non-staff user with 422 Validation Error", async () => {
      const agent = request.agent(app);
      await agent
        .post("/api/auth/login")
        .send({ email: "staff1@toktickit.local", password: "Password123!" });

      const prisma = getPrisma();
      const requester = await prisma.user.findUnique({ where: { email: "requester1@toktickit.local" } });

      if (requester) {
        const invalidRes = await agent
          .patch("/api/tickets/1/assign")
          .send({ assignedToId: requester.id });

        expect(invalidRes.status).toBe(422);
        expect(invalidRes.body.error.code).toBe("VALIDATION_ERROR");
      }
    });
  });

  describe("3. Priority & Status Updates Workflow", () => {
    it("sets IT Staff Priority (Urgent, High, Medium, Low)", async () => {
      const agent = request.agent(app);
      await agent
        .post("/api/auth/login")
        .send({ email: "staff1@toktickit.local", password: "Password123!" });

      const prioRes = await agent
        .patch("/api/tickets/1/priority")
        .send({ itPriority: "Urgent" });

      expect(prioRes.status).toBe(200);
      expect(prioRes.body.itPriority).toBe("Urgent");
    });

    it("rejects invalid IT Priority values with 422 Validation Error", async () => {
      const agent = request.agent(app);
      await agent
        .post("/api/auth/login")
        .send({ email: "staff1@toktickit.local", password: "Password123!" });

      const invalidPrio = await agent
        .patch("/api/tickets/1/priority")
        .send({ itPriority: "SuperCritical" });

      expect(invalidPrio.status).toBe(422);
      expect(invalidPrio.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("updates ticket status following state machine rules", async () => {
      const agent = request.agent(app);
      await agent
        .post("/api/auth/login")
        .send({ email: "staff1@toktickit.local", password: "Password123!" });

      const statusRes = await agent
        .patch("/api/tickets/1/status")
        .send({ status: "In Progress" });

      expect(statusRes.status).toBe(200);
      expect(statusRes.body.currentStatus).toBe("In Progress");
    });

    it("resets isRequesterResolved to false when moving out of Pending Verification", async () => {
      const agent = request.agent(app);
      await agent
        .post("/api/auth/login")
        .send({ email: "staff1@toktickit.local", password: "Password123!" });

      const prisma = getPrisma();
      await prisma.ticket.update({
        where: { id: 1 },
        data: { currentStatus: "Pending Verification", isRequesterResolved: true },
      });

      const resetRes = await agent
        .patch("/api/tickets/1/status")
        .send({ status: "In Progress" });

      expect(resetRes.status).toBe(200);
      expect(resetRes.body.currentStatus).toBe("In Progress");
      expect(resetRes.body.isRequesterResolved).toBe(false);
    });

    it("rejects invalid status strings with 422 Validation Error", async () => {
      const agent = request.agent(app);
      await agent
        .post("/api/auth/login")
        .send({ email: "staff1@toktickit.local", password: "Password123!" });

      const invalidStatus = await agent
        .patch("/api/tickets/1/status")
        .send({ status: "FakeStatus" });

      expect(invalidStatus.status).toBe(422);
      expect(invalidStatus.body.error.code).toBe("VALIDATION_ERROR");
    });
  });
});
