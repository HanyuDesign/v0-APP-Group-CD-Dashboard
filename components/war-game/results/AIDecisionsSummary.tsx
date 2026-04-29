'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { FileText, Package, Bath, Bot, Building2, Lightbulb, TrendingUp, TrendingDown, Minus, Globe, Factory, BarChart3, ArrowUp, ArrowDown, ArrowRight, ArrowLeft, ChevronUp, ChevronDown, Trees, Users } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { AIBadge } from '../shared/AIBadge'
import { TrafficLight } from '../shared/TrafficLight'
import type { SimulationResult } from '@/lib/types/war-game'
import { PLAYERS } from '@/lib/data/initial-data'

interface AIDecisionsSummaryProps {
  result: SimulationResult
}

// Navigation items for Pulp Capacity Decisions sub-sections
const PULP_NAV_ITEMS = [
  { id: 'app-capacity-outcome', label: 'APP Capacity Outcome', icon: Factory },
  { id: 'competitor-response', label: 'Competitor Response', icon: Users },
  { id: 'export-reallocation', label: 'Global Export Reallocation', icon: Globe },
  { id: 'market-impact', label: 'Market Impact Summary', icon: BarChart3 },
] as const

export function AIDecisionsSummary({ result }: AIDecisionsSummaryProps) {
  const [isInsightsExpanded, setIsInsightsExpanded] = useState(true)
  const [activeSection, setActiveSection] = useState<string>('app-capacity-outcome')
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})
  const navRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const { competitorChanges, exporterAllocations, segmentOutcomes, input } = result
  
  // Scroll to section with offset for sticky nav
  const scrollToSection = useCallback((sectionId: string) => {
    const section = sectionRefs.current[sectionId]
    const nav = navRef.current
    if (section && nav) {
      const navHeight = nav.offsetHeight
      const sectionTop = section.offsetTop - navHeight - 16 // 16px extra padding
      containerRef.current?.scrollTo({
        top: sectionTop,
        behavior: 'smooth'
      })
      setActiveSection(sectionId)
    }
  }, [])
  
  // Scroll spy to detect active section
  useEffect(() => {
    const container = containerRef.current
    const nav = navRef.current
    if (!container || !nav) return
    
    const handleScroll = () => {
      const navHeight = nav.offsetHeight
      const scrollTop = container.scrollTop
      
      // Find the section currently in view
      for (const item of PULP_NAV_ITEMS) {
        const section = sectionRefs.current[item.id]
        if (section) {
          const sectionTop = section.offsetTop - navHeight - 32
          const sectionBottom = sectionTop + section.offsetHeight
          
          if (scrollTop >= sectionTop && scrollTop < sectionBottom) {
            setActiveSection(item.id)
            break
          }
        }
      }
    }
    
    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  // Years constant
  const years = [2026, 2027, 2028, 2029, 2030, 2031] as const

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
  const totalCompetitorDownstreamChange = competitorChanges.reduce((sum, c) => sum + c.downstreamChange, 0)

  // Calculate exporter allocation summary
  const avgChinaShare = exporterAllocations.length > 0 
    ? exporterAllocations.reduce((sum, e) => sum + e.chinaShare, 0) / exporterAllocations.length 
    : 0
  const totalChinaExports = exporterAllocations.reduce((sum, e) => sum + e.chinaVolume, 0)

  // Generate AI insights
  const generateInsights = () => {
    const insights: string[] = []
    
    // APP strategy insight
    if (appChinaPulpAdd > 200) {
      insights.push(`APP's aggressive expansion (+${appChinaPulpAdd} kt pulp) signals strong market confidence and aims to capture dominant position in China.`)
    } else if (appChinaPulpAdd > 0) {
      insights.push(`APP's moderate capacity addition (+${appChinaPulpAdd} kt pulp) positions for growth while managing risk.`)
    }

    // Competitor response insight
    if (competitorsDelaying > competitorsExpanding) {
      insights.push(`Competitors are largely defensive: ${competitorsDelaying} players delaying vs ${competitorsExpanding} expanding, suggesting APP's move creates market uncertainty.`)
    } else if (competitorsExpanding > competitorsDelaying) {
      insights.push(`Market sees growth opportunity: ${competitorsExpanding} competitors also expanding, indicating potential oversupply risk.`)
    } else {
      insights.push(`Mixed competitor response: market participants are cautiously watching APP's moves before committing.`)
    }

    // Exporter allocation insight
    if (avgChinaShare > 0.5) {
      insights.push(`Exporters prioritizing China market (${Math.round(avgChinaShare * 100)}% avg allocation), indicating attractive pricing vs other regions.`)
    } else {
      insights.push(`Exporters diversifying away from China (${Math.round(avgChinaShare * 100)}% avg allocation), potentially due to local capacity additions pressuring prices.`)
    }

    // Market balance insight
    const tightSegments = segmentOutcomes.filter(s => s.supplyDemandBalance < -20).length
    const oversuppliedSegments = segmentOutcomes.filter(s => s.supplyDemandBalance > 50).length
    if (tightSegments > 0) {
      insights.push(`${tightSegments} downstream segment(s) showing supply shortage, creating pricing power opportunity.`)
    }
    if (oversuppliedSegments > 0) {
      insights.push(`${oversuppliedSegments} downstream segment(s) facing oversupply pressure, margin compression expected.`)
    }

    return insights
  }

  const insights = generateInsights()

  // Segment icons mapping
  const segmentIcons: Record<string, React.ReactNode> = {
    paper: <FileText className="h-4 w-4 text-muted-foreground" />,
    board: <Package className="h-4 w-4 text-chart-3" />,
    tissue: <Bath className="h-4 w-4 text-chart-2" />,
  }

  const segmentLabels: Record<string, string> = {
    paper: 'Paper',
    board: 'Packaging / Board',
    tissue: 'Tissue',
  }

  return (
    <div className="space-y-4">
      {/* AI Strategic Insights - Value Chain Flow */}
      <div className="rounded-lg border-2 border-indigo-200 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 overflow-hidden">
        <div 
          className="px-4 py-3 border-b border-indigo-200 bg-indigo-100/50 flex items-center gap-2 cursor-pointer hover:bg-indigo-100/70 transition-colors"
          onClick={() => setIsInsightsExpanded(!isInsightsExpanded)}
        >
          <Lightbulb className="h-5 w-5 text-indigo-600" />
          <h3 className="font-bold text-indigo-900">AI Strategic Insights</h3>
          <span className="text-xs text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded">Value Chain Analysis</span>
          <button className="ml-auto flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 transition-colors">
            {isInsightsExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                <span>Collapse</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                <span>Expand</span>
              </>
            )}
          </button>
        </div>
        
        <div className="p-4">
          {/* Expanded: Full 3-Stage Horizontal Flow */}
          {isInsightsExpanded && (
            <div className="grid grid-cols-[1fr_auto_1.2fr_auto_1fr] gap-2 items-stretch mb-4">
              {/* Stage 1: Forestry (LEFT) */}
              <div className="rounded-lg border border-green-200 bg-white p-3">
                <div className="flex items-center gap-2 mb-3">
                  <Trees className="h-4 w-4 text-green-600" />
                  <h4 className="font-semibold text-sm text-green-800">Forestry & Woodchip Supply</h4>
                </div>
                <div className="space-y-2">
                  <div className="text-center p-2 rounded bg-green-50">
                    <div className="text-xs text-muted-foreground">Total Supply Impact</div>
                    <div className="text-xl font-bold text-green-700">
                      {appChinaPulpAdd > 200 ? 'High Demand' : appChinaPulpAdd > 100 ? 'Moderate' : 'Stable'}
                    </div>
                    <span className={cn(
                      'text-xs px-1.5 py-0.5 rounded font-medium',
                      appChinaPulpAdd > 200 ? 'bg-red-100 text-red-600' : appChinaPulpAdd > 100 ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'
                    )}>
                      {appChinaPulpAdd > 200 ? 'Tight' : appChinaPulpAdd > 100 ? 'Balanced' : 'Abundant'}
                    </span>
                  </div>
                  <div className="text-center p-2 rounded bg-muted/30">
                    <div className="text-[10px] text-muted-foreground">Wood Demand from APP</div>
                    <div className="text-sm font-semibold">+{Math.round(appChinaPulpAdd * 2.2)} kt/yr</div>
                  </div>
                </div>
              </div>
              
              {/* Arrow: Pulp <- Forestry */}
              <div className="flex flex-col items-center justify-center px-1">
                <ArrowLeft className="h-5 w-5 text-green-500" />
                <div className="text-[9px] text-muted-foreground text-center mt-1 leading-tight">
                  Drives<br/>wood demand
                </div>
              </div>
              
              {/* Stage 2: Pulp (CENTER - Primary Driver) */}
              <div className="rounded-lg border-2 border-blue-300 bg-white p-3 shadow-sm">
                <div className="space-y-3">
                  {/* APP Expansion - Enlarged */}
                  <div className="p-4 rounded-lg bg-red-50 border-2 border-red-300">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Factory className="h-5 w-5 text-red-600" />
                        <span className="text-sm text-red-700 font-semibold">APP Capacity Decision</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <span className="text-3xl font-bold text-red-700">+{appChinaPulpAdd}</span>
                      <span className="text-lg text-red-600 ml-1">kt</span>
                    </div>
                  </div>
                  {/* Competitor Response */}
                  <div className="p-2 rounded bg-blue-50 border border-blue-100">
                    <div className="flex items-center gap-1 mb-1">
                      <Users className="h-3 w-3 text-blue-600" />
                      <span className="text-xs text-blue-700 font-medium">Competitor Response</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-semibold text-blue-800">{competitorsExpanding} expanding, {competitorsDelaying} delaying</span>
                      <span className={cn(
                        'ml-2 font-bold',
                        totalCompetitorPulpChange >= 0 ? 'text-green-600' : 'text-red-600'
                      )}>
                        {totalCompetitorPulpChange >= 0 ? '+' : ''}{totalCompetitorPulpChange} kt
                      </span>
                    </div>
                  </div>
                  {/* Exporter Allocation */}
                  <div className="p-2 rounded bg-indigo-50 border border-indigo-100">
                    <div className="flex items-center gap-1 mb-1">
                      <Globe className="h-3 w-3 text-indigo-600" />
                      <span className="text-xs text-indigo-700 font-medium">Exporter China Allocation</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-semibold text-indigo-800">{Math.round(avgChinaShare * 100)}%</span>
                      <span className="text-muted-foreground ml-1">({totalChinaExports} kt to China)</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Arrow: Pulp -> Downstream */}
              <div className="flex flex-col items-center justify-center px-1">
                <ArrowRight className="h-5 w-5 text-purple-500" />
                <div className="text-[9px] text-muted-foreground text-center mt-1 leading-tight">
                  Requires<br/>absorption
                </div>
              </div>
              
              {/* Stage 3: Downstream (RIGHT) */}
              <div className="rounded-lg border border-purple-200 bg-white p-3">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="h-4 w-4 text-purple-600" />
                  <h4 className="font-semibold text-sm text-purple-800">Downstream Absorption</h4>
                </div>
                <div className="space-y-2">
                  {segmentOutcomes.map(s => {
                    const Icon = segmentIcons[s.segment] || Package
                    return (
                      <div key={s.segment} className="p-2 rounded bg-purple-50/50 border border-purple-100">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium flex items-center gap-1">
                            {Icon} {segmentLabels[s.segment]}
                          </span>
                          <span className="text-base font-bold text-purple-700">{s.utilization.toFixed(2)}%</span>
                        </div>
                        <div className={cn(
                          'text-xs mt-1 font-medium',
                          s.utilization >= 85 ? 'text-green-600' :
                          s.utilization >= 70 ? 'text-amber-600' : 'text-red-600'
                        )}>
                          Margin Pressure: {s.utilization >= 85 ? 'Low' : s.utilization >= 70 ? 'Medium' : 'High'}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
          
          {/* Bottom Insights Layer - Aligned with stages above */}
          <div className={cn(
            "grid grid-cols-[1fr_auto_1.2fr_auto_1fr] gap-2",
            isInsightsExpanded && "pt-4 border-t border-indigo-200"
          )}>
            {/* Upstream Insights - Aligned with Forestry & Woodchip Supply */}
            <div className="p-3 rounded bg-green-50/50">
              <h5 className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">Upstream Insight</h5>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {appChinaPulpAdd > 200 
                  ? 'Aggressive APP expansion significantly increases wood demand, potentially tightening supply.'
                  : appChinaPulpAdd > 100
                    ? 'Moderate capacity expansion maintains balanced wood supply.'
                    : 'Conservative capacity plans keep wood demand stable.'
                }
              </p>
            </div>
            {/* Spacer for arrow alignment */}
            <div />
            {/* Market Dynamics - Aligned with APP Capacity Decision */}
            <div className="p-3 rounded bg-blue-50/50">
              <h5 className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Market Dynamics</h5>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {competitorsDelaying > competitorsExpanding
                  ? `Strong APP expansion triggers ${competitorsDelaying} competitor delays. Exporters shift ${Math.round(avgChinaShare * 100)}% allocation to China.`
                  : `Balanced expansion environment with ${competitorsExpanding} competitors expanding alongside APP.`
                }
              </p>
            </div>
            {/* Spacer for arrow alignment */}
            <div />
            {/* Downstream Risks - Aligned with Downstream Absorption */}
            <div className="p-3 rounded bg-purple-50/50">
              <h5 className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-2">Downstream Risk</h5>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {segmentOutcomes.some(s => s.utilization < 75)
                  ? 'Some segments facing oversupply. Risk of margin compression in underutilized markets.'
                  : 'Downstream demand sufficient to absorb planned capacity additions.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Analysis Divider */}
      <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        Detailed Analysis
        <span className="h-px flex-1 bg-border" />
      </h3>

      {/* Tabbed Section: Pulp Capacity Decisions & Downstream Outcomes */}
      <Tabs defaultValue="pulp" className="w-full">
        <TabsList className="mb-4 grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="pulp" className="gap-2">
            <Factory className="h-4 w-4" />
            Pulp Capacity Decisions
          </TabsTrigger>
          <TabsTrigger value="downstream" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Downstream Outcomes
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Pulp Capacity Decisions - Redesigned as Results View */}
        <TabsContent value="pulp">
          <div ref={containerRef} className="relative max-h-[calc(100vh-300px)] overflow-y-auto">
            {/* Sticky Sub-Navigation Bar - Step Progress Style */}
            <div 
              ref={navRef}
              className="sticky top-0 z-10 bg-white rounded-xl shadow-lg mb-4 py-6 px-8"
            >
              <nav className="flex items-center overflow-x-auto">
                {PULP_NAV_ITEMS.map((item, index) => {
                  const Icon = item.icon
                  const isActive = activeSection === item.id
                  const isLast = index === PULP_NAV_ITEMS.length - 1
                  
                  return (
                    <div key={item.id} className="flex items-center">
                      {/* Module Content - Horizontal Layout */}
                      <button
                        onClick={() => scrollToSection(item.id)}
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                      >
                        {/* Circle Indicator */}
                        <div className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0',
                          isActive 
                            ? 'border-[3px] border-blue-500 bg-white' 
                            : 'bg-blue-100'
                        )}>
                          {isActive ? (
                            <div className="w-3.5 h-3.5 rounded-full bg-blue-500" />
                          ) : (
                            <Icon className="w-4 h-4 text-blue-400" />
                          )}
                        </div>
                        
                        {/* Module Label - Horizontal beside icon */}
                        <div className="text-left">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                            Module {index + 1}
                          </p>
                          <p className={cn(
                            'text-sm font-semibold whitespace-nowrap',
                            isActive ? 'text-foreground' : 'text-muted-foreground'
                          )}>
                            {item.label}
                          </p>
                        </div>
                      </button>
                      
                      {/* Extended Connecting Line */}
                      {!isLast && (
                        <div className="h-0.5 min-w-[60px] w-full max-w-[120px] mx-4">
                          <div className={cn(
                            'h-full w-full',
                            isActive 
                              ? 'bg-gradient-to-r from-blue-400 to-gray-200' 
                              : 'bg-gray-200'
                          )} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </nav>
            </div>

            <TooltipProvider>
              <div className="space-y-4">
                {/* SECTION 1: APP Capacity Outcome */}
                <Card 
                  id="app-capacity-outcome"
                  ref={(el) => { sectionRefs.current['app-capacity-outcome'] = el }}
                  className="border-2 border-[#cc0000]/30 bg-red-50/30 scroll-mt-16"
                >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-[#cc0000]" />
                      APP Capacity Outcome
                    </CardTitle>
                    {/* Strategy Label */}
                    <span className={cn(
                      'px-3 py-1 rounded-full text-xs font-semibold',
                      appChinaPulpAdd > 250 && 'bg-red-100 text-red-700',
                      appChinaPulpAdd > 100 && appChinaPulpAdd <= 250 && 'bg-amber-100 text-amber-700',
                      appChinaPulpAdd <= 100 && 'bg-blue-100 text-blue-700'
                    )}>
                      {appChinaPulpAdd > 250 ? 'Aggressive' : appChinaPulpAdd > 100 ? 'Balanced' : 'Defensive'}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    {/* Main Table */}
                    <div className="flex-1 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[#cc0000]/20">
                            <th className="text-left py-2 px-3 font-medium text-muted-foreground w-48">Metric</th>
                            {years.map(year => (
                              <th key={year} className="text-center py-2 px-3 font-medium text-muted-foreground">{year}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {/* Row 1: APP China Capacity */}
                          <tr className="border-b border-[#cc0000]/10 bg-red-50">
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2">
                                <span className="h-3 w-3 rounded-full bg-[#cc0000]" />
                                <span className="font-semibold text-[#cc0000]">APP China Capacity</span>
                              </div>
                            </td>
                            {years.map(year => {
                              const value = input.appCapacity.appChina[year]
                              const isNew = year !== 2026 && value > 0
                              return (
                                <td key={year} className="text-center py-2.5 px-3">
                                  <span className={cn(
                                    'font-mono font-bold',
                                    year === 2026 ? 'text-[#cc0000]' : isNew ? 'text-emerald-600' : 'text-muted-foreground'
                                  )}>
                                    {year === 2026 ? value : isNew ? `+${value}` : '-'}
                                  </span>
                                  {isNew && <span className="text-[10px] text-muted-foreground ml-1">kt</span>}
                                </td>
                              )
                            })}
                          </tr>
                          {/* Row 2: Market Release (External pulp) */}
                          <tr className="border-b border-[#cc0000]/10">
                            <td className="py-2.5 px-3">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-2 cursor-help">
                                    <ArrowRight className="h-3 w-3 text-[#cc0000]/70" />
                                    <span className="text-[#cc0000]/80">Market Release</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">Pulp sold externally = Capacity x (1 - Internal Use)</p>
                                </TooltipContent>
                              </Tooltip>
                            </td>
                            {years.map(year => {
                              const capacity = input.appCapacity.appChina[year]
                              const internalRate = 0.3 // 30% internal use assumption
                              const external = year === 2026 ? Math.round(capacity * (1 - internalRate)) : Math.round(capacity * (1 - internalRate))
                              return (
                                <td key={year} className="text-center py-2.5 px-3">
                                  <span className="font-mono text-[#cc0000]/70">
                                    {year === 2026 ? external : external > 0 ? `+${external}` : '-'}
                                  </span>
                                  {external > 0 && year !== 2026 && <span className="text-[10px] text-muted-foreground ml-1">kt</span>}
                                </td>
                              )
                            })}
                          </tr>
                          {/* Row 3: Cumulative Market Impact */}
                          <tr className="bg-red-100/50">
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2">
                                <TrendingUp className="h-3 w-3 text-[#cc0000]" />
                                <span className="font-medium text-[#cc0000]">Cumulative Impact</span>
                              </div>
                            </td>
                            {(() => {
                              let cumulative = 0
                              const internalRate = 0.3
                              return years.map(year => {
                                const capacity = input.appCapacity.appChina[year]
                                if (year === 2026) {
                                  cumulative = Math.round(capacity * (1 - internalRate))
                                } else {
                                  cumulative += Math.round(capacity * (1 - internalRate))
                                }
                                return (
                                  <td key={year} className="text-center py-2.5 px-3">
                                    <span className="font-mono font-bold text-[#cc0000]">{cumulative}</span>
                                    <span className="text-[10px] text-muted-foreground ml-1">kt</span>
                                  </td>
                                )
                              })
                            })()}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    {/* Right Summary Panel */}
                    <div className="w-48 space-y-2 border-l border-[#cc0000]/20 pl-4">
                      <div className="rounded-lg bg-white p-3 border border-[#cc0000]/20">
                        <p className="text-[10px] text-muted-foreground">Total Added</p>
                        <p className="text-xl font-bold text-[#cc0000]">+{appChinaPulpAdd} kt</p>
                      </div>
                      <div className="rounded-lg bg-white p-3 border border-[#cc0000]/20">
                        <p className="text-[10px] text-muted-foreground">Market Release</p>
                        <p className="text-xl font-bold text-[#cc0000]/80">+{Math.round(appChinaPulpAdd * 0.7)} kt</p>
                      </div>
                      <div className="rounded-lg bg-white p-3 border border-[#cc0000]/20">
                        <p className="text-[10px] text-muted-foreground">Downstream</p>
                        <p className="text-lg font-bold text-[#cc0000]/70">+{appChinaDownstreamAdd} kt</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* SECTION 2: Competitor Response Table */}
              <Card 
                id="competitor-response"
                ref={(el) => { sectionRefs.current['competitor-response'] = el }}
                className="border-border/50 bg-card/80 scroll-mt-16"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Competitor Response
                    </CardTitle>
                    <AIBadge size="sm" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/50">
                          <th className="text-left py-2 px-3 font-medium text-muted-foreground w-36">Player</th>
                          {years.map(year => (
                            <th key={year} className="text-center py-2 px-3 font-medium text-muted-foreground">{year}</th>
                          ))}
                          <th className="text-left py-2 px-3 font-medium text-muted-foreground w-56">Reaction Summary</th>
                        </tr>
                      </thead>
                      <tbody>
                        {competitorChanges.map(change => {
                          const player = PLAYERS.find(p => p.id === change.playerId)!
                          // Distribute the pulpChange across years (simplified)
                          const yearlyChange = {
                            2026: player.pulpCapacity || 100,
                            2027: change.action === 'add' ? Math.round(change.pulpChange * 0.2) : change.action === 'delay' ? -Math.round(change.pulpChange * 0.3) : 0,
                            2028: change.action === 'add' ? Math.round(change.pulpChange * 0.3) : change.action === 'delay' ? -Math.round(change.pulpChange * 0.2) : 0,
                            2029: change.action === 'add' ? Math.round(change.pulpChange * 0.25) : 0,
                            2030: change.action === 'add' ? Math.round(change.pulpChange * 0.15) : change.action === 'delay' ? Math.round(change.pulpChange * 0.3) : 0,
                            2031: change.action === 'add' ? Math.round(change.pulpChange * 0.1) : change.action === 'delay' ? Math.round(change.pulpChange * 0.2) : 0,
                          }
                          return (
                            <tr key={change.playerId} className={cn(
                              'border-b border-border/30',
                              change.action === 'delay' && 'bg-amber-50/50',
                              change.action === 'add' && 'bg-emerald-50/50'
                            )}>
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-2">
                                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: player.color }} />
                                  <span className="font-medium">{player.nameCn}</span>
                                </div>
                              </td>
                              {years.map(year => {
                                const val = yearlyChange[year]
                                const isBase = year === 2026
                                return (
                                  <td key={year} className="text-center py-2.5 px-3">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="cursor-help">
                                          <span className={cn(
                                            'font-mono block',
                                            isBase ? 'text-muted-foreground' : val > 0 ? 'text-emerald-600 font-semibold' : val < 0 ? 'text-amber-600 font-semibold' : 'text-muted-foreground'
                                          )}>
                                            {isBase ? val : val > 0 ? `+${val}` : val < 0 ? val : '-'}
                                          </span>
                                          {!isBase && val !== 0 && (
                                            <span className={cn(
                                              'text-[9px] flex items-center justify-center gap-0.5 mt-0.5',
                                              val > 0 ? 'text-emerald-500' : 'text-amber-500'
                                            )}>
                                              {val > 0 ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
                                              {val > 0 ? 'Expand' : 'Delay'}
                                            </span>
                                          )}
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="text-xs max-w-48">{change.reasoning}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </td>
                                )
                              })}
                              <td className="py-2.5 px-3">
                                <p className="text-xs text-muted-foreground line-clamp-2 italic">
                                  {change.reasoning}
                                </p>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* SECTION 3: Global Export Reallocation */}
              <Card 
                id="export-reallocation"
                ref={(el) => { sectionRefs.current['export-reallocation'] = el }}
                className="border-teal-200 bg-gradient-to-r from-teal-50 to-cyan-50 scroll-mt-16"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2 text-teal-800">
                      <Globe className="h-4 w-4" />
                      Global Export Reallocation
                    </CardTitle>
                    <AIBadge size="sm" />
                  </div>
                  <p className="text-xs text-teal-600 mt-1">
                    How international suppliers reallocate exports in response to China market changes
                  </p>
                </CardHeader>
                <CardContent>
                  {(() => {
                    // Calculate China demand gap from inputs
                    const chinaDomesticSupply = (() => {
                      let base = 800
                      if (input.forestry.chinaLoggingPolicy === 'tight') base -= 150
                      else if (input.forestry.chinaLoggingPolicy === 'relaxed') base += 150
                      if (input.forestry.chinaRealEstateCondition === 'downturn') base -= 100
                      else if (input.forestry.chinaRealEstateCondition === 'recovery') base += 100
                      return base
                    })()
                    const vietnamExports = (() => {
                      let base = 400
                      if (input.forestry.vietnamExportPolicy === 'restricted') base -= 120
                      else if (input.forestry.vietnamExportPolicy === 'expanded') base += 120
                      return base
                    })()
                    const appExternalPulp = Math.round(appChinaPulpAdd * 0.7)
                    const chinaDemand = 2500 // Assumed baseline demand
                    const chinaDemandGap = chinaDemand - (chinaDomesticSupply + appExternalPulp + vietnamExports)
                    const chinaPriceIndex = chinaDemandGap > 200 ? 1.15 : chinaDemandGap > 0 ? 1.05 : 0.95

                    // Build exporter data with regional allocations
                    const exporterData = exporterAllocations.map(allocation => {
                      const player = PLAYERS.find(p => p.id === allocation.playerId)!
                      const totalCapacity = player.pulpCapacity || 500
                      const chinaVol = allocation.chinaVolume
                      const otherVol = allocation.otherRegionsVolume
                      
                      // Distribute "other" into Europe, India, Rest
                      // Base distribution varies by region
                      const isLatam = player.region === 'latam'
                      const europeShare = isLatam ? 0.4 : 0.15
                      const indiaShare = isLatam ? 0.25 : 0.35
                      const restShare = 1 - europeShare - indiaShare
                      
                      const europeVol = Math.round(otherVol * europeShare)
                      const indiaVol = Math.round(otherVol * indiaShare)
                      const restVol = Math.round(otherVol * restShare)

                      // Calculate deltas based on demand gap and price
                      const baselineChina = Math.round(totalCapacity * 0.35)
                      const chinaDelta = chinaVol - baselineChina
                      const europeDelta = chinaDelta < 0 ? Math.round(Math.abs(chinaDelta) * 0.5) : -Math.round(chinaDelta * 0.3)
                      const indiaDelta = chinaDelta < 0 ? Math.round(Math.abs(chinaDelta) * 0.3) : -Math.round(chinaDelta * 0.2)
                      const restDelta = -chinaDelta - europeDelta - indiaDelta

                      return {
                        playerId: allocation.playerId,
                        name: player.nameCn,
                        nameEn: player.name,
                        color: player.color,
                        region: player.region,
                        total: totalCapacity,
                        china: { vol: chinaVol, delta: chinaDelta },
                        europe: { vol: europeVol, delta: europeDelta },
                        india: { vol: indiaVol, delta: indiaDelta },
                        rest: { vol: restVol, delta: restDelta },
                        reasoning: allocation.reasoning,
                      }
                    })

                    return (
                      <div className="space-y-4">
                        {/* Simplified China-Focused Table - Exporters as Columns */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b-2 border-teal-200">
                                <th className="text-left py-3 px-3 font-medium text-teal-700 w-40">Metric</th>
                                {exporterData.map(exp => (
                                  <th key={exp.playerId} className="text-center py-3 px-4 font-medium">
                                    <div className="flex flex-col items-center gap-1">
                                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: exp.color }} />
                                      <span className="text-foreground">{exp.name}</span>
                                      <span className="text-[10px] text-muted-foreground font-normal">{exp.nameEn}</span>
                                    </div>
                                  </th>
                                ))}
                                <th className="text-center py-3 px-4 font-semibold text-teal-800 bg-teal-50">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {/* China Export Volume Row */}
                              <tr className="border-b border-teal-100 bg-red-50/30">
                                <td className="py-3 px-3">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-[#cc0000]">China Export</span>
                                    <span className="text-[10px] text-muted-foreground">(kt)</span>
                                  </div>
                                </td>
                                {exporterData.map(exp => (
                                  <td key={exp.playerId} className="text-center py-3 px-4">
                                    <span className="font-mono font-semibold text-[#cc0000] text-base">{exp.china.vol}</span>
                                  </td>
                                ))}
                                <td className="text-center py-3 px-4 bg-teal-50">
                                  <span className="font-mono font-bold text-[#cc0000] text-base">
                                    {exporterData.reduce((sum, e) => sum + e.china.vol, 0)}
                                  </span>
                                </td>
                              </tr>
                              {/* China Export Change Row */}
                              <tr className="border-b border-teal-100">
                                <td className="py-3 px-3">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-teal-700">Change vs Baseline</span>
                                    <span className="text-[10px] text-muted-foreground">(kt)</span>
                                  </div>
                                </td>
                                {exporterData.map(exp => (
                                  <td key={exp.playerId} className="text-center py-3 px-4">
                                    <span className={cn(
                                      'font-mono font-semibold text-base flex items-center justify-center gap-1',
                                      exp.china.delta > 0 && 'text-emerald-600',
                                      exp.china.delta < 0 && 'text-amber-600',
                                      exp.china.delta === 0 && 'text-muted-foreground'
                                    )}>
                                      {exp.china.delta > 0 && <ChevronUp className="h-4 w-4" />}
                                      {exp.china.delta < 0 && <ChevronDown className="h-4 w-4" />}
                                      {exp.china.delta > 0 ? `+${exp.china.delta}` : exp.china.delta < 0 ? exp.china.delta : '-'}
                                    </span>
                                  </td>
                                ))}
                                <td className="text-center py-3 px-4 bg-teal-50">
                                  {(() => {
                                    const totalDelta = exporterData.reduce((sum, e) => sum + e.china.delta, 0)
                                    return (
                                      <span className={cn(
                                        'font-mono font-bold text-base flex items-center justify-center gap-1',
                                        totalDelta > 0 && 'text-emerald-600',
                                        totalDelta < 0 && 'text-amber-600',
                                        totalDelta === 0 && 'text-muted-foreground'
                                      )}>
                                        {totalDelta > 0 && <ChevronUp className="h-4 w-4" />}
                                        {totalDelta < 0 && <ChevronDown className="h-4 w-4" />}
                                        {totalDelta > 0 ? `+${totalDelta}` : totalDelta < 0 ? totalDelta : '-'}
                                      </span>
                                    )
                                  })()}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* Bottom Summary Strip */}
                        <div className="grid grid-cols-3 gap-4 pt-2">
                          <div className="rounded-lg bg-white p-3 border border-teal-200">
                            <p className="text-xs text-teal-600 mb-1">China Demand Gap</p>
                            <p className={cn(
                              'text-xl font-bold',
                              chinaDemandGap > 200 ? 'text-emerald-600' : chinaDemandGap > 0 ? 'text-amber-600' : 'text-red-600'
                            )}>
                              {chinaDemandGap > 0 ? '+' : ''}{chinaDemandGap} kt
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {chinaDemandGap > 200 ? 'High demand attracts imports' : chinaDemandGap > 0 ? 'Moderate demand' : 'Oversupply reduces imports'}
                            </p>
                          </div>
                          <div className="rounded-lg bg-white p-3 border border-teal-200">
                            <p className="text-xs text-teal-600 mb-1">China Price Index</p>
                            <div className="flex items-center gap-2">
                              <p className={cn(
                                'text-xl font-bold',
                                chinaPriceIndex > 1.1 ? 'text-emerald-600' : chinaPriceIndex > 1 ? 'text-amber-600' : 'text-red-600'
                              )}>
                                {(chinaPriceIndex * 100).toFixed(0)}%
                              </p>
                              <span className="text-xs text-muted-foreground">vs Global</span>
                            </div>
                          </div>
                          <div className="rounded-lg bg-white p-3 border border-teal-200">
                            <p className="text-xs text-teal-600 mb-1">Total China Imports</p>
                            <p className="text-xl font-bold text-[#cc0000]">
                              {exporterData.reduce((sum, e) => sum + e.china.vol, 0)} kt
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              From {exporterData.length} exporters
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>

              {/* SECTION 4: Market Impact Summary */}
              <Card 
                id="market-impact"
                ref={(el) => { sectionRefs.current['market-impact'] = el }}
                className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 scroll-mt-16"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-blue-800">
                    <BarChart3 className="h-4 w-4" />
                    Market Impact Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Net Supply Change Row */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-blue-200">
                          <th className="text-left py-2 px-3 font-medium text-blue-700 w-48">Metric</th>
                          {years.map(year => (
                            <th key={year} className="text-center py-2 px-3 font-medium text-blue-700">{year}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {/* Net Supply Change */}
                        <tr className="border-b border-blue-100">
                          <td className="py-2.5 px-3 font-medium text-blue-800">Net Supply Change</td>
                          {years.map(year => {
                            const appExternal = year === 2026 ? 0 : Math.round(input.appCapacity.appChina[year] * 0.7)
                            const competitorNet = competitorChanges.reduce((sum, c) => {
                              const yearFactor = year === 2026 ? 0 : year === 2027 ? 0.2 : year === 2028 ? 0.3 : year === 2029 ? 0.25 : year === 2030 ? 0.15 : 0.1
                              return sum + Math.round(c.pulpChange * yearFactor)
                            }, 0)
                            const net = appExternal + competitorNet
                            return (
                              <td key={year} className="text-center py-2.5 px-3">
                                <span className={cn(
                                  'font-mono font-semibold',
                                  net > 50 ? 'text-red-600' : net < -20 ? 'text-emerald-600' : 'text-blue-600'
                                )}>
                                  {year === 2026 ? '-' : net > 0 ? `+${net}` : net < 0 ? net : '0'}
                                </span>
                                {year !== 2026 && <span className="text-[10px] text-muted-foreground ml-1">kt</span>}
                              </td>
                            )
                          })}
                        </tr>
                        {/* Price Signal */}
                        <tr className="bg-blue-100/50">
                          <td className="py-2.5 px-3 font-medium text-blue-800">Price Signal</td>
                          {years.map(year => {
                            const appExternal = year === 2026 ? 0 : Math.round(input.appCapacity.appChina[year] * 0.7)
                            const competitorNet = competitorChanges.reduce((sum, c) => {
                              const yearFactor = year === 2026 ? 0 : year === 2027 ? 0.2 : year === 2028 ? 0.3 : year === 2029 ? 0.25 : year === 2030 ? 0.15 : 0.1
                              return sum + Math.round(c.pulpChange * yearFactor)
                            }, 0)
                            const net = appExternal + competitorNet
                            const signal = net > 50 ? 'down' : net < -20 ? 'up' : 'stable'
                            return (
                              <td key={year} className="text-center py-2.5 px-3">
                                {year === 2026 ? (
                                  <span className="text-muted-foreground">-</span>
                                ) : (
                                  <div className={cn(
                                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                                    signal === 'down' && 'bg-red-100 text-red-700',
                                    signal === 'up' && 'bg-emerald-100 text-emerald-700',
                                    signal === 'stable' && 'bg-gray-100 text-gray-600'
                                  )}>
                                    {signal === 'down' && <ArrowDown className="h-3 w-3" />}
                                    {signal === 'up' && <ArrowUp className="h-3 w-3" />}
                                    {signal === 'stable' && <ArrowRight className="h-3 w-3" />}
                                    {signal === 'down' ? 'Down' : signal === 'up' ? 'Up' : 'Stable'}
                                  </div>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Bottom KPI Strip */}
                  <div className="grid grid-cols-3 gap-4 pt-2 border-t border-blue-200">
                    {/* Total Net Supply Change */}
                    <div className="rounded-lg bg-white p-3 border border-blue-200">
                      <p className="text-xs text-blue-600 mb-1">5-Year Net Supply</p>
                      {(() => {
                        const totalNet = years.slice(1).reduce((total, year) => {
                          const appExternal = Math.round(input.appCapacity.appChina[year] * 0.7)
                          const competitorNet = competitorChanges.reduce((sum, c) => {
                            const yearFactor = year === 2027 ? 0.2 : year === 2028 ? 0.3 : year === 2029 ? 0.25 : year === 2030 ? 0.15 : 0.1
                            return sum + Math.round(c.pulpChange * yearFactor)
                          }, 0)
                          return total + appExternal + competitorNet
                        }, 0)
                        return (
                          <p className={cn(
                            'text-2xl font-bold',
                            totalNet > 200 ? 'text-red-600' : totalNet > 0 ? 'text-amber-600' : 'text-emerald-600'
                          )}>
                            {totalNet > 0 ? '+' : ''}{totalNet} kt
                          </p>
                        )
                      })()}
                    </div>
                    {/* Market Balance */}
                    <div className="rounded-lg bg-white p-3 border border-blue-200">
                      <p className="text-xs text-blue-600 mb-1">Market Balance</p>
                      {(() => {
                        const totalNet = years.slice(1).reduce((total, year) => {
                          const appExternal = Math.round(input.appCapacity.appChina[year] * 0.7)
                          const competitorNet = competitorChanges.reduce((sum, c) => {
                            const yearFactor = year === 2027 ? 0.2 : year === 2028 ? 0.3 : year === 2029 ? 0.25 : year === 2030 ? 0.15 : 0.1
                            return sum + Math.round(c.pulpChange * yearFactor)
                          }, 0)
                          return total + appExternal + competitorNet
                        }, 0)
                        const balance = totalNet > 150 ? 'Surplus' : totalNet < -50 ? 'Tight' : 'Balanced'
                        return (
                          <div className={cn(
                            'inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold',
                            balance === 'Surplus' && 'bg-red-100 text-red-700',
                            balance === 'Tight' && 'bg-emerald-100 text-emerald-700',
                            balance === 'Balanced' && 'bg-amber-100 text-amber-700'
                          )}>
                            {balance}
                          </div>
                        )
                      })()}
                    </div>
                    {/* Price Trend */}
                    <div className="rounded-lg bg-white p-3 border border-blue-200">
                      <p className="text-xs text-blue-600 mb-1">Price Trend</p>
                      {(() => {
                        const totalNet = years.slice(1).reduce((total, year) => {
                          const appExternal = Math.round(input.appCapacity.appChina[year] * 0.7)
                          const competitorNet = competitorChanges.reduce((sum, c) => {
                            const yearFactor = year === 2027 ? 0.2 : year === 2028 ? 0.3 : year === 2029 ? 0.25 : year === 2030 ? 0.15 : 0.1
                            return sum + Math.round(c.pulpChange * yearFactor)
                          }, 0)
                          return total + appExternal + competitorNet
                        }, 0)
                        const trend = totalNet > 150 ? 'Down' : totalNet < -50 ? 'Up' : 'Stable'
                        return (
                          <div className={cn(
                            'inline-flex items-center gap-2 text-xl font-bold',
                            trend === 'Down' && 'text-red-600',
                            trend === 'Up' && 'text-emerald-600',
                            trend === 'Stable' && 'text-gray-600'
                          )}>
                            {trend === 'Down' && <ArrowDown className="h-5 w-5" />}
                            {trend === 'Up' && <ArrowUp className="h-5 w-5" />}
                            {trend === 'Stable' && <ArrowRight className="h-5 w-5" />}
                            {trend}
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                </CardContent>
              </Card>
              </div>
            </TooltipProvider>
          </div>
        </TabsContent>

        {/* Tab 2: Downstream Outcomes - Comprehensive 3-Column Layout */}
        <TabsContent value="downstream">
          <TooltipProvider>
            <div className="grid grid-cols-3 gap-4">
              {segmentOutcomes.map(outcome => {
                // Calculate supply breakdown per segment
                const segmentConfig = {
                  paper: { 
                    demand: 1800, 
                    appExisting: 450, 
                    color: '#1e40af',
                    bgColor: 'bg-blue-50',
                    borderColor: 'border-blue-200',
                    exportRegions: { sea: 45, europe: 35, na: 20 }
                  },
                  board: { 
                    demand: 2200, 
                    appExisting: 380, 
                    color: '#7c3aed',
                    bgColor: 'bg-violet-50',
                    borderColor: 'border-violet-200',
                    exportRegions: { sea: 50, europe: 30, na: 20 }
                  },
                  tissue: { 
                    demand: 1400, 
                    appExisting: 320, 
                    color: '#0891b2',
                    bgColor: 'bg-cyan-50',
                    borderColor: 'border-cyan-200',
                    exportRegions: { sea: 55, europe: 25, na: 20 }
                  },
                }[outcome.segment]!

                // Calculate APP new capacity from inputs
                const appNewCapacity = outcome.segment === 'paper' 
                  ? 0 
                  : outcome.segment === 'board'
                    ? (input.appCapacity.guangxi.includeBoard ? input.appCapacity.guangxi.boardCapacity : 0) +
                      (input.appCapacity.jiangsuFujian.includeBoard ? input.appCapacity.jiangsuFujian.boardCapacity : 0)
                    : (input.appCapacity.guangxi.includeTissue ? input.appCapacity.guangxi.tissueCapacity : 0) +
                      (input.appCapacity.jiangsuFujian.includeTissue ? input.appCapacity.jiangsuFujian.tissueCapacity : 0)

                // Calculate competitor supply
                const competitorSupply = Math.round(segmentConfig.demand * 0.55) // ~55% market
                const totalSupply = segmentConfig.appExisting + appNewCapacity + competitorSupply
                const gap = totalSupply - segmentConfig.demand
                const hasExcess = gap > 50

                // Cannibalization risk based on APP new capacity relative to market
                const cannibalizationRisk = appNewCapacity > segmentConfig.demand * 0.1 
                  ? 'High' 
                  : appNewCapacity > segmentConfig.demand * 0.05 
                    ? 'Medium' 
                    : 'Low'

                // Competitor reactions for this segment
                const segmentReactions = competitorChanges.slice(0, 3).map(change => {
                  const player = PLAYERS.find(p => p.id === change.playerId)!
                  const segmentAction = change.action === 'delay' 
                    ? 'Delay' 
                    : change.action === 'add' 
                      ? 'Expand' 
                      : 'Maintain'
                  const volumeChange = Math.round(change.downstreamChange * (outcome.segment === 'board' ? 0.5 : outcome.segment === 'tissue' ? 0.3 : 0.2))
                  return {
                    name: player.nameCn,
                    action: segmentAction,
                    volumeChange,
                    reason: change.reasoning.slice(0, 60) + '...',
                  }
                })

                // Price and profitability
                const priceDirection = gap > 100 ? 'down' : gap < -50 ? 'up' : 'stable'
                const profitability = gap > 100 ? 'Compression' : gap < -50 ? 'Expansion' : 'Stable'

                return (
                  <Card 
                    key={outcome.segment} 
                    className={cn('border', segmentConfig.borderColor)}
                  >
                    {/* Header with Cannibalization Risk Tag */}
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {segmentIcons[outcome.segment]}
                          <CardTitle className="text-base">{segmentLabels[outcome.segment]}</CardTitle>
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className={cn(
                              'px-2.5 py-1 rounded-full text-xs font-semibold cursor-help',
                              cannibalizationRisk === 'High' && 'bg-red-100 text-red-700',
                              cannibalizationRisk === 'Medium' && 'bg-amber-100 text-amber-700',
                              cannibalizationRisk === 'Low' && 'bg-emerald-100 text-emerald-700'
                            )}>
                              Cannibalization: {cannibalizationRisk}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-sm">Risk of APP new capacity cannibalizing existing market share</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* SECTION 1: Supply vs Demand */}
                      <div className="rounded-lg border border-border/50 bg-white/50 p-4">
                        <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Supply vs Demand</p>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Demand</span>
                            <span className="font-mono font-semibold text-base">{segmentConfig.demand} kt</span>
                          </div>
                          <div className="border-t border-dashed border-border/50 pt-2">
                            <p className="text-xs text-muted-foreground mb-1.5">Supply Breakdown:</p>
                            <div className="flex justify-between pl-3">
                              <span className="text-muted-foreground">APP (existing)</span>
                              <span className="font-mono">{segmentConfig.appExisting} kt</span>
                            </div>
                            <div className="flex justify-between pl-3">
                              <span className="text-[#cc0000]">APP (new)</span>
                              <span className="font-mono text-[#cc0000] font-semibold">+{appNewCapacity} kt</span>
                            </div>
                            <div className="flex justify-between pl-3">
                              <span className="text-muted-foreground">Competitors</span>
                              <span className="font-mono">{competitorSupply} kt</span>
                            </div>
                          </div>
                          <div className="flex justify-between border-t border-border/50 pt-2 font-semibold">
                            <span>Total Supply</span>
                            <span className="font-mono text-base">{totalSupply} kt</span>
                          </div>
                          <div className={cn(
                            'flex justify-between rounded-md px-3 py-1.5 mt-2',
                            gap > 50 && 'bg-red-100 text-red-700',
                            gap < -50 && 'bg-emerald-100 text-emerald-700',
                            Math.abs(gap) <= 50 && 'bg-amber-100 text-amber-700'
                          )}>
                            <span className="font-semibold">Gap</span>
                            <span className="font-mono font-bold text-base">
                              {gap > 0 ? '+' : ''}{gap} kt
                              <span className="ml-1.5 text-xs">
                                ({gap > 50 ? 'Surplus' : gap < -50 ? 'Shortage' : 'Balanced'})
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* SECTION 2: Competitor Reaction */}
                      <div className="rounded-lg border border-border/50 bg-white/50 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Competitor Reaction</p>
                          <AIBadge size="sm" />
                        </div>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border/30">
                              <th className="text-left py-1.5 font-medium text-muted-foreground">Name</th>
                              <th className="text-center py-1.5 font-medium text-muted-foreground">Action</th>
                              <th className="text-right py-1.5 font-medium text-muted-foreground">Vol</th>
                            </tr>
                          </thead>
                          <tbody>
                            {segmentReactions.map((reaction, idx) => (
                              <Tooltip key={idx}>
                                <TooltipTrigger asChild>
                                  <tr className="border-b border-border/20 cursor-help hover:bg-white/50">
                                    <td className="py-2">{reaction.name}</td>
                                    <td className="py-2 text-center">
                                      <span className={cn(
                                        'inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium',
                                        reaction.action === 'Delay' && 'bg-amber-100 text-amber-700',
                                        reaction.action === 'Expand' && 'bg-emerald-100 text-emerald-700',
                                        reaction.action === 'Maintain' && 'bg-gray-100 text-gray-600'
                                      )}>
                                        {reaction.action === 'Delay' && <ChevronDown className="h-3.5 w-3.5" />}
                                        {reaction.action === 'Expand' && <ChevronUp className="h-3.5 w-3.5" />}
                                        {reaction.action === 'Maintain' && <ArrowRight className="h-3.5 w-3.5" />}
                                        {reaction.action}
                                      </span>
                                    </td>
                                    <td className={cn(
                                      'py-2 text-right font-mono font-semibold',
                                      reaction.volumeChange > 0 && 'text-emerald-600',
                                      reaction.volumeChange < 0 && 'text-amber-600'
                                    )}>
                                      {reaction.volumeChange > 0 ? '+' : ''}{reaction.volumeChange}
                                    </td>
                                  </tr>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-sm max-w-56">{reaction.reason}</p>
                                </TooltipContent>
                              </Tooltip>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* SECTION 3: Export Allocation (conditional) */}
                      {hasExcess && (
                        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                          <p className="text-xs font-semibold text-orange-700 mb-3 uppercase tracking-wide">Export Allocation</p>
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-orange-600">Excess Volume</span>
                              <span className="font-mono font-bold text-orange-700 text-base">{gap} kt</span>
                            </div>
                            <div className="space-y-2">
                              <p className="text-xs text-orange-600">Regional Distribution:</p>
                              <div className="flex gap-1">
                                <div 
                                  className="h-5 rounded-l bg-teal-500 flex items-center justify-center"
                                  style={{ width: `${segmentConfig.exportRegions.sea}%` }}
                                >
                                  <span className="text-[10px] text-white font-medium">SEA</span>
                                </div>
                                <div 
                                  className="h-5 bg-blue-500 flex items-center justify-center"
                                  style={{ width: `${segmentConfig.exportRegions.europe}%` }}
                                >
                                  <span className="text-[10px] text-white font-medium">EU</span>
                                </div>
                                <div 
                                  className="h-5 rounded-r bg-indigo-500 flex items-center justify-center"
                                  style={{ width: `${segmentConfig.exportRegions.na}%` }}
                                >
                                  <span className="text-[10px] text-white font-medium">NA</span>
                                </div>
                              </div>
                              <div className="flex justify-between text-xs text-orange-600">
                                <span>SEA: {segmentConfig.exportRegions.sea}%</span>
                                <span>Europe: {segmentConfig.exportRegions.europe}%</span>
                                <span>NA: {segmentConfig.exportRegions.na}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TooltipProvider>
        </TabsContent>
      </Tabs>
    </div>
  )
}
