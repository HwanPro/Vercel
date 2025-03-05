import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Fuerza el log en producción
  console.log = console.log || function () {}; // Asegura que los logs se impriman en prod

  console.log("🚀 Middleware ejecutándose...");
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: false,
  });

  console.log("🍪 Cookies en el middleware:", request.headers.get("cookie"));
  const { pathname } = request.nextUrl;

  console.log("🔍 Ruta solicitada:", pathname);
  console.log("🔑 Token obtenido en middleware:", token);

  // Rutas públicas
  if (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/verify-email") ||
    pathname.startsWith("/api/public")
  ) {
    console.log("✅ Acceso permitido a ruta pública:", pathname);
    return NextResponse.next();
  }

  // Redireccionar si no hay token
  if (!token) {
    console.log("🚫 Usuario no autenticado. Redirigiendo a /auth/login");
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // Verificar correo
  console.log(
    "📧 Verificando si el correo está verificado:",
    token.emailVerified
  );
  if (!token.emailVerified) {
    console.log("🚫 Correo no verificado. Redirigiendo a /verify-email");
    return NextResponse.redirect(new URL("/verify-email", request.url));
  }

  // Bloqueo para rutas API privadas
  if (pathname.startsWith("/api") && !token) {
    console.log("❌ Middleware bloqueando API: Token no encontrado");
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // Restricciones según rol
  console.log("🔍 Verificando acceso en el middleware:", token?.role);
  if (!token) {
    console.log("🚫 No hay token. Redirigiendo a /auth/login");
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  if (pathname.startsWith("/admin") && token.role !== "admin") {
    console.log(
      "🚫 Acceso denegado a /admin. Redirigiendo a /client/dashboard"
    );
    return NextResponse.redirect(new URL("/client/dashboard", request.url));
  }

  if (pathname.startsWith("/client") && token.role !== "client") {
    console.log(
      "🚫 Acceso denegado a /client. Redirigiendo a /admin/dashboard"
    );
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  console.log("✅ Acceso permitido a la ruta:", pathname);
  return NextResponse.next();
}

export const config = {
  matcher: ["/client/:path*", "/admin/:path*", "/api/private/:path*"],
};
