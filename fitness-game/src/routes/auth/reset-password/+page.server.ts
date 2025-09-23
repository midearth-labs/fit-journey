import type { Actions, PageServerLoad } from './$types'
import { fail } from '@sveltejs/kit'

export const load: PageServerLoad = async () => {
  return {}
}

export const actions: Actions = {
  resetPassword: async ({ request, url, locals: { supabase } }) => {
    const form = await request.formData()
    const email = String(form.get('email') || '').trim()
    if (!email) return fail(400, { error: 'Please enter your email address' })

    const redirectTo = `${url.origin}/auth/reset-password`
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    if (error) return fail(400, { error: error.message })

    return { success: true }
  },
}


