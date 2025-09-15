import { createServerSupabaseClient } from '$lib/auth/supabase'
import type { AuthRequestContext } from '$lib/server/shared/interfaces'
import type { RequestEvent } from '@sveltejs/kit'

export async function getAuthContext(event: RequestEvent): Promise<AuthRequestContext | null> {
  const supabase = createServerSupabaseClient(event.cookies)
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }
    
    return {
      requestDate: new Date(),
      userId: user.id,
      user
    }
  } catch (error) {
    console.error('Auth middleware error:', error)
    return null
  }
}

export async function requireAuth(event: RequestEvent): Promise<AuthRequestContext> {
  const authContext = await getAuthContext(event)
  
  if (!authContext) {
    throw new Error('Authentication required')
  }
  
  return authContext
}

export function isProtectedRoute(pathname: string): boolean {
  return pathname.startsWith('/api/v1/')
}
