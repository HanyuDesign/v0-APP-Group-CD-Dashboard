'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trees, Factory, Package, ClipboardList, TrendingUp, TrendingDown, FileText, Bath } from 'lucide-react'
import { cn } from '@/lib/utils'
import { POLICY_LABELS } from '@/lib/data/initial-data'
import type { SimulationInput } from '@/lib/types/war-game'

interface OverviewPanelProps {
  input: SimulationInput
  showHeader?: boolean
}

export function OverviewPanel({ input, showHeader = true }: OverviewPanelProps) {
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

  // Competitor data for downstream segments (positive additions only)
  const downstreamCompetitorData = {
    paper: [
      { name: 'Sun Paper', capacity: { 2026: 150, 2027: 0, 2028: 0, 2029: 0, 2030: 0, 2031: 0 } },
      { name: 'Chenming', capacity: { 2026: 100, 2027: 0, 2028: 0, 2029: 0, 2030: 0, 2031: 0 } },
      { name: 'Liansheng', capacity: { 2026: 60, 2027: 0, 2028: 0, 2029: 0, 2030: 0, 2031: 0 } },
      { name: 'Others', capacity: { 2026: 200, 2027: 0, 2028: 0, 2029: 0, 2030: 0, 2031: 0 } },
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

  const content = (
    <div className="space-y-4">
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
                {/* Competitor rows */}
                {competitorPulpData.map((competitor) => (
                  <tr key={competitor.name} className="border-b border-border/30">
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: competitor.color }} />
                        <span className="font-medium text-muted-foreground">{competitor.name}</span>
                      </div>
                    </td>
                    {years.map(year => {
                      const value = competitor.capacity[year]
                      return (
                        <td key={year} className="text-center py-2 px-2 font-mono">
                          {year === 2026 ? (
                            <span className="text-muted-foreground">{value}</span>
                          ) : (
                            <span className={cn(
                              value > 0 && 'text-green-600',
                              value === 0 && 'text-muted-foreground'
                            )}>
                              {value > 0 ? `+${value}` : '-'}
                            </span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
                {/* APP China row - highlighted */}
                <tr className="bg-red-50 border-2 border-[#cc0000]/30">
                  <td className="py-2 px-2">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-[#cc0000]" />
                      <span className="font-bold text-[#cc0000]">APP China</span>
                    </div>
                  </td>
                  {years.map(year => {
                    const value = input.appCapacity.appChina[year]
                    return (
                      <td key={year} className="text-center py-2 px-2 font-mono font-semibold">
                        {year === 2026 ? (
                          <span className="text-[#cc0000]">{value}</span>
                        ) : (
                          <span className={cn(
                            value > 0 && 'text-green-600',
                            value === 0 && 'text-muted-foreground'
                          )}>
                            {value > 0 ? `+${value}` : '-'}
                          </span>
                        )}
                      </td>
                    )
                  })}
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

          {/* Supply Block */}
          <div className="rounded-lg border-2 border-red-200 bg-red-50/50 p-3">
            <h4 className="text-sm font-bold text-red-800 mb-3 flex items-center gap-1.5">
              <Factory className="h-4 w-4" />
              Supply Capacity Additions (kt)
            </h4>
            <div className="space-y-3">
              {/* Paper Supply */}
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
                    {downstreamCompetitorData.paper.map(c => (
                      <tr key={c.name} className="border-b border-border/30">
                        <td className="py-2 px-2 text-muted-foreground">{c.name}</td>
                        {years.map(y => (
                          <td key={y} className={cn('text-center py-2 px-2 font-mono', y !== 2026 && c.capacity[y] > 0 && 'text-green-600')}>
                            {y === 2026 ? c.capacity[y] : c.capacity[y] > 0 ? `+${c.capacity[y]}` : '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr className="bg-red-100/50 font-semibold">
                      <td className="py-2 px-2 text-[#cc0000]">APP China</td>
                      {years.map(y => {
                        const value = input.downstream.supply.paper.appChina[y]
                        return (
                          <td key={y} className={cn(
                            'text-center py-2 px-2 font-mono',
                            y !== 2026 && value > 0 && 'text-green-600'
                          )}>
                            {y === 2026 ? value : value > 0 ? `+${value}` : '-'}
                          </td>
                        )
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Board Supply */}
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
                    {downstreamCompetitorData.board.map(c => (
                      <tr key={c.name} className="border-b border-border/30">
                        <td className="py-2 px-2 text-muted-foreground">{c.name}</td>
                        {years.map(y => (
                          <td key={y} className={cn('text-center py-2 px-2 font-mono', y !== 2026 && c.capacity[y] > 0 && 'text-green-600')}>
                            {y === 2026 ? c.capacity[y] : c.capacity[y] > 0 ? `+${c.capacity[y]}` : '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr className="bg-red-100/50 font-semibold">
                      <td className="py-2 px-2 text-[#cc0000]">APP China</td>
                      {years.map(y => {
                        const value = input.downstream.supply.board.appChina[y]
                        return (
                          <td key={y} className={cn(
                            'text-center py-2 px-2 font-mono',
                            y !== 2026 && value > 0 && 'text-green-600'
                          )}>
                            {y === 2026 ? value : value > 0 ? `+${value}` : '-'}
                          </td>
                        )
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Tissue Supply */}
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
                    {downstreamCompetitorData.tissue.map(c => (
                      <tr key={c.name} className="border-b border-border/30">
                        <td className="py-2 px-2 text-muted-foreground">{c.name}</td>
                        {years.map(y => (
                          <td key={y} className={cn('text-center py-2 px-2 font-mono', y !== 2026 && c.capacity[y] > 0 && 'text-green-600')}>
                            {y === 2026 ? c.capacity[y] : c.capacity[y] > 0 ? `+${c.capacity[y]}` : '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr className="bg-red-100/50 font-semibold">
                      <td className="py-2 px-2 text-[#cc0000]">APP China</td>
                      {years.map(y => {
                        const value = input.downstream.supply.tissue.appChina[y]
                        return (
                          <td key={y} className={cn(
                            'text-center py-2 px-2 font-mono',
                            y !== 2026 && value > 0 && 'text-green-600'
                          )}>
                            {y === 2026 ? value : value > 0 ? `+${value}` : '-'}
                          </td>
                        )
                      })}
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
