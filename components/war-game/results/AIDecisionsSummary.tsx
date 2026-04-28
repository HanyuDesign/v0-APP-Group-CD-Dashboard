'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { FileText, Package, Bath, Bot, Building2, Lightbulb, TrendingUp, TrendingDown, Minus, Globe, Factory, BarChart3 } from 'lucide-react'
import { AIBadge } from '../shared/AIBadge'
import { TrafficLight } from '../shared/TrafficLight'
import type { SimulationResult } from '@/lib/types/war-game'
import { PLAYERS } from '@/lib/data/initial-data'

interface AIDecisionsSummaryProps {
  result: SimulationResult
}

export function AIDecisionsSummary({ result }: AIDecisionsSummaryProps) {
  const { competitorChanges, exporterAllocations, segmentOutcomes, input } = result

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

        {/* Tab 1: Pulp Capacity Decisions */}
        <TabsContent value="pulp">
          <div className="grid grid-cols-2 gap-4">
            {/* Capacity Decisions - APP (Focused) + Competitors */}
            <Card className="border-border/50 bg-card/80">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Capacity Decisions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[420px] overflow-y-auto">
                {/* APP Group - Focused */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                    <Building2 className="h-3.5 w-3.5" />
                    APP Group (Your Strategy)
                  </div>
                  
                  {/* APP China */}
                  <div className="rounded-lg border-2 border-primary/50 bg-primary/5 p-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: appChinaPlayer.color }}
                        />
                        <span className="text-sm font-medium">{appChinaPlayer.nameCn}</span>
                      </div>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                        Expand
                      </span>
                    </div>
                    <div className="mt-1.5 flex gap-4 text-[11px]">
                      <div>
                        <span className="text-muted-foreground">Pulp: </span>
                        <span className="font-mono text-primary">+{appChinaPulpAdd} kt</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Downstream: </span>
                        <span className="font-mono text-primary">+{appChinaDownstreamAdd} kt</span>
                      </div>
                    </div>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      Guangxi: {input.appCapacity.guangxi.pulpCapacity} kt pulp ({input.appCapacity.guangxi.startYear})
                      {input.appCapacity.guangxi.includeBoard && `, ${input.appCapacity.guangxi.boardCapacity} kt board`}
                      {input.appCapacity.guangxi.includeTissue && `, ${input.appCapacity.guangxi.tissueCapacity} kt tissue`}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Jiangsu/Fujian: {input.appCapacity.jiangsuFujian.pulpCapacity} kt pulp ({input.appCapacity.jiangsuFujian.startYear})
                      {input.appCapacity.jiangsuFujian.includeBoard && `, ${input.appCapacity.jiangsuFujian.boardCapacity} kt board`}
                      {input.appCapacity.jiangsuFujian.includeTissue && `, ${input.appCapacity.jiangsuFujian.tissueCapacity} kt tissue`}
                    </p>
                  </div>
                  
                  {/* APP Indonesia */}
                  <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: appIndonesiaPlayer.color }}
                        />
                        <span className="text-sm font-medium">{appIndonesiaPlayer.nameCn}</span>
                      </div>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        Maintain
                      </span>
                    </div>
                    <div className="mt-1.5 text-[11px]">
                      <span className="text-muted-foreground">Existing capacity: </span>
                      <span className="font-mono">{appIndonesiaPlayer.pulpCapacity} kt pulp</span>
                    </div>
                    <p className="mt-1 text-[10px] text-muted-foreground italic">
                      Supplying China market via exports
                    </p>
                  </div>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="h-px flex-1 bg-border" />
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span>Competitors</span>
                    <AIBadge size="sm" />
                  </div>
                  <span className="h-px flex-1 bg-border" />
                </div>

                {/* Competitors - AI Driven */}
                {competitorChanges.map(change => {
                  const player = PLAYERS.find(p => p.id === change.playerId)!
                  return (
                    <div
                      key={change.playerId}
                      className={cn(
                        'rounded-lg border p-2.5',
                        change.action === 'delay' && 'border-warning/50 bg-warning/5',
                        change.action === 'add' && 'border-success/50 bg-success/5',
                        change.action === 'maintain' && 'border-border/50 bg-card/50'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: player.color }}
                          />
                          <span className="text-sm font-medium">{player.nameCn}</span>
                        </div>
                        <span className={cn(
                          'text-[10px] font-medium px-1.5 py-0.5 rounded',
                          change.action === 'delay' && 'bg-warning/20 text-warning',
                          change.action === 'add' && 'bg-success/20 text-success',
                          change.action === 'maintain' && 'bg-muted text-muted-foreground'
                        )}>
                          {change.action === 'delay' ? 'Delay' : change.action === 'add' ? 'Expand' : 'Maintain'}
                        </span>
                      </div>
                      <div className="mt-1.5 flex gap-4 text-[11px]">
                        <div>
                          <span className="text-muted-foreground">Pulp: </span>
                          <span className={cn(
                            'font-mono',
                            change.pulpChange > 0 && 'text-success',
                            change.pulpChange < 0 && 'text-destructive',
                            change.pulpChange === 0 && 'text-muted-foreground'
                          )}>
                            {change.pulpChange > 0 ? '+' : ''}{change.pulpChange} kt
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Downstream: </span>
                          <span className={cn(
                            'font-mono',
                            change.downstreamChange > 0 && 'text-success',
                            change.downstreamChange < 0 && 'text-destructive',
                            change.downstreamChange === 0 && 'text-muted-foreground'
                          )}>
                            {change.downstreamChange > 0 ? '+' : ''}{change.downstreamChange} kt
                          </span>
                        </div>
                      </div>
                      <p className="mt-1 text-[10px] text-muted-foreground italic line-clamp-2">
                        {change.reasoning}
                      </p>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Exporter Allocation Decisions */}
            <Card className="border-border/50 bg-card/80">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Exporter Allocation Decisions</CardTitle>
                  <AIBadge size="sm" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[420px] overflow-y-auto">
                {/* LatAm Exporters */}
                {exporterAllocations.filter(a => {
                  const player = PLAYERS.find(p => p.id === a.playerId)!
                  return player.region === 'latam'
                }).length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#264653]">
                      <Globe className="h-3.5 w-3.5" />
                      LatAm Exporters
                    </div>
                    {exporterAllocations.filter(a => {
                      const player = PLAYERS.find(p => p.id === a.playerId)!
                      return player.region === 'latam'
                    }).map(allocation => {
                      const player = PLAYERS.find(p => p.id === allocation.playerId)!
                      return (
                        <div
                          key={allocation.playerId}
                          className="rounded-lg border border-[#264653]/30 bg-[#264653]/5 p-2.5"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: player.color }}
                            />
                            <span className="text-sm font-medium">{player.nameCn}</span>
                            <span className="text-[9px] text-muted-foreground ml-auto">{player.pulpCapacity} kt capacity</span>
                          </div>
                          <div className="mt-2 space-y-1 text-[11px]">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">China Exports</span>
                              <span className="font-mono font-semibold text-[#cc0000]">
                                {allocation.chinaVolume} kt ({Math.round(allocation.chinaShare * 100)}%)
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Other Regions</span>
                              <span className="font-mono">{allocation.otherRegionsVolume} kt</span>
                            </div>
                            {/* Visual bar */}
                            <div className="mt-1.5 h-2 rounded-full bg-secondary overflow-hidden flex">
                              <div 
                                className="h-full bg-[#cc0000]"
                                style={{ width: `${allocation.chinaShare * 100}%` }}
                              />
                              <div 
                                className="h-full bg-[#264653]/30"
                                style={{ width: `${(1 - allocation.chinaShare) * 100}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[10px] text-muted-foreground">
                              <span>China</span>
                              <span>Other (EU, NA, Asia)</span>
                            </div>
                            <p className="mt-1 text-[10px] text-muted-foreground italic line-clamp-2">
                              {allocation.reasoning}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Indonesia Exporters */}
                {exporterAllocations.filter(a => {
                  const player = PLAYERS.find(p => p.id === a.playerId)!
                  return player.region === 'indonesia'
                }).length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#f4a261]">
                      <Globe className="h-3.5 w-3.5" />
                      Indonesia Exporters
                    </div>
                    {exporterAllocations.filter(a => {
                      const player = PLAYERS.find(p => p.id === a.playerId)!
                      return player.region === 'indonesia'
                    }).map(allocation => {
                      const player = PLAYERS.find(p => p.id === allocation.playerId)!
                      return (
                        <div
                          key={allocation.playerId}
                          className="rounded-lg border border-[#f4a261]/30 bg-[#f4a261]/5 p-2.5"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: player.color }}
                            />
                            <span className="text-sm font-medium">{player.nameCn}</span>
                            <span className="text-[9px] text-muted-foreground ml-auto">{player.pulpCapacity} kt capacity</span>
                          </div>
                          <div className="mt-2 space-y-1 text-[11px]">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">China Exports</span>
                              <span className="font-mono font-semibold text-[#cc0000]">
                                {allocation.chinaVolume} kt ({Math.round(allocation.chinaShare * 100)}%)
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Other Regions</span>
                              <span className="font-mono">{allocation.otherRegionsVolume} kt</span>
                            </div>
                            {/* Visual bar */}
                            <div className="mt-1.5 h-2 rounded-full bg-secondary overflow-hidden flex">
                              <div 
                                className="h-full bg-[#cc0000]"
                                style={{ width: `${allocation.chinaShare * 100}%` }}
                              />
                              <div 
                                className="h-full bg-[#f4a261]/30"
                                style={{ width: `${(1 - allocation.chinaShare) * 100}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[10px] text-muted-foreground">
                              <span>China</span>
                              <span>Other Asia</span>
                            </div>
                            <p className="mt-1 text-[10px] text-muted-foreground italic line-clamp-2">
                              {allocation.reasoning}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
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
