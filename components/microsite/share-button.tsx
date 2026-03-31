'use client'

import { useEffect, useState } from 'react'
import { Share2, MessageCircle, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { trackEvent } from '@/lib/analytics'

interface ShareButtonProps {
  companyName: string
  tagline: string | null
  tenantSlug: string
  tenantId?: string
  businessProfileId?: string
}

export function ShareButton({
  companyName,
  tagline,
  tenantSlug,
  tenantId,
  businessProfileId,
}: ShareButtonProps) {
  const [canNativeShare, setCanNativeShare] = useState(false)

  useEffect(() => {
    setCanNativeShare(
      typeof navigator !== 'undefined' && typeof navigator.share === 'function'
    )
  }, [])

  const getPageUrl = () =>
    typeof window !== 'undefined' ? window.location.href : ''

  const handleNativeShare = async () => {
    if (tenantId) {
      trackEvent('share_click', tenantId, { businessProfileId, pageSlug: tenantSlug, metadata: { method: 'native_share' } })
    }
    try {
      await navigator.share({
        title: companyName,
        text: tagline || `Check out ${companyName}`,
        url: getPageUrl(),
      })
    } catch (err) {
      // User cancelled the share dialog -- do nothing
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }
      // Share failed -- fallback to clipboard
      handleCopyLink()
    }
  }

  const handleWhatsAppShare = () => {
    if (tenantId) {
      trackEvent('share_click', tenantId, { businessProfileId, pageSlug: tenantSlug, metadata: { method: 'whatsapp' } })
    }
    const text = `Check out ${companyName} - ${getPageUrl()}`
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      '_blank',
      'noopener'
    )
  }

  const handleCopyLink = async () => {
    if (tenantId) {
      trackEvent('share_click', tenantId, { businessProfileId, pageSlug: tenantSlug, metadata: { method: 'clipboard' } })
    }
    try {
      await navigator.clipboard.writeText(getPageUrl())
      toast.success('Link copied to clipboard')
    } catch {
      toast.error('Unable to copy link')
    }
  }

  return (
    <section id="share" className="px-5 sm:px-8">
      <div className="mx-auto flex max-w-xl items-center gap-3 border-t border-[var(--foreground)]/5 py-4">
        <span className="text-xs text-[var(--muted-foreground)]">Share</span>

        <div className="flex items-center gap-1">
          {canNativeShare && (
            <button
              type="button"
              className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs text-[var(--muted-foreground)] transition-colors hover:bg-[var(--foreground)]/5 hover:text-[var(--foreground)]"
              onClick={handleNativeShare}
              aria-label="Share via device share menu"
            >
              <Share2 className="size-3.5" />
              <span>Share</span>
            </button>
          )}

          <button
            type="button"
            className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs text-[var(--muted-foreground)] transition-colors hover:bg-[var(--foreground)]/5 hover:text-[var(--foreground)]"
            onClick={handleWhatsAppShare}
            aria-label="Share via WhatsApp"
          >
            <MessageCircle className="size-3.5" />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs text-[var(--muted-foreground)] transition-colors hover:bg-[var(--foreground)]/5 hover:text-[var(--foreground)]"
            onClick={handleCopyLink}
            aria-label="Copy page link to clipboard"
          >
            <Copy className="size-3.5" />
            <span>Copy Link</span>
          </button>
        </div>
      </div>
    </section>
  )
}
