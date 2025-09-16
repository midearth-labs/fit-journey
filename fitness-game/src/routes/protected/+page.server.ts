import type { PageServerLoad } from './$types'
import { requireAuth } from '$lib/server/auth/middleware'

export const load: PageServerLoad = async ({ locals }) => {
  const authContext = await requireAuth(locals)
  return {
    user: authContext.user
  }
}
