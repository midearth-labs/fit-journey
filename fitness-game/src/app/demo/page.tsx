'use client'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { useAuth } from '@/lib/hooks/use-auth'

function DemoContent() {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            🎉 Welcome to the Protected Demo Page!
          </h1>
          
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h2 className="font-semibold text-green-800 mb-2">Authentication Status</h2>
              <p className="text-green-700">✅ You are successfully authenticated!</p>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h2 className="font-semibold text-blue-800 mb-2">User Information</h2>
              <div className="text-blue-700 space-y-1">
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>User ID:</strong> {user?.id}</p>
                <p><strong>Created:</strong> {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</p>
                {user?.user_metadata?.full_name && (
                  <p><strong>Name:</strong> {user.user_metadata.full_name}</p>
                )}
                {user?.user_metadata?.provider && (
                  <p><strong>Provider:</strong> {user.user_metadata.provider}</p>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => signOut()}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Sign Out
              </button>
              <a
                href="/"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
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

export default function DemoPage() {
  return (
    <ProtectedRoute
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-lg font-medium text-gray-900">Loading...</h2>
            <p className="text-gray-600 mt-2">Checking authentication status</p>
          </div>
        </div>
      }
    >
      <DemoContent />
    </ProtectedRoute>
  )
}
