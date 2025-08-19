import { createSupabaseClient } from './supabase'
import { User } from '@/types/auth'

export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

// Client-side auth utilities
export const authClient = {
  async signIn(email: string, password: string) {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) throw new AuthError(error.message)
    return data
  },

  async signUp(email: string, password: string) {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    
    if (error) throw new AuthError(error.message)
    return data
  },

  async signInWithGoogle() {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    
    if (error) throw new AuthError(error.message)
    return data
  },

  async signOut() {
    const supabase = createSupabaseClient()
    const { error } = await supabase.auth.signOut()
    
    if (error) throw new AuthError(error.message)
  },

  async resetPassword(email: string) {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    
    if (error) throw new AuthError(error.message)
    return data
  },

  async updateProfile(updates: Partial<User['user_metadata']>) {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase.auth.updateUser({
      data: updates,
    })
    
    if (error) throw new AuthError(error.message)
    return data
  },

  onAuthStateChange(callback: (user: User | null) => void) {
    const supabase = createSupabaseClient()
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user as User | null)
    })
  },

  async getUser() {
    const supabase = createSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) throw new AuthError(error.message)
    return user as User | null
  },
}

// Note: Server-side utilities are in separate file to avoid client bundling issues
