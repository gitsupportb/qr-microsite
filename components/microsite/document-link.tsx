'use client'

import { trackEvent } from '@/lib/analytics'

interface DocumentLinkProps {
  href: string
  tenantId: string
  businessProfileId: string
  documentId: string
  documentTitle: string
  children: React.ReactNode
  className?: string
  ariaLabel?: string
}

/**
 * Thin client wrapper for document download links.
 * Fires a brochure_click analytics event on click, then navigates.
 */
export function DocumentLink({
  href,
  tenantId,
  businessProfileId,
  documentId,
  documentTitle,
  children,
  className,
  ariaLabel,
}: DocumentLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      aria-label={ariaLabel}
      onClick={() => {
        trackEvent('brochure_click', tenantId, {
          businessProfileId,
          metadata: { document_id: documentId, document_title: documentTitle },
        })
      }}
    >
      {children}
    </a>
  )
}
