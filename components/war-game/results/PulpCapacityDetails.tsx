'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Globe, ArrowRight, TrendingUp, TrendingDown, Building2, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AIBadge } from '../shared/AIBadge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { SimulationResult } from '@/lib/types/war-game'
import { PLAYERS } from '@/lib/data/initial-data'

interface PulpCapacityDetailsProps {
  result: SimulationResult
}

const YEARS = [2026, 2027, 2028, 2029, 2030, 2031] as const

/**
 * Pulp stage detailed analysis sections that render BEFORE the shared
 * Market Data section. Order: Market Impact Summary, APP Capacity Outcome,
 * Competitor Response.
 */
export function PulpCapacityDetails({ result }: PulpCapacityDetailsProps) {
  const { competitorChanges, input } = result
  const years = YEARS

  // APP capacity calculations
  const appChinaPulpAdd = input.appCapacity.guangxi.pulpCapacity + input.appCapacity.jiangsuFujian.pulpCapacity
  const appChinaBoardAdd =
    (input.appCapacity.guangxi.includeBoard ? input.appCapacity.guangxi.boardCapacity : 0) +
    (input.appCapacity.jiangsuFujian.includeBoard ? input.appCapacity.jiangsuFujian.boardCapacity : 0)
  const appChinaTissueAdd =
    (input.appCapacity.guangxi.includeTissue ? input.appCapacity.guangxi.tissueCapacity : 0) +
    (input.appCapacity.jiangsuFujian.includeTissue ? input.appCapacity.jiangsuFujian.tissueCapacity : 0)

  // Competitor summary
  const competitorsExpanding = competitorChanges.filter(c => c.action === 'add').length
  const competitorsDelaying = competitorChanges.filter(c => c.action === 'delay').length
  const totalCompetitorPulpChange = competitorChanges.reduce((sum, c) => sum + c.pulpChange, 0)

  return (
    <div className="space-y-4">
      {/* Section 1: Market Impact Summary */}
      <Card id="pulp-market-impact" className="border-border/50 bg-blue-50/30 scroll-mt-96">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2 text-blue-700">
            <BarChart3 className="h-4 w-4 text-blue-600" />
            Market Impact Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Impact Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-base">
              <thead>
                <tr className="border-b border-blue-200">
                  <th className="text-left py-3 px-4 text-base font-semibold text-blue-700 w-40">Metric</th>
                  {years.map(year => (
                    <th key={year} className="text-center py-3 px-4 text-base font-semibold text-blue-700">{year}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Net Supply Change Row */}
                <tr className="border-b border-blue-100 bg-white/50">
                  <td className="py-3 px-4 text-base font-medium text-amber-700">Net Supply Change</td>
                  {years.map((year, idx) => {
                    const yearlySupplyChange = idx === 0 ? 0 :
                      Math.round((appChinaPulpAdd + totalCompetitorPulpChange) * (idx * 0.15 - 0.1))
                    return (
                      <td key={year} className="text-center py-3 px-4">
                        {idx === 0 ? (
                          <span className="text-muted-foreground">-</span>
                        ) : (
                          <span className={cn(
                            'text-base font-medium',
                            yearlySupplyChange > 0 ? 'text-emerald-600' : yearlySupplyChange < 0 ? 'text-amber-600' : 'text-muted-foreground'
                          )}>
                            {yearlySupplyChange > 0 ? '+' : ''}{yearlySupplyChange} <span className="text-xs text-muted-foreground">kt</span>
                          </span>
                        )}
                      </td>
                    )
                  })}
                </tr>
                {/* Price Signal Row */}
                <tr className="bg-white/30">
                  <td className="py-3 px-4 text-base font-medium text-muted-foreground">Price Signal</td>
                  {years.map((year, idx) => {
                    const totalChange = appChinaPulpAdd + totalCompetitorPulpChange
                    const priceSignal = idx === 0 ? null :
                      totalChange > 400 ? 'Declining' :
                      totalChange > 200 ? 'Pressured' : 'Stable'
                    return (
                      <td key={year} className="text-center py-3 px-4">
                        {idx === 0 ? (
                          <span className="text-muted-foreground">-</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-base text-muted-foreground">
                            <ArrowRight className="h-3.5 w-3.5" />
                            {priceSignal}
                          </span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4 pt-2">
            {/* Supply Impact */}
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <div className="text-base text-blue-600 font-semibold mb-2">Supply Impact</div>
              <div className="text-3xl font-bold text-blue-700 leading-tight tracking-tight">
                +{appChinaPulpAdd + totalCompetitorPulpChange} kt
              </div>
              <div className="text-base text-muted-foreground mt-1">Net capacity addition</div>
              <div className="mt-3 pt-3 border-t border-blue-200 space-y-1.5">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">APP China</span>
                  <span className="text-red-600 font-semibold tabular-nums">+{appChinaPulpAdd} kt</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Competitors</span>
                  <span className={cn(
                    'font-semibold tabular-nums',
                    totalCompetitorPulpChange >= 0 ? 'text-emerald-600' : 'text-amber-600'
                  )}>
                    {totalCompetitorPulpChange >= 0 ? '+' : ''}{totalCompetitorPulpChange} kt
                  </span>
                </div>
              </div>
            </div>

            {/* Price Pressure */}
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
              <div className="text-base text-amber-600 font-semibold mb-2">Price Pressure</div>
              <div className={cn(
                'text-3xl font-bold leading-tight tracking-tight',
                (appChinaPulpAdd + totalCompetitorPulpChange) > 400 ? 'text-red-600' :
                (appChinaPulpAdd + totalCompetitorPulpChange) > 200 ? 'text-amber-600' : 'text-emerald-600'
              )}>
                {(appChinaPulpAdd + totalCompetitorPulpChange) > 400 ? 'High' :
                 (appChinaPulpAdd + totalCompetitorPulpChange) > 200 ? 'Moderate' : 'Low'}
              </div>
              <div className="text-base text-muted-foreground mt-1">Expected margin compression</div>
              <div className="mt-3 pt-3 border-t border-amber-200">
                <div className="flex items-center gap-2">
                  {(appChinaPulpAdd + totalCompetitorPulpChange) > 400 ? (
                    <TrendingDown className="h-4 w-4 text-red-500 flex-shrink-0" />
                  ) : (appChinaPulpAdd + totalCompetitorPulpChange) > 200 ? (
                    <TrendingDown className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  ) : (
                    <TrendingUp className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  )}
                  <span className="text-sm text-muted-foreground leading-snug">
                    {(appChinaPulpAdd + totalCompetitorPulpChange) > 400
                      ? 'Significant oversupply risk'
                      : (appChinaPulpAdd + totalCompetitorPulpChange) > 200
                        ? 'Balanced supply-demand'
                        : 'Favorable pricing environment'}
                  </span>
                </div>
              </div>
            </div>

            {/* Competitive Position */}
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
              <div className="text-base text-emerald-600 font-semibold mb-2">Competitive Position</div>
              <div className="text-3xl font-bold text-emerald-700 leading-tight tracking-tight">
                {competitorsDelaying > competitorsExpanding ? 'Strong' :
                 competitorsDelaying === competitorsExpanding ? 'Neutral' : 'Challenged'}
              </div>
              <div className="text-base text-muted-foreground mt-1">APP market position outlook</div>
              <div className="mt-3 pt-3 border-t border-emerald-200 space-y-1.5">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Deterred competitors</span>
                  <span className="text-amber-600 font-semibold tabular-nums">{competitorsDelaying}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Following competitors</span>
                  <span className="text-emerald-600 font-semibold tabular-nums">{competitorsExpanding}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: APP Capacity Outcome */}
      <Card id="pulp-app-capacity" className="border-2 border-red-200 bg-red-50/30 scroll-mt-96">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-4 w-4 text-red-600" />
              APP Capacity Outcome
            </CardTitle>
            <span className={cn(
              'px-3 py-1 rounded-full text-sm font-semibold',
              appChinaPulpAdd > 250 && 'bg-red-100 text-red-700',
              appChinaPulpAdd > 100 && appChinaPulpAdd <= 250 && 'bg-amber-100 text-amber-700',
              appChinaPulpAdd <= 100 && 'bg-blue-100 text-blue-700'
            )}>
              {appChinaPulpAdd > 250 ? 'Aggressive' : appChinaPulpAdd > 100 ? 'Balanced' : 'Defensive'}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-base">
              <thead>
                <tr className="border-b border-red-200">
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground w-48">Metric</th>
                  {years.map(year => (
                    <th key={year} className="text-center py-2 px-3 font-medium text-muted-foreground">{year}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-red-100 bg-red-50">
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-red-600" />
                      <span className="font-semibold text-red-700">APP China Capacity</span>
                    </div>
                  </td>
                  {years.map(year => {
                    const value = input.appCapacity.appChina[year]
                    return (
                      <td key={year} className="text-center py-2.5 px-3">
                        <span className={cn(
                          'font-mono font-bold',
                          year === 2026 ? 'text-red-700' : value > 0 ? 'text-emerald-600' : 'text-muted-foreground'
                        )}>
                          {year === 2026 ? value : value > 0 ? `+${value}` : '-'}
                        </span>
                      </td>
                    )
                  })}
                </tr>
                <tr className="border-b border-red-100">
                  <td className="py-2.5 px-3">
                    <span className="text-red-600">Market Release (70%)</span>
                  </td>
                  {years.map(year => {
                    const value = input.appCapacity.appChina[year]
                    const release = Math.round(value * 0.7)
                    return (
                      <td key={year} className="text-center py-2.5 px-3 font-mono text-red-500">
                        {year === 2026 ? release : release > 0 ? `+${release}` : '-'}
                      </td>
                    )
                  })}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="p-3 rounded-lg bg-white border border-red-200 text-center">
              <div className="text-xs text-muted-foreground">Total Pulp Added</div>
              <div className="text-xl font-bold text-red-600">+{appChinaPulpAdd} kt</div>
            </div>
            <div className="p-3 rounded-lg bg-white border border-red-200 text-center">
              <div className="text-xs text-muted-foreground">Board Capacity</div>
              <div className="text-xl font-bold text-red-500">+{appChinaBoardAdd} kt</div>
            </div>
            <div className="p-3 rounded-lg bg-white border border-red-200 text-center">
              <div className="text-xs text-muted-foreground">Tissue Capacity</div>
              <div className="text-xl font-bold text-red-500">+{appChinaTissueAdd} kt</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Competitor Response */}
      <Card id="pulp-competitor-response" className="border-border/50 bg-card/80 scroll-mt-96">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Competitor Response
            </CardTitle>
            <AIBadge size="sm" />
          </div>
        </CardHeader>
        <CardContent>
          <TooltipProvider>
            <div className="overflow-x-auto">
              <table className="w-full table-fixed text-base">
                <thead>
                  <tr className="border-b border-border/50">
                  <th className="text-left py-3 px-2 text-base font-semibold text-muted-foreground" style={{ width: '12%' }}>Player</th>
                  <th className="text-left py-3 px-2 text-base font-semibold text-muted-foreground" style={{ width: '14%' }}>Strategy</th>
                  {years.map(year => (
                    <th key={year} className="text-center py-3 px-2 text-base font-semibold text-muted-foreground" style={{ width: '9%' }}>{year}</th>
                  ))}
                  <th className="text-left py-3 px-2 text-base font-semibold text-muted-foreground" style={{ width: '11%' }}>Action</th>
                  <th className="text-left py-3 px-2 text-base font-semibold text-muted-foreground" style={{ width: '23%' }}>Rationale</th>
                  </tr>
                </thead>
                <tbody>
                  {competitorChanges.map(change => {
                    const player = PLAYERS.find(p => p.id === change.playerId)!
                    // Strategy MUST be derived directly from Competitor Configure → Behavior Settings → Capacity Reaction Style
                    const competitorConfig = input.competitorConfig?.find(c => c.playerId === change.playerId)
                    const capacityReactionStyle = competitorConfig?.behaviorSettings?.capacityReactionStyle || 'defensive'

                    const yearlyChange = {
                      2026: player.pulpCapacity || 100,
                      2027: change.action === 'add' ? Math.round(change.pulpChange * 0.2) : change.action === 'delay' ? -Math.round(change.pulpChange * 0.3) : 0,
                      2028: change.action === 'add' ? Math.round(change.pulpChange * 0.3) : change.action === 'delay' ? -Math.round(change.pulpChange * 0.2) : 0,
                      2029: change.action === 'add' ? Math.round(change.pulpChange * 0.25) : 0,
                      2030: change.action === 'add' ? Math.round(change.pulpChange * 0.15) : change.action === 'delay' ? Math.round(change.pulpChange * 0.3) : 0,
                      2031: change.action === 'add' ? Math.round(change.pulpChange * 0.1) : change.action === 'delay' ? Math.round(change.pulpChange * 0.2) : 0,
                    }

                    const getStrategyFromConfig = () => {
                      const strategyMap: Record<string, { label: string; color: string; tooltip: string }> = {
                        'aggressive': {
                          label: 'Aggressive',
                          color: 'bg-red-100 text-red-700 border-red-200',
                          tooltip: 'Actively matches or exceeds competitor expansion to gain market share'
                        },
                        'follow-the-leader': {
                          label: 'Follow-the-Leader',
                          color: 'bg-blue-100 text-blue-700 border-blue-200',
                          tooltip: 'Follows market leader expansion with calibrated delay to maintain position'
                        },
                        'defensive': {
                          label: 'Defensive',
                          color: 'bg-amber-100 text-amber-700 border-amber-200',
                          tooltip: 'Prioritizes utilization and avoids aggressive expansion'
                        }
                      }
                      return strategyMap[capacityReactionStyle] || strategyMap['defensive']
                    }

                    const getRationale = () => {
                      if (capacityReactionStyle === 'aggressive') {
                        return 'Aggressive expansion to capture market share ahead of demand'
                      } else if (capacityReactionStyle === 'follow-the-leader') {
                        return 'Following APP expansion with calibrated delay to maintain market position'
                      } else {
                        return 'Prioritizing utilization rates; delaying expansion until market clarity improves'
                      }
                    }

                    const strategy = getStrategyFromConfig()

                    return (
                      <tr key={change.playerId} className={cn(
                        'border-b border-border/30',
                        change.action === 'delay' && 'bg-amber-50/50',
                        change.action === 'add' && 'bg-emerald-50/50'
                      )}>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: player.color }} />
                            <span className="font-semibold text-base truncate">{player.nameCn}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className={cn(
                                'inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium border cursor-help whitespace-nowrap',
                                strategy.color
                              )}>
                                {strategy.label}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p className="text-xs font-medium">{strategy.tooltip}</p>
                            </TooltipContent>
                          </Tooltip>
                        </td>
                        {years.map(year => {
                          const val = yearlyChange[year]
                          const isBase = year === 2026
                          return (
                            <td key={year} className="text-center py-3 px-2">
                              <span className={cn(
                                'font-mono text-base',
                                isBase ? 'text-muted-foreground' : val > 0 ? 'text-emerald-600 font-bold' : val < 0 ? 'text-amber-600 font-bold' : 'text-muted-foreground'
                              )}>
                                {isBase ? val : val > 0 ? `+${val}` : val < 0 ? val : '-'}
                              </span>
                            </td>
                          )
                        })}
                        <td className="py-3 px-2">
                          <span className={cn(
                            'px-2.5 py-1 rounded text-sm font-semibold whitespace-nowrap',
                            change.action === 'add' && 'bg-emerald-100 text-emerald-700',
                            change.action === 'delay' && 'bg-amber-100 text-amber-700',
                            change.action === 'maintain' && 'bg-gray-100 text-gray-700'
                          )}>
                            {change.action === 'add' ? 'Expanding' : change.action === 'delay' ? 'Delaying' : 'Maintaining'}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <p className="text-base text-muted-foreground leading-snug">
                            {getRationale()}
                          </p>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </TooltipProvider>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Global Export Reallocation is rendered AFTER the shared Market Data section
 * on the Pulp Capacity & Competitors tab.
 */
export function PulpExportReallocation({ result }: PulpCapacityDetailsProps) {
  const { exporterAllocations } = result

  return (
    <Card id="pulp-export-reallocation" className="border-border/50 bg-card/80 scroll-mt-96">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="h-4 w-4 text-indigo-600" />
            Global Export Reallocation
          </CardTitle>
          <AIBadge size="sm" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-base">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-2 px-3 font-medium text-muted-foreground w-40">Exporter</th>
                <th className="text-center py-2 px-3 font-medium text-muted-foreground">Total Volume</th>
                <th className="text-center py-2 px-3 font-medium text-muted-foreground">China Share</th>
                <th className="text-center py-2 px-3 font-medium text-muted-foreground">China Volume</th>
                <th className="text-center py-2 px-3 font-medium text-muted-foreground">ROW Volume</th>
              </tr>
            </thead>
            <tbody>
              {exporterAllocations.map(allocation => {
                const player = PLAYERS.find(p => p.id === allocation.playerId)
                const totalVolume = allocation.chinaVolume + allocation.otherRegionsVolume
                return (
                  <tr key={allocation.playerId} className="border-b border-border/30">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        {player && <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: player.color }} />}
                        <span className="font-medium">{player?.name || allocation.playerId}</span>
                      </div>
                    </td>
                    <td className="text-center py-2.5 px-3 font-mono">{totalVolume} kt</td>
                    <td className="text-center py-2.5 px-3">
                      <span className={cn(
                        'font-semibold',
                        allocation.chinaShare > 0.5 ? 'text-blue-600' : 'text-amber-600'
                      )}>
                        {Math.round(allocation.chinaShare * 100)}%
                      </span>
                    </td>
                    <td className="text-center py-2.5 px-3 font-mono text-blue-600">{allocation.chinaVolume} kt</td>
                    <td className="text-center py-2.5 px-3 font-mono text-muted-foreground">{allocation.otherRegionsVolume} kt</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

