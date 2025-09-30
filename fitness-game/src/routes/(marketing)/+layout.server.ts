import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ locals: { session, user } }) => {
  return { session, user }
}
