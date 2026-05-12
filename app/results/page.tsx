'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { ResultsPanel } from '@/components/war-game/results/ResultsPanel'
import { OverviewPanel } from '@/components/war-game/OverviewPanel'
import { Zap, History, Download, Share2, ClipboardList, ChevronDown, ChevronUp, ChevronRight, Bug, Check, RotateCcw } from 'lucide-react'
import { useSimulation } from '@/lib/context/SimulationContext'
import { computeAllFromInput } from '@/lib/simulation/computations'

export default function ResultsPage() {
  const router = useRouter()
  const { input, result, status, history, reset } = useSimulation()
  const [showOverview, setShowOverview] = useState(false)
  const [showDebug, setShowDebug] = useState(false)

  // Redirect to input page if no results
  useEffect(() => {
    if (!result && status !== 'running') {
      router.push('/')
    }
  }, [result, status, router])

  // Reset the entire simulation and send the user back to step 1. This is the
  // *only* sanctioned way to leave the results page and return to inputs, so
  // the step tabs themselves are intentionally non-interactive below.
  const handleResetSimulation = () => {
    reset()
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
      {/* Sticky Header + Navigation Container */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {/* Header */}
        <header className="border-b border-border/50">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">APP Strategic War-Gaming Tool</h1>
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
                <div className="h-6 w-px bg-border" />
                {/* Reset simulation — returns user to step 1 with fresh inputs */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={status === 'running'}
                      className="border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                    >
                      <RotateCcw className="mr-1.5 h-4 w-4" />
                      Reset Simulation
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reset simulation?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will clear the current results and return you to step 1 (Market
                        Input) with all configuration reset to defaults. This action cannot be
                        undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleResetSimulation}
                        className="bg-amber-600 hover:bg-amber-700"
                      >
                        Yes, reset
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <div className="h-6 w-px bg-border" />
                <Button
                  variant={showDebug ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setShowDebug(!showDebug)}
                  className="gap-1.5"
                >
                  <Bug className="h-4 w-4" />
                  Debug
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation tabs - 4 steps */}
        <nav className="border-b border-border/50 bg-background px-6" aria-label="Simulation steps">
        <div className="flex items-center gap-1">
          {/* Step indicators are non-interactive on the Results page. Users must
              use the "Reset Simulation" button in the header to start over. */}
          {/* Step 1: Market Input */}
          <div className="flex items-center">
            <div
              aria-disabled="true"
              className="px-4 py-3 text-base font-medium border-b-2 border-transparent text-emerald-600 flex items-center gap-2 cursor-default select-none"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full text-sm font-semibold bg-emerald-100 text-emerald-600">
                <Check className="h-3.5 w-3.5" />
              </span>
              Market Input
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/50 mx-1" />
          </div>

          {/* Step 2: Competitor Configure */}
          <div className="flex items-center">
            <div
              aria-disabled="true"
              className="px-4 py-3 text-base font-medium border-b-2 border-transparent text-emerald-600 flex items-center gap-2 cursor-default select-none"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full text-sm font-semibold bg-emerald-100 text-emerald-600">
                <Check className="h-3.5 w-3.5" />
              </span>
              Competitor Configure
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/50 mx-1" />
          </div>

          {/* Step 3: Reaction */}
          <div className="flex items-center">
            <div
              aria-disabled="true"
              className="px-4 py-3 text-base font-medium border-b-2 border-transparent text-emerald-600 flex items-center gap-2 cursor-default select-none"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full text-sm font-semibold bg-emerald-100 text-emerald-600">
                <Check className="h-3.5 w-3.5" />
              </span>
              Reaction
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/50 mx-1" />
          </div>

          {/* Step 4: Simulation Results - Active (also non-interactive) */}
          <div
            aria-current="step"
            className="px-4 py-3 text-base font-medium border-b-2 border-primary text-primary flex items-center gap-2 cursor-default select-none"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full text-sm font-semibold bg-primary text-primary-foreground">
              4
            </span>
            Simulation Results
          </div>

          {/* Progress indicator */}
          <div className="ml-auto flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <span>Step <span className="text-foreground">4</span> of 4</span>
            <div className="h-2 w-32 rounded-full bg-secondary overflow-hidden">
              <div className="h-full bg-primary w-full" />
            </div>
          </div>
        </div>
        </nav>
      </div>

      {/* Expandable Overview Panel */}
      {showOverview && (
        <div className="border-b border-border/50 bg-muted/30 px-6 py-4">
          <OverviewPanel input={result?.input || input} showHeader={false} />
        </div>
      )}

      {/* Debug Panel - Shows current state and computed values */}
      {showDebug && result && (
        <div className="border-b border-border/50 bg-amber-50 px-6 py-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Bug className="h-5 w-5 text-amber-600" />
              <h3 className="font-semibold text-amber-800">Debug: State & Computed Values</h3>
              <Badge variant="outline" className="bg-amber-100 text-amber-700">Development Only</Badge>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-sm">
              {/* Forestry Settings */}
              <div className="rounded-lg border border-amber-200 bg-white p-3">
                <h4 className="font-semibold text-amber-700 mb-2">Forestry Settings (from result.input)</h4>
                <pre className="text-xs bg-amber-50 p-2 rounded overflow-auto max-h-32">
                  {JSON.stringify(result.input.forestry, null, 2)}
                </pre>
              </div>
              
              {/* Pulp Capacity */}
              <div className="rounded-lg border border-amber-200 bg-white p-3">
                <h4 className="font-semibold text-amber-700 mb-2">APP Capacity (from result.input)</h4>
                <pre className="text-xs bg-amber-50 p-2 rounded overflow-auto max-h-32">
                  {JSON.stringify(result.input.appCapacity.appChina, null, 2)}
                </pre>
              </div>
              
              {/* Computed Values */}
              <div className="rounded-lg border border-amber-200 bg-white p-3">
                <h4 className="font-semibold text-amber-700 mb-2">Computed Woodchip Supply</h4>
                <pre className="text-xs bg-amber-50 p-2 rounded overflow-auto max-h-32">
                  {JSON.stringify(computeAllFromInput(result.input).woodchipSupply.map(y => ({
                    year: y.year,
                    china: y.chinaSupply,
                    vietnam: y.vietnamSupply,
                    total: y.totalSupply
                  })), null, 2)}
                </pre>
              </div>
            </div>
            
            <p className="text-xs text-amber-600">
              This debug panel verifies that the Simulation Results page reads data from the shared state (result.input) 
              and computes derived values correctly. All displayed values should match your input configuration.
            </p>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 p-6">
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
