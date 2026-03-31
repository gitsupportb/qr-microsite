const ipMap = new Map<string, { count: number; resetAt: number }>()

/**
 * In-memory IP-based rate limiter.
 * Tracks submission count per IP within a sliding window.
 *
 * @param ip - Client IP address
 * @param limit - Max submissions per window (default: 3)
 * @param windowMs - Window duration in ms (default: 1 hour)
 * @returns success boolean and remaining submissions count
 */
export function rateLimit(
  ip: string,
  limit = 3,
  windowMs = 60 * 60 * 1000
): { success: boolean; remaining: number } {
  const now = Date.now()
  const entry = ipMap.get(ip)

  if (!entry || now > entry.resetAt) {
    ipMap.set(ip, { count: 1, resetAt: now + windowMs })
    return { success: true, remaining: limit - 1 }
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0 }
  }

  entry.count++
  return { success: true, remaining: limit - entry.count }
}

// Cleanup expired entries every 10 minutes to prevent memory leaks
if (typeof globalThis.setInterval === 'function') {
  const CLEANUP_INTERVAL_MS = 10 * 60 * 1000

  globalThis.setInterval(() => {
    const now = Date.now()
    for (const [ip, entry] of ipMap) {
      if (now > entry.resetAt) {
        ipMap.delete(ip)
      }
    }
  }, CLEANUP_INTERVAL_MS)
}
