import rateLimit from "express-rate-limit";
import type { Request, Response } from "express";

export interface RateLimitOptions {
  windowMs?: number;
  max?: number;
  message?: string;
}

export function createLoginRateLimiter(options?: RateLimitOptions) {
  const windowMs = options?.windowMs ?? 15 * 60 * 1000; // 15 minutes
  const max = options?.max ?? 10;

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true, // Returns standard RateLimit-* and Retry-After headers
    legacyHeaders: false,
    statusCode: 429,
    skip: () =>
      process.env.TECHTENT_DISABLE_RATE_LIMIT === "1" ||
      (process.env.NODE_ENV === "test" && process.env.TECHTENT_ENABLE_TEST_RATE_LIMIT !== "1"),
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        error: {
          code: "TOO_MANY_REQUESTS",
          message:
            options?.message ||
            "Too many login attempts from this IP. Please try again after 15 minutes.",
        },
      });
    },
  });
}

export const loginRateLimiter = createLoginRateLimiter();
