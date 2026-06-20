import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Define public and auth-only routes
const publicRoutes = ['/', '/login', '/register'];

// Using a hardcoded secret fallback for local dev to match backend
const JWT_SECRET = process.env.JWT_SECRET || 'koc_dev_secret_change_in_production_2026';
const secret = new TextEncoder().encode(JWT_SECRET);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files, _next, and api routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('jwt')?.value;
  const isPublicRoute = publicRoutes.includes(pathname);

  try {
    if (token) {
      // Verify token with jose (Edge-compatible)
      await jwtVerify(token, secret);
      
      // If logged in and trying to access login/register, redirect to tournaments
      if (pathname === '/login' || pathname === '/register') {
        return NextResponse.redirect(new URL('/tournaments', request.url));
      }
      return NextResponse.next();
    }
  } catch (error) {
    // Invalid token — clear it and treat as unauthenticated
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('jwt');
    return response;
  }

  // Not logged in, trying to access protected route
  if (!isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
