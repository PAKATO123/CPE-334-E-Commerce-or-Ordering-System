import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

describe("Lab 02 Feature 2 — Reference Data APIs", () => {
  describe("GET /api/requesters", () => {
    it("returns 200 OK with only active requesters in id order", async () => {
      const res = await request(app).get("/api/requesters");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("data");
      expect(Array.isArray(res.body.data)).toBe(true);

      const data = res.body.data;
      expect(data.length).toBe(4);

      // Verify shape: id, name, email, department
      for (const req of data) {
        expect(req).toHaveProperty("id");
        expect(req).toHaveProperty("name");
        expect(req).toHaveProperty("email");
        expect(req).toHaveProperty("department");
        expect(req).not.toHaveProperty("isActive");
      }

      // Verify active names and ordering
      const names = data.map((r: { name: string }) => r.name);
      expect(names).toEqual(["Alice Chen", "Bob Smith", "Carlos Ray", "Diana Prince"]);
      expect(names).not.toContain("Eve Inactive");
    });
  });

  describe("GET /api/related-systems", () => {
    it("returns 200 OK with only active related systems in id order", async () => {
      const res = await request(app).get("/api/related-systems");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("data");
      expect(Array.isArray(res.body.data)).toBe(true);

      const data = res.body.data;
      expect(data.length).toBeGreaterThanOrEqual(6);

      // Verify shape: id, name, description
      for (const sys of data) {
        expect(sys).toHaveProperty("id");
        expect(sys).toHaveProperty("name");
        expect(sys).toHaveProperty("description");
        expect(sys).not.toHaveProperty("isActive");
      }
    });
  });

  describe("GET /api/categories", () => {
    it("returns 200 OK with active categories in id order", async () => {
      const res = await request(app).get("/api/categories");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("data");
      expect(res.body.data).toEqual([
        { id: 1, name: "Account and Access" },
        { id: 2, name: "Hardware" },
        { id: 3, name: "Software" },
        { id: 4, name: "Network" },
      ]);
    });
  });

  describe("Error Envelope Handling", () => {
    it("returns 500 with safe error envelope when database fails", async () => {
      const prisma = getPrisma();
      const spy = vi.spyOn(prisma.requester, "findMany").mockRejectedValue(new Error("DB Connection Lost"));

      const res = await request(app).get("/api/requesters");

      expect(res.status).toBe(500);
      expect(res.body).toEqual({
        error: {
          code: "INTERNAL_ERROR",
          message: "Unable to load Development Requesters.",
        },
      });

      spy.mockRestore();
    });
  });
});
