'use client'

import { cn } from '@/lib/utils'
import { AIBadge } from './AIBadge'
import type { Player } from '@/lib/types/war-game'

interface PlayerCardProps {
  player: Player
  capacityChange?: number
  action?: string
  className?: string
  compact?: boolean
}

export function PlayerCard({
  player,
  capacityChange,
  action,
  className,
  compact = false,
}: PlayerCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card/50 p-3',
        compact && 'p-2',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: player.color }}
          />
          <span className={cn('font-medium', compact ? 'text-sm' : 'text-base')}>
            {player.nameCn}
          </span>
        </div>
        {player.isAIDriven && <AIBadge size={compact ? 'sm' : 'md'} />}
      </div>
      
      {!compact && (
        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>浆产能</span>
            <span className="font-mono">{player.pulpCapacity} 万吨</span>
          </div>
          {capacityChange !== undefined && capacityChange !== 0 && (
            <div className="flex justify-between">
              <span>变化</span>
              <span
                className={cn(
                  'font-mono',
                  capacityChange > 0 ? 'text-success' : 'text-destructive'
                )}
              >
                {capacityChange > 0 ? '+' : ''}{capacityChange} 万吨
              </span>
            </div>
          )}
          {action && (
            <div className="mt-1 text-xs text-ai-badge">{action}</div>
          )}
        </div>
      )}
    </div>
  )
}
