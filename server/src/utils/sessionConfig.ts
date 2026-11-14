export function sessionConfig(env: Record<string, string | undefined>) {
  const production = env.NODE_ENV === "production";
  const secret = env.SESSION_SECRET;
  if (production && (!secret || secret.trim().length < 32)) {
    throw new Error("Production SESSION_SECRET must contain at least 32 characters.");
  }
  return {
    secret: secret || "ecommerce-session-secret-cpe334",
    secure: production || env.COOKIE_SECURE === "true",
  };
}
