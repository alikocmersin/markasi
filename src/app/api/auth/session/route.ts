import { NextResponse } from "next/server";
import {
  clearAdminSession,
  getAdmin,
  isSameOrigin,
} from "@/lib/auth";

export async function GET() {
  return NextResponse.json({ admin: await getAdmin() });
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "İstek kaynağı doğrulanamadı." }, { status: 403 });
  }
  await clearAdminSession();
  return NextResponse.json({ success: true });
}
