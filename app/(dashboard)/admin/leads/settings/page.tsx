import { getLeadFormConfig } from '@/lib/actions/lead-form-config'
import { LeadFormSettings } from '@/components/admin/lead-form-settings'
import { redirect } from 'next/navigation'

export default async function LeadFormSettingsPage() {
  const result = await getLeadFormConfig()

  if ('error' in result) {
    if (result.error === 'Not authenticated') {
      redirect('/login')
    }
    if (result.noProfile) {
      return (
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-6 text-2xl font-bold text-slate-800">Lead Form Settings</h1>
          <div className="rounded-2xl bg-white/60 backdrop-blur-xl border border-white/20 shadow-lg shadow-black/[0.03] p-6">
            <p className="text-slate-500">
              Please create your business profile first before configuring lead
              form settings.
            </p>
          </div>
        </div>
      )
    }
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold text-slate-800">Lead Form Settings</h1>
        <div className="rounded-2xl bg-white/60 backdrop-blur-xl border border-white/20 shadow-lg shadow-black/[0.03] p-6">
          <p className="text-destructive">{result.error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-slate-800">Lead Form Settings</h1>
      <div className="rounded-2xl bg-white/60 backdrop-blur-xl border border-white/20 shadow-lg shadow-black/[0.03] p-6">
        <LeadFormSettings config={result.data} />
      </div>
    </div>
  )
}
