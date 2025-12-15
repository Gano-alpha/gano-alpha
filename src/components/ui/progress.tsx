import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, ...props }, ref) => {
    const clamped = Math.min(Math.max(value, 0), 100)
    return (
      <div
        ref={ref}
        className={cn(
          'h-2 w-full overflow-hidden rounded-full bg-slate-100',
          className
        )}
        {...props}
      >
        <div
          className="h-full bg-indigo-500 transition-all"
          style={{ width: `${clamped}%` }}
        />
      </div>
    )
  }
)

Progress.displayName = 'Progress'
