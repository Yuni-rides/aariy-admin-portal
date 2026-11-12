
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/login", "/set-password"];

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/categories",
  "/sellers",
  "/products",
  "/users",
  "/orders",
  "/tiers",
  "/settings",
  "/staff",
  "/roles",
  "/profile",
  // TODO: remove once the old Arigo modules are deleted
  "/nemt",
  "/deliveries",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;

  const isPublic = PUBLIC_ROUTES.some((p) => pathname.startsWith(p));
  const isProtected = PROTECTED_PREFIXES.some((p) =>
    pathname.startsWith(p)
  );

  // ❌ no token + protected
  if (!token && isProtected) {
    return NextResponse.redirect(
      new URL(`/login?redirect=${pathname}`, request.url)
    );
  }

  // ❌ token + public
  if (token && isPublic) {
    return NextResponse.redirect(
      new URL("/dashboard", request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|api).*)"],
};

