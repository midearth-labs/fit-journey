'use client'

import { useAuth } from '@/contexts/auth-context'
import { useState } from 'react'

export { useAuth }

// Custom hook for form handling with auth
export function useAuthForm() {
  const auth = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (action: () => Promise<void>) => {
    if (isSubmitting) return
    
    try {
      setIsSubmitting(true)
      await action()
    } catch (error) {
      // Error is handled by auth context
      console.error('Auth form error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    ...auth,
    isSubmitting,
    handleSubmit,
  }
}

// Hook for checking authentication status
export function useAuthStatus() {
  const { user, loading } = useAuth()
  
  return {
    isAuthenticated: !!user,
    isLoading: loading,
    user,
  }
}

// Hook for protected components
export function useRequireAuth() {
  const { user, loading } = useAuth()
  
  if (loading) {
    return { isLoading: true, user: null }
  }
  
  if (!user) {
    throw new Error('Authentication required')
  }
  
  return { isLoading: false, user }
}
