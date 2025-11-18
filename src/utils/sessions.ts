import crypto from "crypto";

// In production, replace with Redis or database.
const sessionStore = new Map<string, any>();

export function createSession(data: any) {
  const sessionId = crypto.randomBytes(32).toString("hex");
  sessionStore.set(sessionId, {
    ...data,
    createdAt: Date.now(),
  });
  return sessionId;
}

export function getSession(sessionId: string) {
  return sessionStore.get(sessionId) || null;
}

export function deleteSession(sessionId: string) {
  sessionStore.delete(sessionId);
}
