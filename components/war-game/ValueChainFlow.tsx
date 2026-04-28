'use client'

import { useState } from 'react'
import { ForestryModule } from './modules/ForestryModule'
import { PulpModule } from './modules/PulpModule'
import { DownstreamModule } from './modules/DownstreamModule'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trees, Factory, Package, ChevronRight, ClipboardList, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { POLICY_LABELS } from '@/lib/data/initial-data'
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
        {activeTab === 'overview' && (
          <OverviewPanel input={input} />
        )}
      </div>
    </div>
  )
}

// Overview Panel Component
function OverviewPanel({ input }: { input: SimulationInput }) {
  const years = [2026, 2027, 2028, 2029, 2030, 2031] as const

  // Calculate China supply
  const getChinaSupply = () => {
    let base = 800
    if (input.forestry.chinaLoggingPolicy === 'tight') base -= 150
    else if (input.forestry.chinaLoggingPolicy === 'relaxed') base += 150
    if (input.forestry.chinaRealEstateCondition === 'downturn') base -= 100
    else if (input.forestry.chinaRealEstateCondition === 'recovery') base += 100
    return base
  }

  // Calculate Vietnam supply
  const getVietnamSupply = () => {
    let base = 400
    if (input.forestry.vietnamExportPolicy === 'restricted') base -= 120
    else if (input.forestry.vietnamExportPolicy === 'expanded') base += 120
    return base
  }

  // Calculate total APP pulp capacity additions
  const getTotalPulpAdditions = () => {
    return years.slice(1).reduce((sum, year) => sum + (input.appCapacity.appChina[year] || 0), 0)
  }

  return (
    <Card className="border-border/50 bg-card/80">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ClipboardList className="h-5 w-5 text-primary" />
          Input Summary Overview
        </CardTitle>
        <p className="text-sm text-muted-foreground">Review your configuration before running the simulation</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stage 1: Forestry & Woodchips */}
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <div className="bg-green-50 px-4 py-2 border-b border-border/50 flex items-center gap-2">
            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-green-600 text-white text-xs font-bold">1</span>
            <Trees className="h-4 w-4 text-green-700" />
            <h3 className="font-semibold text-sm text-green-800">Forestry & Woodchips</h3>
          </div>
          <div className="p-4 bg-white">
            <div className="grid grid-cols-2 gap-4">
              {/* China */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase">China Domestic</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Logging Policy:</span>
                    <span className="font-medium">{POLICY_LABELS.chinaLoggingPolicy[input.forestry.chinaLoggingPolicy]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Real Estate:</span>
                    <span className="font-medium">{POLICY_LABELS.chinaRealEstateCondition[input.forestry.chinaRealEstateCondition]}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-border/30">
                    <span className="text-muted-foreground">Supply Output:</span>
                    <span className="font-bold text-green-700">{getChinaSupply()} kt</span>
                  </div>
                </div>
              </div>
              {/* Vietnam */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase">Vietnam Exports</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Export Policy:</span>
                    <span className="font-medium">{POLICY_LABELS.vietnamExportPolicy[input.forestry.vietnamExportPolicy]}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-border/30 mt-6">
                    <span className="text-muted-foreground">Supply Output:</span>
                    <span className="font-bold text-green-700">{getVietnamSupply()} kt</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stage 2: Pulp Capacity & Players */}
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <div className="bg-blue-50 px-4 py-2 border-b border-border/50 flex items-center gap-2">
            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-600 text-white text-xs font-bold">2</span>
            <Factory className="h-4 w-4 text-blue-700" />
            <h3 className="font-semibold text-sm text-blue-800">Pulp Capacity & Players</h3>
          </div>
          <div className="p-4 bg-white">
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase">APP China Capacity Additions</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-1.5 px-2 text-xs font-medium text-muted-foreground">Year</th>
                      {years.map(year => (
                        <th key={year} className="text-center py-1.5 px-2 text-xs font-medium text-muted-foreground">{year}</th>
                      ))}
                      <th className="text-center py-1.5 px-2 text-xs font-medium text-muted-foreground">Total Add</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-2 px-2 font-medium text-[#cc0000]">APP China</td>
                      {years.map(year => (
                        <td key={year} className="text-center py-2 px-2 font-mono">
                          {year === 2026 ? (
                            <span className="text-muted-foreground">{input.appCapacity.appChina[year]}</span>
                          ) : (
                            <span className={cn(
                              'font-semibold',
                              input.appCapacity.appChina[year] > 0 ? 'text-green-600' : 'text-muted-foreground'
                            )}>
                              {input.appCapacity.appChina[year] > 0 ? `+${input.appCapacity.appChina[year]}` : input.appCapacity.appChina[year] || 0}
                            </span>
                          )}
                        </td>
                      ))}
                      <td className="text-center py-2 px-2 font-mono font-bold text-blue-700">
                        +{getTotalPulpAdditions()} kt
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Stage 3: Downstream Markets */}
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <div className="bg-purple-50 px-4 py-2 border-b border-border/50 flex items-center gap-2">
            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-purple-600 text-white text-xs font-bold">3</span>
            <Package className="h-4 w-4 text-purple-700" />
            <h3 className="font-semibold text-sm text-purple-800">Downstream Markets</h3>
          </div>
          <div className="p-4 bg-white">
            <div className="grid grid-cols-2 gap-4">
              {/* Demand Scenarios */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase">Demand Scenarios</h4>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Paper:</span>
                    <span className={cn(
                      'font-medium flex items-center gap-1',
                      input.downstream.paperDemand === 'high' && 'text-green-600',
                      input.downstream.paperDemand === 'low' && 'text-red-600'
                    )}>
                      {input.downstream.paperDemand === 'high' && <TrendingUp className="h-3 w-3" />}
                      {input.downstream.paperDemand === 'low' && <TrendingDown className="h-3 w-3" />}
                      {POLICY_LABELS.demandScenario[input.downstream.paperDemand]}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Packaging / Board:</span>
                    <span className={cn(
                      'font-medium flex items-center gap-1',
                      input.downstream.boardDemand === 'high' && 'text-green-600',
                      input.downstream.boardDemand === 'low' && 'text-red-600'
                    )}>
                      {input.downstream.boardDemand === 'high' && <TrendingUp className="h-3 w-3" />}
                      {input.downstream.boardDemand === 'low' && <TrendingDown className="h-3 w-3" />}
                      {POLICY_LABELS.demandScenario[input.downstream.boardDemand]}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Tissue:</span>
                    <span className={cn(
                      'font-medium flex items-center gap-1',
                      input.downstream.tissueDemand === 'high' && 'text-green-600',
                      input.downstream.tissueDemand === 'low' && 'text-red-600'
                    )}>
                      {input.downstream.tissueDemand === 'high' && <TrendingUp className="h-3 w-3" />}
                      {input.downstream.tissueDemand === 'low' && <TrendingDown className="h-3 w-3" />}
                      {POLICY_LABELS.demandScenario[input.downstream.tissueDemand]}
                    </span>
                  </div>
                </div>
              </div>
              {/* Supply Summary */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase">APP Supply Additions (2027-2031)</h4>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Paper:</span>
                    <span className="font-mono font-medium">
                      +{years.slice(1).reduce((sum, y) => sum + (input.downstream.supply.paper.appChina[y] || 0), 0)} kt
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Packaging / Board:</span>
                    <span className="font-mono font-medium">
                      +{years.slice(1).reduce((sum, y) => sum + (input.downstream.supply.board.appChina[y] || 0), 0)} kt
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tissue:</span>
                    <span className="font-mono font-medium">
                      +{years.slice(1).reduce((sum, y) => sum + (input.downstream.supply.tissue.appChina[y] || 0), 0)} kt
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
