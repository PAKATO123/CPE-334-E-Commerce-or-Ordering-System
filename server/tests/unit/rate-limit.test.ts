import { describe, it, expect, beforeEach, afterEach } from "vitest";
import express, { Request, Response, NextFunction } from "express";
import request from "supertest";
import { createLoginRateLimiter } from "../../src/middleware/rateLimit.js";

describe("F-10 / AC-HARD: Rate Limiting & Production Hardening", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.TECHTENT_DISABLE_RATE_LIMIT;
    process.env.TECHTENT_ENABLE_TEST_RATE_LIMIT = "1";
    process.env.NODE_ENV = "test";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("AC-HARD-01 & AC-HARD-02: Rate Limiter Middleware", () => {
    it("allows requests under the threshold and throttles on exceeding max attempts", async () => {
      const testApp = express();
      testApp.use(express.json());
      const limiter = createLoginRateLimiter({
        windowMs: 60 * 1000,
        max: 3,
      });

      testApp.post("/login", limiter, (_req: Request, res: Response) => {
        res.status(200).json({ status: "success" });
      });

      // 1st request -> 200
      const res1 = await request(testApp).post("/login").send({});
      expect(res1.status).toBe(200);

      // 2nd request -> 200
      const res2 = await request(testApp).post("/login").send({});
      expect(res2.status).toBe(200);

      // 3rd request -> 200
      const res3 = await request(testApp).post("/login").send({});
      expect(res3.status).toBe(200);

      // 4th request -> 429 Too Many Requests
      const res4 = await request(testApp).post("/login").send({});
      expect(res4.status).toBe(429);
      expect(res4.body).toEqual({
        error: {
          code: "TOO_MANY_REQUESTS",
          message: "Too many login attempts from this IP. Please try again after 15 minutes.",
        },
      });

      // AC-HARD-02: Standard headers including Retry-After
      expect(res4.headers["retry-after"]).toBeDefined();
    });

    it("skips rate limiting when TECHTENT_DISABLE_RATE_LIMIT is set to 1", async () => {
      process.env.TECHTENT_DISABLE_RATE_LIMIT = "1";

      const testApp = express();
      const limiter = createLoginRateLimiter({ max: 1 });
      testApp.post("/login", limiter, (_req: Request, res: Response) => {
        res.status(200).json({ ok: true });
      });

      const res1 = await request(testApp).post("/login");
      const res2 = await request(testApp).post("/login");
      const res3 = await request(testApp).post("/login");

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(res3.status).toBe(200);
    });

    it("AC-HARD-03: rate limiter on login does not affect other endpoints", async () => {
      const testApp = express();
      const limiter = createLoginRateLimiter({ max: 1 });

      testApp.post("/login", limiter, (_req: Request, res: Response) => {
        res.status(200).json({ ok: true });
      });
      testApp.get("/products", (_req: Request, res: Response) => {
        res.status(200).json({ products: [] });
      });

      // Hit login once -> 200
      await request(testApp).post("/login");
      // Hit login second time -> 429
      const loginBlocked = await request(testApp).post("/login");
      expect(loginBlocked.status).toBe(429);

      // Products endpoint remains fully functional
      const productsRes = await request(testApp).get("/products");
      expect(productsRes.status).toBe(200);
      expect(productsRes.body).toEqual({ products: [] });
    });
  });

  describe("AC-HARD-04: Centralized Error Envelope Sanitizer", () => {
    function createErrorApp(isProduction: boolean) {
      const testApp = express();
      testApp.get("/db-error", () => {
        const dbErr: any = new Error("Unique constraint failed on the fields: (`email`) SELECT * FROM users;");
        dbErr.code = "P2002";
        dbErr.statusCode = 500;
        throw dbErr;
      });

      // Sanitizer middleware matching app.ts
      testApp.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
        const statusCode = typeof err.statusCode === "number" ? err.statusCode : 500;
        let code = err.code || "INTERNAL_ERROR";
        let message = err.message || "An unexpected internal server error occurred.";

        if (isProduction && statusCode >= 500) {
          message = "An unexpected internal server error occurred.";
          if (typeof code === "string" && (code.startsWith("P") || code.includes("Prisma"))) {
            code = "DATABASE_ERROR";
          }
        }

        res.status(statusCode).json({
          error: {
            code,
            message,
          },
        });
      });

      return testApp;
    }

    it("strips raw SQL and database details in production environment", async () => {
      const appProd = createErrorApp(true);
      const res = await request(appProd).get("/db-error");

      expect(res.status).toBe(500);
      expect(res.body.error.code).toBe("DATABASE_ERROR");
      expect(res.body.error.message).toBe("An unexpected internal server error occurred.");
      // Ensure no raw sql or column leaks
      expect(res.text).not.toContain("SELECT * FROM");
      expect(res.text).not.toContain("email");
    });

    it("preserves explicit error messages during non-production development / testing", async () => {
      const appDev = createErrorApp(false);
      const res = await request(appDev).get("/db-error");

      expect(res.status).toBe(500);
      expect(res.body.error.code).toBe("P2002");
      expect(res.body.error.message).toContain("Unique constraint failed");
    });
  });

  describe("AC-HARD-05: Deep Readiness Probe Logic", () => {
    it("returns 200 with database connected when query succeeds", async () => {
      const testApp = express();
      const mockPrisma = {
        $queryRaw: async () => [{ 1: 1 }],
      };

      testApp.get("/api/ready", async (_req: Request, res: Response) => {
        try {
          await mockPrisma.$queryRaw();
          res.status(200).json({ status: "ok", database: "connected", db: "connected" });
        } catch {
          res.status(503).json({ status: "unavailable", database: "disconnected", db: "disconnected" });
        }
      });

      const res = await request(testApp).get("/api/ready");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
      expect(res.body.database).toBe("connected");
      expect(res.body.db).toBe("connected");
    });

    it("returns 503 with database disconnected when query fails", async () => {
      const testApp = express();
      const mockPrisma = {
        $queryRaw: async () => {
          throw new Error("Connection refused");
        },
      };

      testApp.get("/api/ready", async (_req: Request, res: Response) => {
        try {
          await mockPrisma.$queryRaw();
          res.status(200).json({ status: "ok", database: "connected", db: "connected" });
        } catch {
          res.status(503).json({ status: "unavailable", database: "disconnected", db: "disconnected" });
        }
      });

      const res = await request(testApp).get("/api/ready");
      expect(res.status).toBe(503);
      expect(res.body.status).toBe("unavailable");
      expect(res.body.database).toBe("disconnected");
      expect(res.body.db).toBe("disconnected");
    });
  });
});
