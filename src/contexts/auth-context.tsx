'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface User {
  id: string
  email: string
  name: string
  plan: 'free' | 'pro' | 'enterprise'
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signup: () => Promise<{ success: boolean; error?: string }>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const AUTH_STORAGE_KEY = 'gano_auth'
const USERS_STORAGE_KEY = 'gano_users'

// Pre-defined test account - signups are closed
const ALLOWED_USERS: Record<string, { password: string; name: string; plan: string }> = {
  'test@ganoalpha.com': { password: 'GanoAlpha2024!', name: 'Test User', plan: 'pro' },
  'rahul@ganoalpha.com': { password: 'GanoAdmin2024!', name: 'Rahul Dandamudi', plan: 'enterprise' },
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Check for existing session on mount
  useEffect(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY)
    if (stored) {
      try {
        const userData = JSON.parse(stored)
        setUser(userData)
      } catch (e) {
        localStorage.removeItem(AUTH_STORAGE_KEY)
      }
    }
    setLoading(false)
  }, [])

  // Redirect unauthenticated users from protected routes
  useEffect(() => {
    if (loading) return

    const publicRoutes = ['/login', '/signup', '/forgot-password']
    const isPublicRoute = publicRoutes.includes(pathname)

    if (!user && !isPublicRoute) {
      router.push('/login')
    } else if (user && isPublicRoute) {
      router.push('/home')
    }
  }, [user, loading, pathname, router])

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Only allow pre-defined users (signups are closed)
    const allowedUser = ALLOWED_USERS[email.toLowerCase()]
    if (!allowedUser) {
      return { success: false, error: 'Access denied. Signups are currently closed.' }
    }

    // Check password
    if (allowedUser.password !== password) {
      return { success: false, error: 'Incorrect password' }
    }

    // Create session
    const userData: User = {
      id: email.toLowerCase(),
      email: email.toLowerCase(),
      name: allowedUser.name,
      plan: allowedUser.plan as 'free' | 'pro' | 'enterprise',
    }

    setUser(userData)
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData))

    return { success: true }
  }

  const signup = async (): Promise<{ success: boolean; error?: string }> => {
    // Signups are closed - only pre-defined users can access the platform
    return { success: false, error: 'Signups are currently closed. Please contact admin for access.' }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(AUTH_STORAGE_KEY)
    router.push('/login')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
