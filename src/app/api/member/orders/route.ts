import { NextResponse } from "next/server";
import { getMemberId } from "@/lib/member-auth";
import { getDatabase, listOrdersForMember } from "@/lib/db";

export async function GET() {
  const memberId = await getMemberId();
  if (!memberId) {
    return NextResponse.json({ error: "Giriş yapmanız gerekmektedir." }, { status: 401 });
  }

  const database = getDatabase();
  const member = database
    .prepare("SELECT email FROM members WHERE id = ?")
    .get(memberId) as { email: string } | undefined;

  const orders = listOrdersForMember(memberId, member?.email);

  return NextResponse.json({ orders });
}
