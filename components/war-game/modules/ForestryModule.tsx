'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { TreePine, Globe, Building2 } from 'lucide-react'
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

type Accent = 'amber' | 'emerald' | 'blue'

const ACCENT_CLASSES: Record<Accent, { selected: string; hover: string }> = {
  amber: {
    selected: 'bg-amber-100 border-amber-300 text-amber-700 shadow-sm',
    hover: 'hover:border-amber-200 hover:bg-amber-50/50',
  },
  emerald: {
    selected: 'bg-emerald-100 border-emerald-300 text-emerald-700 shadow-sm',
    hover: 'hover:border-emerald-200 hover:bg-emerald-50/50',
  },
  blue: {
    selected: 'bg-blue-100 border-blue-300 text-blue-700 shadow-sm',
    hover: 'hover:border-blue-200 hover:bg-blue-50/50',
  },
}

// Choice group styled like Behavior Settings — individual rounded buttons with subtle accent fill on selected
function ChoiceGroup<T extends string>({
  value,
  options,
  labels,
  onChange,
  accent,
}: {
  value: T
  options: T[]
  labels: Record<T, string>
  onChange: (value: T) => void
  accent: Accent
}) {
  const accentClass = ACCENT_CLASSES[accent]
  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={cn(
            'px-3 py-2.5 text-sm font-medium rounded-lg border transition-all',
            value === option
              ? accentClass.selected
              : cn('bg-white border-border/50 text-muted-foreground', accentClass.hover)
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
  return (
    <Card className="h-full border-border/50 bg-card/80">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TreePine className="h-5 w-5 text-success" />
          Forestry & Woodchips
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Section 1: Domestic Demand Driver (China) - Full Width */}
        <div className="rounded-lg border border-border/50 bg-secondary/20 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="h-4 w-4 text-amber-600" />
            <h3 className="font-semibold text-base">Domestic Demand Driver (China)</h3>
          </div>

          <div className="space-y-3">
            <span className="text-base font-medium text-muted-foreground">China Real Estate Market Condition</span>
            <ChoiceGroup
              value={settings.chinaRealEstateCondition}
              options={['downturn', 'stable', 'recovery'] as RealEstateCondition[]}
              labels={{ downturn: 'Downturn', stable: 'Stable', recovery: 'Recovery' }}
              onChange={(value) => onChange({ ...settings, chinaRealEstateCondition: value })}
              accent="amber"
            />
            <p className="text-sm text-muted-foreground italic">
              Applies across all years. Downturn increases wood availability; Recovery reduces it.
            </p>
          </div>
        </div>

        {/* Section 2: Policy Drivers - 2-Column Grid */}
        <div className="grid grid-cols-2 gap-6">
          {/* Left Column: China Logging Policy */}
          <div className="rounded-lg border border-border/50 p-4">
            <div className="flex items-center gap-2 mb-4">
              <TreePine className="h-4 w-4 text-success" />
              <span className="text-base font-semibold text-success">China Logging Policy</span>
            </div>

            <div className="space-y-4">
              {/* Policy Start Year — matches Demand Scenario row layout */}
              <div className="flex items-center justify-between gap-3">
                <span className="text-base font-medium text-muted-foreground flex-shrink-0">Policy Start Year</span>
                <Select
                  value={String(settings.chinaLoggingPolicyStartYear)}
                  onValueChange={(value) => onChange({
                    ...settings,
                    chinaLoggingPolicyStartYear: Number(value) as PolicyStartYear
                  })}
                >
                  <SelectTrigger className="h-10 min-w-32 text-base bg-white border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map((year) => (
                      <SelectItem key={year} value={String(year)} className="text-base">{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <span className="text-base font-medium text-muted-foreground">Policy Level</span>
                <ChoiceGroup
                  value={settings.chinaLoggingPolicy}
                  options={['tight', 'baseline', 'relaxed'] as PolicyLevel[]}
                  labels={{ tight: 'Tight', baseline: 'Baseline', relaxed: 'Relaxed' }}
                  onChange={(value) => onChange({ ...settings, chinaLoggingPolicy: value })}
                  accent="emerald"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Vietnam Export Policy */}
          <div className="rounded-lg border border-border/50 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="h-4 w-4 text-chart-2" />
              <span className="text-base font-semibold text-chart-2">Vietnam Export Policy</span>
            </div>

            <div className="space-y-4">
              {/* Policy Start Year — matches Demand Scenario row layout */}
              <div className="flex items-center justify-between gap-3">
                <span className="text-base font-medium text-muted-foreground flex-shrink-0">Policy Start Year</span>
                <Select
                  value={String(settings.vietnamExportPolicyStartYear)}
                  onValueChange={(value) => onChange({
                    ...settings,
                    vietnamExportPolicyStartYear: Number(value) as PolicyStartYear
                  })}
                >
                  <SelectTrigger className="h-10 min-w-32 text-base bg-white border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map((year) => (
                      <SelectItem key={year} value={String(year)} className="text-base">{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <span className="text-base font-medium text-muted-foreground">Policy Level</span>
                <ChoiceGroup
                  value={settings.vietnamExportPolicy}
                  options={['restricted', 'baseline', 'expanded'] as ExportPolicyLevel[]}
                  labels={{ restricted: 'Restricted', baseline: 'Baseline', expanded: 'Expanded' }}
                  onChange={(value) => onChange({ ...settings, vietnamExportPolicy: value })}
                  accent="blue"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Helper text */}
        <p className="text-sm text-muted-foreground italic border-t border-border/30 pt-3">
          Policy changes take effect from the selected year onward and impact woodchip supply dynamically over time.
        </p>
      </CardContent>
    </Card>
  )
}
