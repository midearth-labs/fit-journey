import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { User } from '$lib/server/db/schema'

export interface AuthState {
  user: SupabaseUser | null
  profile: User | null
  loading: boolean
  error: string | null
}

export interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  loadProfile: () => Promise<void>
}

export interface AuthRequestContext {
  requestDate: Date
  userId: string
  user: SupabaseUser
}
