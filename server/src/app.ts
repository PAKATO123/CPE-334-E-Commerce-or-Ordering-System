import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import session from "express-session";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import { getPrisma } from "./prisma.js";
import {
  requireAuth,
  requireRole,
  enforcePasswordChangeCheck,
  isPasswordComplex,
  SessionUser,
  Role,
} from "./middleware/auth.js";

export const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "ecommerce-session-secret-cpe334",
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

// ---------------------------------------------------------------------------
// Health API — GET /api/health
// ---------------------------------------------------------------------------
app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", service: "TechTent API" });
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
  return res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: err.message || "An unexpected internal server error occurred.",
    },
  });
});

export default app;
