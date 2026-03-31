'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { ArrowUp, ArrowDown, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { updateThemeConfig } from '@/lib/actions/theme'
import {
  defaultThemeConfig,
  sectionIds,
  type ThemeConfig,
  type ThemeTokens,
  type SectionOrder,
} from '@/lib/schemas/theme'

const SECTION_LABELS: Record<(typeof sectionIds)[number], string> = {
  hero: 'Hero Banner',
  communication: 'Contact Buttons',
  products: 'Products',
  about: 'About Us',
  trust: 'Trust & Credentials',
  documents: 'Documents & Brochures',
  'lead-capture': 'Lead Capture Form',
  representatives: 'Team Contacts',
  share: 'Share Button',
  footer: 'Footer',
}

const FONT_SCALE_OPTIONS: { value: ThemeTokens['fontScale']; label: string }[] =
  [
    { value: 'compact', label: 'Compact' },
    { value: 'default', label: 'Default' },
    { value: 'spacious', label: 'Spacious' },
  ]

const BORDER_RADIUS_OPTIONS: {
  value: ThemeTokens['borderRadius']
  label: string
}[] = [
  { value: '0rem', label: 'Sharp (0)' },
  { value: '0.5rem', label: 'Rounded (8px)' },
  { value: '1rem', label: 'Pill (16px)' },
]

const THEME_PRESETS: { name: string; description: string; tokens: Partial<ThemeTokens> }[] = [
  {
    name: 'Clinical Blue',
    description: 'Professional medical blue',
    tokens: { primaryColor: '#2563eb', primaryForeground: '#ffffff', accentColor: '#3b82f6', accentForeground: '#ffffff', backgroundColor: '#ffffff', foregroundColor: '#0f172a', borderRadius: '0.5rem', fontScale: 'default' },
  },
  {
    name: 'Forest Green',
    description: 'Natural trust and growth',
    tokens: { primaryColor: '#16a34a', primaryForeground: '#ffffff', accentColor: '#22c55e', accentForeground: '#ffffff', backgroundColor: '#ffffff', foregroundColor: '#14532d', borderRadius: '0.5rem', fontScale: 'default' },
  },
  {
    name: 'Royal Purple',
    description: 'Premium and innovative',
    tokens: { primaryColor: '#7c3aed', primaryForeground: '#ffffff', accentColor: '#a78bfa', accentForeground: '#ffffff', backgroundColor: '#ffffff', foregroundColor: '#1e1b4b', borderRadius: '1rem', fontScale: 'default' },
  },
  {
    name: 'Warm Coral',
    description: 'Energetic and approachable',
    tokens: { primaryColor: '#ea580c', primaryForeground: '#ffffff', accentColor: '#f97316', accentForeground: '#ffffff', backgroundColor: '#fffbeb', foregroundColor: '#431407', borderRadius: '0.5rem', fontScale: 'default' },
  },
  {
    name: 'Slate Minimal',
    description: 'Clean and modern',
    tokens: { primaryColor: '#334155', primaryForeground: '#ffffff', accentColor: '#64748b', accentForeground: '#ffffff', backgroundColor: '#f8fafc', foregroundColor: '#0f172a', borderRadius: '0rem', fontScale: 'compact' },
  },
  {
    name: 'Dark Luxe',
    description: 'Bold dark with gold accent',
    tokens: { primaryColor: '#d97706', primaryForeground: '#000000', accentColor: '#fbbf24', accentForeground: '#000000', backgroundColor: '#0c0a09', foregroundColor: '#fafaf9', borderRadius: '0.5rem', fontScale: 'spacious' },
  },
  {
    name: 'Linktree Green',
    description: 'Classic bio-link style',
    tokens: { primaryColor: '#43e660', primaryForeground: '#000000', accentColor: '#39d353', accentForeground: '#000000', backgroundColor: '#f3f3f1', foregroundColor: '#1a1a1a', borderRadius: '1rem', fontScale: 'default' },
  },
  {
    name: 'Neon Night',
    description: 'Dark with vibrant neon links',
    tokens: { primaryColor: '#e879f9', primaryForeground: '#000000', accentColor: '#22d3ee', accentForeground: '#000000', backgroundColor: '#0a0a0a', foregroundColor: '#f5f5f5', borderRadius: '1rem', fontScale: 'default' },
  },
  {
    name: 'Ocean Breeze',
    description: 'Calm teal-blue gradient feel',
    tokens: { primaryColor: '#0891b2', primaryForeground: '#ffffff', accentColor: '#06b6d4', accentForeground: '#000000', backgroundColor: '#ecfeff', foregroundColor: '#164e63', borderRadius: '0.5rem', fontScale: 'default' },
  },
  {
    name: 'Sunset Glow',
    description: 'Warm gradient vibes',
    tokens: { primaryColor: '#e11d48', primaryForeground: '#ffffff', accentColor: '#fb923c', accentForeground: '#000000', backgroundColor: '#fff1f2', foregroundColor: '#1c1917', borderRadius: '1rem', fontScale: 'spacious' },
  },
  {
    name: 'Monochrome',
    description: 'Elegant black and white',
    tokens: { primaryColor: '#171717', primaryForeground: '#fafafa', accentColor: '#525252', accentForeground: '#fafafa', backgroundColor: '#fafafa', foregroundColor: '#0a0a0a', borderRadius: '0rem', fontScale: 'compact' },
  },
  {
    name: 'Candy Pop',
    description: 'Fun and playful pastels',
    tokens: { primaryColor: '#ec4899', primaryForeground: '#ffffff', accentColor: '#a855f7', accentForeground: '#ffffff', backgroundColor: '#fdf2f8', foregroundColor: '#1e1b4b', borderRadius: '1rem', fontScale: 'spacious' },
  },
]

type BackgroundPreset = 'white' | 'light-gray' | 'custom'

function getBackgroundPreset(color: string): BackgroundPreset {
  if (color === '#ffffff') return 'white'
  if (color === '#f5f5f4') return 'light-gray'
  return 'custom'
}

interface ThemeSettingsProps {
  config: ThemeConfig
}

export function ThemeSettings({ config }: ThemeSettingsProps) {
  const [isPending, startTransition] = useTransition()
  const [tokens, setTokens] = useState<ThemeTokens>({ ...config.tokens })
  const [sectionOrder, setSectionOrder] = useState<SectionOrder>([
    ...config.sectionOrder,
  ])
  const [bgPreset, setBgPreset] = useState<BackgroundPreset>(
    getBackgroundPreset(config.tokens.backgroundColor)
  )

  function updateToken<K extends keyof ThemeTokens>(
    key: K,
    value: ThemeTokens[K]
  ) {
    setTokens((prev) => ({ ...prev, [key]: value }))
  }

  function handleBgPreset(preset: BackgroundPreset) {
    setBgPreset(preset)
    if (preset === 'white') updateToken('backgroundColor', '#ffffff')
    else if (preset === 'light-gray') updateToken('backgroundColor', '#f5f5f4')
  }

  function moveSection(index: number, direction: 'up' | 'down') {
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= sectionOrder.length) return
    setSectionOrder((prev) => {
      const next = [...prev]
      ;[next[index], next[swapIndex]] = [next[swapIndex], next[index]]
      return next
    })
  }

  function handleReset() {
    setTokens({ ...defaultThemeConfig.tokens })
    setSectionOrder([...defaultThemeConfig.sectionOrder])
    setBgPreset(
      getBackgroundPreset(defaultThemeConfig.tokens.backgroundColor)
    )
  }

  function handleSave() {
    startTransition(async () => {
      const themeConfig: ThemeConfig = { tokens, sectionOrder }
      const result = await updateThemeConfig(themeConfig)
      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success('Theme settings saved')
      }
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      {/* Settings Column */}
      <div className="space-y-6">
        {/* Theme Presets */}
        <Card>
          <CardHeader>
            <CardTitle>Theme Presets</CardTitle>
            <CardDescription>
              Quick-start with a pre-designed theme, then customize further.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {THEME_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => {
                    const full = { ...tokens, ...preset.tokens } as ThemeTokens
                    setTokens(full)
                    setBgPreset(getBackgroundPreset(full.backgroundColor))
                    toast.success(`Applied "${preset.name}" preset`)
                  }}
                  className="group flex flex-col items-start gap-1.5 rounded-xl border border-white/30 bg-white/40 p-3 text-left backdrop-blur-sm transition-all hover:bg-white/60 hover:shadow-sm"
                >
                  <div className="flex gap-1">
                    <span className="block size-4 rounded-full border border-white/40" style={{ backgroundColor: preset.tokens.primaryColor }} />
                    <span className="block size-4 rounded-full border border-white/40" style={{ backgroundColor: preset.tokens.accentColor }} />
                    <span className="block size-4 rounded-full border border-white/40" style={{ backgroundColor: preset.tokens.backgroundColor }} />
                  </div>
                  <span className="text-xs font-medium text-slate-700">{preset.name}</span>
                  <span className="text-[10px] leading-tight text-slate-400">{preset.description}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Color Section */}
        <Card>
          <CardHeader>
            <CardTitle>Brand Colors</CardTitle>
            <CardDescription>
              Set your primary and accent brand colors. These will be applied
              across your microsite.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <ColorPicker
                label="Primary Color"
                value={tokens.primaryColor}
                onChange={(v) => updateToken('primaryColor', v)}
              />
              <ColorPicker
                label="Primary Text"
                value={tokens.primaryForeground}
                onChange={(v) => updateToken('primaryForeground', v)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <ColorPicker
                label="Accent Color"
                value={tokens.accentColor}
                onChange={(v) => updateToken('accentColor', v)}
              />
              <ColorPicker
                label="Accent Text"
                value={tokens.accentForeground}
                onChange={(v) => updateToken('accentForeground', v)}
              />
            </div>
            <ColorPicker
              label="Text Color"
              value={tokens.foregroundColor}
              onChange={(v) => updateToken('foregroundColor', v)}
            />
          </CardContent>
        </Card>

        {/* Typography Section */}
        <Card>
          <CardHeader>
            <CardTitle>Typography Scale</CardTitle>
            <CardDescription>
              Control the overall text sizing across your microsite.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {FONT_SCALE_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  type="button"
                  variant={
                    tokens.fontScale === opt.value ? 'default' : 'outline'
                  }
                  size="sm"
                  onClick={() => updateToken('fontScale', opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Border Radius Section */}
        <Card>
          <CardHeader>
            <CardTitle>Border Radius</CardTitle>
            <CardDescription>
              Choose how rounded corners appear on cards and buttons.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {BORDER_RADIUS_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  type="button"
                  variant={
                    tokens.borderRadius === opt.value ? 'default' : 'outline'
                  }
                  size="sm"
                  onClick={() => updateToken('borderRadius', opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Background Style Section */}
        <Card>
          <CardHeader>
            <CardTitle>Background Style</CardTitle>
            <CardDescription>
              Set the background color for your microsite.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              {(
                [
                  { value: 'white', label: 'White' },
                  { value: 'light-gray', label: 'Light Gray' },
                  { value: 'custom', label: 'Custom' },
                ] as { value: BackgroundPreset; label: string }[]
              ).map((opt) => (
                <Button
                  key={opt.value}
                  type="button"
                  variant={bgPreset === opt.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleBgPreset(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
            {bgPreset === 'custom' && (
              <ColorPicker
                label="Background Color"
                value={tokens.backgroundColor}
                onChange={(v) => updateToken('backgroundColor', v)}
              />
            )}
          </CardContent>
        </Card>

        {/* Section Order */}
        <Card>
          <CardHeader>
            <CardTitle>Section Order</CardTitle>
            <CardDescription>
              Rearrange the sections on your microsite. Use the arrows to move
              sections up or down.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {sectionOrder.map((sectionId, index) => (
                <div
                  key={sectionId}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <span className="text-sm font-medium">
                    {SECTION_LABELS[sectionId] ?? sectionId}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={index === 0}
                      onClick={() => moveSection(index, 'up')}
                      aria-label={`Move ${SECTION_LABELS[sectionId]} up`}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={index === sectionOrder.length - 1}
                      onClick={() => moveSection(index, 'down')}
                      aria-label={`Move ${SECTION_LABELS[sectionId]} down`}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={isPending}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset to Defaults
          </Button>
          <Button type="button" onClick={handleSave} disabled={isPending}>
            {isPending ? 'Saving...' : 'Save Theme'}
          </Button>
        </div>
      </div>

      {/* Live Preview Column */}
      <div className="lg:sticky lg:top-6 lg:self-start">
        <Card>
          <CardHeader>
            <CardTitle>Live Preview</CardTitle>
            <CardDescription>
              See how your theme changes look in real time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="overflow-hidden rounded-lg border"
              style={{
                backgroundColor: tokens.backgroundColor,
                borderRadius: tokens.borderRadius,
              }}
            >
              {/* Mini hero */}
              <div
                className="px-4 py-6 text-center"
                style={{
                  backgroundColor: tokens.primaryColor,
                  color: tokens.primaryForeground,
                  borderRadius: `${tokens.borderRadius} ${tokens.borderRadius} 0 0`,
                }}
              >
                <div className="text-xs font-semibold uppercase tracking-wide opacity-70">
                  Your Company
                </div>
                <div
                  className="mt-1 font-bold"
                  style={{
                    fontSize:
                      tokens.fontScale === 'compact'
                        ? '14px'
                        : tokens.fontScale === 'spacious'
                          ? '20px'
                          : '16px',
                  }}
                >
                  Welcome to Our Microsite
                </div>
              </div>

              {/* Mini card body */}
              <div className="space-y-3 p-4">
                <div
                  style={{
                    color: tokens.foregroundColor,
                    fontSize:
                      tokens.fontScale === 'compact'
                        ? '11px'
                        : tokens.fontScale === 'spacious'
                          ? '14px'
                          : '12px',
                  }}
                >
                  <p>
                    This is a preview of your microsite theme with the current
                    color, typography, and border settings.
                  </p>
                </div>

                {/* Mini product card */}
                <div
                  className="border p-3"
                  style={{
                    borderRadius: tokens.borderRadius,
                    borderColor: tokens.primaryColor + '30',
                  }}
                >
                  <div
                    className="mb-1 text-xs font-semibold"
                    style={{ color: tokens.foregroundColor }}
                  >
                    Sample Product
                  </div>
                  <div
                    className="text-xs"
                    style={{
                      color: tokens.foregroundColor,
                      opacity: 0.7,
                      fontSize:
                        tokens.fontScale === 'compact'
                          ? '10px'
                          : tokens.fontScale === 'spacious'
                            ? '13px'
                            : '11px',
                    }}
                  >
                    Product description goes here
                  </div>
                </div>

                {/* Mini accent button */}
                <button
                  type="button"
                  className="w-full py-1.5 text-xs font-medium"
                  style={{
                    backgroundColor: tokens.accentColor,
                    color: tokens.accentForeground,
                    borderRadius: tokens.borderRadius,
                  }}
                >
                  Contact Us
                </button>

                {/* Mini primary button */}
                <button
                  type="button"
                  className="w-full py-1.5 text-xs font-medium"
                  style={{
                    backgroundColor: tokens.primaryColor,
                    color: tokens.primaryForeground,
                    borderRadius: tokens.borderRadius,
                  }}
                >
                  View Products
                </button>
              </div>
            </div>

            {/* Section order preview */}
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Section Order
              </p>
              <div className="space-y-1">
                {sectionOrder.map((sectionId, i) => (
                  <div
                    key={sectionId}
                    className="flex items-center gap-2 text-xs text-muted-foreground"
                  >
                    <span className="w-4 text-right font-mono text-[10px] opacity-50">
                      {i + 1}
                    </span>
                    <span>{SECTION_LABELS[sectionId] ?? sectionId}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Color Picker sub-component
// ---------------------------------------------------------------------------

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  function handleTextChange(text: string) {
    // Allow partial typing; only commit valid hex
    if (/^#[0-9a-fA-F]{6}$/.test(text)) {
      onChange(text)
    }
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-9 shrink-0 cursor-pointer rounded border border-input bg-transparent p-0.5"
        />
        <Input
          value={value}
          onChange={(e) => handleTextChange(e.target.value)}
          className="h-9 font-mono text-xs"
          maxLength={7}
          placeholder="#000000"
        />
      </div>
    </div>
  )
}
