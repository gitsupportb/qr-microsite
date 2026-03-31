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
      <div className="mx-auto max-w-xl py-4">
        <div className="flex items-center gap-3 rounded-xl bg-white/40 backdrop-blur-lg border border-white/15 px-4 py-3">
          <span className="text-xs text-slate-400">Share</span>

          <div className="flex items-center gap-1">
            {canNativeShare && (
              <button
                type="button"
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/50 backdrop-blur-sm border border-white/30 px-3 text-xs text-slate-500 transition-all duration-200 hover:bg-white/70 hover:text-slate-700"
                onClick={handleNativeShare}
                aria-label="Share via device share menu"
              >
                <Share2 className="size-3.5" />
                <span>Share</span>
              </button>
            )}

            <button
              type="button"
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/50 backdrop-blur-sm border border-white/30 px-3 text-xs text-slate-500 transition-all duration-200 hover:bg-white/70 hover:text-slate-700"
              onClick={handleWhatsAppShare}
              aria-label="Share via WhatsApp"
            >
              <MessageCircle className="size-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              type="button"
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/50 backdrop-blur-sm border border-white/30 px-3 text-xs text-slate-500 transition-all duration-200 hover:bg-white/70 hover:text-slate-700"
              onClick={handleCopyLink}
              aria-label="Copy page link to clipboard"
            >
              <Copy className="size-3.5" />
              <span>Copy Link</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
