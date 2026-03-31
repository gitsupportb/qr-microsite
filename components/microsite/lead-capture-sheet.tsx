'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { LeadCaptureForm } from '@/components/microsite/lead-capture-form'

const SESSION_KEY = 'lead_sheet_shown'

interface LeadCaptureSheetProps {
  tenantId: string
  businessProfileId: string
  tenantSlug: string
  eventName?: string | null
  categories?: { id: string; name: string }[]
  ctaText?: string
  thankYouMessage?: string
}

/**
 * Bottom sheet wrapper for the lead capture form.
 * Triggers:
 *   1. Scroll depth (~38%) -- shows once per session
 *   2. Gated document "Request Access" click -- intercepts #lead-capture anchor
 * Uses shadcn/ui Sheet with side="bottom".
 */
export function LeadCaptureSheet({
  tenantId,
  businessProfileId,
  tenantSlug,
  eventName,
  categories,
  ctaText = 'Get in Touch',
  thankYouMessage,
}: LeadCaptureSheetProps) {
  const [open, setOpen] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [triggerSource, setTriggerSource] = useState<
    'scroll_sheet' | 'gated_doc_sheet'
  >('scroll_sheet')
  const scrollTriggered = useRef(false)

  // Check sessionStorage on mount
  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY) === '1') {
        setDismissed(true)
      }
    } catch {
      // sessionStorage unavailable (e.g. private browsing in some browsers)
    }
  }, [])

  // Open the sheet and record in sessionStorage
  const openSheet = useCallback(
    (source: 'scroll_sheet' | 'gated_doc_sheet') => {
      setTriggerSource(source)
      setOpen(true)
      try {
        sessionStorage.setItem(SESSION_KEY, '1')
      } catch {
        // sessionStorage unavailable
      }
    },
    []
  )

  // Scroll trigger: open after ~38% scroll depth (once per session)
  useEffect(() => {
    if (dismissed || scrollTriggered.current) return

    let ticking = false

    function onScroll() {
      if (ticking) return
      ticking = true

      requestAnimationFrame(() => {
        const scrollRatio =
          window.scrollY /
          (document.documentElement.scrollHeight - window.innerHeight)

        if (scrollRatio > 0.38 && !scrollTriggered.current) {
          scrollTriggered.current = true
          openSheet('scroll_sheet')
        }

        ticking = false
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [dismissed, openSheet])

  // Gated document trigger: intercept clicks on a[href="#lead-capture"]
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null
      const anchor = target?.closest?.('a[href="#lead-capture"]')
      if (!anchor) return

      // Prevent default scroll to the inline form section
      e.preventDefault()
      openSheet('gated_doc_sheet')
    }

    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [openSheet])

  // Handle sheet close
  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) {
      setDismissed(true)
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{ctaText}</SheetTitle>
          <SheetDescription>
            Leave your details and we&apos;ll follow up
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-6">
          <LeadCaptureForm
            tenantId={tenantId}
            businessProfileId={businessProfileId}
            tenantSlug={tenantSlug}
            eventName={eventName}
            categories={categories}
            formLocation={triggerSource}
            ctaText={ctaText}
            thankYouMessage={thankYouMessage}
            onSuccess={() => {
              setTimeout(() => setOpen(false), 2000)
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
