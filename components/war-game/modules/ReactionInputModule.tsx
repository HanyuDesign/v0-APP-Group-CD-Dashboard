'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain, Users, Ship, TrendingUp, Info, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ReactionSettings } from '@/lib/types/war-game'

interface ReactionInputModuleProps {
  settings: ReactionSettings
  onChange: (settings: ReactionSettings) => void
}

const COMPETITOR_BEHAVIOR_OPTIONS = [
  { 
    value: 'aggressive' as const, 
    label: 'Aggressive',
    description: 'Competitors expand capacity aggressively, prioritize market share over margins'
  },
  { 
    value: 'neutral' as const, 
    label: 'Neutral',
    description: 'Competitors follow baseline expansion plans with measured responses'
  },
  { 
    value: 'conservative' as const, 
    label: 'Conservative',
    description: 'Competitors delay or reduce capacity additions, focus on profitability'
  },
]

const EXPORTER_STRATEGY_OPTIONS = [
  { 
    value: 'china-focused' as const, 
    label: 'China-Focused',
    description: 'Global exporters prioritize China market allocation'
  },
  { 
    value: 'balanced' as const, 
    label: 'Balanced',
    description: 'Exporters maintain balanced allocation across regions'
  },
  { 
    value: 'diversified' as const, 
    label: 'Diversified',
    description: 'Exporters shift volume away from China to other markets'
  },
]

const DOWNSTREAM_REACTION_OPTIONS = [
  { 
    value: 'expand' as const, 
    label: 'Expand',
    description: 'Downstream players increase capacity to capture demand growth'
  },
  { 
    value: 'maintain' as const, 
    label: 'Maintain',
    description: 'Downstream players maintain current capacity levels'
  },
  { 
    value: 'contract' as const, 
    label: 'Contract',
    description: 'Downstream players reduce capacity due to margin pressure'
  },
]

export function ReactionInputModule({ settings, onChange }: ReactionInputModuleProps) {
  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <Brain className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Reaction & Behavior Settings</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Define how market participants react to your decisions
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-purple-50 border border-purple-200">
            <Lightbulb className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-purple-700">
              These settings control the AI-driven behavior of competitors, exporters, and downstream players in the simulation. 
              Different combinations create various market scenarios.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 3-Column Grid for Reaction Inputs */}
      <div className="grid grid-cols-3 gap-4">
        {/* Competitor Behavior */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <CardTitle className="text-base">Competitor Behavior</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground">
              How competitors respond to market changes
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {COMPETITOR_BEHAVIOR_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => onChange({ ...settings, competitorBehavior: option.value })}
                className={cn(
                  'w-full p-3 rounded-lg border text-left transition-all',
                  settings.competitorBehavior === option.value
                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                    : 'border-border/50 hover:border-blue-300 hover:bg-blue-50/50'
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={cn(
                    'font-medium text-sm',
                    settings.competitorBehavior === option.value ? 'text-blue-700' : ''
                  )}>
                    {option.label}
                  </span>
                  {settings.competitorBehavior === option.value && (
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {option.description}
                </p>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Exporter Strategy */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Ship className="h-4 w-4 text-emerald-600" />
              <CardTitle className="text-base">Exporter Strategy</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground">
              Global pulp exporters' allocation logic
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {EXPORTER_STRATEGY_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => onChange({ ...settings, exporterStrategy: option.value })}
                className={cn(
                  'w-full p-3 rounded-lg border text-left transition-all',
                  settings.exporterStrategy === option.value
                    ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500'
                    : 'border-border/50 hover:border-emerald-300 hover:bg-emerald-50/50'
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={cn(
                    'font-medium text-sm',
                    settings.exporterStrategy === option.value ? 'text-emerald-700' : ''
                  )}>
                    {option.label}
                  </span>
                  {settings.exporterStrategy === option.value && (
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {option.description}
                </p>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Downstream Reaction */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-amber-600" />
              <CardTitle className="text-base">Downstream Reaction</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground">
              How downstream players adjust capacity
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {DOWNSTREAM_REACTION_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => onChange({ ...settings, downstreamReaction: option.value })}
                className={cn(
                  'w-full p-3 rounded-lg border text-left transition-all',
                  settings.downstreamReaction === option.value
                    ? 'border-amber-500 bg-amber-50 ring-1 ring-amber-500'
                    : 'border-border/50 hover:border-amber-300 hover:bg-amber-50/50'
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={cn(
                    'font-medium text-sm',
                    settings.downstreamReaction === option.value ? 'text-amber-700' : ''
                  )}>
                    {option.label}
                  </span>
                  {settings.downstreamReaction === option.value && (
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {option.description}
                </p>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Summary Box */}
      <Card className="border-border/50 bg-muted/30">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium mb-1">Current Scenario Configuration</p>
              <p className="text-sm text-muted-foreground">
                Competitors: <span className="font-medium text-foreground">{settings.competitorBehavior}</span> | 
                Exporters: <span className="font-medium text-foreground">{settings.exporterStrategy}</span> | 
                Downstream: <span className="font-medium text-foreground">{settings.downstreamReaction}</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
