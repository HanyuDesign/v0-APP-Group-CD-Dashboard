'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Factory, Package } from 'lucide-react'
import type { APPCapacitySettings, PlayerCapacityChange } from '@/lib/types/war-game'
import { PLAYERS, CAPACITY_RANGE, YEAR_OPTIONS } from '@/lib/data/initial-data'
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface PulpModuleProps {
  settings: APPCapacitySettings
  onChange: (settings: APPCapacitySettings) => void
  competitorChanges?: PlayerCapacityChange[]
}

export function PulpModule({ settings, onChange, competitorChanges }: PulpModuleProps) {
  // Get APP players first, then China-based competitors and exporters
  const appPlayers = PLAYERS.filter(p => p.type === 'app')
  const otherPlayers = PLAYERS.filter(p => 
    p.type !== 'app' && (p.region === 'china' || p.type === 'exporter')
  )
  const allPlayers = [...appPlayers, ...otherPlayers]
  
  // Prepare capacity data for chart - APP at top
  const capacityData = allPlayers.map(player => {
    const change = competitorChanges?.find(c => c.playerId === player.id)
    let capacity = player.pulpCapacity
    let capacityChange = 0
    
    if (player.id === 'app-china') {
      capacityChange = settings.guangxi.pulpCapacity + settings.jiangsuFujian.pulpCapacity
      capacity += capacityChange
    } else if (change) {
      capacityChange = change.pulpChange
      capacity += capacityChange
    }
    
    return {
      name: player.nameCn,
      capacity,
      isAPP: player.type === 'app',
      isAIDriven: player.isAIDriven,
      color: player.color,
      change: capacityChange,
    }
  })

  const updateGuangxi = (updates: Partial<typeof settings.guangxi>) => {
    onChange({ ...settings, guangxi: { ...settings.guangxi, ...updates } })
  }

  const updateJiangsuFujian = (updates: Partial<typeof settings.jiangsuFujian>) => {
    onChange({ ...settings, jiangsuFujian: { ...settings.jiangsuFujian, ...updates } })
  }

  return (
    <Card className="h-full border-border/50 bg-card/80">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Factory className="h-5 w-5 text-primary" />
          Pulp Capacity & Players
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Capacity chart */}
        <div className="rounded-lg bg-secondary/30 p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Capacity Distribution (kt/year)</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={capacityData} layout="vertical" margin={{ left: 5, right: 10, top: 5, bottom: 5 }}>
              <XAxis 
                type="number" 
                tick={{ fontSize: 10, fill: '#000000' }} 
                axisLine={{ stroke: '#333333' }}
                tickLine={{ stroke: '#333333' }}
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                tick={{ fontSize: 10, fill: '#000000' }}
                width={90}
                axisLine={{ stroke: '#333333' }}
                tickLine={{ stroke: '#333333' }}
                interval={0}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  fontSize: '12px',
                  color: '#1a1a1a',
                }}
                labelStyle={{
                  color: '#1a1a1a',
                  fontWeight: 500,
                }}
                itemStyle={{
                  color: '#1a1a1a',
                }}
                formatter={(value: number, name: string, props: { payload: { change: number } }) => {
                  const change = props.payload.change
                  return [
                    `${value} kt${change ? ` (${change > 0 ? '+' : ''}${change})` : ''}`,
                    'Capacity'
                  ]
                }}
              />
              <Bar dataKey="capacity" radius={[0, 4, 4, 0]}>
                {capacityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* APP new capacity decisions */}
        <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            <span className="font-semibold text-primary">APP Capacity Decisions</span>
          </div>
          
          {/* Guangxi project */}
          <div className="space-y-3 rounded-lg bg-card/50 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Guangxi Project</span>
              <Select
                value={settings.guangxi.startYear.toString()}
                onValueChange={(v) => updateGuangxi({ startYear: parseInt(v) })}
              >
                <SelectTrigger className="h-7 w-20 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEAR_OPTIONS.map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <Label>Pulp Capacity</Label>
                <span className="font-mono text-primary">{settings.guangxi.pulpCapacity} kt</span>
              </div>
              <Slider
                value={[settings.guangxi.pulpCapacity]}
                onValueChange={([v]) => updateGuangxi({ pulpCapacity: v })}
                min={CAPACITY_RANGE.pulp.min}
                max={CAPACITY_RANGE.pulp.max}
                step={CAPACITY_RANGE.pulp.step}
              />
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="guangxi-board"
                  checked={settings.guangxi.includeBoard}
                  onCheckedChange={(v) => updateGuangxi({ includeBoard: v })}
                />
                <Label htmlFor="guangxi-board" className="text-xs">Board</Label>
                {settings.guangxi.includeBoard && (
                  <span className="text-xs text-muted-foreground">
                    {settings.guangxi.boardCapacity}kt
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="guangxi-tissue"
                  checked={settings.guangxi.includeTissue}
                  onCheckedChange={(v) => updateGuangxi({ includeTissue: v })}
                />
                <Label htmlFor="guangxi-tissue" className="text-xs">Tissue</Label>
                {settings.guangxi.includeTissue && (
                  <span className="text-xs text-muted-foreground">
                    {settings.guangxi.tissueCapacity}kt
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Jiangsu/Fujian project */}
          <div className="mt-3 space-y-3 rounded-lg bg-card/50 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Jiangsu/Fujian Project</span>
              <Select
                value={settings.jiangsuFujian.startYear.toString()}
                onValueChange={(v) => updateJiangsuFujian({ startYear: parseInt(v) })}
              >
                <SelectTrigger className="h-7 w-20 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEAR_OPTIONS.map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <Label>Pulp Capacity</Label>
                <span className="font-mono text-primary">{settings.jiangsuFujian.pulpCapacity} kt</span>
              </div>
              <Slider
                value={[settings.jiangsuFujian.pulpCapacity]}
                onValueChange={([v]) => updateJiangsuFujian({ pulpCapacity: v })}
                min={CAPACITY_RANGE.pulp.min}
                max={CAPACITY_RANGE.pulp.max}
                step={CAPACITY_RANGE.pulp.step}
              />
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="jf-board"
                  checked={settings.jiangsuFujian.includeBoard}
                  onCheckedChange={(v) => updateJiangsuFujian({ includeBoard: v })}
                />
                <Label htmlFor="jf-board" className="text-xs">Board</Label>
                {settings.jiangsuFujian.includeBoard && (
                  <span className="text-xs text-muted-foreground">
                    {settings.jiangsuFujian.boardCapacity}kt
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="jf-tissue"
                  checked={settings.jiangsuFujian.includeTissue}
                  onCheckedChange={(v) => updateJiangsuFujian({ includeTissue: v })}
                />
                <Label htmlFor="jf-tissue" className="text-xs">Tissue</Label>
                {settings.jiangsuFujian.includeTissue && (
                  <span className="text-xs text-muted-foreground">
                    {settings.jiangsuFujian.tissueCapacity}kt
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Note about AI-driven competitors */}
        <div className="rounded-lg bg-secondary/30 p-2 text-xs text-muted-foreground">
          <p>Competitor capacity decisions are simulated by AI and shown in Results below.</p>
        </div>
      </CardContent>
    </Card>
  )
}
