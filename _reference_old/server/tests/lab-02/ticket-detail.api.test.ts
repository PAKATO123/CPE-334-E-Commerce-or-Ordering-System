import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("Lab 02 Feature 9 — Ticket Detail API (GET /api/tickets/:id)", () => {
  it("returns 200 OK with full ticket details and attachments for ticket owner", async () => {
    // Ticket 1 belongs to Alice Chen (requesterId = 1)
    const res = await request(app).get("/api/tickets/1?requesterId=1");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");

    const ticket = res.body.data;
    expect(ticket.id).toBe(1);
    expect(ticket.ticketNumber).toBe("TICK-2026-0001");
    expect(ticket.requesterId).toBe(1);
    expect(ticket.category).toHaveProperty("name");
    expect(ticket.relatedSystem).toHaveProperty("name");
    expect(ticket).toHaveProperty("summary");
    expect(ticket).toHaveProperty("description");
    expect(ticket).toHaveProperty("currentStatus");
    expect(ticket).toHaveProperty("attachments");
    expect(Array.isArray(ticket.attachments)).toBe(true);
  });

  it("returns 403 Forbidden when requesting a ticket owned by another requester", async () => {
    // Ticket 1 belongs to Alice Chen (requesterId = 1). Bob Smith (requesterId = 2) tries to access it.
    const res = await request(app).get("/api/tickets/1?requesterId=2");

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
    expect(res.body.error.message).toContain("permission");
  });

  it("returns 404 Not Found when requesting a non-existent ticket ID", async () => {
    const res = await request(app).get("/api/tickets/99999?requesterId=1");

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("TICKET_NOT_FOUND");
  });

  it("returns 400 Bad Request if requesterId is missing", async () => {
    const res = await request(app).get("/api/tickets/1");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_QUERY");
  });
});
