'use client'

import { useAuthStatus } from '@/lib/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
}

export function ProtectedRoute({ 
  children, 
  fallback, 
  redirectTo = '/auth/login' 
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuthStatus()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo)
    }
  }, [isAuthenticated, isLoading, router, redirectTo])

  if (isLoading) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}

// HOC version for easier component wrapping
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    fallback?: React.ReactNode
    redirectTo?: string
  }
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    )
  }
}
