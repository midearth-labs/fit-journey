import { fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ url }) => {
  const inviterCode = url.searchParams.get('inviterCode')
  const fromAssessment = url.searchParams.get('fromAssessment') === '1'
  return { 
    inviterCode,
    fromAssessment
  }
}

export const actions: Actions = {
  signup: async ({ request, locals: { supabase } }) => {
    const form = await request.formData()
    const email = String(form.get('email') || '').trim()
    const password = String(form.get('password') || '').trim()
    const confirmPassword = String(form.get('confirmPassword') || '').trim()
    const displayName = String(form.get('displayName') || '').trim()
    const inviterCode = String(form.get('inviterCode') || '').trim()
    const learningPaths = String(form.get('learningPaths') || '').trim()

    if (!email || !password || !confirmPassword) return fail(400, { error: 'Please fill in all fields' })
    if (password !== confirmPassword) return fail(400, { error: 'Passwords do not match' })
    // @TODO: Do a more comprehensive password check or maybe just leave it to supabase
    if (password.length < 6) return fail(400, { error: 'Password must be at least 6 characters' })

    if (inviterCode && !validateInviterCode(inviterCode)) return fail(400, { error: 'Invalid inviter code format' })

    const metadata: Record<string, any> = {}
    if (displayName) metadata.name = displayName
    if (inviterCode) metadata.inviter_code = inviterCode
    if (learningPaths) metadata.learning_paths = learningPaths.split(',')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata }
    })
    if (error) return fail(400, { error: error.message })

    throw redirect(303, '/')
  },

  oauthGoogle: async ({ url, request, locals: { supabase } }) => {
    const form = await request.formData()
    const inviterCode = String(form.get('inviterCode') || '').trim()
    const learningPaths = String(form.get('learningPaths') || '').trim()

    if (inviterCode && !validateInviterCode(inviterCode)) return fail(400, { error: 'Invalid inviter code format' })

    const redirectUrl = new URL('/auth/callback', url.origin)
    if (inviterCode) redirectUrl.searchParams.set('inviterCode', inviterCode)
    if (learningPaths) redirectUrl.searchParams.set('learningPaths', learningPaths)

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectUrl.toString() }
    })
    if (error) throw redirect(303, '/auth/signup?error=oauth_init_failed')
    throw redirect(303, data.url)
  }
}

const validateInviterCode = (inviterCode: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(inviterCode)
}