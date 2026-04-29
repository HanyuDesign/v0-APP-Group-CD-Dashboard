'use client'

import { useState, useMemo, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Brain, Users, ChevronRight, Info, TreePine, Factory, Package, 
  FileText, Bath, TrendingUp, TrendingDown, Upload, X, FileSpreadsheet,
  Quote, Lightbulb, Edit3, Check
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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
function generateReactionSummary(competitor: CompetitorConfig): { summary: string; rationale: string[] } {
  const { behaviorSettings } = competitor
  const style = behaviorSettings.capacityReactionStyle
  const timing = behaviorSettings.reactionTiming
  const ratio = behaviorSettings.followRatio
  const utilization = behaviorSettings.utilizationTarget
  
  let summary = ''
  const rationale: string[] = []
  
  // Generate persona-style summary
  if (style === 'aggressive') {
    summary = `We will aggressively match APP's expansion to protect our market position.`
    rationale.push('Prioritize market share over short-term margins')
  } else if (style === 'follow-the-leader') {
    const timingText = timing === 'immediate' ? 'immediately' : timing === '1-year-lag' ? 'with a 1-year delay' : 'with a 2-year delay'
    summary = `We will follow APP's expansion to defend market share, ${timingText}.`
    rationale.push(`Match approximately ${ratio}% of APP's capacity additions`)
  } else {
    summary = `We will take a cautious approach, focusing on profitability over expansion.`
    rationale.push('Delay capacity decisions until market clarity improves')
  }
  
  // Add utilization rationale
  if (utilization === 'high') {
    rationale.push('Maintain high utilization rates (>85%) to optimize unit costs')
  } else if (utilization === 'balanced') {
    rationale.push('Balance utilization with market responsiveness')
  } else {
    rationale.push('Flexible utilization to respond to demand fluctuations')
  }
  
  // Add timing rationale
  if (timing !== 'immediate') {
    rationale.push(`Observe market developments before committing capital (${timing.replace('-', ' ')})`)
  }
  
  return { summary, rationale }
}

// Calculate woodchip supply based on market input
function calculateWoodchipSupply(marketInput: SimulationInput) {
  const { forestry } = marketInput
  const baseChina = 750
  const baseVietnam = 400
  
  return years.map(year => {
    const chinaActive = year >= forestry.chinaLoggingPolicyStartYear
    const vietnamActive = year >= forestry.vietnamExportPolicyStartYear
    
    let chinaSupply = baseChina
    if (chinaActive) {
      if (forestry.chinaLoggingPolicy === 'tight') chinaSupply -= 150
      else if (forestry.chinaLoggingPolicy === 'relaxed') chinaSupply += 150
    }
    
    let vietnamSupply = baseVietnam
    if (vietnamActive) {
      if (forestry.vietnamExportPolicy === 'restricted') vietnamSupply -= 120
      else if (forestry.vietnamExportPolicy === 'expanded') vietnamSupply += 120
    }
    
    return { year, chinaSupply, vietnamSupply, total: chinaSupply + vietnamSupply }
  })
}

// Calculate pulp capacity based on APP additions and competitor config
function calculatePulpCapacity(
  appAdditions: YearlyCapacity,
  competitorConfig: CompetitorConfig[]
) {
  const appBase = 2200
  const appCapacity = years.map(year => {
    let cumulative = appBase
    for (const y of years) {
      if (y <= year) cumulative += appAdditions[y] || 0
    }
    return { year, capacity: cumulative }
  })
  
  const competitorCapacities = competitorConfig.map(c => {
    const baseCapacity = c.playerId === 'sun-paper' ? 850 : 
                        c.playerId === 'chenming' ? 620 :
                        c.playerId === 'liansheng' ? 480 : 1200
    
    const { followRatio, reactionTiming } = c.behaviorSettings
    const lag = reactionTiming === 'immediate' ? 0 : reactionTiming === '1-year-lag' ? 1 : 2
    
    return {
      name: c.playerName,
      capacity: years.map((year, idx) => {
        let cumulative = baseCapacity
        for (let i = 0; i <= idx - lag; i++) {
          if (i >= 0) {
            const appAdd = appAdditions[years[i]] || 0
            cumulative += Math.round(appAdd * followRatio / 100)
          }
        }
        return { year, capacity: cumulative }
      })
    }
  })
  
  return { app: appCapacity, competitors: competitorCapacities }
}

// Calculate downstream capacity
function calculateDownstreamCapacity(competitorConfig: CompetitorConfig[]) {
  const segments = ['Paper', 'Packaging', 'Tissue'] as const
  
  return segments.map(segment => {
    const baseValues = segment === 'Paper' ? { app: 1800, competitors: 3200 } :
                       segment === 'Packaging' ? { app: 1200, competitors: 2800 } :
                       { app: 600, competitors: 1400 }
    
    return {
      segment,
      data: years.map(year => ({
        year,
        app: baseValues.app + (year - 2026) * 50,
        competitors: baseValues.competitors + (year - 2026) * 80
      }))
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
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [overrides, setOverrides] = useState<Record<string, Record<number, number>>>({})
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const selectedConfig = competitorConfig.find(c => c.playerId === selectedCompetitor)
  
  // Calculate derived data
  const woodchipSupply = useMemo(() => calculateWoodchipSupply(marketInput), [marketInput])
  const pulpCapacity = useMemo(
    () => calculatePulpCapacity(marketInput.appCapacity.appChina, competitorConfig),
    [marketInput.appCapacity.appChina, competitorConfig]
  )
  const downstreamCapacity = useMemo(() => calculateDownstreamCapacity(competitorConfig), [competitorConfig])
  
  // Generate reaction summary for selected competitor
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
  
  const handleOverride = (key: string, year: number, value: number) => {
    setOverrides(prev => ({
      ...prev,
      [key]: { ...prev[key], [year]: value }
    }))
    setEditingCell(null)
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-280px)] min-h-[600px]">
      {/* LEFT SIDEBAR - Competitor Selection (synced from Step 2) */}
      <div className="w-64 flex-shrink-0">
        <div className="sticky top-4 space-y-3 z-10">
          <div className="rounded-lg border border-border/50 bg-card/50 overflow-hidden">
            {/* Sidebar header */}
            <div className="px-4 py-3 bg-purple-50 border-b border-purple-100">
              <h3 className="text-sm font-semibold text-purple-900">Market Players</h3>
              <p className="text-xs text-purple-600 mt-0.5">Synced from Competitor Configure</p>
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
                    {/* Index number */}
                    <div className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold flex-shrink-0',
                      isSelected 
                        ? 'bg-white/20 text-white' 
                        : 'bg-secondary text-muted-foreground'
                    )}>
                      {index + 1}
                    </div>
                    
                    {/* Competitor info */}
                    <div className="flex-1 min-w-0">
                      <div className={cn(
                        'text-sm font-medium truncate',
                        isSelected ? 'text-white' : ''
                      )}>
                        {competitor.playerName}
                      </div>
                      <div className={cn(
                        'text-xs truncate',
                        isSelected ? 'text-white/70' : 'text-muted-foreground'
                      )}>
                        {competitor.behaviorSettings.capacityReactionStyle}
                      </div>
                    </div>
                    
                    {/* Arrow indicator */}
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
                <Info className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
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
                  <CardTitle className="text-base font-semibold">Reaction Summary</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">AI-generated interpretation for {selectedConfig.playerName}</p>
                </div>
                <span className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded bg-purple-100 text-purple-700 text-xs font-medium">
                  <Lightbulb className="h-3 w-3" />
                  AI Generated
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {/* Quote-style summary */}
              <div className="relative pl-4 border-l-4 border-purple-300 mb-4">
                <Quote className="absolute -left-3 -top-1 h-5 w-5 text-purple-300 bg-purple-50 rounded" />
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
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Value Chain Impact</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Simulated market outcomes based on all inputs</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-6">
            {/* 2.1 Forestry & Woodchips */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TreePine className="h-4 w-4 text-green-600" />
                <h4 className="text-sm font-semibold">2.1 Forestry & Woodchips</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Supply Source</th>
                      {years.map(year => (
                        <th key={year} className="text-center py-2 px-3 font-medium text-muted-foreground">{year}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border/30">
                      <td className="py-2.5 pr-4 font-medium">China Woodchip Supply</td>
                      {woodchipSupply.map(d => (
                        <td key={d.year} className="text-center py-2.5 px-3 font-mono">{d.chinaSupply}</td>
                      ))}
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="py-2.5 pr-4 font-medium">Exporter Supply to China</td>
                      {woodchipSupply.map(d => (
                        <td key={d.year} className="text-center py-2.5 px-3 font-mono">{d.vietnamSupply}</td>
                      ))}
                    </tr>
                    <tr className="bg-muted/30 font-semibold">
                      <td className="py-2.5 pr-4">Total Supply</td>
                      {woodchipSupply.map(d => (
                        <td key={d.year} className="text-center py-2.5 px-3 font-mono">{d.total}</td>
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
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Player</th>
                      {years.map(year => (
                        <th key={year} className="text-center py-2 px-3 font-medium text-muted-foreground">{year}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border/30 bg-primary/5">
                      <td className="py-2.5 pr-4 font-semibold text-primary">APP China</td>
                      {pulpCapacity.app.map(d => (
                        <td key={d.year} className="text-center py-2.5 px-3 font-mono font-semibold text-primary">{d.capacity}</td>
                      ))}
                    </tr>
                    {pulpCapacity.competitors.map((comp, idx) => (
                      <tr key={comp.name} className={cn('border-b border-border/30', idx % 2 === 0 ? '' : 'bg-muted/20')}>
                        <td className="py-2.5 pr-4 font-medium">{comp.name}</td>
                        {comp.capacity.map(d => (
                          <td key={d.year} className="text-center py-2.5 px-3 font-mono">{d.capacity}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2.3 Downstream Markets */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-amber-600" />
                <h4 className="text-sm font-semibold">2.3 Downstream Markets</h4>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                {downstreamCapacity.map(segment => (
                  <div key={segment.segment} className="space-y-2">
                    <div className="flex items-center gap-2">
                      {segment.segment === 'Paper' && <FileText className="h-3.5 w-3.5 text-muted-foreground" />}
                      {segment.segment === 'Packaging' && <Package className="h-3.5 w-3.5 text-muted-foreground" />}
                      {segment.segment === 'Tissue' && <Bath className="h-3.5 w-3.5 text-muted-foreground" />}
                      <span className="text-xs font-semibold">{segment.segment}</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border/50">
                            <th className="text-left py-1.5 pr-2 font-medium text-muted-foreground">Year</th>
                            <th className="text-center py-1.5 px-1 font-medium text-muted-foreground">APP</th>
                            <th className="text-center py-1.5 px-1 font-medium text-muted-foreground">Others</th>
                          </tr>
                        </thead>
                        <tbody>
                          {segment.data.map(d => (
                            <tr key={d.year} className="border-b border-border/20">
                              <td className="py-1.5 pr-2 font-medium">{d.year}</td>
                              <td className="text-center py-1.5 px-1 font-mono text-primary">{d.app}</td>
                              <td className="text-center py-1.5 px-1 font-mono">{d.competitors}</td>
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

        {/* Section 3: Editable Overrides */}
        <Card className="border-amber-200 bg-amber-50/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <Edit3 className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Editable Overrides</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Adjust key outputs if needed (click values to edit)</p>
              </div>
              <span className="ml-auto text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded">Optional</span>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Click any capacity value in the tables above to override. Overridden values will be highlighted.
              </div>
              
              {Object.keys(overrides).length > 0 ? (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-amber-700">Active Overrides:</div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(overrides).map(([key, values]) => 
                      Object.entries(values).map(([year, value]) => (
                        <span 
                          key={`${key}-${year}`}
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-amber-100 text-amber-700 text-xs"
                        >
                          {key} ({year}): {value}
                          <button 
                            onClick={() => {
                              const newOverrides = { ...overrides }
                              delete newOverrides[key][parseInt(year)]
                              if (Object.keys(newOverrides[key]).length === 0) {
                                delete newOverrides[key]
                              }
                              setOverrides(newOverrides)
                            }}
                            className="hover:text-amber-900"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground italic">
                  No overrides applied. Values are AI-generated based on your inputs.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Section 4: External Reference Input */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                <Upload className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">External Reference Input</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Upload reference files (Excel/CSV) for context</p>
              </div>
              <span className="ml-auto text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded">Reference Only</span>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {/* Upload area */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border/50 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <FileSpreadsheet className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Click to upload Excel or CSV files
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Files are for reference only and will not override model calculations
                </p>
              </div>
              
              {/* Uploaded files list */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">Uploaded Files:</div>
                  <div className="space-y-1.5">
                    {uploadedFiles.map((file, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <button 
                          onClick={() => removeFile(index)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Info note */}
              <div className="flex items-start gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <Info className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-slate-600">
                  Uploaded files serve as reference material for your analysis. 
                  The simulation model uses inputs from previous steps and does not automatically incorporate external data.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
