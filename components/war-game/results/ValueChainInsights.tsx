'use client'

import { Fragment } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { ArrowRight, Trees, Factory, Package, TrendingUp, TrendingDown, Users, Globe, Lightbulb } from 'lucide-react'
import type { SimulationResult } from '@/lib/types/war-game'
import type { ValueChainStage } from './ResultsPanel'
import type { LucideIcon } from 'lucide-react'

interface ValueChainInsightsProps {
  result: SimulationResult
  activeStage: ValueChainStage
  onStageChange: (stage: ValueChainStage) => void
  stages: readonly {
    id: ValueChainStage
    label: string
    shortLabel: string
    icon: LucideIcon
    color: string
    description: string
  }[]
}

export function ValueChainInsights({ result, activeStage, onStageChange, stages }: ValueChainInsightsProps) {
  const { competitorChanges, exporterAllocations, segmentOutcomes, input } = result

  // Calculate summary metrics
  const appChinaPulpAdd = input.appCapacity.guangxi.pulpCapacity + input.appCapacity.jiangsuFujian.pulpCapacity
  const competitorsExpanding = competitorChanges.filter(c => c.action === 'add').length
  const competitorsDelaying = competitorChanges.filter(c => c.action === 'delay').length
  const totalCompetitorPulpChange = competitorChanges.reduce((sum, c) => sum + c.pulpChange, 0)
  const avgChinaShare = exporterAllocations.length > 0 
    ? exporterAllocations.reduce((sum, e) => sum + e.chinaShare, 0) / exporterAllocations.length 
    : 0
  const avgUtilization = segmentOutcomes.length > 0
    ? segmentOutcomes.reduce((sum, s) => sum + s.utilization, 0) / segmentOutcomes.length
    : 0

  // Generate stage-specific data
  const stageData = {
    forestry: {
      primaryMetric: appChinaPulpAdd > 200 ? 'High Demand' : appChinaPulpAdd > 100 ? 'Moderate' : 'Stable',
      primaryValue: `+${Math.round(appChinaPulpAdd * 2.2)} kt/yr`,
      status: appChinaPulpAdd > 200 ? 'warning' : appChinaPulpAdd > 100 ? 'neutral' : 'success',
      insight: appChinaPulpAdd > 200 
        ? 'Wood supply tightening due to aggressive expansion'
        : 'Balanced wood supply expected',
    },
    pulp: {
      primaryMetric: `${competitorsExpanding} expanding`,
      primaryValue: `${totalCompetitorPulpChange >= 0 ? '+' : ''}${totalCompetitorPulpChange} kt`,
      status: competitorsDelaying > competitorsExpanding ? 'success' : competitorsExpanding > competitorsDelaying ? 'warning' : 'neutral',
      insight: competitorsDelaying > competitorsExpanding
        ? 'Competitors cautious, strategic window for APP'
        : 'Competitive expansion may increase supply pressure',
    },
    downstream: {
      primaryMetric: `${avgUtilization.toFixed(0)}% util.`,
      primaryValue: segmentOutcomes.some(s => s.utilization < 75) ? 'Pressure' : 'Healthy',
      status: avgUtilization >= 85 ? 'success' : avgUtilization >= 75 ? 'neutral' : 'warning',
      insight: avgUtilization >= 85 
        ? 'Strong demand absorption expected'
        : 'Some margin pressure in underutilized segments',
    },
  }

  const getStatusColor = (status: string, isActive: boolean) => {
    if (!isActive) return 'bg-muted/50 text-muted-foreground'
    switch (status) {
      case 'success': return 'bg-emerald-100 text-emerald-700'
      case 'warning': return 'bg-amber-100 text-amber-700'
      default: return 'bg-blue-100 text-blue-700'
    }
  }

  const getStageColors = (stageId: ValueChainStage, isActive: boolean) => {
    const colors = {
      forestry: {
        border: isActive ? 'border-green-400' : 'border-border/50',
        bg: isActive ? 'bg-gradient-to-br from-green-50 to-emerald-50' : 'bg-card/80',
        icon: isActive ? 'text-green-600' : 'text-muted-foreground',
        accent: 'green',
      },
      pulp: {
        border: isActive ? 'border-blue-400' : 'border-border/50',
        bg: isActive ? 'bg-gradient-to-br from-blue-50 to-indigo-50' : 'bg-card/80',
        icon: isActive ? 'text-blue-600' : 'text-muted-foreground',
        accent: 'blue',
      },
      downstream: {
        border: isActive ? 'border-purple-400' : 'border-border/50',
        bg: isActive ? 'bg-gradient-to-br from-purple-50 to-pink-50' : 'bg-card/80',
        icon: isActive ? 'text-purple-600' : 'text-muted-foreground',
        accent: 'purple',
      },
    }
    return colors[stageId]
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Lightbulb className="h-5 w-5 text-indigo-600" />
        <h3 className="font-bold text-lg text-foreground">Strategic Insights</h3>
        <span className="text-sm font-medium text-indigo-600 bg-indigo-100 px-2.5 py-0.5 rounded">Value Chain Flow</span>
        <p className="text-sm text-muted-foreground ml-auto">Click a stage to explore details</p>
      </div>

      {/* Interactive Value Chain Cards */}
      <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] gap-3 items-stretch">
        {stages.map((stage, index) => {
          const isActive = activeStage === stage.id
          const data = stageData[stage.id]
          const colors = getStageColors(stage.id, isActive)
          const Icon = stage.icon
          const isLast = index === stages.length - 1

          return (
            <Fragment key={stage.id}>
              {/* Stage Card - Clickable */}
              <button
                onClick={() => onStageChange(stage.id)}
                className={cn(
                  'rounded-lg border-2 p-4 text-left transition-all',
                  colors.border,
                  colors.bg,
                  isActive ? 'shadow-md ring-2 ring-offset-2' : 'hover:shadow-sm hover:border-border',
                  isActive && stage.id === 'forestry' && 'ring-green-200',
                  isActive && stage.id === 'pulp' && 'ring-blue-200',
                  isActive && stage.id === 'downstream' && 'ring-purple-200'
                )}
              >
                {/* Header */}
                <div className="flex items-center gap-2 mb-3">
                  <div className={cn(
                    'p-1.5 rounded-lg',
                    isActive && stage.id === 'forestry' && 'bg-green-100',
                    isActive && stage.id === 'pulp' && 'bg-blue-100',
                    isActive && stage.id === 'downstream' && 'bg-purple-100',
                    !isActive && 'bg-muted'
                  )}>
                    <Icon className={cn('h-4 w-4', colors.icon)} />
                  </div>
                  <div>
                    <h4 className={cn(
                      'font-semibold text-base',
                      isActive ? 'text-foreground' : 'text-muted-foreground'
                    )}>
                      {stage.label}
                    </h4>
                    <p className="text-sm text-muted-foreground">{stage.description}</p>
                  </div>
                </div>

                {/* Metrics */}
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className={cn(
                      'font-mono font-bold text-3xl leading-tight tracking-tight tabular-nums',
                      isActive ? 'text-foreground' : 'text-muted-foreground'
                    )}>
                      {data.primaryValue}
                    </span>
                    <span className={cn(
                      'px-2.5 py-1 rounded text-base font-semibold flex-shrink-0',
                      getStatusColor(data.status, isActive)
                    )}>
                      {data.primaryMetric}
                    </span>
                  </div>
                  
                  {/* Insight preview */}
                  <p className={cn(
                    'text-sm leading-relaxed line-clamp-2',
                    isActive ? 'text-muted-foreground' : 'text-muted-foreground/70'
                  )}>
                    {data.insight}
                  </p>
                </div>

              </button>

              {/* Arrow connector */}
              {!isLast && (
                <div className="flex flex-col items-center justify-center">
                  <ArrowRight className={cn(
                    'h-5 w-5',
                    activeStage === stages[index + 1]?.id || activeStage === stage.id
                      ? 'text-primary'
                      : 'text-muted-foreground/30'
                  )} />
                  <span className="text-xs font-medium text-muted-foreground text-center mt-1 uppercase tracking-wide">
                    {index === 0 ? 'feeds' : 'drives'}
                  </span>
                </div>
              )}
            </Fragment>
          )
        })}
      </div>

    </div>
  )
}
