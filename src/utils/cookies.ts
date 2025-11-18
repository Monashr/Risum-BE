import { serialize, parse } from "cookie";
import crypto from "crypto";
import { env } from "../config/env";

const COOKIE_NAME = env.COOKIE_NAME || "session_id";
const COOKIE_SECRET = env.COOKIE_SECRET;
const isProduction = env.NODE_ENV === "production";

// --- AES-256 Encryption ---
function encrypt(value: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(COOKIE_SECRET), iv);
  let encrypted = cipher.update(value, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

function decrypt(value: string): string | null {
  try {
    const [ivHex, encrypted] = value.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(COOKIE_SECRET), iv);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch {
    return null;
  }
}

// --- Helper to get dynamic cookie options ---
function getCookieOptions(maxAge?: number) {
  return {
    httpOnly: true,
    secure: isProduction, // secure in prod, false in dev
    sameSite: isProduction ? "lax" : "none", // "none" for cross-site dev testing
    path: "/",
    maxAge: maxAge ?? 60 * 60 * 24 * 30,
  } as const;
}

// --- Create Encrypted Cookie ---
export function createSessionCookie(sessionId: string, maxAge?: number) {
  const encrypted = encrypt(sessionId);

  return serialize(COOKIE_NAME, encrypted, {
    httpOnly: true,
    secure: isProduction, // must be true in production for cross-site
    sameSite: isProduction ? "none" : "lax", // <--- key change
    path: "/",
    maxAge: maxAge ?? 60 * 60 * 24 * 30,
  });
}

export function clearSessionCookie() {
  return serialize(COOKIE_NAME, "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge: 0,
  });
}

export function readSessionCookie(cookieHeader?: string): string | null {
  if (!cookieHeader) return null;
  const cookies = parse(cookieHeader);
  const raw = cookies[COOKIE_NAME];
  if (!raw) return null;
  return decrypt(raw);
}

// --- Aliases for auth.ts ---
export const createSessionCookieValue = createSessionCookie;
export const clearSessionCookieValue = clearSessionCookie;
export const readSessionIdFromHeader = readSessionCookie;
