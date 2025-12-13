'use client'

import Link from 'next/link'
import { Lock, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function SignupPage() {
  return (
    <div className="space-y-8">
      {/* Mobile logo */}
      <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-teal-500 flex items-center justify-center">
          <span className="text-white font-bold text-lg">G</span>
        </div>
        <span className="text-primary text-xl font-semibold">Gano Alpha</span>
      </div>

      {/* Header */}
      <div className="space-y-2 text-center lg:text-left">
        <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
          <div className="p-3 rounded-full bg-warning/10">
            <Lock className="h-6 w-6 text-warning" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-primary">Signups Closed</h1>
        <p className="text-secondary">
          Access to Gano Alpha is currently invite-only. We&apos;re in private beta.
        </p>
      </div>

      {/* Info box */}
      <div className="p-4 rounded-lg bg-surface border border-slate-200 space-y-3">
        <p className="text-sm text-secondary">
          If you&apos;ve been given access credentials, please use the login page to sign in.
        </p>
        <p className="text-sm text-secondary">
          For access requests, please contact{' '}
          <a href="mailto:rahul@ganoalpha.com" className="text-indigo-600 hover:underline">
            rahul@ganoalpha.com
          </a>
        </p>
      </div>

      {/* Login button */}
      <Button asChild className="w-full" size="lg">
        <Link href="/login">
          Go to Login
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>

      {/* Back link */}
      <p className="text-center text-sm text-secondary">
        Already have credentials?{' '}
        <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-700">
          Sign in here
        </Link>
      </p>
    </div>
  )
}
