import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import {
  hashPassword,
  isSameOrigin,
  sessionConfigurationError,
  createAdminSession,
  verifyPassword,
} from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import { readJsonObject } from "@/lib/request";
import { createMemberSession } from "@/lib/member-auth";

const attempts = new Map<string, { count: number; resetAt: number }>();
const attemptLimit = 5;
const attemptWindow = 15 * 60 * 1000;

function text(value: unknown, limit: number) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

function clientAddress(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim().slice(0, 64) ??
    "unknown"
  );
}

function tooManyAttempts(address: string, now: number) {
  const attempt = attempts.get(address);
  if (!attempt) return false;
  if (attempt.resetAt <= now) {
    attempts.delete(address);
    return false;
  }
  return attempt.count >= attemptLimit;
}

function recordAttempt(address: string, now: number) {
  if (attempts.size > 10_000) {
    for (const [key, attempt] of attempts) {
      if (attempt.resetAt <= now) attempts.delete(key);
    }
  }
  const previous = attempts.get(address);
  attempts.set(address, {
    count:
      previous && previous.resetAt > now
        ? previous.count + 1
        : 1,
    resetAt:
      previous && previous.resetAt > now
        ? previous.resetAt
        : now + attemptWindow,
  });
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { error: "İstek kaynağı doğrulanamadı." },
      { status: 403 },
    );
  }
  const configurationError = sessionConfigurationError();
  if (configurationError) {
    return NextResponse.json({ error: configurationError }, { status: 503 });
  }

  const address = clientAddress(request);
  const now = Date.now();
  if (tooManyAttempts(address, now)) {
    const attempt = attempts.get(address);
    return NextResponse.json(
      { error: "Çok fazla deneme yaptınız. Bir süre sonra tekrar deneyin." },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.ceil(((attempt?.resetAt ?? now) - now) / 1000),
          ),
        },
      },
    );
  }

  const body = await readJsonObject(request);
  if (!body) {
    return NextResponse.json(
      { error: "Geçerli bir istek gönderin." },
      { status: 400 },
    );
  }
  const action = text(body.action, 20);
  const email = text(body.email, 160).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    password.length < 8 ||
    password.length > 128
  ) {
    return NextResponse.json(
      {
        error:
          "Geçerli bir e-posta ve 8–128 karakter arasında bir şifre girin.",
      },
      { status: 400 },
    );
  }

  const database = getDatabase();
  if (action === "register") {
    const name = text(body.name, 100).replace(/\s+/g, " ");
    if (name.length < 3 || !name.includes(" ")) {
      return NextResponse.json(
        { error: "İsim ve soy isim bilgilerinizi girin." },
        { status: 400 },
      );
    }
    recordAttempt(address, now);
    const memberId = randomBytes(18).toString("base64url");
    const passwordHash = hashPassword(password);
    try {
      database
        .prepare(
          "INSERT INTO members (id, email, name, password_hash) VALUES (?, ?, ?, ?)",
        )
        .run(memberId, email, name, passwordHash);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("UNIQUE constraint failed: members.email")
      ) {
        return NextResponse.json(
          {
            error:
              "Bu e-posta adresiyle bir hesap zaten var. Giriş yapmayı veya Google ile devam etmeyi deneyin.",
          },
          { status: 409 },
        );
      }
      throw error;
    }
    await createMemberSession(memberId);
    return NextResponse.json({ success: true });
  }

  if (action !== "login") {
    return NextResponse.json({ error: "İşlem geçersiz." }, { status: 400 });
  }
  const admin = database
    .prepare(
      "SELECT email, password_hash AS passwordHash FROM admins WHERE email = ?",
    )
    .get(email) as { email: string; passwordHash: string } | undefined;
  if (admin && verifyPassword(password, admin.passwordHash)) {
    attempts.delete(address);
    await createAdminSession(admin.email);
    return NextResponse.json({ success: true, redirectTo: "/admin" });
  }

  const member = database
    .prepare(
      "SELECT id, password_hash AS passwordHash FROM members WHERE email = ?",
    )
    .get(email) as { id: string; passwordHash: string | null } | undefined;
  if (
    !member?.passwordHash ||
    !verifyPassword(password, member.passwordHash)
  ) {
    recordAttempt(address, now);
    return NextResponse.json(
      { error: "E-posta veya şifre hatalı." },
      { status: 401 },
    );
  }
  attempts.delete(address);
  await createMemberSession(member.id);
  return NextResponse.json({ success: true });
}
