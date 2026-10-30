import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createPublicKey,
  randomBytes,
  verify,
} from "node:crypto";
import type { JsonWebKey as NodeCryptoJsonWebKey } from "node:crypto";
import { cookies } from "next/headers";
import { getDatabase } from "@/lib/db";
import {
  sessionConfigurationError,
  signSessionPayload,
  verifySessionPayload,
} from "@/lib/auth";

const memberCookieName = "markasi_member";
const oauthCookieName = "markasi_google_oauth";
const memberSessionDuration = 30 * 24 * 60 * 60 * 1000;
const oauthStateDuration = 10 * 60 * 1000;

export type MemberProfile = {
  id: string;
  email: string;
  name: string;
  phone: string;
  tcIdentity: string;
  addressLine: string;
  district: string;
  city: string;
  postalCode: string;
};

type GoogleOAuthState = {
  state: string;
  nonce: string;
  verifier: string;
  issuedAt: number;
};

type GoogleJwk = NodeCryptoJsonWebKey & {
  kid?: string;
  alg?: string;
  use?: string;
};

type GoogleIdentityToken = {
  iss?: string;
  aud?: string | string[];
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  nonce?: string;
  exp?: number;
  iat?: number;
};

let cachedGoogleKeys: { keys: GoogleJwk[]; expiresAt: number } | null = null;

export function googleOAuthConfigurationError() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return "Google ile giriş için GOOGLE_CLIENT_ID ve GOOGLE_CLIENT_SECRET yapılandırılmalıdır.";
  }
  if (process.env.NODE_ENV === "production" && !process.env.GOOGLE_REDIRECT_URI) {
    return "Üretimde GOOGLE_REDIRECT_URI tanımlanmalıdır.";
  }
  return null;
}

function googleRedirectUri(requestUrl: string) {
  const configured = process.env.GOOGLE_REDIRECT_URI;
  const redirect = configured
    ? new URL(configured)
    : new URL("/api/auth/google/callback", requestUrl);
  if (
    (process.env.NODE_ENV === "production" && redirect.protocol !== "https:") ||
    (redirect.protocol !== "https:" &&
      !(redirect.hostname === "localhost" || redirect.hostname === "127.0.0.1"))
  ) {
    throw new Error("Google OAuth callback adresi güvenli bir HTTPS adresi olmalıdır.");
  }
  return redirect.toString();
}

export async function createGoogleAuthorizationUrl(requestUrl: string) {
  const configurationError = googleOAuthConfigurationError();
  if (configurationError) throw new Error(configurationError);

  const redirectUri = googleRedirectUri(requestUrl);

  const state: GoogleOAuthState = {
    state: randomBytes(32).toString("base64url"),
    nonce: randomBytes(32).toString("base64url"),
    verifier: randomBytes(32).toString("base64url"),
    issuedAt: Date.now(),
  };
  const encodedState = Buffer.from(JSON.stringify(state)).toString("base64url");
  const cookieStore = await cookies();
  cookieStore.set(
    oauthCookieName,
    `${encodedState}.${signSessionPayload(encodedState)}`,
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: oauthStateDuration / 1000,
    },
  );

  const challenge = createHash("sha256")
    .update(state.verifier)
    .digest("base64url");
  const authorizationUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorizationUrl.search = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state: state.state,
    nonce: state.nonce,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();
  return authorizationUrl;
}

function readGoogleOAuthState(value: string | undefined) {
  if (!value) return null;
  const [encodedState, signature, extra] = value.split(".");
  if (!encodedState || !signature || extra) return null;
  if (!verifySessionPayload(encodedState, signature)) return null;
  try {
    const state = JSON.parse(
      Buffer.from(encodedState, "base64url").toString("utf8"),
    ) as GoogleOAuthState;
    if (
      typeof state.state !== "string" ||
      typeof state.nonce !== "string" ||
      typeof state.verifier !== "string" ||
      !Number.isSafeInteger(state.issuedAt) ||
      state.issuedAt > Date.now() ||
      Date.now() - state.issuedAt > oauthStateDuration
    ) {
      return null;
    }
    return state;
  } catch {
    return null;
  }
}

async function loadGoogleSigningKeys() {
  if (cachedGoogleKeys && cachedGoogleKeys.expiresAt > Date.now()) {
    return cachedGoogleKeys.keys;
  }
  const response = await fetch("https://www.googleapis.com/oauth2/v3/certs", {
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error("Google kimlik doğrulama anahtarları alınamadı.");
  }
  const data = (await response.json()) as { keys?: GoogleJwk[] };
  if (!Array.isArray(data.keys) || data.keys.length === 0) {
    throw new Error("Google kimlik doğrulama anahtarları geçersiz.");
  }
  const cacheControl = response.headers.get("cache-control") ?? "";
  const maxAge = Number(cacheControl.match(/max-age=(\d+)/i)?.[1] ?? 3600);
  cachedGoogleKeys = {
    keys: data.keys,
    expiresAt: Date.now() + Math.min(maxAge, 3600) * 1000,
  };
  return cachedGoogleKeys.keys;
}

function decodeTokenPart<T>(value: string): T {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T;
}

async function verifyGoogleIdentityToken(
  token: string,
  expectedNonce: string,
): Promise<GoogleIdentityToken> {
  const [encodedHeader, encodedClaims, encodedSignature, extra] = token.split(".");
  if (!encodedHeader || !encodedClaims || !encodedSignature || extra) {
    throw new Error("Google kimlik yanıtı geçersiz.");
  }
  const header = decodeTokenPart<{ alg?: string; kid?: string }>(encodedHeader);
  if (header.alg !== "RS256" || !header.kid) {
    throw new Error("Google imza algoritması desteklenmiyor.");
  }
  const keys = await loadGoogleSigningKeys();
  const key = keys.find((candidate) => candidate.kid === header.kid);
  if (!key) {
    cachedGoogleKeys = null;
    const refreshedKeys = await loadGoogleSigningKeys();
    const refreshedKey = refreshedKeys.find(
      (candidate) => candidate.kid === header.kid,
    );
    if (!refreshedKey) throw new Error("Google imza anahtarı bulunamadı.");
    return verifyGoogleSignature(
      token,
      encodedHeader,
      encodedClaims,
      encodedSignature,
      refreshedKey,
      expectedNonce,
    );
  }
  return verifyGoogleSignature(
    token,
    encodedHeader,
    encodedClaims,
    encodedSignature,
    key,
    expectedNonce,
  );
}

async function verifyGoogleSignature(
  token: string,
  encodedHeader: string,
  encodedClaims: string,
  encodedSignature: string,
  key: GoogleJwk,
  expectedNonce: string,
) {
  const publicKey = createPublicKey({ key, format: "jwk" });
  const signatureValid = verify(
    "RSA-SHA256",
    Buffer.from(`${encodedHeader}.${encodedClaims}`),
    publicKey,
    Buffer.from(encodedSignature, "base64url"),
  );
  if (!signatureValid) throw new Error("Google kimlik imzası doğrulanamadı.");

  const claims = decodeTokenPart<GoogleIdentityToken>(encodedClaims);
  const audience = claims.aud;
  const audienceValid = Array.isArray(audience)
    ? audience.includes(process.env.GOOGLE_CLIENT_ID ?? "")
    : audience === process.env.GOOGLE_CLIENT_ID;
  const currentTime = Math.floor(Date.now() / 1000);
  if (
    !["accounts.google.com", "https://accounts.google.com"].includes(
      claims.iss ?? "",
    ) ||
    !audienceValid ||
    !claims.sub ||
    !claims.email ||
    claims.email_verified !== true ||
    claims.nonce !== expectedNonce ||
    !claims.exp ||
    claims.exp < currentTime ||
    !claims.iat ||
    claims.iat > currentTime + 300
  ) {
    throw new Error("Google hesabı doğrulanamadı veya e-posta onaylanmamış.");
  }
  return claims;
}

export async function signInWithGoogleCode(
  requestUrl: string,
  code: string,
) {
  const cookieStore = await cookies();
  const state = readGoogleOAuthState(
    cookieStore.get(oauthCookieName)?.value,
  );
  await clearGoogleOAuthState();
  if (!state) throw new Error("Google giriş isteğinin süresi dolmuş. Tekrar deneyin.");

  const configurationError = googleOAuthConfigurationError();
  if (configurationError) throw new Error(configurationError);
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: googleRedirectUri(requestUrl),
      grant_type: "authorization_code",
      code_verifier: state.verifier,
    }),
  });
  if (!response.ok) {
    throw new Error("Google girişi tamamlanamadı. Lütfen yeniden deneyin.");
  }
  const tokens = (await response.json()) as { id_token?: string };
  if (!tokens.id_token) throw new Error("Google kimlik yanıtı eksik.");
  const identity = await verifyGoogleIdentityToken(
    tokens.id_token,
    state.nonce,
  );
  const email = identity.email!.trim().toLowerCase();
  const name = identity.name?.trim().slice(0, 100) || email;
  const database = getDatabase();
  const member = database
    .prepare("SELECT id FROM members WHERE google_subject = ?")
    .get(identity.sub!) as { id: string } | undefined;
  if (member) {
    const emailOwner = database
      .prepare("SELECT id FROM members WHERE email = ? COLLATE NOCASE")
      .get(email) as { id: string } | undefined;
    if (emailOwner && emailOwner.id !== member.id) {
      throw new Error(
        "Bu e-posta başka bir Google hesabına bağlı. Hesap eşleştirme için destek alın.",
      );
    }
    database
      .prepare(
        "UPDATE members SET email = ?, name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      )
      .run(email, name, member.id);
    await createMemberSession(member.id);
    return member.id;
  }

  const existingEmail = database
    .prepare("SELECT id FROM members WHERE email = ? COLLATE NOCASE")
    .get(email);
  if (existingEmail) {
    throw new Error(
      "Bu e-posta başka bir Google hesabına bağlı. Hesap eşleştirme için destek alın.",
    );
  }
  const memberId = randomBytes(18).toString("base64url");
  database
    .prepare(
      "INSERT INTO members (id, google_subject, email, name) VALUES (?, ?, ?, ?)",
    )
    .run(memberId, identity.sub!, email, name);
  await createMemberSession(memberId);
  return memberId;
}

export async function completeGoogleOAuth(requestUrl: string) {
  const url = new URL(requestUrl);
  if (url.searchParams.has("error")) {
    await clearGoogleOAuthState();
    throw new Error(
      url.searchParams.get("error") === "access_denied"
        ? "Google girişi iptal edildi."
        : "Google girişi başarısız oldu. Lütfen yeniden deneyin.",
    );
  }
  const state = readGoogleOAuthState(
    (await cookies()).get(oauthCookieName)?.value,
  );
  if (!state || url.searchParams.get("state") !== state.state) {
    await clearGoogleOAuthState();
    throw new Error("Google giriş doğrulaması başarısız oldu. Lütfen yeniden deneyin.");
  }
  const code = url.searchParams.get("code");
  if (!code || code.length > 4096) {
    await clearGoogleOAuthState();
    throw new Error("Google giriş kodu geçersiz.");
  }
  await signInWithGoogleCode(requestUrl, code);
  await clearGoogleOAuthState();
}

export async function createMemberSession(memberId: string) {
  const payload = Buffer.from(
    JSON.stringify({ memberId, expires: Date.now() + memberSessionDuration }),
  ).toString("base64url");
  const cookieStore = await cookies();
  cookieStore.set(memberCookieName, `${payload}.${signSessionPayload(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: memberSessionDuration / 1000,
  });
}

export async function clearMemberSession() {
  const cookieStore = await cookies();
  cookieStore.delete(memberCookieName);
}

async function clearGoogleOAuthState() {
  const cookieStore = await cookies();
  cookieStore.delete(oauthCookieName);
}

export async function getMemberId() {
  if (sessionConfigurationError()) return null;
  const token = (await cookies()).get(memberCookieName)?.value;
  if (!token) return null;
  const [payload, signature, extra] = token.split(".");
  if (
    !payload ||
    !signature ||
    extra ||
    !verifySessionPayload(payload, signature)
  ) {
    return null;
  }
  try {
    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as { memberId?: string; expires?: number };
    if (
      !session.memberId ||
      !session.expires ||
      session.expires < Date.now()
    ) {
      return null;
    }
    return session.memberId;
  } catch {
    return null;
  }
}

function memberDataEncryptionKey() {
  const configuredKey = process.env.MEMBER_DATA_ENCRYPTION_KEY;
  if (configuredKey) {
    if (Buffer.byteLength(configuredKey) < 32) {
      throw new Error("MEMBER_DATA_ENCRYPTION_KEY en az 32 bayt olmalıdır.");
    }
    return createHash("sha256")
      .update(configuredKey)
      .digest();
  }

  const database = getDatabase();
  let stored = database
    .prepare("SELECT value FROM app_settings WHERE key = ?")
    .get("member_data_encryption_key") as { value: string } | undefined;
  if (!stored) {
    database
      .prepare("INSERT OR IGNORE INTO app_settings (key, value) VALUES (?, ?)")
      .run(
        "member_data_encryption_key",
        randomBytes(32).toString("base64url"),
      );
    stored = database
      .prepare("SELECT value FROM app_settings WHERE key = ?")
      .get("member_data_encryption_key") as { value: string } | undefined;
  }
  if (!stored) throw new Error("Üye bilgisi şifreleme anahtarı oluşturulamadı.");
  return createHash("sha256").update(stored.value).digest();
}

export function encryptMemberIdentity(value: string) {
  if (!value) return "";
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", memberDataEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  return [
    "v1",
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

export function decryptMemberIdentity(value: string) {
  if (!value) return "";
  const [version, encodedIv, encodedTag, encodedData, extra] = value.split(".");
  if (
    version !== "v1" ||
    !encodedIv ||
    !encodedTag ||
    !encodedData ||
    extra
  ) {
    throw new Error("Şifrelenmiş üye kimlik bilgisi okunamıyor.");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    memberDataEncryptionKey(),
    Buffer.from(encodedIv, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(encodedTag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encodedData, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function isValidTurkishIdentityNumber(value: string) {
  if (!/^[1-9]\d{10}$/.test(value)) return false;
  const digits = Array.from(value, Number);
  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
  return (
    (((oddSum * 7 - evenSum) % 10) + 10) % 10 === digits[9] &&
    digits.slice(0, 10).reduce((sum, digit) => sum + digit, 0) % 10 ===
      digits[10]
  );
}

export async function getMemberProfile(): Promise<MemberProfile | null> {
  const memberId = await getMemberId();
  if (!memberId) return null;
  const row = getDatabase()
    .prepare(
      `SELECT id, email, name, phone,
              tc_identity_encrypted AS tcIdentity,
              address_line AS addressLine, district, city,
              postal_code AS postalCode
       FROM members WHERE id = ?`,
    )
    .get(memberId) as
    | (Omit<MemberProfile, "tcIdentity"> & { tcIdentity: string })
    | undefined;
  if (!row) return null;
  return { ...row, tcIdentity: decryptMemberIdentity(row.tcIdentity) };
}
