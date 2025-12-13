'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, iconPosition = 'left', error, ...props }, ref) => {
    return (
      <div className="relative">
        {icon && iconPosition === 'left' && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="text-muted">{icon}</span>
          </div>
        )}
        <input
          type={type}
          className={cn(
            'flex h-10 w-full rounded-lg border border-slate-200 bg-surface px-4 py-2 text-sm text-primary',
            'placeholder:text-muted',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-all duration-200',
            icon && iconPosition === 'left' && 'pl-10',
            icon && iconPosition === 'right' && 'pr-10',
            error && 'border-sell focus:border-sell focus:ring-sell/20',
            className
          )}
          ref={ref}
          {...props}
        />
        {icon && iconPosition === 'right' && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <span className="text-muted">{icon}</span>
          </div>
        )}
        {error && (
          <p className="mt-1.5 text-xs text-sell">{error}</p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }
