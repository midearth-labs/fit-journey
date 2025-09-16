import type { AuthRequestContext } from '$lib/server/shared/interfaces'
import { redirect } from '@sveltejs/kit'

export function tryRequireAuth(locals: App.Locals): AuthRequestContext | null {
  if (locals.session && locals.user) {
    return {
      requestDate: locals.requestDate,
      requestId: locals.requestId,
      user: locals.user,
    }
  } else {
    return null
  }
}
