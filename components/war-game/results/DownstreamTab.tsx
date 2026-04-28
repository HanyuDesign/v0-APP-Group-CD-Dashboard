'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { FileText, Package, Bath, Bot, Lightbulb, TrendingUp, TrendingDown } from 'lucide-react'
import { AIBadge } from '../shared/AIBadge'
import { TrafficLight } from '../shared/TrafficLight'
import type { SimulationResult } from '@/lib/types/war-game'

interface DownstreamTabProps {
  result: SimulationResult
}

export function DownstreamTab({ result }: DownstreamTabProps) {
  const { segmentOutcomes, input } = result

  // Segment icons mapping
  const segmentIcons: Record<string, React.ReactNode> = {
    paper: <FileText className="h-5 w-5 text-muted-foreground" />,
    board: <Package className="h-5 w-5 text-chart-3" />,
    tissue: <Bath className="h-5 w-5 text-chart-2" />,
  }

  const segmentLabels: Record<string, string> = {
    paper: 'Paper',
    board: 'Packaging / Carton Board',
    tissue: 'Tissue',
  }

  // Calculate APP's downstream additions
  const appBoardAdd = 
    (input.appCapacity.guangxi.includeBoard ? input.appCapacity.guangxi.boardCapacity : 0) +
    (input.appCapacity.jiangsuFujian.includeBoard ? input.appCapacity.jiangsuFujian.boardCapacity : 0)
  const appTissueAdd = 
    (input.appCapacity.guangxi.includeTissue ? input.appCapacity.guangxi.tissueCapacity : 0) +
    (input.appCapacity.jiangsuFujian.includeTissue ? input.appCapacity.jiangsuFujian.tissueCapacity : 0)

  // Generate segment insights
  const generateSegmentInsights = () => {
    const insights: string[] = []

    segmentOutcomes.forEach(outcome => {
      if (outcome.supplyDemandBalance > 100) {
        insights.push(`${segmentLabels[outcome.segment]}: Significant oversupply (${Math.round(outcome.supplyDemandBalance)} kt surplus) will pressure prices and margins.`)
      } else if (outcome.supplyDemandBalance < -50) {
        insights.push(`${segmentLabels[outcome.segment]}: Supply shortage (${Math.abs(Math.round(outcome.supplyDemandBalance))} kt deficit) creates pricing power opportunity.`)
      }
      
      if (outcome.utilization < 80) {
        insights.push(`${segmentLabels[outcome.segment]}: Low utilization (${Math.round(outcome.utilization)}%) indicates excess capacity in the market.`)
      }
    })

    // Overall insights
    const avgUtilization = segmentOutcomes.reduce((s, o) => s + o.utilization, 0) / segmentOutcomes.length
    if (avgUtilization >= 85) {
      insights.push(`Overall downstream market remains healthy with ${Math.round(avgUtilization)}% average utilization.`)
    } else {
      insights.push(`Downstream market facing utilization pressure at ${Math.round(avgUtilization)}% average.`)
    }

    return insights
  }

  const insights = generateSegmentInsights()

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-3 rounded-lg bg-primary/5 border border-primary/20 px-4 py-3">
        <Bot className="h-5 w-5 text-primary" />
        <div>
          <h3 className="font-semibold text-primary">Downstream Segment Outcomes</h3>
          <p className="text-xs text-muted-foreground">
            Supply-demand balance and margin outlook for Paper, Packaging/Board, and Tissue markets
          </p>
        </div>
      </div>

      {/* AI Insights Overview */}
      <Card className="border-purple-300 bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 shadow-lg shadow-purple-200/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm text-purple-700">
            <Lightbulb className="h-4 w-4 text-purple-600" />
            Downstream Market Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            {segmentOutcomes.map(outcome => (
              <div key={outcome.segment} className="rounded-lg bg-white/80 border border-purple-200 p-3">
                <div className="flex items-center gap-2 mb-2">
                  {segmentIcons[outcome.segment]}
                  <p className="text-xs text-purple-600 font-medium">{segmentLabels[outcome.segment]}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold text-gray-800">{Math.round(outcome.utilization)}%</p>
                    <p className="text-xs text-purple-500">Utilization</p>
                  </div>
                  <TrafficLight
                    status={
                      outcome.utilization >= 90 ? 'green' :
                      outcome.utilization >= 80 ? 'amber' : 'red'
                    }
                    size="lg"
                  />
                </div>
              </div>
            ))}
            
            {/* APP Downstream Strategy */}
            <div className="rounded-lg bg-purple-100 border border-purple-200 p-3">
              <p className="text-xs text-purple-600 mb-1">APP Downstream</p>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-purple-500">Board:</span>
                  <span className="font-mono text-sm font-bold text-purple-700">+{appBoardAdd} kt</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-purple-500">Tissue:</span>
                  <span className="font-mono text-sm font-bold text-purple-700">+{appTissueAdd} kt</span>
                </div>
              </div>
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

      {/* Detailed Segment Cards */}
      <div className="grid grid-cols-3 gap-4">
        {segmentOutcomes.map(outcome => (
          <Card key={outcome.segment} className="border-border/50 bg-card/80">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  {segmentIcons[outcome.segment]}
                  {segmentLabels[outcome.segment]}
                </CardTitle>
                <AIBadge size="sm" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Supply-demand balance - max 600 kt (-300 to +300) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Supply-Demand Balance</span>
                  <span className={cn(
                    'font-mono font-semibold',
                    outcome.supplyDemandBalance > 100 && 'text-destructive',
                    outcome.supplyDemandBalance < -50 && 'text-success',
                    Math.abs(outcome.supplyDemandBalance) <= 100 && 'text-warning'
                  )}>
                    {outcome.supplyDemandBalance > 0 ? 'Surplus ' : 'Shortage '}
                    {Math.abs(Math.round(outcome.supplyDemandBalance))} kt
                  </span>
                </div>
                <div className="h-3 rounded-full bg-secondary relative overflow-hidden">
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
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <TrendingDown className="h-3 w-3" />
                    Shortage
                  </span>
                  <span>Balanced</span>
                  <span className="flex items-center gap-1">
                    Surplus
                    <TrendingUp className="h-3 w-3" />
                  </span>
                </div>
              </div>
              
              {/* Utilization */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Capacity Utilization</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold">
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
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div 
                    className={cn(
                      'h-full transition-all',
                      outcome.utilization >= 90 && 'bg-success',
                      outcome.utilization >= 80 && outcome.utilization < 90 && 'bg-warning',
                      outcome.utilization < 80 && 'bg-destructive'
                    )}
                    style={{ width: `${outcome.utilization}%` }}
                  />
                </div>
              </div>
              
              {/* Margin pressure */}
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <span className="text-sm text-muted-foreground">Margin Pressure</span>
                <span className={cn(
                  'text-sm font-semibold px-2 py-0.5 rounded',
                  outcome.marginPressure === 'high' && 'bg-success/10 text-success',
                  outcome.marginPressure === 'medium' && 'bg-warning/10 text-warning',
                  outcome.marginPressure === 'low' && 'bg-destructive/10 text-destructive'
                )}>
                  {outcome.marginPressure === 'high' ? 'Low Pressure' : 
                   outcome.marginPressure === 'medium' ? 'Medium Pressure' : 'High Pressure'}
                </span>
              </div>

              {/* Demand scenario from input */}
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <span className="text-sm text-muted-foreground">Demand Scenario</span>
                <span className={cn(
                  'text-sm font-medium flex items-center gap-1',
                  outcome.segment === 'paper' && input.downstream.paperDemand === 'high' && 'text-green-600',
                  outcome.segment === 'paper' && input.downstream.paperDemand === 'low' && 'text-red-600',
                  outcome.segment === 'board' && input.downstream.boardDemand === 'high' && 'text-green-600',
                  outcome.segment === 'board' && input.downstream.boardDemand === 'low' && 'text-red-600',
                  outcome.segment === 'tissue' && input.downstream.tissueDemand === 'high' && 'text-green-600',
                  outcome.segment === 'tissue' && input.downstream.tissueDemand === 'low' && 'text-red-600'
                )}>
                  {outcome.segment === 'paper' && (
                    <>
                      {input.downstream.paperDemand === 'high' && <TrendingUp className="h-3 w-3" />}
                      {input.downstream.paperDemand === 'low' && <TrendingDown className="h-3 w-3" />}
                      {input.downstream.paperDemand.charAt(0).toUpperCase() + input.downstream.paperDemand.slice(1)}
                    </>
                  )}
                  {outcome.segment === 'board' && (
                    <>
                      {input.downstream.boardDemand === 'high' && <TrendingUp className="h-3 w-3" />}
                      {input.downstream.boardDemand === 'low' && <TrendingDown className="h-3 w-3" />}
                      {input.downstream.boardDemand.charAt(0).toUpperCase() + input.downstream.boardDemand.slice(1)}
                    </>
                  )}
                  {outcome.segment === 'tissue' && (
                    <>
                      {input.downstream.tissueDemand === 'high' && <TrendingUp className="h-3 w-3" />}
                      {input.downstream.tissueDemand === 'low' && <TrendingDown className="h-3 w-3" />}
                      {input.downstream.tissueDemand.charAt(0).toUpperCase() + input.downstream.tissueDemand.slice(1)}
                    </>
                  )}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
