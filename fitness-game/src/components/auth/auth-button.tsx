'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'

interface AuthButtonProps {
  className?: string
}

export function AuthButton({ className }: AuthButtonProps) {
  const { user, signOut, loading } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      setIsSigningOut(false)
    }
  }

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-9 w-20 bg-gray-200 rounded"></div>
      </div>
    )
  }

  if (user) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <span className="text-sm text-gray-600">
          {user.user_metadata?.full_name || user.email}
        </span>
        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="px-3 py-1.5 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
        >
          {isSigningOut ? 'Signing out...' : 'Sign Out'}
        </button>
      </div>
    )
  }

  return (
    <div className={className}>
      <a
        href="/auth/login"
        className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Sign In
      </a>
    </div>
  )
}
