'use client'

import { useState } from 'react'
import { ForestryModule } from './modules/ForestryModule'
import { WoodchipSupplyOutput } from './modules/WoodchipSupplyOutput'
import { PulpModule } from './modules/PulpModule'
import { DownstreamModule } from './modules/DownstreamModule'
import { OverviewPanel } from './OverviewPanel'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trees, Factory, Package, ChevronRight, ClipboardList, TrendingUp, TrendingDown, Play, RotateCcw, ArrowRight, FileText, Bath } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { POLICY_LABELS } from '@/lib/data/initial-data'
import type { 
  SimulationInput, 
  SimulationResult,
  ForestrySettings,
  APPCapacitySettings,
  DownstreamSettings,
  InputMode,
} from '@/lib/types/war-game'

interface ValueChainFlowProps {
  input: SimulationInput
  onInputChange: (input: SimulationInput) => void
  result: SimulationResult | null
  onRunSimulation?: () => void
  onReset?: () => void
  isRunning?: boolean
}

type TabKey = 'forestry' | 'pulp' | 'downstream' | 'overview'

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
  { 
    key: 'overview', 
    label: 'Overview', 
    icon: <ClipboardList className="h-4 w-4" />,
    description: 'Review all inputs'
  },
]

export function ValueChainFlow({ input, onInputChange, result, onRunSimulation, onReset, isRunning }: ValueChainFlowProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('forestry')
  const [inputMode, setInputMode] = useState<InputMode>('incremental')

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
      {/* Left tabs panel - sticky when scrolling */}
      <div className="w-64 flex-shrink-0">
        <div className="sticky top-4 space-y-3 z-10">
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

          {/* Reset & Run Simulation buttons - Vertical layout */}
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              onClick={onReset}
              disabled={isRunning}
              className="w-full h-10"
            >
              <RotateCcw className="mr-1.5 h-4 w-4" />
              Reset
            </Button>
            <Button
              onClick={onRunSimulation}
              disabled={isRunning || activeTab !== 'overview'}
              className={cn(
                'w-full h-10',
                activeTab === 'overview'
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-secondary/50 text-muted-foreground cursor-not-allowed'
              )}
            >
              {isRunning ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="mr-1.5 h-4 w-4" />
                  Run Simulation
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Right content panel */}
      <div className="flex-1 min-w-0">
        {activeTab === 'forestry' && (
          <div className="space-y-4">
            <ForestryModule
              settings={input.forestry}
              onChange={handleForestryChange}
            />
            <WoodchipSupplyOutput
              settings={input.forestry}
            />
          </div>
        )}
        {activeTab === 'pulp' && (
          <PulpModule
            settings={input.appCapacity}
            onChange={handleAppCapacityChange}
            competitorChanges={result?.competitorChanges}
            inputMode={inputMode}
            onInputModeChange={setInputMode}
          />
        )}
        {activeTab === 'downstream' && (
          <DownstreamModule
            settings={input.downstream}
            onChange={handleDownstreamChange}
            inputMode={inputMode}
            onInputModeChange={setInputMode}
          />
        )}
        {activeTab === 'overview' && (
          <OverviewPanel input={input} />
        )}
      </div>
    </div>
  )
}

