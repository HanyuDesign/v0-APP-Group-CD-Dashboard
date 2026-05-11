'use client'

import { useState, useMemo, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Brain, Users, ChevronRight, Info, TreePine, Factory, Package, 
  FileText, Bath, TrendingUp, TrendingDown, Upload, X, FileSpreadsheet,
  Quote, Lightbulb
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import type { 
  CompetitorConfig, 
  ReactionSettings,
  SimulationInput,
  YearlyCapacity 
} from '@/lib/types/war-game'

interface ReactionInputModuleProps {
  settings: ReactionSettings
  onChange: (settings: ReactionSettings) => void
  competitorConfig: CompetitorConfig[]
  marketInput: SimulationInput
}

const years = [2026, 2027, 2028, 2029, 2030, 2031] as const

// Generate reaction summary based on competitor config
function generateReactionSummary(competitor: CompetitorConfig): { summary: string; rationale: string[]; persona: string } {
  const { behaviorSettings } = competitor
  const style = behaviorSettings.capacityReactionStyle
  const timing = behaviorSettings.reactionTiming
  const ratio = behaviorSettings.followRatio
  const utilization = behaviorSettings.utilizationTarget
  
  let summary = ''
  let persona = ''
  const rationale: string[] = []
  
  if (style === 'aggressive') {
    persona = 'Aggressive Challenger'
    summary = `As an aggressive challenger, we see APP's expansion as a direct threat to our market position. We will match their moves immediately and at scale—market share is non-negotiable, even if it means short-term margin pressure.`
    rationale.push('Prioritize market share over short-term margins')
    rationale.push('Match or exceed competitor capacity additions')
  } else if (style === 'follow-the-leader') {
    persona = 'Disciplined Scaler'
    const timingText = timing === 'immediate' ? 'immediately' : timing === '1-year-lag' ? 'with a 1-year delay' : 'with a 2-year delay'
    summary = `As a disciplined scaler, we won't ignore APP's expansion—but we won't chase it blindly either. We'll follow ${timingText}, scaling in step with proven demand while keeping our utilization strong.`
    rationale.push(`Match approximately ${ratio}% of APP's capacity additions`)
    rationale.push('Scale capacity based on validated market demand')
  } else {
    persona = 'Cautious Observer'
    summary = `As a cautious observer, we believe the market doesn't need more capacity—it needs discipline. We'll hold our position, focus on profitability, and let others overextend before making our move.`
    rationale.push('Delay capacity decisions until market clarity improves')
    rationale.push('Focus on margin optimization over volume growth')
  }
  
  if (utilization === 'high') {
    rationale.push('Maintain high utilization rates (>85%) to optimize unit costs')
  } else if (utilization === 'balanced') {
    rationale.push('Balance utilization with market responsiveness')
  } else {
    rationale.push('Flexible utilization to respond to demand fluctuations')
  }
  
  if (timing !== 'immediate') {
    rationale.push(`Observe market developments before committing capital (${timing.replace('-', ' ')})`)
  }
  
  return { summary, rationale, persona }
}

// Calculate competitor-specific woodchip data
function calculateCompetitorWoodchipData(
  competitor: CompetitorConfig,
  appAdditions: YearlyCapacity
) {
  const baseCapacities: Record<string, number> = {
    'sun-paper': 850,
    'chenming': 620,
    'liansheng': 480,
    'others-china': 1200
  }
  
  const baseCapacity = baseCapacities[competitor.playerId] || 600
  const { followRatio, reactionTiming, utilizationTarget } = competitor.behaviorSettings
  const lag = reactionTiming === 'immediate' ? 0 : reactionTiming === '1-year-lag' ? 1 : 2
  
  // Calculate pulp capacity first to derive woodchip demand
  const pulpCapacity = years.map((year, idx) => {
    let cumulative = baseCapacity
    for (let i = 0; i <= idx - lag; i++) {
      if (i >= 0) {
        const appAdd = appAdditions[years[i]] || 0
        cumulative += Math.round(appAdd * followRatio / 100)
      }
    }
    return cumulative
  })
  
  // Woodchip demand = pulp capacity * conversion factor (roughly 2.5 tons woodchip per ton pulp)
  const conversionFactor = 2.5
  const importRatioBase = competitor.playerId === 'sun-paper' ? 0.45 : 
                          competitor.playerId === 'chenming' ? 0.35 :
                          competitor.playerId === 'liansheng' ? 0.50 : 0.30
  
  return years.map((year, idx) => {
    const demand = Math.round(pulpCapacity[idx] * conversionFactor)
    const importShare = Math.round((importRatioBase + (idx * 0.02)) * 100) // Slightly increasing import share
    const domesticSourcing = Math.round(demand * (1 - importShare / 100))
    
    return {
      year,
      demand,
      importShare,
      domesticSourcing
    }
  })
}

// Calculate competitor-specific pulp capacity data
function calculateCompetitorPulpData(
  competitor: CompetitorConfig,
  appAdditions: YearlyCapacity
) {
  const baseCapacities: Record<string, number> = {
    'sun-paper': 850,
    'chenming': 620,
    'liansheng': 480,
    'others-china': 1200
  }
  
  const baseCapacity = baseCapacities[competitor.playerId] || 600
  const { followRatio, reactionTiming, utilizationTarget } = competitor.behaviorSettings
  const lag = reactionTiming === 'immediate' ? 0 : reactionTiming === '1-year-lag' ? 1 : 2
  
  const utilizationBase = utilizationTarget === 'high' ? 88 : utilizationTarget === 'balanced' ? 82 : 75
  
  return years.map((year, idx) => {
    let capacity = baseCapacity
    for (let i = 0; i <= idx - lag; i++) {
      if (i >= 0) {
        const appAdd = appAdditions[years[i]] || 0
        capacity += Math.round(appAdd * followRatio / 100)
      }
    }
    
    const delta = capacity - baseCapacity
    const utilization = utilizationBase + (idx * (utilizationTarget === 'flexible' ? -1 : 0.5))
    
    return {
      year,
      capacity,
      utilization: Math.min(95, Math.max(70, utilization)),
      delta
    }
  })
}

// Calculate competitor-specific downstream data
function calculateCompetitorDownstreamData(competitor: CompetitorConfig) {
  const baseValues: Record<string, { paper: number; packaging: number; tissue: number }> = {
    'sun-paper': { paper: 520, packaging: 280, tissue: 50 },
    'chenming': { paper: 380, packaging: 180, tissue: 60 },
    'liansheng': { paper: 200, packaging: 220, tissue: 60 },
    'others-china': { paper: 600, packaging: 400, tissue: 200 }
  }
  
  const base = baseValues[competitor.playerId] || { paper: 300, packaging: 200, tissue: 100 }
  const { followRatio, utilizationTarget } = competitor.behaviorSettings
  const growthFactor = followRatio / 100 * 0.5 // Growth tied to follow ratio
  
  const segments = ['Paper', 'Packaging', 'Tissue'] as const
  
  return segments.map(segment => {
    const segmentBase = segment === 'Paper' ? base.paper : 
                        segment === 'Packaging' ? base.packaging : base.tissue
    
    return {
      segment,
      data: years.map((year, idx) => {
        const growth = Math.round(segmentBase * growthFactor * idx * 0.1)
        const capacity = segmentBase + growth
        const utilizationRate = utilizationTarget === 'high' ? 0.88 : utilizationTarget === 'balanced' ? 0.82 : 0.75
        const output = Math.round(capacity * utilizationRate)
        
        return { year, capacity, output }
      })
    }
  })
}

export function ReactionInputModule({ 
  settings, 
  onChange, 
  competitorConfig,
  marketInput 
}: ReactionInputModuleProps) {
  const [selectedCompetitor, setSelectedCompetitor] = useState(competitorConfig[0]?.playerId || 'sun-paper')
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const selectedConfig = competitorConfig.find(c => c.playerId === selectedCompetitor)
  
  // Calculate competitor-specific derived data
  const woodchipData = useMemo(
    () => selectedConfig ? calculateCompetitorWoodchipData(selectedConfig, marketInput.appCapacity.appChina) : [],
    [selectedConfig, marketInput.appCapacity.appChina]
  )
  
  const pulpData = useMemo(
    () => selectedConfig ? calculateCompetitorPulpData(selectedConfig, marketInput.appCapacity.appChina) : [],
    [selectedConfig, marketInput.appCapacity.appChina]
  )
  
  const downstreamData = useMemo(
    () => selectedConfig ? calculateCompetitorDownstreamData(selectedConfig) : [],
    [selectedConfig]
  )
  
  const reactionSummary = useMemo(
    () => selectedConfig ? generateReactionSummary(selectedConfig) : null,
    [selectedConfig]
  )
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      setUploadedFiles(prev => [...prev, ...Array.from(files)])
    }
  }
  
  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }
  
  return (
    <div className="flex gap-6 h-[calc(100vh-280px)] min-h-[600px]">
      {/* LEFT SIDEBAR - Competitor Selection (synced from Step 2) */}
      <div className="w-80 flex-shrink-0">
        <div className="sticky top-4 space-y-3 z-10">
          <div className="rounded-lg border border-border/50 bg-card/50 overflow-hidden">
            {/* Sidebar header */}
            <div className="px-4 py-3 bg-purple-50 border-b border-purple-100">
              <h3 className="text-base font-semibold text-purple-900">Market Players</h3>
              <p className="text-sm text-purple-600 mt-0.5">Synced from Competitor Configure</p>
            </div>
            
            {/* Competitor list */}
            <div className="p-2 space-y-1">
              {competitorConfig.map((competitor, index) => {
                const isSelected = selectedCompetitor === competitor.playerId
                
                return (
                  <button
                    key={competitor.playerId}
                    onClick={() => setSelectedCompetitor(competitor.playerId)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all',
                      isSelected 
                        ? 'bg-purple-600 text-white shadow-sm' 
                        : 'hover:bg-secondary/50'
                    )}
                  >
                    <div className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold flex-shrink-0',
                      isSelected 
                        ? 'bg-white/20 text-white' 
                        : 'bg-secondary text-muted-foreground'
                    )}>
                      {index + 1}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className={cn(
                        'text-base font-medium truncate',
                        isSelected ? 'text-white' : ''
                      )}>
                        {competitor.playerName}
                      </div>
                      <div className={cn(
                        'text-sm truncate capitalize',
                        isSelected ? 'text-white/70' : 'text-muted-foreground'
                      )}>
                        {competitor.behaviorSettings.capacityReactionStyle.replace(/-/g, ' ')}
                      </div>
                    </div>
                    
                    <ChevronRight className={cn(
                      'h-4 w-4 flex-shrink-0 transition-transform',
                      isSelected ? 'text-white translate-x-0.5' : 'text-muted-foreground'
                    )} />
                  </button>
                )
              })}
            </div>
            
            {/* Info note */}
            <div className="p-3 border-t border-border/50 bg-muted/30">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Competitor list is configured in Step 2. This page shows AI-generated reactions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - Main Content */}
      <div className="flex-1 overflow-y-auto space-y-5 pr-2">
        {/* Section 1: Reaction Summary */}
        {selectedConfig && reactionSummary && (
          <Card className="border-purple-200 bg-gradient-to-br from-purple-50/50 to-white">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                  <Brain className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">Reaction Summary</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">AI-generated interpretation for {selectedConfig.playerName}</p>
                </div>
                <span className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded bg-purple-100 text-purple-700 text-sm font-medium">
                  <Lightbulb className="h-3 w-3" />
                  AI Generated
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {/* Persona Tag */}
              <div className="mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-sm font-semibold shadow-sm">
                  <Users className="h-3.5 w-3.5" />
                  {reactionSummary.persona}
                </span>
              </div>
              
              {/* Quote-style summary */}
              <div className="relative pl-5 border-l-4 border-purple-300 mb-4">
                <Quote className="absolute -left-3.5 -top-1 h-6 w-6 text-purple-300 bg-purple-50 rounded" />
                <p className="text-base text-foreground italic leading-relaxed">
                  "{reactionSummary.summary}"
                </p>
              </div>
              
              {/* Rationale bullets */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Supporting Rationale</div>
                <ul className="space-y-1.5">
                  {reactionSummary.rationale.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <ChevronRight className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Section 2: Value Chain Impact */}
        {selectedConfig && (
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">Value Chain Impact</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">{selectedConfig.playerName}'s projected outcomes</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-6">
              {/* 2.1 Forestry & Woodchips */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <TreePine className="h-4 w-4 text-green-600" />
                  <h4 className="text-sm font-semibold">2.1 Forestry & Woodchips</h4>
                  <span className="text-xs text-muted-foreground">({selectedConfig.playerName})</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-base">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Metric</th>
                        {years.map(year => (
                          <th key={year} className="text-center py-2 px-3 font-medium text-muted-foreground">{year}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border/30">
                        <td className="py-2.5 pr-4 font-medium">Woodchip Demand (kt)</td>
                        {woodchipData.map(d => (
                          <td key={d.year} className="text-center py-2.5 px-3 font-mono">{d.demand}</td>
                        ))}
                      </tr>
                      <tr className="border-b border-border/30">
                        <td className="py-2.5 pr-4 font-medium">Import Share (%)</td>
                        {woodchipData.map(d => (
                          <td key={d.year} className="text-center py-2.5 px-3 font-mono">{d.importShare}%</td>
                        ))}
                      </tr>
                      <tr className="bg-muted/30">
                        <td className="py-2.5 pr-4 font-medium">Domestic Sourcing (kt)</td>
                        {woodchipData.map(d => (
                          <td key={d.year} className="text-center py-2.5 px-3 font-mono">{d.domesticSourcing}</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 2.2 Pulp Capacity */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Factory className="h-4 w-4 text-blue-600" />
                  <h4 className="text-sm font-semibold">2.2 Pulp Capacity</h4>
                  <span className="text-xs text-muted-foreground">({selectedConfig.playerName})</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-base">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Metric</th>
                        {years.map(year => (
                          <th key={year} className="text-center py-2 px-3 font-medium text-muted-foreground">{year}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border/30">
                        <td className="py-2.5 pr-4 font-medium">Capacity (kt)</td>
                        {pulpData.map(d => (
                          <td key={d.year} className="text-center py-2.5 px-3 font-mono font-semibold">{d.capacity}</td>
                        ))}
                      </tr>
                      <tr className="border-b border-border/30">
                        <td className="py-2.5 pr-4 font-medium">Utilization (%)</td>
                        {pulpData.map(d => (
                          <td key={d.year} className="text-center py-2.5 px-3 font-mono">{d.utilization.toFixed(1)}%</td>
                        ))}
                      </tr>
                      <tr className="bg-muted/30">
                        <td className="py-2.5 pr-4 font-medium">Delta vs Baseline</td>
                        {pulpData.map(d => (
                          <td key={d.year} className={cn(
                            'text-center py-2.5 px-3 font-mono',
                            d.delta > 0 ? 'text-emerald-600' : d.delta < 0 ? 'text-red-600' : ''
                          )}>
                            {d.delta > 0 ? '+' : ''}{d.delta}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 2.3 Downstream Markets */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-amber-600" />
                  <h4 className="text-sm font-semibold">2.3 Downstream Markets</h4>
                  <span className="text-xs text-muted-foreground">({selectedConfig.playerName})</span>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  {downstreamData.map(segment => (
                    <div key={segment.segment} className="space-y-2 rounded-lg border border-border/50 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        {segment.segment === 'Paper' && <FileText className="h-4 w-4 text-muted-foreground" />}
                        {segment.segment === 'Packaging' && <Package className="h-4 w-4 text-muted-foreground" />}
                        {segment.segment === 'Tissue' && <Bath className="h-4 w-4 text-muted-foreground" />}
                        <span className="text-sm font-semibold">{segment.segment}</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-base">
                          <thead>
                            <tr className="border-b border-border/50">
                              <th className="text-left py-1.5 pr-2 font-medium text-muted-foreground">Year</th>
                              <th className="text-center py-1.5 px-1 font-medium text-muted-foreground">Cap.</th>
                              <th className="text-center py-1.5 px-1 font-medium text-muted-foreground">Out.</th>
                            </tr>
                          </thead>
                          <tbody>
                            {segment.data.map(d => (
                              <tr key={d.year} className="border-b border-border/30">
                                <td className="py-1.5 pr-2 font-medium text-muted-foreground">{d.year}</td>
                                <td className="text-center py-1.5 px-1 font-mono">{d.capacity}</td>
                                <td className="text-center py-1.5 px-1 font-mono">{d.output}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Section 3: External Reference Input */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                <Upload className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">External Reference Input</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Upload supporting data files</p>
              </div>
              <span className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 text-slate-600 text-sm font-medium">
                Reference Only
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
              multiple
            />
            
            {uploadedFiles.length === 0 ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border/50 rounded-lg p-6 text-center hover:border-border hover:bg-muted/30 transition-all"
              >
                <FileSpreadsheet className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <div className="text-sm font-medium text-foreground">Upload Excel or CSV files</div>
                <div className="text-xs text-muted-foreground mt-1">Files are for reference only and will not override model calculations</div>
              </button>
            ) : (
              <div className="space-y-2">
                {uploadedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <FileSpreadsheet className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{file.name}</div>
                      <div className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</div>
                    </div>
                    <button
                      onClick={() => removeFile(idx)}
                      className="p-1 hover:bg-muted rounded"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full text-sm text-muted-foreground hover:text-foreground py-2"
                >
                  + Add more files
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
