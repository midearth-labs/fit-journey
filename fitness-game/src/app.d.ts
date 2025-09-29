// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { User, Session, SupabaseClient } from '@supabase/supabase-js'
import type { AuthServices, UnAuthServices } from '$lib/server/services'
import type { IServiceFactory } from '$lib/server/shared/service-factory'

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
			unAuthServices: UnAuthServices | null
			routeType: 'authenticated' | 'unauthenticated' | 'auth_page'
			serviceFactory: IServiceFactory
		}
		interface PageData {
			session: Session | null
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
