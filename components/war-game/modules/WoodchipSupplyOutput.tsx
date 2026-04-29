'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { BarChart3, ChevronUp, ChevronDown, TreePine, Globe } from 'lucide-react'
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
  downturn: 100, // More wood available (less construction demand)
  stable: 0,
  recovery: -100, // Less wood available (diverted to construction)
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
    
    // Real estate always applies (global assumption)
    supply += REAL_ESTATE_IMPACT[realEstateCondition]
    
    // Policy only applies from start year
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
    
    // Policy only applies from start year
    if (isPolicyActive) {
      supply += VIETNAM_POLICY_IMPACT[exportPolicy]
    }
    
    const delta = isPolicyActive ? VIETNAM_POLICY_IMPACT[exportPolicy] : 0
    
    result[year] = { supply, delta, isPolicyActive }
  }
  
  return result
}

export function WoodchipSupplyOutput({ settings }: WoodchipSupplyOutputProps) {
  // Calculate yearly supplies based on all inputs
  const chinaSupply = calculateChinaYearlySupply(
    settings.chinaLoggingPolicy,
    settings.chinaLoggingPolicyStartYear,
    settings.chinaRealEstateCondition
  )
  
  const vietnamSupply = calculateVietnamYearlySupply(
    settings.vietnamExportPolicy,
    settings.vietnamExportPolicyStartYear
  )

  // Calculate total supply
  const totalSupply = YEARS.map(year => ({
    year,
    china: chinaSupply[year].supply,
    vietnam: vietnamSupply[year].supply,
    total: chinaSupply[year].supply + vietnamSupply[year].supply,
  }))

  return (
    <Card className="h-full border-border/50 bg-card/80">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="h-5 w-5 text-chart-1" />
          Woodchip Supply Output
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Calculated based on Domestic Demand Driver & Policy Drivers
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Table 1: China Woodchip Supply */}
        <div className="rounded-lg border border-success/30 bg-success/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <TreePine className="h-4 w-4 text-success" />
            <h3 className="text-sm font-semibold text-success">Table 1 — China Woodchip Supply</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-success/20">
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground w-32">Year</th>
                  {YEARS.map((year) => (
                    <th key={year} className={cn(
                      'text-center py-2 px-4 font-medium',
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
                  <td className="py-3 px-3 text-muted-foreground">Supply (kt)</td>
                  {YEARS.map((year) => {
                    const data = chinaSupply[year]
                    return (
                      <td key={year} className="text-center py-3 px-4">
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
                              {data.delta > 0 ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
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
          <p className="text-[10px] text-muted-foreground mt-2 italic">
            Affected by: Real Estate Condition ({settings.chinaRealEstateCondition}) + Logging Policy ({settings.chinaLoggingPolicy} from {settings.chinaLoggingPolicyStartYear})
          </p>
        </div>

        {/* Table 2: Vietnam Supply to China */}
        <div className="rounded-lg border border-chart-2/30 bg-chart-2/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="h-4 w-4 text-chart-2" />
            <h3 className="text-sm font-semibold text-chart-2">Table 2 — Vietnam Supply to China</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-chart-2/20">
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground w-32">Year</th>
                  {YEARS.map((year) => (
                    <th key={year} className={cn(
                      'text-center py-2 px-4 font-medium',
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
                  <td className="py-3 px-3 text-muted-foreground">Supply (kt)</td>
                  {YEARS.map((year) => {
                    const data = vietnamSupply[year]
                    return (
                      <td key={year} className="text-center py-3 px-4">
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
                              {data.delta > 0 ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
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
          <p className="text-[10px] text-muted-foreground mt-2 italic">
            Affected by: Vietnam Export Policy ({settings.vietnamExportPolicy} from {settings.vietnamExportPolicyStartYear})
          </p>
        </div>

        {/* Summary Row */}
        <div className="rounded-lg border border-border/50 bg-secondary/30 p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-4 w-4 text-foreground" />
            <h3 className="text-sm font-semibold">Total Woodchip Supply to China</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground w-32">Year</th>
                  {YEARS.map((year) => (
                    <th key={year} className="text-center py-2 px-4 font-medium text-foreground">
                      {year}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-3 px-3 text-muted-foreground">Total (kt)</td>
                  {totalSupply.map(({ year, total }) => (
                    <td key={year} className="text-center py-3 px-4">
                      <span className="font-mono font-bold text-base text-foreground">
                        {total}
                      </span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
