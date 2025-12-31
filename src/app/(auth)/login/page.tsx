'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await login(email, password)
      if (result.success) {
        router.push('/chat')
      } else {
        setError(result.error || 'Invalid email or password')
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-primary">Welcome back</h1>
        <p className="text-secondary text-sm">Enter your credentials to continue.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
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

          <div className="space-y-1.5">
            <label className="text-sm text-secondary">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-background border border-border text-primary px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm placeholder:text-muted transition-all"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent hover:bg-accent/90 text-white font-medium h-12 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <div className="text-center space-y-3 pt-2">
        <Link
          href="/forgot-password"
          className="text-sm text-muted hover:text-secondary transition-colors"
        >
          Forgot password?
        </Link>

        <p className="text-sm text-secondary">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-accent hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
