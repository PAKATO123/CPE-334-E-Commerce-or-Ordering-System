import express, { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import cors from "cors";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import multer from "multer";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import { sessionConfig } from "./utils/sessionConfig.js";
import { getPrisma } from "./prisma.js";
import { generateOrderNumber } from "./utils/orderNumber.js";
import {
  isOperatorOrderStatus,
  listOperatorOrders,
  isFulfillmentStatus,
  parseOperatorOrderId,
  processOperatorOrder,
  OperatorOrderError,
} from "./services/operatorOrders.js";
import {
  createProduct,
  updateProduct,
  restockProduct,
  ProductError,
} from "./services/products.js";
import {
  cancelCustomerOrder,
  CancellationError,
} from "./services/cancellation.js";
import {
  simulateOrderPayment,
  PaymentError,
} from "./services/payment.js";
import {
  getSalesSummary,
  getTurnaroundMetrics,
  ReportsError,
} from "./services/reports.js";
import { loginRateLimiter } from "./middleware/rateLimit.js";
import {
  requireAuth,
  requireRole,
  enforcePasswordChangeCheck,
  isPasswordComplex,
  SessionUser,
  Role,
} from "./middleware/auth.js";

const sessionSettings = sessionConfig(process.env);

export const app = express();

// Trust reverse proxy (Cloud Run, ingress, load balancer)
app.set("trust proxy", 1);

const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((s) => s.trim())
  : true;
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// In-memory file storage for any multipart uploads (never local container disk)
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB in-memory buffer limit
});

// Configure PostgreSQL session store (falls back to memory store during unit tests)
const isTest = process.env.NODE_ENV === "test";
const PgSession = connectPgSimple(session);

const sessionStore = isTest
  ? undefined
  : new PgSession({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
    });

app.use(
  session({
    store: sessionStore,
    secret: sessionSettings.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: sessionSettings.secure,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(enforcePasswordChangeCheck);

// ---------------------------------------------------------------------------
// Health & Readiness APIs — GET /api/health, GET /api/ready
// ---------------------------------------------------------------------------
app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", service: "TechTent API" });
});

app.get("/api/ready", async (_req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: "ok",
      ready: true,
      db: "connected",
      database: "connected",
    });
  } catch {
    res.status(503).json({
      status: "unavailable",
      ready: false,
      db: "disconnected",
      database: "disconnected",
    });
  }
});

// ---------------------------------------------------------------------------
// Authentication & Session APIs
// ---------------------------------------------------------------------------

// POST /api/auth/login
app.post("/api/auth/login", loginRateLimiter, async (req: Request, res: Response) => {
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
      role: user.role as Role,
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
      role: updatedUser.role as Role,
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
      error: { code: "INTERNAL_ERROR", message: "Failed to update password." },
    });
  }
});

// ---------------------------------------------------------------------------
// Product Catalog & Inventory Endpoints (F-02)
// ---------------------------------------------------------------------------

app.get("/api/products", async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const { category, search, includeInactive } = req.query;

    const isOperatorUser =
      req.session?.user?.role === "OPERATOR" || req.session?.user?.role === "ADMIN";

    const where: any = {};

    if (!isOperatorUser || includeInactive !== "true") {
      where.isActive = true;
    }

    if (category && typeof category === "string" && category !== "All") {
      where.category = category;
    }

    if (search && typeof search === "string" && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { id: "asc" },
    });

    const formatted = products.map((p) => ({
      ...p,
      price: Number(p.price).toFixed(2),
    }));

    return res.status(200).json({ data: formatted });
  } catch (error) {
    console.error("Fetch products error:", error);
    return res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch products." },
    });
  }
});

app.get("/api/products/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({
        error: { code: "INVALID_ID", message: "Product ID must be an integer." },
      });
    }

    const prisma = getPrisma();
    const product = await prisma.product.findFirst({
      where: { id, isActive: true },
    });

    if (!product) {
      return res.status(404).json({
        error: { code: "PRODUCT_NOT_FOUND", message: "Product not found or inactive." },
      });
    }

    return res.status(200).json({
      data: {
        ...product,
        price: Number(product.price).toFixed(2),
      },
    });
  } catch (error) {
    console.error("Fetch product error:", error);
    return res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch product." },
    });
  }
});

app.get("/api/categories", async (_req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const records = await prisma.product.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    });

    return res.status(200).json({ data: records.map((r) => r.category) });
  } catch (error) {
    console.error("Fetch categories error:", error);
    return res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch categories." },
    });
  }
});

// ---------------------------------------------------------------------------
// Product Catalog Management & Restocking Endpoints (F-06)
// ---------------------------------------------------------------------------

// POST /api/products
app.post(
  "/api/products",
  requireAuth,
  requireRole("OPERATOR", "ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const product = await createProduct(req.body);
      return res.status(201).json({ data: product });
    } catch (error: any) {
      if (error instanceof ProductError) {
        return res.status(error.status).json({
          error: { code: error.code, message: error.message },
        });
      }
      console.error("Create product error:", error);
      return res.status(500).json({
        error: { code: "INTERNAL_ERROR", message: "Failed to create product." },
      });
    }
  }
);

// PATCH /api/products/:id
app.patch(
  "/api/products/:id",
  requireAuth,
  requireRole("OPERATOR", "ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const product = await updateProduct(id, req.body);
      return res.status(200).json({ data: product });
    } catch (error: any) {
      if (error instanceof ProductError) {
        return res.status(error.status).json({
          error: { code: error.code, message: error.message },
        });
      }
      console.error("Update product error:", error);
      return res.status(500).json({
        error: { code: "INTERNAL_ERROR", message: "Failed to update product." },
      });
    }
  }
);

// POST /api/products/:id/restock
app.post(
  "/api/products/:id/restock",
  requireAuth,
  requireRole("OPERATOR", "ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { quantity } = req.body;
      const result = await restockProduct(id, quantity);
      return res.status(200).json({ data: result });
    } catch (error: any) {
      if (error instanceof ProductError) {
        return res.status(error.status).json({
          error: { code: error.code, message: error.message },
        });
      }
      console.error("Restock product error:", error);
      return res.status(500).json({
        error: { code: "INTERNAL_ERROR", message: "Failed to restock product." },
      });
    }
  }
);

// ---------------------------------------------------------------------------
// Order Assembly & Atomic Persistence Endpoints (F-03)
// ---------------------------------------------------------------------------

app.post(
  "/api/orders",
  requireAuth,
  requireRole("CUSTOMER"),
  enforcePasswordChangeCheck,
  async (req: Request, res: Response) => {
    try {
      const { items } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          error: { code: "EMPTY_ORDER", message: "Order must contain at least one item." },
        });
      }

      // Validate quantities and product IDs
      const itemMap = new Map<number, number>();
      for (const item of items) {
        const productId = parseInt(item.productId, 10);
        const quantity = parseInt(item.quantity, 10);

        if (isNaN(productId) || productId <= 0) {
          return res.status(400).json({
            error: { code: "INVALID_PRODUCT_ID", message: "Invalid product ID in order." },
          });
        }

        if (isNaN(quantity) || quantity <= 0 || !Number.isInteger(Number(item.quantity))) {
          return res.status(400).json({
            error: { code: "INVALID_QUANTITY", message: "Item quantity must be a positive integer." },
          });
        }

        const currentQty = itemMap.get(productId) || 0;
        itemMap.set(productId, currentQty + quantity);
      }

      const consolidatedProductIds = Array.from(itemMap.keys());
      const prisma = getPrisma();

      // Execute within an atomic transaction (NFR-02, BR-03)
      const result = await prisma.$transaction(async (tx) => {
        // Fetch all requested products
        const products = await tx.product.findMany({
          where: {
            id: { in: consolidatedProductIds },
            isActive: true,
          },
        });

        if (products.length !== consolidatedProductIds.length) {
          const foundIds = new Set(products.map((p) => p.id));
          const missingId = consolidatedProductIds.find((id) => !foundIds.has(id));
          const err: any = new Error(`Product ID ${missingId} not found or is inactive.`);
          err.statusCode = 404;
          err.code = "PRODUCT_NOT_FOUND";
          throw err;
        }

        // Validate stock availability for each product (supports simulation test SKU)
        for (const product of products) {
          const requestedQty = itemMap.get(product.id)!;
          const isSimulatedFail = product.sku === "SIM-ATOM-FAIL";

          if (product.stockQuantity < requestedQty || isSimulatedFail) {
            const err: any = new Error(
              isSimulatedFail
                ? `Selected item '${product.name}' is out of stock. Please remove it from your cart to proceed.`
                : `Insufficient stock for '${product.name}'. Available: ${product.stockQuantity}, Requested: ${requestedQty}`
            );
            err.statusCode = 409;
            err.code = "INSUFFICIENT_STOCK";
            err.failedProductId = product.id;
            err.failedSku = product.sku;
            throw err;
          }
        }

        // Authoritative Pricing Calculation (BR-01, BR-02)
        let grandTotal = 0;
        const lineItemsData = products.map((product) => {
          const quantity = itemMap.get(product.id)!;
          const unitPrice = Number(product.price);
          const subtotal = Number((unitPrice * quantity).toFixed(2));
          grandTotal += subtotal;

          return {
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            unitPrice: unitPrice.toFixed(2),
            quantity,
            subtotal: subtotal.toFixed(2),
          };
        });

        // Generate unique order number (FR-05)
        const orderNumber = await generateOrderNumber(tx);

        // Create Order and OrderItems
        const newOrder = await tx.order.create({
          data: {
            orderNumber,
            customerId: req.session.user!.id,
            status: "PENDING",
            totalAmount: grandTotal.toFixed(2),
            items: {
              create: lineItemsData.map((li) => ({
                productId: li.productId,
                unitPrice: li.unitPrice,
                quantity: li.quantity,
                subtotal: li.subtotal,
              })),
            },
          },
          include: {
            items: {
              include: { product: true },
            },
          },
        });

        // Decrement stock atomically (AC-ORD-02)
        for (const product of products) {
          const quantity = itemMap.get(product.id)!;
          await tx.product.update({
            where: { id: product.id },
            data: {
              stockQuantity: { decrement: quantity },
            },
          });
        }

        return newOrder;
      });

      return res.status(201).json({
        data: {
          id: result.id,
          orderNumber: result.orderNumber,
          customerId: result.customerId,
          status: result.status,
          paymentStatus: result.paymentStatus || "UNPAID",
          totalAmount: Number(result.totalAmount).toFixed(2),
          createdAt: result.createdAt.toISOString(),
          items: result.items.map((item) => ({
            id: item.id,
            productId: item.productId,
            productName: item.product.name,
            sku: item.product.sku,
            unitPrice: Number(item.unitPrice).toFixed(2),
            quantity: item.quantity,
            subtotal: Number(item.subtotal).toFixed(2),
          })),
        },
      });
    } catch (error: any) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          error: {
            code: error.code || "ORDER_ERROR",
            message: error.message,
            productId: error.failedProductId,
            sku: error.failedSku,
          },
        });
      }
      console.error("Order creation transaction error:", error);
      return res.status(500).json({
        error: { code: "INTERNAL_ERROR", message: "Failed to create order." },
      });
    }
  }
);

// ---------------------------------------------------------------------------
// Customer Order History & Receipt Details (F-04)
// ---------------------------------------------------------------------------

// GET /api/orders - List customer's chronological orders (AC-ORD-04)
app.get(
  "/api/orders",
  requireAuth,
  requireRole("CUSTOMER"),
  enforcePasswordChangeCheck,
  async (req: Request, res: Response) => {
    try {
      const prisma = getPrisma();
      const customerId = req.session.user!.id;

      const orders = await prisma.order.findMany({
        where: { customerId },
        orderBy: { createdAt: "desc" },
        include: {
          items: {
            include: { product: true },
          },
        },
      });

      const formatted = orders.map((order) => {
        const totalItemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

        return {
          id: order.id,
          orderNumber: order.orderNumber,
          customerId: order.customerId,
          status: order.status,
          paymentStatus: order.paymentStatus || "UNPAID",
          paymentMethod: order.paymentMethod || null,
          paidAt: order.paidAt ? order.paidAt.toISOString() : null,
          cancelledAt: order.cancelledAt ? order.cancelledAt.toISOString() : null,
          cancellationReason: order.cancellationReason || null,
          refundedAt: order.refundedAt ? order.refundedAt.toISOString() : null,
          totalAmount: Number(order.totalAmount).toFixed(2),
          itemCount: totalItemsCount,
          lineItemCount: order.items.length,
          createdAt: order.createdAt.toISOString(),
          updatedAt: order.updatedAt.toISOString(),
          items: order.items.map((item) => ({
            id: item.id,
            productId: item.productId,
            productName: item.product.name,
            sku: item.product.sku,
            unitPrice: Number(item.unitPrice).toFixed(2),
            quantity: item.quantity,
            subtotal: Number(item.subtotal).toFixed(2),
          })),
        };
      });

      return res.status(200).json({ data: formatted });
    } catch (error) {
      console.error("Fetch orders error:", error);
      return res.status(500).json({
        error: { code: "INTERNAL_ERROR", message: "Failed to fetch orders." },
      });
    }
  }
);

// GET /api/orders/:id - Customer order receipt detail with historic price preservation (AC-ORD-05, AC-SEC-01)
app.get(
  "/api/orders/:id",
  requireAuth,
  enforcePasswordChangeCheck,
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({
          error: { code: "INVALID_ID", message: "Order ID must be an integer." },
        });
      }

      const prisma = getPrisma();
      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          customer: {
            select: { id: true, name: true, email: true },
          },
          items: {
            include: { product: true },
          },
        },
      });

      if (!order) {
        return res.status(404).json({
          error: { code: "ORDER_NOT_FOUND", message: "Order not found." },
        });
      }

      // Cross-customer data isolation: Customers can only view their own orders
      const user = req.session.user!;
      if (user.role === "CUSTOMER" && order.customerId !== user.id) {
        return res.status(403).json({
          error: {
            code: "FORBIDDEN",
            message: "Order not found or permission denied.",
          },
        });
      }

      const totalItemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

      return res.status(200).json({
        data: {
          id: order.id,
          orderNumber: order.orderNumber,
          customerId: order.customerId,
          customerName: order.customer.name,
          customerEmail: order.customer.email,
          status: order.status,
          paymentStatus: order.paymentStatus || "UNPAID",
          paymentMethod: order.paymentMethod || null,
          paidAt: order.paidAt ? order.paidAt.toISOString() : null,
          cancelledAt: order.cancelledAt ? order.cancelledAt.toISOString() : null,
          cancellationReason: order.cancellationReason || null,
          refundedAt: order.refundedAt ? order.refundedAt.toISOString() : null,
          totalAmount: Number(order.totalAmount).toFixed(2),
          itemCount: totalItemsCount,
          lineItemCount: order.items.length,
          createdAt: order.createdAt.toISOString(),
          updatedAt: order.updatedAt.toISOString(),
          items: order.items.map((item) => ({
            id: item.id,
            productId: item.productId,
            productName: item.product.name,
            sku: item.product.sku,
            unitPrice: Number(item.unitPrice).toFixed(2), // Authoritative historical preserved unit price
            quantity: item.quantity,
            subtotal: Number(item.subtotal).toFixed(2),
          })),
        },
      });
    } catch (error) {
      console.error("Fetch order detail error:", error);
      return res.status(500).json({
        error: { code: "INTERNAL_ERROR", message: "Failed to fetch order detail." },
      });
    }
  }
);

// POST /api/orders/:id/cancel - Customer Order Cancellation (F-07)
app.post(
  "/api/orders/:id/cancel",
  requireAuth,
  enforcePasswordChangeCheck,
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({
          error: { code: "INVALID_ID", message: "Order ID must be a positive integer." },
        });
      }

      const { reason } = req.body || {};
      const user = req.session.user!;
      const prisma = getPrisma();

      const data = await cancelCustomerOrder(prisma, id, user.id, user.role, reason);
      return res.status(200).json({ data });
    } catch (error: any) {
      if (error instanceof CancellationError) {
        return res.status(error.status).json({
          error: { code: error.code, message: error.message },
        });
      }
      console.error("Cancel order error:", error);
      return res.status(500).json({
        error: { code: "INTERNAL_ERROR", message: "Failed to cancel order." },
      });
    }
  }
);

// POST /api/orders/:id/pay - Simulated Payment Processing (F-08)
app.post(
  "/api/orders/:id/pay",
  requireAuth,
  enforcePasswordChangeCheck,
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({
          error: { code: "INVALID_ID", message: "Order ID must be a positive integer." },
        });
      }

      const { paymentMethod } = req.body || {};
      const user = req.session.user!;
      const prisma = getPrisma();

      const data = await simulateOrderPayment(prisma, id, user.id, user.role, paymentMethod);
      return res.status(200).json({ data });
    } catch (error: any) {
      if (error instanceof PaymentError) {
        return res.status(error.status).json({
          error: { code: error.code, message: error.message },
        });
      }
      console.error("Payment processing error:", error);
      return res.status(500).json({
        error: { code: "INTERNAL_ERROR", message: "Failed to process payment." },
      });
    }
  }
);

// ---------------------------------------------------------------------------
// Operator Orders Queue (F-05)
// ---------------------------------------------------------------------------
app.get(
  "/api/operator/orders",
  requireAuth,
  enforcePasswordChangeCheck,
  requireRole("OPERATOR", "ADMIN"),
  async (req: Request, res: Response) => {
    const { status } = req.query;
    if (status !== undefined && !isOperatorOrderStatus(status)) {
      return res.status(400).json({
        error: {
          code: "INVALID_STATUS",
          message: "Status must be PENDING, ACCEPTED, PACKED, SHIPPED, REJECTED, or CANCELLED. Omit status to list all orders.",
        },
      });
    }

    try {
      const data = await listOperatorOrders(getPrisma(), status);
      return res.status(200).json({ data });
    } catch (error) {
      console.error("Fetch operator orders error:", error);
      return res.status(500).json({
        error: { code: "INTERNAL_ERROR", message: "Failed to fetch operator orders." },
      });
    }
  }
);

app.patch(
  "/api/operator/orders/:id/status",
  requireAuth,
  enforcePasswordChangeCheck,
  requireRole("OPERATOR", "ADMIN"),
  async (req: Request, res: Response) => {
    const id = parseOperatorOrderId(req.params.id);
    if (id === undefined) {
      return res.status(400).json({
        error: { code: "INVALID_ID", message: "Order ID must be a positive 32-bit integer." },
      });
    }

    const status = req.body?.status;
    if (!isFulfillmentStatus(status)) {
      return res.status(400).json({
        error: { code: "INVALID_STATUS", message: "Status must be ACCEPTED, PACKED, SHIPPED, or REJECTED." },
      });
    }

    try {
      const data = await processOperatorOrder(getPrisma(), id, status);
      return res.status(200).json({ data });
    } catch (error) {
      if (error instanceof OperatorOrderError) {
        return res.status(error.statusCode).json({
          error: { code: error.code, message: error.message },
        });
      }
      console.error("Process operator order error:", error);
      return res.status(500).json({
        error: { code: "INTERNAL_ERROR", message: "Failed to process order." },
      });
    }
  }
);

// ---------------------------------------------------------------------------
// Operational Reports & Sales Summaries (F-09)
// ---------------------------------------------------------------------------
app.get(
  "/api/reports/sales-summary",
  requireAuth,
  enforcePasswordChangeCheck,
  requireRole("OPERATOR", "ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      const data = await getSalesSummary(getPrisma(), {
        startDate: typeof startDate === "string" ? startDate : undefined,
        endDate: typeof endDate === "string" ? endDate : undefined,
      });
      return res.status(200).json({ data });
    } catch (error) {
      if (error instanceof ReportsError) {
        return res.status(error.status).json({
          error: { code: error.code, message: error.message },
        });
      }
      console.error("Sales summary report error:", error);
      return res.status(500).json({
        error: { code: "INTERNAL_ERROR", message: "Failed to generate sales summary report." },
      });
    }
  }
);

app.get(
  "/api/reports/turnaround",
  requireAuth,
  enforcePasswordChangeCheck,
  requireRole("OPERATOR", "ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const data = await getTurnaroundMetrics(getPrisma());
      return res.status(200).json({ data });
    } catch (error) {
      if (error instanceof ReportsError) {
        return res.status(error.status).json({
          error: { code: error.code, message: error.message },
        });
      }
      console.error("Turnaround report error:", error);
      return res.status(500).json({
        error: { code: "INTERNAL_ERROR", message: "Failed to generate turnaround metrics." },
      });
    }
  }
);

// ---------------------------------------------------------------------------
// Static SPA Serving (Unified Cloud Run Container)
// ---------------------------------------------------------------------------
const clientDistCandidates = [
  path.resolve(process.cwd(), "../client/dist"),
  path.resolve("/app/client/dist"),
  path.resolve(process.cwd(), "../../client/dist"),
];
const clientDist = clientDistCandidates.find((p) => fs.existsSync(p));
if (clientDist) {
  app.use(express.static(clientDist));
  app.get("*", (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

// ---------------------------------------------------------------------------
// 404 Handler
// ---------------------------------------------------------------------------
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: "The requested API endpoint was not found.",
    },
  });
});

// ---------------------------------------------------------------------------
// Centralized Error Handling Middleware
// ---------------------------------------------------------------------------
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled server error:", err);

  const isProduction = process.env.NODE_ENV === "production";
  const statusCode = typeof err.statusCode === "number" ? err.statusCode : 500;
  let code = err.code || "INTERNAL_ERROR";
  let message = err.message || "An unexpected internal server error occurred.";

  if (isProduction && statusCode >= 500) {
    message = "An unexpected internal server error occurred.";
    if (typeof code === "string" && (code.startsWith("P") || code.includes("Prisma"))) {
      code = "DATABASE_ERROR";
    }
  }

  return res.status(statusCode).json({
    error: {
      code,
      message,
    },
  });
});

export default app;
