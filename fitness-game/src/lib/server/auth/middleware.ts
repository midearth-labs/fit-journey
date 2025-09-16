import type { AuthRequestContext } from '$lib/server/shared/interfaces'
import { redirect } from '@sveltejs/kit'

export async function requireAuth(locals: App.Locals): Promise<AuthRequestContext> {
  if (locals.session && locals.user) {
    return {
      requestDate: locals.requestDate,
      requestId: locals.requestId,
      user: locals.user,
    }
  } else {
    throw redirect(303, '/auth/signin')
  }
}
