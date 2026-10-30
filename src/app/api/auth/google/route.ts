import { NextResponse } from "next/server";
import { createGoogleAuthorizationUrl } from "@/lib/member-auth";

export async function GET(request: Request) {
  try {
    const url = await createGoogleAuthorizationUrl(request.url);
    return NextResponse.redirect(url);
  } catch (error) {
    const destination = new URL("/account", request.url);
    destination.searchParams.set(
      "error",
      error instanceof Error &&
        error.message.includes("GOOGLE_CLIENT")
        ? "google_not_configured"
        : "google_unavailable",
    );
    return NextResponse.redirect(destination);
  }
}
