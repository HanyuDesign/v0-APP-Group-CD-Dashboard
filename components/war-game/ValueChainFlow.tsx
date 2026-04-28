'use client'

import { useState } from 'react'
import { ForestryModule } from './modules/ForestryModule'
import { PulpModule } from './modules/PulpModule'
import { DownstreamModule } from './modules/DownstreamModule'
import { Trees, Factory, Package, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { 
  SimulationInput, 
  SimulationResult,
  ForestrySettings,
  APPCapacitySettings,
  DownstreamSettings,
} from '@/lib/types/war-game'

interface ValueChainFlowProps {
  input: SimulationInput
  onInputChange: (input: SimulationInput) => void
  result: SimulationResult | null
}

type TabKey = 'forestry' | 'pulp' | 'downstream'

const TABS: { key: TabKey; label: string; icon: React.ReactNode; description: string }[] = [
  { 
    key: 'forestry', 
    label: 'Forestry & Woodchips', 
    icon: <Trees className="h-4 w-4" />,
    description: 'Configure wood supply policies'
  },
  { 
    key: 'pulp', 
    label: 'Pulp Capacity & Players', 
    icon: <Factory className="h-4 w-4" />,
    description: 'Set APP capacity decisions'
  },
  { 
    key: 'downstream', 
    label: 'Downstream Markets', 
    icon: <Package className="h-4 w-4" />,
    description: 'Define demand scenarios'
  },
]

export function ValueChainFlow({ input, onInputChange, result }: ValueChainFlowProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('forestry')

  const handleForestryChange = (forestry: ForestrySettings) => {
    onInputChange({ ...input, forestry })
  }

  const handleAppCapacityChange = (appCapacity: APPCapacitySettings) => {
    onInputChange({ ...input, appCapacity })
  }

  const handleDownstreamChange = (downstream: DownstreamSettings) => {
    onInputChange({ ...input, downstream })
  }

  const currentTabIndex = TABS.findIndex(t => t.key === activeTab)

  return (
    <div className="flex gap-4">
      {/* Left tabs panel */}
      <div className="w-64 flex-shrink-0">
        <div className="rounded-lg border border-border/50 bg-card/50 overflow-hidden">
          {/* Tab header */}
          <div className="px-4 py-3 bg-secondary/30 border-b border-border/50">
            <h3 className="text-sm font-semibold">Value Chain Setup</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Configure each stage</p>
          </div>
          
          {/* Tab list */}
          <div className="p-2 space-y-1">
            {TABS.map((tab, index) => {
              const isActive = activeTab === tab.key
              const isPast = index < currentTabIndex
              
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all',
                    isActive 
                      ? 'bg-primary text-primary-foreground shadow-sm' 
                      : 'hover:bg-secondary/50',
                    isPast && !isActive && 'text-muted-foreground'
                  )}
                >
                  {/* Step number */}
                  <div className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold flex-shrink-0',
                    isActive 
                      ? 'bg-primary-foreground/20 text-primary-foreground' 
                      : isPast 
                        ? 'bg-success/20 text-success' 
                        : 'bg-secondary text-muted-foreground'
                  )}>
                    {isPast ? '✓' : index + 1}
                  </div>
                  
                  {/* Tab content */}
                  <div className="flex-1 min-w-0">
                    <div className={cn(
                      'text-sm font-medium truncate',
                      isActive ? 'text-primary-foreground' : ''
                    )}>
                      {tab.label}
                    </div>
                    <div className={cn(
                      'text-xs truncate',
                      isActive ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    )}>
                      {tab.description}
                    </div>
                  </div>
                  
                  {/* Arrow indicator */}
                  <ChevronRight className={cn(
                    'h-4 w-4 flex-shrink-0 transition-transform',
                    isActive ? 'text-primary-foreground' : 'text-muted-foreground',
                    isActive && 'translate-x-0.5'
                  )} />
                </button>
              )
            })}
          </div>

          {/* Progress indicator */}
          <div className="px-4 py-3 border-t border-border/50 bg-secondary/20">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>Progress</span>
              <span>{currentTabIndex + 1} of {TABS.length}</span>
            </div>
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${((currentTabIndex + 1) / TABS.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => {
              const prevIndex = Math.max(0, currentTabIndex - 1)
              setActiveTab(TABS[prevIndex].key)
            }}
            disabled={currentTabIndex === 0}
            className={cn(
              'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              currentTabIndex === 0
                ? 'bg-secondary/30 text-muted-foreground cursor-not-allowed'
                : 'bg-secondary hover:bg-secondary/80 text-foreground'
            )}
          >
            Previous
          </button>
          <button
            onClick={() => {
              const nextIndex = Math.min(TABS.length - 1, currentTabIndex + 1)
              setActiveTab(TABS[nextIndex].key)
            }}
            disabled={currentTabIndex === TABS.length - 1}
            className={cn(
              'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              currentTabIndex === TABS.length - 1
                ? 'bg-secondary/30 text-muted-foreground cursor-not-allowed'
                : 'bg-primary hover:bg-primary/90 text-primary-foreground'
            )}
          >
            Next
          </button>
        </div>
      </div>

      {/* Right content panel */}
      <div className="flex-1 min-w-0">
        {activeTab === 'forestry' && (
          <ForestryModule
            settings={input.forestry}
            onChange={handleForestryChange}
            woodchipAvailability={result?.woodchip.availability}
            woodchipPrice={result?.woodchip.priceLevel}
          />
        )}
        {activeTab === 'pulp' && (
          <PulpModule
            settings={input.appCapacity}
            onChange={handleAppCapacityChange}
            competitorChanges={result?.competitorChanges}
          />
        )}
        {activeTab === 'downstream' && (
          <DownstreamModule
            settings={input.downstream}
            onChange={handleDownstreamChange}
          />
        )}
      </div>
    </div>
  )
}
