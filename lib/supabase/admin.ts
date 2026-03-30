// SERVER ONLY - Never import this file in client components.
// This client bypasses ALL Row Level Security policies.
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

export const createAdminClient = () =>
  createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
