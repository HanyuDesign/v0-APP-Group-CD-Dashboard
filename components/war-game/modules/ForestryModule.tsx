'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { TreePine, Globe, Building2, FileText, ChevronUp, ChevronDown } from 'lucide-react'
import type { ForestrySettings, PolicyLevel, ExportPolicyLevel, RealEstateCondition, PolicyStartYear } from '@/lib/types/war-game'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ForestryModuleProps {
  settings: ForestrySettings
  onChange: (settings: ForestrySettings) => void
}

const YEARS: PolicyStartYear[] = [2026, 2027, 2028, 2029, 2030, 2031]

// Base supply values
const CHINA_BASE_SUPPLY = 750 // kt
const VIETNAM_BASE_SUPPLY = 400 // kt

// Policy impact multipliers
const CHINA_POLICY_IMPACT = {
  tight: -150,
  baseline: 0,
  relaxed: 150,
}

const REAL_ESTATE_IMPACT = {
  downturn: 100, // More wood available (less construction demand)
  stable: 0,
  recovery: -100, // Less wood available (diverted to construction)
}

const VIETNAM_POLICY_IMPACT = {
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
  const result: Record<PolicyStartYear, { supply: number; delta: number; isPolicyActive: boolean }> = {} as any
  
  for (const year of YEARS) {
    const isPolicyActive = year >= policyStartYear
    let supply = CHINA_BASE_SUPPLY
    
    // Real estate always applies (global assumption)
    supply += REAL_ESTATE_IMPACT[realEstateCondition]
    
    // Policy only applies from start year
    if (isPolicyActive) {
      supply += CHINA_POLICY_IMPACT[loggingPolicy]
    }
    
    const baselineSupply = CHINA_BASE_SUPPLY + REAL_ESTATE_IMPACT[realEstateCondition]
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
  const result: Record<PolicyStartYear, { supply: number; delta: number; isPolicyActive: boolean }> = {} as any
  
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

// Segmented button component for policy selection
function SegmentedControl<T extends string>({
  value,
  options,
  labels,
  onChange,
}: {
  value: T
  options: T[]
  labels: Record<T, string>
  onChange: (value: T) => void
}) {
  return (
    <div className="flex rounded-lg border border-border/50 overflow-hidden">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={cn(
            'flex-1 px-3 py-2 text-xs font-medium transition-all',
            value === option
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary/30 text-muted-foreground hover:bg-secondary/50'
          )}
        >
          {labels[option]}
        </button>
      ))}
    </div>
  )
}

export function ForestryModule({
  settings,
  onChange,
}: ForestryModuleProps) {
  // Calculate yearly supplies
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
    <Card className="h-full border-border/50 bg-card/80">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TreePine className="h-5 w-5 text-success" />
          Forestry & Woodchips
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Section 1: Micro Demand Driver (China) */}
        <div className="rounded-lg border border-border/50 bg-secondary/20 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="h-4 w-4 text-amber-600" />
            <h3 className="font-semibold text-sm">Domestic Demand Driver (China)</h3>
          </div>
          
          <div className="space-y-3">
            <Label className="text-sm text-muted-foreground">China Real Estate Market Condition</Label>
            <SegmentedControl
              value={settings.chinaRealEstateCondition}
              options={['downturn', 'stable', 'recovery'] as RealEstateCondition[]}
              labels={{ downturn: 'Downturn', stable: 'Stable', recovery: 'Recovery' }}
              onChange={(value) => onChange({ ...settings, chinaRealEstateCondition: value })}
            />
            <p className="text-[10px] text-muted-foreground italic">
              Applies across all years. Downturn increases wood availability; Recovery reduces it.
            </p>
          </div>
        </div>

        {/* Section 2: Policy Drivers (Time-based) */}
        <div className="rounded-lg border border-border/50 bg-secondary/20 p-4">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-4 w-4 text-blue-600" />
            <h3 className="font-semibold text-sm">Policy Drivers (Time-based)</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            {/* China Logging Policy */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <TreePine className="h-4 w-4 text-success" />
                <span className="text-sm font-medium">China Logging Policy</span>
              </div>
              
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Policy Start Year</Label>
                  <Select
                    value={String(settings.chinaLoggingPolicyStartYear)}
                    onValueChange={(value) => onChange({ 
                      ...settings, 
                      chinaLoggingPolicyStartYear: Number(value) as PolicyStartYear 
                    })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {YEARS.map((year) => (
                        <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Policy Level</Label>
                  <SegmentedControl
                    value={settings.chinaLoggingPolicy}
                    options={['tight', 'baseline', 'relaxed'] as PolicyLevel[]}
                    labels={{ tight: 'Tight', baseline: 'Baseline', relaxed: 'Relaxed' }}
                    onChange={(value) => onChange({ ...settings, chinaLoggingPolicy: value })}
                  />
                </div>
              </div>

              {/* China Supply Output Table */}
              <div className="mt-4 rounded-lg border border-success/30 bg-success/5 p-3">
                <p className="text-xs font-semibold text-success mb-2">China Woodchip Supply</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-success/20">
                        <th className="text-left py-1.5 px-1 font-medium text-muted-foreground">Year</th>
                        {YEARS.map((year) => (
                          <th key={year} className={cn(
                            'text-center py-1.5 px-1 font-medium',
                            chinaSupply[year].isPolicyActive && settings.chinaLoggingPolicy !== 'baseline'
                              ? 'text-success'
                              : 'text-muted-foreground'
                          )}>
                            {year}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="py-2 px-1 text-muted-foreground">Supply (kt)</td>
                        {YEARS.map((year) => {
                          const data = chinaSupply[year]
                          return (
                            <td key={year} className={cn(
                              'text-center py-2 px-1 font-mono font-semibold',
                              data.isPolicyActive && data.delta !== 0
                                ? data.delta > 0 ? 'text-emerald-600' : 'text-amber-600'
                                : 'text-foreground'
                            )}>
                              <div className="flex flex-col items-center">
                                <span>{data.supply}</span>
                                {data.isPolicyActive && data.delta !== 0 && (
                                  <span className={cn(
                                    'text-[10px] flex items-center',
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
              </div>
            </div>

            {/* Vietnam Export Policy */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-chart-2" />
                <span className="text-sm font-medium">Vietnam Export Policy</span>
              </div>
              
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Policy Start Year</Label>
                  <Select
                    value={String(settings.vietnamExportPolicyStartYear)}
                    onValueChange={(value) => onChange({ 
                      ...settings, 
                      vietnamExportPolicyStartYear: Number(value) as PolicyStartYear 
                    })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {YEARS.map((year) => (
                        <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Policy Level</Label>
                  <SegmentedControl
                    value={settings.vietnamExportPolicy}
                    options={['restricted', 'baseline', 'expanded'] as ExportPolicyLevel[]}
                    labels={{ restricted: 'Restricted', baseline: 'Baseline', expanded: 'Expanded' }}
                    onChange={(value) => onChange({ ...settings, vietnamExportPolicy: value })}
                  />
                </div>
              </div>

              {/* Vietnam Supply Output Table */}
              <div className="mt-4 rounded-lg border border-chart-2/30 bg-chart-2/5 p-3">
                <p className="text-xs font-semibold text-chart-2 mb-2">Vietnam Supply to China</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-chart-2/20">
                        <th className="text-left py-1.5 px-1 font-medium text-muted-foreground">Year</th>
                        {YEARS.map((year) => (
                          <th key={year} className={cn(
                            'text-center py-1.5 px-1 font-medium',
                            vietnamSupply[year].isPolicyActive && settings.vietnamExportPolicy !== 'baseline'
                              ? 'text-chart-2'
                              : 'text-muted-foreground'
                          )}>
                            {year}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="py-2 px-1 text-muted-foreground">Supply (kt)</td>
                        {YEARS.map((year) => {
                          const data = vietnamSupply[year]
                          return (
                            <td key={year} className={cn(
                              'text-center py-2 px-1 font-mono font-semibold',
                              data.isPolicyActive && data.delta !== 0
                                ? data.delta > 0 ? 'text-emerald-600' : 'text-amber-600'
                                : 'text-foreground'
                            )}>
                              <div className="flex flex-col items-center">
                                <span>{data.supply}</span>
                                {data.isPolicyActive && data.delta !== 0 && (
                                  <span className={cn(
                                    'text-[10px] flex items-center',
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
              </div>
            </div>
          </div>
          
          {/* Helper text */}
          <p className="text-[10px] text-muted-foreground italic mt-4 border-t border-border/30 pt-3">
            Policy changes take effect from the selected year onward and impact woodchip supply dynamically over time.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
