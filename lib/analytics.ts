/**
 * Client-side analytics event tracker.
 * Fire-and-forget: NEVER throws, NEVER blocks UI, NEVER awaits.
 * Uses sendBeacon (preferred for page unload reliability) with fetch fallback.
 */
export function trackEvent(
  eventType: string,
  tenantId: string,
  opts?: {
    businessProfileId?: string
    pageSlug?: string
    metadata?: Record<string, unknown>
  }
): void {
  // Skip during SSR
  if (typeof window === 'undefined') return

  try {
    const payload = JSON.stringify({
      event_type: eventType,
      tenant_id: tenantId,
      business_profile_id: opts?.businessProfileId,
      page_slug: opts?.pageSlug,
      metadata: opts?.metadata,
    })

    // Prefer sendBeacon -- reliable even during page unload
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const sent = navigator.sendBeacon(
        '/api/analytics',
        new Blob([payload], { type: 'application/json' })
      )
      if (sent) return
    }

    // Fallback to fetch -- fire and forget
    void fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    })
  } catch {
    // Analytics must NEVER throw or affect UI
  }
}
