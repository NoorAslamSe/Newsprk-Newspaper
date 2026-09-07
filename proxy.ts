import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export default async function proxy(req: NextRequest) {
  const response = NextResponse.next();
  const { pathname } = req.nextUrl;

  // Dashboard auth guard
  if (pathname.startsWith("/dashboard")) {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      const url = new URL("/auth/signin", req.url);
      url.searchParams.set("callbackUrl", req.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  }

  // Block crawling of internal paths
  if (
    pathname.startsWith("/staging") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/go/") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard")
  ) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  // Rate limiting headers for /go/ and /api/pipeline
  if (pathname.startsWith("/go/") || pathname.startsWith("/api/pipeline")) {
    response.headers.set("X-RateLimit-Policy", "standard");
  }

  // Consent-aware: set default consent state header for server components
  const consentState = req.cookies.get("consent_state")?.value;
  if (!consentState) {
    response.headers.set("X-Consent-State", "pending");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|favicon.svg|favicon-192.png|manifest.json|wp-content).*)",
  ],
};
