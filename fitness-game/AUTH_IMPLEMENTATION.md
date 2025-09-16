# Authentication System Implementation

This document describes the complete authentication system implemented for the FitJourney fitness game application.

## Overview

The authentication system provides:
- **Client-side authentication** with Svelte stores
- **Server-side authentication** with middleware and hooks
- **Protected API routes** with automatic redirects
- **Session management** across client and server
- **Multiple auth methods**: Email/password and Google OAuth

## Architecture

### Client-Side Components

1. **Auth Store** (`src/lib/auth/store.ts`)
   - Svelte store for authentication state
   - Methods: `signIn`, `signUp`, `signInWithGoogle`, `signOut`, `resetPassword`, `updateProfile`
   - Automatic session management and profile loading

2. **Supabase Client** (`src/lib/auth/supabase.ts`)
   - Browser and server-side Supabase clients
   - Admin client for server operations

3. **Auth Types** (`src/lib/auth/types.ts`)
   - TypeScript interfaces for auth state and context
   - Extends the existing `AuthRequestContext` interface

### Server-Side Components

1. **Auth Middleware** (`src/lib/server/auth/middleware.ts`)
   - `getAuthContext()` - Get current user context
   - `requireAuth()` - Require authentication (throws if not authenticated)
   - `isProtectedRoute()` - Check if route requires authentication

2. **Server Hooks** (`src/hooks.server.ts`)
   - Automatic authentication on all requests
   - Redirects for protected routes
   - Redirects authenticated users away from auth pages

3. **Protected API Routes** (`src/routes/api/v1/user/profile/+server.ts`)
   - Example protected API endpoint
   - Uses `requireAuth()` middleware
   - Returns user profile data

### UI Components

1. **SignInForm** (`src/lib/components/auth/SignInForm.svelte`)
   - Email/password sign in
   - Google OAuth integration
   - Error handling and loading states

2. **SignUpForm** (`src/lib/components/auth/SignUpForm.svelte`)
   - User registration
   - Password confirmation
   - Google OAuth integration

3. **Auth Pages**
   - `/auth/signin` - Sign in page
   - `/auth/signup` - Sign up page
   - `/auth/reset-password` - Password reset page
   - `/auth/callback` - OAuth callback handler

## Usage

### Environment Setup

1. Copy `env.template` to `.env` and fill in your Supabase credentials:
   ```
   PUBLIC_SUPABASE_URL=your_supabase_url
   PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

2. Configure Google OAuth in your Supabase dashboard

### Client-Side Usage

```typescript
import { authStore, authContext } from '$lib/auth/store'

// Check authentication state
$authStore.user // Supabase user object or null
$authStore.loading // boolean
$authStore.error // string or null

// Sign in
await authContext.signIn('user@example.com', 'password')

// Sign up
await authContext.signUp('user@example.com', 'password')

// Sign out
await authContext.signOut()

// Reset password
await authContext.resetPassword('user@example.com')
```

### Server-Side Usage

```typescript
import { getAuthContext, requireAuth } from '$lib/server/auth/middleware'

// In a page load function
export const load: PageServerLoad = async ({ locals }) => {
  // Check if user is authenticated
  if (!locals.user) {
    throw redirect(303, '/auth/signin')
  }
  
  return { user: locals.user }
}

// In an API route
export const GET: RequestHandler = async (event) => {
  const authContext = await requireAuth(event)
  // authContext.userId contains the authenticated user's ID
}
```

### Protected Routes

Routes starting with `/api/v1/` are automatically protected. Unauthenticated users are redirected to `/auth/signin`.

## Integration with Existing System

The authentication system integrates seamlessly with the existing fitness game:

1. **User Schema**: Uses the existing `users` table from `src/lib/server/db/schema.ts`
2. **AuthRequestContext**: Extends the existing interface in `src/lib/server/shared/interfaces.ts`
3. **Repository Pattern**: Works with existing user repositories
4. **Layout Integration**: Auth state is displayed in the main navigation

## Security Features

1. **Server-side validation**: All protected routes validate authentication server-side
2. **Automatic redirects**: Unauthenticated users are redirected to sign-in
3. **Session management**: Secure cookie-based session handling
4. **CSRF protection**: Built into Supabase SSR package
5. **OAuth security**: Secure Google OAuth integration

## Testing

1. **Protected Route**: Visit `/protected` to test authentication
2. **API Endpoint**: Test `/api/v1/user/profile` for protected API access
3. **Auth Flow**: Test sign-in, sign-up, and sign-out flows

## Next Steps

1. **User Profile Management**: Implement profile editing UI
2. **Role-based Access**: Add user roles and permissions
3. **Email Verification**: Implement email verification flow
4. **Password Reset**: Complete password reset flow
5. **Social Login**: Add more OAuth providers (Facebook, GitHub, etc.)

## Files Created/Modified

### New Files
- `src/lib/auth/supabase.ts` - Supabase client configuration
- `src/lib/server/auth/middleware.ts` - Server auth middleware
- `src/routes/auth/callback/+page.server.ts` - OAuth callback handler
- `src/lib/components/auth/SignInForm.svelte` - Sign in component
- `src/lib/components/auth/SignUpForm.svelte` - Sign up component
- `src/routes/auth/signin/+page.svelte` - Sign in page
- `src/routes/auth/signup/+page.svelte` - Sign up page
- `src/routes/auth/reset-password/+page.svelte` - Password reset page
- `src/routes/protected/+page.server.ts` - Protected page example (@TODO: remove these later)
- `src/routes/protected/+page.svelte` - Protected page UI
- `src/hooks.server.ts` - Server hooks for auth

### Modified Files
- `src/routes/+layout.svelte` - Added auth integration to navigation
- `src/app.d.ts` - Added auth types to App namespace

The authentication system is now fully implemented and ready for use!
