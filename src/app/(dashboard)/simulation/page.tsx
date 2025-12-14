'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Zap,
  Play,
  AlertTriangle,
  Loader2,
  ChevronRight,
  BarChart3,
  Shield,
  Target,
  History,
  Sparkles,
  TrendingUp,
} from 'lucide-react'

interface AffectedStock {
  ticker: string
  name: string
  impact: number
  exposure: 'Direct' | 'Indirect'
  reason: string
  pathLength: number
}

interface SimulationResult {
  summary: {
    totalImpact: number
    affectedStocks: number
    criticalNodes: number
    recoveryTime: string
  }
  affectedStocks: AffectedStock[]
  propagationPaths: {
    from: string
    to: string
    strength: number
  }[]
  mitigations: string[]
}

// Example scenario prompts to help users understand the format
const examplePrompts = [
  'TSM supply chain disruption due to Taiwan crisis',
  'NVDA and AMD affected by semiconductor shortage',
  'AAPL production delays from supplier issues',
]

// Past simulations storage key
const SIMULATION_HISTORY_KEY = 'gano_simulation_history'

interface SimulationHistoryItem {
  id: string
  title: string
  date: string
  portfolioImpact: number
  affectedCount: number
}

const mockPreview: SimulationResult = {
  summary: {
    totalImpact: -6.4,
    affectedStocks: 12,
    criticalNodes: 3,
    recoveryTime: '8-12 weeks',
  },
  affectedStocks: [
    { ticker: 'TSM', name: 'Taiwan Semi', impact: -12.5, exposure: 'Direct', reason: 'Fab outage', pathLength: 0 },
    { ticker: 'NVDA', name: 'Nvidia', impact: -8.1, exposure: 'Indirect', reason: 'GPU supply constraints', pathLength: 1 },
    { ticker: 'AMD', name: 'AMD', impact: -6.3, exposure: 'Indirect', reason: 'Shared supplier', pathLength: 1 },
  ],
  propagationPaths: [
    { from: 'TSM', to: 'NVDA', strength: 0.82 },
    { from: 'TSM', to: 'AMD', strength: 0.76 },
  ],
  mitigations: [
    'Rotate to alternate fabs with spare capacity',
    'Trim hub exposure >0.7 centrality',
  ],
}

export default function SimulationPage() {
  const [scenarioInput, setScenarioInput] = useState('')
  const [isSimulating, setIsSimulating] = useState(false)
  // Show a meaningful preview even before the first run
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(mockPreview)
  const [simulationHistory, setSimulationHistory] = useState<SimulationHistoryItem[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(SIMULATION_HISTORY_KEY)
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch {
          return []
        }
      }
    }
    return []
  })

  const runSimulation = async () => {
    if (!scenarioInput.trim()) return

    setIsSimulating(true)
    setSimulationResult(null)

    try {
      const response = await fetch('/api/simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: scenarioInput,
        }),
      })

      if (response.ok) {
        const result: SimulationResult = await response.json()
        setSimulationResult(result)

        // Save to history
        const historyItem: SimulationHistoryItem = {
          id: Date.now().toString(),
          title: scenarioInput.slice(0, 50) + (scenarioInput.length > 50 ? '...' : ''),
          date: new Date().toISOString().split('T')[0],
          portfolioImpact: result.summary.totalImpact,
          affectedCount: result.summary.affectedStocks,
        }
        const newHistory = [historyItem, ...simulationHistory].slice(0, 10)
        setSimulationHistory(newHistory)
        localStorage.setItem(SIMULATION_HISTORY_KEY, JSON.stringify(newHistory))
      }
    } catch (error) {
      console.error('Simulation error:', error)
    } finally {
      setIsSimulating(false)
    }
  }

  const loadHistoryItem = (item: SimulationHistoryItem) => {
    setScenarioInput(item.title)
  }

  const handleExamplePrompt = (prompt: string) => {
    setScenarioInput(prompt)
  }

  return (
    <div className="min-h-screen">
      <Header
        title="War Room"
        subtitle="Simulate macro shocks and stress-test your portfolio"
      />

      <div className="p-6 space-y-6">
        {/* Scenario Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              Scenario Builder
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-primary mb-2 block">
                Describe a scenario with ticker symbols (e.g., NVDA, TSM, AAPL)
              </label>
              <div className="flex gap-3">
                <Input
                  value={scenarioInput}
                  onChange={(e) => setScenarioInput(e.target.value)}
                  placeholder="e.g., 'TSM supply chain disruption affecting NVDA and AMD'"
                  className="flex-1"
                />
                <Button
                  onClick={runSimulation}
                  disabled={isSimulating || !scenarioInput.trim()}
                >
                  {isSimulating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Simulating...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Run Simulation
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Example prompts */}
            <div>
              <p className="text-sm text-secondary mb-2">Try an example:</p>
              <div className="flex flex-wrap gap-2">
                {examplePrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handleExamplePrompt(prompt)}
                    className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 text-secondary rounded-full transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Simulation Running State */}
        {isSimulating && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="relative mx-auto w-16 h-16 mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
                <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
                <Zap className="absolute inset-0 m-auto w-6 h-6 text-indigo-500" />
              </div>
              <h3 className="text-lg font-semibold text-primary">Analyzing Shock Propagation</h3>
              <p className="text-secondary mt-1">
                Mapping supply chain dependencies and calculating portfolio impact...
              </p>
              <div className="flex justify-center gap-6 mt-6 text-sm text-muted">
                <span>Scanning supply chains</span>
                <span>•</span>
                <span>Analyzing impacts</span>
                <span>•</span>
                <span>Generating mitigations</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Simulation Results */}
        {simulationResult && !isSimulating && (
          <>
            {/* Impact Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-secondary">Affected Stocks</p>
                      <p className="text-2xl font-semibold text-primary mt-1">
                        {simulationResult.summary.affectedStocks}
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-warning/10">
                      <Target className="w-5 h-5 text-warning" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-secondary">Directly Impacted</p>
                      <p className="text-2xl font-semibold text-sell mt-1">
                        {simulationResult.summary.criticalNodes}
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-sell/10">
                      <AlertTriangle className="w-5 h-5 text-sell" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-secondary">Est. Recovery</p>
                      <p className="text-2xl font-semibold text-primary mt-1">
                        {simulationResult.summary.recoveryTime}
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-buy/10">
                      <TrendingUp className="w-5 h-5 text-buy" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Why this matters */}
            <Card>
              <CardContent className="p-4 bg-slate-50 border-slate-200">
                <p className="text-sm font-semibold text-primary mb-1">Why this matters</p>
                <p className="text-sm text-secondary">
                  {simulationResult.summary.affectedStocks} stocks at risk • {simulationResult.summary.criticalNodes} critical hubs • Expected recovery {simulationResult.summary.recoveryTime}
                </p>
              </CardContent>
            </Card>

            {/* Affected Stocks Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-500" />
                  Supply Chain Impact Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-secondary">Stock</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-secondary">Est. Price Impact</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-secondary">Exposure Type</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-secondary">Supply Chain Distance</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-secondary">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {simulationResult.affectedStocks.map((stock) => (
                        <tr key={stock.ticker} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-semibold text-primary">{stock.ticker}</p>
                              <p className="text-xs text-muted">{stock.name}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-sell">{stock.impact}%</span>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={stock.exposure === 'Direct' ? 'danger' : 'warning'}>
                              {stock.exposure}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-secondary">
                              {stock.pathLength} hop{stock.pathLength > 1 ? 's' : ''}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <p className="text-sm text-secondary max-w-xs">{stock.reason}</p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Mitigations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-buy" />
                  Recommended Mitigations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {simulationResult.mitigations.map((mitigation, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-buy/5 rounded-lg border border-buy/20"
                    >
                      <ChevronRight className="w-4 h-4 text-buy mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-primary">{mitigation}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Past Simulations */}
        {!simulationResult && !isSimulating && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-secondary" />
                Recent Simulations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {simulationHistory.length > 0 ? (
                <div className="space-y-3">
                  {simulationHistory.map((sim) => (
                    <div
                      key={sim.id}
                      onClick={() => loadHistoryItem(sim)}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-indigo-50">
                          <Zap className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-medium text-primary">{sim.title}</p>
                          <p className="text-xs text-muted">{sim.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm font-semibold text-primary">{sim.affectedCount}</p>
                          <p className="text-xs text-muted">stocks</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Zap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-primary">No simulations yet</h3>
                  <p className="text-secondary mt-1">
                    Run your first scenario to see how macro events affect your portfolio.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
