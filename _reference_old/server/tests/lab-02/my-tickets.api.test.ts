import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { resetRateLimits } from "../../src/utils/rateLimiter.js";
import teardown from "../teardown.js";

describe("Lab 02 Feature 6 — My Tickets API (GET /api/tickets)", () => {
  let createdTickets: any[] = [];

  beforeEach(async () => {
    resetRateLimits();
  });

  afterAll(async () => {
    await teardown();
  });

  describe("Requester Isolation & Basic Payload Shape", () => {
    it("returns 200 OK with paginated ticket list for active requester", async () => {
      const res = await request(app).get("/api/tickets?requesterId=1");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("data");
      expect(res.body).toHaveProperty("pagination");

      const { data, pagination } = res.body;
      expect(Array.isArray(data)).toBe(true);
      expect(pagination).toEqual({
        page: 1,
        pageSize: 10,
        totalItems: expect.any(Number),
        totalPages: expect.any(Number),
        hasPreviousPage: false,
        hasNextPage: expect.any(Boolean),
      });

      // Verify each ticket shape in data
      for (const t of data) {
        expect(t).toHaveProperty("id");
        expect(t).toHaveProperty("ticketNumber");
        expect(t).toHaveProperty("summary");
        expect(t).toHaveProperty("category");
        expect(t.category).toHaveProperty("id");
        expect(t.category).toHaveProperty("name");
        expect(t).toHaveProperty("relatedSystem");
        expect(t.relatedSystem).toHaveProperty("id");
        expect(t.relatedSystem).toHaveProperty("name");
        expect(t).toHaveProperty("requestedPriority");
        expect(t).toHaveProperty("currentStatus");
        expect(t).toHaveProperty("createdAt");
      }
    });

    it("returns 400 Bad Request if requesterId is missing", async () => {
      const res = await request(app).get("/api/tickets");

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_QUERY");
    });

    it("returns 404 Not Found for non-existent requester", async () => {
      const res = await request(app).get("/api/tickets?requesterId=9999");

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("REQUESTER_NOT_FOUND");
    });

    it("returns 404 Not Found for inactive requester (Eve Inactive)", async () => {
      const res = await request(app).get("/api/tickets?requesterId=5");

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("REQUESTER_NOT_FOUND");
    });
  });

  describe("Query Parameter Validation (400 Bad Request)", () => {
    it("returns 400 when page < 1", async () => {
      const res = await request(app).get("/api/tickets?requesterId=1&page=0");
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_QUERY");
    });

    it("returns 400 when pageSize is invalid (e.g. pageSize=15)", async () => {
      const res = await request(app).get("/api/tickets?requesterId=1&pageSize=15");
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_QUERY");
    });

    it("returns 400 when sortBy is invalid", async () => {
      const res = await request(app).get("/api/tickets?requesterId=1&sortBy=invalid");
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_QUERY");
    });

    it("returns 400 when sortDirection is invalid", async () => {
      const res = await request(app).get("/api/tickets?requesterId=1&sortDirection=up");
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_QUERY");
    });
  });

  describe("Search & Filtering", () => {
    it("filters tickets by search keyword across summary and description", async () => {
      // Create a specific ticket for search test
      resetRateLimits();
      const createRes = await request(app)
        .post("/api/tickets")
        .field("requesterId", "1")
        .field("categoryId", "1")
        .field("relatedSystemId", "1")
        .field("summary", "UniqueSearchableKeyword summary")
        .field("description", "Description with unique content for testing search matching.");

      expect(createRes.status).toBe(201);

      const searchRes = await request(app).get("/api/tickets?requesterId=1&search=uniquesearchablekeyword");
      expect(searchRes.status).toBe(200);
      expect(searchRes.body.data.length).toBeGreaterThanOrEqual(1);
      expect(searchRes.body.data[0].summary).toContain("UniqueSearchableKeyword");
    });

    it("filters tickets by currentStatus", async () => {
      const res = await request(app).get("/api/tickets?requesterId=1&status=New");
      expect(res.status).toBe(200);
      for (const t of res.body.data) {
        expect(t.currentStatus).toBe("New");
      }
    });

    it("filters tickets by priority", async () => {
      const res = await request(app).get("/api/tickets?requesterId=1&priority=HIGH");
      expect(res.status).toBe(200);
      for (const t of res.body.data) {
        expect(t.requestedPriority).toBe("HIGH");
      }
    });

    it("filters tickets by unassigned priority (priority=null or priority=unassigned)", async () => {
      const resNull = await request(app).get("/api/tickets?requesterId=1&priority=null");
      expect(resNull.status).toBe(200);
      for (const t of resNull.body.data) {
        expect(t.requestedPriority).toBeNull();
      }

      const resUnassigned = await request(app).get("/api/tickets?requesterId=1&priority=unassigned");
      expect(resUnassigned.status).toBe(200);
      for (const t of resUnassigned.body.data) {
        expect(t.requestedPriority).toBeNull();
      }
    });
  });

  describe("Sorting & Pagination", () => {
    it("sorts by priority ranking", async () => {
      const res = await request(app).get("/api/tickets?requesterId=1&sortBy=priority&sortDirection=asc");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("supports pagination with pageSize=25", async () => {
      const res = await request(app).get("/api/tickets?requesterId=1&page=1&pageSize=25");
      expect(res.status).toBe(200);
      expect(res.body.pagination.pageSize).toBe(25);
    });
  });
});
