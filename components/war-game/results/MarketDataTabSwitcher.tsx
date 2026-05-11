'use client'

import { cn } from '@/lib/utils'

export type MarketDataTab = 'market' | 'financial'

interface MarketDataTabSwitcherProps {
  activeTab: MarketDataTab
  onTabChange: (tab: MarketDataTab) => void
  className?: string
}

/**
 * Compact pill-style switcher used inside the card headers of the
 * Market Data section (Player Market Data + APP Project IRR cards).
 */
export function MarketDataTabSwitcher({ activeTab, onTabChange, className }: MarketDataTabSwitcherProps) {
  return (
    <div className={cn('flex gap-1 bg-muted/50 rounded-lg p-1', className)} role="tablist" aria-label="Market data view">
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'market'}
        onClick={() => onTabChange('market')}
        className={cn(
          'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
          activeTab === 'market'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        Market Performance
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'financial'}
        onClick={() => onTabChange('financial')}
        className={cn(
          'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
          activeTab === 'financial'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        Financial Results
      </button>
    </div>
  )
}
