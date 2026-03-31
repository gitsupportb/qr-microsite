'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Download, Save, QrCode } from 'lucide-react'
import { toast } from 'sonner'
import { saveQrCode } from '@/lib/actions/qr-code'
import type { QrDesignConfig } from '@/lib/schemas/qr-code'
import type { Json } from '@/lib/supabase/types'

interface QrGeneratorProps {
  initialQrCode: {
    campaign_name: string | null
    design_config: Json
    target_url: string
  } | null
  logoUrl: string | null
  themeTokens: Json | null
  tenantSlug: string | null
}

type DotStyle = 'square' | 'dots' | 'rounded' | 'extra-rounded' | 'classy' | 'classy-rounded'
type CornerSquareStyle = 'square' | 'dot' | 'extra-rounded'
type CornerDotStyle = 'square' | 'dot'

const DOT_STYLES: { value: DotStyle; label: string }[] = [
  { value: 'square', label: 'Square' },
  { value: 'dots', label: 'Dots' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'extra-rounded', label: 'Extra Rounded' },
  { value: 'classy', label: 'Classy' },
  { value: 'classy-rounded', label: 'Classy Rounded' },
]

const CORNER_SQUARE_STYLES: { value: CornerSquareStyle; label: string }[] = [
  { value: 'square', label: 'Square' },
  { value: 'dot', label: 'Dot' },
  { value: 'extra-rounded', label: 'Extra Rounded' },
]

const CORNER_DOT_STYLES: { value: CornerDotStyle; label: string }[] = [
  { value: 'square', label: 'Square' },
  { value: 'dot', label: 'Dot' },
]

function parseDesignConfig(config: Json | null): QrDesignConfig {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    return {
      dotColor: '#000000',
      backgroundColor: '#ffffff',
      dotStyle: 'rounded',
      cornerSquareStyle: 'extra-rounded',
      cornerDotStyle: 'dot',
      embedLogo: true,
    }
  }
  const c = config as Record<string, unknown>
  return {
    dotColor: (typeof c.dotColor === 'string' ? c.dotColor : '#000000') as string,
    backgroundColor: (typeof c.backgroundColor === 'string' ? c.backgroundColor : '#ffffff') as string,
    dotStyle: (typeof c.dotStyle === 'string' ? c.dotStyle : 'rounded') as DotStyle,
    cornerSquareStyle: (typeof c.cornerSquareStyle === 'string' ? c.cornerSquareStyle : 'extra-rounded') as CornerSquareStyle,
    cornerDotStyle: (typeof c.cornerDotStyle === 'string' ? c.cornerDotStyle : 'dot') as CornerDotStyle,
    embedLogo: typeof c.embedLogo === 'boolean' ? c.embedLogo : true,
  }
}

function parseThemePrimaryColor(tokens: Json | null): string | null {
  if (!tokens || typeof tokens !== 'object' || Array.isArray(tokens)) return null
  const t = tokens as Record<string, unknown>
  return typeof t.primaryColor === 'string' ? t.primaryColor : null
}

export function QrGenerator({ initialQrCode, logoUrl, themeTokens, tenantSlug }: QrGeneratorProps) {
  const qrContainerRef = useRef<HTMLDivElement>(null)
  const qrInstanceRef = useRef<{ update: (opts: Record<string, unknown>) => void; download: (opts: { name: string; extension: string }) => Promise<void> } | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [saving, setSaving] = useState(false)

  // Derive initial dot color from theme primary color or existing config
  const existingConfig = parseDesignConfig(initialQrCode?.design_config ?? null)
  const themePrimary = parseThemePrimaryColor(themeTokens)

  const [campaignName, setCampaignName] = useState(initialQrCode?.campaign_name || '')
  const [dotColor, setDotColor] = useState(existingConfig.dotColor !== '#000000' ? existingConfig.dotColor : (themePrimary || '#000000'))
  const [backgroundColor, setBackgroundColor] = useState(existingConfig.backgroundColor)
  const [dotStyle, setDotStyle] = useState<DotStyle>(existingConfig.dotStyle)
  const [cornerSquareStyle, setCornerSquareStyle] = useState<CornerSquareStyle>(existingConfig.cornerSquareStyle)
  const [cornerDotStyle, setCornerDotStyle] = useState<CornerDotStyle>(existingConfig.cornerDotStyle)
  const [embedLogo, setEmbedLogo] = useState(existingConfig.embedLogo)

  const baseUrl = typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_APP_URL || window.location.origin)
    : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
  const targetUrl = tenantSlug ? `${baseUrl}/${tenantSlug}` : baseUrl

  // Build QR options for qr-code-styling
  const getQrOptions = useCallback((size: number) => ({
    width: size,
    height: size,
    type: 'svg' as const,
    data: targetUrl,
    dotsOptions: {
      color: dotColor,
      type: dotStyle,
    },
    cornersSquareOptions: {
      color: dotColor,
      type: cornerSquareStyle,
    },
    cornersDotOptions: {
      color: dotColor,
      type: cornerDotStyle,
    },
    backgroundOptions: {
      color: backgroundColor,
    },
    ...(embedLogo && logoUrl ? {
      image: logoUrl,
      imageOptions: {
        crossOrigin: 'anonymous' as const,
        margin: 5,
        imageSize: 0.4,
      },
    } : {}),
    qrOptions: {
      errorCorrectionLevel: 'H' as const,
    },
  }), [targetUrl, dotColor, dotStyle, cornerSquareStyle, cornerDotStyle, backgroundColor, embedLogo, logoUrl])

  // Initialize QR code on mount
  useEffect(() => {
    let mounted = true

    async function initQr() {
      const QRCodeStyling = (await import('qr-code-styling')).default
      if (!mounted || !qrContainerRef.current) return

      const qr = new QRCodeStyling(getQrOptions(300))
      qrContainerRef.current.innerHTML = ''
      qr.append(qrContainerRef.current)
      qrInstanceRef.current = qr as unknown as typeof qrInstanceRef.current
      setIsReady(true)
    }

    initQr()
    return () => { mounted = false }
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update QR code when options change
  useEffect(() => {
    if (!qrInstanceRef.current || !isReady) return
    qrInstanceRef.current.update(getQrOptions(300) as unknown as Record<string, unknown>)
  }, [getQrOptions, isReady])

  async function handleSave() {
    setSaving(true)
    try {
      const result = await saveQrCode({
        campaign_name: campaignName || undefined,
        design_config: {
          dotColor,
          backgroundColor,
          dotStyle,
          cornerSquareStyle,
          cornerDotStyle,
          embedLogo,
        },
      })
      if (result.success) {
        toast.success('QR code configuration saved')
      } else {
        toast.error(result.error || 'Failed to save QR code')
      }
    } catch {
      toast.error('Failed to save QR code')
    } finally {
      setSaving(false)
    }
  }

  async function handleDownloadPng() {
    try {
      // Create a high-res instance for 300 DPI at 4" print = 1200x1200
      const QRCodeStyling = (await import('qr-code-styling')).default
      const hiRes = new QRCodeStyling(getQrOptions(1200))
      await hiRes.download({
        name: campaignName || 'qr-code',
        extension: 'png',
      })
      toast.success('PNG downloaded (300 DPI)')
    } catch {
      toast.error('Failed to download PNG')
    }
  }

  async function handleDownloadSvg() {
    try {
      const QRCodeStyling = (await import('qr-code-styling')).default
      const svgInstance = new QRCodeStyling(getQrOptions(1200))
      await svgInstance.download({
        name: campaignName || 'qr-code',
        extension: 'svg',
      })
      toast.success('SVG downloaded')
    } catch {
      toast.error('Failed to download SVG')
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* QR Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Code Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4">
            <div
              ref={qrContainerRef}
              className="flex items-center justify-center rounded-lg bg-white p-4"
              style={{ minHeight: 316, minWidth: 316 }}
            />
            {!isReady && (
              <p className="text-sm text-muted-foreground">Loading QR code...</p>
            )}
            <p className="text-center text-xs text-muted-foreground break-all">
              {targetUrl}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Configuration */}
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {/* Campaign Name */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="campaign-name">Campaign Name</Label>
              <Input
                id="campaign-name"
                placeholder="e.g. Tech Expo 2026"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">
                Optional label for tracking which event or campaign this QR code is for.
              </p>
            </div>

            {/* Dot Color */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dot-color">Dot Color</Label>
              <div className="flex items-center gap-2">
                <input
                  id="dot-color"
                  type="color"
                  value={dotColor}
                  onChange={(e) => setDotColor(e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded border border-input"
                />
                <Input
                  value={dotColor}
                  onChange={(e) => {
                    if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) setDotColor(e.target.value)
                  }}
                  className="w-28 font-mono"
                  maxLength={7}
                />
              </div>
            </div>

            {/* Background Color */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bg-color">Background Color</Label>
              <div className="flex items-center gap-2">
                <input
                  id="bg-color"
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded border border-input"
                />
                <Input
                  value={backgroundColor}
                  onChange={(e) => {
                    if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) setBackgroundColor(e.target.value)
                  }}
                  className="w-28 font-mono"
                  maxLength={7}
                />
              </div>
            </div>

            {/* Dot Style */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dot-style">Dot Style</Label>
              <select
                id="dot-style"
                value={dotStyle}
                onChange={(e) => setDotStyle(e.target.value as DotStyle)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {DOT_STYLES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Corner Square Style */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="corner-square-style">Corner Square Style</Label>
              <select
                id="corner-square-style"
                value={cornerSquareStyle}
                onChange={(e) => setCornerSquareStyle(e.target.value as CornerSquareStyle)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {CORNER_SQUARE_STYLES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Corner Dot Style */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="corner-dot-style">Corner Dot Style</Label>
              <select
                id="corner-dot-style"
                value={cornerDotStyle}
                onChange={(e) => setCornerDotStyle(e.target.value as CornerDotStyle)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {CORNER_DOT_STYLES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Embed Logo */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <Label htmlFor="embed-logo">Embed Company Logo</Label>
                <p className="text-xs text-muted-foreground">
                  {logoUrl ? 'Place your company logo in the center of the QR code.' : 'Upload a logo in Business Profile first.'}
                </p>
              </div>
              <Switch
                id="embed-logo"
                checked={embedLogo && !!logoUrl}
                onCheckedChange={(checked) => setEmbedLogo(checked)}
                disabled={!logoUrl}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardContent className="flex flex-col gap-3 pt-6">
            <Button onClick={handleSave} disabled={saving} className="w-full">
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save Configuration'}
            </Button>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={handleDownloadPng} disabled={!isReady}>
                <Download className="mr-2 h-4 w-4" />
                PNG (300 DPI)
              </Button>
              <Button variant="outline" onClick={handleDownloadSvg} disabled={!isReady}>
                <Download className="mr-2 h-4 w-4" />
                SVG
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
