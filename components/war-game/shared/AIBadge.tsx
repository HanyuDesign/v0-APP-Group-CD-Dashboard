'use client'

import { cn } from '@/lib/utils'
import { Bot } from 'lucide-react'

interface AIBadgeProps {
  className?: string
  size?: 'sm' | 'md'
}

export function AIBadge({ className, size = 'sm' }: AIBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-ai-badge px-2 py-0.5 text-ai-badge-foreground',
        size === 'sm' && 'text-[10px]',
        size === 'md' && 'text-xs',
        'animate-pulse',
        className
      )}
    >
      <Bot className={cn(size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
      <span>AI驱动</span>
    </span>
  )
}
