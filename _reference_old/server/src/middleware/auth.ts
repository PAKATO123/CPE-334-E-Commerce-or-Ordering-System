import { Request, Response, NextFunction } from "express";
import { getPrisma } from "../prisma.js";

export interface SessionUser {
  id: number;
  email: string;
  name: string;
  role: "REQUESTER" | "IT_STAFF" | "ADMINISTRATOR";
  mustChangePassword: boolean;
  isActive: boolean;
}

declare module "express-session" {
  interface SessionData {
    user?: SessionUser;
  }
}

/**
 * Validates password complexity:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one numeric digit
 */
export function isPasswordComplex(password: string): boolean {
  if (!password || password.length < 8) return false;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  return hasUpper && hasLower && hasDigit;
}

/**
 * Middleware: Ensures request has an active authenticated session
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const sessionUser = req.session?.user;
  if (!sessionUser) {
    return res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required. Please log in.",
      },
    });
  }

  // Re-verify active status from DB
  try {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { id: true, email: true, name: true, role: true, isActive: true, mustChangePassword: true },
    });

    if (!user || !user.isActive) {
      req.session.destroy(() => {});
      return res.status(401).json({
        error: {
          code: "ACCOUNT_DEACTIVATED",
          message: "Account is deactivated or no longer exists.",
        },
      });
    }

    // Keep session user data fresh
    req.session.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      mustChangePassword: user.mustChangePassword,
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "An internal authentication error occurred.",
      },
    });
  }
}

/**
 * Middleware: Enforces user role authorization
 */
export function requireRole(...permittedRoles: ("REQUESTER" | "IT_STAFF" | "ADMINISTRATOR")[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const sessionUser = req.session?.user;
    if (!sessionUser || !permittedRoles.includes(sessionUser.role)) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You do not have permission to perform this action.",
        },
      });
    }
    next();
  };
}

/**
 * Middleware: Enforces mandatory first-login password change
 */
export function enforcePasswordChangeCheck(req: Request, res: Response, next: NextFunction) {
  const sessionUser = req.session?.user;
  if (sessionUser && sessionUser.mustChangePassword) {
    // Exempt auth status, password change, and logout endpoints
    const allowedPaths = ["/api/auth/change-password", "/api/auth/logout", "/api/auth/me"];
    if (!allowedPaths.includes(req.path)) {
      return res.status(403).json({
        error: {
          code: "PASSWORD_CHANGE_REQUIRED",
          message: "Mandatory password change required before accessing application features.",
        },
      });
    }
  }
  next();
}
