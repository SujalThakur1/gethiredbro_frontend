import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/auth/sign-in(.*)',
  '/auth/sign-up(.*)',
  '/auth/forget-password(.*)',
  '/sso-callback',
  '/home',
])

export default clerkMiddleware(
  async (auth, req) => {
    if (!isPublicRoute(req)) {
      await auth.protect()
    }
  },
  {
    // Use Clerk's automatic CSP configuration
    // Automatically includes all necessary directives for Clerk and Turnstile
    // See: https://clerk.com/docs/guides/secure/best-practices/csp-headers
    contentSecurityPolicy: {
      strict: true,
      directives: {
        'script-src': ['https://clerk.gethiredbro.com'],
        'connect-src': [
          'https://clerk.gethiredbro.com',
          'https://formspree.io', // Add Formspree for form submissions
        ],
        'frame-src': ['https://challenges.cloudflare.com'],
      },
    },
  },
)

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}