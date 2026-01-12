'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // For now, just show success - actual password reset requires backend implementation
      // In production, this would call: POST /auth/forgot-password
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      setSubmitted(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-primary">Check your email</h1>
          <p className="text-secondary text-sm">
            If an account exists for {email}, you will receive a password reset link shortly.
          </p>
        </div>

        <div className="text-center pt-4">
          <Link
            href="/login"
            className="text-sm text-accent hover:underline font-medium"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-primary">Reset password</h1>
        <p className="text-secondary text-sm">
          Enter your email address and we will send you a link to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-sm text-secondary">Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-background border border-border text-primary px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm placeholder:text-muted transition-all"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent hover:bg-accent/90 text-white font-medium h-12 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Sending...' : 'Send reset link'}
        </button>
      </form>

      <div className="text-center pt-2">
        <Link
          href="/login"
          className="text-sm text-muted hover:text-secondary transition-colors"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  )
}
