'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trees, TrendingUp, TrendingDown, Lightbulb, AlertTriangle, CheckCircle, Info, Leaf, Ship, Factory } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AIBadge } from '../shared/AIBadge'
import type { SimulationResult } from '@/lib/types/war-game'
import { computeAllFromInput } from '@/lib/simulation/computations'

interface ForestryDetailsProps {
  result: SimulationResult
}

export function ForestryDetails({ result }: ForestryDetailsProps) {
  const { input } = result
  const years = [2026, 2027, 2028, 2029, 2030, 2031] as const
  
  // Compute woodchip supply from input
  const computed = computeAllFromInput(input)
  const woodchipSupply = computed.woodchipSupply

  // Calculate supply-demand metrics
  const appChinaPulpAdd = input.appCapacity.guangxi.pulpCapacity + input.appCapacity.jiangsuFujian.pulpCapacity
  const woodDemandIncrease = Math.round(appChinaPulpAdd * 2.2) // ~2.2 kt wood per kt pulp
  
  // Derive policy impacts from input settings
  const loggingPolicy = input.forestry.chinaLoggingPolicy
  const realEstateCondition = input.forestry.chinaRealEstateCondition
  const exportPolicy = input.forestry.vietnamExportPolicy

  // Generate AI analysis based on inputs
  const generateAIAnalysis = () => {
    const analysis = {
      supplyTightness: 'balanced',
      importReliance: 'moderate',
      costImplications: 'stable',
      drivers: [] as string[],
      risks: [] as string[],
      opportunities: [] as string[],
    }

    // Logging policy impact (tight, baseline, relaxed)
    if (loggingPolicy === 'tight') {
      analysis.drivers.push('Restrictive logging policies limit domestic supply growth')
      analysis.supplyTightness = 'tight'
      analysis.importReliance = 'high'
    } else if (loggingPolicy === 'relaxed') {
      analysis.drivers.push('Relaxed logging regulations support domestic supply expansion')
      analysis.opportunities.push('Lower import dependency reduces currency exposure')
    } else {
      analysis.drivers.push('Stable logging policy maintains current supply levels')
    }

    // Real estate impact (downturn, stable, recovery)
    if (realEstateCondition === 'downturn') {
      analysis.drivers.push('Weak real estate reduces construction wood demand, freeing supply')
      analysis.opportunities.push('Lower domestic competition for wood resources')
      if (analysis.supplyTightness === 'tight') analysis.supplyTightness = 'balanced'
    } else if (realEstateCondition === 'recovery') {
      analysis.drivers.push('Strong real estate increases competition for domestic wood')
      analysis.risks.push('Higher wood prices from construction sector demand')
      if (analysis.supplyTightness === 'balanced') analysis.supplyTightness = 'tight'
    }

    // Export policy impact (restricted, baseline, expanded)
    if (exportPolicy === 'expanded') {
      analysis.drivers.push('Exporters expanding China allocation increases import availability')
      analysis.importReliance = 'high'
      analysis.opportunities.push('Reliable import supply from key exporter countries')
    } else if (exportPolicy === 'restricted') {
      analysis.drivers.push('Exporters restricting China allocation reduces import availability')
      analysis.risks.push('Need to secure alternative supply sources')
      analysis.importReliance = 'decreasing'
    }

    // Cost implications
    if (analysis.supplyTightness === 'tight' && appChinaPulpAdd > 200) {
      analysis.costImplications = 'elevated'
      analysis.risks.push('Significant wood cost increases expected')
    } else if (analysis.supplyTightness === 'tight') {
      analysis.costImplications = 'moderate-high'
    } else if (analysis.importReliance === 'high') {
      analysis.costImplications = 'moderate'
      analysis.risks.push('Currency fluctuation exposure from high imports')
    }

    return analysis
  }

  const aiAnalysis = generateAIAnalysis()

  // Calculate import dependency percentage
  const getImportDependency = (yearData: typeof woodchipSupply[0]) => {
    if (yearData.totalSupply === 0) return 0
    return Math.round(((yearData.vietnamSupply + (yearData.totalSupply - yearData.chinaSupply - yearData.vietnamSupply)) / yearData.totalSupply) * 100)
  }

  return (
    <div className="space-y-4">
      {/* AI Analysis Module - NEW */}
      <Card id="forestry-ai-analysis" className="border-2 border-green-200 bg-gradient-to-r from-green-50/50 to-emerald-50/50 scroll-mt-96">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-green-100">
              <Lightbulb className="h-5 w-5 text-green-600" />
            </div>
            <CardTitle className="text-lg">AI Forestry Analysis</CardTitle>
            <AIBadge size="sm" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Key Indicators */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-white border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Trees className="h-4 w-4 text-green-600" />
                <span className="text-xs font-medium text-muted-foreground">Supply Tightness</span>
              </div>
              <div className={cn(
                'text-lg font-bold capitalize',
                aiAnalysis.supplyTightness === 'tight' && 'text-red-600',
                aiAnalysis.supplyTightness === 'balanced' && 'text-amber-600',
                aiAnalysis.supplyTightness === 'abundant' && 'text-green-600'
              )}>
                {aiAnalysis.supplyTightness}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-white border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Ship className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium text-muted-foreground">Import Reliance</span>
              </div>
              <div className={cn(
                'text-lg font-bold capitalize',
                aiAnalysis.importReliance === 'high' && 'text-amber-600',
                aiAnalysis.importReliance === 'moderate' && 'text-blue-600',
                aiAnalysis.importReliance === 'decreasing' && 'text-red-600'
              )}>
                {aiAnalysis.importReliance}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-white border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Factory className="h-4 w-4 text-purple-600" />
                <span className="text-xs font-medium text-muted-foreground">Cost Implications</span>
              </div>
              <div className={cn(
                'text-lg font-bold capitalize',
                aiAnalysis.costImplications === 'elevated' && 'text-red-600',
                aiAnalysis.costImplications === 'moderate-high' && 'text-amber-600',
                aiAnalysis.costImplications === 'moderate' && 'text-blue-600',
                aiAnalysis.costImplications === 'stable' && 'text-green-600'
              )}>
                {aiAnalysis.costImplications}
              </div>
            </div>
          </div>

          {/* Drivers */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-500" />
              Key Drivers (from your inputs)
            </h4>
            <ul className="space-y-1.5">
              {aiAnalysis.drivers.map((driver, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                  {driver}
                </li>
              ))}
            </ul>
          </div>

          {/* Risks & Opportunities */}
          <div className="grid grid-cols-2 gap-4">
            {aiAnalysis.risks.length > 0 && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <h4 className="text-sm font-semibold text-red-700 flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  Risks
                </h4>
                <ul className="space-y-1">
                  {aiAnalysis.risks.map((risk, idx) => (
                    <li key={idx} className="text-xs text-red-600">{risk}</li>
                  ))}
                </ul>
              </div>
            )}
            {aiAnalysis.opportunities.length > 0 && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <h4 className="text-sm font-semibold text-emerald-700 flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4" />
                  Opportunities
                </h4>
                <ul className="space-y-1">
                  {aiAnalysis.opportunities.map((opp, idx) => (
                    <li key={idx} className="text-xs text-emerald-600">{opp}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Woodchip Supply Table */}
      <Card id="forestry-woodchip-supply" className="border-border/50 bg-card/80 scroll-mt-96">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trees className="h-4 w-4 text-green-600" />
              Woodchip Supply Projection
            </CardTitle>
            <span className="text-xs text-muted-foreground">Unit: kt</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-base">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground w-48">Source</th>
                  {years.map(year => (
                    <th key={year} className="text-center py-2 px-3 font-medium text-muted-foreground">{year}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* China Domestic */}
                <tr className="border-b border-border/30">
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <Leaf className="h-3.5 w-3.5 text-green-600" />
                      <span className="font-medium">China Domestic</span>
                    </div>
                  </td>
                  {woodchipSupply.map(yearData => (
                    <td key={yearData.year} className="text-center py-2.5 px-3 font-mono">
                      {yearData.chinaSupply}
                    </td>
                  ))}
                </tr>
                {/* Vietnam */}
                <tr className="border-b border-border/30">
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <Ship className="h-3.5 w-3.5 text-blue-600" />
                      <span className="font-medium">Vietnam Export</span>
                    </div>
                  </td>
                  {woodchipSupply.map(yearData => (
                    <td key={yearData.year} className="text-center py-2.5 px-3 font-mono">
                      {yearData.vietnamSupply}
                    </td>
                  ))}
                </tr>
                {/* Other Importers */}
                <tr className="border-b border-border/30">
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <Ship className="h-3.5 w-3.5 text-indigo-600" />
                      <span className="font-medium">Other Imports</span>
                    </div>
                  </td>
                  {woodchipSupply.map(yearData => {
                    const otherImports = yearData.totalSupply - yearData.chinaSupply - yearData.vietnamSupply
                    return (
                      <td key={yearData.year} className="text-center py-2.5 px-3 font-mono">
                        {otherImports}
                      </td>
                    )
                  })}
                </tr>
                {/* Total */}
                <tr className="bg-green-50">
                  <td className="py-2.5 px-3">
                    <span className="font-semibold text-green-700">Total Supply</span>
                  </td>
                  {woodchipSupply.map(yearData => (
                    <td key={yearData.year} className="text-center py-2.5 px-3 font-mono font-bold text-green-700">
                      {yearData.totalSupply}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Import Dependency Indicators */}
      <Card id="forestry-import-dependency" className="border-border/50 bg-card/80 scroll-mt-96">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Ship className="h-4 w-4 text-blue-600" />
            Import Dependency Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 gap-2">
            {woodchipSupply.map(yearData => {
              const importDep = getImportDependency(yearData)
              const prevYearData = woodchipSupply.find(y => y.year === yearData.year - 1)
              const prevImportDep = prevYearData ? getImportDependency(prevYearData) : importDep
              const trend = importDep - prevImportDep
              
              return (
                <div key={yearData.year} className="text-center p-3 rounded-lg bg-muted/30">
                  <div className="text-xs text-muted-foreground mb-1">{yearData.year}</div>
                  <div className={cn(
                    'text-xl font-bold',
                    importDep > 60 ? 'text-amber-600' : importDep > 40 ? 'text-blue-600' : 'text-green-600'
                  )}>
                    {importDep}%
                  </div>
                  {yearData.year !== 2026 && (
                    <div className={cn(
                      'text-xs flex items-center justify-center gap-0.5 mt-1',
                      trend > 0 ? 'text-amber-500' : trend < 0 ? 'text-green-500' : 'text-muted-foreground'
                    )}>
                      {trend > 0 ? <TrendingUp className="h-3 w-3" /> : trend < 0 ? <TrendingDown className="h-3 w-3" /> : null}
                      {trend > 0 ? '+' : ''}{trend}%
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Import dependency = (Imports / Total Supply) × 100
          </p>
        </CardContent>
      </Card>

      {/* Supply-Demand Balance */}
      <Card id="forestry-supply-demand" className="border-border/50 bg-card/80 scroll-mt-96">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-amber-600" />
            Supply-Demand Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Additional Wood Demand (from APP expansion)</span>
                <span className="font-bold text-amber-600">+{woodDemandIncrease} kt/yr</span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-400 to-red-400 rounded-full transition-all"
                  style={{ width: `${Math.min(woodDemandIncrease / 10, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Low pressure</span>
                <span>High pressure</span>
              </div>
            </div>
            <div className="w-48 p-3 rounded-lg bg-amber-50 border border-amber-200 text-center">
              <div className="text-xs text-amber-600 mb-1">Balance Assessment</div>
              <div className={cn(
                'text-lg font-bold',
                woodDemandIncrease > 500 ? 'text-red-600' : woodDemandIncrease > 300 ? 'text-amber-600' : 'text-green-600'
              )}>
                {woodDemandIncrease > 500 ? 'Tight' : woodDemandIncrease > 300 ? 'Manageable' : 'Comfortable'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
