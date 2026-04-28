'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ResultsPanel } from '@/components/war-game/results/ResultsPanel'
import { Zap, ArrowLeft, History, Download, Share2, ClipboardList, ChevronDown, ChevronUp, Trees, Factory, Package, FileText, Bath, TrendingUp, TrendingDown } from 'lucide-react'
import type { Year } from '@/lib/types/war-game'
import { useSimulation } from '@/lib/context/SimulationContext'
import { cn } from '@/lib/utils'
import { POLICY_LABELS } from '@/lib/data/initial-data'

export default function ResultsPage() {
  const router = useRouter()
  const { input, result, status, history } = useSimulation()
  const [showOverview, setShowOverview] = useState(false)

  // Redirect to input page if no results
  useEffect(() => {
    if (!result && status !== 'running') {
      router.push('/')
    }
  }, [result, status, router])

  const handleBackToInput = () => {
    router.push('/')
  }

  const handleExportReport = () => {
    if (!result) return
    
    // Generate report data
    const reportData = {
      timestamp: new Date().toISOString(),
      input: input,
      result: result,
    }
    
    // Create and download JSON file
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `app-simulation-report-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleShareReport = async () => {
    if (!result) return
    
    // Create shareable summary text
    const summaryText = `APP Strategic Simulation Results\n\n` +
      `Simulation Date: ${new Date().toLocaleDateString()}`
    
    // Try native share API first, fallback to clipboard
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'APP Strategic Simulation Report',
          text: summaryText,
        })
      } catch {
        // User cancelled or share failed
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(summaryText)
        alert('Report summary copied to clipboard!')
      } catch {
        alert('Unable to share report')
      }
    }
  }

  // Calculate supplies for overview
  const getChinaSupply = () => {
    let base = 800
    if (input.forestry.chinaLoggingPolicy === 'tight') base -= 150
    else if (input.forestry.chinaLoggingPolicy === 'relaxed') base += 150
    if (input.forestry.chinaRealEstateCondition === 'downturn') base -= 100
    else if (input.forestry.chinaRealEstateCondition === 'recovery') base += 100
    return base
  }

  const getVietnamSupply = () => {
    let base = 400
    if (input.forestry.vietnamExportPolicy === 'restricted') base -= 120
    else if (input.forestry.vietnamExportPolicy === 'expanded') base += 120
    return base
  }

  const years = [2026, 2027, 2028, 2029, 2030, 2031] as const

  if (!result && status !== 'running') {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">APP Strategic War-Gaming Tool</h1>
            </div>
            <Badge variant="outline" className="text-xs">
              Simulation Results
            </Badge>
          </div>

          <div className="flex items-center gap-4">
            {/* History */}
            {history.length > 0 && (
              <Badge variant="secondary" className="gap-1">
                <History className="h-3 w-3" />
                {history.length} runs
              </Badge>
            )}

            {/* Control buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowOverview(!showOverview)}
                className="gap-1.5"
              >
                <ClipboardList className="h-4 w-4" />
                Input Overview
                {showOverview ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              <div className="h-6 w-px bg-border" />
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportReport}
                disabled={status === 'running' || !result}
              >
                <Download className="mr-1.5 h-4 w-4" />
                Export Report
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShareReport}
                disabled={status === 'running' || !result}
              >
                <Share2 className="mr-1.5 h-4 w-4" />
                Share Report
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation tabs */}
      <nav className="border-b border-border/50 bg-background px-6">
        <div className="flex gap-1">
          <button
            onClick={handleBackToInput}
            className="px-4 py-2.5 text-sm font-medium border-b-2 border-transparent text-muted-foreground hover:text-foreground hover:border-border flex items-center gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Input Configuration
          </button>
          <button
            className="px-4 py-2.5 text-sm font-medium border-b-2 border-primary text-primary"
          >
            Simulation Results
          </button>
        </div>
      </nav>

      {/* Expandable Overview Panel */}
      {showOverview && (
        <div className="border-b border-border/50 bg-muted/30 px-6 py-4">
          <div className="space-y-4">
            {/* Stage 1: Forestry & Woodchips */}
            <div className="rounded-lg border border-border/50 overflow-hidden">
              <div className="bg-green-50 px-4 py-2 border-b border-border/50 flex items-center gap-2">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-green-600 text-white text-xs font-bold">1</span>
                <Trees className="h-4 w-4 text-green-700" />
                <h3 className="font-semibold text-sm text-green-800">Forestry & Woodchips</h3>
              </div>
              <div className="p-4 bg-white">
                <div className="flex items-center justify-center gap-8">
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">China Supply</div>
                    <div className="text-xl font-bold text-green-700">{getChinaSupply()} kt</div>
                  </div>
                  <div className="h-10 w-px bg-border" />
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">Vietnam Supply</div>
                    <div className="text-xl font-bold text-green-700">{getVietnamSupply()} kt</div>
                  </div>
                  <div className="h-10 w-px bg-border" />
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">Total Woodchip Supply</div>
                    <div className="text-xl font-bold text-green-800">{getChinaSupply() + getVietnamSupply()} kt</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stage 2: Pulp Capacity */}
            <div className="rounded-lg border border-border/50 overflow-hidden">
              <div className="bg-blue-50 px-4 py-2 border-b border-border/50 flex items-center gap-2">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-600 text-white text-xs font-bold">2</span>
                <Factory className="h-4 w-4 text-blue-700" />
                <h3 className="font-semibold text-sm text-blue-800">Pulp Capacity & Players</h3>
              </div>
              <div className="p-4 bg-white">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-2 px-2 font-medium text-muted-foreground">Player</th>
                      {years.map(year => (
                        <th key={year} className="text-center py-2 px-2 font-medium text-muted-foreground">{year}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-red-50 border-2 border-[#cc0000]/30">
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full bg-[#cc0000]" />
                          <span className="font-bold text-[#cc0000]">APP China</span>
                        </div>
                      </td>
                      {years.map(year => (
                        <td key={year} className="text-center py-2 px-2 font-mono font-semibold">
                          {year === 2026 ? (
                            <span className="text-[#cc0000]">{input.appCapacity.appChina[year]}</span>
                          ) : (
                            <span className={cn(
                              input.appCapacity.appChina[year] > 0 ? 'text-green-600' : 'text-muted-foreground'
                            )}>
                              {input.appCapacity.appChina[year] > 0 ? `+${input.appCapacity.appChina[year]}` : input.appCapacity.appChina[year] || '-'}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Stage 3: Downstream Markets */}
            <div className="rounded-lg border border-border/50 overflow-hidden">
              <div className="bg-purple-50 px-4 py-2 border-b border-border/50 flex items-center gap-2">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-purple-600 text-white text-xs font-bold">3</span>
                <Package className="h-4 w-4 text-purple-700" />
                <h3 className="font-semibold text-sm text-purple-800">Downstream Markets</h3>
              </div>
              <div className="p-4 bg-white">
                <div className="grid grid-cols-2 gap-4">
                  {/* Demand */}
                  <div className="rounded-lg border border-orange-200 bg-orange-50/50 p-3">
                    <h4 className="text-sm font-bold text-orange-800 mb-2 flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4" />
                      Demand Scenarios
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                          <FileText className="h-4 w-4" /> Paper
                        </span>
                        <span className={cn(
                          'text-sm font-semibold flex items-center gap-1',
                          input.downstream.paperDemand === 'high' && 'text-green-600',
                          input.downstream.paperDemand === 'low' && 'text-red-600'
                        )}>
                          {input.downstream.paperDemand === 'high' && <TrendingUp className="h-3 w-3" />}
                          {input.downstream.paperDemand === 'low' && <TrendingDown className="h-3 w-3" />}
                          {POLICY_LABELS.demandScenario[input.downstream.paperDemand]}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                          <Package className="h-4 w-4" /> Packaging / Board
                        </span>
                        <span className={cn(
                          'text-sm font-semibold flex items-center gap-1',
                          input.downstream.boardDemand === 'high' && 'text-green-600',
                          input.downstream.boardDemand === 'low' && 'text-red-600'
                        )}>
                          {input.downstream.boardDemand === 'high' && <TrendingUp className="h-3 w-3" />}
                          {input.downstream.boardDemand === 'low' && <TrendingDown className="h-3 w-3" />}
                          {POLICY_LABELS.demandScenario[input.downstream.boardDemand]}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                          <Bath className="h-4 w-4" /> Tissue
                        </span>
                        <span className={cn(
                          'text-sm font-semibold flex items-center gap-1',
                          input.downstream.tissueDemand === 'high' && 'text-green-600',
                          input.downstream.tissueDemand === 'low' && 'text-red-600'
                        )}>
                          {input.downstream.tissueDemand === 'high' && <TrendingUp className="h-3 w-3" />}
                          {input.downstream.tissueDemand === 'low' && <TrendingDown className="h-3 w-3" />}
                          {POLICY_LABELS.demandScenario[input.downstream.tissueDemand]}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Supply Summary */}
                  <div className="rounded-lg border border-red-200 bg-red-50/50 p-3">
                    <h4 className="text-sm font-bold text-red-800 mb-2 flex items-center gap-1.5">
                      <Factory className="h-4 w-4" />
                      APP Supply Additions (2027-2031)
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                          <FileText className="h-4 w-4" /> Paper
                        </span>
                        <span className="text-sm font-mono font-semibold">
                          +{years.slice(1).reduce((sum, y) => sum + (input.downstream.supply.paper.appChina[y] || 0), 0)} kt
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                          <Package className="h-4 w-4" /> Packaging / Board
                        </span>
                        <span className="text-sm font-mono font-semibold">
                          +{years.slice(1).reduce((sum, y) => sum + (input.downstream.supply.board.appChina[y] || 0), 0)} kt
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                          <Bath className="h-4 w-4" /> Tissue
                        </span>
                        <span className="text-sm font-mono font-semibold">
                          +{years.slice(1).reduce((sum, y) => sum + (input.downstream.supply.tissue.appChina[y] || 0), 0)} kt
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-x-auto p-6">
        <ResultsPanel result={result} status={status} />
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-background/95 px-6 py-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>Simulator Version 1.0</span>
            <span className="h-3 w-px bg-border" />
            <span>Data Updated: 2024</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span>User Input</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-ai-badge" />
              <span>AI-Driven</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
