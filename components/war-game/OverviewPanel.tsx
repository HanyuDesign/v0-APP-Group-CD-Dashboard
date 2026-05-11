'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trees, Factory, Package, ClipboardList, FileText, Bath, Info, TrendingUp, TrendingDown, ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { POLICY_LABELS } from '@/lib/data/initial-data'
import type { SimulationInput, YearlyCapacity } from '@/lib/types/war-game'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { 
  calculateWoodchipSupply, 
  YEARS, 
  CHINA_BASE_SUPPLY, 
  VIETNAM_BASE_SUPPLY, 
  REAL_ESTATE_IMPACT 
} from '@/lib/simulation/computations'

interface OverviewPanelProps {
  input: SimulationInput
  showHeader?: boolean
}

const years = YEARS

// Helper function to convert additions to cumulative total capacity
function calculateTotalCapacity(additions: YearlyCapacity): YearlyCapacity {
  let cumulative = additions[2026] // Base year is the starting capacity
  const totals: YearlyCapacity = { 2026: additions[2026], 2027: 0, 2028: 0, 2029: 0, 2030: 0, 2031: 0 }
  
  for (let i = 1; i < years.length; i++) {
    const year = years[i]
    cumulative += Math.max(0, additions[year])
    totals[year] = cumulative
  }
  
  return totals
}

export function OverviewPanel({ input, showHeader = true }: OverviewPanelProps) {
  // Calculate yearly woodchip supplies using centralized computation
  const woodchipSupplyData = calculateWoodchipSupply(input.forestry)
  
  // Convert to record format for easier access in JSX
  const chinaSupply: Record<number, { supply: number; delta: number; isPolicyActive: boolean }> = {}
  const vietnamSupply: Record<number, { supply: number; delta: number; isPolicyActive: boolean }> = {}
  
  for (const data of woodchipSupplyData) {
    chinaSupply[data.year] = {
      supply: data.chinaSupply,
      delta: data.chinaDelta,
      isPolicyActive: data.chinaIsPolicyActive
    }
    vietnamSupply[data.year] = {
      supply: data.vietnamSupply,
      delta: data.vietnamDelta,
      isPolicyActive: data.vietnamIsPolicyActive
    }
  }

  // Competitor data for pulp (base capacity in 2026, additions in subsequent years)
  const competitorPulpAdditions = [
    { name: 'Sun Paper', color: '#1d4e89', capacity: { 2026: 180, 2027: 50, 2028: 80, 2029: 0, 2030: 100, 2031: 0 } as YearlyCapacity },
    { name: 'Chenming', color: '#2a9d8f', capacity: { 2026: 120, 2027: 0, 2028: 60, 2029: 40, 2030: 0, 2031: 50 } as YearlyCapacity },
    { name: 'Liansheng', color: '#e9c46a', capacity: { 2026: 80, 2027: 30, 2028: 0, 2029: 50, 2030: 0, 2031: 0 } as YearlyCapacity },
    { name: 'Others China', color: '#6c757d', capacity: { 2026: 150, 2027: 20, 2028: 30, 2029: 40, 2030: 25, 2031: 35 } as YearlyCapacity },
  ]

  // Competitor data for downstream segments (base + additions)
  const downstreamCompetitorAdditions = {
    paper: [
      { name: 'Sun Paper', capacity: { 2026: 150, 2027: 0, 2028: 0, 2029: 0, 2030: 0, 2031: 0 } as YearlyCapacity },
      { name: 'Chenming', capacity: { 2026: 100, 2027: 0, 2028: 0, 2029: 0, 2030: 0, 2031: 0 } as YearlyCapacity },
      { name: 'Liansheng', capacity: { 2026: 60, 2027: 0, 2028: 0, 2029: 0, 2030: 0, 2031: 0 } as YearlyCapacity },
      { name: 'Others', capacity: { 2026: 200, 2027: 0, 2028: 0, 2029: 0, 2030: 0, 2031: 0 } as YearlyCapacity },
    ],
    board: [
      { name: 'Sun Paper', capacity: { 2026: 180, 2027: 40, 2028: 60, 2029: 30, 2030: 50, 2031: 20 } as YearlyCapacity },
      { name: 'Chenming', capacity: { 2026: 140, 2027: 20, 2028: 30, 2029: 40, 2030: 25, 2031: 35 } as YearlyCapacity },
      { name: 'Liansheng', capacity: { 2026: 90, 2027: 15, 2028: 25, 2029: 20, 2030: 10, 2031: 15 } as YearlyCapacity },
      { name: 'Others', capacity: { 2026: 250, 2027: 30, 2028: 45, 2029: 35, 2030: 40, 2031: 30 } as YearlyCapacity },
    ],
    tissue: [
      { name: 'Sun Paper', capacity: { 2026: 60, 2027: 10, 2028: 15, 2029: 20, 2030: 10, 2031: 15 } as YearlyCapacity },
      { name: 'Chenming', capacity: { 2026: 40, 2027: 5, 2028: 10, 2029: 8, 2030: 12, 2031: 5 } as YearlyCapacity },
      { name: 'Liansheng', capacity: { 2026: 30, 2027: 8, 2028: 5, 2029: 10, 2030: 5, 2031: 8 } as YearlyCapacity },
      { name: 'Others', capacity: { 2026: 100, 2027: 15, 2028: 20, 2029: 25, 2030: 18, 2031: 22 } as YearlyCapacity },
    ],
  }

  // Calculate APP total capacity from additions
  const appPulpTotals = calculateTotalCapacity(input.appCapacity.appChina)
  const appPaperTotals = calculateTotalCapacity(input.downstream.supply.paper.appChina)
  const appBoardTotals = calculateTotalCapacity(input.downstream.supply.board.appChina)
  const appTissueTotals = calculateTotalCapacity(input.downstream.supply.tissue.appChina)

  const content = (
    <div className="space-y-4">
      {/* Stage 1: Forestry & Woodchips - Unified Table */}
      <div className="rounded-lg border border-border/50 overflow-hidden">
        <div className="bg-green-50 px-4 py-2 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-green-600 text-white text-xs font-bold">1</span>
            <Trees className="h-4 w-4 text-green-700" />
            <h3 className="font-semibold text-sm text-green-800">Forestry & Woodchips</h3>
          </div>
          <div className="text-xs text-muted-foreground">Woodchip Supply (kt)</div>
        </div>
        <div className="p-4 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-base">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground w-48">Year</th>
                  {years.map(year => (
                    <th key={year} className="text-center py-2 px-3 font-medium text-muted-foreground">{year}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Row 1: China Woodchip Supply */}
                <tr className="border-b border-border/30">
                  <td className="py-3 px-3 text-muted-foreground">China Woodchip Supply</td>
                  {years.map(year => {
                    const data = chinaSupply[year]
                    const baselineSupply = CHINA_BASE_SUPPLY + REAL_ESTATE_IMPACT[input.forestry.chinaRealEstateCondition]
                    const deltaVsBaseline = data.supply - baselineSupply
                    return (
                      <td key={year} className="text-center py-3 px-3">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className={cn(
                            'font-mono font-semibold',
                            data.isPolicyActive && data.delta !== 0
                              ? data.delta > 0 ? 'text-emerald-600' : 'text-amber-600'
                              : 'text-foreground'
                          )}>
                            {data.supply}
                          </span>
                          {data.isPolicyActive && deltaVsBaseline !== 0 && (
                            <span className={cn(
                              'text-[10px] flex items-center font-medium',
                              deltaVsBaseline > 0 ? 'text-emerald-600' : 'text-amber-600'
                            )}>
                              {deltaVsBaseline > 0 ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                              {deltaVsBaseline > 0 ? '+' : ''}{deltaVsBaseline}
                            </span>
                          )}
                        </div>
                      </td>
                    )
                  })}
                </tr>
                {/* Row 2: Vietnam Supply to China */}
                <tr className="border-b border-border/30">
                  <td className="py-3 px-3 text-muted-foreground">Vietnam Supply to China</td>
                  {years.map(year => {
                    const data = vietnamSupply[year]
                    const deltaVsBaseline = data.supply - VIETNAM_BASE_SUPPLY
                    return (
                      <td key={year} className="text-center py-3 px-3">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className={cn(
                            'font-mono font-semibold',
                            data.isPolicyActive && data.delta !== 0
                              ? data.delta > 0 ? 'text-emerald-600' : 'text-amber-600'
                              : 'text-foreground'
                          )}>
                            {data.supply}
                          </span>
                          {data.isPolicyActive && deltaVsBaseline !== 0 && (
                            <span className={cn(
                              'text-[10px] flex items-center font-medium',
                              deltaVsBaseline > 0 ? 'text-emerald-600' : 'text-amber-600'
                            )}>
                              {deltaVsBaseline > 0 ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                              {deltaVsBaseline > 0 ? '+' : ''}{deltaVsBaseline}
                            </span>
                          )}
                        </div>
                      </td>
                    )
                  })}
                </tr>
                {/* Row 3: Total Woodchip Supply */}
                <tr className="bg-green-50/50">
                  <td className="py-3 px-3 font-semibold text-green-800">Total Woodchip Supply</td>
                  {years.map(year => {
                    const totalSupply = chinaSupply[year].supply + vietnamSupply[year].supply
                    const baselineTotal = CHINA_BASE_SUPPLY + REAL_ESTATE_IMPACT[input.forestry.chinaRealEstateCondition] + VIETNAM_BASE_SUPPLY
                    const deltaVsBaseline = totalSupply - baselineTotal
                    return (
                      <td key={year} className="text-center py-3 px-3">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="font-mono font-bold text-green-800">
                            {totalSupply}
                          </span>
                          {deltaVsBaseline !== 0 && (
                            <span className={cn(
                              'text-[10px] flex items-center font-medium',
                              deltaVsBaseline > 0 ? 'text-emerald-600' : 'text-amber-600'
                            )}>
                              {deltaVsBaseline > 0 ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                              {deltaVsBaseline > 0 ? '+' : ''}{deltaVsBaseline}
                            </span>
                          )}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Stage 2: Pulp Capacity & Players - Total Capacity View */}
      <div className="rounded-lg border border-border/50 overflow-hidden">
        <div className="bg-blue-50 px-4 py-2 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-600 text-white text-xs font-bold">2</span>
            <Factory className="h-4 w-4 text-blue-700" />
            <h3 className="font-semibold text-sm text-blue-800">Pulp Capacity & Players</h3>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-100 text-blue-700 text-sm font-medium">
                  <Info className="h-3 w-3" />
                  Total Capacity (kt)
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Values represent cumulative installed capacity</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="p-4 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-base">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground">Player</th>
                  {years.map(year => (
                    <th key={year} className="text-center py-2 px-2 font-medium text-muted-foreground">{year}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Competitor rows - showing TOTAL capacity */}
                {competitorPulpAdditions.map((competitor) => {
                  const totals = calculateTotalCapacity(competitor.capacity)
                  return (
                    <tr key={competitor.name} className="border-b border-border/30">
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: competitor.color }} />
                          <span className="font-medium text-muted-foreground">{competitor.name}</span>
                        </div>
                      </td>
                      {years.map(year => (
                        <td key={year} className="text-center py-2 px-2 font-mono">
                          <span className="text-muted-foreground">{totals[year]}</span>
                        </td>
                      ))}
                    </tr>
                  )
                })}
                {/* APP China row - highlighted, showing TOTAL capacity */}
                <tr className="bg-red-50 border-2 border-[#cc0000]/30">
                  <td className="py-2 px-2">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-[#cc0000]" />
                      <span className="font-bold text-[#cc0000]">APP China</span>
                    </div>
                  </td>
                  {years.map(year => (
                    <td key={year} className="text-center py-2 px-2 font-mono font-semibold">
                      <span className="text-[#cc0000]">{appPulpTotals[year]}</span>
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
            <h4 className="text-sm font-bold text-orange-800 mb-3 flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4" />
              Demand Scenarios
            </h4>
            <div className="grid grid-cols-3 gap-3">
              {/* Paper */}
              <div className="rounded-lg bg-white p-3 border border-orange-100">
                <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
                  <FileText className="h-4 w-4" />
                  Paper
                </div>
                <div className={cn(
                  'text-base font-semibold flex items-center gap-1',
                  input.downstream.paperDemand === 'high' && 'text-green-600',
                  input.downstream.paperDemand === 'low' && 'text-red-600'
                )}>
                  {input.downstream.paperDemand === 'high' && <TrendingUp className="h-4 w-4" />}
                  {input.downstream.paperDemand === 'low' && <TrendingDown className="h-4 w-4" />}
                  {POLICY_LABELS.demandScenario[input.downstream.paperDemand]}
                </div>
              </div>
              {/* Packaging / Carton Board */}
              <div className="rounded-lg bg-white p-3 border border-orange-100">
                <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
                  <Package className="h-4 w-4" />
                  Packaging / Carton Board
                </div>
                <div className={cn(
                  'text-base font-semibold flex items-center gap-1',
                  input.downstream.boardDemand === 'high' && 'text-green-600',
                  input.downstream.boardDemand === 'low' && 'text-red-600'
                )}>
                  {input.downstream.boardDemand === 'high' && <TrendingUp className="h-4 w-4" />}
                  {input.downstream.boardDemand === 'low' && <TrendingDown className="h-4 w-4" />}
                  {POLICY_LABELS.demandScenario[input.downstream.boardDemand]}
                </div>
              </div>
              {/* Tissue */}
              <div className="rounded-lg bg-white p-3 border border-orange-100">
                <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
                  <Bath className="h-4 w-4" />
                  Tissue
                </div>
                <div className={cn(
                  'text-base font-semibold flex items-center gap-1',
                  input.downstream.tissueDemand === 'high' && 'text-green-600',
                  input.downstream.tissueDemand === 'low' && 'text-red-600'
                )}>
                  {input.downstream.tissueDemand === 'high' && <TrendingUp className="h-4 w-4" />}
                  {input.downstream.tissueDemand === 'low' && <TrendingDown className="h-4 w-4" />}
                  {POLICY_LABELS.demandScenario[input.downstream.tissueDemand]}
                </div>
              </div>
            </div>
          </div>

          {/* Supply Block - Total Capacity View */}
          <div className="rounded-lg border-2 border-red-200 bg-red-50/50 p-3">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-red-800 flex items-center gap-1.5">
                <Factory className="h-4 w-4" />
                Supply Capacity
              </h4>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-100 text-red-700 text-sm font-medium">
                      <Info className="h-3 w-3" />
                      Total Capacity (kt)
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Values represent cumulative installed capacity</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="space-y-3">
              {/* Paper Supply - Total Capacity */}
              <div className="rounded-lg bg-white p-3 border border-red-100">
                <div className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                  <FileText className="h-4 w-4" />
                  Paper
                </div>
                <table className="w-full text-base">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-2 px-2 font-medium text-muted-foreground">Player</th>
                      {years.map(y => <th key={y} className="text-center py-2 px-2 font-medium text-muted-foreground">{y}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {downstreamCompetitorAdditions.paper.map(c => {
                      const totals = calculateTotalCapacity(c.capacity)
                      return (
                        <tr key={c.name} className="border-b border-border/30">
                          <td className="py-2 px-2 text-muted-foreground">{c.name}</td>
                          {years.map(y => (
                            <td key={y} className="text-center py-2 px-2 font-mono">
                              {totals[y]}
                            </td>
                          ))}
                        </tr>
                      )
                    })}
                    <tr className="bg-red-100/50 font-semibold">
                      <td className="py-2 px-2 text-[#cc0000]">APP China</td>
                      {years.map(y => (
                        <td key={y} className="text-center py-2 px-2 font-mono text-[#cc0000]">
                          {appPaperTotals[y]}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Board Supply - Total Capacity */}
              <div className="rounded-lg bg-white p-3 border border-red-100">
                <div className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Package className="h-4 w-4" />
                  Packaging / Carton Board
                </div>
                <table className="w-full text-base">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-2 px-2 font-medium text-muted-foreground">Player</th>
                      {years.map(y => <th key={y} className="text-center py-2 px-2 font-medium text-muted-foreground">{y}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {downstreamCompetitorAdditions.board.map(c => {
                      const totals = calculateTotalCapacity(c.capacity)
                      return (
                        <tr key={c.name} className="border-b border-border/30">
                          <td className="py-2 px-2 text-muted-foreground">{c.name}</td>
                          {years.map(y => (
                            <td key={y} className="text-center py-2 px-2 font-mono">
                              {totals[y]}
                            </td>
                          ))}
                        </tr>
                      )
                    })}
                    <tr className="bg-red-100/50 font-semibold">
                      <td className="py-2 px-2 text-[#cc0000]">APP China</td>
                      {years.map(y => (
                        <td key={y} className="text-center py-2 px-2 font-mono text-[#cc0000]">
                          {appBoardTotals[y]}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Tissue Supply - Total Capacity */}
              <div className="rounded-lg bg-white p-3 border border-red-100">
                <div className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Bath className="h-4 w-4" />
                  Tissue
                </div>
                <table className="w-full text-base">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-2 px-2 font-medium text-muted-foreground">Player</th>
                      {years.map(y => <th key={y} className="text-center py-2 px-2 font-medium text-muted-foreground">{y}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {downstreamCompetitorAdditions.tissue.map(c => {
                      const totals = calculateTotalCapacity(c.capacity)
                      return (
                        <tr key={c.name} className="border-b border-border/30">
                          <td className="py-2 px-2 text-muted-foreground">{c.name}</td>
                          {years.map(y => (
                            <td key={y} className="text-center py-2 px-2 font-mono">
                              {totals[y]}
                            </td>
                          ))}
                        </tr>
                      )
                    })}
                    <tr className="bg-red-100/50 font-semibold">
                      <td className="py-2 px-2 text-[#cc0000]">APP China</td>
                      {years.map(y => (
                        <td key={y} className="text-center py-2 px-2 font-mono text-[#cc0000]">
                          {appTissueTotals[y]}
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
    </div>
  )

  if (!showHeader) {
    return content
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
      <CardContent>
        {content}
      </CardContent>
    </Card>
  )
}
