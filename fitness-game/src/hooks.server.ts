import { createServerClient } from '@supabase/ssr'
import { type Handle, redirect } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'
import { ServiceFactory } from '$lib/server/shared/service-factory'
import type { AuthRequestContext, MaybeAuthRequestContext } from '$lib/server/shared/interfaces'
const PROTECTED_ROUTE_PREFIXES = ['/api/v1/']; // prefix paths
const PROTECTED_ROUTES = ['/protected'] as string[]; //exact paths

// Preload the single instance of ServiceFactory
const serviceFactoryInstance = await ServiceFactory.getInstance();

const requestWrapper: Handle = async ({ event, resolve }) => {
  event.locals.requestDate = new Date();
  event.locals.requestId = crypto.randomUUID();
  return resolve(event);
}

const supabase: Handle = async ({ event, resolve }) => {
  /**
   * Creates a Supabase client specific to this server request.
   *
   * The Supabase client gets the Auth token from the request cookies.
   */
  event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => event.cookies.getAll(),
      /**
       * SvelteKit's cookies API requires `path` to be explicitly set in
       * the cookie options. Setting `path` to `/` replicates previous/
       * standard behavior.
       */
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          event.cookies.set(name, value, { ...options, path: '/' })
        })
      },
    },
  });


  /**
   * Unlike `supabase.auth.getSession()`, which returns the session _without_
   * validating the JWT, this function also calls `getUser()` to validate the
   * JWT before returning the session.
   */
  event.locals.safeGetSession = async () => {
    const {
      data: { session },
    } = await event.locals.supabase.auth.getSession()
    if (!session) {
      return { session: null, user: null }
    }
    const {
      data: { user },
      error,
    } = await event.locals.supabase.auth.getUser()
    if (error) {
      // JWT validation has failed
      return { session: null, user: null }
    }
    return { session, user }
  }


  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      /**
       * Supabase libraries use the `content-range` and `x-supabase-api-version`
       * headers, so we need to tell SvelteKit to pass it through.
       */
      return name === 'content-range' || name === 'x-supabase-api-version'
    },
  })
}

const routeType: Handle = async ({ event, resolve }) => {
  // Protected API routes
  if (PROTECTED_ROUTES.includes(event.url.pathname) || PROTECTED_ROUTE_PREFIXES.some(prefix => event.url.pathname.startsWith(prefix))) {
    event.locals.routeType = 'authenticated'
  }
  else if (event.locals.user && event.url.pathname.startsWith('/auth/')) {
    event.locals.routeType = 'auth_page'
  } else {
    event.locals.routeType = 'unauthenticated'
  }

  return resolve(event)
}

const extractSessionAndUser = async (locals: App.Locals) => {
  const { session, user } = await locals.safeGetSession()
  locals.session = session
  locals.user = user
}

const authGuard: Handle = async ({ event, resolve }) => {
  if (['authenticated', 'auth_page'].includes(event.locals.routeType)) {
    await extractSessionAndUser(event.locals);

    // Redirect authenticated users away from auth pages
    if (event.locals.routeType === 'auth_page' && event.locals.user) {
      throw redirect(303, '/')
    }

    // Protect API routes
    if (event.locals.routeType === 'authenticated' && event.locals.user) {
      const serviceAuthRequestContext: AuthRequestContext = {
        requestDate: event.locals.requestDate,
        requestId: event.locals.requestId,
        user: event.locals.user,
      }
      event.locals.authServices = serviceFactoryInstance.getAuthServices(serviceAuthRequestContext);
  
    } else {
      throw redirect(303, '/auth/signin');
    }
  } else {
    const serviceUnAuthRequestContext: MaybeAuthRequestContext = {
      requestDate: event.locals.requestDate,
      requestId: event.locals.requestId,
      getUserContext: async () => {
        if (event.locals.user === undefined) {
          await extractSessionAndUser(event.locals);
        }
        return event.locals.user || null;
      }
    }
    event.locals.unAuthServices = serviceFactoryInstance.getUnAuthServices(serviceUnAuthRequestContext)
  }

  return resolve(event)
}

export const handle: Handle = sequence(requestWrapper, supabase, routeType, authGuard)
