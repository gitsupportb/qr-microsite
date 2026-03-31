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
      <ProfileForm
        initialData={
          profile ?? { name: '', slug: '', email: user.email ?? '' }
        }
      />
    </div>
  )
}
