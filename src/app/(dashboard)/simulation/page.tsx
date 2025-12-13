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
  TrendingDown,
  TrendingUp,
  Globe,
  Factory,
  Ship,
  Cpu,
  Loader2,
  ChevronRight,
  BarChart3,
  Shield,
  Target,
  History,
  Sparkles,
} from 'lucide-react'

// Predefined scenario templates
const scenarioTemplates = [
  {
    id: 'taiwan',
    title: 'Taiwan Strait Crisis',
    description: 'Major disruption to semiconductor manufacturing',
    icon: Globe,
    severity: 'critical' as const,
    prompt: 'China blockades Taiwan, disrupting TSMC chip production for 6 months',
  },
  {
    id: 'earthquake',
    title: 'Japan Earthquake',
    description: 'Natural disaster affecting key suppliers',
    icon: AlertTriangle,
    severity: 'high' as const,
    prompt: 'Major earthquake hits Japan, disrupting automotive and electronics supply chains',
  },
  {
    id: 'shipping',
    title: 'Suez Canal Blockage',
    description: 'Global shipping route disruption',
    icon: Ship,
    severity: 'medium' as const,
    prompt: 'Suez Canal blocked for 3 weeks, causing global shipping delays',
  },
  {
    id: 'chips',
    title: 'Chip Shortage 2.0',
    description: 'Severe semiconductor supply constraints',
    icon: Cpu,
    severity: 'high' as const,
    prompt: 'Global chip shortage worsens due to increased AI demand and limited fab capacity',
  },
  {
    id: 'energy',
    title: 'Energy Crisis',
    description: 'European energy supply disruption',
    icon: Factory,
    severity: 'medium' as const,
    prompt: 'European natural gas prices spike 300%, forcing factory shutdowns',
  },
]

// Mock simulation results
const mockSimulationResult = {
  summary: {
    totalImpact: -12.4,
    affectedStocks: 8,
    criticalNodes: 3,
    recoveryTime: '6-9 months',
  },
  affectedStocks: [
    {
      ticker: 'NVDA',
      name: 'NVIDIA Corporation',
      impact: -28.5,
      exposure: 'Direct',
      reason: 'Primary GPU supplier dependent on TSMC 4nm process',
      pathLength: 1,
    },
    {
      ticker: 'AMD',
      name: 'Advanced Micro Devices',
      impact: -24.2,
      exposure: 'Direct',
      reason: 'CPU/GPU manufacturing relies on TSMC advanced nodes',
      pathLength: 1,
    },
    {
      ticker: 'AAPL',
      name: 'Apple Inc.',
      impact: -18.7,
      exposure: 'Direct',
      reason: 'A-series and M-series chips manufactured at TSMC',
      pathLength: 1,
    },
    {
      ticker: 'QCOM',
      name: 'Qualcomm',
      impact: -15.3,
      exposure: 'Direct',
      reason: 'Snapdragon SoCs produced at TSMC',
      pathLength: 1,
    },
    {
      ticker: 'MSFT',
      name: 'Microsoft Corporation',
      impact: -8.2,
      exposure: 'Indirect',
      reason: 'Azure hardware procurement affected, Surface supply chain',
      pathLength: 2,
    },
    {
      ticker: 'GOOGL',
      name: 'Alphabet Inc.',
      impact: -6.4,
      exposure: 'Indirect',
      reason: 'TPU production and Pixel device supply chain',
      pathLength: 2,
    },
    {
      ticker: 'AMZN',
      name: 'Amazon.com',
      impact: -4.1,
      exposure: 'Indirect',
      reason: 'AWS Graviton chips and device manufacturing',
      pathLength: 2,
    },
    {
      ticker: 'TSLA',
      name: 'Tesla Inc.',
      impact: -3.8,
      exposure: 'Indirect',
      reason: 'FSD chip production and vehicle electronics',
      pathLength: 2,
    },
  ],
  propagationPaths: [
    { from: 'TSM', to: 'NVDA', strength: 0.95 },
    { from: 'TSM', to: 'AMD', strength: 0.92 },
    { from: 'TSM', to: 'AAPL', strength: 0.88 },
    { from: 'NVDA', to: 'MSFT', strength: 0.75 },
    { from: 'NVDA', to: 'GOOGL', strength: 0.68 },
    { from: 'AAPL', to: 'Consumer Electronics', strength: 0.82 },
  ],
  mitigations: [
    'Consider hedging NVDA/AMD positions with put options',
    'Diversify into Intel (domestic fab capacity)',
    'Add Samsung Electronics as alternative exposure',
    'Monitor GlobalFoundries for capacity shifts',
  ],
}

// Past simulations history
const simulationHistory = [
  {
    id: 1,
    title: 'Taiwan Strait Crisis',
    date: '2024-12-10',
    portfolioImpact: -12.4,
    affectedCount: 8,
  },
  {
    id: 2,
    title: 'Oil Price Spike to $150',
    date: '2024-12-08',
    portfolioImpact: -5.2,
    affectedCount: 12,
  },
  {
    id: 3,
    title: 'Fed Rate Hike to 7%',
    date: '2024-12-05',
    portfolioImpact: -8.7,
    affectedCount: 15,
  },
]

export default function SimulationPage() {
  const [scenarioInput, setScenarioInput] = useState('')
  const [isSimulating, setIsSimulating] = useState(false)
  const [simulationResult, setSimulationResult] = useState<typeof mockSimulationResult | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  const runSimulation = async () => {
    if (!scenarioInput.trim() && !selectedTemplate) return

    setIsSimulating(true)
    setSimulationResult(null)

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 2500))

    setSimulationResult(mockSimulationResult)
    setIsSimulating(false)
  }

  const selectTemplate = (template: typeof scenarioTemplates[0]) => {
    setSelectedTemplate(template.id)
    setScenarioInput(template.prompt)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-sell/10 text-sell border-sell/20'
      case 'high':
        return 'bg-warning/10 text-warning border-warning/20'
      case 'medium':
        return 'bg-indigo-50 text-indigo-600 border-indigo-200'
      default:
        return 'bg-slate-100 text-secondary border-slate-200'
    }
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
                Describe a macro scenario or paste a news URL
              </label>
              <div className="flex gap-3">
                <Input
                  value={scenarioInput}
                  onChange={(e) => {
                    setScenarioInput(e.target.value)
                    setSelectedTemplate(null)
                  }}
                  placeholder="e.g., 'China invades Taiwan' or paste a Reuters article URL..."
                  className="flex-1"
                />
                <Button
                  onClick={runSimulation}
                  disabled={isSimulating || (!scenarioInput.trim() && !selectedTemplate)}
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

            {/* Quick Templates */}
            <div>
              <p className="text-sm text-secondary mb-3">Or choose a scenario template:</p>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {scenarioTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => selectTemplate(template)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      selectedTemplate === template.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-slate-200 hover:border-indigo-300 bg-surface'
                    }`}
                  >
                    <div className={`p-2 rounded-lg w-fit mb-2 ${getSeverityColor(template.severity)}`}>
                      <template.icon className="w-4 h-4" />
                    </div>
                    <p className="font-medium text-sm text-primary">{template.title}</p>
                    <p className="text-xs text-muted mt-0.5">{template.description}</p>
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
                <span>Scanning 1,247 edges</span>
                <span>•</span>
                <span>8 portfolio stocks</span>
                <span>•</span>
                <span>3-hop analysis</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Simulation Results */}
        {simulationResult && !isSimulating && (
          <>
            {/* Impact Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-secondary">Portfolio Impact</p>
                      <p className="text-2xl font-semibold text-sell mt-1">
                        {simulationResult.summary.totalImpact}%
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-sell/10">
                      <TrendingDown className="w-5 h-5 text-sell" />
                    </div>
                  </div>
                </CardContent>
              </Card>

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
                      <p className="text-sm text-secondary">Critical Nodes</p>
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

            {/* Affected Stocks Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-500" />
                  Impact Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-secondary">Stock</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-secondary">Impact</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-secondary">Exposure</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-secondary">Path</th>
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
                          <p className="text-sm font-semibold text-sell">{sim.portfolioImpact}%</p>
                          <p className="text-xs text-muted">impact</p>
                        </div>
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
