import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { resetRateLimits } from "../../src/utils/rateLimiter.js";
import teardown from "../teardown.js";

describe("Lab 02 Feature 5 — Create Ticket API (POST /api/tickets)", () => {
  beforeEach(() => {
    resetRateLimits();
  });

  afterAll(async () => {
    await teardown();
  });

  describe("Happy Path Ticket Creation", () => {
    it("creates a ticket without attachments and returns 201 Created with ticket number", async () => {
      const res = await request(app)
        .post("/api/tickets")
        .field("requesterId", "1") // Alice Chen
        .field("categoryId", "1")  // Account and Access
        .field("relatedSystemId", "1") // Email & Collaboration
        .field("summary", "Password reset required")
        .field("description", "I cannot log into my corporate email account after password expiration.")
        .field("requestedPriority", "HIGH");

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("data");

      const ticket = res.body.data;
      expect(ticket).toHaveProperty("id");
      expect(ticket.ticketNumber).toMatch(/^TICK-\d{4}-\d{4}$/);
      expect(ticket.requesterId).toBe(1);
      expect(ticket.summary).toBe("Password reset required");
      expect(ticket.description).toBe("I cannot log into my corporate email account after password expiration.");
      expect(ticket.requestedPriority).toBe("HIGH");
      expect(ticket.currentStatus).toBe("New");
      expect(ticket.category).toEqual({ id: 1, name: "Account and Access" });
      expect(ticket.relatedSystem).toEqual({ id: 1, name: "Email & Collaboration" });
      expect(ticket.attachments).toEqual([]);
    });

    it("creates a ticket with valid binary attachment and returns 201 Created", async () => {
      const pngBuffer = Buffer.from("fake-image-binary-data");

      const res = await request(app)
        .post("/api/tickets")
        .field("requesterId", "2") // Bob Smith
        .field("categoryId", "2")  // Hardware
        .field("relatedSystemId", "2") // VPN
        .field("summary", "Laptop screen flickering")
        .field("description", "My laptop display flickers violently whenever connected to external monitor.")
        .attach("attachments", pngBuffer, { filename: "screenshot.png", contentType: "image/png" });

      expect(res.status).toBe(201);
      expect(res.body.data.attachments.length).toBe(1);

      const att = res.body.data.attachments[0];
      expect(att.fileName).toBe("screenshot.png");
      expect(att.contentType).toBe("image/png");
      expect(att.fileSize).toBe(pngBuffer.length);
      expect(att).toHaveProperty("id");
      expect(att).not.toHaveProperty("fileData"); // binary data excluded from metadata payload
    });
  });

  describe("Validation Failures (422 Unprocessable Entity)", () => {
    it("rejects request missing description with 422", async () => {
      const res = await request(app)
        .post("/api/tickets")
        .field("requesterId", "1")
        .field("categoryId", "1")
        .field("relatedSystemId", "1")
        .field("summary", "Valid summary here");

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(res.body.error.details.some((d: any) => d.field === "description")).toBe(true);
    });

    it("rejects request with empty description with 422", async () => {
      const res = await request(app)
        .post("/api/tickets")
        .field("requesterId", "1")
        .field("categoryId", "1")
        .field("relatedSystemId", "1")
        .field("summary", "Valid summary here")
        .field("description", "");

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(res.body.error.details.some((d: any) => d.field === "description")).toBe(true);
    });

    it("rejects request for inactive requester (Eve Inactive) with 422", async () => {
      const res = await request(app)
        .post("/api/tickets")
        .field("requesterId", "5") // Eve Inactive (isActive = false)
        .field("categoryId", "1")
        .field("relatedSystemId", "1")
        .field("summary", "Valid summary title here")
        .field("description", "Valid ticket description containing at least 20 characters.");

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(res.body.error.details.some((d: any) => d.field === "requesterId")).toBe(true);
    });

    it("rejects request for non-existent category ID with 422", async () => {
      const res = await request(app)
        .post("/api/tickets")
        .field("requesterId", "1")
        .field("categoryId", "9999")
        .field("relatedSystemId", "1")
        .field("summary", "Valid summary title here")
        .field("description", "Valid ticket description containing at least 20 characters.");

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(res.body.error.details.some((d: any) => d.field === "categoryId")).toBe(true);
    });
  });

  describe("Attachment Validations (415 & 413)", () => {
    it("rejects disallowed attachment MIME type with 415 Unsupported Media Type", async () => {
      const txtBuffer = Buffer.from("plain text content");

      const res = await request(app)
        .post("/api/tickets")
        .field("requesterId", "1")
        .field("categoryId", "1")
        .field("relatedSystemId", "1")
        .field("summary", "Valid summary title here")
        .field("description", "Valid ticket description containing at least 20 characters.")
        .attach("attachments", txtBuffer, { filename: "document.txt", contentType: "text/plain" });

      expect(res.status).toBe(415);
      expect(res.body.error.code).toBe("UNSUPPORTED_MEDIA_TYPE");
    });

    it("rejects oversized attachment (> 5 MB) with 413 Payload Too Large", async () => {
      const oversizedBuffer = Buffer.alloc(5 * 1024 * 1024 + 1); // 5 MB + 1 byte

      const res = await request(app)
        .post("/api/tickets")
        .field("requesterId", "1")
        .field("categoryId", "1")
        .field("relatedSystemId", "1")
        .field("summary", "Valid summary title here")
        .field("description", "Valid ticket description containing at least 20 characters.")
        .attach("attachments", oversizedBuffer, { filename: "large.pdf", contentType: "application/pdf" });

      expect(res.status).toBe(413);
      expect(res.body.error.code).toBe("PAYLOAD_TOO_LARGE");
    });
  });

  describe("Rate Limiting Throttling (429)", () => {
    it("returns 429 Too Many Requests when same requester submits twice within 15 seconds", async () => {
      // First submission -> 201 Created
      const res1 = await request(app)
        .post("/api/tickets")
        .field("requesterId", "3") // Carlos Ray
        .field("categoryId", "1")
        .field("relatedSystemId", "1")
        .field("summary", "First submission ticket")
        .field("description", "First ticket detailed description containing over 20 characters.");

      expect(res1.status).toBe(201);

      // Second immediate submission -> 429 Too Many Requests
      const res2 = await request(app)
        .post("/api/tickets")
        .field("requesterId", "3")
        .field("categoryId", "1")
        .field("relatedSystemId", "1")
        .field("summary", "Second submission ticket")
        .field("description", "Second ticket detailed description containing over 20 characters.");

      expect(res2.status).toBe(429);
      expect(res2.body.error.code).toBe("TICKET_CREATION_RATE_LIMITED");
    });
  });
});
