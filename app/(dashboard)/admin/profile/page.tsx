import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileForm } from '@/components/profile/profile-form'
import { getProfile } from '@/lib/actions/profile'

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await getProfile()

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-2xl bg-white/60 backdrop-blur-xl border border-white/20 shadow-lg shadow-black/[0.03] p-6">
        <ProfileForm
          initialData={
            profile ?? { name: '', slug: '', email: user.email ?? '' }
          }
        />
      </div>
    </div>
  )
}
