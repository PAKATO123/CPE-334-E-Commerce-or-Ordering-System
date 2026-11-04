import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

describe("Lab 03 — IT Staff Ticket Operations API (staff-ticket-detail.api.test.ts)", () => {
  beforeEach(async () => {
    const prisma = getPrisma();
    const defaultHash = bcrypt.hashSync("Password123!", 10);
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
            "staff1@toktickit.local",
            "staff2@toktickit.local",
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

  it("allows IT Staff member to claim an unassigned ticket", async () => {
    const agentStaff = request.agent(app);
    await agentStaff
      .post("/api/auth/login")
      .send({ email: "staff1@toktickit.local", password: "Password123!" });

    const res = await agentStaff.patch("/api/tickets/1/claim");
    expect(res.status).toBe(200);
    expect(res.body.assignedToId).toBeDefined();
  });

  it("allows IT Staff or Admin to reassign ticket ownership to another Staff member", async () => {
    const prisma = getPrisma();
    const staff2 = await prisma.user.findUnique({ where: { email: "staff2@toktickit.local" } });
    expect(staff2).toBeDefined();

    const agentAdmin = request.agent(app);
    await agentAdmin
      .post("/api/auth/login")
      .send({ email: "admin@toktickit.local", password: "Password123!" });

    const res = await agentAdmin
      .patch("/api/tickets/1/assign")
      .send({ assignedToId: staff2!.id });

    expect(res.status).toBe(200);
    expect(res.body.assignedToId).toBe(staff2!.id);
  });

  it("allows IT Staff or Admin to update IT Priority", async () => {
    const agentStaff = request.agent(app);
    await agentStaff
      .post("/api/auth/login")
      .send({ email: "staff1@toktickit.local", password: "Password123!" });

    const res = await agentStaff
      .patch("/api/tickets/1/priority")
      .send({ itPriority: "Urgent" });

    expect(res.status).toBe(200);
    expect(res.body.itPriority).toBe("Urgent");
  });

  it("executes valid status transitions per state machine matrix", async () => {
    const prisma = getPrisma();
    // Set ticket 1 status to Open
    await prisma.ticket.update({
      where: { id: 1 },
      data: { currentStatus: "Open" },
    });

    const agentStaff = request.agent(app);
    await agentStaff
      .post("/api/auth/login")
      .send({ email: "staff1@toktickit.local", password: "Password123!" });

    const res = await agentStaff
      .patch("/api/tickets/1/status")
      .send({ status: "In Progress" });

    expect(res.status).toBe(200);
    expect(res.body.currentStatus).toBe("In Progress");
  });

  it("rejects invalid status transitions with 400 Bad Request", async () => {
    const prisma = getPrisma();
    // Set ticket 1 status to New
    await prisma.ticket.update({
      where: { id: 1 },
      data: { currentStatus: "New" },
    });

    const agentStaff = request.agent(app);
    await agentStaff
      .post("/api/auth/login")
      .send({ email: "staff1@toktickit.local", password: "Password123!" });

    // Transitioning New -> Closed is invalid per state machine
    const res = await agentStaff
      .patch("/api/tickets/1/status")
      .send({ status: "Closed" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_STATUS_TRANSITION");
  });

  it("allows IT Staff to revert Pending Verification ticket back to In Progress", async () => {
    const prisma = getPrisma();
    await prisma.ticket.update({
      where: { id: 1 },
      data: { currentStatus: "Pending Verification", isRequesterResolved: true },
    });

    const agentStaff = request.agent(app);
    await agentStaff
      .post("/api/auth/login")
      .send({ email: "staff1@toktickit.local", password: "Password123!" });

    const res = await agentStaff
      .patch("/api/tickets/1/status")
      .send({ status: "In Progress" });

    expect(res.status).toBe(200);
    expect(res.body.currentStatus).toBe("In Progress");
    expect(res.body.isRequesterResolved).toBe(false);
  });
});
