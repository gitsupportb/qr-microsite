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
          <h1 className="mb-6 text-2xl font-bold">Lead Form Settings</h1>
          <div className="rounded-lg border bg-card p-6 text-card-foreground">
            <p className="text-muted-foreground">
              Please create your business profile first before configuring lead
              form settings.
            </p>
          </div>
        </div>
      )
    }
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold">Lead Form Settings</h1>
        <div className="rounded-lg border border-destructive/50 bg-card p-6 text-card-foreground">
          <p className="text-destructive">{result.error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Lead Form Settings</h1>
      <LeadFormSettings config={result.data} />
    </div>
  )
}
