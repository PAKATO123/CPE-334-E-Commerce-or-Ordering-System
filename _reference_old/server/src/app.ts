import express, { Request, Response } from "express";
import cors from "cors";
import multer from "multer";
import session from "express-session";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import { getPrisma } from "./prisma.js";
import { generateTicketNumber } from "./utils/ticketNumber.js";
import { isRateLimited, recordTicketCreation } from "./utils/rateLimiter.js";
import {
  requireAuth,
  requireRole,
  enforcePasswordChangeCheck,
  isPasswordComplex,
  SessionUser,
} from "./middleware/auth.js";

export const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "toktickit-lab03-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(enforcePasswordChangeCheck);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB soft limit for multer parser (5MB strict validation in route)
});

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB (BR-27)
const ALLOWED_PRIORITIES = ["URGENT", "HIGH", "MEDIUM", "LOW"];

// ---------------------------------------------------------------------------
// Health API — GET /api/health
// ---------------------------------------------------------------------------
app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", service: "TokTickIT API" });
});

// ---------------------------------------------------------------------------
// Authentication & Session APIs
// ---------------------------------------------------------------------------

// POST /api/auth/login
app.post("/api/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        error: {
          code: "MISSING_FIELDS",
          message: "Email and password are required.",
        },
      });
    }

    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { email: String(email).trim().toLowerCase() },
    });

    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      return res.status(401).json({
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email address or password.",
        },
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        error: {
          code: "ACCOUNT_DEACTIVATED",
          message: "Account is deactivated. Please contact an administrator.",
        },
      });
    }

    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
      isActive: user.isActive,
    };

    req.session.user = sessionUser;

    return req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Session error." } });
      }
      return res.status(200).json({
        user: sessionUser,
      });
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "An error occurred during login." },
    });
  }
});

// POST /api/auth/logout
app.post("/api/auth/logout", requireAuth, (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({
        error: { code: "INTERNAL_ERROR", message: "Unable to log out." },
      });
    }
    res.clearCookie("connect.sid");
    return res.status(200).json({ message: "Logged out successfully" });
  });
});

// GET /api/auth/me
app.get("/api/auth/me", requireAuth, (req: Request, res: Response) => {
  return res.status(200).json({ user: req.session.user });
});

// POST /api/auth/change-password
app.post("/api/auth/change-password", requireAuth, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: {
          code: "MISSING_FIELDS",
          message: "Current password and new password are required.",
        },
      });
    }

    const sessionUser = req.session.user!;
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });

    if (!user || !bcrypt.compareSync(currentPassword, user.passwordHash)) {
      return res.status(400).json({
        error: {
          code: "INVALID_CURRENT_PASSWORD",
          message: "Current password is incorrect.",
        },
      });
    }

    if (!isPasswordComplex(newPassword)) {
      return res.status(400).json({
        error: {
          code: "WEAK_PASSWORD",
          message: "New password must be at least 8 characters long and contain uppercase, lowercase, and numeric characters.",
        },
      });
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash, mustChangePassword: false },
    });

    req.session.user = {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      isActive: updatedUser.isActive,
      mustChangePassword: false,
    };

    return req.session.save((err) => {
      if (err) console.error("Session save error:", err);
      return res.status(200).json({
        message: "Password changed successfully",
        mustChangePassword: false,
        user: req.session.user,
      });
    });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "An error occurred while updating password." },
    });
  }
});

// ---------------------------------------------------------------------------
// Next Ticket Number Preview API — GET /api/tickets/next-number
// ---------------------------------------------------------------------------
app.get("/api/tickets/next-number", async (_req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const nextTicketNumber = await generateTicketNumber(prisma as any);
    return res.status(200).json({ data: { nextTicketNumber } });
  } catch (error) {
    console.error("Error generating next ticket number:", error);
    return res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Unable to generate next ticket number." },
    });
  }
});

// ---------------------------------------------------------------------------
// Reference Data APIs — GET /api/requesters, GET /api/related-systems, GET /api/categories
// ---------------------------------------------------------------------------
app.get("/api/requesters", async (_req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const requesters = await prisma.requester.findMany({
      where: { isActive: true },
      orderBy: { id: "asc" },
      select: { id: true, name: true, email: true, department: true },
    });
    res.status(200).json({ data: requesters });
  } catch (error) {
    console.error("Error fetching requesters:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Unable to load Development Requesters.",
      },
    });
  }
});

app.get("/api/related-systems", async (_req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const systems = await prisma.relatedSystem.findMany({
      where: { isActive: true },
      orderBy: { id: "asc" },
      select: { id: true, name: true, description: true },
    });
    res.status(200).json({ data: systems });
  } catch (error) {
    console.error("Error fetching related systems:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Unable to load Related Systems.",
      },
    });
  }
});

app.get("/api/categories", async (_req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { id: "asc" },
      select: { id: true, name: true },
    });
    res.status(200).json({ data: categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Unable to load Categories.",
      },
    });
  }
});

// ---------------------------------------------------------------------------
// My Tickets API — GET /api/tickets (F-06 & Lab 3 F-03)
// ---------------------------------------------------------------------------
app.get("/api/tickets", requireAuth, async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const sessionUser = req.session.user!;

    // Derive requesterId from authenticated session if Requester role
    let requesterId: number;
    if (sessionUser.role === "REQUESTER") {
      requesterId = sessionUser.id;
    } else {
      const requesterIdRaw = req.query.requesterId;
      requesterId = requesterIdRaw ? parseInt(String(requesterIdRaw), 10) : sessionUser.id;
    }

    if (isNaN(requesterId)) {
      return res.status(400).json({
        error: {
          code: "INVALID_QUERY",
          message: "requesterId must be a valid integer.",
        },
      });
    }

    // 2. Parse & Validate Pagination
    const pageRaw = req.query.page;
    const page = pageRaw ? parseInt(String(pageRaw), 10) : 1;
    if (isNaN(page) || page < 1) {
      return res.status(400).json({
        error: {
          code: "INVALID_QUERY",
          message: "page must be an integer greater than or equal to 1.",
        },
      });
    }

    const pageSizeRaw = req.query.pageSize;
    const pageSize = pageSizeRaw ? parseInt(String(pageSizeRaw), 10) : 10;
    if (isNaN(pageSize) || ![10, 25, 50].includes(pageSize)) {
      return res.status(400).json({
        error: {
          code: "INVALID_QUERY",
          message: "pageSize must be one of 10, 25, or 50.",
        },
      });
    }

    // 3. Parse & Validate Sorting
    const sortByRaw = req.query.sortBy;
    const sortBy = sortByRaw ? String(sortByRaw).toLowerCase() : "priority";
    if (!["priority", "status", "date", "createdat", "updatedat"].includes(sortBy)) {
      return res.status(400).json({
        error: {
          code: "INVALID_QUERY",
          message: "sortBy must be 'priority', 'status', or 'date'.",
        },
      });
    }

    const sortDirectionRaw = req.query.sortDirection;
    const sortDirection = sortDirectionRaw ? String(sortDirectionRaw).toLowerCase() : "desc";
    if (!["asc", "desc"].includes(sortDirection)) {
      return res.status(400).json({
        error: {
          code: "INVALID_QUERY",
          message: "sortDirection must be either 'asc' or 'desc'.",
        },
      });
    }

    // 4. Parse Filters
    const search = req.query.search ? String(req.query.search).trim() : undefined;
    const statusFilter = req.query.status ? String(req.query.status).trim() : undefined;
    const priorityFilter = req.query.priority ? String(req.query.priority).trim() : undefined;

    const categoryIdRaw = req.query.categoryId;
    let categoryIdFilter: number | undefined = undefined;
    if (categoryIdRaw !== undefined) {
      categoryIdFilter = parseInt(String(categoryIdRaw), 10);
      if (isNaN(categoryIdFilter)) {
        return res.status(400).json({
          error: {
            code: "INVALID_QUERY",
            message: "categoryId filter must be a valid integer.",
          },
        });
      }
    }

    const relatedSystemIdRaw = req.query.relatedSystemId;
    let relatedSystemIdFilter: number | undefined = undefined;
    if (relatedSystemIdRaw !== undefined) {
      relatedSystemIdFilter = parseInt(String(relatedSystemIdRaw), 10);
      if (isNaN(relatedSystemIdFilter)) {
        return res.status(400).json({
          error: {
            code: "INVALID_QUERY",
            message: "relatedSystemId filter must be a valid integer.",
          },
        });
      }
    }

    // 5. Build Prisma Where Condition
    const whereClause: any = {
      requesterId,
    };

    if (search) {
      whereClause.OR = [
        { ticketNumber: { contains: search, mode: "insensitive" } },
        { summary: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (statusFilter) {
      const sLower = statusFilter.toLowerCase();
      if (sLower === "open" || sLower === "all_open") {
        whereClause.currentStatus = { notIn: ["Closed", "Cancelled"] };
      } else if (sLower === "waiting_for_requester" || sLower === "waiting for requester") {
        whereClause.currentStatus = { equals: "Waiting for Requester", mode: "insensitive" };
      } else if (sLower === "resolved") {
        whereClause.currentStatus = { equals: "Resolved", mode: "insensitive" };
      } else {
        whereClause.currentStatus = { equals: statusFilter, mode: "insensitive" };
      }
    }

    if (priorityFilter) {
      const upPriority = priorityFilter.toUpperCase();
      if (upPriority === "NONE" || upPriority === "UNASSIGNED" || upPriority === "NULL") {
        whereClause.requestedPriority = null;
      } else {
        whereClause.requestedPriority = { equals: upPriority, mode: "insensitive" };
      }
    }

    if (categoryIdFilter !== undefined) {
      whereClause.categoryId = categoryIdFilter;
    }

    if (relatedSystemIdFilter !== undefined) {
      whereClause.relatedSystemId = relatedSystemIdFilter;
    }

    // 6. Fetch Matching Tickets
    const rawTickets = await prisma.ticket.findMany({
      where: whereClause,
      include: {
        category: { select: { id: true, name: true } },
        relatedSystem: { select: { id: true, name: true } },
      },
    });

    // 7. Multi-Tier Custom Rank Sorting (BR-23, BR-24)
    const isAsc = sortDirection === "asc";

    const comparePriority = (pA: string | null | undefined, pB: string | null | undefined, isAscending: boolean): number => {
      // Unassigned (null/undefined) is always ranked after assigned priorities within the same sort direction (BR-23, Spec 5.1)
      if (!pA && !pB) return 0;
      if (!pA) return 1;  // pA is unassigned -> placed after assigned pB
      if (!pB) return -1; // pB is unassigned -> pA placed before unassigned pB

      const getRank = (p: string): number => {
        const up = p.toUpperCase();
        if (up === "URGENT") return 1;
        if (up === "HIGH") return 2;
        if (up === "MEDIUM") return 3;
        if (up === "LOW") return 4;
        return 5;
      };

      const rankA = getRank(pA);
      const rankB = getRank(pB);

      // In desc mode (default): URGENT (1) comes before LOW (4) -> rankA - rankB
      // In asc mode: LOW (4) comes before URGENT (1) -> rankB - rankA
      return isAscending ? rankB - rankA : rankA - rankB;
    };

    const compareStatus = (sA: string | null | undefined, sB: string | null | undefined, isAscending: boolean): number => {
      const getRank = (s: string | null | undefined): number => {
        if (!s) return 5;
        const lower = s.toLowerCase();
        if (lower === "new") return 1;
        if (lower === "in progress") return 2;
        if (lower === "resolved") return 3;
        if (lower === "closed") return 4;
        return 5;
      };

      const rankA = getRank(sA);
      const rankB = getRank(sB);

      // In asc mode: New (1) -> In Progress (2) -> Resolved (3) -> Closed (4) -> rankA - rankB
      // In desc mode: Closed (4) -> Resolved (3) -> In Progress (2) -> New (1) -> rankB - rankA
      return isAscending ? rankA - rankB : rankB - rankA;
    };

    const compareTicketNumber = (numA: string, numB: string, isAscending: boolean): number => {
      const cmp = numA.localeCompare(numB);
      return isAscending ? cmp : -cmp;
    };

    rawTickets.sort((a, b) => {
      let comp1 = 0;
      let comp2 = 0;
      let comp3 = 0;

      if (["date", "createdat", "updatedat"].includes(sortBy)) {
        const timeA = new Date(a.updatedAt || a.createdAt).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt).getTime();
        comp1 = isAsc ? timeA - timeB : timeB - timeA;
        comp2 = comparePriority(a.requestedPriority, b.requestedPriority, isAsc);
        comp3 = compareTicketNumber(a.ticketNumber, b.ticketNumber, isAsc);
      } else if (sortBy === "priority") {
        comp1 = comparePriority(a.requestedPriority, b.requestedPriority, isAsc);
        comp2 = compareStatus(a.currentStatus, b.currentStatus, isAsc);
        comp3 = compareTicketNumber(a.ticketNumber, b.ticketNumber, isAsc);
      } else { // sortBy === "status"
        comp1 = compareStatus(a.currentStatus, b.currentStatus, isAsc);
        comp2 = comparePriority(a.requestedPriority, b.requestedPriority, isAsc);
        comp3 = compareTicketNumber(a.ticketNumber, b.ticketNumber, isAsc);
      }

      if (comp1 !== 0) return comp1;
      if (comp2 !== 0) return comp2;
      return comp3;
    });

    // 8. Pagination Slicing & Metadata (BR-25)
    const totalItems = rawTickets.length;
    const totalPages = totalItems === 0 ? 1 : Math.ceil(totalItems / pageSize);
    const hasPreviousPage = page > 1;
    const hasNextPage = page < totalPages;

    const startIndex = (page - 1) * pageSize;
    const paginatedItems = rawTickets.slice(startIndex, startIndex + pageSize).map((t) => ({
      id: t.id,
      ticketNumber: t.ticketNumber,
      summary: t.summary,
      category: t.category,
      relatedSystem: t.relatedSystem,
      requestedPriority: t.requestedPriority,
      currentStatus: t.currentStatus,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));

    return res.status(200).json({
      data: paginatedItems,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
        hasPreviousPage,
        hasNextPage,
      },
    });
  } catch (error) {
    console.error("Error loading tickets:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Unable to load tickets.",
      },
    });
  }
});

// ---------------------------------------------------------------------------
// IT Staff Ticket Queue — GET /api/tickets/staff-queue (F-04)
// ---------------------------------------------------------------------------
app.get("/api/tickets/staff-queue", requireAuth, requireRole("IT_STAFF", "ADMINISTRATOR"), async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const sessionUser = req.session.user!;

    // Pagination
    const pageRaw = req.query.page;
    const page = pageRaw ? parseInt(String(pageRaw), 10) : 1;
    if (isNaN(page) || page < 1) {
      return res.status(400).json({ error: { code: "INVALID_QUERY", message: "page must be an integer >= 1." } });
    }

    const pageSizeRaw = req.query.pageSize;
    const pageSize = pageSizeRaw ? parseInt(String(pageSizeRaw), 10) : 10;
    if (isNaN(pageSize) || ![10, 25, 50].includes(pageSize)) {
      return res.status(400).json({ error: { code: "INVALID_QUERY", message: "pageSize must be 10, 25, or 50." } });
    }

    // Sorting
    const sortByRaw = req.query.sortBy;
    const sortBy = sortByRaw ? String(sortByRaw) : "createdAt";
    const sortOrderRaw = req.query.sortOrder || req.query.sortDirection;
    const sortOrder = sortOrderRaw ? String(sortOrderRaw).toLowerCase() : "desc";
    const isAsc = sortOrder === "asc";

    // Filtering
    const search = req.query.search ? String(req.query.search).trim() : undefined;
    const statusFilter = req.query.status ? String(req.query.status).trim() : undefined;
    const itPriorityFilter = req.query.itPriority ? String(req.query.itPriority).trim() : undefined;
    const assignmentFilter = req.query.assignment ? String(req.query.assignment).trim().toLowerCase() : undefined;
    const followUpFilter = req.query.followUp ? String(req.query.followUp).trim().toLowerCase() : undefined;

    const assignedToIdRaw = req.query.assignedToId;
    let assignedToIdFilter: number | null | undefined = undefined;
    if (assignedToIdRaw !== undefined) {
      if (String(assignedToIdRaw).toLowerCase() === "unassigned") {
        assignedToIdFilter = null;
      } else {
        const parsed = parseInt(String(assignedToIdRaw), 10);
        if (!isNaN(parsed)) assignedToIdFilter = parsed;
      }
    }

    const categoryIdRaw = req.query.categoryId;
    let categoryIdFilter: number | undefined = undefined;
    if (categoryIdRaw !== undefined) {
      const parsed = parseInt(String(categoryIdRaw), 10);
      if (!isNaN(parsed)) categoryIdFilter = parsed;
    }

    const relatedSystemIdRaw = req.query.relatedSystemId;
    let relatedSystemIdFilter: number | undefined = undefined;
    if (relatedSystemIdRaw !== undefined) {
      const parsed = parseInt(String(relatedSystemIdRaw), 10);
      if (!isNaN(parsed)) relatedSystemIdFilter = parsed;
    }

    // Build Where Clause
    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { ticketNumber: { contains: search, mode: "insensitive" } },
        { summary: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { requester: { name: { contains: search, mode: "insensitive" } } },
        { requester: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (statusFilter) {
      const sLower = statusFilter.toLowerCase();
      if (sLower === "waiting_for_requester" || sLower === "waiting for requester") {
        whereClause.currentStatus = { equals: "Waiting for Requester", mode: "insensitive" };
      } else if (sLower === "in_progress" || sLower === "in progress") {
        whereClause.currentStatus = { equals: "In Progress", mode: "insensitive" };
      } else if (sLower === "pending_verification" || sLower === "pending verification") {
        whereClause.currentStatus = { equals: "Pending Verification", mode: "insensitive" };
      } else if (sLower === "open") {
        whereClause.currentStatus = { notIn: ["Closed", "Cancelled"] };
      } else {
        whereClause.currentStatus = { equals: statusFilter, mode: "insensitive" };
      }
    }

    if (itPriorityFilter) {
      const pLower = itPriorityFilter.toLowerCase();
      if (pLower === "high_urgent" || pLower === "high,urgent" || pLower === "urgent_high") {
        whereClause.itPriority = { in: ["High", "Urgent"] };
      } else if (["none", "unassigned", "null"].includes(pLower)) {
        whereClause.itPriority = null;
      } else {
        whereClause.itPriority = { equals: itPriorityFilter, mode: "insensitive" };
      }
    }

    if (assignmentFilter === "unassigned") {
      whereClause.assignedToId = null;
    } else if (assignmentFilter === "me") {
      whereClause.assignedToId = sessionUser.id;
    } else if (assignmentFilter === "assigned") {
      whereClause.assignedToId = { not: null };
    } else if (assignedToIdFilter !== undefined) {
      whereClause.assignedToId = assignedToIdFilter;
    }

    if (categoryIdFilter !== undefined) {
      whereClause.categoryId = categoryIdFilter;
    }

    if (relatedSystemIdFilter !== undefined) {
      whereClause.relatedSystemId = relatedSystemIdFilter;
    }

    if (followUpFilter === "required" || followUpFilter === "true") {
      whereClause.actionsTaken = { some: { followUpRequired: true } };
    } else if (followUpFilter === "none" || followUpFilter === "false") {
      whereClause.actionsTaken = { none: { followUpRequired: true } };
    }

    const rawTickets = await prisma.ticket.findMany({
      where: whereClause,
      include: {
        category: { select: { id: true, name: true } },
        relatedSystem: { select: { id: true, name: true } },
        requester: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true, role: true } },
        actionsTaken: { select: { id: true, followUpRequired: true } },
        _count: {
          select: {
            attachments: { where: { isDeleted: false } },
            publicComments: true,
            internalNotes: true,
          },
        },
      },
    });

    // Custom Sorting for Staff Queue
    const compareItPriority = (pA: string | null | undefined, pB: string | null | undefined, isAscending: boolean): number => {
      if (!pA && !pB) return 0;
      if (!pA) return 1;
      if (!pB) return -1;
      const getRank = (p: string): number => {
        const up = p.toLowerCase();
        if (up === "urgent") return 1;
        if (up === "high") return 2;
        if (up === "medium") return 3;
        if (up === "low") return 4;
        return 5;
      };
      return isAscending ? getRank(pB) - getRank(pA) : getRank(pA) - getRank(pB);
    };

    const compareStatus = (sA: string | null | undefined, sB: string | null | undefined, isAscending: boolean): number => {
      const getRank = (s: string | null | undefined): number => {
        if (!s) return 10;
        const lower = s.toLowerCase();
        if (lower === "new") return 1;
        if (lower === "open") return 2;
        if (lower === "in progress") return 3;
        if (lower === "waiting for requester") return 4;
        if (lower === "pending verification") return 5;
        if (lower === "reopened") return 6;
        if (lower === "resolved") return 7;
        if (lower === "closed") return 8;
        if (lower === "cancelled") return 9;
        return 10;
      };
      return isAscending ? getRank(sA) - getRank(sB) : getRank(sB) - getRank(sA);
    };

    const compareCreatedAt = (cA: Date, cB: Date, isAscending: boolean): number => {
      const diff = new Date(cA).getTime() - new Date(cB).getTime();
      return isAscending ? diff : -diff;
    };

    const compareUpdatedAt = (uA: Date, uB: Date, isAscending: boolean): number => {
      const diff = new Date(uA).getTime() - new Date(uB).getTime();
      return isAscending ? diff : -diff;
    };

    rawTickets.sort((a, b) => {
      let comp = 0;
      if (sortBy === "itPriority") {
        comp = compareItPriority(a.itPriority, b.itPriority, isAsc);
      } else if (sortBy === "currentStatus" || sortBy === "status") {
        comp = compareStatus(a.currentStatus, b.currentStatus, isAsc);
      } else if (sortBy === "updatedAt") {
        comp = compareUpdatedAt(a.updatedAt, b.updatedAt, isAsc);
      } else {
        comp = compareCreatedAt(a.createdAt, b.createdAt, isAsc);
      }

      if (comp !== 0) return comp;
      return a.ticketNumber.localeCompare(b.ticketNumber);
    });

    const total = rawTickets.length;
    const totalPages = total === 0 ? 1 : Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const paginated = rawTickets.slice(startIndex, startIndex + pageSize).map((t) => ({
      ...t,
      hasFollowUpRequired: t.actionsTaken?.some((a) => a.followUpRequired) ?? false,
    }));

    const meta = {
      total,
      page,
      pageSize,
      totalPages,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages,
    };

    return res.status(200).json({
      data: paginated,
      meta,
      pagination: meta,
    });
  } catch (error) {
    console.error("Error loading staff queue:", error);
    return res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Unable to load staff queue." },
    });
  }
});

// ---------------------------------------------------------------------------
// Claim Ticket API — PATCH /api/tickets/:id/claim (F-04)
// ---------------------------------------------------------------------------
app.patch("/api/tickets/:id/claim", requireAuth, requireRole("IT_STAFF", "ADMINISTRATOR"), async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const sessionUser = req.session.user!;
    const ticketId = parseInt(req.params.id, 10);

    if (isNaN(ticketId) || ticketId < 1) {
      return res.status(400).json({
        error: { code: "INVALID_QUERY", message: "Invalid ticket ID parameter." },
      });
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return res.status(404).json({
        error: { code: "TICKET_NOT_FOUND", message: "The requested ticket could not be found." },
      });
    }

    const nextStatus = ticket.currentStatus === "New" ? "Open" : ticket.currentStatus;

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        assignedToId: sessionUser.id,
        currentStatus: nextStatus,
      },
      include: {
        category: { select: { id: true, name: true } },
        relatedSystem: { select: { id: true, name: true } },
        requester: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    return res.status(200).json({ data: updated, ...updated });
  } catch (error) {
    console.error("Error claiming ticket:", error);
    return res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Unable to claim ticket." },
    });
  }
});

// ---------------------------------------------------------------------------
// Assign Ticket API — PATCH /api/tickets/:id/assign (F-04)
// ---------------------------------------------------------------------------
app.patch("/api/tickets/:id/assign", requireAuth, requireRole("IT_STAFF", "ADMINISTRATOR"), async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const ticketId = parseInt(req.params.id, 10);

    if (isNaN(ticketId) || ticketId < 1) {
      return res.status(400).json({
        error: { code: "INVALID_QUERY", message: "Invalid ticket ID parameter." },
      });
    }

    const { assignedToId } = req.body;
    let targetStaffId: number | null = null;

    if (assignedToId !== null && assignedToId !== undefined) {
      targetStaffId = parseInt(String(assignedToId), 10);
      if (isNaN(targetStaffId)) {
        return res.status(422).json({
          error: { code: "VALIDATION_ERROR", message: "assignedToId must be a valid integer or null." },
        });
      }

      const targetUser = await prisma.user.findUnique({ where: { id: targetStaffId } });
      if (!targetUser || !targetUser.isActive || !["IT_STAFF", "ADMINISTRATOR"].includes(targetUser.role)) {
        return res.status(422).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Assigned user does not exist, is inactive, or is not an IT staff member.",
          },
        });
      }
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return res.status(404).json({
        error: { code: "TICKET_NOT_FOUND", message: "The requested ticket could not be found." },
      });
    }

    const nextStatus = (targetStaffId !== null && ticket.currentStatus === "New") ? "Open" : ticket.currentStatus;

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        assignedToId: targetStaffId,
        currentStatus: nextStatus,
      },
      include: {
        category: { select: { id: true, name: true } },
        relatedSystem: { select: { id: true, name: true } },
        requester: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    return res.status(200).json({ data: updated, ...updated });
  } catch (error) {
    console.error("Error assigning ticket:", error);
    return res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Unable to assign ticket." },
    });
  }
});

// ---------------------------------------------------------------------------
// Set IT Priority API — PATCH /api/tickets/:id/priority (F-04)
// ---------------------------------------------------------------------------
app.patch("/api/tickets/:id/priority", requireAuth, requireRole("IT_STAFF", "ADMINISTRATOR"), async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const ticketId = parseInt(req.params.id, 10);

    if (isNaN(ticketId) || ticketId < 1) {
      return res.status(400).json({
        error: { code: "INVALID_QUERY", message: "Invalid ticket ID parameter." },
      });
    }

    const { itPriority } = req.body;
    let normalizedPriority: string | null = null;

    if (itPriority !== null && itPriority !== undefined) {
      const prioStr = String(itPriority).trim();
      const ALLOWED = ["Urgent", "High", "Medium", "Low"];
      const match = ALLOWED.find((p) => p.toLowerCase() === prioStr.toLowerCase());

      if (!match) {
        return res.status(422).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "itPriority must be one of Urgent, High, Medium, Low, or null.",
          },
        });
      }
      normalizedPriority = match;
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return res.status(404).json({
        error: { code: "TICKET_NOT_FOUND", message: "The requested ticket could not be found." },
      });
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: { itPriority: normalizedPriority },
      include: {
        category: { select: { id: true, name: true } },
        relatedSystem: { select: { id: true, name: true } },
        requester: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    return res.status(200).json({ data: updated, ...updated });
  } catch (error) {
    console.error("Error updating IT priority:", error);
    return res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Unable to update IT priority." },
    });
  }
});

// ---------------------------------------------------------------------------
// Update Ticket Status API — PATCH /api/tickets/:id/status (F-04)
// ---------------------------------------------------------------------------
app.patch("/api/tickets/:id/status", requireAuth, requireRole("IT_STAFF", "ADMINISTRATOR"), async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const ticketId = parseInt(req.params.id, 10);

    if (isNaN(ticketId) || ticketId < 1) {
      return res.status(400).json({
        error: { code: "INVALID_QUERY", message: "Invalid ticket ID parameter." },
      });
    }

    const { status, expectedUpdatedAt, updatedAt } = req.body;
    if (!status) {
      return res.status(422).json({
        error: { code: "VALIDATION_ERROR", message: "Status is required." },
      });
    }

    const ALLOWED_STATUSES = [
      "New",
      "Open",
      "In Progress",
      "Waiting for Requester",
      "Pending Verification",
      "Resolved",
      "Closed",
      "Reopened",
      "Cancelled",
    ];

    const matchStatus = ALLOWED_STATUSES.find((s) => s.toLowerCase() === String(status).trim().toLowerCase());
    if (!matchStatus) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: `Invalid status value. Allowed statuses: ${ALLOWED_STATUSES.join(", ")}`,
        },
      });
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return res.status(404).json({
        error: { code: "TICKET_NOT_FOUND", message: "The requested ticket could not be found." },
      });
    }

    // Stale update detection
    const clientUpdatedAt = expectedUpdatedAt || updatedAt || req.headers["if-unmodified-since"];
    if (clientUpdatedAt) {
      const clientTime = new Date(clientUpdatedAt).getTime();
      const serverTime = new Date(ticket.updatedAt).getTime();
      if (!isNaN(clientTime) && Math.abs(clientTime - serverTime) > 1000) {
        return res.status(409).json({
          error: {
            code: "STALE_UPDATE_CONFLICT",
            message: "Ticket status has been modified by another transaction. Please refresh and try again.",
          },
        });
      }
    }

    const PERMITTED_TRANSITIONS: Record<string, string[]> = {
      New: ["Open", "In Progress", "Cancelled"],
      Open: ["In Progress", "Waiting for Requester", "Pending Verification", "Resolved", "Cancelled"],
      "In Progress": ["Waiting for Requester", "Pending Verification", "Resolved", "Cancelled"],
      "Waiting for Requester": ["In Progress", "Pending Verification", "Resolved", "Cancelled"],
      "Pending Verification": ["Resolved", "Closed", "In Progress", "Open"],
      Resolved: ["Closed", "Reopened"],
      Closed: ["Reopened"],
      Reopened: ["In Progress", "Pending Verification", "Resolved", "Cancelled"],
      Cancelled: [],
    };

    if (ticket.currentStatus !== matchStatus) {
      const allowedNext = PERMITTED_TRANSITIONS[ticket.currentStatus] || [];
      if (!allowedNext.includes(matchStatus)) {
        return res.status(400).json({
          error: {
            code: "INVALID_STATUS_TRANSITION",
            message: `Cannot transition status from '${ticket.currentStatus}' to '${matchStatus}'.`,
          },
        });
      }
    }

    let isRequesterResolved = ticket.isRequesterResolved;
    if (ticket.currentStatus === "Pending Verification" && matchStatus !== "Pending Verification") {
      isRequesterResolved = false;
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        currentStatus: matchStatus,
        isRequesterResolved,
      },
      include: {
        category: { select: { id: true, name: true } },
        relatedSystem: { select: { id: true, name: true } },
        requester: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    return res.status(200).json({ data: updated, ...updated });
  } catch (error) {
    console.error("Error updating ticket status:", error);
    return res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Unable to update status." },
    });
  }
});

// ---------------------------------------------------------------------------
// Ticket Detail API — GET /api/tickets/:id (F-09 & Lab 3 F-03)
// ---------------------------------------------------------------------------
app.get("/api/tickets/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const sessionUser = req.session.user!;

    // 1. Validate ID param
    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId) || ticketId < 1) {
      return res.status(400).json({
        error: {
          code: "INVALID_QUERY",
          message: "Invalid ticket ID parameter.",
        },
      });
    }

    // 2. Query Ticket with relations and active/soft-deleted attachments
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        category: { select: { id: true, name: true } },
        relatedSystem: { select: { id: true, name: true } },
        requester: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true, role: true } },
        attachments: {
          select: {
            id: true,
            fileName: true,
            contentType: true,
            fileSize: true,
            isDeleted: true,
            removalReason: true,
            deletedAt: true,
            createdAt: true,
          },
          orderBy: [{ isDeleted: "asc" }, { createdAt: "asc" }],
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({
        error: {
          code: "TICKET_NOT_FOUND",
          message: "The requested ticket could not be found.",
        },
      });
    }

    // 3. Ownership Validation for Requesters (BR-06, AC-04)
    if (sessionUser.role === "REQUESTER" && ticket.requesterId !== sessionUser.id) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You do not have permission to view this ticket.",
        },
      });
    }

    return res.status(200).json({ data: ticket });
  } catch (error) {
    console.error("Error loading ticket detail:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Unable to load ticket detail.",
      },
    });
  }
});

// ---------------------------------------------------------------------------
// Requester Resolution Request API — PATCH /api/tickets/:id/resolve-indication
// ---------------------------------------------------------------------------
app.patch("/api/tickets/:id/resolve-indication", requireAuth, requireRole("REQUESTER"), async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const sessionUser = req.session.user!;
    const ticketId = parseInt(req.params.id, 10);

    if (isNaN(ticketId) || ticketId < 1) {
      return res.status(400).json({
        error: { code: "INVALID_QUERY", message: "Invalid ticket ID parameter." },
      });
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return res.status(404).json({
        error: { code: "TICKET_NOT_FOUND", message: "The requested ticket could not be found." },
      });
    }

    if (ticket.requesterId !== sessionUser.id) {
      return res.status(403).json({
        error: { code: "FORBIDDEN", message: "You do not have permission to modify this ticket." },
      });
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        isRequesterResolved: true,
        currentStatus: "Pending Verification",
      },
      include: {
        category: { select: { id: true, name: true } },
        relatedSystem: { select: { id: true, name: true } },
        requester: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true, role: true } },
        attachments: {
          select: {
            id: true,
            fileName: true,
            contentType: true,
            fileSize: true,
            isDeleted: true,
            removalReason: true,
            deletedAt: true,
            createdAt: true,
          },
          orderBy: [{ isDeleted: "asc" }, { createdAt: "asc" }],
        },
      },
    });

    return res.status(200).json({ data: updated });
  } catch (error) {
    console.error("Error setting resolve indication:", error);
    return res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Unable to update resolution indication." },
    });
  }
});

// ---------------------------------------------------------------------------
// Ticket Creation API — POST /api/tickets (F-05 & Lab 3 F-03)
// ---------------------------------------------------------------------------
app.post("/api/tickets", requireAuth, upload.array("attachments", 10), async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const sessionUser = req.session.user!;

    // 1. Parse Fields & Bind Authenticated Requester Identity (FR-07, BR-03)
    const requesterId = sessionUser.id;
    const categoryId = parseInt(req.body.categoryId, 10);
    const relatedSystemId = parseInt(req.body.relatedSystemId, 10);
    const summary = req.body.summary ? String(req.body.summary).trim() : "";
    const description = req.body.description ? String(req.body.description).trim() : "";
    const requestedPriorityRaw = req.body.requestedPriority ? String(req.body.requestedPriority).trim() : undefined;
    const requestedPriority = requestedPriorityRaw ? requestedPriorityRaw.toUpperCase() : undefined;
    const files = (req.files as Express.Multer.File[]) || [];

    // 2. Cooldown Rate Limit Check (BR-18, BR-19)
    if (!isNaN(requesterId) && isRateLimited(requesterId)) {
      return res.status(429).json({
        error: {
          code: "TICKET_CREATION_RATE_LIMITED",
          message: "You are submitting tickets too quickly. Please wait before trying again.",
        },
      });
    }

    // 3. Field Validations (BR-11, BR-12, BR-13, BR-15)
    const details: Array<{ field: string; message: string }> = [];

    if (isNaN(requesterId)) {
      details.push({ field: "requesterId", message: "Requester ID is required." });
    }
    if (isNaN(categoryId)) {
      details.push({ field: "categoryId", message: "Category ID is required." });
    }
    if (isNaN(relatedSystemId)) {
      details.push({ field: "relatedSystemId", message: "Related System ID is required." });
    }
    if (!summary) {
      details.push({ field: "summary", message: "Summary is required." });
    } else if (summary.length > 255) {
      details.push({ field: "summary", message: "Summary cannot exceed 255 characters." });
    }

    if (!description) {
      details.push({ field: "description", message: "Description is required." });
    }

    if (requestedPriority && !ALLOWED_PRIORITIES.includes(requestedPriority)) {
      details.push({ field: "requestedPriority", message: "Requested priority must be URGENT, HIGH, MEDIUM, or LOW." });
    }

    if (details.length > 0) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "The submitted ticket data is invalid.",
          details,
        },
      });
    }

    // 4. Validate active entity existence in DB
    const [requester, category, relatedSystem] = await Promise.all([
      prisma.user.findUnique({ where: { id: requesterId } }),
      prisma.category.findUnique({ where: { id: categoryId } }),
      prisma.relatedSystem.findUnique({ where: { id: relatedSystemId } }),
    ]);

    if (!requester || !requester.isActive) {
      details.push({ field: "requesterId", message: "Selected Requester does not exist or is inactive." });
    }
    if (!category || !category.isActive) {
      details.push({ field: "categoryId", message: "Selected Category does not exist or is inactive." });
    }
    if (!relatedSystem || !relatedSystem.isActive) {
      details.push({ field: "relatedSystemId", message: "Selected Related System does not exist or is inactive." });
    }

    if (details.length > 0) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "The submitted ticket data is invalid.",
          details,
        },
      });
    }

    // 5. Attachment Validations (BR-26, BR-27)
    if (files.length > 5) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Maximum 5 attachments allowed per ticket.",
        },
      });
    }

    for (const file of files) {
      if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return res.status(415).json({
          error: {
            code: "UNSUPPORTED_MEDIA_TYPE",
            message: "Disallowed attachment MIME type. Allowed types: JPEG, PNG, WEBP, PDF.",
          },
        });
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        return res.status(413).json({
          error: {
            code: "PAYLOAD_TOO_LARGE",
            message: "Attachment exceeds 5 MB size limit.",
          },
        });
      }
    }

    // 6. Atomic Transaction (BR-01, BR-02, BR-29)
    const result = await prisma.$transaction(async (tx) => {
      const ticketNumber = await generateTicketNumber(tx as any);

      const ticket = await tx.ticket.create({
        data: {
          ticketNumber,
          requesterId,
          categoryId,
          relatedSystemId,
          summary,
          description,
          requestedPriority: requestedPriority || null,
          currentStatus: "New",
        },
        include: {
          category: { select: { id: true, name: true } },
          relatedSystem: { select: { id: true, name: true } },
        },
      });

      const attachmentRecords = [];
      for (const file of files) {
        const att = await tx.attachment.create({
          data: {
            ticketId: ticket.id,
            fileName: file.originalname,
            contentType: file.mimetype,
            fileSize: file.size,
            fileData: file.buffer,
            isDeleted: false,
          },
          select: {
            id: true,
            fileName: true,
            contentType: true,
            fileSize: true,
            createdAt: true,
          },
        });
        attachmentRecords.push(att);
      }

      return {
        ...ticket,
        attachments: attachmentRecords,
      };
    });

    // Record rate limit timestamp
    recordTicketCreation(requesterId);

    return res.status(201).json({ data: result });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Unable to create ticket.",
      },
    });
  }
});

// Helper function: verifies attachment access permission
function isAttachmentAccessible(
  sessionUser: SessionUser | undefined,
  ticketRequesterId: number,
  clientRequesterId?: number
): boolean {
  if (sessionUser) {
    if (sessionUser.role === "IT_STAFF" || sessionUser.role === "ADMINISTRATOR") {
      return true;
    }
    if (sessionUser.role === "REQUESTER" && ticketRequesterId === sessionUser.id) {
      return true;
    }
  }
  if (clientRequesterId && ticketRequesterId === clientRequesterId) {
    return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Add Attachment to Existing Ticket — POST /api/tickets/:id/attachments (F-10)
// ---------------------------------------------------------------------------
app.post("/api/tickets/:id/attachments", upload.single("file"), async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const sessionUser = req.session?.user;
    const ticketId = parseInt(req.params.id, 10);
    const clientReqId = parseInt(String(req.body.requesterId || req.query.requesterId), 10);

    if (isNaN(ticketId)) {
      return res.status(400).json({
        error: { code: "INVALID_QUERY", message: "Ticket ID is required." },
      });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { attachments: { where: { isDeleted: false } } },
    });

    if (!ticket) {
      return res.status(404).json({
        error: { code: "TICKET_NOT_FOUND", message: "The requested ticket could not be found." },
      });
    }

    const hasAccess = isAttachmentAccessible(sessionUser, ticket.requesterId, isNaN(clientReqId) ? undefined : clientReqId);
    if (!hasAccess) {
      return res.status(403).json({
        error: { code: "FORBIDDEN", message: "You do not have permission to modify this ticket." },
      });
    }

    if (ticket.attachments.length >= 5) {
      return res.status(409).json({
        error: {
          code: "ATTACHMENT_LIMIT_REACHED",
          message: "This ticket already has the maximum number of active attachments.",
        },
      });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "Attachment file is required." },
      });
    }

    if (file.size > 5 * 1024 * 1024) {
      return res.status(413).json({
        error: { code: "ATTACHMENT_TOO_LARGE", message: "The attachment exceeds the 5 MB size limit." },
      });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return res.status(415).json({
        error: { code: "ATTACHMENT_TYPE_NOT_ALLOWED", message: "This attachment type is not supported." },
      });
    }

    const attachment = await prisma.attachment.create({
      data: {
        ticketId,
        fileName: file.originalname,
        contentType: file.mimetype,
        fileSize: file.size,
        fileData: file.buffer,
      },
      select: {
        id: true,
        ticketId: true,
        fileName: true,
        contentType: true,
        fileSize: true,
        createdAt: true,
      },
    });

    return res.status(201).json({ data: attachment });
  } catch (error) {
    console.error("Error adding attachment:", error);
    return res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Unable to add attachment." },
    });
  }
});

// ---------------------------------------------------------------------------
// Download Active Attachment — GET /api/attachments/:id/download (F-10)
// ---------------------------------------------------------------------------
app.get("/api/attachments/:id/download", async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const sessionUser = req.session?.user;
    const attachmentId = parseInt(req.params.id, 10);
    const clientReqId = parseInt(String(req.query.requesterId), 10);

    if (isNaN(attachmentId)) {
      return res.status(400).json({
        error: { code: "INVALID_QUERY", message: "Attachment ID is required." },
      });
    }

    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: { ticket: { select: { requesterId: true } } },
    });

    if (!attachment || attachment.isDeleted) {
      return res.status(404).json({
        error: { code: "ATTACHMENT_NOT_FOUND", message: "The requested attachment could not be found." },
      });
    }

    const hasAccess = isAttachmentAccessible(sessionUser, attachment.ticket.requesterId, isNaN(clientReqId) ? undefined : clientReqId);
    if (!hasAccess) {
      return res.status(403).json({
        error: { code: "FORBIDDEN", message: "You do not have permission to access this attachment." },
      });
    }

    const safeFilename = encodeURIComponent(attachment.fileName);
    res.setHeader("Content-Type", attachment.contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}"; filename*=UTF-8''${safeFilename}`);
    res.setHeader("Content-Length", attachment.fileSize);
    return res.status(200).send(attachment.fileData);
  } catch (error) {
    console.error("Error downloading attachment:", error);
    return res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Unable to download attachment." },
    });
  }
});

// ---------------------------------------------------------------------------
// Preview Active Attachment — GET /api/attachments/:id/preview (F-10)
// ---------------------------------------------------------------------------
app.get("/api/attachments/:id/preview", async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const sessionUser = req.session?.user;
    const attachmentId = parseInt(req.params.id, 10);
    const clientReqId = parseInt(String(req.query.requesterId), 10);

    if (isNaN(attachmentId)) {
      return res.status(400).json({
        error: { code: "INVALID_QUERY", message: "Attachment ID is required." },
      });
    }

    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: { ticket: { select: { requesterId: true } } },
    });

    if (!attachment || attachment.isDeleted) {
      return res.status(404).json({
        error: { code: "ATTACHMENT_NOT_FOUND", message: "The requested attachment could not be found." },
      });
    }

    const hasAccess = isAttachmentAccessible(sessionUser, attachment.ticket.requesterId, isNaN(clientReqId) ? undefined : clientReqId);
    if (!hasAccess) {
      return res.status(403).json({
        error: { code: "FORBIDDEN", message: "You do not have permission to access this attachment." },
      });
    }

    const safeFilename = encodeURIComponent(attachment.fileName);
    res.setHeader("Content-Type", attachment.contentType);
    res.setHeader("Content-Disposition", `inline; filename="${safeFilename}"; filename*=UTF-8''${safeFilename}`);
    res.setHeader("Content-Length", attachment.fileSize);
    return res.status(200).send(attachment.fileData);
  } catch (error) {
    console.error("Error previewing attachment:", error);
    return res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Unable to preview attachment." },
    });
  }
});

// ---------------------------------------------------------------------------
// Soft-Remove Attachment — DELETE /api/attachments/:id (F-10)
// ---------------------------------------------------------------------------
app.delete("/api/attachments/:id", async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const sessionUser = req.session?.user;
    const attachmentId = parseInt(req.params.id, 10);
    const clientReqId = parseInt(String(req.body.requesterId || req.query.requesterId), 10);
    const reasonRaw = req.body.reason ? String(req.body.reason).trim() : "";

    if (isNaN(attachmentId)) {
      return res.status(400).json({
        error: { code: "INVALID_QUERY", message: "Attachment ID is required." },
      });
    }

    if (!reasonRaw) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Removal reason is required.",
          details: [{ field: "reason", message: "Removal reason is required." }],
        },
      });
    }

    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: { ticket: { select: { requesterId: true } } },
    });

    if (!attachment || attachment.isDeleted) {
      return res.status(404).json({
        error: { code: "ATTACHMENT_NOT_FOUND", message: "The requested attachment could not be found." },
      });
    }

    const hasAccess = isAttachmentAccessible(sessionUser, attachment.ticket.requesterId, isNaN(clientReqId) ? undefined : clientReqId);
    if (!hasAccess) {
      return res.status(403).json({
        error: { code: "FORBIDDEN", message: "You do not have permission to remove this attachment." },
      });
    }

    const updated = await prisma.attachment.update({
      where: { id: attachmentId },
      data: {
        isDeleted: true,
        removalReason: reasonRaw,
        deletedAt: new Date(),
      },
      select: {
        id: true,
        isDeleted: true,
        removalReason: true,
        deletedAt: true,
      },
    });

    return res.status(200).json({ data: updated });
  } catch (error) {
    console.error("Error removing attachment:", error);
    return res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Unable to remove attachment." },
    });
  }
});

// ---------------------------------------------------------------------------
// Public Comments API — GET / POST /api/tickets/:id/comments
// ---------------------------------------------------------------------------
app.get("/api/tickets/:id/comments", requireAuth, async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const sessionUser = req.session.user!;
    const ticketId = parseInt(req.params.id, 10);

    if (isNaN(ticketId) || ticketId < 1) {
      return res.status(400).json({
        error: { code: "INVALID_QUERY", message: "Invalid ticket ID parameter." },
      });
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return res.status(404).json({
        error: { code: "TICKET_NOT_FOUND", message: "The requested ticket could not be found." },
      });
    }

    if (sessionUser.role === "REQUESTER" && ticket.requesterId !== sessionUser.id) {
      return res.status(403).json({
        error: { code: "FORBIDDEN", message: "You do not have permission to view comments for this ticket." },
      });
    }

    const comments = await prisma.publicComment.findMany({
      where: { ticketId },
      include: {
        author: { select: { id: true, name: true, role: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ data: comments });
  } catch (error) {
    console.error("Error loading public comments:", error);
    return res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Unable to load public comments." },
    });
  }
});

app.post("/api/tickets/:id/comments", requireAuth, async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const sessionUser = req.session.user!;
    const ticketId = parseInt(req.params.id, 10);

    if (isNaN(ticketId) || ticketId < 1) {
      return res.status(400).json({
        error: { code: "INVALID_QUERY", message: "Invalid ticket ID parameter." },
      });
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return res.status(404).json({
        error: { code: "TICKET_NOT_FOUND", message: "The requested ticket could not be found." },
      });
    }

    if (sessionUser.role === "REQUESTER" && ticket.requesterId !== sessionUser.id) {
      return res.status(403).json({
        error: { code: "FORBIDDEN", message: "You do not have permission to comment on this ticket." },
      });
    }

    const content = req.body.content ? String(req.body.content).trim() : "";
    if (!content) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Comment content cannot be empty.",
          details: [{ field: "content", message: "Content is required." }],
        },
      });
    }

    if (content.length > 2000) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Comment content cannot exceed 2000 characters.",
        },
      });
    }

    const comment = await prisma.publicComment.create({
      data: {
        ticketId,
        authorId: sessionUser.id,
        content,
      },
      include: {
        author: { select: { id: true, name: true, role: true, email: true } },
      },
    });

    return res.status(201).json({ data: comment });
  } catch (error) {
    console.error("Error posting public comment:", error);
    return res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Unable to post public comment." },
    });
  }
});

// ---------------------------------------------------------------------------
// Confidential Internal Notes API — GET / POST /api/tickets/:id/notes
// ---------------------------------------------------------------------------
app.get("/api/tickets/:id/notes", requireAuth, requireRole("IT_STAFF", "ADMINISTRATOR"), async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const ticketId = parseInt(req.params.id, 10);

    if (isNaN(ticketId) || ticketId < 1) {
      return res.status(400).json({
        error: { code: "INVALID_QUERY", message: "Invalid ticket ID parameter." },
      });
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return res.status(404).json({
        error: { code: "TICKET_NOT_FOUND", message: "The requested ticket could not be found." },
      });
    }

    const notes = await prisma.internalNote.findMany({
      where: { ticketId },
      include: {
        author: { select: { id: true, name: true, role: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ data: notes });
  } catch (error) {
    console.error("Error loading internal notes:", error);
    return res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Unable to load internal notes." },
    });
  }
});

app.post("/api/tickets/:id/notes", requireAuth, requireRole("IT_STAFF", "ADMINISTRATOR"), async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const sessionUser = req.session.user!;
    const ticketId = parseInt(req.params.id, 10);

    if (isNaN(ticketId) || ticketId < 1) {
      return res.status(400).json({
        error: { code: "INVALID_QUERY", message: "Invalid ticket ID parameter." },
      });
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return res.status(404).json({
        error: { code: "TICKET_NOT_FOUND", message: "The requested ticket could not be found." },
      });
    }

    const content = req.body.content ? String(req.body.content).trim() : "";
    if (!content) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Internal note content cannot be empty.",
          details: [{ field: "content", message: "Content is required." }],
        },
      });
    }

    if (content.length > 2000) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Internal note content cannot exceed 2000 characters.",
        },
      });
    }

    const note = await prisma.internalNote.create({
      data: {
        ticketId,
        authorId: sessionUser.id,
        content,
      },
      include: {
        author: { select: { id: true, name: true, role: true, email: true } },
      },
    });

    return res.status(201).json({ data: note });
  } catch (error) {
    console.error("Error posting internal note:", error);
    return res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Unable to post internal note." },
    });
  }
});

// ---------------------------------------------------------------------------
// Dashboard Operations APIs — GET /api/dashboard/requester, /staff, /admin
// ---------------------------------------------------------------------------
app.get("/api/dashboard/requester", requireAuth, async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const sessionUser = req.session.user!;
    let targetRequesterId = sessionUser.id;

    if (req.query.requesterId && (sessionUser.role === "IT_STAFF" || sessionUser.role === "ADMINISTRATOR")) {
      const parsedReqId = parseInt(String(req.query.requesterId), 10);
      if (!isNaN(parsedReqId) && parsedReqId > 0) {
        targetRequesterId = parsedReqId;
      }
    }

    const totalOpen = await prisma.ticket.count({
      where: {
        requesterId: targetRequesterId,
        currentStatus: { notIn: ["Closed", "Cancelled"] },
      },
    });

    const waitingForRequester = await prisma.ticket.count({
      where: {
        requesterId: targetRequesterId,
        currentStatus: "Waiting for Requester",
      },
    });

    const recentlyUpdated = await prisma.ticket.findMany({
      where: { requesterId: targetRequesterId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        category: { select: { name: true } },
        relatedSystem: { select: { name: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    });

    const recentlyResolved = await prisma.ticket.findMany({
      where: {
        requesterId: targetRequesterId,
        currentStatus: "Resolved",
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        category: { select: { name: true } },
        relatedSystem: { select: { name: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    });

    return res.status(200).json({
      data: {
        metrics: {
          totalOpen,
          waitingForRequester,
        },
        recentlyUpdated,
        recentlyResolved,
      },
    });
  } catch (error) {
    console.error("Error generating Requester Dashboard metrics:", error);
    return res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Unable to load Requester Dashboard data." },
    });
  }
});

app.get("/api/dashboard/staff", requireAuth, requireRole("IT_STAFF", "ADMINISTRATOR"), async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const sessionUser = req.session.user!;

    const unassignedCount = await prisma.ticket.count({
      where: {
        assignedToId: null,
        currentStatus: { notIn: ["Closed", "Cancelled"] },
      },
    });

    const myOwnedCount = await prisma.ticket.count({
      where: {
        assignedToId: sessionUser.id,
        currentStatus: { notIn: ["Closed", "Cancelled"] },
      },
    });

    const urgentHighCount = await prisma.ticket.count({
      where: {
        currentStatus: { notIn: ["Closed", "Cancelled"] },
        OR: [
          { itPriority: { in: ["Urgent", "High"] } },
          {
            itPriority: null,
            requestedPriority: { in: ["URGENT", "HIGH"] },
          },
        ],
      },
    });

    const followUpCount = await prisma.ticket.count({
      where: {
        currentStatus: { notIn: ["Closed", "Cancelled"] },
        actionsTaken: {
          some: {
            followUpRequired: true,
          },
        },
      },
    });

    const statusCountsRaw = await prisma.ticket.groupBy({
      by: ["currentStatus"],
      _count: { currentStatus: true },
    });

    const statusDistribution: Record<string, number> = {
      New: 0,
      Open: 0,
      "In Progress": 0,
      "Waiting for Requester": 0,
      Resolved: 0,
      Closed: 0,
      Reopened: 0,
      Cancelled: 0,
    };

    statusCountsRaw.forEach((sc) => {
      statusDistribution[sc.currentStatus] = sc._count.currentStatus;
    });

    const recentActivity = await prisma.ticket.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        requester: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true } },
        category: { select: { name: true } },
      },
    });

    return res.status(200).json({
      data: {
        metrics: {
          unassignedCount,
          myOwnedCount,
          urgentHighCount,
          followUpCount,
        },
        statusDistribution,
        recentActivity,
      },
    });
  } catch (error) {
    console.error("Error generating IT Staff Dashboard metrics:", error);
    return res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Unable to load IT Staff Dashboard data." },
    });
  }
});

app.get("/api/dashboard/admin", requireAuth, requireRole("ADMINISTRATOR"), async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const sessionUser = req.session.user!;

    const unassignedCount = await prisma.ticket.count({
      where: {
        assignedToId: null,
        currentStatus: { notIn: ["Closed", "Cancelled"] },
      },
    });

    const myOwnedCount = await prisma.ticket.count({
      where: {
        assignedToId: sessionUser.id,
        currentStatus: { notIn: ["Closed", "Cancelled"] },
      },
    });

    const urgentHighCount = await prisma.ticket.count({
      where: {
        currentStatus: { notIn: ["Closed", "Cancelled"] },
        OR: [
          { itPriority: { in: ["Urgent", "High"] } },
          {
            itPriority: null,
            requestedPriority: { in: ["URGENT", "HIGH"] },
          },
        ],
      },
    });

    const followUpCount = await prisma.ticket.count({
      where: {
        currentStatus: { notIn: ["Closed", "Cancelled"] },
        actionsTaken: {
          some: {
            followUpRequired: true,
          },
        },
      },
    });

    const statusCountsRaw = await prisma.ticket.groupBy({
      by: ["currentStatus"],
      _count: { currentStatus: true },
    });

    const statusDistribution: Record<string, number> = {
      New: 0,
      Open: 0,
      "In Progress": 0,
      "Waiting for Requester": 0,
      Resolved: 0,
      Closed: 0,
      Reopened: 0,
      Cancelled: 0,
    };

    statusCountsRaw.forEach((sc) => {
      statusDistribution[sc.currentStatus] = sc._count.currentStatus;
    });

    const recentActivity = await prisma.ticket.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        requester: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true } },
        category: { select: { name: true } },
      },
    });

    const totalUsers = await prisma.user.count();
    const requesterCount = await prisma.user.count({ where: { role: "REQUESTER", isActive: true } });
    const staffCount = await prisma.user.count({ where: { role: "IT_STAFF", isActive: true } });
    const adminCount = await prisma.user.count({ where: { role: "ADMINISTRATOR", isActive: true } });
    const inactiveCount = await prisma.user.count({ where: { isActive: false } });

    return res.status(200).json({
      data: {
        metrics: {
          unassignedCount,
          myOwnedCount,
          urgentHighCount,
          followUpCount,
        },
        userStats: {
          totalUsers,
          requesterCount,
          staffCount,
          adminCount,
          inactiveCount,
        },
        statusDistribution,
        recentActivity,
      },
    });
  } catch (error) {
    console.error("Error generating Admin Dashboard data:", error);
    return res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Unable to load Admin Dashboard data." },
    });
  }
});

// ---------------------------------------------------------------------------
// User Management & Staff Selection API — GET /api/users
// ---------------------------------------------------------------------------
app.get("/api/users", requireAuth, requireRole("IT_STAFF", "ADMINISTRATOR"), async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const roleFilter = req.query.role ? String(req.query.role).trim().toUpperCase() : undefined;
    const isActiveQuery = req.query.isActive;
    const search = req.query.search ? String(req.query.search).trim() : undefined;

    const page = req.query.page !== undefined ? Math.max(1, parseInt(String(req.query.page), 10) || 1) : undefined;
    const pageSize = req.query.pageSize !== undefined ? Math.max(1, parseInt(String(req.query.pageSize), 10) || 10) : undefined;

    const whereClause: any = {};
    if (roleFilter && ["REQUESTER", "IT_STAFF", "ADMINISTRATOR"].includes(roleFilter)) {
      whereClause.role = roleFilter;
    }
    if (isActiveQuery !== undefined) {
      whereClause.isActive = String(isActiveQuery).toLowerCase() === "true";
    }
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const totalUsers = await prisma.user.count({ where: whereClause });

    const findOptions: any = {
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
      },
      orderBy: [{ role: "asc" }, { name: "asc" }],
    };

    if (page !== undefined && pageSize !== undefined) {
      findOptions.skip = (page - 1) * pageSize;
      findOptions.take = pageSize;
    }

    const users = await prisma.user.findMany(findOptions);

    const effPageSize = pageSize || totalUsers || 1;
    const totalPages = Math.ceil(totalUsers / effPageSize) || 1;
    const effPage = page || 1;

    const pagination = {
      total: totalUsers,
      totalItems: totalUsers,
      page: effPage,
      pageSize: effPageSize,
      totalPages,
      hasPreviousPage: effPage > 1,
      hasNextPage: effPage < totalPages,
    };

    return res.status(200).json({ data: users, meta: pagination, pagination });
  } catch (error) {
    console.error("Error loading users list:", error);
    return res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Unable to load users list." },
    });
  }
});

// ---------------------------------------------------------------------------
// Create User Account — POST /api/users
// ---------------------------------------------------------------------------
app.post("/api/users", requireAuth, requireRole("ADMINISTRATOR"), async (req: Request, res: Response) => {
  try {
    const { name, email, role, initialPassword } = req.body;

    if (!name || !email || !role || !initialPassword) {
      return res.status(400).json({
        error: { code: "MISSING_FIELDS", message: "Name, email, role, and initial password are required." },
      });
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    const trimmedRole = String(role).trim().toUpperCase();

    if (!["REQUESTER", "IT_STAFF", "ADMINISTRATOR"].includes(trimmedRole)) {
      return res.status(400).json({
        error: { code: "INVALID_ROLE", message: "Invalid user role specified." },
      });
    }

    const prisma = getPrisma();
    const existingUser = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (existingUser) {
      return res.status(409).json({
        error: { code: "EMAIL_ALREADY_EXISTS", message: "An account with this email address already exists." },
      });
    }

    if (!isPasswordComplex(String(initialPassword))) {
      return res.status(400).json({
        error: {
          code: "WEAK_PASSWORD",
          message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.",
        },
      });
    }

    const newUser = await prisma.user.create({
      data: {
        name: String(name).trim(),
        email: trimmedEmail,
        role: trimmedRole as any,
        passwordHash: bcrypt.hashSync(String(initialPassword), 10),
        isActive: true,
        mustChangePassword: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
      },
    });

    return res.status(201).json({ user: newUser, data: newUser });
  } catch (error) {
    console.error("Error creating user account:", error);
    return res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Unable to create user account." },
    });
  }
});

// ---------------------------------------------------------------------------
// Update User Details / Role / Status — PATCH /api/users/:id
// ---------------------------------------------------------------------------
app.patch("/api/users/:id", requireAuth, requireRole("ADMINISTRATOR"), async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({
        error: { code: "INVALID_INPUT", message: "Invalid user ID." },
      });
    }

    const prisma = getPrisma();
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return res.status(404).json({
        error: { code: "USER_NOT_FOUND", message: "User account not found." },
      });
    }

    const { name, email, role, isActive } = req.body;
    const updateData: any = {};

    if (email !== undefined && String(email).trim().toLowerCase() !== targetUser.email.toLowerCase()) {
      const trimmedEmail = String(email).trim().toLowerCase();
      const existingUser = await prisma.user.findUnique({
        where: { email: trimmedEmail },
      });
      if (existingUser) {
        return res.status(409).json({
          error: { code: "EMAIL_ALREADY_EXISTS", message: "An account with this email address already exists." },
        });
      }
      updateData.email = trimmedEmail;
    }

    if (name !== undefined) {
      updateData.name = String(name).trim();
    }

    if (role !== undefined) {
      const trimmedRole = String(role).trim().toUpperCase();
      if (!["REQUESTER", "IT_STAFF", "ADMINISTRATOR"].includes(trimmedRole)) {
        return res.status(400).json({
          error: { code: "INVALID_ROLE", message: "Invalid user role specified." },
        });
      }
      updateData.role = trimmedRole;
    }

    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
    }

    // BR-18: Admin Self-Deactivation Guard
    const currentAdminId = (req.session as any)?.user?.id;
    if (updateData.isActive === false && targetUser.id === currentAdminId) {
      return res.status(400).json({
        error: {
          code: "SELF_DEACTIVATION_PROHIBITED",
          message: "Administrators cannot deactivate their own active account.",
        },
      });
    }

    // BR-19: Minimum Active Admin Guard
    const isDeactivatingAdmin = targetUser.role === "ADMINISTRATOR" && targetUser.isActive && updateData.isActive === false;
    const isChangingAdminRole = targetUser.role === "ADMINISTRATOR" && targetUser.isActive && updateData.role && updateData.role !== "ADMINISTRATOR";

    if (isDeactivatingAdmin || isChangingAdminRole) {
      const activeAdminCount = await prisma.user.count({
        where: { role: "ADMINISTRATOR", isActive: true },
      });
      if (activeAdminCount <= 1) {
        return res.status(400).json({
          error: {
            code: "LAST_ADMIN_PROTECTED",
            message: "Cannot deactivate or change the role of the last active Administrator.",
          },
        });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({ user: updatedUser, data: updatedUser });
  } catch (error) {
    console.error("Error updating user account:", error);
    return res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Unable to update user account." },
    });
  }
});

// ---------------------------------------------------------------------------
// Reset User Initial Password — POST /api/users/:id/reset-password
// ---------------------------------------------------------------------------
app.post("/api/users/:id/reset-password", requireAuth, requireRole("ADMINISTRATOR"), async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({
        error: { code: "INVALID_INPUT", message: "Invalid user ID." },
      });
    }

    const prisma = getPrisma();
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return res.status(404).json({
        error: { code: "USER_NOT_FOUND", message: "User account not found." },
      });
    }

    const { initialPassword } = req.body;
    if (!initialPassword || !isPasswordComplex(String(initialPassword))) {
      return res.status(400).json({
        error: {
          code: "WEAK_PASSWORD",
          message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.",
        },
      });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: bcrypt.hashSync(String(initialPassword), 10),
        mustChangePassword: true,
      },
    });

    return res.status(200).json({
      message: "Initial password set successfully",
      mustChangePassword: true,
    });
  } catch (error) {
    console.error("Error resetting initial password:", error);
    return res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Unable to reset initial password." },
    });
  }
});

// ---------------------------------------------------------------------------
// Actions Taken APIs (Lab 4 Sprint)
// ---------------------------------------------------------------------------

// GET /api/tickets/:ticketId/actions-taken
app.get("/api/tickets/:ticketId/actions-taken", requireAuth, async (req: Request, res: Response) => {
  try {
    const ticketId = parseInt(req.params.ticketId, 10);
    if (isNaN(ticketId)) {
      return res.status(400).json({ error: { code: "INVALID_ID", message: "Invalid ticket ID format." } });
    }

    const prisma = getPrisma();
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, requesterId: true },
    });

    if (!ticket) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Ticket not found." } });
    }

    const currentUser = req.session.user!;
    if (currentUser.role === "REQUESTER" && ticket.requesterId !== currentUser.id) {
      return res.status(403).json({ error: { code: "FORBIDDEN", message: "Access denied." } });
    }

    const actionsTaken = await prisma.actionTaken.findMany({
      where: { ticketId },
      orderBy: { createdAt: "desc" },
      include: {
        performedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return res.status(200).json({ actionsTaken });
  } catch (error) {
    console.error("Error fetching Actions Taken:", error);
    return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Unable to fetch Actions Taken." } });
  }
});

// POST /api/tickets/:ticketId/actions-taken
app.post(
  "/api/tickets/:ticketId/actions-taken",
  requireAuth,
  requireRole("IT_STAFF", "ADMINISTRATOR"),
  async (req: Request, res: Response) => {
    try {
      const ticketId = parseInt(req.params.ticketId, 10);
      if (isNaN(ticketId)) {
        return res.status(400).json({ error: { code: "INVALID_ID", message: "Invalid ticket ID format." } });
      }

      const prisma = getPrisma();
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
      });

      if (!ticket) {
        return res.status(404).json({ error: { code: "NOT_FOUND", message: "Ticket not found." } });
      }

      if (ticket.currentStatus === "Cancelled") {
        return res.status(400).json({
          error: { code: "TERMINAL_TICKET", message: "Cannot add Action Taken to a Cancelled ticket." },
        });
      }

      const { actionDate, description, result, followUpRequired, followUpNote, attachmentNotes } = req.body;

      if (!description || String(description).trim().length < 3) {
        return res.status(400).json({
          error: { code: "VALIDATION_ERROR", message: "Action description is required (min 3 characters)." },
        });
      }

      if (!result || String(result).trim().length < 3) {
        return res.status(400).json({
          error: { code: "VALIDATION_ERROR", message: "Action result is required (min 3 characters)." },
        });
      }

      const isFollowUpReq = Boolean(followUpRequired);
      const followNoteStr = followUpNote ? String(followUpNote).trim() : "";

      if (isFollowUpReq && followNoteStr.length === 0) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Follow-up note is required when follow-up is requested.",
          },
        });
      }

      const performedById = req.session.user!.id;
      const parsedActionDate = actionDate ? new Date(actionDate) : new Date();

      const actionTaken = await prisma.actionTaken.create({
        data: {
          ticketId,
          performedById,
          actionDate: isNaN(parsedActionDate.getTime()) ? new Date() : parsedActionDate,
          description: String(description).trim(),
          result: String(result).trim(),
          followUpRequired: isFollowUpReq,
          isFollowedUp: false,
          followUpNote: isFollowUpReq && followNoteStr.length > 0 ? followNoteStr : null,
          attachmentNotes: attachmentNotes ? String(attachmentNotes).trim() : null,
        },
        include: {
          performedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      return res.status(201).json({ actionTaken });
    } catch (error) {
      console.error("Error creating Action Taken:", error);
      return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Unable to create Action Taken." } });
    }
  }
);

// PUT /api/tickets/:ticketId/actions-taken/:actionId
app.put(
  "/api/tickets/:ticketId/actions-taken/:actionId",
  requireAuth,
  requireRole("IT_STAFF", "ADMINISTRATOR"),
  async (req: Request, res: Response) => {
    try {
      const ticketId = parseInt(req.params.ticketId, 10);
      const actionId = parseInt(req.params.actionId, 10);
      if (isNaN(ticketId) || isNaN(actionId)) {
        return res.status(400).json({ error: { code: "INVALID_ID", message: "Invalid ID format." } });
      }

      const prisma = getPrisma();
      const existingAction = await prisma.actionTaken.findFirst({
        where: { id: actionId, ticketId },
        include: { ticket: true },
      });

      if (!existingAction) {
        return res.status(404).json({ error: { code: "NOT_FOUND", message: "Action Taken record not found." } });
      }

      if (existingAction.ticket.currentStatus === "Cancelled") {
        return res.status(400).json({
          error: { code: "TERMINAL_TICKET", message: "Cannot edit Action Taken on a Cancelled ticket." },
        });
      }

      const { actionDate, description, result, followUpRequired, isFollowedUp, followUpNote, attachmentNotes, expectedUpdatedAt, updatedAt } = req.body;

      // Stale update detection (409 Conflict)
      const clientUpdatedAt = expectedUpdatedAt || updatedAt || req.headers["if-unmodified-since"];
      if (clientUpdatedAt) {
        const clientTime = new Date(clientUpdatedAt).getTime();
        const serverTime = new Date(existingAction.updatedAt).getTime();
        if (!isNaN(clientTime) && Math.abs(clientTime - serverTime) > 1000) {
          return res.status(409).json({
            error: {
              code: "STALE_UPDATE_CONFLICT",
              message: "Action Taken record has been modified by another transaction. Please refresh and try again.",
            },
          });
        }
      }

      if (description !== undefined && String(description).trim().length < 3) {
        return res.status(400).json({
          error: { code: "VALIDATION_ERROR", message: "Action description must be at least 3 characters." },
        });
      }

      if (result !== undefined && String(result).trim().length < 3) {
        return res.status(400).json({
          error: { code: "VALIDATION_ERROR", message: "Action result must be at least 3 characters." },
        });
      }

      const isFollowUpReq = followUpRequired !== undefined ? Boolean(followUpRequired) : existingAction.followUpRequired;
      let isFollowedUpVal = existingAction.isFollowedUp;
      if (isFollowedUp !== undefined) {
        isFollowedUpVal = Boolean(isFollowedUp);
      }
      if (isFollowUpReq) {
        isFollowedUpVal = false;
      }

      const followNoteStr = followUpNote !== undefined ? String(followUpNote).trim() : (existingAction.followUpNote || "");

      if (isFollowUpReq && followNoteStr.length === 0) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Follow-up note is required when follow-up is requested.",
          },
        });
      }

      let finalFollowUpNote: string | null = null;
      if (isFollowUpReq) {
        finalFollowUpNote = followNoteStr;
      } else if (isFollowedUpVal) {
        finalFollowUpNote = followNoteStr.length > 0 ? followNoteStr : (existingAction.followUpNote || "Followed up");
      } else {
        finalFollowUpNote = null;
      }

      const parsedActionDate = actionDate ? new Date(actionDate) : existingAction.actionDate;

      const updatedAction = await prisma.actionTaken.update({
        where: { id: actionId },
        data: {
          actionDate: isNaN(parsedActionDate.getTime()) ? existingAction.actionDate : parsedActionDate,
          description: description !== undefined ? String(description).trim() : existingAction.description,
          result: result !== undefined ? String(result).trim() : existingAction.result,
          followUpRequired: isFollowUpReq,
          isFollowedUp: isFollowedUpVal,
          followUpNote: finalFollowUpNote,
          attachmentNotes: attachmentNotes !== undefined ? (attachmentNotes ? String(attachmentNotes).trim() : null) : existingAction.attachmentNotes,
        },
        include: {
          performedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      return res.status(200).json({ actionTaken: updatedAction });
    } catch (error) {
      console.error("Error updating Action Taken:", error);
      return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Unable to update Action Taken." } });
    }
  }
);

// ---------------------------------------------------------------------------
// Centralized Error Handling Middleware (including Multer errors)
// ---------------------------------------------------------------------------
app.use((err: any, _req: Request, res: Response, _next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        error: {
          code: "PAYLOAD_TOO_LARGE",
          message: "Attachment exceeds size limit.",
        },
      });
    }
    return res.status(400).json({
      error: {
        code: "INVALID_UPLOAD",
        message: err.message,
      },
    });
  }

  console.error("Unhandled server error:", err);
  return res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: err.message || "An unexpected internal server error occurred.",
    },
  });
});

export default app;
