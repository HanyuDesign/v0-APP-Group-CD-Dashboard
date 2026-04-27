'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FileText, Package, Bath, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import type { DownstreamSettings, DemandScenario } from '@/lib/types/war-game'
import { POLICY_LABELS } from '@/lib/data/initial-data'

interface DownstreamModuleProps {
  settings: DownstreamSettings
  onChange: (settings: DownstreamSettings) => void
}

const demandOptions: DemandScenario[] = ['low', 'base', 'high']

interface SegmentCardProps {
  title: string
  icon: React.ReactNode
  demandValue: DemandScenario
  onDemandChange: (value: DemandScenario) => void
  outcome?: SegmentOutcome
  description: string
  trend: 'shrinking' | 'growing' | 'stable'
}

function SegmentCard({
  title,
  icon,
  demandValue,
  onDemandChange,
  description,
  trend,
}: Omit<SegmentCardProps, 'outcome'>) {
  return (
    <div className="rounded-lg border border-border/50 bg-card/50 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium">{title}</span>
        </div>
        {trend === 'shrinking' && <TrendingDown className="h-4 w-4 text-destructive" />}
        {trend === 'growing' && <TrendingUp className="h-4 w-4 text-success" />}
        {trend === 'stable' && <Minus className="h-4 w-4 text-muted-foreground" />}
      </div>
      
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      
      <div className="mt-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Demand Scenario</span>
          <Select
            value={demandValue}
            onValueChange={(v) => onDemandChange(v as DemandScenario)}
          >
            <SelectTrigger className="h-7 w-28 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {demandOptions.map(opt => (
                <SelectItem key={opt} value={opt}>
                  {POLICY_LABELS.demandScenario[opt]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

export function DownstreamModule({
  settings,
  onChange,
}: DownstreamModuleProps) {
  return (
    <Card className="h-full border-border/50 bg-card/80">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Package className="h-5 w-5 text-chart-3" />
          Downstream Markets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Paper */}
        <SegmentCard
          title="Paper"
          icon={<FileText className="h-4 w-4 text-muted-foreground" />}
          demandValue={settings.paperDemand}
          onDemandChange={(v) => onChange({ ...settings, paperDemand: v })}
          description="Shrinking market, ongoing closures"
          trend="shrinking"
        />
        
        {/* Packaging / Cartonboard */}
        <SegmentCard
          title="Packaging / Board"
          icon={<Package className="h-4 w-4 text-chart-3" />}
          demandValue={settings.boardDemand}
          onDemandChange={(v) => onChange({ ...settings, boardDemand: v })}
          description="E-commerce driven growth"
          trend="growing"
        />
        
        {/* Tissue */}
        <SegmentCard
          title="Tissue"
          icon={<Bath className="h-4 w-4 text-chart-2" />}
          demandValue={settings.tissueDemand}
          onDemandChange={(v) => onChange({ ...settings, tissueDemand: v })}
          description="Consumer upgrade driven"
          trend="growing"
        />
        
        {/* Note about AI-driven outputs */}
        <div className="rounded-lg bg-secondary/30 p-2 text-xs text-muted-foreground">
          <p>Segment outcomes and competitor responses shown in Results below.</p>
        </div>
      </CardContent>
    </Card>
  )
}
