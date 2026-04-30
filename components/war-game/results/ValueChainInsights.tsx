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
        <h3 className="font-bold text-foreground">Strategic Insights</h3>
        <span className="text-xs text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded">Value Chain Flow</span>
        <p className="text-xs text-muted-foreground ml-auto">Click a stage to explore details</p>
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
                      'font-semibold text-sm',
                      isActive ? 'text-foreground' : 'text-muted-foreground'
                    )}>
                      {stage.label}
                    </h4>
                    <p className="text-xs text-muted-foreground">{stage.description}</p>
                  </div>
                </div>

                {/* Metrics */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      'px-2 py-1 rounded text-xs font-medium',
                      getStatusColor(data.status, isActive)
                    )}>
                      {data.primaryMetric}
                    </span>
                    <span className={cn(
                      'font-mono font-bold text-sm',
                      isActive ? 'text-foreground' : 'text-muted-foreground'
                    )}>
                      {data.primaryValue}
                    </span>
                  </div>
                  
                  {/* Insight preview */}
                  <p className={cn(
                    'text-xs leading-relaxed line-clamp-2',
                    isActive ? 'text-muted-foreground' : 'text-muted-foreground/70'
                  )}>
                    {data.insight}
                  </p>
                </div>

                {/* Active indicator */}
                {isActive && (
                  <div className={cn(
                    'mt-3 pt-2 border-t text-xs font-medium flex items-center gap-1',
                    stage.id === 'forestry' && 'border-green-200 text-green-600',
                    stage.id === 'pulp' && 'border-blue-200 text-blue-600',
                    stage.id === 'downstream' && 'border-purple-200 text-purple-600'
                  )}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                    Viewing Details
                  </div>
                )}
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
                  <span className="text-[9px] text-muted-foreground text-center mt-1">
                    {index === 0 ? 'feeds' : 'drives'}
                  </span>
                </div>
              )}
            </Fragment>
          )
        })}
      </div>

      {/* Story Flow Indicator */}
      <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-muted/30 text-xs text-muted-foreground">
        <span className="font-medium">Story Flow:</span>
        <span className={cn(activeStage === 'forestry' && 'text-green-600 font-semibold')}>
          Wood Supply
        </span>
        <ArrowRight className="h-3 w-3" />
        <span className={cn(activeStage === 'pulp' && 'text-blue-600 font-semibold')}>
          Pulp Capacity
        </span>
        <ArrowRight className="h-3 w-3" />
        <span className={cn(activeStage === 'downstream' && 'text-purple-600 font-semibold')}>
          Market Absorption
        </span>
      </div>
    </div>
  )
}
