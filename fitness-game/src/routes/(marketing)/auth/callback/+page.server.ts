import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ url, locals: { supabase, serviceFactory } }) => {
  const code = url.searchParams.get('code')
  const inviterCode = url.searchParams.get('inviterCode')
  const learningPaths = url.searchParams.get('learningPaths')
  
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // If there's an inviterCode or learningPaths and the user was successfully authenticated,
      // we need to update their metadata
      if (inviterCode || learningPaths) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const updatedMetadata = { ...user.user_metadata }
          let doUpdate: boolean = false
          // Handle inviter code
          if (inviterCode) {
            // UUID validation
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
            if (uuidRegex.test(inviterCode)) {
              // Check if user already has a valid inviter_code
              const existingInviterCode = user.user_metadata?.inviter_code
              
              // Only update if no inviter_code exists
              if (!existingInviterCode) {
                updatedMetadata.inviter_code = inviterCode
                doUpdate = true
                console.log('Will update user metadata with inviter code: ', inviterCode)
              } else {
                console.warn('User already has a valid inviter_code, skipping update')
              }
            } else {
              console.log('Invalid inviter code format, skipping update')
            }
          }
          
          // Handle learning paths
          if (learningPaths) {
            const helper = serviceFactory.getLearningPathHelper()
            const validPaths = helper.filterValidLearningPaths(learningPaths.split(','))
            if (validPaths) {
              updatedMetadata.learning_paths = validPaths
              doUpdate = true
              console.log('Will update user metadata with validated learning paths:', updatedMetadata.learning_paths)
            } else {
              console.log('No valid learning paths found in callback, skipping update for learning paths')
            }
          }
          
          if (doUpdate) {
            const { error: updateError } = await supabase.auth.updateUser({
              data: updatedMetadata
            })

            if (updateError) {
              console.error('Failed to update user metadata: ', updateError)
            } else {
              console.info('Successfully updated user metadata')
            }
          } else {
            console.info('No updates to user metadata')
          }
          
        }
      }
      
      throw redirect(303, '/')
    }
  }
  
  throw redirect(303, '/auth/signin?error=auth_callback_error')
}
