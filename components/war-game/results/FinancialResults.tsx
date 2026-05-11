'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { Building2, Globe, Users } from 'lucide-react'
import { TrafficLight } from '../shared/TrafficLight'
import { MarketDataTabSwitcher, type MarketDataTab } from './MarketDataTabSwitcher'
import type { SimulationResult, ProjectIRR, APPSystemPL, PlayerFinancialOutcome } from '@/lib/types/war-game'
import { PLAYERS, IRR_HURDLE } from '@/lib/data/initial-data'
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
  CartesianGrid,
} from 'recharts'

interface FinancialResultsProps {
  result: SimulationResult
  activeTab?: MarketDataTab
  onTabChange?: (tab: MarketDataTab) => void
}

type ViewMode = 'combined' | 'pulp' | 'downstream'

// IRR card component with Bain-style colors
function IRRCard({ project }: { project: ProjectIRR }) {
  // Bain-style colors for IRR status
  const statusColors = {
    green: { stroke: '#2e7d32', fill: 'rgba(46, 125, 50, 0.15)', border: 'border-[#2e7d32]/40', text: 'text-[#2e7d32]' },
    amber: { stroke: '#ed6c02', fill: 'rgba(237, 108, 2, 0.15)', border: 'border-[#ed6c02]/40', text: 'text-[#ed6c02]' },
    red: { stroke: '#cc0000', fill: 'rgba(204, 0, 0, 0.15)', border: 'border-[#cc0000]/40', text: 'text-[#cc0000]' },
  }
  const colors = statusColors[project.status]

  return (
    <Card className={cn('bg-card/80', colors.border)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{project.projectName}</p>
            <p className="mt-1 text-2xl font-bold">
              <span className={colors.text}>
                {project.irr}%
              </span>
              <span className="ml-2 text-sm font-normal text-muted-foreground">IRR</span>
            </p>
          </div>
          <TrafficLight 
            status={project.status} 
            label={project.status === 'green' ? 'Above Hurdle' : project.status === 'amber' ? 'Near Hurdle' : 'Below Hurdle'}
          />
        </div>
        
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>Hurdle: {IRR_HURDLE}%</span>
          <span>NPV Index: {project.npvIndex.toFixed(2)}</span>
        </div>
        
        {/* Mini cash flow chart */}
        <div className="mt-3 h-12">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={project.cashFlows.map((value, index) => ({ year: index, value }))}>
              <Area
                type="monotone"
                dataKey="value"
                stroke={colors.stroke}
                fill={colors.fill}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

// APP system P&L component
function SystemPLCard({ systemPL }: { systemPL: APPSystemPL }) {
  const totalData = [
    { name: 'China', value: systemPL.chinaProfit, share: systemPL.chinaShare },
    { name: 'Indonesia', value: systemPL.indonesiaProfit, share: 100 - systemPL.chinaShare },
  ]

  return (
    <Card className="border-primary/30 bg-card/80">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Globe className="h-4 w-4 text-primary" />
          APP System P&L (China + Indonesia)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total profit */}
        <div className="rounded-lg bg-primary/10 p-4 text-center">
          <p className="text-sm text-muted-foreground">Total System Profit Index</p>
          <p className="text-3xl font-bold text-primary">{systemPL.totalProfit}</p>
        </div>

        {/* Profit share */}
        <div className="grid grid-cols-2 gap-3">
          {totalData.map(item => (
            <div key={item.name} className="rounded-lg border border-border/50 bg-card/50 p-3 text-center">
              <p className="text-xs text-muted-foreground">{item.name} Profit</p>
              <p className="text-lg font-semibold">{item.value}</p>
              <p className="text-xs text-muted-foreground">Share {Math.round(item.share)}%</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Define the specific players to show in order
const DISPLAY_PLAYERS_PL = ['sun-paper', 'chenming', 'liansheng', 'others-china', 'app-china']

// Player-level P&L component with toggle
function PlayerPLSection({ playerFinancials }: { playerFinancials: PlayerFinancialOutcome[] }) {
  const [viewMode, setViewMode] = useState<ViewMode>('combined')

  // Prepare data based on view mode - filter to specific players only
  const getChartData = () => {
    return DISPLAY_PLAYERS_PL
      .map(playerId => {
        const financial = playerFinancials.find(p => p.playerId === playerId)
        if (!financial) return null
        
        const player = PLAYERS.find(p => p.id === playerId)!
        let value = 0
        if (viewMode === 'combined') value = financial.ebitda
        else if (viewMode === 'pulp') value = financial.pulpProfit
        else value = financial.downstreamProfit

        // Calculate capacity index (total capacity normalized)
        const totalCapacity = player.pulpCapacity + player.boardCapacity + player.tissueCapacity
        const capacityIndex = Math.round(totalCapacity / 10) // Simplified index

        return {
          playerId,
          name: player.nameCn,
          value,
          revenue: financial.revenue,
          ebitda: financial.ebitda,
          margin: financial.ebitdaMargin,
          pulpProfit: financial.pulpProfit,
          downstreamProfit: financial.downstreamProfit,
          capacityIndex,
          color: player.color,
        }
      })
      .filter(Boolean) as Array<{
        playerId: string
        name: string
        value: number
        revenue: number
        ebitda: number
        margin: number
        pulpProfit: number
        downstreamProfit: number
        capacityIndex: number
        color: string
      }>
  }

  const chartData = getChartData()

  const getValueLabel = () => {
    if (viewMode === 'combined') return 'EBITDA'
    if (viewMode === 'pulp') return 'Pulp Profit'
    return 'Downstream Profit'
  }

  return (
    <Card className="border-border/50 bg-card/80">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-4 w-4 text-primary" />
            Player-Level P&L
          </CardTitle>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <TabsList className="h-7">
              <TabsTrigger value="combined" className="text-xs px-2 py-1">Combined</TabsTrigger>
              <TabsTrigger value="pulp" className="text-xs px-2 py-1">Pulp Only</TabsTrigger>
              <TabsTrigger value="downstream" className="text-xs px-2 py-1">Downstream</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {/* Detailed metrics table */}
        <Table className="text-base">
          <TableHeader>
            <TableRow className="border-border/50">
              <TableHead className="text-base">Player</TableHead>
              <TableHead className="text-right text-base">Revenue Index</TableHead>
              <TableHead className="text-right text-base">EBITDA</TableHead>
              <TableHead className="text-right text-base">EBITDA Margin</TableHead>
              <TableHead className="text-right text-base">Capacity Index</TableHead>
              {viewMode !== 'combined' && (
                <TableHead className="text-right text-base">
                  {viewMode === 'pulp' ? 'Pulp Profit' : 'Downstream Profit'}
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {chartData.map(item => {
              const isAppChina = item.playerId === 'app-china'
              return (
                <TableRow 
                  key={item.name} 
                  className={cn(
                    'border-border/30',
                    isAppChina && 'bg-[#cc0000]/5 border-l-2 border-l-[#cc0000]'
                  )}
                >
                  <TableCell className="text-base py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className={cn('font-medium', isAppChina && 'text-[#cc0000]')}>{item.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className={cn('text-right font-mono text-base py-3', isAppChina && 'font-semibold')}>
                    {item.revenue}
                  </TableCell>
                  <TableCell className={cn('text-right font-mono text-base font-semibold py-3', isAppChina && 'text-[#cc0000]')}>
                    {item.ebitda}
                  </TableCell>
                  <TableCell className="text-right font-mono text-base py-3">
                    <span className={cn(
                      item.margin >= 20 ? 'text-[#2e7d32]' :
                      item.margin >= 15 ? 'text-[#ed6c02]' : 'text-muted-foreground',
                      isAppChina && 'font-semibold'
                    )}>
                      {item.margin}%
                    </span>
                  </TableCell>
                  <TableCell className={cn('text-right font-mono text-base py-3', isAppChina && 'font-semibold')}>
                    {item.capacityIndex}
                  </TableCell>
                  {viewMode !== 'combined' && (
                    <TableCell className={cn('text-right font-mono text-base font-semibold py-3', isAppChina && 'text-[#cc0000]')}>
                      {viewMode === 'pulp' ? item.pulpProfit : item.downstreamProfit}
                    </TableCell>
                  )}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export function FinancialResults({ result, activeTab, onTabChange }: FinancialResultsProps) {
  const { playerFinancials, projectIRRs, appSystemPL } = result

  return (
    <div className="space-y-4">
      {/* APP Project IRR – wrapped in a Card so the Market/Financial tab
          switcher can live next to the section title, mirroring the
          Player Market Data card on the Market Performance tab. */}
      {projectIRRs.length > 0 && (
        <Card className="border-border/50 bg-card/80">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-4 w-4 text-primary" />
                APP Project IRR
              </CardTitle>
              {activeTab && onTabChange && (
                <MarketDataTabSwitcher activeTab={activeTab} onTabChange={onTabChange} />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {projectIRRs.map(project => (
                <IRRCard key={project.projectId} project={project} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* APP System P&L */}
      <SystemPLCard systemPL={appSystemPL} />

      {/* Player-Level P&L with toggle */}
      <PlayerPLSection playerFinancials={playerFinancials} />
    </div>
  )
}
