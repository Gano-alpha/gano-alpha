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
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const AUTH_STORAGE_KEY = 'gano_auth'
const USERS_STORAGE_KEY = 'gano_users'

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
    // Get stored users
    const usersJson = localStorage.getItem(USERS_STORAGE_KEY)
    const users: Record<string, { password: string; name: string; plan: string }> = usersJson ? JSON.parse(usersJson) : {}

    // Check if user exists
    const storedUser = users[email.toLowerCase()]
    if (!storedUser) {
      return { success: false, error: 'No account found with this email' }
    }

    // Check password (in production, this would be done server-side with proper hashing)
    if (storedUser.password !== password) {
      return { success: false, error: 'Incorrect password' }
    }

    // Create session
    const userData: User = {
      id: email.toLowerCase(),
      email: email.toLowerCase(),
      name: storedUser.name,
      plan: storedUser.plan as 'free' | 'pro' | 'enterprise',
    }

    setUser(userData)
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData))

    return { success: true }
  }

  const signup = async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
    // Get stored users
    const usersJson = localStorage.getItem(USERS_STORAGE_KEY)
    const users: Record<string, { password: string; name: string; plan: string }> = usersJson ? JSON.parse(usersJson) : {}

    // Check if user already exists
    if (users[email.toLowerCase()]) {
      return { success: false, error: 'An account with this email already exists' }
    }

    // Create new user
    users[email.toLowerCase()] = {
      password,
      name,
      plan: 'pro', // Default to pro plan for demo
    }
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))

    // Create session
    const userData: User = {
      id: email.toLowerCase(),
      email: email.toLowerCase(),
      name,
      plan: 'pro',
    }

    setUser(userData)
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData))

    return { success: true }
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
