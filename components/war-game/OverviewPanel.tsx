'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trees, Factory, Package, ClipboardList, TrendingUp, TrendingDown, FileText, Bath, Info, ArrowLeft, ArrowRight, Lightbulb, Users, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'
import { POLICY_LABELS } from '@/lib/data/initial-data'
import type { SimulationInput, YearlyCapacity } from '@/lib/types/war-game'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface OverviewPanelProps {
  input: SimulationInput
  showHeader?: boolean
}

const years = [2026, 2027, 2028, 2029, 2030, 2031] as const
type Year = typeof years[number]

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
  // Calculate China supply - using CORRECTED logic
  // Downturn = MORE wood available for pulp (less construction demand)
  // Recovery = LESS wood available for pulp (diverted to construction/furniture)
  const getChinaSupply = () => {
    let base = 750
    if (input.forestry.chinaLoggingPolicy === 'tight') base -= 150
    else if (input.forestry.chinaLoggingPolicy === 'relaxed') base += 150
    // Reversed logic: downturn adds supply, recovery reduces
    if (input.forestry.chinaRealEstateCondition === 'downturn') base += 150
    else if (input.forestry.chinaRealEstateCondition === 'recovery') base -= 150
    return base
  }

  // Calculate Vietnam supply
  const getVietnamSupply = () => {
    let base = 400
    if (input.forestry.vietnamExportPolicy === 'restricted') base -= 120
    else if (input.forestry.vietnamExportPolicy === 'expanded') base += 120
    return base
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

  // Calculate total APP pulp capacity addition (sum of all years except base)
  const totalAppPulpAddition = years.slice(1).reduce((sum, year) => sum + Math.max(0, input.appCapacity.appChina[year]), 0)
  
  // Calculate competitor response (simplified logic based on APP expansion)
  const getCompetitorResponse = () => {
    if (totalAppPulpAddition > 200) {
      return { expanding: 0, delaying: 4, netChange: -140 }
    } else if (totalAppPulpAddition > 100) {
      return { expanding: 1, delaying: 2, netChange: -60 }
    }
    return { expanding: 2, delaying: 1, netChange: 40 }
  }
  
  // Calculate exporter allocation (simplified)
  const getExporterAllocation = () => {
    const chinaSupply = getChinaSupply()
    const totalSupply = chinaSupply + getVietnamSupply()
    const pct = Math.round((chinaSupply / totalSupply) * 100)
    return { pct, volume: Math.round(totalSupply * 0.52) }
  }
  
  // Determine supply tightness
  const getSupplyStatus = () => {
    const total = getChinaSupply() + getVietnamSupply()
    if (total >= 1100) return { label: 'Abundant', color: 'text-green-600', bgColor: 'bg-green-100' }
    if (total >= 900) return { label: 'Balanced', color: 'text-amber-600', bgColor: 'bg-amber-100' }
    return { label: 'Tight', color: 'text-red-600', bgColor: 'bg-red-100' }
  }
  
  // Calculate downstream utilization
  const getUtilization = (demand: 'low' | 'base' | 'high') => {
    if (demand === 'high') return { pct: 88, pressure: 'Low' }
    if (demand === 'base') return { pct: 75, pressure: 'Medium' }
    return { pct: 62, pressure: 'High' }
  }
  
  const competitorResponse = getCompetitorResponse()
  const exporterAllocation = getExporterAllocation()
  const supplyStatus = getSupplyStatus()

  const content = (
    <div className="space-y-4">
      {/* AI Strategic Insights - Value Chain Flow */}
      <div className="rounded-lg border-2 border-indigo-200 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 overflow-hidden">
        <div className="px-4 py-3 border-b border-indigo-200 bg-indigo-100/50 flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-indigo-600" />
          <h3 className="font-bold text-indigo-900">AI Strategic Insights</h3>
          <span className="ml-auto text-xs text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded">Value Chain Analysis</span>
        </div>
        
        <div className="p-4">
          {/* 3-Stage Horizontal Flow */}
          <div className="grid grid-cols-[1fr_auto_1.2fr_auto_1fr] gap-2 items-stretch">
            {/* Stage 1: Forestry (LEFT) */}
            <div className="rounded-lg border border-green-200 bg-white p-3">
              <div className="flex items-center gap-2 mb-3">
                <Trees className="h-4 w-4 text-green-600" />
                <h4 className="font-semibold text-sm text-green-800">Forestry & Woodchip Supply</h4>
              </div>
              <div className="space-y-2">
                <div className="text-center p-2 rounded bg-green-50">
                  <div className="text-xs text-muted-foreground">Total Supply</div>
                  <div className="text-xl font-bold text-green-700">{getChinaSupply() + getVietnamSupply()} kt</div>
                  <span className={cn('text-xs px-1.5 py-0.5 rounded font-medium', supplyStatus.bgColor, supplyStatus.color)}>
                    {supplyStatus.label}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2 rounded bg-muted/30">
                    <div className="text-[10px] text-muted-foreground">China</div>
                    <div className="text-sm font-semibold">{getChinaSupply()} kt</div>
                  </div>
                  <div className="p-2 rounded bg-muted/30">
                    <div className="text-[10px] text-muted-foreground">Vietnam</div>
                    <div className="text-sm font-semibold">{getVietnamSupply()} kt</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Arrow: Pulp <- Forestry */}
            <div className="flex flex-col items-center justify-center px-1">
              <ArrowLeft className="h-5 w-5 text-green-500" />
              <div className="text-[9px] text-muted-foreground text-center mt-1 leading-tight">
                Drives<br/>wood demand
              </div>
            </div>
            
            {/* Stage 2: Pulp (CENTER - Primary Driver) */}
            <div className="rounded-lg border-2 border-blue-300 bg-white p-3 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Factory className="h-4 w-4 text-blue-600" />
                <h4 className="font-semibold text-sm text-blue-800">Pulp Capacity & Market Response</h4>
              </div>
              <div className="space-y-2">
                {/* APP Expansion */}
                <div className="p-2 rounded bg-red-50 border border-red-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-red-700 font-medium">APP Capacity Decision</span>
                    <span className="text-sm font-bold text-red-700">+{totalAppPulpAddition} kt</span>
                  </div>
                </div>
                {/* Competitor Response */}
                <div className="p-2 rounded bg-blue-50 border border-blue-100">
                  <div className="flex items-center gap-1 mb-1">
                    <Users className="h-3 w-3 text-blue-600" />
                    <span className="text-xs text-blue-700 font-medium">Competitor Response</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold text-blue-800">{competitorResponse.expanding} expanding, {competitorResponse.delaying} delaying</span>
                    <span className={cn(
                      'ml-2 font-bold',
                      competitorResponse.netChange >= 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                      {competitorResponse.netChange >= 0 ? '+' : ''}{competitorResponse.netChange} kt
                    </span>
                  </div>
                </div>
                {/* Exporter Allocation */}
                <div className="p-2 rounded bg-indigo-50 border border-indigo-100">
                  <div className="flex items-center gap-1 mb-1">
                    <Globe className="h-3 w-3 text-indigo-600" />
                    <span className="text-xs text-indigo-700 font-medium">Exporter China Allocation</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold text-indigo-800">{exporterAllocation.pct}%</span>
                    <span className="text-muted-foreground ml-1">({exporterAllocation.volume} kt to China)</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Arrow: Pulp -> Downstream */}
            <div className="flex flex-col items-center justify-center px-1">
              <ArrowRight className="h-5 w-5 text-purple-500" />
              <div className="text-[9px] text-muted-foreground text-center mt-1 leading-tight">
                Requires<br/>absorption
              </div>
            </div>
            
            {/* Stage 3: Downstream (RIGHT) */}
            <div className="rounded-lg border border-purple-200 bg-white p-3">
              <div className="flex items-center gap-2 mb-3">
                <Package className="h-4 w-4 text-purple-600" />
                <h4 className="font-semibold text-sm text-purple-800">Downstream Absorption</h4>
              </div>
              <div className="space-y-2">
                {/* Paper */}
                <div className="p-2 rounded bg-purple-50/50 border border-purple-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium flex items-center gap-1">
                      <FileText className="h-3 w-3" /> Paper
                    </span>
                    <span className="text-xs">{getUtilization(input.downstream.paperDemand).pct}% util</span>
                  </div>
                  <div className={cn(
                    'text-[10px] mt-0.5',
                    getUtilization(input.downstream.paperDemand).pressure === 'Low' ? 'text-green-600' :
                    getUtilization(input.downstream.paperDemand).pressure === 'High' ? 'text-red-600' : 'text-amber-600'
                  )}>
                    Margin Pressure: {getUtilization(input.downstream.paperDemand).pressure}
                  </div>
                </div>
                {/* Board */}
                <div className="p-2 rounded bg-purple-50/50 border border-purple-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium flex items-center gap-1">
                      <Package className="h-3 w-3" /> Board
                    </span>
                    <span className="text-xs">{getUtilization(input.downstream.boardDemand).pct}% util</span>
                  </div>
                  <div className={cn(
                    'text-[10px] mt-0.5',
                    getUtilization(input.downstream.boardDemand).pressure === 'Low' ? 'text-green-600' :
                    getUtilization(input.downstream.boardDemand).pressure === 'High' ? 'text-red-600' : 'text-amber-600'
                  )}>
                    Margin Pressure: {getUtilization(input.downstream.boardDemand).pressure}
                  </div>
                </div>
                {/* Tissue */}
                <div className="p-2 rounded bg-purple-50/50 border border-purple-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium flex items-center gap-1">
                      <Bath className="h-3 w-3" /> Tissue
                    </span>
                    <span className="text-xs">{getUtilization(input.downstream.tissueDemand).pct}% util</span>
                  </div>
                  <div className={cn(
                    'text-[10px] mt-0.5',
                    getUtilization(input.downstream.tissueDemand).pressure === 'Low' ? 'text-green-600' :
                    getUtilization(input.downstream.tissueDemand).pressure === 'High' ? 'text-red-600' : 'text-amber-600'
                  )}>
                    Margin Pressure: {getUtilization(input.downstream.tissueDemand).pressure}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom Insights Layer - 3 Columns */}
          <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-indigo-200">
            {/* Upstream Insights */}
            <div className="p-2 rounded bg-green-50/50">
              <h5 className="text-[10px] font-semibold text-green-700 uppercase tracking-wide mb-1">Upstream Insight</h5>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {totalAppPulpAddition > 100 
                  ? `APP expansion increases wood demand${input.forestry.chinaRealEstateCondition === 'downturn' ? ', but weak real estate frees up domestic supply.' : ', tightening supply amid strong construction demand.'}`
                  : 'Moderate capacity plans maintain stable wood demand balance.'
                }
              </p>
            </div>
            {/* Market Dynamics */}
            <div className="p-2 rounded bg-blue-50/50">
              <h5 className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide mb-1">Market Dynamics</h5>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {competitorResponse.delaying > competitorResponse.expanding
                  ? `Strong APP expansion triggers ${competitorResponse.delaying} competitor delays. Exporters shift ${exporterAllocation.pct}% allocation to China.`
                  : `Balanced expansion environment with ${competitorResponse.expanding} competitors expanding alongside APP.`
                }
              </p>
            </div>
            {/* Downstream Risks */}
            <div className="p-2 rounded bg-purple-50/50">
              <h5 className="text-[10px] font-semibold text-purple-700 uppercase tracking-wide mb-1">Downstream Risk</h5>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {totalAppPulpAddition > 150 && input.downstream.paperDemand !== 'high'
                  ? 'New pulp capacity exceeds internal absorption. Risk of oversupply and margin compression in paper/board.'
                  : 'Downstream demand appears sufficient to absorb planned capacity additions.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

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
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-medium">
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
            <table className="w-full text-sm">
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
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-medium">
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
                <table className="w-full text-sm">
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
                <table className="w-full text-sm">
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
                <table className="w-full text-sm">
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
