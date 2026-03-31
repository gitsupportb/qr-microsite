'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signupSchema, type SignupInput } from '@/lib/schemas/auth'
import { signupAction } from '@/lib/actions/auth'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'

export function SignupForm() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = (data: SignupInput) => {
    setError(null)
    startTransition(async () => {
      const result = await signupAction(data)
      if (result?.error) {
        setError(result.error)
      }
    })
  }

  return (
    <Card className="bg-white/60 backdrop-blur-xl border border-white/20 shadow-lg shadow-black/[0.03] rounded-2xl">
      <CardHeader>
        <CardTitle className="text-slate-800">Create account</CardTitle>
        <CardDescription className="text-slate-500">
          Sign up to create your business microsite
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-800">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              className="bg-white/50 border-white/30 focus:bg-white/80 focus:border-blue-500/30 backdrop-blur-sm"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-800">Password</Label>
            <Input
              id="password"
              type="password"
              className="bg-white/50 border-white/30 focus:bg-white/80 focus:border-blue-500/30 backdrop-blur-sm"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-red-600">
                {errors.password.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-slate-800">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              className="bg-white/50 border-white/30 focus:bg-white/80 focus:border-blue-500/30 backdrop-blur-sm"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-600">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Creating account...' : 'Create account'}
          </Button>
          <p className="text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:underline">
              Log in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
