import { NextResponse } from "next/server";
import { completeGoogleOAuth } from "@/lib/member-auth";

export async function GET(request: Request) {
  const destination = new URL("/account", request.url);
  try {
    await completeGoogleOAuth(request.url);
    return NextResponse.redirect(destination);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const errorCode = message.includes("başka bir Google hesabına bağlı")
      ? "google_account_conflict"
      : message.includes("iptal edildi")
        ? "google_cancelled"
        : "google_callback_failed";
    destination.searchParams.set("error", errorCode);
    return NextResponse.redirect(destination);
  }
}
