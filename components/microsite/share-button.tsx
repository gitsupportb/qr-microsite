'use client'

import { useEffect, useState } from 'react'
import { Share2, MessageCircle, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

interface ShareButtonProps {
  companyName: string
  tagline: string | null
  tenantSlug: string
}

export function ShareButton({
  companyName,
  tagline,
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
    const text = `Check out ${companyName} - ${getPageUrl()}`
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      '_blank',
      'noopener'
    )
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getPageUrl())
      toast.success('Link copied to clipboard')
    } catch {
      toast.error('Unable to copy link')
    }
  }

  return (
    <section id="share" className="px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-lg">
        <h2 className="mb-3 text-center text-lg font-semibold">
          Share this page
        </h2>
        <div className="flex flex-wrap justify-center gap-2">
          {canNativeShare && (
            <Button
              variant="outline"
              className="flex h-11 items-center gap-2 text-sm"
              onClick={handleNativeShare}
              aria-label="Share via device share menu"
            >
              <Share2 className="size-4" />
              <span>Share</span>
            </Button>
          )}

          <Button
            variant="outline"
            className="flex h-11 items-center gap-2 text-sm"
            onClick={handleWhatsAppShare}
            aria-label="Share via WhatsApp"
          >
            <MessageCircle className="size-4" />
            <span>WhatsApp</span>
          </Button>

          <Button
            variant="outline"
            className="flex h-11 items-center gap-2 text-sm"
            onClick={handleCopyLink}
            aria-label="Copy page link to clipboard"
          >
            <Copy className="size-4" />
            <span>Copy Link</span>
          </Button>
        </div>
      </div>
    </section>
  )
}
