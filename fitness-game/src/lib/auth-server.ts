import { createSupabaseServerClient } from './supabase-server'
import { User } from '@/types/auth'

// Server-side auth utilities (Next.js App Router server components only)
export const authServer = {
  async getUser() {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) return null
    return user as User | null
  },

  async getSession() {
    const supabase = await createSupabaseServerClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) return null
    return session
  },
}
