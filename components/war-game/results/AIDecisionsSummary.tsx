'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { FileText, Package, Bath, Bot, Building2, Lightbulb, TrendingUp, TrendingDown, Minus, Globe, Factory, BarChart3, ArrowUp, ArrowDown, ArrowRight, ChevronUp, ChevronDown } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { AIBadge } from '../shared/AIBadge'
import { TrafficLight } from '../shared/TrafficLight'
import type { SimulationResult } from '@/lib/types/war-game'
import { PLAYERS } from '@/lib/data/initial-data'

interface AIDecisionsSummaryProps {
  result: SimulationResult
}

export function AIDecisionsSummary({ result }: AIDecisionsSummaryProps) {
  const { competitorChanges, exporterAllocations, segmentOutcomes, input } = result

  // Years constant
  const years = [2026, 2027, 2028, 2029, 2030, 2031] as const

  // Calculate APP's capacity decisions from input
  const appChinaPlayer = PLAYERS.find(p => p.id === 'app-china')!
  const appIndonesiaPlayer = PLAYERS.find(p => p.id === 'app-indonesia')!

  // APP China new capacity from Guangxi + Jiangsu/Fujian
  const appChinaPulpAdd = input.appCapacity.guangxi.pulpCapacity + input.appCapacity.jiangsuFujian.pulpCapacity
  const appChinaBoardAdd = 
    (input.appCapacity.guangxi.includeBoard ? input.appCapacity.guangxi.boardCapacity : 0) +
    (input.appCapacity.jiangsuFujian.includeBoard ? input.appCapacity.jiangsuFujian.boardCapacity : 0)
  const appChinaTissueAdd = 
    (input.appCapacity.guangxi.includeTissue ? input.appCapacity.guangxi.tissueCapacity : 0) +
    (input.appCapacity.jiangsuFujian.includeTissue ? input.appCapacity.jiangsuFujian.tissueCapacity : 0)
  const appChinaDownstreamAdd = appChinaBoardAdd + appChinaTissueAdd

  // Calculate competitor response summary
  const competitorsExpanding = competitorChanges.filter(c => c.action === 'add').length
  const competitorsDelaying = competitorChanges.filter(c => c.action === 'delay').length
  const competitorsMaintaining = competitorChanges.filter(c => c.action === 'maintain').length
  const totalCompetitorPulpChange = competitorChanges.reduce((sum, c) => sum + c.pulpChange, 0)
  const totalCompetitorDownstreamChange = competitorChanges.reduce((sum, c) => sum + c.downstreamChange, 0)

  // Calculate exporter allocation summary
  const avgChinaShare = exporterAllocations.length > 0 
    ? exporterAllocations.reduce((sum, e) => sum + e.chinaShare, 0) / exporterAllocations.length 
    : 0
  const totalChinaExports = exporterAllocations.reduce((sum, e) => sum + e.chinaVolume, 0)

  // Generate AI insights
  const generateInsights = () => {
    const insights: string[] = []
    
    // APP strategy insight
    if (appChinaPulpAdd > 200) {
      insights.push(`APP's aggressive expansion (+${appChinaPulpAdd} kt pulp) signals strong market confidence and aims to capture dominant position in China.`)
    } else if (appChinaPulpAdd > 0) {
      insights.push(`APP's moderate capacity addition (+${appChinaPulpAdd} kt pulp) positions for growth while managing risk.`)
    }

    // Competitor response insight
    if (competitorsDelaying > competitorsExpanding) {
      insights.push(`Competitors are largely defensive: ${competitorsDelaying} players delaying vs ${competitorsExpanding} expanding, suggesting APP's move creates market uncertainty.`)
    } else if (competitorsExpanding > competitorsDelaying) {
      insights.push(`Market sees growth opportunity: ${competitorsExpanding} competitors also expanding, indicating potential oversupply risk.`)
    } else {
      insights.push(`Mixed competitor response: market participants are cautiously watching APP's moves before committing.`)
    }

    // Exporter allocation insight
    if (avgChinaShare > 0.5) {
      insights.push(`Exporters prioritizing China market (${Math.round(avgChinaShare * 100)}% avg allocation), indicating attractive pricing vs other regions.`)
    } else {
      insights.push(`Exporters diversifying away from China (${Math.round(avgChinaShare * 100)}% avg allocation), potentially due to local capacity additions pressuring prices.`)
    }

    // Market balance insight
    const tightSegments = segmentOutcomes.filter(s => s.supplyDemandBalance < -20).length
    const oversuppliedSegments = segmentOutcomes.filter(s => s.supplyDemandBalance > 50).length
    if (tightSegments > 0) {
      insights.push(`${tightSegments} downstream segment(s) showing supply shortage, creating pricing power opportunity.`)
    }
    if (oversuppliedSegments > 0) {
      insights.push(`${oversuppliedSegments} downstream segment(s) facing oversupply pressure, margin compression expected.`)
    }

    return insights
  }

  const insights = generateInsights()

  // Segment icons mapping
  const segmentIcons: Record<string, React.ReactNode> = {
    paper: <FileText className="h-4 w-4 text-muted-foreground" />,
    board: <Package className="h-4 w-4 text-chart-3" />,
    tissue: <Bath className="h-4 w-4 text-chart-2" />,
  }

  const segmentLabels: Record<string, string> = {
    paper: 'Paper',
    board: 'Packaging / Board',
    tissue: 'Tissue',
  }

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-3 rounded-lg bg-primary/5 border border-primary/20 px-4 py-3">
        <Bot className="h-5 w-5 text-primary" />
        <div>
          <h3 className="font-semibold text-primary">AI Simulation Decisions</h3>
          <p className="text-xs text-muted-foreground">
            Competitor and exporter responses generated by AI agents based on your inputs
          </p>
        </div>
      </div>

      {/* AI Insights Overview - High-tech light purple theme */}
      <Card className="border-purple-300 bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 shadow-lg shadow-purple-200/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm text-purple-700">
            <Lightbulb className="h-4 w-4 text-purple-600" />
            AI Strategic Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 mb-4">
            {/* APP Strategy Summary */}
            <div className="rounded-lg bg-purple-100 border border-purple-200 p-3">
              <p className="text-xs text-purple-600 mb-1">APP Expansion</p>
              <p className="text-xl font-bold text-purple-700">+{appChinaPulpAdd} kt</p>
              <p className="text-xs text-purple-500">Pulp capacity</p>
            </div>
            
            {/* Competitor Response Summary */}
            <div className="rounded-lg bg-white/80 border border-purple-200 p-3">
              <p className="text-xs text-purple-600 mb-1">Competitor Response</p>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-xl font-bold text-gray-800">{competitorsExpanding}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Minus className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-xl font-bold text-gray-800">{competitorsMaintaining}</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingDown className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-xl font-bold text-gray-800">{competitorsDelaying}</span>
                </div>
              </div>
              <p className="text-xs text-purple-500 mt-1">
                Net: {totalCompetitorPulpChange > 0 ? '+' : ''}{totalCompetitorPulpChange} kt pulp
              </p>
            </div>
            
            {/* Exporter Summary */}
            <div className="rounded-lg bg-white/80 border border-purple-200 p-3">
              <p className="text-xs text-purple-600 mb-1">Exporter China Focus</p>
              <p className="text-xl font-bold text-gray-800">{Math.round(avgChinaShare * 100)}%</p>
              <p className="text-xs text-purple-500">{totalChinaExports} kt to China</p>
            </div>
            
            {/* Market Balance Summary */}
            <div className="rounded-lg bg-white/80 border border-purple-200 p-3">
              <p className="text-xs text-purple-600 mb-1">Downstream Health</p>
              <div className="flex items-center gap-2">
                {segmentOutcomes.map(s => (
                  <div
                    key={s.segment}
                    className={cn(
                      'h-7 w-7 rounded-full flex items-center justify-center',
                      s.utilization >= 90 && 'bg-emerald-500',
                      s.utilization >= 80 && s.utilization < 90 && 'bg-amber-500',
                      s.utilization < 80 && 'bg-red-500'
                    )}
                  >
                    <span className="text-xl font-bold text-white">
                      {s.segment.charAt(0).toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-purple-500 mt-1">
                Avg util: {Math.round(segmentOutcomes.reduce((s, o) => s + o.utilization, 0) / segmentOutcomes.length)}%
              </p>
            </div>
          </div>
          
          {/* Insight bullets */}
          <div className="space-y-2 border-t border-purple-200 pt-3">
            {insights.map((insight, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <span className="text-purple-600 font-bold mt-0.5">•</span>
                <p className="text-gray-700">{insight}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Section: Pulp Capacity Decisions & Downstream Outcomes */}
      <Tabs defaultValue="pulp" className="w-full">
        <TabsList className="mb-4 grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="pulp" className="gap-2">
            <Factory className="h-4 w-4" />
            Pulp Capacity Decisions
          </TabsTrigger>
          <TabsTrigger value="downstream" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Downstream Outcomes
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Pulp Capacity Decisions - Redesigned as Results View */}
        <TabsContent value="pulp">
          <TooltipProvider>
            <div className="space-y-4">
              {/* SECTION 1: APP Capacity Outcome */}
              <Card className="border-2 border-[#cc0000]/30 bg-red-50/30">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-[#cc0000]" />
                      APP Capacity Outcome
                    </CardTitle>
                    {/* Strategy Label */}
                    <span className={cn(
                      'px-3 py-1 rounded-full text-xs font-semibold',
                      appChinaPulpAdd > 250 && 'bg-red-100 text-red-700',
                      appChinaPulpAdd > 100 && appChinaPulpAdd <= 250 && 'bg-amber-100 text-amber-700',
                      appChinaPulpAdd <= 100 && 'bg-blue-100 text-blue-700'
                    )}>
                      {appChinaPulpAdd > 250 ? 'Aggressive' : appChinaPulpAdd > 100 ? 'Balanced' : 'Defensive'}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    {/* Main Table */}
                    <div className="flex-1 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[#cc0000]/20">
                            <th className="text-left py-2 px-3 font-medium text-muted-foreground w-48">Metric</th>
                            {years.map(year => (
                              <th key={year} className="text-center py-2 px-3 font-medium text-muted-foreground">{year}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {/* Row 1: APP China Capacity */}
                          <tr className="border-b border-[#cc0000]/10 bg-red-50">
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2">
                                <span className="h-3 w-3 rounded-full bg-[#cc0000]" />
                                <span className="font-semibold text-[#cc0000]">APP China Capacity</span>
                              </div>
                            </td>
                            {years.map(year => {
                              const value = input.appCapacity.appChina[year]
                              const isNew = year !== 2026 && value > 0
                              return (
                                <td key={year} className="text-center py-2.5 px-3">
                                  <span className={cn(
                                    'font-mono font-bold',
                                    year === 2026 ? 'text-[#cc0000]' : isNew ? 'text-emerald-600' : 'text-muted-foreground'
                                  )}>
                                    {year === 2026 ? value : isNew ? `+${value}` : '-'}
                                  </span>
                                  {isNew && <span className="text-[10px] text-muted-foreground ml-1">kt</span>}
                                </td>
                              )
                            })}
                          </tr>
                          {/* Row 2: Market Release (External pulp) */}
                          <tr className="border-b border-[#cc0000]/10">
                            <td className="py-2.5 px-3">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-2 cursor-help">
                                    <ArrowRight className="h-3 w-3 text-[#cc0000]/70" />
                                    <span className="text-[#cc0000]/80">Market Release</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">Pulp sold externally = Capacity x (1 - Internal Use)</p>
                                </TooltipContent>
                              </Tooltip>
                            </td>
                            {years.map(year => {
                              const capacity = input.appCapacity.appChina[year]
                              const internalRate = 0.3 // 30% internal use assumption
                              const external = year === 2026 ? Math.round(capacity * (1 - internalRate)) : Math.round(capacity * (1 - internalRate))
                              return (
                                <td key={year} className="text-center py-2.5 px-3">
                                  <span className="font-mono text-[#cc0000]/70">
                                    {year === 2026 ? external : external > 0 ? `+${external}` : '-'}
                                  </span>
                                  {external > 0 && year !== 2026 && <span className="text-[10px] text-muted-foreground ml-1">kt</span>}
                                </td>
                              )
                            })}
                          </tr>
                          {/* Row 3: Cumulative Market Impact */}
                          <tr className="bg-red-100/50">
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2">
                                <TrendingUp className="h-3 w-3 text-[#cc0000]" />
                                <span className="font-medium text-[#cc0000]">Cumulative Impact</span>
                              </div>
                            </td>
                            {(() => {
                              let cumulative = 0
                              const internalRate = 0.3
                              return years.map(year => {
                                const capacity = input.appCapacity.appChina[year]
                                if (year === 2026) {
                                  cumulative = Math.round(capacity * (1 - internalRate))
                                } else {
                                  cumulative += Math.round(capacity * (1 - internalRate))
                                }
                                return (
                                  <td key={year} className="text-center py-2.5 px-3">
                                    <span className="font-mono font-bold text-[#cc0000]">{cumulative}</span>
                                    <span className="text-[10px] text-muted-foreground ml-1">kt</span>
                                  </td>
                                )
                              })
                            })()}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    {/* Right Summary Panel */}
                    <div className="w-48 space-y-2 border-l border-[#cc0000]/20 pl-4">
                      <div className="rounded-lg bg-white p-3 border border-[#cc0000]/20">
                        <p className="text-[10px] text-muted-foreground">Total Added</p>
                        <p className="text-xl font-bold text-[#cc0000]">+{appChinaPulpAdd} kt</p>
                      </div>
                      <div className="rounded-lg bg-white p-3 border border-[#cc0000]/20">
                        <p className="text-[10px] text-muted-foreground">Market Release</p>
                        <p className="text-xl font-bold text-[#cc0000]/80">+{Math.round(appChinaPulpAdd * 0.7)} kt</p>
                      </div>
                      <div className="rounded-lg bg-white p-3 border border-[#cc0000]/20">
                        <p className="text-[10px] text-muted-foreground">Downstream</p>
                        <p className="text-lg font-bold text-[#cc0000]/70">+{appChinaDownstreamAdd} kt</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* SECTION 2: Competitor Response Table */}
              <Card className="border-border/50 bg-card/80">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Competitor Response
                    </CardTitle>
                    <AIBadge size="sm" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/50">
                          <th className="text-left py-2 px-3 font-medium text-muted-foreground w-36">Player</th>
                          {years.map(year => (
                            <th key={year} className="text-center py-2 px-3 font-medium text-muted-foreground">{year}</th>
                          ))}
                          <th className="text-left py-2 px-3 font-medium text-muted-foreground w-56">Reaction Summary</th>
                        </tr>
                      </thead>
                      <tbody>
                        {competitorChanges.map(change => {
                          const player = PLAYERS.find(p => p.id === change.playerId)!
                          // Distribute the pulpChange across years (simplified)
                          const yearlyChange = {
                            2026: player.pulpCapacity || 100,
                            2027: change.action === 'add' ? Math.round(change.pulpChange * 0.2) : change.action === 'delay' ? -Math.round(change.pulpChange * 0.3) : 0,
                            2028: change.action === 'add' ? Math.round(change.pulpChange * 0.3) : change.action === 'delay' ? -Math.round(change.pulpChange * 0.2) : 0,
                            2029: change.action === 'add' ? Math.round(change.pulpChange * 0.25) : 0,
                            2030: change.action === 'add' ? Math.round(change.pulpChange * 0.15) : change.action === 'delay' ? Math.round(change.pulpChange * 0.3) : 0,
                            2031: change.action === 'add' ? Math.round(change.pulpChange * 0.1) : change.action === 'delay' ? Math.round(change.pulpChange * 0.2) : 0,
                          }
                          return (
                            <tr key={change.playerId} className={cn(
                              'border-b border-border/30',
                              change.action === 'delay' && 'bg-amber-50/50',
                              change.action === 'add' && 'bg-emerald-50/50'
                            )}>
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-2">
                                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: player.color }} />
                                  <span className="font-medium">{player.nameCn}</span>
                                </div>
                              </td>
                              {years.map(year => {
                                const val = yearlyChange[year]
                                const isBase = year === 2026
                                return (
                                  <td key={year} className="text-center py-2.5 px-3">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="cursor-help">
                                          <span className={cn(
                                            'font-mono block',
                                            isBase ? 'text-muted-foreground' : val > 0 ? 'text-emerald-600 font-semibold' : val < 0 ? 'text-amber-600 font-semibold' : 'text-muted-foreground'
                                          )}>
                                            {isBase ? val : val > 0 ? `+${val}` : val < 0 ? val : '-'}
                                          </span>
                                          {!isBase && val !== 0 && (
                                            <span className={cn(
                                              'text-[9px] flex items-center justify-center gap-0.5 mt-0.5',
                                              val > 0 ? 'text-emerald-500' : 'text-amber-500'
                                            )}>
                                              {val > 0 ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
                                              {val > 0 ? 'Expand' : 'Delay'}
                                            </span>
                                          )}
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="text-xs max-w-48">{change.reasoning}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </td>
                                )
                              })}
                              <td className="py-2.5 px-3">
                                <p className="text-xs text-muted-foreground line-clamp-2 italic">
                                  {change.reasoning}
                                </p>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* SECTION 3: Market Impact Overlay */}
              <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-blue-800">
                    <BarChart3 className="h-4 w-4" />
                    Market Impact Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Net Supply Change Row */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-blue-200">
                          <th className="text-left py-2 px-3 font-medium text-blue-700 w-48">Metric</th>
                          {years.map(year => (
                            <th key={year} className="text-center py-2 px-3 font-medium text-blue-700">{year}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {/* Net Supply Change */}
                        <tr className="border-b border-blue-100">
                          <td className="py-2.5 px-3 font-medium text-blue-800">Net Supply Change</td>
                          {years.map(year => {
                            const appExternal = year === 2026 ? 0 : Math.round(input.appCapacity.appChina[year] * 0.7)
                            const competitorNet = competitorChanges.reduce((sum, c) => {
                              const yearFactor = year === 2026 ? 0 : year === 2027 ? 0.2 : year === 2028 ? 0.3 : year === 2029 ? 0.25 : year === 2030 ? 0.15 : 0.1
                              return sum + Math.round(c.pulpChange * yearFactor)
                            }, 0)
                            const net = appExternal + competitorNet
                            return (
                              <td key={year} className="text-center py-2.5 px-3">
                                <span className={cn(
                                  'font-mono font-semibold',
                                  net > 50 ? 'text-red-600' : net < -20 ? 'text-emerald-600' : 'text-blue-600'
                                )}>
                                  {year === 2026 ? '-' : net > 0 ? `+${net}` : net < 0 ? net : '0'}
                                </span>
                                {year !== 2026 && <span className="text-[10px] text-muted-foreground ml-1">kt</span>}
                              </td>
                            )
                          })}
                        </tr>
                        {/* Price Signal */}
                        <tr className="bg-blue-100/50">
                          <td className="py-2.5 px-3 font-medium text-blue-800">Price Signal</td>
                          {years.map(year => {
                            const appExternal = year === 2026 ? 0 : Math.round(input.appCapacity.appChina[year] * 0.7)
                            const competitorNet = competitorChanges.reduce((sum, c) => {
                              const yearFactor = year === 2026 ? 0 : year === 2027 ? 0.2 : year === 2028 ? 0.3 : year === 2029 ? 0.25 : year === 2030 ? 0.15 : 0.1
                              return sum + Math.round(c.pulpChange * yearFactor)
                            }, 0)
                            const net = appExternal + competitorNet
                            const signal = net > 50 ? 'down' : net < -20 ? 'up' : 'stable'
                            return (
                              <td key={year} className="text-center py-2.5 px-3">
                                {year === 2026 ? (
                                  <span className="text-muted-foreground">-</span>
                                ) : (
                                  <div className={cn(
                                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                                    signal === 'down' && 'bg-red-100 text-red-700',
                                    signal === 'up' && 'bg-emerald-100 text-emerald-700',
                                    signal === 'stable' && 'bg-gray-100 text-gray-600'
                                  )}>
                                    {signal === 'down' && <ArrowDown className="h-3 w-3" />}
                                    {signal === 'up' && <ArrowUp className="h-3 w-3" />}
                                    {signal === 'stable' && <ArrowRight className="h-3 w-3" />}
                                    {signal === 'down' ? 'Down' : signal === 'up' ? 'Up' : 'Stable'}
                                  </div>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Bottom KPI Strip */}
                  <div className="grid grid-cols-3 gap-4 pt-2 border-t border-blue-200">
                    {/* Total Net Supply Change */}
                    <div className="rounded-lg bg-white p-3 border border-blue-200">
                      <p className="text-xs text-blue-600 mb-1">5-Year Net Supply</p>
                      {(() => {
                        const totalNet = years.slice(1).reduce((total, year) => {
                          const appExternal = Math.round(input.appCapacity.appChina[year] * 0.7)
                          const competitorNet = competitorChanges.reduce((sum, c) => {
                            const yearFactor = year === 2027 ? 0.2 : year === 2028 ? 0.3 : year === 2029 ? 0.25 : year === 2030 ? 0.15 : 0.1
                            return sum + Math.round(c.pulpChange * yearFactor)
                          }, 0)
                          return total + appExternal + competitorNet
                        }, 0)
                        return (
                          <p className={cn(
                            'text-2xl font-bold',
                            totalNet > 200 ? 'text-red-600' : totalNet > 0 ? 'text-amber-600' : 'text-emerald-600'
                          )}>
                            {totalNet > 0 ? '+' : ''}{totalNet} kt
                          </p>
                        )
                      })()}
                    </div>
                    {/* Market Balance */}
                    <div className="rounded-lg bg-white p-3 border border-blue-200">
                      <p className="text-xs text-blue-600 mb-1">Market Balance</p>
                      {(() => {
                        const totalNet = years.slice(1).reduce((total, year) => {
                          const appExternal = Math.round(input.appCapacity.appChina[year] * 0.7)
                          const competitorNet = competitorChanges.reduce((sum, c) => {
                            const yearFactor = year === 2027 ? 0.2 : year === 2028 ? 0.3 : year === 2029 ? 0.25 : year === 2030 ? 0.15 : 0.1
                            return sum + Math.round(c.pulpChange * yearFactor)
                          }, 0)
                          return total + appExternal + competitorNet
                        }, 0)
                        const balance = totalNet > 150 ? 'Surplus' : totalNet < -50 ? 'Tight' : 'Balanced'
                        return (
                          <div className={cn(
                            'inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold',
                            balance === 'Surplus' && 'bg-red-100 text-red-700',
                            balance === 'Tight' && 'bg-emerald-100 text-emerald-700',
                            balance === 'Balanced' && 'bg-amber-100 text-amber-700'
                          )}>
                            {balance}
                          </div>
                        )
                      })()}
                    </div>
                    {/* Price Trend */}
                    <div className="rounded-lg bg-white p-3 border border-blue-200">
                      <p className="text-xs text-blue-600 mb-1">Price Trend</p>
                      {(() => {
                        const totalNet = years.slice(1).reduce((total, year) => {
                          const appExternal = Math.round(input.appCapacity.appChina[year] * 0.7)
                          const competitorNet = competitorChanges.reduce((sum, c) => {
                            const yearFactor = year === 2027 ? 0.2 : year === 2028 ? 0.3 : year === 2029 ? 0.25 : year === 2030 ? 0.15 : 0.1
                            return sum + Math.round(c.pulpChange * yearFactor)
                          }, 0)
                          return total + appExternal + competitorNet
                        }, 0)
                        const trend = totalNet > 150 ? 'Down' : totalNet < -50 ? 'Up' : 'Stable'
                        return (
                          <div className={cn(
                            'inline-flex items-center gap-2 text-xl font-bold',
                            trend === 'Down' && 'text-red-600',
                            trend === 'Up' && 'text-emerald-600',
                            trend === 'Stable' && 'text-gray-600'
                          )}>
                            {trend === 'Down' && <ArrowDown className="h-5 w-5" />}
                            {trend === 'Up' && <ArrowUp className="h-5 w-5" />}
                            {trend === 'Stable' && <ArrowRight className="h-5 w-5" />}
                            {trend}
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Exporter Allocation Table - Regional Rebalancing */}
              <Card className="border-teal-200 bg-gradient-to-r from-teal-50 to-cyan-50">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2 text-teal-800">
                      <Globe className="h-4 w-4" />
                      Global Export Reallocation
                    </CardTitle>
                    <AIBadge size="sm" />
                  </div>
                  <p className="text-xs text-teal-600 mt-1">
                    How international suppliers reallocate exports in response to China market changes
                  </p>
                </CardHeader>
                <CardContent>
                  {(() => {
                    // Calculate China demand gap from inputs
                    const chinaDomesticSupply = (() => {
                      let base = 800
                      if (input.forestry.chinaLoggingPolicy === 'tight') base -= 150
                      else if (input.forestry.chinaLoggingPolicy === 'relaxed') base += 150
                      if (input.forestry.chinaRealEstateCondition === 'downturn') base -= 100
                      else if (input.forestry.chinaRealEstateCondition === 'recovery') base += 100
                      return base
                    })()
                    const vietnamExports = (() => {
                      let base = 400
                      if (input.forestry.vietnamExportPolicy === 'restricted') base -= 120
                      else if (input.forestry.vietnamExportPolicy === 'expanded') base += 120
                      return base
                    })()
                    const appExternalPulp = Math.round(appChinaPulpAdd * 0.7)
                    const chinaDemand = 2500 // Assumed baseline demand
                    const chinaDemandGap = chinaDemand - (chinaDomesticSupply + appExternalPulp + vietnamExports)
                    const chinaPriceIndex = chinaDemandGap > 200 ? 1.15 : chinaDemandGap > 0 ? 1.05 : 0.95

                    // Build exporter data with regional allocations
                    const exporterData = exporterAllocations.map(allocation => {
                      const player = PLAYERS.find(p => p.id === allocation.playerId)!
                      const totalCapacity = player.pulpCapacity || 500
                      const chinaVol = allocation.chinaVolume
                      const otherVol = allocation.otherRegionsVolume
                      
                      // Distribute "other" into Europe, India, Rest
                      // Base distribution varies by region
                      const isLatam = player.region === 'latam'
                      const europeShare = isLatam ? 0.4 : 0.15
                      const indiaShare = isLatam ? 0.25 : 0.35
                      const restShare = 1 - europeShare - indiaShare
                      
                      const europeVol = Math.round(otherVol * europeShare)
                      const indiaVol = Math.round(otherVol * indiaShare)
                      const restVol = Math.round(otherVol * restShare)

                      // Calculate deltas based on demand gap and price
                      const baselineChina = Math.round(totalCapacity * 0.35)
                      const chinaDelta = chinaVol - baselineChina
                      const europeDelta = chinaDelta < 0 ? Math.round(Math.abs(chinaDelta) * 0.5) : -Math.round(chinaDelta * 0.3)
                      const indiaDelta = chinaDelta < 0 ? Math.round(Math.abs(chinaDelta) * 0.3) : -Math.round(chinaDelta * 0.2)
                      const restDelta = -chinaDelta - europeDelta - indiaDelta

                      return {
                        playerId: allocation.playerId,
                        name: player.nameCn,
                        nameEn: player.name,
                        color: player.color,
                        region: player.region,
                        total: totalCapacity,
                        china: { vol: chinaVol, delta: chinaDelta },
                        europe: { vol: europeVol, delta: europeDelta },
                        india: { vol: indiaVol, delta: indiaDelta },
                        rest: { vol: restVol, delta: restDelta },
                        reasoning: allocation.reasoning,
                      }
                    })

                    return (
                      <div className="flex gap-4">
                        {/* Main Table */}
                        <div className="flex-1 overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-teal-200">
                                <th className="text-left py-2 px-3 font-medium text-teal-700 w-32">Exporter</th>
                                <th className="text-center py-2 px-3 font-medium text-[#cc0000] bg-red-50/50">China</th>
                                <th className="text-center py-2 px-3 font-medium text-blue-700">Europe</th>
                                <th className="text-center py-2 px-3 font-medium text-orange-700">India</th>
                                <th className="text-center py-2 px-3 font-medium text-gray-600">Rest</th>
                                <th className="text-center py-2 px-3 font-medium text-teal-700">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {exporterData.map(exp => (
                                <tr key={exp.playerId} className="border-b border-teal-100 hover:bg-teal-50/50">
                                  <td className="py-3 px-3">
                                    <div className="flex items-center gap-2">
                                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: exp.color }} />
                                      <div>
                                        <span className="font-medium block">{exp.name}</span>
                                        <span className="text-[10px] text-muted-foreground">{exp.nameEn}</span>
                                      </div>
                                    </div>
                                  </td>
                                  {/* China */}
                                  <td className="text-center py-3 px-3 bg-red-50/30">
                                    <div className="space-y-0.5">
                                      <span className="font-mono font-semibold text-[#cc0000] block">{exp.china.vol} kt</span>
                                      <span className={cn(
                                        'text-[10px] font-medium flex items-center justify-center gap-0.5',
                                        exp.china.delta > 0 && 'text-emerald-600',
                                        exp.china.delta < 0 && 'text-amber-600',
                                        exp.china.delta === 0 && 'text-muted-foreground'
                                      )}>
                                        {exp.china.delta > 0 && <ChevronUp className="h-3 w-3" />}
                                        {exp.china.delta < 0 && <ChevronDown className="h-3 w-3" />}
                                        {exp.china.delta > 0 ? `+${exp.china.delta}` : exp.china.delta < 0 ? exp.china.delta : '-'}
                                      </span>
                                    </div>
                                  </td>
                                  {/* Europe */}
                                  <td className="text-center py-3 px-3">
                                    <div className="space-y-0.5">
                                      <span className="font-mono block">{exp.europe.vol} kt</span>
                                      <span className={cn(
                                        'text-[10px] font-medium flex items-center justify-center gap-0.5',
                                        exp.europe.delta > 0 && 'text-emerald-600',
                                        exp.europe.delta < 0 && 'text-amber-600',
                                        exp.europe.delta === 0 && 'text-muted-foreground'
                                      )}>
                                        {exp.europe.delta > 0 && <ChevronUp className="h-3 w-3" />}
                                        {exp.europe.delta < 0 && <ChevronDown className="h-3 w-3" />}
                                        {exp.europe.delta > 0 ? `+${exp.europe.delta}` : exp.europe.delta < 0 ? exp.europe.delta : '-'}
                                      </span>
                                    </div>
                                  </td>
                                  {/* India */}
                                  <td className="text-center py-3 px-3">
                                    <div className="space-y-0.5">
                                      <span className="font-mono block">{exp.india.vol} kt</span>
                                      <span className={cn(
                                        'text-[10px] font-medium flex items-center justify-center gap-0.5',
                                        exp.india.delta > 0 && 'text-emerald-600',
                                        exp.india.delta < 0 && 'text-amber-600',
                                        exp.india.delta === 0 && 'text-muted-foreground'
                                      )}>
                                        {exp.india.delta > 0 && <ChevronUp className="h-3 w-3" />}
                                        {exp.india.delta < 0 && <ChevronDown className="h-3 w-3" />}
                                        {exp.india.delta > 0 ? `+${exp.india.delta}` : exp.india.delta < 0 ? exp.india.delta : '-'}
                                      </span>
                                    </div>
                                  </td>
                                  {/* Rest */}
                                  <td className="text-center py-3 px-3">
                                    <div className="space-y-0.5">
                                      <span className="font-mono block">{exp.rest.vol} kt</span>
                                      <span className={cn(
                                        'text-[10px] font-medium flex items-center justify-center gap-0.5',
                                        exp.rest.delta > 0 && 'text-emerald-600',
                                        exp.rest.delta < 0 && 'text-amber-600',
                                        exp.rest.delta === 0 && 'text-muted-foreground'
                                      )}>
                                        {exp.rest.delta > 0 && <ChevronUp className="h-3 w-3" />}
                                        {exp.rest.delta < 0 && <ChevronDown className="h-3 w-3" />}
                                        {exp.rest.delta > 0 ? `+${exp.rest.delta}` : exp.rest.delta < 0 ? exp.rest.delta : '-'}
                                      </span>
                                    </div>
                                  </td>
                                  {/* Total */}
                                  <td className="text-center py-3 px-3">
                                    <span className="font-mono font-semibold">{exp.total} kt</span>
                                  </td>
                                </tr>
                              ))}
                              {/* Totals Row */}
                              <tr className="bg-teal-100/50 font-semibold">
                                <td className="py-2.5 px-3 text-teal-800">Total</td>
                                <td className="text-center py-2.5 px-3 bg-red-100/50">
                                  <span className="font-mono text-[#cc0000]">
                                    {exporterData.reduce((sum, e) => sum + e.china.vol, 0)} kt
                                  </span>
                                </td>
                                <td className="text-center py-2.5 px-3">
                                  <span className="font-mono">
                                    {exporterData.reduce((sum, e) => sum + e.europe.vol, 0)} kt
                                  </span>
                                </td>
                                <td className="text-center py-2.5 px-3">
                                  <span className="font-mono">
                                    {exporterData.reduce((sum, e) => sum + e.india.vol, 0)} kt
                                  </span>
                                </td>
                                <td className="text-center py-2.5 px-3">
                                  <span className="font-mono">
                                    {exporterData.reduce((sum, e) => sum + e.rest.vol, 0)} kt
                                  </span>
                                </td>
                                <td className="text-center py-2.5 px-3">
                                  <span className="font-mono">
                                    {exporterData.reduce((sum, e) => sum + e.total, 0)} kt
                                  </span>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* Right Summary Panel */}
                        <div className="w-64 space-y-3 border-l border-teal-200 pl-4">
                          <div className="rounded-lg bg-white p-3 border border-teal-200">
                            <p className="text-[10px] text-teal-600 mb-1">China Demand Gap</p>
                            <p className={cn(
                              'text-xl font-bold',
                              chinaDemandGap > 200 ? 'text-emerald-600' : chinaDemandGap > 0 ? 'text-amber-600' : 'text-red-600'
                            )}>
                              {chinaDemandGap > 0 ? '+' : ''}{chinaDemandGap} kt
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {chinaDemandGap > 200 ? 'High demand attracts imports' : chinaDemandGap > 0 ? 'Moderate demand' : 'Oversupply reduces imports'}
                            </p>
                          </div>
                          <div className="rounded-lg bg-white p-3 border border-teal-200">
                            <p className="text-[10px] text-teal-600 mb-1">China Price Index</p>
                            <div className="flex items-center gap-2">
                              <p className={cn(
                                'text-xl font-bold',
                                chinaPriceIndex > 1.1 ? 'text-emerald-600' : chinaPriceIndex > 1 ? 'text-amber-600' : 'text-red-600'
                              )}>
                                {(chinaPriceIndex * 100).toFixed(0)}%
                              </p>
                              <span className="text-xs text-muted-foreground">vs Global</span>
                            </div>
                          </div>
                          <div className="space-y-2 pt-2 border-t border-teal-200">
                            <p className="text-[10px] font-semibold text-teal-700">Reallocation Reasoning</p>
                            {exporterData.slice(0, 3).map(exp => (
                              <div key={exp.playerId} className="text-[10px] text-muted-foreground">
                                <span className="font-medium text-foreground">{exp.name}:</span>{' '}
                                <span className="italic line-clamp-2">{exp.reasoning}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>
            </div>
          </TooltipProvider>
        </TabsContent>

        {/* Tab 2: Downstream Outcomes */}
        <TabsContent value="downstream">
          <Card className="border-border/50 bg-card/80">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Downstream Segment Outcomes</CardTitle>
                <AIBadge size="sm" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {segmentOutcomes.map(outcome => (
                  <div
                    key={outcome.segment}
                    className="rounded-lg border border-border/50 bg-card/50 p-3"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      {segmentIcons[outcome.segment]}
                      <span className="text-sm font-medium">{segmentLabels[outcome.segment]}</span>
                    </div>
                    
                    {/* Supply-demand balance - max 600 kt (-300 to +300) */}
                    <div className="space-y-1 mb-3">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">Supply-Demand</span>
                        <span className={cn(
                          'font-mono',
                          outcome.supplyDemandBalance > 100 && 'text-destructive',
                          outcome.supplyDemandBalance < -50 && 'text-success',
                          Math.abs(outcome.supplyDemandBalance) <= 100 && 'text-warning'
                        )}>
                          {outcome.supplyDemandBalance > 0 ? 'Surplus ' : 'Shortage '}
                          {Math.abs(Math.round(outcome.supplyDemandBalance))} kt
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary relative overflow-hidden">
                        {/* Center line at 0 */}
                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-muted-foreground/50 z-10" />
                        {/* Bar starting from center - scale to 600 total (-300 to +300) */}
                        <div
                          className={cn(
                            'absolute top-0 bottom-0 transition-all',
                            outcome.supplyDemandBalance > 100 && 'bg-destructive',
                            outcome.supplyDemandBalance < -50 && 'bg-success',
                            Math.abs(outcome.supplyDemandBalance) <= 100 && 'bg-warning'
                          )}
                          style={{
                            left: outcome.supplyDemandBalance >= 0 ? '50%' : `${50 + (outcome.supplyDemandBalance / 300) * 50}%`,
                            width: `${Math.min(50, Math.abs(outcome.supplyDemandBalance / 300) * 50)}%`
                          }}
                        />
                      </div>
                    </div>
                    
                    {/* Utilization */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] text-muted-foreground">Utilization</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px]">
                          {Math.round(outcome.utilization)}%
                        </span>
                        <TrafficLight
                          status={
                            outcome.utilization >= 90 ? 'green' :
                            outcome.utilization >= 80 ? 'amber' : 'red'
                          }
                        />
                      </div>
                    </div>
                    
                    {/* Margin pressure */}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">Margin Pressure</span>
                      <span className={cn(
                        'text-[11px] font-medium',
                        outcome.marginPressure === 'high' && 'text-success',
                        outcome.marginPressure === 'medium' && 'text-warning',
                        outcome.marginPressure === 'low' && 'text-destructive'
                      )}>
                        {outcome.marginPressure === 'high' ? 'Low' : 
                         outcome.marginPressure === 'medium' ? 'Medium' : 'High'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
