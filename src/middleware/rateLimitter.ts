import { rateLimiter } from "hono-rate-limiter";

export const globalRateLimit = rateLimiter({
  windowMs: 5 * 60 * 1000,
  limit: 100,
  keyGenerator: (c) =>
    c.req.header("x-forwarded-for") ||
    c.req.raw.headers.get("cf-connecting-ip") ||
    c.req.raw.headers.get("x-real-ip") ||
    c.req.raw.headers.get("host") ||
    "unknown",
  message: "Too many requests. Please slow down.",
});

export const loginRateLimit = rateLimiter({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  keyGenerator: (c) =>
    c.req.header("x-forwarded-for") ||
    c.req.raw.headers.get("cf-connecting-ip") ||
    c.req.raw.headers.get("x-real-ip") ||
    "unknown-ip",

  message: "Too many login attempts. Try again later.",
});
