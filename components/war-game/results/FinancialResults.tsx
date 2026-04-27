'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { DollarSign, TrendingUp, Building2, Globe } from 'lucide-react'
import { TrafficLight } from '../shared/TrafficLight'
import type { SimulationResult, ProjectIRR, APPSystemPL } from '@/lib/types/war-game'
import { PLAYERS, IRR_HURDLE } from '@/lib/data/initial-data'
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
  Area,
  AreaChart,
  CartesianGrid,
} from 'recharts'

interface FinancialResultsProps {
  result: SimulationResult
}

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
  const data = [
    {
      name: 'China',
      Pulp: systemPL.chinaPulpProfit,
      Downstream: systemPL.chinaDownstreamProfit,
    },
    {
      name: 'Indonesia',
      Pulp: systemPL.indonesiaPulpProfit,
      Downstream: systemPL.indonesiaDownstreamProfit,
    },
  ]

  const totalData = [
    { name: 'China', value: systemPL.chinaProfit, share: systemPL.chinaShare },
    { name: 'Indonesia', value: systemPL.indonesiaProfit, share: 100 - systemPL.chinaShare },
  ]

  return (
    <Card className="border-primary/30 bg-card/80">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
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

        {/* Stacked bar chart */}
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data} margin={{ left: 20, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 11, fill: '#1a1a1a' }}
              axisLine={{ stroke: '#666666' }}
              tickLine={{ stroke: '#666666' }}
            />
            <YAxis 
              tick={{ fontSize: 10, fill: '#1a1a1a' }} 
              axisLine={{ stroke: '#666666' }}
              tickLine={{ stroke: '#666666' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#1a1a1a',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            <Bar dataKey="Pulp" stackId="a" fill="#1d4e89" radius={[0, 0, 0, 0]} name="Pulp" />
            <Bar dataKey="Downstream" stackId="a" fill="#2a9d8f" radius={[4, 4, 0, 0]} name="Downstream" />
          </BarChart>
        </ResponsiveContainer>

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

export function FinancialResults({ result }: FinancialResultsProps) {
  const { playerFinancials, projectIRRs, appSystemPL } = result

  // Prepare EBITDA bar chart data
  const ebitdaData = playerFinancials
    .filter(p => p.ebitda > 0)
    .map(financial => {
      const player = PLAYERS.find(p => p.id === financial.playerId)!
      return {
        name: player.nameCn,
        ebitda: financial.ebitda,
        margin: financial.ebitdaMargin,
        color: player.color,
      }
    })
    .sort((a, b) => b.ebitda - a.ebitda)
    .slice(0, 8)

  return (
    <div className="space-y-4">
      {/* APP Project IRR */}
      {projectIRRs.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Building2 className="h-4 w-4 text-primary" />
            APP Project IRR
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {projectIRRs.map(project => (
              <IRRCard key={project.projectId} project={project} />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Player EBITDA comparison */}
        <Card className="border-border/50 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4" />
              Player EBITDA Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ebitdaData} layout="vertical" margin={{ left: 70 }}>
                <XAxis 
                  type="number" 
                  tick={{ fontSize: 10, fill: '#1a1a1a' }}
                  axisLine={{ stroke: '#666666' }}
                  tickLine={{ stroke: '#666666' }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#1a1a1a' }}
                  width={65}
                  axisLine={{ stroke: '#666666' }}
                  tickLine={{ stroke: '#666666' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#1a1a1a',
                  }}
                  formatter={(value: number, name: string, props: { payload: { margin: number } }) => [
                    `${value} (Margin: ${props.payload.margin}%)`,
                    'EBITDA'
                  ]}
                />
                <Bar dataKey="ebitda" radius={[0, 4, 4, 0]}>
                  {ebitdaData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* APP System P&L */}
        <SystemPLCard systemPL={appSystemPL} />
      </div>

      {/* Player financial details table */}
      <Card className="border-border/50 bg-card/80">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4" />
            Player Financial Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead className="text-xs">Player</TableHead>
                <TableHead className="text-right text-xs">Revenue Index</TableHead>
                <TableHead className="text-right text-xs">EBITDA</TableHead>
                <TableHead className="text-right text-xs">EBITDA Margin</TableHead>
                <TableHead className="text-right text-xs">Pulp Profit</TableHead>
                <TableHead className="text-right text-xs">Downstream Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {playerFinancials.map(financial => {
                const player = PLAYERS.find(p => p.id === financial.playerId)!
                return (
                  <TableRow key={financial.playerId} className="border-border/30">
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: player.color }}
                        />
                        <span>{player.nameCn}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {financial.revenue}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {financial.ebitda}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      <span className={cn(
                        financial.ebitdaMargin >= 20 ? 'text-success' :
                        financial.ebitdaMargin >= 15 ? 'text-warning' : 'text-muted-foreground'
                      )}>
                        {financial.ebitdaMargin}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {financial.pulpProfit}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {financial.downstreamProfit}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
