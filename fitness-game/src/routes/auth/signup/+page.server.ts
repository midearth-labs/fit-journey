import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ url }) => {
  const inviterCode = url.searchParams.get('inviterCode')
  
  return {
    inviterCode
  }
}
