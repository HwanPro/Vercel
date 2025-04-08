// middleware.ts
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

// Ajusta si tu SECRET se llama NEXTAUTH_SECRET o AUTH_SECRET
const SECRET = process.env.NEXTAUTH_SECRET;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Obtenemos el token para saber si hay sesión
  const token = await getToken({
    req: request,
    secret: SECRET,
  });

  // Rutas que requieren autenticación: /admin y /client
  const isAdminRoute = pathname.startsWith("/admin");
  const isClientRoute = pathname.startsWith("/client");

  // 1. Si NO hay token y la ruta es /admin o /client => redirigir a /auth/login
  if (!token && (isAdminRoute || isClientRoute)) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // 2. Si es /admin y token.role !== "admin" => redirigir a /client/dashboard
  if (isAdminRoute && token?.role !== "admin") {
    return NextResponse.redirect(new URL("/client/dashboard", request.url));
  }

  // 3. Si es /client y token.role === "admin" => redirigir a /admin/dashboard
  if (isClientRoute && token?.role === "admin") {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  // 4. Caso contrario, permitir acceso
  return NextResponse.next();
}

export const config = {
  // Ajusta según tus rutas protegidas
  matcher: ["/client/:path*", "/admin/:path*"],
};
