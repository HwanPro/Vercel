import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  console.log("🚀 Middleware ejecutándose...");

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production", // Asegúrate que esté bien configurado
    cookieName: "next-auth.session-token",
  });

  console.log("🍪 Cookies en el middleware:", request.headers.get("cookie"));
  console.log("🔑 Token obtenido en middleware:", token);

  const { pathname } = request.nextUrl;

  if (!token) {
    console.log("🚫 Usuario no autenticado. Redirigiendo a /auth/login");
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  if (!token.emailVerified) {
    console.log("🚫 Correo no verificado. Redirigiendo a /verify-email");
    return NextResponse.redirect(new URL("/verify-email", request.url));
  }

  if (pathname.startsWith("/admin") && token.role !== "admin") {
    return NextResponse.redirect(new URL("/client/dashboard", request.url));
  }
  if (pathname.startsWith("/client") && token.role !== "client") {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  console.log("✅ Acceso permitido a la ruta:", pathname);
  return NextResponse.next();
}

export const config = {
  matcher: ["/client/:path*", "/admin/:path*", "/api/private/:path*"],
};
