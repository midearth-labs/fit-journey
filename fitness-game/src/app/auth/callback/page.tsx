'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const supabase = createSupabaseClient()
      
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          router.push('/auth/login?error=callback_error')
          return
        }

        if (data.session) {
          // Successful authentication
          router.push('/')
        } else {
          // No session found
          router.push('/auth/login')
        }
      } catch (error) {
        console.error('Unexpected auth callback error:', error)
        router.push('/auth/login?error=unexpected_error')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-lg font-medium text-gray-900">Completing sign in...</h2>
        <p className="text-gray-600 mt-2">Please wait while we redirect you.</p>
      </div>
    </div>
  )
}
