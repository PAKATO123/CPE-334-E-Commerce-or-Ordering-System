import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

describe("Lab 04 — Actions Taken API Integration Tests", () => {
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

  it("allows IT Staff to create an Action Taken on a ticket", async () => {
    const agentStaff = request.agent(app);
    await agentStaff
      .post("/api/auth/login")
      .send({ email: "staff1@toktickit.local", password: "Password123!" });

    const res = await agentStaff
      .post("/api/tickets/1/actions-taken")
      .send({
        description: "Replaced ethernet cable and verified connection.",
        result: "Network connection restored.",
        followUpRequired: false,
        attachmentNotes: "cable_test.png",
      });

    expect(res.status).toBe(201);
    expect(res.body.actionTaken).toBeDefined();
    expect(res.body.actionTaken.description).toBe("Replaced ethernet cable and verified connection.");
    expect(res.body.actionTaken.performedBy).toBeDefined();
  });

  it("rejects Action Taken creation when followUpRequired is true but followUpNote is missing", async () => {
    const agentStaff = request.agent(app);
    await agentStaff
      .post("/api/auth/login")
      .send({ email: "staff1@toktickit.local", password: "Password123!" });

    const res = await agentStaff
      .post("/api/tickets/1/actions-taken")
      .send({
        description: "Swapped graphics card.",
        result: "Display working.",
        followUpRequired: true,
        followUpNote: "",
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("allows Requesters to view Actions Taken on owned tickets", async () => {
    const prisma = getPrisma();
    const ticket1 = await prisma.ticket.findUnique({ where: { id: 1 }, include: { requester: true } });

    const agentRequester = request.agent(app);
    await agentRequester
      .post("/api/auth/login")
      .send({ email: ticket1!.requester.email, password: "Password123!" });

    const res = await agentRequester.get("/api/tickets/1/actions-taken");
    expect(res.status).toBe(200);
    expect(res.body.actionsTaken).toBeDefined();
  });

  it("rejects Action Taken creation by Requesters with 403 Forbidden", async () => {
    const agentRequester = request.agent(app);
    await agentRequester
      .post("/api/auth/login")
      .send({ email: "requester1@toktickit.local", password: "Password123!" });

    const res = await agentRequester
      .post("/api/tickets/1/actions-taken")
      .send({
        description: "Unauthorized attempt",
        result: "Failed",
      });

    expect(res.status).toBe(403);
  });

  it("allows IT Staff to update an existing Action Taken record", async () => {
    const agentStaff = request.agent(app);
    await agentStaff
      .post("/api/auth/login")
      .send({ email: "staff1@toktickit.local", password: "Password123!" });

    // First create
    const createRes = await agentStaff
      .post("/api/tickets/1/actions-taken")
      .send({
        description: "Initial diagnostic sweep.",
        result: "Found memory anomaly.",
        followUpRequired: true,
        followUpNote: "Re-check tomorrow morning.",
      });

    const actionId = createRes.body.actionTaken.id;

    // Now update
    const updateRes = await agentStaff
      .put(`/api/tickets/1/actions-taken/${actionId}`)
      .send({
        description: "Updated diagnostic sweep details.",
        result: "Found and fixed memory anomaly.",
        followUpRequired: false,
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.actionTaken.description).toBe("Updated diagnostic sweep details.");
  });

  it("rejects stale update with 409 Conflict when expectedUpdatedAt does not match existing record", async () => {
    const agentStaff = request.agent(app);
    await agentStaff
      .post("/api/auth/login")
      .send({ email: "staff1@toktickit.local", password: "Password123!" });

    const createRes = await agentStaff
      .post("/api/tickets/1/actions-taken")
      .send({
        description: "Checking system temperature.",
        result: "Normal operating range.",
        followUpRequired: false,
      });

    const action = createRes.body.actionTaken;

    const staleRes = await agentStaff
      .put(`/api/tickets/1/actions-taken/${action.id}`)
      .send({
        description: "Concurrent attempt to update action.",
        result: "Overwritten result.",
        expectedUpdatedAt: new Date(Date.now() - 7200000).toISOString(),
      });

    expect(staleRes.status).toBe(409);
    expect(staleRes.body.error.code).toBe("STALE_UPDATE_CONFLICT");
  });

  it("correctly handles isFollowedUp flag and clears note when unchecking followUpRequired without mark-done", async () => {
    const agentStaff = request.agent(app);
    await agentStaff
      .post("/api/auth/login")
      .send({ email: "staff1@toktickit.local", password: "Password123!" });

    // Create with follow-up required
    const createRes = await agentStaff
      .post("/api/tickets/1/actions-taken")
      .send({
        description: "Checked disk arrays.",
        result: "RAID rebuild initiated.",
        followUpRequired: true,
        followUpNote: "Verify RAID consistency tomorrow.",
      });

    const actionId = createRes.body.actionTaken.id;
    expect(createRes.body.actionTaken.isFollowedUp).toBe(false);

    // Edit and uncheck followUpRequired (normal edit, NOT mark-done)
    const updateRes = await agentStaff
      .put(`/api/tickets/1/actions-taken/${actionId}`)
      .send({
        description: "Checked disk arrays.",
        result: "RAID rebuild completed immediately.",
        followUpRequired: false,
        isFollowedUp: false,
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.actionTaken.followUpRequired).toBe(false);
    expect(updateRes.body.actionTaken.isFollowedUp).toBe(false);
    expect(updateRes.body.actionTaken.followUpNote).toBeNull();
  });
});
