import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  console.log("🚀 Middleware ejecutándose...");

  // Aseguramos nombre de cookie correcto
  const cookieName =
    process.env.NODE_ENV === "production"
      ? "__Secure-next-auth.session-token"
      : "next-auth.session-token";

  // Aseguramos secureCookie correcto (solo true en producción)
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName,
    secureCookie: process.env.NEXTAUTH_SECURE_COOKIE === "true",
  });

  console.log("🔑 Token en middleware:", token);

  const { pathname } = request.nextUrl;

  if (!token) {
    console.log("🚫 Usuario no autenticado. Redirigiendo a /auth/login");
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  if (pathname.startsWith("/admin") && token.role !== "admin") {
    console.log("🔁 Redirigiendo a dashboard cliente");
    return NextResponse.redirect(new URL("/client/dashboard", request.url));
  }

  if (pathname.startsWith("/client") && token.role !== "client") {
    console.log("🔁 Redirigiendo a dashboard admin");
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  console.log("✅ Middleware permite el acceso");
  return NextResponse.next();
}

export const config = {
  matcher: ["/client/:path*", "/admin/:path*", "/api/private/:path*"],
};
