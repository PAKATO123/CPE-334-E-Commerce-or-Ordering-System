import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("Lab 02 Feature 10 — Attachment Management APIs", () => {
  let createdAttachmentId: number;

  it("uploads an attachment to an existing ticket (POST /api/tickets/:id/attachments)", async () => {
    // Ticket 1 belongs to Alice Chen (requesterId = 1)
    const fileBuffer = Buffer.from("fake image binary content");

    const res = await request(app)
      .post("/api/tickets/1/attachments")
      .field("requesterId", 1)
      .attach("file", fileBuffer, {
        filename: "test-attachment.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty("id");
    expect(res.body.data.fileName).toBe("test-attachment.png");
    expect(res.body.data.contentType).toBe("image/png");

    createdAttachmentId = res.body.data.id;
  });

  it("previews active attachment inline (GET /api/attachments/:id/preview)", async () => {
    const res = await request(app).get(`/api/attachments/${createdAttachmentId}/preview?requesterId=1`);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("image/png");
    expect(res.headers["content-disposition"]).toContain("inline");
  });

  it("downloads active attachment (GET /api/attachments/:id/download)", async () => {
    const res = await request(app).get(`/api/attachments/${createdAttachmentId}/download?requesterId=1`);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("image/png");
    expect(res.headers["content-disposition"]).toContain("attachment");
  });

  it("returns 422 VALIDATION_ERROR when removing attachment without a reason", async () => {
    const res = await request(app)
      .delete(`/api/attachments/${createdAttachmentId}`)
      .send({ requesterId: 1, reason: "" });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("soft-removes attachment when a valid reason is provided", async () => {
    const res = await request(app)
      .delete(`/api/attachments/${createdAttachmentId}`)
      .send({ requesterId: 1, reason: "Uploaded incorrect screenshot" });

    expect(res.status).toBe(200);
    expect(res.body.data.isDeleted).toBe(true);
    expect(res.body.data.removalReason).toBe("Uploaded incorrect screenshot");
  });

  it("returns 404 Not Found when trying to download or preview a soft-deleted attachment", async () => {
    const previewRes = await request(app).get(`/api/attachments/${createdAttachmentId}/preview?requesterId=1`);
    expect(previewRes.status).toBe(404);

    const downloadRes = await request(app).get(`/api/attachments/${createdAttachmentId}/download?requesterId=1`);
    expect(downloadRes.status).toBe(404);
  });
});
