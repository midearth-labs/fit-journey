import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ url, locals: { supabase } }) => {
  const code = url.searchParams.get('code')
  const inviterCode = url.searchParams.get('inviterCode')
  
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // If there's an inviterCode and the user was successfully authenticated,
      // we need to update their metadata with the inviter code
      if (inviterCode) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          // UUID validation
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
          if (uuidRegex.test(inviterCode)) {
            // Check if user already has a valid inviter_code
            const existingInviterCode = user.user_metadata?.inviter_code
            
            // Only update if no inviter_code exists or if existing one is invalid
            if (!existingInviterCode || !uuidRegex.test(existingInviterCode)) {
              // Preserve existing metadata and add/update inviter_code
              const updatedMetadata = {
                ...user.user_metadata,
                inviter_code: inviterCode
              }
              
              const { error: updateError } = await supabase.auth.updateUser({
                data: updatedMetadata
              })
              
              if (updateError) {
                console.error('Failed to update user metadata with inviter code:', updateError)
              } else {
                console.log('Successfully updated user metadata with inviter code')
              }
            } else {
              console.log('User already has a valid inviter_code, skipping update')
            }
          } else {
            console.log('Invalid inviter code format, skipping update')
          }
        }
      }
      
      throw redirect(303, '/')
    }
  }
  
  throw redirect(303, '/auth/signin?error=auth_callback_error')
}
