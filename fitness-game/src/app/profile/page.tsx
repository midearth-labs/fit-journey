import { redirect } from 'next/navigation'
import { authServer } from '@/lib/auth-server'

export default async function ProfilePage() {
  const user = await authServer.getUser()

  if (!user) {
    redirect('/auth/login?redirectTo=/profile')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Your Profile
          </h1>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h2 className="font-semibold text-blue-800 mb-2">Account Information</h2>
              <div className="text-blue-700 space-y-1">
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>User ID:</strong> {user.id}</p>
                <p><strong>Created:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
                {user.user_metadata?.full_name && (
                  <p><strong>Name:</strong> {user.user_metadata.full_name}</p>
                )}
                {user.user_metadata?.provider && (
                  <p><strong>Sign-in Provider:</strong> {user.user_metadata.provider}</p>
                )}
              </div>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h2 className="font-semibold text-green-800 mb-2">Server-side Rendered</h2>
              <p className="text-green-700">
                ✅ This page was rendered on the server with your authenticated user data.
                This demonstrates server-side authentication working correctly.
              </p>
            </div>

            <div className="flex gap-4">
              <a
                href="/demo"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                View Client Demo
              </a>
              <a
                href="/"
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Back to Home
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
