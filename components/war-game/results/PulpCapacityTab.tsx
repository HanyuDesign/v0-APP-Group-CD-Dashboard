'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Bot, Building2, Globe, TrendingUp, TrendingDown, Minus, Lightbulb, AlertTriangle, HelpCircle } from 'lucide-react'
import { AIBadge } from '../shared/AIBadge'
import type { SimulationResult } from '@/lib/types/war-game'
import { PLAYERS } from '@/lib/data/initial-data'

interface PulpCapacityTabProps {
  result: SimulationResult
}

export function PulpCapacityTab({ result }: PulpCapacityTabProps) {
  const { competitorChanges, exporterAllocations, input } = result

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

  // Calculate exporter allocation summary
  const avgChinaShare = exporterAllocations.length > 0 
    ? exporterAllocations.reduce((sum, e) => sum + e.chinaShare, 0) / exporterAllocations.length 
    : 0
  const totalChinaExports = exporterAllocations.reduce((sum, e) => sum + e.chinaVolume, 0)

  // Generate strategic questions and insights based on input
  const generateStrategicAnalysis = () => {
    const analysis = {
      competitorReaction: '',
      armsRaceRisk: '',
      marketPulpQuestion: '',
      exporterReaction: '',
      supplyDemandImpact: '',
      profitPoolImpact: ''
    }

    // Competitor reaction analysis
    if (competitorsDelaying > competitorsExpanding) {
      analysis.competitorReaction = `APP's expansion appears to pre-empt competitors. ${competitorsDelaying} out of ${competitorChanges.length} local players are delaying their plans, suggesting APP's move creates market uncertainty and deters new capacity.`
      analysis.armsRaceRisk = 'Low risk of capacity arms race - competitors are retreating.'
    } else if (competitorsExpanding > competitorsDelaying) {
      analysis.competitorReaction = `APP's expansion is provoking a capacity arms race. ${competitorsExpanding} competitors are also expanding, indicating aggressive market positioning.`
      analysis.armsRaceRisk = 'High risk of overcapacity as multiple players expand simultaneously.'
    } else {
      analysis.competitorReaction = `Mixed competitor response with ${competitorsExpanding} expanding and ${competitorsDelaying} delaying. Market is watching APP's execution carefully.`
      analysis.armsRaceRisk = 'Moderate risk - outcome depends on APP\'s execution speed.'
    }

    // Market pulp analysis
    const internalConsumption = appChinaDownstreamAdd * 1.2 // Rough estimate of pulp needed
    const excessCapacity = Math.max(0, appChinaPulpAdd - internalConsumption)
    if (excessCapacity > 0) {
      analysis.marketPulpQuestion = `APP may need to sell ${Math.round(excessCapacity)} kt of market pulp if internal downstream cannot absorb all new capacity. This could pressure Suzano and other international suppliers to reduce China allocations or accept lower prices.`
    } else {
      analysis.marketPulpQuestion = `APP's downstream expansion should absorb most new pulp capacity internally, minimizing market pulp exposure and reducing competitive pressure on international suppliers.`
    }

    // Exporter reaction
    if (avgChinaShare < 0.45) {
      analysis.exporterReaction = `Suzano and other international suppliers are diversifying away from China (${Math.round(avgChinaShare * 100)}% avg allocation), potentially due to local capacity additions pressuring prices.`
    } else if (avgChinaShare > 0.55) {
      analysis.exporterReaction = `International suppliers maintain strong China focus (${Math.round(avgChinaShare * 100)}% avg allocation), indicating attractive pricing despite local capacity additions.`
    } else {
      analysis.exporterReaction = `International suppliers maintaining balanced allocation strategy (${Math.round(avgChinaShare * 100)}% to China), hedging between regional markets.`
    }

    // Supply/demand impact
    const totalNewCapacity = appChinaPulpAdd + totalCompetitorPulpChange
    if (totalNewCapacity > 500) {
      analysis.supplyDemandImpact = `Significant supply addition of ${totalNewCapacity} kt will likely create oversupply conditions, pressuring utilization rates and prices.`
    } else if (totalNewCapacity > 200) {
      analysis.supplyDemandImpact = `Moderate supply addition of ${totalNewCapacity} kt should be absorbed by demand growth, maintaining market balance.`
    } else {
      analysis.supplyDemandImpact = `Limited net capacity change of ${totalNewCapacity} kt suggests tight supply conditions may persist.`
    }

    // Profit pool impact
    if (competitorsDelaying > competitorsExpanding && avgChinaShare < 0.5) {
      analysis.profitPoolImpact = `Industry profit pool likely to improve as competitors retreat and exporters diversify. APP positioned to capture market share at healthy margins.`
    } else if (competitorsExpanding > competitorsDelaying) {
      analysis.profitPoolImpact = `Industry profit pool at risk of compression due to capacity competition. Margins may decline 10-20% as utilization rates fall.`
    } else {
      analysis.profitPoolImpact = `Industry profit pool impact uncertain. APP's execution and demand growth will determine margin trajectory.`
    }

    return analysis
  }

  const strategicAnalysis = generateStrategicAnalysis()

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-3 rounded-lg bg-primary/5 border border-primary/20 px-4 py-3">
        <Bot className="h-5 w-5 text-primary" />
        <div>
          <h3 className="font-semibold text-primary">Pulp Capacity Decisions & Market Impact</h3>
          <p className="text-xs text-muted-foreground">
            How competitors and exporters respond to APP's pulp capacity expansion
          </p>
        </div>
      </div>

      {/* Strategic Questions Overview */}
      <Card className="border-purple-300 bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 shadow-lg shadow-purple-200/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm text-purple-700">
            <HelpCircle className="h-4 w-4 text-purple-600" />
            Key Strategic Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Summary Stats */}
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
            
            {/* Arms Race Risk */}
            <div className="rounded-lg bg-white/80 border border-purple-200 p-3">
              <p className="text-xs text-purple-600 mb-1">Arms Race Risk</p>
              <p className={cn(
                'text-lg font-bold',
                competitorsExpanding > competitorsDelaying ? 'text-red-600' : 
                competitorsDelaying > competitorsExpanding ? 'text-green-600' : 'text-amber-600'
              )}>
                {competitorsExpanding > competitorsDelaying ? 'High' : 
                 competitorsDelaying > competitorsExpanding ? 'Low' : 'Medium'}
              </p>
              <p className="text-xs text-purple-500">
                {competitorsExpanding > competitorsDelaying ? 'Provokes expansion' : 
                 competitorsDelaying > competitorsExpanding ? 'Pre-empts others' : 'Uncertain'}
              </p>
            </div>
          </div>
          
          {/* Strategic Questions & Analysis */}
          <div className="space-y-3 border-t border-purple-200 pt-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-purple-800">How might other local players react?</p>
                <p className="text-sm text-gray-700">{strategicAnalysis.competitorReaction}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-purple-800">What volume of market pulp can be sold externally?</p>
                <p className="text-sm text-gray-700">{strategicAnalysis.marketPulpQuestion}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-purple-800">How might Suzano and international suppliers react?</p>
                <p className="text-sm text-gray-700">{strategicAnalysis.exporterReaction}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-purple-800">Impact on supply/demand balance and profit pool</p>
                <p className="text-sm text-gray-700">{strategicAnalysis.supplyDemandImpact} {strategicAnalysis.profitPoolImpact}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
    </div>
  )
}
