'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Users, Clock, Gauge, ChevronRight, Info, Lightbulb, 
  Plus, Factory, Package, FileText, TrendingUp, TrendingDown,
  Minus, Sparkles, Globe, Target, Wand2
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

// AI Strategy Profile types
type MarketShareFocus = 'defend' | 'expand' | 'selective'
type ProfitabilityFocus = 'margin-first' | 'balanced' | 'volume-first'
type CapacityStrategy = 'aggressive' | 'disciplined' | 'conservative'
type RiskAppetite = 'high' | 'medium' | 'low'
type CustomerStrategy = 'lock-in' | 'flexible' | 'opportunistic'

interface AIStrategyProfile {
  marketShareFocus: MarketShareFocus
  profitabilityFocus: ProfitabilityFocus
  capacityStrategy: CapacityStrategy
  riskAppetite: RiskAppetite
  customerStrategy: CustomerStrategy
}

// Downstream Strategy types
type TierStrategy = 'expand' | 'maintain' | 'reduce'

interface SegmentStrategy {
  premiumTier: TierStrategy
  midTier: TierStrategy
  exportPercent: number // 0-100, domestic = 100 - exportPercent
}

interface DownstreamStrategyInput {
  paper: SegmentStrategy
  packaging: SegmentStrategy
}

const DEFAULT_SEGMENT_STRATEGY: SegmentStrategy = {
  premiumTier: 'maintain',
  midTier: 'maintain',
  exportPercent: 30,
}

const TIER_STRATEGY_OPTIONS: { value: TierStrategy; label: string }[] = [
  { value: 'expand', label: 'Expand' },
  { value: 'maintain', label: 'Maintain' },
  { value: 'reduce', label: 'Reduce' },
]

interface AIInterpretation {
  summary: string
  profile: AIStrategyProfile
}

// AI Strategy Generation Logic - parses text input into structured signals
function generateStrategyFromText(text: string): AIInterpretation {
  // Parse signals from text
  const isAggressive = /aggressive|expand|growth|attack|offensive|increase capacity/i.test(text)
  const isDefensive = /defensive|protect|maintain|conservative|cautious|avoid/i.test(text)
  const isProfitFocused = /profit|margin|cost|efficiency|returns/i.test(text)
  const isVolumeFocused = /volume|market share|scale|dominat/i.test(text)
  const hasDelayMention = /delay|lag|wait|1.year|2.year|slow/i.test(text)
  const hasImmediateMention = /immediate|quick|fast|rapid|now/i.test(text)
  const hasHighRisk = /high risk|aggressive|bold|ambitious/i.test(text)
  const hasLowRisk = /low risk|safe|cautious|conservative|careful/i.test(text)
  const hasExportFocus = /export|international|global|overseas/i.test(text)
  const hasPackagingFocus = /packaging|carton|board/i.test(text)
  const hasUtilization = /utilization|capacity util|high util/i.test(text)
  
  // Determine Market Share Focus
  const marketShareFocus: MarketShareFocus = 
    isAggressive || isVolumeFocused ? 'expand' :
    isDefensive ? 'defend' : 'selective'
  
  // Determine Profitability Focus
  const profitabilityFocus: ProfitabilityFocus = 
    isProfitFocused ? 'margin-first' :
    isVolumeFocused ? 'volume-first' : 'balanced'
  
  // Determine Capacity Strategy
  const capacityStrategy: CapacityStrategy = 
    isAggressive ? 'aggressive' :
    isDefensive ? 'conservative' : 'disciplined'
  
  // Determine Risk Appetite
  const riskAppetite: RiskAppetite = 
    hasHighRisk || isAggressive ? 'high' :
    hasLowRisk || isDefensive ? 'low' : 'medium'
  
  // Determine Customer Strategy
  const customerStrategy: CustomerStrategy = 
    isDefensive || hasUtilization ? 'lock-in' :
    isAggressive ? 'opportunistic' : 'flexible'
  
  // Generate interpretation summary
  const summaryParts: string[] = []
  if (isAggressive) summaryParts.push('aggressive expansion')
  else if (isDefensive) summaryParts.push('defensive positioning')
  else summaryParts.push('balanced approach')
  
  if (isProfitFocused) summaryParts.push('margin focus')
  else if (isVolumeFocused) summaryParts.push('volume priority')
  
  if (hasDelayMention) summaryParts.push('delayed reaction')
  else if (hasImmediateMention) summaryParts.push('immediate response')
  
  if (hasExportFocus) summaryParts.push('export emphasis')
  if (hasPackagingFocus) summaryParts.push('packaging focus')
  
  const summary = summaryParts.join(' | ')
  
  return {
    summary,
    profile: {
      marketShareFocus,
      profitabilityFocus,
      capacityStrategy,
      riskAppetite,
      customerStrategy,
    }
  }
}

// Map Strategy Profile to Behavior Settings
function mapStrategyToBehavior(profile: AIStrategyProfile): Partial<CompetitorBehaviorSettings> {
  return {
    capacityReactionStyle: 
      profile.capacityStrategy === 'aggressive' ? 'aggressive' :
      profile.capacityStrategy === 'conservative' ? 'defensive' : 'follow-the-leader',
    followRatio: 
      profile.capacityStrategy === 'aggressive' ? 120 :
      profile.capacityStrategy === 'disciplined' ? 70 :
      profile.riskAppetite === 'low' ? 30 : 50,
    reactionTiming: 
      profile.riskAppetite === 'high' ? 'immediate' :
      profile.riskAppetite === 'low' ? '2-year-lag' : '1-year-lag',
    utilizationTarget: 
      profile.profitabilityFocus === 'margin-first' ? 'high' :
      profile.profitabilityFocus === 'volume-first' ? 'flexible' : 'balanced',
  }
}


// Default competitor strategies with AI profiles
const COMPETITOR_STRATEGIES: Record<string, { 
  name: string
  strategy: string
  baseCapacity: number
  aiProfile: AIStrategyProfile
  defaultSettings: CompetitorBehaviorSettings 
}> = {
  'sun-paper': {
    name: 'Sun Paper',
    strategy: 'Defend market share, Maintain high utilization, Conservative expansion',
    baseCapacity: 850,
    aiProfile: {
      marketShareFocus: 'defend',
      profitabilityFocus: 'balanced',
      capacityStrategy: 'disciplined',
      riskAppetite: 'medium',
      customerStrategy: 'lock-in',
    },
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
    aiProfile: {
      marketShareFocus: 'selective',
      profitabilityFocus: 'margin-first',
      capacityStrategy: 'conservative',
      riskAppetite: 'low',
      customerStrategy: 'flexible',
    },
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
    aiProfile: {
      marketShareFocus: 'selective',
      profitabilityFocus: 'margin-first',
      capacityStrategy: 'conservative',
      riskAppetite: 'low',
      customerStrategy: 'lock-in',
    },
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
    aiProfile: {
      marketShareFocus: 'expand',
      profitabilityFocus: 'volume-first',
      capacityStrategy: 'aggressive',
      riskAppetite: 'high',
      customerStrategy: 'opportunistic',
    },
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

// Calculate derived downstream allocation
function calculateDownstreamAllocation(settings: CompetitorBehaviorSettings, baseCapacity: number, appAdditions: YearlyCapacity) {
  const totalAppAddition = Object.values(appAdditions).reduce((a, b) => a + b, 0)
  const totalCompetitorAddition = Math.round(totalAppAddition * (settings.followRatio / 100) * 
    (settings.capacityReactionStyle === 'aggressive' ? 1.2 : settings.capacityReactionStyle === 'defensive' ? 0.7 : 1.0))
  
  // Calculate segment allocation percentages
  const paperPercent = settings.utilizationTarget === 'high' ? 40 : settings.capacityReactionStyle === 'aggressive' ? 35 : 45
  const packagingPercent = settings.capacityReactionStyle === 'aggressive' ? 40 : 35
  const tissuePercent = 100 - paperPercent - packagingPercent
  
  // Tier split
  const premiumPercent = settings.utilizationTarget === 'high' ? 60 : 40
  const midTierPercent = 100 - premiumPercent
  
  // Domestic vs Export
  const domesticPercent = settings.capacityReactionStyle === 'defensive' ? 75 : 55
  const exportPercent = 100 - domesticPercent
  
  return {
    pulp: {
      totalAddition: totalCompetitorAddition,
      timing: settings.reactionTiming === 'immediate' ? 'Same year as APP'
        : settings.reactionTiming === '1-year-lag' ? '1 year after APP'
        : '2 years after APP',
    },
    downstream: {
      paper: { 
        percent: paperPercent, 
        capacity: Math.round(totalCompetitorAddition * paperPercent / 100),
        change: settings.utilizationTarget === 'high' ? 'maintain' : 
          settings.capacityReactionStyle === 'aggressive' ? 'expand' : 'reduce',
      },
      packaging: { 
        percent: packagingPercent, 
        capacity: Math.round(totalCompetitorAddition * packagingPercent / 100),
        change: settings.capacityReactionStyle === 'aggressive' ? 'expand' : 'maintain',
      },
      tissue: { 
        percent: tissuePercent, 
        capacity: Math.round(totalCompetitorAddition * tissuePercent / 100),
        change: settings.capacityReactionStyle === 'defensive' ? 'reduce' : 'maintain',
      },
    },
    tierSplit: { premium: premiumPercent, midTier: midTierPercent },
    marketSplit: { domestic: domesticPercent, export: exportPercent },
  }
}

// Labels
const REACTION_STYLE_OPTIONS: { value: CapacityReactionStyle; label: string; range: string; description: string }[] = [
  { value: 'aggressive', label: 'Aggressive Expansion', range: '>100%', description: 'Actively expand to capture market share ahead of demand' },
  { value: 'follow-the-leader', label: 'Aligned Response', range: '50-100%', description: 'Match APP expansion proportionally with calibrated timing' },
  { value: 'defensive', label: 'Cautious / Wait-and-see', range: '<50%', description: 'Conservative response, focus on existing markets and utilization' },
]

const TIMING_OPTIONS: { value: ReactionTiming; label: string; description: string }[] = [
  { value: 'immediate', label: 'Immediate', description: 'React in the same year as APP' },
  { value: '1-year-lag', label: '1-Year Lag', description: 'Respond one year after APP expansion' },
  { value: '2-year-lag', label: '2-Year Lag', description: 'Respond two years after APP expansion' },
]

const UTILIZATION_OPTIONS: { value: UtilizationTarget; label: string; description: string }[] = [
  { value: 'high', label: 'High (85%+)', description: 'Prioritize utilization over growth' },
  { value: 'balanced', label: 'Balanced (75-85%)', description: 'Balance growth and utilization' },
  { value: 'flexible', label: 'Flexible (<75%)', description: 'Accept lower utilization for growth' },
]

// Get follow ratio label based on range
function getFollowRatioLabel(ratio: number): string {
  if (ratio >= 150) return 'Aggressive Match'
  if (ratio >= 100) return 'Full Match'
  if (ratio >= 50) return 'Partial Match'
  if (ratio >= 25) return 'Conservative'
  return 'Minimal Response'
}

export function CompetitorConfigModule({ config, onChange, appCapacityAdditions }: CompetitorConfigModuleProps) {
  const [selectedCompetitor, setSelectedCompetitor] = useState(config[0]?.playerId || 'sun-paper')
  const [editingCapacity, setEditingCapacity] = useState<number | null>(null)
  const [capacityOverrides, setCapacityOverrides] = useState<Record<string, YearlyCapacity>>({})
  const [strategicIntentMap, setStrategicIntentMap] = useState<Record<string, string>>({})
  const [generatedInterpretation, setGeneratedInterpretation] = useState<Record<string, AIInterpretation>>({})
  const [downstreamStrategy, setDownstreamStrategy] = useState<Record<string, DownstreamStrategyInput>>({})
  
  // Get current competitor's strategic intent and interpretation
  const strategicIntent = strategicIntentMap[selectedCompetitor] || ''
  const setStrategicIntent = (value: string) => {
    setStrategicIntentMap(prev => ({ ...prev, [selectedCompetitor]: value }))
  }
  const currentInterpretation = generatedInterpretation[selectedCompetitor]
  
  // Get current competitor's downstream strategy
  const currentDownstream = downstreamStrategy[selectedCompetitor] || {
    paper: { ...DEFAULT_SEGMENT_STRATEGY },
    packaging: { ...DEFAULT_SEGMENT_STRATEGY },
  }
  
  // Handle downstream strategy changes
  const handleDownstreamChange = (
    segment: 'paper' | 'packaging',
    field: keyof SegmentStrategy,
    value: TierStrategy | number
  ) => {
    setDownstreamStrategy(prev => ({
      ...prev,
      [selectedCompetitor]: {
        ...currentDownstream,
        [segment]: {
          ...currentDownstream[segment],
          [field]: value,
        }
      }
    }))
  }
  
  const selectedConfig = config.find(c => c.playerId === selectedCompetitor)
  const selectedStrategy = COMPETITOR_STRATEGIES[selectedCompetitor]
  
  const derivedCapacity = useMemo(() => {
    if (!selectedConfig || !selectedStrategy) return null
    if (capacityOverrides[selectedCompetitor]) {
      return capacityOverrides[selectedCompetitor]
    }
    return calculateDerivedCapacity(
      appCapacityAdditions, 
      selectedConfig.behaviorSettings, 
      selectedStrategy.baseCapacity
    )
  }, [selectedConfig, selectedStrategy, appCapacityAdditions, capacityOverrides, selectedCompetitor])
  
  const derivedAllocation = useMemo(() => {
    if (!selectedConfig || !selectedStrategy) return null
    return calculateDownstreamAllocation(
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
  
  // Generate Strategy from intent text - updates profile, behavior settings, and clears capacity overrides
  const handleGenerateStrategy = () => {
    if (!strategicIntent.trim() || !selectedConfig) return
    
    const interpretation = generateStrategyFromText(strategicIntent)
    
    // Store the interpretation
    setGeneratedInterpretation(prev => ({
      ...prev,
      [selectedCompetitor]: interpretation,
    }))
    
    // Apply behavior settings
    const newBehaviorSettings = mapStrategyToBehavior(interpretation.profile)
    const updatedConfig = config.map(c => {
      if (c.playerId === selectedCompetitor) {
        return {
          ...c,
          behaviorSettings: { ...c.behaviorSettings, ...newBehaviorSettings },
          isEdited: true,
        }
      }
      return c
    })
    onChange(updatedConfig)
    
    // Clear capacity overrides to recalculate derived actions
    setCapacityOverrides(prev => {
      const updated = { ...prev }
      delete updated[selectedCompetitor]
      return updated
    })
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-280px)] min-h-[600px]">
      {/* LEFT SIDEBAR - Competitor Selection */}
      <div className="w-80 flex-shrink-0">
        <div className="sticky top-4 space-y-3 z-10">
          <div className="rounded-lg border border-border/50 bg-card/50 overflow-hidden">
            <div className="px-4 py-3 bg-secondary/30 border-b border-border/50">
              <h3 className="text-base font-semibold">Competitor Selection</h3>
              <p className="text-sm text-muted-foreground mt-0.5">Configure each player</p>
            </div>
            
            <div className="p-2 space-y-1">
              {config.map((competitor, index) => {
                const isSelected = selectedCompetitor === competitor.playerId
                
                return (
                  <button
                    key={competitor.playerId}
                    onClick={() => setSelectedCompetitor(competitor.playerId)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all',
                      isSelected 
                        ? 'bg-primary text-primary-foreground shadow-sm' 
                        : 'hover:bg-secondary/50'
                    )}
                  >
                    <div className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold flex-shrink-0',
                      isSelected 
                        ? 'bg-primary-foreground/20 text-primary-foreground' 
                        : competitor.isEdited 
                          ? 'bg-amber-100 text-amber-600' 
                          : 'bg-secondary text-muted-foreground'
                    )}>
                      {competitor.isEdited ? '✓' : index + 1}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className={cn(
                        'text-base font-medium truncate',
                        isSelected ? 'text-primary-foreground' : ''
                      )}>
                        {competitor.playerName}
                      </div>
                      <div className={cn(
                        'text-sm truncate',
                        isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      )}>
                        {competitor.isEdited ? 'Modified' : 'Default settings'}
                      </div>
                    </div>
                    
                    <ChevronRight className={cn(
                      'h-4 w-4 flex-shrink-0 transition-transform',
                      isSelected ? 'text-primary-foreground translate-x-0.5' : 'text-muted-foreground'
                    )} />
                  </button>
                )
              })}
            </div>
            
            <div className="p-2 border-t border-border/50">
              <button className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all border border-dashed border-border/50 text-muted-foreground hover:border-border hover:text-foreground hover:bg-secondary/30">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground flex-shrink-0">
                  <Plus className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-base font-medium">Add Competitor</div>
                  <div className="text-sm text-muted-foreground">Create custom player</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* RIGHT PANEL - Main Content with 3 Vertical Sections */}
      {selectedConfig && selectedStrategy && derivedCapacity && derivedAllocation && (
        <div className="flex-1 overflow-y-auto space-y-5 pr-2">
          
          {/* ========== SECTION 1: Strategic Intent (full width) ========== */}
          <Card className="border-2 border-cyan-200 bg-gradient-to-r from-cyan-50/50 to-sky-50/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-100">
                    <Wand2 className="h-5 w-5 text-cyan-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold">Strategic Intent</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Describe {selectedConfig.playerName}&apos;s strategy &mdash; the Behavior Settings below will update automatically and stay fully editable.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Base Capacity</div>
                    <div className="text-xl font-bold text-cyan-700 leading-tight">{selectedStrategy.baseCapacity} kt</div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-3 gap-4">
                {/* Textarea - 2 columns */}
                <div className="col-span-2">
                  <textarea
                    value={strategicIntent}
                    onChange={(e) => setStrategicIntent(e.target.value)}
                    placeholder="e.g., Aggressive expansion, follow APP with 1-year delay, prioritize margin over volume..."
                    className="w-full h-24 px-3 py-2 text-sm rounded-lg border border-cyan-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent resize-none placeholder:text-muted-foreground/60"
                  />
                </div>
                {/* Generate button + summary - 1 column */}
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={handleGenerateStrategy}
                    disabled={!strategicIntent.trim()}
                    className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Strategy
                  </Button>
                  {currentInterpretation ? (
                    <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-2">
                      <Lightbulb className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <div className="font-medium text-emerald-700">Interpretation</div>
                        <div className="text-emerald-700/90 mt-0.5">{currentInterpretation.summary}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 rounded-lg border border-dashed border-cyan-200 bg-white/40 px-3 py-2">
                      <Info className="h-4 w-4 text-cyan-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-muted-foreground">
                        Generate to pre-fill the Behavior Settings, then fine-tune them manually.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ========== SECTION 2: Behavior Settings (Middle) ========== */}
          <Card className="border-2 border-red-200 bg-red-50/30">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100">
                    <Target className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold">Behavior Settings</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">Editable competitor response parameters &mdash; adjust freely or use Strategic Intent to pre-fill</p>
                  </div>
                </div>
                <span className="text-sm text-red-600 bg-red-100 px-2.5 py-1 rounded-full font-medium">Editable</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {/* Horizontal layout for Module A and Module B */}
              <div className="grid grid-cols-2 gap-5">
              
              {/* Module A: Pulp Capacity Response */}
              <div className="rounded-xl border border-red-200/80 bg-white/60 p-5">
                <div className="flex items-center gap-2 mb-5">
                  <Factory className="h-5 w-5 text-blue-600" />
                  <h4 className="text-sm font-semibold text-foreground">Module A: Pulp Capacity Response</h4>
                </div>
                
                <div className="space-y-5">
                  {/* 1. Capacity Reaction Style - Vertical */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium flex items-center gap-2 text-foreground">
                      <Gauge className="h-4 w-4 text-muted-foreground" />
                      Capacity Reaction Style
                    </label>
                    <div className="space-y-2">
                      {REACTION_STYLE_OPTIONS.map((option) => (
                        <TooltipProvider key={option.value}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => handleSettingChange(selectedConfig.playerId, 'capacityReactionStyle', option.value)}
                                className={cn(
                                  'w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg border transition-all text-left',
                                  selectedConfig.behaviorSettings.capacityReactionStyle === option.value
                                    ? 'bg-red-100 border-red-300 text-red-700 shadow-sm'
                                    : 'bg-white border-border/50 text-muted-foreground hover:border-red-200 hover:bg-red-50/50'
                                )}
                              >
                                <span>{option.label}</span>
                                <span className={cn(
                                  'text-sm px-2 py-0.5 rounded',
                                  selectedConfig.behaviorSettings.capacityReactionStyle === option.value
                                    ? 'bg-red-200/50 text-red-700'
                                    : 'bg-muted text-muted-foreground'
                                )}>
                                  {option.range}
                                </span>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-xs">
                              <p className="text-sm">{option.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                  </div>

                  {/* 2. Follow Ratio Slider */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium flex items-center justify-between text-foreground">
                      <span className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        Follow Ratio to APP
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{getFollowRatioLabel(selectedConfig.behaviorSettings.followRatio)}</span>
                        <span className="text-red-600 font-bold text-lg">{selectedConfig.behaviorSettings.followRatio}%</span>
                      </div>
                    </label>
                    <Slider
                      value={[selectedConfig.behaviorSettings.followRatio]}
                      onValueChange={([value]) => handleSettingChange(selectedConfig.playerId, 'followRatio', value)}
                      min={0}
                      max={200}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                      <span>150%</span>
                      <span>200%</span>
                    </div>
                  </div>

                  {/* 3. Reaction Timing - Vertical */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium flex items-center gap-2 text-foreground">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      Reaction Timing
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {TIMING_OPTIONS.map((option) => (
                        <TooltipProvider key={option.value}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => handleSettingChange(selectedConfig.playerId, 'reactionTiming', option.value)}
                                className={cn(
                                  'px-3 py-2.5 text-sm font-medium rounded-lg border transition-all',
                                  selectedConfig.behaviorSettings.reactionTiming === option.value
                                    ? 'bg-red-100 border-red-300 text-red-700 shadow-sm'
                                    : 'bg-white border-border/50 text-muted-foreground hover:border-red-200 hover:bg-red-50/50'
                                )}
                              >
                                {option.label}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                              <p className="text-sm">{option.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                  </div>

                  {/* 4. Utilization Target - Vertical */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium flex items-center gap-2 text-foreground">
                      <Gauge className="h-4 w-4 text-muted-foreground" />
                      Utilization Target
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {UTILIZATION_OPTIONS.map((option) => (
                        <TooltipProvider key={option.value}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => handleSettingChange(selectedConfig.playerId, 'utilizationTarget', option.value)}
                                className={cn(
                                  'px-3 py-2.5 text-sm font-medium rounded-lg border transition-all',
                                  selectedConfig.behaviorSettings.utilizationTarget === option.value
                                    ? 'bg-red-100 border-red-300 text-red-700 shadow-sm'
                                    : 'bg-white border-border/50 text-muted-foreground hover:border-red-200 hover:bg-red-50/50'
                                )}
                              >
                                {option.label}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                              <p className="text-sm">{option.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Module B: Downstream Strategy */}
              <div className="rounded-xl border border-red-200/80 bg-white/60 p-5">
                <div className="flex items-center gap-2 mb-5">
                  <Package className="h-5 w-5 text-purple-600" />
                  <h4 className="text-sm font-semibold text-foreground">Module B: Downstream Strategy</h4>
                </div>
                
                <div className="space-y-5">
                  {/* ===== Paper Section ===== */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-border/30">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">Paper</span>
                    </div>
                    
                    {/* Product Tier Strategy */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium flex items-center gap-2 text-foreground">
                        Product Tier Strategy
                      </label>
                      <div className="space-y-2">
                        {/* Premium */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground w-20">Premium</span>
                          <div className="grid grid-cols-3 gap-2 flex-1 max-w-xs">
                            {TIER_STRATEGY_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => handleDownstreamChange('paper', 'premiumTier', opt.value)}
                                className={cn(
                                  'px-3 py-2 text-sm font-medium rounded-lg border transition-all',
                                  currentDownstream.paper.premiumTier === opt.value
                                    ? 'bg-red-100 border-red-300 text-red-700 shadow-sm'
                                    : 'bg-white border-border/50 text-muted-foreground hover:border-red-200 hover:bg-red-50/50'
                                )}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        {/* Mid-tier */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground w-20">Mid-tier</span>
                          <div className="grid grid-cols-3 gap-2 flex-1 max-w-xs">
                            {TIER_STRATEGY_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => handleDownstreamChange('paper', 'midTier', opt.value)}
                                className={cn(
                                  'px-3 py-2 text-sm font-medium rounded-lg border transition-all',
                                  currentDownstream.paper.midTier === opt.value
                                    ? 'bg-red-100 border-red-300 text-red-700 shadow-sm'
                                    : 'bg-white border-border/50 text-muted-foreground hover:border-red-200 hover:bg-red-50/50'
                                )}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Market Split Slider */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium flex items-center justify-between text-foreground">
                        <span className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          Market Split
                        </span>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">Domestic <span className="font-bold text-red-600">{100 - currentDownstream.paper.exportPercent}%</span></span>
                          <span className="text-muted-foreground">Export <span className="font-bold text-red-600">{currentDownstream.paper.exportPercent}%</span></span>
                        </div>
                      </label>
                      <Slider
                        value={[currentDownstream.paper.exportPercent]}
                        onValueChange={([value]) => handleDownstreamChange('paper', 'exportPercent', value)}
                        min={0}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>100% Domestic</span>
                        <span>50 / 50</span>
                        <span>100% Export</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Divider */}
                  <div className="border-t border-border/50" />
                  
                  {/* ===== Packaging Section ===== */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-border/30">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">Packaging / Carton Board</span>
                    </div>
                    
                    {/* Product Tier Strategy */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium flex items-center gap-2 text-foreground">
                        Product Tier Strategy
                      </label>
                      <div className="space-y-2">
                        {/* Premium */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground w-20">Premium</span>
                          <div className="grid grid-cols-3 gap-2 flex-1 max-w-xs">
                            {TIER_STRATEGY_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => handleDownstreamChange('packaging', 'premiumTier', opt.value)}
                                className={cn(
                                  'px-3 py-2 text-sm font-medium rounded-lg border transition-all',
                                  currentDownstream.packaging.premiumTier === opt.value
                                    ? 'bg-red-100 border-red-300 text-red-700 shadow-sm'
                                    : 'bg-white border-border/50 text-muted-foreground hover:border-red-200 hover:bg-red-50/50'
                                )}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        {/* Mid-tier */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground w-20">Mid-tier</span>
                          <div className="grid grid-cols-3 gap-2 flex-1 max-w-xs">
                            {TIER_STRATEGY_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => handleDownstreamChange('packaging', 'midTier', opt.value)}
                                className={cn(
                                  'px-3 py-2 text-sm font-medium rounded-lg border transition-all',
                                  currentDownstream.packaging.midTier === opt.value
                                    ? 'bg-red-100 border-red-300 text-red-700 shadow-sm'
                                    : 'bg-white border-border/50 text-muted-foreground hover:border-red-200 hover:bg-red-50/50'
                                )}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Market Split Slider */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium flex items-center justify-between text-foreground">
                        <span className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          Market Split
                        </span>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">Domestic <span className="font-bold text-red-600">{100 - currentDownstream.packaging.exportPercent}%</span></span>
                          <span className="text-muted-foreground">Export <span className="font-bold text-red-600">{currentDownstream.packaging.exportPercent}%</span></span>
                        </div>
                      </label>
                      <Slider
                        value={[currentDownstream.packaging.exportPercent]}
                        onValueChange={([value]) => handleDownstreamChange('packaging', 'exportPercent', value)}
                        min={0}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>100% Domestic</span>
                        <span>50 / 50</span>
                        <span>100% Export</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              </div>
            </CardContent>
          </Card>

          {/* ========== SECTION 3: Derived Actions (Bottom) ========== */}
          <Card className="border-2 border-amber-200 bg-amber-50/30">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100">
                    <Lightbulb className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold">Derived Actions</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">Auto-calculated outcomes based on behavior settings</p>
                  </div>
                </div>
                <span className="text-sm text-amber-600 bg-amber-100 px-2.5 py-1 rounded-full font-medium">Auto-calculated</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-5">
              
              {/* A. Pulp Capacity Outcome */}
              <div className="rounded-xl border border-amber-200/80 bg-white/60 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Factory className="h-5 w-5 text-blue-600" />
                  <h4 className="text-sm font-semibold text-foreground">A. Pulp Capacity Outcome</h4>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="text-xs text-blue-600 font-medium mb-1">Total Capacity Addition</div>
                    <div className="text-2xl font-bold text-blue-700">+{derivedAllocation.pulp.totalAddition} kt</div>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="text-xs text-slate-600 font-medium mb-1">Timing</div>
                    <div className="text-lg font-semibold text-foreground">{derivedAllocation.pulp.timing}</div>
                  </div>
                </div>
                
                {/* Projected Capacity - Editable */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium text-foreground">Projected Capacity (kt)</div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-700 text-xs font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Editable
                      </span>
                    </div>
                    <div className="text-xs text-blue-600">Click values to override</div>
                  </div>
                  <div className="grid grid-cols-6 gap-2">
                    {years.map(year => {
                      const isEditing = editingCapacity === year
                      const value = derivedCapacity[year]
                      const isOverridden = capacityOverrides[selectedCompetitor]?.[year] !== undefined
                      
                      return (
                        <div key={year} className="text-center">
                          <div className="text-xs text-muted-foreground mb-1.5 font-medium">{year}</div>
                          {isEditing ? (
                            <Input
                              type="number"
                              defaultValue={value}
                              className="h-10 text-sm text-center px-1 font-mono"
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
                          ) : (
                            <button
                              onClick={() => setEditingCapacity(year)}
                              className={cn(
                                'w-full py-2.5 text-sm font-mono font-bold rounded-lg transition-all border',
                                isOverridden 
                                  ? 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200'
                                  : 'bg-white text-foreground border-border/50 hover:border-amber-300 hover:bg-amber-50'
                              )}
                            >
                              {value}
                              {isOverridden && <span className="ml-0.5 text-[10px]">*</span>}
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* B. Downstream Allocation Outcome */}
              <div className="rounded-xl border border-amber-200/80 bg-white/60 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="h-5 w-5 text-purple-600" />
                  <h4 className="text-sm font-semibold text-foreground">B. Downstream Allocation Outcome</h4>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Paper */}
                  <div className="p-4 rounded-lg bg-blue-50/50 border border-blue-200/50">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-foreground">Paper</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Capacity</span>
                        <span className="text-sm font-bold text-foreground">+{derivedAllocation.downstream.paper.capacity} kt</span>
                      </div>
                      <div className={cn(
                        'flex items-center gap-1 text-sm font-medium',
                        derivedAllocation.downstream.paper.change === 'expand' ? 'text-emerald-600' :
                        derivedAllocation.downstream.paper.change === 'reduce' ? 'text-amber-600' : 'text-foreground'
                      )}>
                        {derivedAllocation.downstream.paper.change === 'expand' ? <TrendingUp className="h-4 w-4" /> :
                         derivedAllocation.downstream.paper.change === 'reduce' ? <TrendingDown className="h-4 w-4" /> :
                         <Minus className="h-4 w-4" />}
                        {derivedAllocation.downstream.paper.change.charAt(0).toUpperCase() + derivedAllocation.downstream.paper.change.slice(1)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Packaging */}
                  <div className="p-4 rounded-lg bg-orange-50/50 border border-orange-200/50">
                    <div className="flex items-center gap-2 mb-3">
                      <Package className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium text-foreground">Packaging</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Capacity</span>
                        <span className="text-sm font-bold text-foreground">+{derivedAllocation.downstream.packaging.capacity} kt</span>
                      </div>
                      <div className={cn(
                        'flex items-center gap-1 text-sm font-medium',
                        derivedAllocation.downstream.packaging.change === 'expand' ? 'text-emerald-600' :
                        derivedAllocation.downstream.packaging.change === 'reduce' ? 'text-amber-600' : 'text-foreground'
                      )}>
                        {derivedAllocation.downstream.packaging.change === 'expand' ? <TrendingUp className="h-4 w-4" /> :
                         derivedAllocation.downstream.packaging.change === 'reduce' ? <TrendingDown className="h-4 w-4" /> :
                         <Minus className="h-4 w-4" />}
                        {derivedAllocation.downstream.packaging.change.charAt(0).toUpperCase() + derivedAllocation.downstream.packaging.change.slice(1)}
                      </div>
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
              Behavior settings dynamically update Derived Actions in real-time. Projected capacity values are auto-calculated but can be manually overridden by clicking on them.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
