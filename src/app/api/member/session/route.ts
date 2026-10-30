import { NextResponse } from "next/server";
import { isSameOrigin } from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import { clearMemberSession, getMemberId } from "@/lib/member-auth";

export async function GET() {
  const memberId = await getMemberId();
  if (!memberId) {
    return NextResponse.json(
      { member: null },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  }
  const member = getDatabase()
    .prepare(
      `SELECT id, email, name, phone, address_line AS addressLine,
              district, city, postal_code AS postalCode
       FROM members WHERE id = ?`,
    )
    .get(memberId) as
    | {
        id: string;
        email: string;
        name: string;
        phone: string;
        addressLine: string;
        district: string;
        city: string;
        postalCode: string;
      }
    | undefined;
  return NextResponse.json(
    { member: member ?? null },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { error: "İstek kaynağı doğrulanamadı." },
      { status: 403 },
    );
  }
  await clearMemberSession();
  return NextResponse.json({ success: true });
}
