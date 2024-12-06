// src/middleware.ts

import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === 'production',
  });

  console.log('Token obtenido en el middleware:', token);

  const { pathname } = request.nextUrl;

  // Permitir el acceso a la API, páginas de autenticación y verificación de correo
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/verify-email') ||
    pathname.startsWith('/auth')
  ) {
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  if (!token.emailVerified) {
    return NextResponse.redirect(new URL('/verify-email', request.url));
  }

  if (pathname.startsWith('/admin') && token.role !== 'admin') {
    return NextResponse.redirect(new URL('/client/dashboard', request.url));
  }

  if (pathname.startsWith('/client') && token.role !== 'client') {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/client/:path*', '/admin/:path*'],
};
