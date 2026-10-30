import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { isSameOrigin } from "@/lib/auth";
import {
  encryptMemberIdentity,
  getMemberId,
  getMemberProfile,
  isValidTurkishIdentityNumber,
} from "@/lib/member-auth";
import { readJsonObject } from "@/lib/request";

function text(value: unknown, limit: number) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length <= limit ? trimmed : null;
}

export async function GET() {
  const profile = await getMemberProfile();
  if (!profile) {
    return NextResponse.json({ error: "Üye girişi gerekli." }, { status: 401 });
  }
  return NextResponse.json(
    { profile },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function PATCH(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { error: "İstek kaynağı doğrulanamadı." },
      { status: 403 },
    );
  }
  const memberId = await getMemberId();
  if (!memberId) {
    return NextResponse.json({ error: "Üye girişi gerekli." }, { status: 401 });
  }
  const body = await readJsonObject(request);
  if (!body) {
    return NextResponse.json(
      { error: "Geçerli bir profil gönderin." },
      { status: 400 },
    );
  }
  const name = text(body.name, 100);
  const phone = text(body.phone, 30);
  const tcIdentity = text(body.tcIdentity, 11);
  const addressLine = text(body.addressLine, 250);
  const district = text(body.district, 80);
  const city = text(body.city, 80);
  const postalCode = text(body.postalCode, 12);
  if (
    name === null ||
    name.length < 2 ||
    phone === null ||
    (phone !== "" && (phone.match(/\d/g)?.length ?? 0) < 10) ||
    tcIdentity === null ||
    (tcIdentity !== "" && !isValidTurkishIdentityNumber(tcIdentity)) ||
    addressLine === null ||
    district === null ||
    city === null ||
    postalCode === null
  ) {
    return NextResponse.json(
      {
        error:
          "Ad soyad, telefon ve adres bilgilerini kontrol edin. T.C. kimlik numarası giriyorsanız geçerli 11 haneli olmalıdır.",
      },
      { status: 400 },
    );
  }

  let encryptedIdentity: string;
  try {
    encryptedIdentity = encryptMemberIdentity(tcIdentity);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Kimlik bilgisi güvenli biçimde saklanamadı.",
      },
      { status: 503 },
    );
  }
  getDatabase()
    .prepare(
      `UPDATE members
       SET name = ?, phone = ?, tc_identity_encrypted = ?,
           address_line = ?, district = ?, city = ?, postal_code = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
    )
    .run(
      name,
      phone,
      encryptedIdentity,
      addressLine,
      district,
      city,
      postalCode,
      memberId,
    );
  return NextResponse.json({ success: true });
}
