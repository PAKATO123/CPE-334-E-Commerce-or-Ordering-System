import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("Multer Error Middleware", () => {
  it("returns 413 PAYLOAD_TOO_LARGE when file exceeds Multer parser limits", async () => {
    // 11MB file buffer to exceed 10MB soft limit
    const hugeBuffer = Buffer.alloc(11 * 1024 * 1024);

    const res = await request(app)
      .post("/api/tickets/1/attachments")
      .field("requesterId", 1)
      .attach("file", hugeBuffer, {
        filename: "huge-file.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(413);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error.code).toBe("PAYLOAD_TOO_LARGE");
  });

  it("returns 400 INVALID_UPLOAD on unexpected field name MulterError", async () => {
    const smallBuffer = Buffer.from("test");

    const res = await request(app)
      .post("/api/tickets/1/attachments")
      .field("requesterId", 1)
      .attach("wrongField", smallBuffer, {
        filename: "test.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_UPLOAD");
  });
});
