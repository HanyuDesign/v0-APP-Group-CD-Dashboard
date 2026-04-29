'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Shield, Target, Clock, Gauge, ChevronRight, Info, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Slider } from '@/components/ui/slider'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { 
  CompetitorConfig, 
  CompetitorBehaviorSettings,
  CapacityReactionStyle,
  ReactionTiming,
  UtilizationTarget,
  YearlyCapacity 
} from '@/lib/types/war-game'

interface CompetitorConfigModuleProps {
  config: CompetitorConfig[]
  onChange: (config: CompetitorConfig[]) => void
  appCapacityAdditions: YearlyCapacity
}

const years = [2026, 2027, 2028, 2029, 2030, 2031] as const

// Default competitor strategies
const COMPETITOR_STRATEGIES: Record<string, { name: string; strategy: string; defaultSettings: CompetitorBehaviorSettings }> = {
  'sun-paper': {
    name: 'Sun Paper',
    strategy: 'Defend market share, Maintain high utilization, Conservative expansion',
    defaultSettings: {
      capacityReactionStyle: 'follow-the-leader',
      followRatio: 40,
      reactionTiming: '1-year-lag',
      utilizationTarget: 'high',
    },
  },
  'nine-dragons': {
    name: 'Nine Dragons',
    strategy: 'Aggressive growth, Capture new segments, Price competition',
    defaultSettings: {
      capacityReactionStyle: 'aggressive',
      followRatio: 60,
      reactionTiming: 'immediate',
      utilizationTarget: 'balanced',
    },
  },
  'lee-man': {
    name: 'Lee & Man',
    strategy: 'Focus on profitability, Selective expansion, Premium positioning',
    defaultSettings: {
      capacityReactionStyle: 'defensive',
      followRatio: 25,
      reactionTiming: '2-year-lag',
      utilizationTarget: 'high',
    },
  },
  'chenming': {
    name: 'Chenming',
    strategy: 'Regional focus, Cost leadership, Gradual expansion',
    defaultSettings: {
      capacityReactionStyle: 'follow-the-leader',
      followRatio: 35,
      reactionTiming: '1-year-lag',
      utilizationTarget: 'flexible',
    },
  },
}

// Initialize competitor config
export function initializeCompetitorConfig(): CompetitorConfig[] {
  return Object.entries(COMPETITOR_STRATEGIES).map(([id, data]) => ({
    playerId: id,
    playerName: data.name,
    strategy: data.strategy,
    behaviorSettings: { ...data.defaultSettings },
    isEdited: false,
  }))
}

// Calculate derived capacity based on APP additions and competitor settings
function calculateDerivedCapacity(
  appAdditions: YearlyCapacity,
  settings: CompetitorBehaviorSettings,
  baseCapacity: number
): YearlyCapacity {
  const capacity: YearlyCapacity = { 2026: baseCapacity, 2027: 0, 2028: 0, 2029: 0, 2030: 0, 2031: 0 }
  let cumulative = baseCapacity
  
  const lagYears = settings.reactionTiming === 'immediate' ? 0 
    : settings.reactionTiming === '1-year-lag' ? 1 : 2
  
  const followMultiplier = settings.followRatio / 100
  const styleMultiplier = settings.capacityReactionStyle === 'aggressive' ? 1.2
    : settings.capacityReactionStyle === 'defensive' ? 0.7 : 1.0
  
  for (let i = 1; i < years.length; i++) {
    const year = years[i]
    const referenceYear = years[Math.max(0, i - lagYears)] as keyof YearlyCapacity
    const appAddition = appAdditions[referenceYear] || 0
    const addition = Math.round(appAddition * followMultiplier * styleMultiplier)
    cumulative += addition
    capacity[year] = cumulative
  }
  
  return capacity
}

// Generate derived action text
function getDerivedActionText(settings: CompetitorBehaviorSettings, playerName: string): string {
  const followText = `${settings.followRatio}% of APP's new capacity`
  const timingText = settings.reactionTiming === 'immediate' ? 'immediately'
    : settings.reactionTiming === '1-year-lag' ? 'with a 1-year delay'
    : 'with a 2-year delay'
  const utilizationText = settings.utilizationTarget === 'high' ? 'prioritizing utilization'
    : settings.utilizationTarget === 'balanced' ? 'balancing growth and utilization'
    : 'flexibly adjusting to market conditions'
  
  return `${playerName} will add ~${followText} ${timingText}, ${utilizationText}.`
}

// Reaction style labels
const REACTION_STYLE_LABELS: Record<CapacityReactionStyle, { label: string; description: string }> = {
  'aggressive': { label: 'Aggressive', description: 'Actively expand to capture market share' },
  'follow-the-leader': { label: 'Follow-the-Leader', description: 'Match APP expansion proportionally' },
  'defensive': { label: 'Defensive', description: 'Conservative response, focus on existing markets' },
}

const TIMING_LABELS: Record<ReactionTiming, { label: string; description: string }> = {
  'immediate': { label: 'Immediate', description: 'React in the same year as APP' },
  '1-year-lag': { label: '1-Year Lag', description: 'Respond one year after APP expansion' },
  '2-year-lag': { label: '2-Year Lag', description: 'Respond two years after APP expansion' },
}

const UTILIZATION_LABELS: Record<UtilizationTarget, { label: string; description: string }> = {
  'high': { label: 'High', description: 'Target 85%+ utilization, slower expansion' },
  'balanced': { label: 'Balanced', description: 'Target 75-85% utilization' },
  'flexible': { label: 'Flexible', description: 'Accept lower utilization for growth' },
}

export function CompetitorConfigModule({ config, onChange, appCapacityAdditions }: CompetitorConfigModuleProps) {
  const [selectedCompetitor, setSelectedCompetitor] = useState(config[0]?.playerId || 'sun-paper')
  
  const selectedConfig = config.find(c => c.playerId === selectedCompetitor)
  
  const handleSettingChange = (
    playerId: string,
    key: keyof CompetitorBehaviorSettings,
    value: CapacityReactionStyle | ReactionTiming | UtilizationTarget | number
  ) => {
    const updatedConfig = config.map(c => {
      if (c.playerId === playerId) {
        return {
          ...c,
          behaviorSettings: { ...c.behaviorSettings, [key]: value },
          isEdited: true,
        }
      }
      return c
    })
    onChange(updatedConfig)
  }

  return (
    <div className="space-y-4">
      {/* Competitor Selection Tabs */}
      <div className="flex gap-2 p-1 bg-muted/50 rounded-lg">
        {config.map((competitor) => (
          <button
            key={competitor.playerId}
            onClick={() => setSelectedCompetitor(competitor.playerId)}
            className={cn(
              'flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all',
              selectedCompetitor === competitor.playerId
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {competitor.playerName}
            {competitor.isEdited && (
              <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 inline-block" />
            )}
          </button>
        ))}
      </div>

      {selectedConfig && (
        <div className="grid grid-cols-3 gap-4">
          {/* Section 1: Strategy Summary (Read-only) */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                  <Shield className="h-4 w-4 text-slate-600" />
                </div>
                <CardTitle className="text-base">Strategy Summary</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-sm text-foreground mb-1">{selectedConfig.playerName} Strategy:</h4>
                  <ul className="space-y-1">
                    {selectedConfig.strategy.split(', ').map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <ChevronRight className="h-4 w-4 text-muted-foreground/50 mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="pt-2 border-t border-border/50">
                  <p className="text-xs text-muted-foreground italic">
                    This is the baseline competitive posture. Adjust behavior settings to model different scenarios.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Behavior Settings (User-adjustable) */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                  <Target className="h-4 w-4 text-blue-600" />
                </div>
                <CardTitle className="text-base">Behavior Settings</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Capacity Reaction Style */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
                  Capacity Reaction Style
                </label>
                <div className="flex gap-1">
                  {(Object.keys(REACTION_STYLE_LABELS) as CapacityReactionStyle[]).map((style) => (
                    <TooltipProvider key={style}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => handleSettingChange(selectedConfig.playerId, 'capacityReactionStyle', style)}
                            className={cn(
                              'flex-1 px-2 py-1.5 text-xs font-medium rounded-md border transition-all',
                              selectedConfig.behaviorSettings.capacityReactionStyle === style
                                ? 'bg-blue-50 border-blue-200 text-blue-700'
                                : 'bg-background border-border/50 text-muted-foreground hover:border-border'
                            )}
                          >
                            {REACTION_STYLE_LABELS[style].label}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{REACTION_STYLE_LABELS[style].description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </div>

              {/* Follow Ratio Slider */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    Follow Ratio to APP Expansion
                  </span>
                  <span className="text-blue-600 font-semibold">{selectedConfig.behaviorSettings.followRatio}%</span>
                </label>
                <Slider
                  value={[selectedConfig.behaviorSettings.followRatio]}
                  onValueChange={([value]) => handleSettingChange(selectedConfig.playerId, 'followRatio', value)}
                  min={0}
                  max={80}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>0% (No response)</span>
                  <span>80% (Strong follow)</span>
                </div>
              </div>

              {/* Reaction Timing */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  Reaction Timing
                </label>
                <div className="flex gap-1">
                  {(Object.keys(TIMING_LABELS) as ReactionTiming[]).map((timing) => (
                    <TooltipProvider key={timing}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => handleSettingChange(selectedConfig.playerId, 'reactionTiming', timing)}
                            className={cn(
                              'flex-1 px-2 py-1.5 text-xs font-medium rounded-md border transition-all',
                              selectedConfig.behaviorSettings.reactionTiming === timing
                                ? 'bg-blue-50 border-blue-200 text-blue-700'
                                : 'bg-background border-border/50 text-muted-foreground hover:border-border'
                            )}
                          >
                            {TIMING_LABELS[timing].label}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{TIMING_LABELS[timing].description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </div>

              {/* Utilization Target */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
                  Utilization Target
                </label>
                <div className="flex gap-1">
                  {(Object.keys(UTILIZATION_LABELS) as UtilizationTarget[]).map((target) => (
                    <TooltipProvider key={target}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => handleSettingChange(selectedConfig.playerId, 'utilizationTarget', target)}
                            className={cn(
                              'flex-1 px-2 py-1.5 text-xs font-medium rounded-md border transition-all',
                              selectedConfig.behaviorSettings.utilizationTarget === target
                                ? 'bg-blue-50 border-blue-200 text-blue-700'
                                : 'bg-background border-border/50 text-muted-foreground hover:border-border'
                            )}
                          >
                            {UTILIZATION_LABELS[target].label}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{UTILIZATION_LABELS[target].description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Derived Actions (Auto-calculated, read-only) */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
                  <Lightbulb className="h-4 w-4 text-amber-600" />
                </div>
                <CardTitle className="text-base">Derived Actions</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Derived action text */}
                <div className="p-3 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
                  <p className="text-sm text-amber-900 leading-relaxed">
                    {getDerivedActionText(selectedConfig.behaviorSettings, selectedConfig.playerName)}
                  </p>
                </div>

                {/* Projected capacity preview */}
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-2">Projected Capacity (kt)</h4>
                  <div className="grid grid-cols-6 gap-1 text-center">
                    {years.map(year => {
                      const baseCapacity = year === 2026 ? 800 : 0
                      const derivedCapacity = calculateDerivedCapacity(appCapacityAdditions, selectedConfig.behaviorSettings, 800)
                      return (
                        <div key={year} className="space-y-0.5">
                          <div className="text-[10px] text-muted-foreground">{year}</div>
                          <div className="text-xs font-mono font-semibold bg-muted/50 rounded py-1">
                            {derivedCapacity[year]}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Interpretation */}
                <div className="pt-2 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">
                    These parameters determine competitor capacity additions, timing, and pricing vs utilization trade-offs in the simulation.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Helper text */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border/50">
        <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <p className="text-sm text-muted-foreground">
          Configure how each competitor will respond to APP&apos;s expansion. These settings affect capacity additions, reaction timing, and market behavior in the simulation.
        </p>
      </div>
    </div>
  )
}
