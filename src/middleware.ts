import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  console.log("🚀 Middleware ejecutándose...");

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    //cookieName: "next-auth.session-token", // normal
  });

  console.log("🔑 Token en middleware:", token);
  const { pathname } = request.nextUrl;

  // 1) Si no hay token => redirige a login
  if (!token) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // 2) Revisa rutas de /admin y /client
  if (pathname.startsWith("/admin") && token.role !== "admin") {
    return NextResponse.redirect(new URL("/client/dashboard", request.url));
  }
  if (pathname.startsWith("/client") && token.role !== "client") {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  // 3) Si todo OK
  return NextResponse.next();
}

export const config = {
  matcher: ["/client/:path*", "/admin/:path*"],
};
