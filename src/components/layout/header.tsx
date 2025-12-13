'use client'

import { useState } from 'react'
import { Search, Bell, Command } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  title?: string
  subtitle?: string
}

export function Header({ title, subtitle }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-6 bg-surface/80 backdrop-blur-sm border-b border-slate-200">
      {/* Left - Title */}
      <div>
        {title && (
          <h1 className="text-xl font-semibold text-primary">{title}</h1>
        )}
        {subtitle && (
          <p className="text-sm text-secondary">{subtitle}</p>
        )}
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-3">
        {/* Global Search */}
        <div className="relative hidden md:block">
          <Input
            type="text"
            placeholder="Search stocks, sectors..."
            className="w-64 pl-10 pr-12"
            icon={<Search className="h-4 w-4" />}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-muted">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 font-mono">⌘</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 font-mono">K</kbd>
          </div>
        </div>

        {/* Mobile Search Button */}
        <Button variant="ghost" size="icon-sm" className="md:hidden">
          <Search className="h-4 w-4" />
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon-sm" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-sell text-white text-[10px] font-medium rounded-full flex items-center justify-center">
            3
          </span>
        </Button>

        {/* Upgrade CTA (for free users) */}
        <Button size="sm" className="hidden sm:flex">
          Upgrade to Pro
        </Button>
      </div>
    </header>
  )
}
