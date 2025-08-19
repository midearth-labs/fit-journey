'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { AuthContextType, AuthState, User } from '@/types/auth'
import { authClient, AuthError } from '@/lib/auth'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  })

  const setLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, loading }))
  }

  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error }))
  }

  const setUser = (user: User | null) => {
    setState(prev => ({ ...prev, user, loading: false }))
  }

  // Initialize auth state
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        const user = await authClient.getUser()
        if (mounted) {
          setUser(user)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        if (mounted) {
          setState({ user: null, loading: false, error: null })
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = authClient.onAuthStateChange((user) => {
      if (mounted) {
        setUser(user)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const handleAuthAction = async (action: () => Promise<any>) => {
    try {
      setLoading(true)
      setError(null)
      await action()
    } catch (error) {
      const message = error instanceof AuthError 
        ? error.message 
        : 'An unexpected error occurred'
      setError(message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    await handleAuthAction(() => authClient.signIn(email, password))
  }

  const signUp = async (email: string, password: string) => {
    await handleAuthAction(() => authClient.signUp(email, password))
  }

  const signInWithGoogle = async () => {
    await handleAuthAction(() => authClient.signInWithGoogle())
  }

  const signOut = async () => {
    await handleAuthAction(() => authClient.signOut())
  }

  const resetPassword = async (email: string) => {
    await handleAuthAction(() => authClient.resetPassword(email))
  }

  const updateProfile = async (data: Partial<User['user_metadata']>) => {
    await handleAuthAction(() => authClient.updateProfile(data))
  }

  const value: AuthContextType = {
    ...state,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
    updateProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
