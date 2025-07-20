import { auth } from "./lib/auth-nextauth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

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

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}