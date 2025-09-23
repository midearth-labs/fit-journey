import { fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  return {}
}

export const actions: Actions = {
  signin: async ({ request, locals: { supabase } }) => {
    const form = await request.formData()
    const email = String(form.get('email') || '').trim()
    const password = String(form.get('password') || '').trim()

    if (!email || !password) return fail(400, { error: 'Missing credentials' })

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return fail(400, { error: error.message })

    throw redirect(303, '/')
  },

  oauthGoogle: async ({ url, locals: { supabase } }) => {
    const redirectTo = `${url.origin}/auth/callback`
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo }
    })
    if (error) throw redirect(303, '/auth/signin?error=oauth_init_failed')
    throw redirect(303, data.url)
  },
}


