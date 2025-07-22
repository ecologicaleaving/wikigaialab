import { auth } from "./lib/auth-nextauth"
import { NextResponse } from "next/server"
import { authRateLimit } from "./lib/rate-limiter"

export default auth(async (req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  // Apply rate limiting to OAuth endpoints
  if (nextUrl.pathname.startsWith('/api/auth/')) {
    try {
      await authRateLimit(req);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('OAuth rate limit exceeded:', error);
      }
      return new NextResponse(
        JSON.stringify({
          error: 'Too many authentication attempts. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED'
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '900' // 15 minutes
          },
        }
      );
    }
  }

  // Define protected routes
  const isProtectedRoute = [
    '/dashboard',
    '/profile',
    '/settings',
    '/admin',
    '/problems/new',
  ].some(route => nextUrl.pathname.startsWith(route))

  // Redirect to login if trying to access protected route without auth
  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', nextUrl))
  }

  // Redirect to dashboard if logged in user tries to access login page
  if (nextUrl.pathname === '/login' && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl))
  }

  // Add security headers to all responses
  const response = NextResponse.next()
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // CSP header for additional XSS protection
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://accounts.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' blob: data: https://lh3.googleusercontent.com https://www.googletagmanager.com",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://accounts.google.com https://www.google-analytics.com https://api.vercel.com",
    "frame-src 'self' https://accounts.google.com",
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', cspHeader)
  
  return response
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}