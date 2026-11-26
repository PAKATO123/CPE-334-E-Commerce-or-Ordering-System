import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { getPrisma } from "../src/prisma.js";

describe("GET /api/health and GET /api/ready", () => {
  it("returns 200 with status ok and service name for /api/health", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok", service: "TechTent API" });
  });

  it("returns 200 with ready and connected status when database is reachable for /api/ready", async () => {
    const res = await request(app).get("/api/ready");
    expect(res.status).toBe(200);
    expect(res.body.db).toBe("connected");
    expect(res.body.database).toBe("connected");
  });

  it("returns 503 from the actual readiness route when the query fails", async () => {
    const query = vi.spyOn(getPrisma(), "$queryRaw").mockRejectedValueOnce(new Error("Connection unavailable"));
    try {
      const res = await request(app).get("/api/ready");
      expect(res.status).toBe(503);
      expect(res.body).toMatchObject({ ready: false, db: "disconnected" });
    } finally {
      query.mockRestore();
    }
  });

  it("sanitizes parser errors through the actual production error middleware", async () => {
    vi.stubEnv("NODE_ENV", "production");
    try {
      const res = await request(app)
        .post("/api/auth/login")
        .set("Content-Type", "application/json")
        .send("{invalid");
      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: { code: "REQUEST_ERROR", message: "The request could not be processed." },
      });
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("throttles the actual login route at its configured limit without throttling health", async () => {
    vi.stubEnv("TECHTENT_ENABLE_TEST_RATE_LIMIT", "1");
    try {
      for (let attempt = 0; attempt < 10; attempt++) {
        const res = await request(app).post("/api/auth/login").send({});
        expect(res.status).toBe(400);
      }
      const blocked = await request(app).post("/api/auth/login").send({});
      expect(blocked.status).toBe(429);
      expect(blocked.body.error.code).toBe("TOO_MANY_REQUESTS");
      expect(Number(blocked.headers["retry-after"])).toBeGreaterThan(0);
      expect(blocked.headers["ratelimit-limit"]).toBe("10");
      expect((await request(app).get("/api/health")).status).toBe(200);
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
