'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { BarChart3, ChevronUp, ChevronDown } from 'lucide-react'
import type { ForestrySettings, PolicyLevel, ExportPolicyLevel, RealEstateCondition, PolicyStartYear } from '@/lib/types/war-game'

interface WoodchipSupplyOutputProps {
  settings: ForestrySettings
}

const YEARS: PolicyStartYear[] = [2026, 2027, 2028, 2029, 2030, 2031]

// Base supply values
const CHINA_BASE_SUPPLY = 750 // kt
const VIETNAM_BASE_SUPPLY = 400 // kt

// Policy impact multipliers
const CHINA_POLICY_IMPACT: Record<PolicyLevel, number> = {
  tight: -150,
  baseline: 0,
  relaxed: 150,
}

const REAL_ESTATE_IMPACT: Record<RealEstateCondition, number> = {
  downturn: 100,
  stable: 0,
  recovery: -100,
}

const VIETNAM_POLICY_IMPACT: Record<ExportPolicyLevel, number> = {
  restricted: -120,
  baseline: 0,
  expanded: 120,
}

// Calculate China woodchip supply for each year
function calculateChinaYearlySupply(
  loggingPolicy: PolicyLevel,
  policyStartYear: PolicyStartYear,
  realEstateCondition: RealEstateCondition
): Record<PolicyStartYear, { supply: number; delta: number; isPolicyActive: boolean }> {
  const result: Record<PolicyStartYear, { supply: number; delta: number; isPolicyActive: boolean }> = {} as Record<PolicyStartYear, { supply: number; delta: number; isPolicyActive: boolean }>
  
  for (const year of YEARS) {
    const isPolicyActive = year >= policyStartYear
    let supply = CHINA_BASE_SUPPLY
    supply += REAL_ESTATE_IMPACT[realEstateCondition]
    if (isPolicyActive) {
      supply += CHINA_POLICY_IMPACT[loggingPolicy]
    }
    const delta = isPolicyActive ? CHINA_POLICY_IMPACT[loggingPolicy] : 0
    result[year] = { supply, delta, isPolicyActive }
  }
  
  return result
}

// Calculate Vietnam supply for each year
function calculateVietnamYearlySupply(
  exportPolicy: ExportPolicyLevel,
  policyStartYear: PolicyStartYear
): Record<PolicyStartYear, { supply: number; delta: number; isPolicyActive: boolean }> {
  const result: Record<PolicyStartYear, { supply: number; delta: number; isPolicyActive: boolean }> = {} as Record<PolicyStartYear, { supply: number; delta: number; isPolicyActive: boolean }>
  
  for (const year of YEARS) {
    const isPolicyActive = year >= policyStartYear
    let supply = VIETNAM_BASE_SUPPLY
    if (isPolicyActive) {
      supply += VIETNAM_POLICY_IMPACT[exportPolicy]
    }
    const delta = isPolicyActive ? VIETNAM_POLICY_IMPACT[exportPolicy] : 0
    result[year] = { supply, delta, isPolicyActive }
  }
  
  return result
}

export function WoodchipSupplyOutput({ settings }: WoodchipSupplyOutputProps) {
  // Calculate supplies
  const chinaSupply = calculateChinaYearlySupply(
    settings.chinaLoggingPolicy,
    settings.chinaLoggingPolicyStartYear,
    settings.chinaRealEstateCondition
  )
  
  const vietnamSupply = calculateVietnamYearlySupply(
    settings.vietnamExportPolicy,
    settings.vietnamExportPolicyStartYear
  )

  return (
    <Card className="border-border/50 bg-card/80">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="h-5 w-5 text-blue-500" />
          Woodchip Supply Output
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* 2-Column Grid for Tables */}
        <div className="grid grid-cols-2 gap-6">
          {/* Left Column: China Woodchip Supply Table */}
          <div className="rounded-lg border border-success/30 bg-success/5 p-4">
            <h4 className="text-base font-semibold text-success mb-3">China Woodchip Supply</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-base">
                <thead>
                  <tr className="border-b border-success/20">
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground text-sm">Year</th>
                    {YEARS.map((year) => (
                      <th key={year} className={cn(
                        'text-center py-2 px-2 font-medium text-sm',
                        chinaSupply[year].isPolicyActive && settings.chinaLoggingPolicy !== 'baseline'
                          ? 'text-success'
                          : 'text-foreground'
                      )}>
                        {year}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-2 px-2 text-muted-foreground text-sm">Supply (kt)</td>
                    {YEARS.map((year) => {
                      const data = chinaSupply[year]
                      return (
                        <td key={year} className="text-center py-2 px-2">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className={cn(
                              'font-mono font-semibold text-base',
                              data.isPolicyActive && data.delta !== 0
                                ? data.delta > 0 ? 'text-emerald-600' : 'text-amber-600'
                                : 'text-foreground'
                            )}>
                              {data.supply}
                            </span>
                            {data.isPolicyActive && data.delta !== 0 && (
                              <span className={cn(
                                'text-xs flex items-center font-medium',
                                data.delta > 0 ? 'text-emerald-600' : 'text-amber-600'
                              )}>
                                {data.delta > 0 ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                {data.delta > 0 ? '+' : ''}{data.delta}
                              </span>
                            )}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-muted-foreground mt-2 italic">
              Affected by: Real Estate ({settings.chinaRealEstateCondition}) + Logging Policy ({settings.chinaLoggingPolicy} from {settings.chinaLoggingPolicyStartYear})
            </p>
          </div>

          {/* Right Column: Vietnam Supply to China Table */}
          <div className="rounded-lg border border-chart-2/30 bg-chart-2/5 p-4">
            <h4 className="text-base font-semibold text-chart-2 mb-3">Vietnam Supply to China</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-base">
                <thead>
                  <tr className="border-b border-chart-2/20">
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground text-sm">Year</th>
                    {YEARS.map((year) => (
                      <th key={year} className={cn(
                        'text-center py-2 px-2 font-medium text-sm',
                        vietnamSupply[year].isPolicyActive && settings.vietnamExportPolicy !== 'baseline'
                          ? 'text-chart-2'
                          : 'text-foreground'
                      )}>
                        {year}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-2 px-2 text-muted-foreground text-sm">Supply (kt)</td>
                    {YEARS.map((year) => {
                      const data = vietnamSupply[year]
                      return (
                        <td key={year} className="text-center py-2 px-2">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className={cn(
                              'font-mono font-semibold text-base',
                              data.isPolicyActive && data.delta !== 0
                                ? data.delta > 0 ? 'text-emerald-600' : 'text-amber-600'
                                : 'text-foreground'
                            )}>
                              {data.supply}
                            </span>
                            {data.isPolicyActive && data.delta !== 0 && (
                              <span className={cn(
                                'text-xs flex items-center font-medium',
                                data.delta > 0 ? 'text-emerald-600' : 'text-amber-600'
                              )}>
                                {data.delta > 0 ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                {data.delta > 0 ? '+' : ''}{data.delta}
                              </span>
                            )}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-muted-foreground mt-2 italic">
              Affected by: Vietnam Export Policy ({settings.vietnamExportPolicy} from {settings.vietnamExportPolicyStartYear})
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
