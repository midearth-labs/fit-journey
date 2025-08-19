export interface User {
  id: string
  email: string
  user_metadata?: {
    full_name?: string
    avatar_url?: string
    provider?: string
  }
  app_metadata?: {
    provider?: string
    providers?: string[]
  }
  created_at: string
  updated_at: string
}

export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

export interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateProfile: (data: Partial<User['user_metadata']>) => Promise<void>
}
