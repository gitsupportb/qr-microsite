'use client'

import { useEffect } from 'react'
import { trackEvent } from '@/lib/analytics'

interface PageViewTrackerProps {
  tenantId: string
  businessProfileId: string
  pageSlug: string
}

/**
 * Thin client component that fires a page_view analytics event on mount.
 * Renders nothing -- exists solely to trigger the tracking call from a Server Component page.
 */
export function PageViewTracker({
  tenantId,
  businessProfileId,
  pageSlug,
}: PageViewTrackerProps) {
  useEffect(() => {
    trackEvent('page_view', tenantId, { businessProfileId, pageSlug })
  }, [tenantId, businessProfileId, pageSlug])

  return null
}
