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
        <h1 className="mb-6 text-2xl font-bold text-slate-800">Theme & Branding</h1>
        <div className="rounded-2xl bg-white/60 backdrop-blur-xl border border-white/20 shadow-lg shadow-black/[0.03] p-6">
          <p className="text-destructive">{result.error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 text-2xl font-bold text-slate-800">Theme & Branding</h1>
      <div className="rounded-2xl bg-white/60 backdrop-blur-xl border border-white/20 shadow-lg shadow-black/[0.03] p-6">
        <ThemeSettings config={result.data} />
      </div>
    </div>
  )
}
