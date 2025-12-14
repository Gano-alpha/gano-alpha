'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'

// Backend API URL
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

interface User {
  user_id: string
  email: string
  name: string
  role: string
  plan: 'free' | 'pro' | 'enterprise'
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  isAuthenticated: boolean
  getAccessToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Store access token in memory (not localStorage - XSS protection)
let accessToken: string | null = null
let tokenExpiry: number = 0

// Helper to read cookies
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? match[2] : null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Try to restore session on mount by checking if we have a valid refresh token
  useEffect(() => {
    const restoreSession = async () => {
      try {
        // Try to refresh - if we have a valid refresh token cookie, this will work
        const csrfToken = getCookie('csrf_token')
        if (!csrfToken) {
          setLoading(false)
          return
        }

        const res = await fetch(`${BACKEND_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'X-CSRF-Token': csrfToken },
        })

        if (res.ok) {
          const data = await res.json()
          accessToken = data.access_token
          tokenExpiry = Date.now() + (data.expires_in * 1000)

          // Fetch user info
          const meRes = await fetch(`${BACKEND_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${accessToken}` },
          })

          if (meRes.ok) {
            const userData = await meRes.json()
            setUser({
              user_id: userData.user_id,
              email: userData.email,
              name: userData.name,
              role: userData.role,
              plan: userData.plan as 'free' | 'pro' | 'enterprise',
            })
          }
        }
      } catch (e) {
        console.error('Failed to restore session:', e)
      } finally {
        setLoading(false)
      }
    }

    restoreSession()
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

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`${BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // CRITICAL: Send/receive cookies
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        const error = await res.json()
        return { success: false, error: error.detail || 'Login failed' }
      }

      const data = await res.json()
      accessToken = data.access_token
      tokenExpiry = Date.now() + (data.expires_in * 1000)

      setUser({
        user_id: data.user.user_id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
        plan: data.user.plan as 'free' | 'pro' | 'enterprise',
      })

      return { success: true }
    } catch (e) {
      console.error('Login error:', e)
      return { success: false, error: 'Network error. Please try again.' }
    }
  }, [])

  const signup = useCallback(async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`${BACKEND_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, name }),
      })

      if (!res.ok) {
        const error = await res.json()
        return { success: false, error: error.detail || 'Signup failed' }
      }

      return { success: true }
    } catch (e) {
      console.error('Signup error:', e)
      return { success: false, error: 'Network error. Please try again.' }
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      const csrfToken = getCookie('csrf_token')
      await fetch(`${BACKEND_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-CSRF-Token': csrfToken || '' },
      })
    } catch (e) {
      console.error('Logout error:', e)
    } finally {
      accessToken = null
      tokenExpiry = 0
      setUser(null)
      router.push('/login')
    }
  }, [router])

  // Auto-refresh access token when expired
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    // Check if current token is still valid (with 1 min buffer)
    if (accessToken && Date.now() < tokenExpiry - 60000) {
      return accessToken
    }

    // Need to refresh
    try {
      const csrfToken = getCookie('csrf_token')
      if (!csrfToken) {
        // No CSRF token means not logged in
        return null
      }

      const res = await fetch(`${BACKEND_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-CSRF-Token': csrfToken },
      })

      if (!res.ok) {
        // Refresh failed - force re-login
        accessToken = null
        tokenExpiry = 0
        setUser(null)
        return null
      }

      const data = await res.json()
      accessToken = data.access_token
      tokenExpiry = Date.now() + (data.expires_in * 1000)
      return accessToken
    } catch (e) {
      console.error('Token refresh error:', e)
      accessToken = null
      tokenExpiry = 0
      setUser(null)
      return null
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
        getAccessToken,
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

/**
 * Hook for making authenticated API calls.
 * Automatically handles token refresh and 401 responses.
 */
export function useAuthenticatedFetch() {
  const { getAccessToken, logout } = useAuth()

  return useCallback(async (url: string, options: RequestInit = {}): Promise<Response> => {
    const token = await getAccessToken()
    if (!token) {
      logout()
      throw new Error('Not authenticated')
    }

    const res = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
      },
    })

    if (res.status === 401) {
      logout()
      throw new Error('Session expired')
    }

    return res
  }, [getAccessToken, logout])
}
