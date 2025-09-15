import { json } from '@sveltejs/kit'
import { UserRepository } from '$lib/server/repositories/user.repository'
import { UserProfileRepository } from '$lib/server/repositories/user-profile.repository'
import { db } from '$lib/server/db'
import type { RequestHandler } from './$types'

const userRepository = new UserRepository(db)
const userProfileRepository = new UserProfileRepository(db)

export const GET: RequestHandler = async ({ locals: { safeGetSession } }) => {
  try {
    const { session, user } = await safeGetSession()
    
    if (!session || !user) {
      return json({ error: 'Authentication required' }, { status: 401 })
    }
    
    // Get user profile=
    const userData = await userRepository.findById(user.id)
    const profile = await userProfileRepository.findById(user.id)
    
    if (!userData) {
      return json({ error: 'User not found' }, { status: 404 })
    }
    
    return json({
      ...userData,
      profile
    })
  } catch (error: any) {
    console.error(error);
    return json({ error: error.message }, { status: 401 })
  }
}

export const PUT: RequestHandler = async ({ request, locals: { safeGetSession } }) => {
  try {
    const { session, user } = await safeGetSession()
    
    if (!session || !user) {
      return json({ error: 'Authentication required' }, { status: 401 })
    }
    
    const updates = await request.json()
    
    // Update user profile
    const updatedUser = await userRepository.update(user.id, updates)
    
    if (!updatedUser) {
      return json({ error: 'Failed to update profile' }, { status: 400 })
    }
    
    return json(updatedUser)
  } catch (error: any) {
    return json({ error: error.message }, { status: 400 })
  }
}
