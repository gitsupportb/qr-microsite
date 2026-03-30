'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { loginSchema, signupSchema } from '@/lib/schemas/auth'

export async function loginAction(formData: {
  email: string
  password: string
}) {
  const parsed = loginSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid input' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/admin')
}

export async function signupAction(formData: {
  email: string
  password: string
  confirmPassword: string
}) {
  const parsed = signupSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid input' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    return { error: error.message }
  }

  // For local dev, Supabase auto-confirms email.
  // In production, redirect to a "check your email" page.
  redirect('/admin')
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
