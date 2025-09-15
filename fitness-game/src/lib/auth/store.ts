import { writable } from 'svelte/store'
import { createClient } from './supabase'
import type { AuthState, AuthContextType } from './types'
// @TODO: should we do this, decouple the database schema from the auth store?
import type { User } from '$lib/server/db/schema'

// Note: This store is now primarily for backward compatibility
// The main auth state is managed through the layout and session
const supabase = createClient()

// Initial state
const initialState: AuthState = {
  user: null,
  profile: null,
  loading: true,
  error: null
}

// Create the auth store
export const authStore = writable<AuthState>(initialState)

// Auth context implementation
export const authContext: AuthContextType = {
  ...initialState,
  
  async signIn(email: string, password: string) {
    authStore.update(state => ({ ...state, loading: true, error: null }))
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) throw error
      
      authStore.update(state => ({ 
        ...state, 
        user: data.user, 
        loading: false 
      }))
      
      // Load user profile
      await this.loadProfile()
    } catch (error: any) {
      authStore.update(state => ({ 
        ...state, 
        loading: false, 
        error: error.message 
      }))
      throw error
    }
  },

  async signUp(email: string, password: string) {
    authStore.update(state => ({ ...state, loading: true, error: null }))
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      })
      
      if (error) throw error
      
      authStore.update(state => ({ 
        ...state, 
        user: data.user, 
        loading: false 
      }))
      
      // Load user profile
      await this.loadProfile()
    } catch (error: any) {
      authStore.update(state => ({ 
        ...state, 
        loading: false, 
        error: error.message 
      }))
      throw error
    }
  },

  async signInWithGoogle() {
    authStore.update(state => ({ ...state, loading: true, error: null }))
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) throw error
    } catch (error: any) {
      authStore.update(state => ({ 
        ...state, 
        loading: false, 
        error: error.message 
      }))
      throw error
    }
  },

  async signOut() {
    authStore.update(state => ({ ...state, loading: true, error: null }))
    
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) throw error
      
      authStore.update(state => ({ 
        ...state, 
        user: null, 
        profile: null, 
        loading: false 
      }))
    } catch (error: any) {
      authStore.update(state => ({ 
        ...state, 
        loading: false, 
        error: error.message 
      }))
      throw error
    }
  },

  async resetPassword(email: string) {
    authStore.update(state => ({ ...state, loading: true, error: null }))
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })
      
      if (error) throw error
      
      authStore.update(state => ({ ...state, loading: false }))
    } catch (error: any) {
      authStore.update(state => ({ 
        ...state, 
        loading: false, 
        error: error.message 
      }))
      throw error
    }
  },

  async loadProfile() {
    console.log('loadProfile');
    /*const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      // Fetch user profile from your API
      try {
        const response = await fetch('/api/v1/user/profile', {
          headers: {
            'Authorization': `Bearer ${user.access_token}`
          }
        })
        
        if (response.ok) {
          const profile = await response.json()
          authStore.update(state => ({ ...state, profile }))
        }
      } catch (error) {
        console.error('Failed to load user profile:', error)
      }
    }*/
  }
}

// Initialize auth state
export async function initializeAuth() {
  authStore.update(state => ({ ...state, loading: true }))
  
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session?.user) {
      authStore.update(state => ({ 
        ...state, 
        user: session.user, 
        loading: false 
      }))
      
      // Load user profile
      await authContext.loadProfile()
    } else {
      authStore.update(state => ({ ...state, loading: false }))
    }
  } catch (error) {
    authStore.update(state => ({ 
      ...state, 
      loading: false, 
      error: 'Failed to initialize auth' 
    }))
  }
}

// Listen for auth changes
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' && session?.user) {
    authStore.update(state => ({ 
      ...state, 
      user: session.user, 
      loading: false 
    }))
    await authContext.loadProfile()
  } else if (event === 'SIGNED_OUT') {
    authStore.update(state => ({ 
      ...state, 
      user: null, 
      profile: null, 
      loading: false 
    }))
  }
})
