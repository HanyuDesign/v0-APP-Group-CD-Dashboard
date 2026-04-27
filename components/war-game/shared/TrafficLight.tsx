'use client'

import { cn } from '@/lib/utils'

interface TrafficLightProps {
  status: 'green' | 'amber' | 'red'
  label?: string
  className?: string
}

export function TrafficLight({ status, label, className }: TrafficLightProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span
        className={cn(
          'h-3 w-3 rounded-full',
          status === 'green' && 'bg-success shadow-[0_0_8px_var(--success)]',
          status === 'amber' && 'bg-warning shadow-[0_0_8px_var(--warning)]',
          status === 'red' && 'bg-destructive shadow-[0_0_8px_var(--destructive)]'
        )}
      />
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
    </div>
  )
}
