import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

import { env } from "../config/env";

const jwksUrl = env.SUPABASE_JWKS_URL;
const JWKS = createRemoteJWKSet(new URL(jwksUrl));

export async function verifySupabaseToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, JWKS, {
    algorithms: ["RS256"],
  });
  return payload;
}
