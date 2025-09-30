import type { PageServerLoad } from './$types'
//@TODO: DELETE
export const load: PageServerLoad = async ({ locals }) => {
  return {
    user: locals.user!,
  }
}
