import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/auth/sign-in(.*)',
  '/auth/sign-up(.*)',
  '/auth/forget-password(.*)',
  '/sso-callback',
  '/home',
])

export default clerkMiddleware(async (auth, req) => {
  // Add CSP headers to allow Cloudflare Turnstile
  const response = NextResponse.next()
  
  // Content Security Policy to allow Turnstile
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://*.clerk.accounts.dev https://*.clerk.dev",
    "frame-src 'self' https://challenges.cloudflare.com https://*.clerk.accounts.dev https://*.clerk.dev",
    "connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.dev https://challenges.cloudflare.com",
    "img-src 'self' data: https: blob:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "frame-ancestors 'self'",
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', cspHeader)
  
  // Allow Turnstile to work with cross-origin
  response.headers.set('Cross-Origin-Embedder-Policy', 'unsafe-none')
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups')
  
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
  
  return response
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}