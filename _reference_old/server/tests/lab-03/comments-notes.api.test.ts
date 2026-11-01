import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

describe("Lab 03 — Public Comments & Confidential Internal Notes API (comments-notes.api.test.ts)", () => {
  beforeEach(async () => {
    const prisma = getPrisma();
    const defaultHash = bcrypt.hashSync("Password123!", 10);
    const adminHash = bcrypt.hashSync("AdminPassword123!", 10);
    await prisma.user.updateMany({
      data: { mustChangePassword: false },
    });
    await prisma.user.updateMany({
      where: {
        email: {
          in: [
            "requester2@toktickit.local",
            "staff2@toktickit.local",
          ],
        },
      },
      data: { passwordHash: defaultHash, mustChangePassword: false },
    });
    await prisma.user.update({
      where: { email: "admin2@toktickit.local" },
      data: { passwordHash: adminHash, mustChangePassword: false },
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

  it("allows Ticket Owner and IT Staff to post and view Public Comments", async () => {
    const prisma = getPrisma();
    const reqUser = await prisma.user.findUnique({ where: { email: "requester2@toktickit.local" } });
    let ticket = await prisma.ticket.findFirst({ where: { requesterId: reqUser!.id } });
    if (!ticket) {
      ticket = await prisma.ticket.findFirst();
      await prisma.ticket.update({ where: { id: ticket!.id }, data: { requesterId: reqUser!.id } });
    }

    const agentReq = request.agent(app);
    await agentReq
      .post("/api/auth/login")
      .send({ email: "requester2@toktickit.local", password: "Password123!" });

    // Post comment as Requester
    const postRes = await agentReq
      .post(`/api/tickets/${ticket!.id}/comments`)
      .send({ content: "Updating issue details from requester." });
    expect(postRes.status).toBe(201);
    expect(postRes.body.data.content).toBe("Updating issue details from requester.");

    // Fetch comments as IT Staff
    const agentStaff = request.agent(app);
    await agentStaff
      .post("/api/auth/login")
      .send({ email: "staff2@toktickit.local", password: "Password123!" });

    const getRes = await agentStaff.get(`/api/tickets/${ticket!.id}/comments`);
    expect(getRes.status).toBe(200);
    expect(Array.isArray(getRes.body.data)).toBe(true);
    expect(getRes.body.data.some((c: any) => c.content === "Updating issue details from requester.")).toBe(true);
  });

  it("allows IT Staff and Admin to create and view confidential Internal Notes", async () => {
    const agentStaff = request.agent(app);
    await agentStaff
      .post("/api/auth/login")
      .send({ email: "staff2@toktickit.local", password: "Password123!" });

    // Post internal note as Staff
    const postRes = await agentStaff
      .post("/api/tickets/1/notes")
      .send({ content: "Internal note: Escalated to network infrastructure team." });
    expect(postRes.status).toBe(201);
    expect(postRes.body.data.content).toContain("Escalated to network");

    // View notes as Admin
    const agentAdmin = request.agent(app);
    await agentAdmin
      .post("/api/auth/login")
      .send({ email: "admin2@toktickit.local", password: "AdminPassword123!" });

    const getRes = await agentAdmin.get("/api/tickets/1/notes");
    expect(getRes.status).toBe(200);
    expect(Array.isArray(getRes.body.data)).toBe(true);
    expect(getRes.body.data.some((n: any) => n.content.includes("Escalated to network"))).toBe(true);
  });

  it("rejects Requester access to Internal Notes endpoints with 403 Forbidden", async () => {
    const agentReq = request.agent(app);
    await agentReq
      .post("/api/auth/login")
      .send({ email: "requester2@toktickit.local", password: "Password123!" });

    const getRes = await agentReq.get("/api/tickets/1/notes");
    expect(getRes.status).toBe(403);
    expect(getRes.body.error.code).toBe("FORBIDDEN");

    const postRes = await agentReq
      .post("/api/tickets/1/notes")
      .send({ content: "Illegal note attempt" });
    expect(postRes.status).toBe(403);
    expect(postRes.body.error.code).toBe("FORBIDDEN");
  });

  it("rejects empty or whitespace-only comment and note content", async () => {
    const agentStaff = request.agent(app);
    await agentStaff
      .post("/api/auth/login")
      .send({ email: "staff2@toktickit.local", password: "Password123!" });

    const emptyCommentRes = await agentStaff
      .post("/api/tickets/1/comments")
      .send({ content: "   " });
    expect(emptyCommentRes.status).toBe(422);

    const emptyNoteRes = await agentStaff
      .post("/api/tickets/1/notes")
      .send({ content: "" });
    expect(emptyNoteRes.status).toBe(422);
  });

  it("binds author ID and server timestamp automatically", async () => {
    const agentStaff = request.agent(app);
    await agentStaff
      .post("/api/auth/login")
      .send({ email: "staff2@toktickit.local", password: "Password123!" });

    const res = await agentStaff
      .post("/api/tickets/1/comments")
      .send({ content: "Automatic author test comment" });

    expect(res.status).toBe(201);
    expect(res.body.data.authorId).toBeDefined();
    expect(res.body.data.createdAt).toBeDefined();
  });
});
