'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.ganoalpha.com'

export default function EarlyAccessPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [position, setPosition] = useState<number | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE}/waitlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to join waitlist')
      }

      setPosition(data.position)
      setSubmitted(true)
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="space-y-6 text-center">
        <div className="w-12 h-12 bg-teal/10 rounded-full flex items-center justify-center mx-auto">
          <Check className="w-6 h-6 text-teal" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-primary">You&apos;re on the list</h1>
          <p className="text-secondary text-sm">
            
            Thanks for your interest! We&apos;ll be in touch soon.
          </p>
        </div>
        <div className="pt-4">
          <Link
            href="/"
            className="text-sm text-accent hover:underline font-medium"
          >
            Back to home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-primary">Request early access</h1>
        <p className="text-secondary text-sm">
          GanoAlpha is currently in private beta. Join the waitlist.
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
          {loading ? 'Submitting...' : 'Join waitlist'}
        </button>
      </form>

      <div className="text-center pt-2">
        <p className="text-sm text-secondary">
          Already have access?{' '}
          <Link href="/login" className="text-accent hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
