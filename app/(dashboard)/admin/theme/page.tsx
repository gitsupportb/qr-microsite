import { getThemeConfig } from '@/lib/actions/theme'
import { ThemeSettings } from '@/components/admin/theme-settings'
import { redirect } from 'next/navigation'

export default async function ThemeSettingsPage() {
  const result = await getThemeConfig()

  if ('error' in result) {
    if (result.error === 'Not authenticated') {
      redirect('/login')
    }
    return (
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-2xl font-bold">Theme & Branding</h1>
        <div className="rounded-lg border border-destructive/50 bg-card p-6 text-card-foreground">
          <p className="text-destructive">{result.error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 text-2xl font-bold">Theme & Branding</h1>
      <ThemeSettings config={result.data} />
    </div>
  )
}
