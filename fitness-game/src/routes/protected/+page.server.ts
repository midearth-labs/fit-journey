import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals: { safeGetSession } }) => {
  const { session, user } = await safeGetSession()
  
  if (!session) {
    throw redirect(303, '/auth/signin')
  }
  
  return {
    user
  }
}
