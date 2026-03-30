import { createClient } from '@/lib/supabase/server'

export default async function AdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div>
      <h2 className="mb-4 text-2xl font-bold">Welcome to your dashboard</h2>
      <p className="text-gray-600">Logged in as {user?.email}</p>
      <p className="mt-2 text-sm text-gray-400">
        Business profile management, products, and more coming in Phase 2.
      </p>
    </div>
  )
}
