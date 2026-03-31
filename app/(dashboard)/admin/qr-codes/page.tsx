import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getQrCodeData } from '@/lib/actions/qr-code'
import { QrGenerator } from '@/components/admin/qr-generator'

export default async function QrCodesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const data = await getQrCodeData()

  if (!data) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">QR Code Generator</h1>
          <p className="text-muted-foreground">
            Unable to load QR code data. Please try again.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">QR Code Generator</h1>
        <p className="text-muted-foreground">
          Create branded QR codes for your event materials. Customize colors, styles, and embed your company logo.
        </p>
      </div>
      <QrGenerator
        initialQrCode={data.qrCode}
        logoUrl={data.logoUrl}
        themeTokens={data.themeTokens}
        tenantSlug={data.tenantSlug}
      />
    </div>
  )
}
