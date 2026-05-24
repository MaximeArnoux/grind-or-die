import { cn } from '@/lib/utils'
import type { HTMLAttributes } from 'react'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'positive' | 'negative' | 'bonus' | 'neutral' | 'violet'
}

export function Badge({ className, variant = 'neutral', children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
        {
          'bg-green-500/15 text-green-400 border border-green-500/20': variant === 'positive',
          'bg-red-500/15 text-red-400 border border-red-500/20': variant === 'negative',
          'bg-blue-500/15 text-blue-400 border border-blue-500/20': variant === 'bonus',
          'bg-gray-800 text-gray-400 border border-gray-700': variant === 'neutral',
          'bg-violet-500/15 text-violet-400 border border-violet-500/20': variant === 'violet',
        },
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
