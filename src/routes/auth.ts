// src/routes/auth.ts
import { Hono } from "hono";
import { z } from "zod";
import { supabase } from "../utils/supabase";
import {
  createSessionCookieValue,
  clearSessionCookieValue,
  readSessionIdFromHeader,
} from "../utils/cookies";
import { db } from "../db/client";
import { appUsers } from "../db/schema";
import { sessions } from "../db/schema/sessions";
import { eq } from "drizzle-orm";
import { env } from "../config/env";
import { randomUUID } from "crypto";
import { loginRateLimit } from "../middleware/rateLimitter";

async function ensureAppUser(userId: string) {
  const existing = await db.select().from(appUsers).where(eq(appUsers.id, userId));
  if (existing.length === 0) {
    await db.insert(appUsers).values({
      id: userId,
      role: "regular",
    });
  }
}

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const signinSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authRoute = new Hono()

  // Sign up (same as before)
  .post("/signup", loginRateLimit, async (c) => {
    try {
      const body = await c.req.json();
      const { email, password } = signupSchema.parse(body);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${process.env.APP_URL}/auth/verify`,
        },
      });

      if (error) {
        console.error("Signup error:", error.message);
        return c.json(
          {
            error: "Signup failed",
            details: process.env.NODE_ENV === "development" ? error.message : undefined,
          },
          400,
        );
      }

      if (data.user) {
        await ensureAppUser(data.user.id);
      }

      return c.json({ user: data.user, message: "Check your email for verification link" });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return c.json(
          { error: "Invalid input", details: err.issues.map((i) => i.message).join(", ") },
          400,
        );
      }
      console.error("Signup error:", err);
      return c.json({ error: "Internal server error" }, 500);
    }
  })

  // Signin: create DB session and set opaque cookie
  .post("/signin", loginRateLimit, async (c) => {
    try {
      const body = await c.req.json();
      const { email, password } = signinSchema.parse(body);

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error || !data?.session || !data.user) {
        console.error("Signin error:", error?.message);
        return c.json(
          {
            error: "Invalid credentials",
            details: process.env.NODE_ENV === "development" ? error?.message : undefined,
          },
          401,
        );
      }

      // Ensure user exists in app_users
      await ensureAppUser(data.user.id);

      // Create session row in DB
      const sessionId = randomUUID();
      const expiresAt = data.session.expires_at ?? null;

      const inserted = await db
        .insert(sessions)
        .values({
          id: sessionId,
          userId: data.user.id,
          refreshToken: data.session.refresh_token ?? null,
          expiresAt: expiresAt ?? null,
        })
        .returning();

      // Set secure http-only cookie with session id
      c.header(
        "Set-Cookie",
        createSessionCookieValue(
          sessionId,
          typeof expiresAt === "number"
            ? Math.max(0, expiresAt - Math.floor(Date.now() / 1000))
            : undefined,
        ),
      );

      return c.json({ user: data.user, session: { expires_at: expiresAt }, message: "Signed in" });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return c.json(
          { error: "Invalid input", details: err.issues.map((i) => i.message).join(", ") },
          400,
        );
      }
      console.error("Signin error:", err);
      return c.json({ error: "Internal server error" }, 500);
    }
  })

  // Signout: clear cookie and remove session optionally
  .post("/signout", async (c) => {
    try {
      const cookie = c.req.header("cookie") || "";
      const sessionId = readSessionIdFromHeader(cookie);

      if (sessionId) {
        await db.delete(sessions).where(eq(sessions.id, sessionId)).returning();
      }

      c.header("Set-Cookie", clearSessionCookieValue());
      return c.json({ message: "Signed out" });
    } catch (err) {
      console.error("Signout error:", err);
      return c.json({ error: "Internal server error" }, 500);
    }
  })

  // OAuth callback — create session the same way
  // .get("/callback", async (c) => {
  //   const url = new URL(c.req.url);
  //   const code = url.searchParams.get("code");
  //   if (!code) return c.json({ error: "Missing OAuth code" }, 400);

  //   const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  //   if (error || !data?.session || !data.user) {
  //     console.error("OAuth code exchange error:", error);
  //     return c.json({ error: "Failed code exchange" }, 500);
  //   }

  //   await ensureAppUser(data.user.id);

  //   const sessionId = randomUUID();
  //   const expiresAt = data.session.expires_at ?? null;
  //   await db
  //     .insert(sessions)
  //     .values({
  //       id: sessionId,
  //       userId: data.user.id,
  //       refreshToken: data.session.refresh_token ?? null,
  //       expiresAt: expiresAt ?? null,
  //     })
  //     .returning();

  //   c.header(
  //     "Set-Cookie",
  //     createSessionCookieValue(
  //       sessionId,
  //       typeof expiresAt === "number"
  //         ? Math.max(0, expiresAt - Math.floor(Date.now() / 1000))
  //         : undefined,
  //     ),
  //   );
  //   return c.redirect(`${env.FRONTEND_URL}/dashboard`);
  // })

  // Get current logged-in user info (using sessions -> appUsers)
  .get("/me", async (c) => {
    try {
      const cookie = c.req.header("cookie") || "";
      const sessionId = readSessionIdFromHeader(cookie);
      if (!sessionId) {
        console.log("Session Id Error : ", sessionId);
        return c.json({ user: null }, 200);
      }

      const [sessionRow] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
      if (!sessionRow) {
        console.log("Session Row Error : ", sessionRow);
        return c.json({ user: null }, 200);
      }

      const [appUserRow] = await db
        .select()
        .from(appUsers)
        .where(eq(appUsers.id, sessionRow.userId));
      if (!appUserRow) {
        console.log("App User Row Error : ", appUserRow);
        return c.json({ user: null }, 200);
      }

      return c.json({ user: { id: appUserRow.id, role: appUserRow.role } }, 200);
    } catch (err) {
      console.error("me error:", err);
      return c.json({ user: null }, 200);
    }
  })

  // Return role only (used by client)
  .get("/checkroles", async (c) => {
    try {
      const cookie = c.req.header("cookie") || "";
      const sessionId = readSessionIdFromHeader(cookie);
      if (!sessionId) {
        console.log("No Session Id");
        return c.json({ role: null }, 200);
      }

      const [sessionRow] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
      if (!sessionRow) {
        console.log("No Session Row");
        return c.json({ role: null }, 200);
      }

      const [appUserRow] = await db
        .select()
        .from(appUsers)
        .where(eq(appUsers.id, sessionRow.userId));
      if (!appUserRow) {
        console.log("App User Row Error");
        return c.json({ role: null }, 200);
      }

      console.log(appUserRow.role);

      return c.json({ role: appUserRow.role }, 200);
    } catch (err) {
      console.error("checkroles error:", err);
      return c.json({ role: null }, 200);
    }
  })

  .get("/login/google", async (c) => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${env.APP_URL}/api/auth/callback`,
        },
      });

      if (error || !data.url) {
        console.error("OAuth init error:", error);
        return c.json({ error: "Failed to initiate Google OAuth" }, 500);
      }

      return c.redirect(data.url);
    } catch (err) {
      console.error("OAuth error:", err);
      return c.json({ error: "OAuth authentication failed" }, 500);
    }
  })

  .get("/callback", async (c) => {
    const url = new URL(c.req.url);
    const code = url.searchParams.get("code");
    if (!code) return c.json({ error: "Missing OAuth code" }, 400);

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error || !data?.session || !data.user) {
      console.error("OAuth code exchange error:", error);
      return c.json({ error: "Failed code exchange" }, 500);
    }

    await ensureAppUser(data.user.id);

    const sessionId = randomUUID();
    const expiresAt = data.session.expires_at ?? null;

    await db
      .insert(sessions)
      .values({
        id: sessionId,
        userId: data.user.id,
        refreshToken: data.session.refresh_token ?? null,
        expiresAt: expiresAt,
      })
      .returning();

    // set encrypted cookie
    c.header(
      "Set-Cookie",
      createSessionCookieValue(
        sessionId,
        typeof expiresAt === "number"
          ? Math.max(0, expiresAt - Math.floor(Date.now() / 1000))
          : undefined,
      ),
    );

    return c.redirect(`${env.FRONTEND_URL}/dashboard`);
  });
