'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Home,
  TrendingUp,
  Bell,
  Eye,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'

interface SidebarProps {
  collapsed?: boolean
  onToggle?: () => void
}

const navigation = [
  {
    name: 'Home',
    href: '/home',
    icon: Home,
    description: 'Your morning brief',
  },
  {
    name: 'Market',
    href: '/market',
    icon: TrendingUp,
    description: 'Find opportunities',
  },
  {
    name: 'Alerts',
    href: '/alerts',
    icon: Bell,
    description: 'Supply chain news',
  },
  {
    name: 'Watchlist',
    href: '/portfolio',
    icon: Eye,
    description: 'Track your stocks',
  },
]

const secondaryNavigation = [
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
  {
    name: 'Help',
    href: '/help',
    icon: HelpCircle,
  },
]

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-surface border-r border-slate-200 transition-all duration-300',
        collapsed ? 'w-[70px]' : 'w-[260px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-slate-200">
        <Link href="/home" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-teal-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold">G</span>
          </div>
          {!collapsed && (
            <span className="text-lg font-semibold text-primary">Gano Alpha</span>
          )}
        </Link>
        {onToggle && (
          <button
            onClick={onToggle}
            className={cn(
              'ml-auto p-1.5 rounded-lg hover:bg-slate-100 text-secondary transition-transform',
              collapsed && 'rotate-180'
            )}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
                isActive
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-secondary hover:bg-slate-50 hover:text-primary'
              )}
            >
              <item.icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-indigo-600')} />
              {!collapsed && (
                <div className="flex-1">
                  <span className="text-sm font-medium">{item.name}</span>
                  <p className="text-xs text-muted">{item.description}</p>
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Divider */}
      <div className="px-3">
        <div className="border-t border-slate-200" />
      </div>

      {/* Secondary Navigation */}
      <nav className="px-3 py-4 space-y-1">
        {secondaryNavigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-secondary hover:bg-slate-50 hover:text-primary'
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User Section */}
      <div className="p-3 border-t border-slate-200">
        <div
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg',
            collapsed ? 'justify-center' : ''
          )}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-teal-400 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-medium">
              {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'GA'}
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-primary truncate">{user?.name || 'Guest'}</p>
              <p className="text-xs text-muted truncate capitalize">{user?.plan || 'Free'} Plan</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={logout}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-secondary"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}
