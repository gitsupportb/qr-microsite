// Reserved slugs that cannot be used as tenant slugs.
// These conflict with application routes and Next.js internals.
export const RESERVED_SLUGS = new Set([
  'admin',
  'api',
  'auth',
  'login',
  'signup',
  'callback',
  'dashboard',
  'settings',
  '_next',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
  'public',
  'static',
  'assets',
])

// Validate a slug is safe to use as a tenant identifier
export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase())
}
