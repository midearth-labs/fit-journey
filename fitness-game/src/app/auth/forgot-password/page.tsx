'use client'

import { useState } from 'react'
import { useAuthForm } from '@/lib/hooks/use-auth'

export default function ForgotPasswordPage() {
  const { resetPassword, error, handleSubmit, isSubmitting } = useAuthForm()
  const [email, setEmail] = useState('')
  const [isEmailSent, setIsEmailSent] = useState(false)

  const handleResetPassword = () => handleSubmit(async () => {
    await resetPassword(email)
    setIsEmailSent(true)
  })

  if (isEmailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mt-6 text-2xl font-bold text-gray-900">Check your email</h2>
            <p className="mt-2 text-gray-600">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="text-center text-sm text-gray-600">
              <p>Didn't receive the email? Check your spam folder or</p>
              <button
                onClick={() => setIsEmailSent(false)}
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                try again with a different email
              </button>
            </div>
            
            <div className="text-center">
              <a
                href="/auth/login"
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                ← Back to sign in
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Reset your password</h2>
          <p className="text-gray-600 mt-2">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-300 rounded">
            {error}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleResetPassword()
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your email"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !email}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isSubmitting ? 'Sending...' : 'Send reset link'}
          </button>
        </form>

        <div className="text-center">
          <a
            href="/auth/login"
            className="text-blue-600 hover:text-blue-500 font-medium"
          >
            ← Back to sign in
          </a>
        </div>
      </div>
    </div>
  )
}
