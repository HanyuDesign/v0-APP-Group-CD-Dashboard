'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ValueChainFlow, MARKET_INPUT_TAB_KEYS, type MarketInputTabKey } from '@/components/war-game/ValueChainFlow'
import { CompetitorConfigModule, initializeCompetitorConfig } from '@/components/war-game/modules/CompetitorConfigModule'
import { ReactionInputModule } from '@/components/war-game/modules/ReactionInputModule'
import { Zap, ArrowRight, ArrowLeft, Play, Check, ChevronRight, Lock } from 'lucide-react'
import { useSimulation } from '@/lib/context/SimulationContext'
import { cn } from '@/lib/utils'
import type { SimulationStep, CompetitorConfig, ReactionSettings } from '@/lib/types/war-game'
import { DEFAULT_REACTION_SETTINGS } from '@/lib/data/initial-data'

const STEPS: { key: SimulationStep; label: string; shortLabel: string; description: string }[] = [
  { 
    key: 'market-input', 
    label: 'Market Input', 
    shortLabel: 'Market',
    description: 'Configure market environment & APP decisions'
  },
  { 
    key: 'competitor-configure', 
    label: 'Competitor Configure', 
    shortLabel: 'Competitors',
    description: 'Set competitor capacity assumptions'
  },
  { 
    key: 'reaction-input', 
    label: 'Reaction', 
    shortLabel: 'Reaction',
    description: 'Review AI-generated market reactions'
  },
  { 
    key: 'results', 
    label: 'Simulation Results', 
    shortLabel: 'Results',
    description: 'View simulation outcomes'
  },
]

export default function InputPage() {
  const router = useRouter()
  const { input, setInput, result, status, runSimulationAsync, reset } = useSimulation()
  const [currentStep, setCurrentStep] = useState<SimulationStep>('market-input')
  const [competitorConfig, setCompetitorConfig] = useState<CompetitorConfig[]>(() => initializeCompetitorConfig())
  const [reactionSettings, setReactionSettings] = useState<ReactionSettings>(
    input.reactionSettings || DEFAULT_REACTION_SETTINGS
  )

  // Track which Market Input sub-tabs the user has visited. The "Next" button
  // is gated until all sub-tabs have been reviewed so users don't accidentally
  // skip sections they need to confirm.
  const [visitedMarketTabs, setVisitedMarketTabs] = useState<Set<MarketInputTabKey>>(
    () => new Set<MarketInputTabKey>()
  )
  // Track which top-level steps the user has visited at least once.
  const [visitedSteps, setVisitedSteps] = useState<Set<SimulationStep>>(
    () => new Set<SimulationStep>(['market-input'])
  )

  const handleMarketTabVisit = (tab: MarketInputTabKey) => {
    setVisitedMarketTabs(prev => {
      if (prev.has(tab)) return prev
      const next = new Set(prev)
      next.add(tab)
      return next
    })
  }

  const allMarketTabsVisited = MARKET_INPUT_TAB_KEYS.every(t => visitedMarketTabs.has(t))
  const competitorStepVisited = visitedSteps.has('competitor-configure')
  const reactionStepVisited = visitedSteps.has('reaction-input')

  // Gate the Next / Run Simulation button per step.
  let nextDisabledReason: string | null = null
  if (currentStep === 'market-input' && !allMarketTabsVisited) {
    const remaining = MARKET_INPUT_TAB_KEYS.filter(t => !visitedMarketTabs.has(t)).length
    nextDisabledReason = `Review all Market Input sections before continuing (${remaining} left).`
  } else if (currentStep === 'competitor-configure' && !competitorStepVisited) {
    nextDisabledReason = 'Review the Competitor Configure step before continuing.'
  } else if (currentStep === 'reaction-input') {
    if (!allMarketTabsVisited) {
      nextDisabledReason = 'Finish reviewing all Market Input sections before running the simulation.'
    } else if (!competitorStepVisited) {
      nextDisabledReason = 'Review the Competitor Configure step before running the simulation.'
    } else if (!reactionStepVisited) {
      nextDisabledReason = 'Review the Reaction step before running the simulation.'
    }
  }
  const isNextDisabled = nextDisabledReason !== null

  const currentStepIndex = STEPS.findIndex(s => s.key === currentStep)

  const markStepVisited = (step: SimulationStep) => {
    setVisitedSteps(prev => {
      if (prev.has(step)) return prev
      const next = new Set(prev)
      next.add(step)
      return next
    })
  }

  const handleNext = () => {
    if (currentStepIndex < STEPS.length - 2) {
      // Move to next step (not results)
      const nextStep = STEPS[currentStepIndex + 1].key
      setCurrentStep(nextStep)
      markStepVisited(nextStep)
    }
  }

  const handleBack = () => {
    if (currentStepIndex > 0) {
      const prevStep = STEPS[currentStepIndex - 1].key
      setCurrentStep(prevStep)
      markStepVisited(prevStep)
    }
  }

  const handleRunSimulation = async () => {
    // Update input with competitor config and reaction settings
    const updatedInput = {
      ...input,
      competitorConfig,
      reactionSettings,
    }
    setInput(updatedInput)
    
    await runSimulationAsync()
    setCurrentStep('results')
    router.push('/results')
  }

  const handleStepClick = (step: SimulationStep) => {
    // Allow navigation to any step except results (unless simulation has run)
    if (step === 'results') {
      if (result) {
        router.push('/results')
      }
      return
    }
    setCurrentStep(step)
    markStepVisited(step)
  }

  const handleCompetitorConfigChange = (config: CompetitorConfig[]) => {
    setCompetitorConfig(config)
    setInput({ ...input, competitorConfig: config })
  }

  const handleReactionSettingsChange = (settings: ReactionSettings) => {
    setReactionSettings(settings)
    setInput({ ...input, reactionSettings: settings })
  }

  const getNextButtonLabel = () => {
    switch (currentStep) {
      case 'market-input':
        return 'Next: Competitor Configure'
      case 'competitor-configure':
        return 'Next: Reaction'
      case 'reaction-input':
        return 'Run Simulation'
      default:
        return 'Next'
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">APP Strategic War-Gaming Tool</h1>
          </div>
        </div>
      </header>

      {/* Navigation tabs - 4 steps */}
      <nav className="border-b border-border/50 bg-background px-6">
        <div className="flex items-center gap-1">
          {STEPS.map((step, index) => {
            const isActive = currentStep === step.key
            const isPast = index < currentStepIndex
            const isResults = step.key === 'results'
            const isDisabled = isResults && !result
            const isLast = index === STEPS.length - 1
            
            return (
              <div key={step.key} className="flex items-center">
                <button
                  onClick={() => handleStepClick(step.key)}
                  disabled={isDisabled}
                  className={cn(
                    'relative px-4 py-2.5 text-sm font-medium border-b-2 transition-all flex items-center gap-2',
                    isActive 
                      ? 'border-primary text-primary' 
                      : isPast
                        ? 'border-transparent text-emerald-600 hover:text-emerald-700'
                        : isDisabled
                          ? 'border-transparent text-muted-foreground/50 cursor-not-allowed'
                          : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  )}
                >
                  {/* Step number / check */}
                  <span className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold',
                    isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : isPast
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-muted text-muted-foreground'
                  )}>
                    {isPast ? <Check className="h-3 w-3" /> : index + 1}
                  </span>
                  <span>{step.label}</span>
                </button>
                {/* Arrow between steps */}
                {!isLast && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50 mx-1" />
                )}
              </div>
            )
          })}
          
          {/* Progress indicator */}
          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <span>Step {currentStepIndex + 1} of {STEPS.length}</span>
            <div className="h-1.5 w-24 rounded-full bg-secondary overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${((currentStepIndex + 1) / STEPS.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 p-6">
        {/* Step 1: Market Input */}
        {currentStep === 'market-input' && (
          <ValueChainFlow
            input={input}
            onInputChange={setInput}
            result={result}
            isRunning={status === 'running'}
            onTabVisit={handleMarketTabVisit}
          />
        )}

        {/* Step 2: Competitor Configure */}
        {currentStep === 'competitor-configure' && (
          <CompetitorConfigModule
            config={competitorConfig}
            onChange={handleCompetitorConfigChange}
            appCapacityAdditions={input.appCapacity.appChina}
          />
        )}

        {/* Step 3: Reaction */}
        {currentStep === 'reaction-input' && (
          <ReactionInputModule
            settings={reactionSettings}
            onChange={handleReactionSettingsChange}
            competitorConfig={competitorConfig}
            marketInput={input}
          />
        )}
      </main>

      {/* Footer with navigation buttons */}
      <footer className="sticky bottom-0 border-t border-border/50 bg-background/95 backdrop-blur px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Simulator Version 1.0</span>
            <span className="h-3 w-px bg-border" />
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span>User Input</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-ai-badge" />
              <span>AI-Driven</span>
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center gap-3">
            {/* Back button */}
            {currentStepIndex > 0 && currentStep !== 'results' && (
              <Button
                variant="outline"
                onClick={handleBack}
              >
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Back
              </Button>
            )}

            {/* Reset button */}
            <Button
              variant="outline"
              onClick={() => {
                reset()
                setCompetitorConfig(initializeCompetitorConfig())
                setReactionSettings(DEFAULT_REACTION_SETTINGS)
                setVisitedMarketTabs(new Set<MarketInputTabKey>())
                setVisitedSteps(new Set<SimulationStep>(['market-input']))
                setCurrentStep('market-input')
              }}
              disabled={status === 'running'}
            >
              Reset All
            </Button>

            {/* Next / Run Simulation button */}
            {currentStep !== 'results' && (
              <TooltipProvider delayDuration={150}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    {/* Wrapper span ensures the tooltip still shows when the button is disabled */}
                    <span tabIndex={0}>
                      <Button
                        onClick={currentStep === 'reaction-input' ? handleRunSimulation : handleNext}
                        disabled={status === 'running' || isNextDisabled}
                        aria-disabled={isNextDisabled || status === 'running'}
                        className={cn(
                          currentStep === 'reaction-input' && !isNextDisabled && 'bg-emerald-600 hover:bg-emerald-700'
                        )}
                      >
                        {status === 'running' ? (
                          <>
                            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Running...
                          </>
                        ) : currentStep === 'reaction-input' ? (
                          <>
                            {isNextDisabled ? (
                              <Lock className="mr-1.5 h-4 w-4" />
                            ) : (
                              <Play className="mr-1.5 h-4 w-4" />
                            )}
                            Run Simulation
                          </>
                        ) : (
                          <>
                            {isNextDisabled && <Lock className="mr-1.5 h-4 w-4" />}
                            {getNextButtonLabel()}
                            {!isNextDisabled && <ArrowRight className="ml-1.5 h-4 w-4" />}
                          </>
                        )}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {nextDisabledReason && (
                    <TooltipContent side="top" align="end" className="max-w-xs">
                      {nextDisabledReason}
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}
