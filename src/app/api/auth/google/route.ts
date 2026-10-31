import { NextResponse } from "next/server";
import {
  createGoogleAuthorizationUrl,
  getGoogleCredentials,
  signInAsDemoGoogleUser,
} from "@/lib/member-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const isDemo =
    requestUrl.searchParams.get("demo") === "1" ||
    requestUrl.searchParams.get("demo") === "true";

  if (isDemo) {
    try {
      await signInAsDemoGoogleUser();
      const destination = new URL("/account", request.url);
      destination.searchParams.set("notice", "google_demo_success");
      return NextResponse.redirect(destination);
    } catch (err) {
      console.error("[Google Demo Sign-in Error]", err);
      const destination = new URL("/account", request.url);
      destination.searchParams.set("error", "google_unavailable");
      return NextResponse.redirect(destination);
    }
  }

  const creds = getGoogleCredentials();
  if (!creds.isConfigured) {
    const destination = new URL("/account", request.url);
    destination.searchParams.set("error", "google_not_configured");
    return NextResponse.redirect(destination);
  }

  try {
    const url = await createGoogleAuthorizationUrl(request.url);
    return NextResponse.redirect(url);
  } catch (error) {
    console.error("[Google OAuth URL Error]", error);
    const destination = new URL("/account", request.url);
    destination.searchParams.set(
      "error",
      error instanceof Error && error.message.includes("GOOGLE_CLIENT")
        ? "google_not_configured"
        : "google_unavailable",
    );
    return NextResponse.redirect(destination);
  }
}
