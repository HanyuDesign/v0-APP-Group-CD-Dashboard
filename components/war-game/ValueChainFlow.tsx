'use client'

import { useState } from 'react'
import { ForestryModule } from './modules/ForestryModule'
import { PulpModule } from './modules/PulpModule'
import { DownstreamModule } from './modules/DownstreamModule'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trees, Factory, Package, ChevronRight, ClipboardList, TrendingUp, TrendingDown, Play, RotateCcw, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
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

        {/* Reset & Run Simulation buttons - Vertical layout */}
        <div className="flex flex-col gap-2 mt-3">
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

      {/* Right content panel */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex-1">
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
        
        {/* Navigation buttons - at bottom of right panel */}
        <div className="flex justify-end gap-2 mt-4 w-1/4 ml-auto">
          <button
            onClick={() => {
              const prevIndex = Math.max(0, currentTabIndex - 1)
              setActiveTab(TABS[prevIndex].key)
            }}
            disabled={currentTabIndex === 0}
            className={cn(
              'flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors h-10 border',
              currentTabIndex === 0
                ? 'bg-secondary/30 text-muted-foreground cursor-not-allowed border-transparent'
                : 'bg-white hover:bg-secondary/50 text-foreground border-border'
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
              'flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors h-10',
              currentTabIndex === TABS.length - 1
                ? 'bg-secondary/30 text-muted-foreground cursor-not-allowed'
                : 'bg-red-100 hover:bg-red-200 text-red-700 border border-red-200'
            )}
          >
            Next
          </button>
        </div>
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

  // Competitor data for pulp
  const competitorPulpData = [
    { name: 'Sun Paper', color: '#1d4e89', capacity: { 2026: 180, 2027: 50, 2028: 80, 2029: 0, 2030: 100, 2031: 0 } },
    { name: 'Chenming', color: '#2a9d8f', capacity: { 2026: 120, 2027: 0, 2028: 60, 2029: 40, 2030: 0, 2031: 50 } },
    { name: 'Liansheng', color: '#e9c46a', capacity: { 2026: 80, 2027: 30, 2028: 0, 2029: 50, 2030: 0, 2031: 0 } },
    { name: 'Others China', color: '#6c757d', capacity: { 2026: 150, 2027: 20, 2028: 30, 2029: 40, 2030: 25, 2031: 35 } },
  ]

  // Competitor data for downstream segments
  const downstreamCompetitorData = {
    paper: [
      { name: 'Sun Paper', capacity: { 2026: 150, 2027: 0, 2028: -20, 2029: -15, 2030: 0, 2031: -10 } },
      { name: 'Chenming', capacity: { 2026: 100, 2027: -10, 2028: 0, 2029: -20, 2030: 0, 2031: 0 } },
      { name: 'Liansheng', capacity: { 2026: 60, 2027: 0, 2028: 0, 2029: 0, 2030: -10, 2031: 0 } },
      { name: 'Others', capacity: { 2026: 200, 2027: -30, 2028: -40, 2029: -25, 2030: -20, 2031: -15 } },
    ],
    board: [
      { name: 'Sun Paper', capacity: { 2026: 180, 2027: 40, 2028: 60, 2029: 30, 2030: 50, 2031: 20 } },
      { name: 'Chenming', capacity: { 2026: 140, 2027: 20, 2028: 30, 2029: 40, 2030: 25, 2031: 35 } },
      { name: 'Liansheng', capacity: { 2026: 90, 2027: 15, 2028: 25, 2029: 20, 2030: 10, 2031: 15 } },
      { name: 'Others', capacity: { 2026: 250, 2027: 30, 2028: 45, 2029: 35, 2030: 40, 2031: 30 } },
    ],
    tissue: [
      { name: 'Sun Paper', capacity: { 2026: 60, 2027: 10, 2028: 15, 2029: 20, 2030: 10, 2031: 15 } },
      { name: 'Chenming', capacity: { 2026: 40, 2027: 5, 2028: 10, 2029: 8, 2030: 12, 2031: 5 } },
      { name: 'Liansheng', capacity: { 2026: 30, 2027: 8, 2028: 5, 2029: 10, 2030: 5, 2031: 8 } },
      { name: 'Others', capacity: { 2026: 100, 2027: 15, 2028: 20, 2029: 25, 2030: 18, 2031: 22 } },
    ],
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
        {/* Stage 1: Forestry & Woodchips - Simplified */}
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <div className="bg-green-50 px-4 py-2 border-b border-border/50 flex items-center gap-2">
            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-green-600 text-white text-xs font-bold">1</span>
            <Trees className="h-4 w-4 text-green-700" />
            <h3 className="font-semibold text-sm text-green-800">Forestry & Woodchips</h3>
          </div>
          <div className="p-4 bg-white">
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">China Supply</div>
                <div className="text-2xl font-bold text-green-700">{getChinaSupply()} kt</div>
              </div>
              <div className="h-10 w-px bg-border" />
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Vietnam Supply</div>
                <div className="text-2xl font-bold text-green-700">{getVietnamSupply()} kt</div>
              </div>
              <div className="h-10 w-px bg-border" />
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Total Woodchip Supply</div>
                <div className="text-2xl font-bold text-green-800">{getChinaSupply() + getVietnamSupply()} kt</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stage 2: Pulp Capacity & Players - With competitor table */}
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <div className="bg-blue-50 px-4 py-2 border-b border-border/50 flex items-center gap-2">
            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-600 text-white text-xs font-bold">2</span>
            <Factory className="h-4 w-4 text-blue-700" />
            <h3 className="font-semibold text-sm text-blue-800">Pulp Capacity & Players</h3>
          </div>
          <div className="p-4 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Player</th>
                    {years.map(year => (
                      <th key={year} className="text-center py-2 px-2 font-medium text-muted-foreground">{year}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Competitor rows */}
                  {competitorPulpData.map((competitor) => (
                    <tr key={competitor.name} className="border-b border-border/30">
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: competitor.color }} />
                          <span className="font-medium text-muted-foreground">{competitor.name}</span>
                        </div>
                      </td>
                      {years.map(year => (
                        <td key={year} className="text-center py-2 px-2 font-mono">
                          {year === 2026 ? (
                            <span className="text-muted-foreground">{competitor.capacity[year]}</span>
                          ) : (
                            <span className={cn(
                              competitor.capacity[year] > 0 ? 'text-green-600' : 'text-muted-foreground'
                            )}>
                              {competitor.capacity[year] > 0 ? `+${competitor.capacity[year]}` : competitor.capacity[year] || '-'}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {/* APP China row - highlighted */}
                  <tr className="bg-red-50 border-2 border-[#cc0000]/30">
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-[#cc0000]" />
                        <span className="font-bold text-[#cc0000]">APP China</span>
                      </div>
                    </td>
                    {years.map(year => (
                      <td key={year} className="text-center py-2 px-2 font-mono font-semibold">
                        {year === 2026 ? (
                          <span className="text-[#cc0000]">{input.appCapacity.appChina[year]}</span>
                        ) : (
                          <span className={cn(
                            input.appCapacity.appChina[year] > 0 ? 'text-green-600' : 'text-muted-foreground'
                          )}>
                            {input.appCapacity.appChina[year] > 0 ? `+${input.appCapacity.appChina[year]}` : input.appCapacity.appChina[year] || '-'}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Stage 3: Downstream Markets - Supply & Demand blocks */}
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <div className="bg-purple-50 px-4 py-2 border-b border-border/50 flex items-center gap-2">
            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-purple-600 text-white text-xs font-bold">3</span>
            <Package className="h-4 w-4 text-purple-700" />
            <h3 className="font-semibold text-sm text-purple-800">Downstream Markets</h3>
          </div>
          <div className="p-4 bg-white space-y-4">
            {/* Demand Block */}
            <div className="rounded-lg border-2 border-orange-200 bg-orange-50/50 p-3">
              <h4 className="text-xs font-bold text-orange-800 mb-3 flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" />
                Demand Scenarios
              </h4>
              <div className="grid grid-cols-3 gap-3">
                {/* Paper */}
                <div className="rounded-lg bg-white p-2 border border-orange-100">
                  <div className="text-[10px] text-muted-foreground mb-1">Paper</div>
                  <div className={cn(
                    'text-sm font-semibold flex items-center gap-1',
                    input.downstream.paperDemand === 'high' && 'text-green-600',
                    input.downstream.paperDemand === 'low' && 'text-red-600'
                  )}>
                    {input.downstream.paperDemand === 'high' && <TrendingUp className="h-3 w-3" />}
                    {input.downstream.paperDemand === 'low' && <TrendingDown className="h-3 w-3" />}
                    {POLICY_LABELS.demandScenario[input.downstream.paperDemand]}
                  </div>
                </div>
                {/* Packaging / Carton Board */}
                <div className="rounded-lg bg-white p-2 border border-orange-100">
                  <div className="text-[10px] text-muted-foreground mb-1">Packaging / Carton Board</div>
                  <div className={cn(
                    'text-sm font-semibold flex items-center gap-1',
                    input.downstream.boardDemand === 'high' && 'text-green-600',
                    input.downstream.boardDemand === 'low' && 'text-red-600'
                  )}>
                    {input.downstream.boardDemand === 'high' && <TrendingUp className="h-3 w-3" />}
                    {input.downstream.boardDemand === 'low' && <TrendingDown className="h-3 w-3" />}
                    {POLICY_LABELS.demandScenario[input.downstream.boardDemand]}
                  </div>
                </div>
                {/* Tissue */}
                <div className="rounded-lg bg-white p-2 border border-orange-100">
                  <div className="text-[10px] text-muted-foreground mb-1">Tissue</div>
                  <div className={cn(
                    'text-sm font-semibold flex items-center gap-1',
                    input.downstream.tissueDemand === 'high' && 'text-green-600',
                    input.downstream.tissueDemand === 'low' && 'text-red-600'
                  )}>
                    {input.downstream.tissueDemand === 'high' && <TrendingUp className="h-3 w-3" />}
                    {input.downstream.tissueDemand === 'low' && <TrendingDown className="h-3 w-3" />}
                    {POLICY_LABELS.demandScenario[input.downstream.tissueDemand]}
                  </div>
                </div>
              </div>
            </div>

            {/* Supply Block */}
            <div className="rounded-lg border-2 border-red-200 bg-red-50/50 p-3">
              <h4 className="text-xs font-bold text-red-800 mb-3 flex items-center gap-1.5">
                <Factory className="h-3.5 w-3.5" />
                Supply Capacity Additions (kt)
              </h4>
              <div className="space-y-3">
                {/* Paper Supply */}
                <div className="rounded-lg bg-white p-3 border border-red-100">
                  <div className="text-xs font-semibold text-muted-foreground mb-2">Paper</div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground">Player</th>
                        {years.map(y => <th key={y} className="text-center py-2 px-2 font-medium text-muted-foreground">{y}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {downstreamCompetitorData.paper.map(c => (
                        <tr key={c.name} className="border-b border-border/30">
                          <td className="py-2 px-2 text-muted-foreground">{c.name}</td>
                          {years.map(y => (
                            <td key={y} className={cn('text-center py-2 px-2 font-mono', y !== 2026 && c.capacity[y] > 0 && 'text-green-600', y !== 2026 && c.capacity[y] < 0 && 'text-red-600')}>
                              {y === 2026 ? c.capacity[y] : c.capacity[y] !== 0 ? (c.capacity[y] > 0 ? `+${c.capacity[y]}` : c.capacity[y]) : '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                      <tr className="bg-red-100/50 font-semibold">
                        <td className="py-2 px-2 text-[#cc0000]">APP China</td>
                        {years.map(y => (
                          <td key={y} className={cn('text-center py-2 px-2 font-mono', y !== 2026 && input.downstream.supply.paper.appChina[y] > 0 && 'text-green-600')}>
                            {y === 2026 ? input.downstream.supply.paper.appChina[y] : input.downstream.supply.paper.appChina[y] > 0 ? `+${input.downstream.supply.paper.appChina[y]}` : '-'}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Board Supply */}
                <div className="rounded-lg bg-white p-3 border border-red-100">
                  <div className="text-xs font-semibold text-muted-foreground mb-2">Packaging / Carton Board</div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground">Player</th>
                        {years.map(y => <th key={y} className="text-center py-2 px-2 font-medium text-muted-foreground">{y}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {downstreamCompetitorData.board.map(c => (
                        <tr key={c.name} className="border-b border-border/30">
                          <td className="py-2 px-2 text-muted-foreground">{c.name}</td>
                          {years.map(y => (
                            <td key={y} className={cn('text-center py-2 px-2 font-mono', y !== 2026 && c.capacity[y] > 0 && 'text-green-600', y !== 2026 && c.capacity[y] < 0 && 'text-red-600')}>
                              {y === 2026 ? c.capacity[y] : c.capacity[y] !== 0 ? (c.capacity[y] > 0 ? `+${c.capacity[y]}` : c.capacity[y]) : '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                      <tr className="bg-red-100/50 font-semibold">
                        <td className="py-2 px-2 text-[#cc0000]">APP China</td>
                        {years.map(y => (
                          <td key={y} className={cn('text-center py-2 px-2 font-mono', y !== 2026 && input.downstream.supply.board.appChina[y] > 0 && 'text-green-600')}>
                            {y === 2026 ? input.downstream.supply.board.appChina[y] : input.downstream.supply.board.appChina[y] > 0 ? `+${input.downstream.supply.board.appChina[y]}` : '-'}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Tissue Supply */}
                <div className="rounded-lg bg-white p-3 border border-red-100">
                  <div className="text-xs font-semibold text-muted-foreground mb-2">Tissue</div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground">Player</th>
                        {years.map(y => <th key={y} className="text-center py-2 px-2 font-medium text-muted-foreground">{y}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {downstreamCompetitorData.tissue.map(c => (
                        <tr key={c.name} className="border-b border-border/30">
                          <td className="py-2 px-2 text-muted-foreground">{c.name}</td>
                          {years.map(y => (
                            <td key={y} className={cn('text-center py-2 px-2 font-mono', y !== 2026 && c.capacity[y] > 0 && 'text-green-600', y !== 2026 && c.capacity[y] < 0 && 'text-red-600')}>
                              {y === 2026 ? c.capacity[y] : c.capacity[y] !== 0 ? (c.capacity[y] > 0 ? `+${c.capacity[y]}` : c.capacity[y]) : '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                      <tr className="bg-red-100/50 font-semibold">
                        <td className="py-2 px-2 text-[#cc0000]">APP China</td>
                        {years.map(y => (
                          <td key={y} className={cn('text-center py-2 px-2 font-mono', y !== 2026 && input.downstream.supply.tissue.appChina[y] > 0 && 'text-green-600')}>
                            {y === 2026 ? input.downstream.supply.tissue.appChina[y] : input.downstream.supply.tissue.appChina[y] > 0 ? `+${input.downstream.supply.tissue.appChina[y]}` : '-'}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
