'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ResultsPanel } from '@/components/war-game/results/ResultsPanel'
import { OverviewPanel } from '@/components/war-game/OverviewPanel'
import { Zap, ArrowLeft, History, Download, Share2, ClipboardList, ChevronDown, ChevronUp } from 'lucide-react'
import { useSimulation } from '@/lib/context/SimulationContext'

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
          <OverviewPanel input={input} showHeader={false} />
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
