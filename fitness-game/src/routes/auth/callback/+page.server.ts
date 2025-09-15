import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ url, locals: { supabase } }) => {
  const code = url.searchParams.get('code')
  
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      throw redirect(303, '/')
    }
  }
  
  throw redirect(303, '/auth/signin?error=auth_callback_error')
}
