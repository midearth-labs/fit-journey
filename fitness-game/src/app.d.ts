// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { User, Session, SupabaseClient } from '@supabase/supabase-js'
import type { AuthServices } from '$lib/server/services'

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			supabase: SupabaseClient
			requestDate: Date; // the timestamp/instant of the incoming request
  			requestId: string; // the requestId UUID of the request
			safeGetSession: () => Promise<{ session: Session | null; user: User | null }>
			session: Session | null
			user: User | null
			authServices: AuthServices | null
		}
		interface PageData {
			session: Session | null
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
