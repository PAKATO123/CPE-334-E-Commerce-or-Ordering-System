import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

describe("Lab 04 — Ticket Workflow API Integration Tests", () => {
  beforeEach(async () => {
    const prisma = getPrisma();
    const defaultHash = bcrypt.hashSync("Password123!", 10);
    await prisma.user.updateMany({
      where: {
        email: {
          in: [
            "requester1@toktickit.local",
            "requester2@toktickit.local",
            "staff1@toktickit.local",
            "admin@toktickit.local",
          ],
        },
      },
      data: { passwordHash: defaultHash, mustChangePassword: false },
    });
  });

  afterAll(async () => {
    const prisma = getPrisma();
    const defaultHash = bcrypt.hashSync("Password123!", 10);
    await prisma.user.updateMany({
      where: {
        email: {
          in: [
            "requester1@toktickit.local",
            "requester2@toktickit.local",
            "staff1@toktickit.local",
          ],
        },
      },
      data: { passwordHash: defaultHash, mustChangePassword: false },
    });
    await prisma.user.update({
      where: { email: "admin@toktickit.local" },
      data: { passwordHash: defaultHash, mustChangePassword: false },
    });
  });

  it("should allow IT Staff to transition ticket status to RESOLVED directly", async () => {
    const agentStaff = request.agent(app);
    await agentStaff
      .post("/api/auth/login")
      .send({ email: "staff1@toktickit.local", password: "Password123!" });

    const res = await agentStaff
      .patch("/api/tickets/2/status")
      .send({ status: "Resolved" });

    expect(res.status).toBe(200);
    const updatedTicket = res.body.data || res.body;
    expect(updatedTicket).toBeDefined();
    expect(updatedTicket.currentStatus).toBe("Resolved");
  });

  it("should process advisory requester resolution indication without corrupting status", async () => {
    const prisma = getPrisma();
    const ticket1 = await prisma.ticket.findUnique({ where: { id: 1 }, include: { requester: true } });

    const agentRequester = request.agent(app);
    await agentRequester
      .post("/api/auth/login")
      .send({ email: ticket1!.requester.email, password: "Password123!" });

    const res = await agentRequester
      .patch("/api/tickets/1/resolve-indication");

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.isRequesterResolved).toBe(true);
    expect(res.body.data.currentStatus).toBe("Pending Verification");
  });

  it("should reject stale ticket status update with 409 Conflict when expectedUpdatedAt is outdated", async () => {
    const agentStaff = request.agent(app);
    await agentStaff
      .post("/api/auth/login")
      .send({ email: "staff1@toktickit.local", password: "Password123!" });

    const res = await agentStaff
      .patch("/api/tickets/2/status")
      .send({
        status: "In Progress",
        expectedUpdatedAt: new Date(Date.now() - 7200000).toISOString(),
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("STALE_UPDATE_CONFLICT");
  });
});

