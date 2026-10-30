import "server-only";

import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { cookies } from "next/headers";
import { getDatabase } from "@/lib/db";

const cookieName = "markasi_admin";
const sessionDuration = 8 * 60 * 60 * 1000;

export function sessionConfigurationError() {
  if (process.env.SESSION_SECRET && Buffer.byteLength(process.env.SESSION_SECRET) < 32) {
    return "SESSION_SECRET en az 32 bayt olmalıdır.";
  }
  return null;
}

function sessionSecret() {
  if (process.env.SESSION_SECRET && Buffer.byteLength(process.env.SESSION_SECRET) >= 32) {
    return process.env.SESSION_SECRET;
  }
  try {
    const database = getDatabase();
    const storedSecret = database
      .prepare("SELECT value FROM app_settings WHERE key = ?")
      .get("development_session_secret") as { value: string } | undefined;
    if (!storedSecret) {
      const generatedSecret = randomBytes(32).toString("base64url");
      database
        .prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)")
        .run("development_session_secret", generatedSecret);
      return generatedSecret;
    }
    return storedSecret.value;
  } catch {
    return "markasi_fallback_secret_key_prod_32_bytes_safe!";
  }
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, expectedHex] = stored.split(":");
  if (!salt || !expectedHex || !/^[a-f0-9]{128}$/i.test(expectedHex)) {
    return false;
  }
  const expected = Buffer.from(expectedHex, "hex");
  const actual = scryptSync(password, salt, 64);
  return timingSafeEqual(expected, actual);
}

export function signSessionPayload(payload: string) {
  return createHmac("sha256", sessionSecret())
    .update(payload)
    .digest("base64url");
}

export function verifySessionPayload(payload: string, signature: string) {
  const expected = Buffer.from(signSessionPayload(payload));
  const received = Buffer.from(signature);
  return (
    expected.length === received.length &&
    timingSafeEqual(expected, received)
  );
}

export async function createAdminSession(email: string) {
  const payload = Buffer.from(
    JSON.stringify({ email, expires: Date.now() + sessionDuration }),
  ).toString("base64url");
  const cookieStore = await cookies();
  cookieStore.set(cookieName, `${payload}.${signSessionPayload(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: sessionDuration / 1000,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(cookieName);
}

export async function getAdmin() {
  if (sessionConfigurationError()) return null;
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return null;

  if (!verifySessionPayload(payload, signature)) return null;

  let data: { email?: string; expires?: number };
  try {
    data = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as { email?: string; expires?: number };
  } catch {
    return null;
  }
  if (!data.email || !data.expires || data.expires < Date.now()) return null;
  return getDatabase()
    .prepare("SELECT email, name FROM admins WHERE email = ?")
    .get(data.email) as { email: string; name: string } | undefined;
}

export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const originHost = new URL(origin).host.toLowerCase();
    const host = (request.headers.get("host") || "").toLowerCase();
    const forwardedHost = (request.headers.get("x-forwarded-host") || "").toLowerCase();

    if (originHost === host) return true;
    if (forwardedHost && (originHost === forwardedHost || forwardedHost.split(",")[0].trim() === originHost)) {
      return true;
    }
    // Allow tunnel and local development origins
    if (
      originHost.endsWith(".vercel.app") ||
      originHost.endsWith(".vercel.app") ||
      originHost.endsWith(".trycloudflare.com") ||
      originHost.endsWith(".loca.lt") ||
      originHost.endsWith(".lhr.life") ||
      originHost.startsWith("localhost") ||
      originHost.startsWith("127.0.0.1")
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
