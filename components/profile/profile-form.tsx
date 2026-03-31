'use client'

import { useState, useTransition } from 'react'
import { updateProfile, updatePassword } from '@/lib/actions/profile'
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
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

interface ProfileFormProps {
  initialData: {
    name: string
    slug: string
    email: string
  }
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  // Profile state
  const [name, setName] = useState(initialData.name)
  const [slug, setSlug] = useState(initialData.slug)
  const [isProfilePending, startProfileTransition] = useTransition()

  // Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isPasswordPending, startPasswordTransition] = useTransition()

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startProfileTransition(async () => {
      const result = await updateProfile({ name, slug })
      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success('Profile updated successfully')
      }
    })
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startPasswordTransition(async () => {
      const result = await updatePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      })
      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success('Password updated successfully')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    })
  }

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Auto-format: lowercase, replace spaces with hyphens, strip invalid chars
    const value = e.target.value
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
    setSlug(value)
  }

  return (
    <div className="space-y-6">
      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>
            Manage your account details and microsite URL
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={initialData.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Display Name *</Label>
              <Input
                id="name"
                placeholder="Your display name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Microsite Slug *</Label>
              <Input
                id="slug"
                placeholder="my-company"
                value={slug}
                onChange={handleSlugChange}
                maxLength={63}
              />
              <p className="text-xs text-muted-foreground">
                Your microsite URL will be:{' '}
                <span className="font-mono">
                  {typeof window !== 'undefined' ? window.location.origin : ''}
                  /{slug || 'your-slug'}
                </span>
              </p>
            </div>

            <Button type="submit" disabled={isProfilePending}>
              {isProfilePending ? 'Saving...' : 'Save Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Update your account password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password *</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password *</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>

            <Button type="submit" disabled={isPasswordPending}>
              {isPasswordPending ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
