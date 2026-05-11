'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
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
            'flex-1 px-3 py-2 text-sm font-medium transition-all',
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
            <Label className="text-sm text-muted-foreground">China Real Estate Market Condition</Label>
            <SegmentedControl
              value={settings.chinaRealEstateCondition}
              options={['downturn', 'stable', 'recovery'] as RealEstateCondition[]}
              labels={{ downturn: 'Downturn', stable: 'Stable', recovery: 'Recovery' }}
              onChange={(value) => onChange({ ...settings, chinaRealEstateCondition: value })}
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
            
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Policy Start Year</Label>
                <Select
                  value={String(settings.chinaLoggingPolicyStartYear)}
                  onValueChange={(value) => onChange({ 
                    ...settings, 
                    chinaLoggingPolicyStartYear: Number(value) as PolicyStartYear 
                  })}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map((year) => (
                      <SelectItem key={year} value={String(year)} className="text-sm">{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Policy Level</Label>
                <SegmentedControl
                  value={settings.chinaLoggingPolicy}
                  options={['tight', 'baseline', 'relaxed'] as PolicyLevel[]}
                  labels={{ tight: 'Tight', baseline: 'Baseline', relaxed: 'Relaxed' }}
                  onChange={(value) => onChange({ ...settings, chinaLoggingPolicy: value })}
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
            
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Policy Start Year</Label>
                <Select
                  value={String(settings.vietnamExportPolicyStartYear)}
                  onValueChange={(value) => onChange({ 
                    ...settings, 
                    vietnamExportPolicyStartYear: Number(value) as PolicyStartYear 
                  })}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map((year) => (
                      <SelectItem key={year} value={String(year)} className="text-sm">{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Policy Level</Label>
                <SegmentedControl
                  value={settings.vietnamExportPolicy}
                  options={['restricted', 'baseline', 'expanded'] as ExportPolicyLevel[]}
                  labels={{ restricted: 'Restricted', baseline: 'Baseline', expanded: 'Expanded' }}
                  onChange={(value) => onChange({ ...settings, vietnamExportPolicy: value })}
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
