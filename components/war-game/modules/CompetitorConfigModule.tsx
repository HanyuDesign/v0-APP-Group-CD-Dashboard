'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Users, Shield, Target, Clock, Gauge, ChevronRight, Info, Lightbulb, 
  Plus, TreePine, Factory, Package, FileText, Bath, TrendingUp, TrendingDown,
  Minus, Edit3, Check
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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
const COMPETITOR_STRATEGIES: Record<string, { name: string; strategy: string; baseCapacity: number; defaultSettings: CompetitorBehaviorSettings }> = {
  'sun-paper': {
    name: 'Sun Paper',
    strategy: 'Defend market share, Maintain high utilization, Conservative expansion',
    baseCapacity: 850,
    defaultSettings: {
      capacityReactionStyle: 'follow-the-leader',
      followRatio: 40,
      reactionTiming: '1-year-lag',
      utilizationTarget: 'high',
    },
  },
  'chenming': {
    name: 'Chenming',
    strategy: 'Regional focus, Cost leadership, Gradual expansion',
    baseCapacity: 620,
    defaultSettings: {
      capacityReactionStyle: 'follow-the-leader',
      followRatio: 35,
      reactionTiming: '1-year-lag',
      utilizationTarget: 'flexible',
    },
  },
  'liansheng': {
    name: 'Liansheng',
    strategy: 'Niche segments, Premium positioning, Selective growth',
    baseCapacity: 480,
    defaultSettings: {
      capacityReactionStyle: 'defensive',
      followRatio: 25,
      reactionTiming: '2-year-lag',
      utilizationTarget: 'high',
    },
  },
  'others-china': {
    name: 'Others China',
    strategy: 'Fragmented players, Price sensitive, Opportunistic expansion',
    baseCapacity: 1200,
    defaultSettings: {
      capacityReactionStyle: 'follow-the-leader',
      followRatio: 30,
      reactionTiming: '1-year-lag',
      utilizationTarget: 'balanced',
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

// Calculate derived metrics for upstream, pulp, downstream
function calculateDerivedMetrics(settings: CompetitorBehaviorSettings, baseCapacity: number, appAdditions: YearlyCapacity) {
  const totalAppAddition = Object.values(appAdditions).reduce((a, b) => a + b, 0)
  const totalCompetitorAddition = Math.round(totalAppAddition * (settings.followRatio / 100) * 
    (settings.capacityReactionStyle === 'aggressive' ? 1.2 : settings.capacityReactionStyle === 'defensive' ? 0.7 : 1.0))
  
  // Upstream metrics
  const importChangePercent = settings.capacityReactionStyle === 'aggressive' 
    ? Math.round(settings.followRatio * 0.4) 
    : settings.capacityReactionStyle === 'defensive' 
    ? Math.round(-settings.followRatio * 0.2)
    : Math.round(settings.followRatio * 0.2)
  
  const domesticSourcing = settings.utilizationTarget === 'high' 
    ? 'Increase domestic procurement'
    : settings.utilizationTarget === 'flexible'
    ? 'Opportunistic sourcing'
    : 'Balanced domestic/import'
  
  const costImpact = settings.capacityReactionStyle === 'aggressive' ? 'elevated' : 
    settings.capacityReactionStyle === 'defensive' ? 'controlled' : 'moderate'
  
  // Pulp metrics
  const pulpAddition = totalCompetitorAddition
  const timingDelay = settings.reactionTiming === 'immediate' ? 'Same year as APP'
    : settings.reactionTiming === '1-year-lag' ? '1 year after APP'
    : '2 years after APP'
  
  // Downstream allocation
  const downstreamAllocation = {
    paper: {
      change: settings.utilizationTarget === 'high' ? 'maintain' : 
        settings.capacityReactionStyle === 'aggressive' ? 'expand' : 'reduce',
      intent: settings.utilizationTarget === 'high' ? 'Defend share' : 
        settings.capacityReactionStyle === 'aggressive' ? 'Capture share' : 'Reduce exposure',
    },
    packaging: {
      change: settings.capacityReactionStyle === 'aggressive' ? 'expand' : 'maintain',
      intent: settings.capacityReactionStyle === 'aggressive' ? 'Growth priority' : 'Stable positioning',
    },
    tissue: {
      change: settings.capacityReactionStyle === 'defensive' ? 'reduce' : 'maintain',
      intent: settings.capacityReactionStyle === 'defensive' ? 'Reduce exposure' : 'Balanced allocation',
    },
  }
  
  return {
    upstream: { importChangePercent, domesticSourcing, costImpact },
    pulp: { addition: pulpAddition, timing: timingDelay },
    downstream: downstreamAllocation,
  }
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
  const [editingCapacity, setEditingCapacity] = useState<number | null>(null)
  const [capacityOverrides, setCapacityOverrides] = useState<Record<string, YearlyCapacity>>({})
  
  const selectedConfig = config.find(c => c.playerId === selectedCompetitor)
  const selectedStrategy = COMPETITOR_STRATEGIES[selectedCompetitor]
  
  const derivedCapacity = useMemo(() => {
    if (!selectedConfig || !selectedStrategy) return null
    // Use override if exists, otherwise calculate
    if (capacityOverrides[selectedCompetitor]) {
      return capacityOverrides[selectedCompetitor]
    }
    return calculateDerivedCapacity(
      appCapacityAdditions, 
      selectedConfig.behaviorSettings, 
      selectedStrategy.baseCapacity
    )
  }, [selectedConfig, selectedStrategy, appCapacityAdditions, capacityOverrides, selectedCompetitor])
  
  const derivedMetrics = useMemo(() => {
    if (!selectedConfig || !selectedStrategy) return null
    return calculateDerivedMetrics(
      selectedConfig.behaviorSettings,
      selectedStrategy.baseCapacity,
      appCapacityAdditions
    )
  }, [selectedConfig, selectedStrategy, appCapacityAdditions])
  
  const handleSettingChange = (
    playerId: string,
    key: keyof CompetitorBehaviorSettings,
    value: CapacityReactionStyle | ReactionTiming | UtilizationTarget | number
  ) => {
    // Clear capacity override when settings change
    setCapacityOverrides(prev => {
      const updated = { ...prev }
      delete updated[playerId]
      return updated
    })
    
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
  
  const handleCapacityOverride = (year: number, value: number) => {
    setCapacityOverrides(prev => ({
      ...prev,
      [selectedCompetitor]: {
        ...(prev[selectedCompetitor] || derivedCapacity || { 2026: 0, 2027: 0, 2028: 0, 2029: 0, 2030: 0, 2031: 0 }),
        [year]: value,
      }
    }))
    setEditingCapacity(null)
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-280px)] min-h-[600px]">
      {/* LEFT SIDEBAR - Competitor Selection */}
      <div className="w-56 flex-shrink-0 space-y-2">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 mb-3">
          Competitors
        </div>
        {config.map((competitor) => (
          <button
            key={competitor.playerId}
            onClick={() => setSelectedCompetitor(competitor.playerId)}
            className={cn(
              'w-full px-3 py-2.5 rounded-lg text-left transition-all flex items-center justify-between',
              selectedCompetitor === competitor.playerId
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted/50 text-foreground hover:bg-muted'
            )}
          >
            <span className="font-medium text-sm">{competitor.playerName}</span>
            {competitor.isEdited && (
              <span className={cn(
                'h-2 w-2 rounded-full',
                selectedCompetitor === competitor.playerId ? 'bg-primary-foreground/50' : 'bg-amber-500'
              )} />
            )}
          </button>
        ))}
        
        {/* Add Competitor Button */}
        <button className="w-full px-3 py-2.5 rounded-lg text-left transition-all flex items-center gap-2 border border-dashed border-border/50 text-muted-foreground hover:border-border hover:text-foreground">
          <Plus className="h-4 w-4" />
          <span className="text-sm">Add Competitor</span>
        </button>
      </div>
      
      {/* RIGHT PANEL - Main Content */}
      {selectedConfig && selectedStrategy && derivedCapacity && derivedMetrics && (
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {/* Section 1: Strategy Summary (Read-only) */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
                  <Shield className="h-3.5 w-3.5 text-slate-600" />
                </div>
                <CardTitle className="text-sm font-semibold">Strategy Summary</CardTitle>
                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Read-only</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm text-foreground mb-2">{selectedConfig.playerName} Strategy:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedConfig.strategy.split(', ').map((item, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-xs text-muted-foreground">
                        <ChevronRight className="h-3 w-3" />
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-muted-foreground">Base Capacity</div>
                  <div className="text-lg font-bold text-foreground">{selectedStrategy.baseCapacity} kt</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Behavior Settings (User-adjustable) */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100">
                  <Target className="h-3.5 w-3.5 text-blue-600" />
                </div>
                <CardTitle className="text-sm font-semibold">Behavior Settings</CardTitle>
                <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">User Input</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-4">
                {/* Capacity Reaction Style */}
                <div className="space-y-2">
                  <label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                    <Gauge className="h-3 w-3" />
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
                          <TooltipContent side="bottom">
                            <p className="text-xs">{REACTION_STYLE_LABELS[style].description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                </div>

                {/* Reaction Timing */}
                <div className="space-y-2">
                  <label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-3 w-3" />
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
                          <TooltipContent side="bottom">
                            <p className="text-xs">{TIMING_LABELS[timing].description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                </div>

                {/* Follow Ratio Slider */}
                <div className="space-y-2">
                  <label className="text-xs font-medium flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3 w-3" />
                      Follow Ratio to APP
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
                    <span>0%</span>
                    <span>80%</span>
                  </div>
                </div>

                {/* Utilization Target */}
                <div className="space-y-2">
                  <label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                    <Gauge className="h-3 w-3" />
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
                          <TooltipContent side="bottom">
                            <p className="text-xs">{UTILIZATION_LABELS[target].description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Derived Actions (Auto-calculated) */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-600" />
                </div>
                <CardTitle className="text-sm font-semibold">Derived Actions</CardTitle>
                <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Auto-calculated</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              {/* A. Upstream (Woodchip Strategy) */}
              <div className="rounded-lg border border-border/50 p-3">
                <div className="flex items-center gap-2 mb-3">
                  <TreePine className="h-4 w-4 text-green-600" />
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">A. Upstream (Woodchip Strategy)</h4>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-2 rounded-md bg-muted/50">
                    <div className="text-[10px] text-muted-foreground mb-1">Import Volume Change</div>
                    <div className={cn(
                      'text-sm font-bold flex items-center justify-center gap-1',
                      derivedMetrics.upstream.importChangePercent > 0 ? 'text-emerald-600' : 
                      derivedMetrics.upstream.importChangePercent < 0 ? 'text-amber-600' : 'text-foreground'
                    )}>
                      {derivedMetrics.upstream.importChangePercent > 0 ? <TrendingUp className="h-3 w-3" /> : 
                       derivedMetrics.upstream.importChangePercent < 0 ? <TrendingDown className="h-3 w-3" /> : null}
                      {derivedMetrics.upstream.importChangePercent > 0 ? '+' : ''}{derivedMetrics.upstream.importChangePercent}%
                    </div>
                  </div>
                  <div className="text-center p-2 rounded-md bg-muted/50">
                    <div className="text-[10px] text-muted-foreground mb-1">Domestic Sourcing</div>
                    <div className="text-xs font-medium text-foreground">{derivedMetrics.upstream.domesticSourcing}</div>
                  </div>
                  <div className="text-center p-2 rounded-md bg-muted/50">
                    <div className="text-[10px] text-muted-foreground mb-1">Cost Impact</div>
                    <div className={cn(
                      'text-xs font-medium capitalize',
                      derivedMetrics.upstream.costImpact === 'elevated' ? 'text-red-600' :
                      derivedMetrics.upstream.costImpact === 'controlled' ? 'text-emerald-600' : 'text-amber-600'
                    )}>
                      {derivedMetrics.upstream.costImpact}
                    </div>
                  </div>
                </div>
              </div>

              {/* B. Pulp Capacity Response */}
              <div className="rounded-lg border border-border/50 p-3">
                <div className="flex items-center gap-2 mb-3">
                  <Factory className="h-4 w-4 text-blue-600" />
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">B. Pulp Capacity Response</h4>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="text-center p-2 rounded-md bg-muted/50">
                    <div className="text-[10px] text-muted-foreground mb-1">Total Capacity Addition</div>
                    <div className="text-sm font-bold text-foreground">+{derivedMetrics.pulp.addition} kt</div>
                  </div>
                  <div className="text-center p-2 rounded-md bg-muted/50">
                    <div className="text-[10px] text-muted-foreground mb-1">Timing</div>
                    <div className="text-xs font-medium text-foreground">{derivedMetrics.pulp.timing}</div>
                  </div>
                </div>
                
                {/* Projected Capacity - Editable */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[10px] text-muted-foreground font-medium">Projected Capacity (kt)</div>
                    <div className="text-[10px] text-blue-600">Click to edit</div>
                  </div>
                  <div className="grid grid-cols-6 gap-1">
                    {years.map(year => {
                      const isEditing = editingCapacity === year
                      const value = derivedCapacity[year]
                      const isOverridden = capacityOverrides[selectedCompetitor]?.[year] !== undefined
                      
                      return (
                        <div key={year} className="text-center">
                          <div className="text-[10px] text-muted-foreground mb-1">{year}</div>
                          {isEditing ? (
                            <div className="flex gap-0.5">
                              <Input
                                type="number"
                                defaultValue={value}
                                className="h-7 text-xs text-center px-1"
                                autoFocus
                                onBlur={(e) => handleCapacityOverride(year, parseInt(e.target.value) || value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleCapacityOverride(year, parseInt((e.target as HTMLInputElement).value) || value)
                                  } else if (e.key === 'Escape') {
                                    setEditingCapacity(null)
                                  }
                                }}
                              />
                            </div>
                          ) : (
                            <button
                              onClick={() => setEditingCapacity(year)}
                              className={cn(
                                'w-full py-1.5 text-xs font-mono font-semibold rounded transition-all',
                                isOverridden 
                                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                  : 'bg-muted/50 text-foreground hover:bg-muted'
                              )}
                            >
                              {value}
                              {isOverridden && <span className="ml-0.5 text-[8px]">*</span>}
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* C. Downstream Allocation */}
              <div className="rounded-lg border border-border/50 p-3">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="h-4 w-4 text-purple-600" />
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">C. Downstream Allocation</h4>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {/* Paper */}
                  <div className="p-2 rounded-md bg-muted/50">
                    <div className="flex items-center gap-1.5 mb-2">
                      <FileText className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] font-medium text-muted-foreground">Paper</span>
                    </div>
                    <div className="space-y-1">
                      <div className={cn(
                        'text-xs font-medium flex items-center gap-1',
                        derivedMetrics.downstream.paper.change === 'expand' ? 'text-emerald-600' :
                        derivedMetrics.downstream.paper.change === 'reduce' ? 'text-amber-600' : 'text-foreground'
                      )}>
                        {derivedMetrics.downstream.paper.change === 'expand' ? <TrendingUp className="h-3 w-3" /> :
                         derivedMetrics.downstream.paper.change === 'reduce' ? <TrendingDown className="h-3 w-3" /> :
                         <Minus className="h-3 w-3" />}
                        {derivedMetrics.downstream.paper.change.charAt(0).toUpperCase() + derivedMetrics.downstream.paper.change.slice(1)}
                      </div>
                      <div className="text-[10px] text-muted-foreground">{derivedMetrics.downstream.paper.intent}</div>
                    </div>
                  </div>
                  
                  {/* Packaging */}
                  <div className="p-2 rounded-md bg-muted/50">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Package className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] font-medium text-muted-foreground">Packaging</span>
                    </div>
                    <div className="space-y-1">
                      <div className={cn(
                        'text-xs font-medium flex items-center gap-1',
                        derivedMetrics.downstream.packaging.change === 'expand' ? 'text-emerald-600' :
                        derivedMetrics.downstream.packaging.change === 'reduce' ? 'text-amber-600' : 'text-foreground'
                      )}>
                        {derivedMetrics.downstream.packaging.change === 'expand' ? <TrendingUp className="h-3 w-3" /> :
                         derivedMetrics.downstream.packaging.change === 'reduce' ? <TrendingDown className="h-3 w-3" /> :
                         <Minus className="h-3 w-3" />}
                        {derivedMetrics.downstream.packaging.change.charAt(0).toUpperCase() + derivedMetrics.downstream.packaging.change.slice(1)}
                      </div>
                      <div className="text-[10px] text-muted-foreground">{derivedMetrics.downstream.packaging.intent}</div>
                    </div>
                  </div>
                  
                  {/* Tissue */}
                  <div className="p-2 rounded-md bg-muted/50">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Bath className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] font-medium text-muted-foreground">Tissue</span>
                    </div>
                    <div className="space-y-1">
                      <div className={cn(
                        'text-xs font-medium flex items-center gap-1',
                        derivedMetrics.downstream.tissue.change === 'expand' ? 'text-emerald-600' :
                        derivedMetrics.downstream.tissue.change === 'reduce' ? 'text-amber-600' : 'text-foreground'
                      )}>
                        {derivedMetrics.downstream.tissue.change === 'expand' ? <TrendingUp className="h-3 w-3" /> :
                         derivedMetrics.downstream.tissue.change === 'reduce' ? <TrendingDown className="h-3 w-3" /> :
                         <Minus className="h-3 w-3" />}
                        {derivedMetrics.downstream.tissue.change.charAt(0).toUpperCase() + derivedMetrics.downstream.tissue.change.slice(1)}
                      </div>
                      <div className="text-[10px] text-muted-foreground">{derivedMetrics.downstream.tissue.intent}</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Helper text */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border/50">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Behavior settings drive derived actions in real-time. Projected capacity values are auto-calculated but can be manually overridden by clicking on them.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
