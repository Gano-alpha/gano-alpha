'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Bell,
  BellOff,
  Filter,
  Check,
  X,
  AlertTriangle,
  ArrowRight,
  Clock,
  FileText,
  TrendingDown,
  TrendingUp,
  Zap,
  Settings,
  Trash2,
  ExternalLink,
} from 'lucide-react'

// Mock alerts data
const alerts = [
  {
    id: 1,
    type: 'whisper',
    severity: 'high' as const,
    title: 'Production Delay Alert',
    sourceTicker: 'SWKS',
    sourceName: 'Skyworks Solutions',
    affectedTickers: ['AAPL', 'QCOM'],
    summary: 'Skyworks filed 8-K mentioning "unexpected production delays in RF component manufacturing" that may impact Q1 deliveries.',
    extractedText: '"...we anticipate unexpected delays in our RF component manufacturing line, which may impact delivery schedules for key customers in Q1 2025..."',
    filingType: '8-K',
    filingDate: '2024-12-12',
    timestamp: '2h ago',
    read: false,
  },
  {
    id: 2,
    type: 'whisper',
    severity: 'medium' as const,
    title: 'Capacity Expansion',
    sourceTicker: 'TSM',
    sourceName: 'Taiwan Semiconductor',
    affectedTickers: ['NVDA', 'AMD', 'AAPL'],
    summary: 'TSMC announced Q4 capacity expansion ahead of schedule in 10-Q filing, potentially benefiting major chip customers.',
    extractedText: '"...our advanced node capacity expansion is progressing ahead of schedule, with new production lines expected to come online in Q4..."',
    filingType: '10-Q',
    filingDate: '2024-12-10',
    timestamp: '1d ago',
    read: false,
  },
  {
    id: 3,
    type: 'signal',
    severity: 'high' as const,
    title: 'Signal Changed: SELL',
    sourceTicker: 'AMD',
    sourceName: 'Advanced Micro Devices',
    affectedTickers: [],
    summary: 'AMD signal changed from HOLD to SELL based on deteriorating supply chain sentiment and increased competition.',
    extractedText: '',
    filingType: '',
    filingDate: '',
    timestamp: '3h ago',
    read: true,
  },
  {
    id: 4,
    type: 'whisper',
    severity: 'low' as const,
    title: 'Demand Surge Indicator',
    sourceTicker: 'MSFT',
    sourceName: 'Microsoft Corporation',
    affectedTickers: ['NVDA'],
    summary: 'Microsoft 8-K mentions "unprecedented demand" for Azure AI services, indicating strong GPU requirements.',
    extractedText: '"...Azure AI services continue to experience unprecedented demand, leading to capacity constraints in certain regions..."',
    filingType: '8-K',
    filingDate: '2024-12-11',
    timestamp: '1d ago',
    read: true,
  },
  {
    id: 5,
    type: 'exposure',
    severity: 'medium' as const,
    title: 'Portfolio Concentration Warning',
    sourceTicker: '',
    sourceName: '',
    affectedTickers: ['NVDA', 'AMD', 'TSM'],
    summary: 'Your portfolio now has 45% indirect exposure to Taiwan Semiconductor manufacturing. Consider diversification.',
    extractedText: '',
    filingType: '',
    filingDate: '',
    timestamp: '2d ago',
    read: true,
  },
]

const alertFilters = ['All', 'Unread', 'Whispers', 'Signals', 'Exposure']

export default function AlertsPage() {
  const [selectedFilter, setSelectedFilter] = useState('All')
  const [selectedAlerts, setSelectedAlerts] = useState<number[]>([])

  const filteredAlerts = alerts.filter((alert) => {
    if (selectedFilter === 'All') return true
    if (selectedFilter === 'Unread') return !alert.read
    if (selectedFilter === 'Whispers') return alert.type === 'whisper'
    if (selectedFilter === 'Signals') return alert.type === 'signal'
    if (selectedFilter === 'Exposure') return alert.type === 'exposure'
    return true
  })

  const unreadCount = alerts.filter((a) => !a.read).length
  const highPriorityCount = alerts.filter((a) => a.severity === 'high' && !a.read).length

  const toggleSelectAlert = (id: number) => {
    setSelectedAlerts((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    )
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-sell bg-sell/10 border-sell/20'
      case 'medium':
        return 'text-warning bg-warning/10 border-warning/20'
      case 'low':
        return 'text-buy bg-buy/10 border-buy/20'
      default:
        return 'text-secondary bg-slate-100 border-slate-200'
    }
  }

  const getAlertIcon = (type: string, severity: string) => {
    switch (type) {
      case 'whisper':
        return <Zap className={`w-5 h-5 ${severity === 'high' ? 'text-sell' : severity === 'medium' ? 'text-warning' : 'text-buy'}`} />
      case 'signal':
        return severity === 'high' ? <TrendingDown className="w-5 h-5 text-sell" /> : <TrendingUp className="w-5 h-5 text-buy" />
      case 'exposure':
        return <AlertTriangle className="w-5 h-5 text-warning" />
      default:
        return <Bell className="w-5 h-5 text-secondary" />
    }
  }

  return (
    <div className="min-h-screen">
      <Header
        title="Alerts"
        subtitle="Supply chain whispers and signal changes"
      />

      <div className="p-6 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary">Unread Alerts</p>
                  <p className="text-2xl font-semibold text-primary mt-1">{unreadCount}</p>
                </div>
                <div className="p-2 rounded-lg bg-indigo-50">
                  <Bell className="w-5 h-5 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary">High Priority</p>
                  <p className="text-2xl font-semibold text-sell mt-1">{highPriorityCount}</p>
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
                  <p className="text-sm text-secondary">Whispers Today</p>
                  <p className="text-2xl font-semibold text-primary mt-1">
                    {alerts.filter((a) => a.type === 'whisper').length}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-warning/10">
                  <Zap className="w-5 h-5 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary">Stocks Monitored</p>
                  <p className="text-2xl font-semibold text-primary mt-1">12</p>
                </div>
                <div className="p-2 rounded-lg bg-teal-50">
                  <Settings className="w-5 h-5 text-teal-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {alertFilters.map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  selectedFilter === filter
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-secondary hover:bg-slate-200'
                }`}
              >
                {filter}
                {filter === 'Unread' && unreadCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-sell text-white rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {selectedAlerts.length > 0 && (
              <>
                <Button variant="outline" size="sm">
                  <Check className="w-4 h-4 mr-1" />
                  Mark Read ({selectedAlerts.length})
                </Button>
                <Button variant="outline" size="sm" className="text-sell hover:text-sell">
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </>
            )}
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-1" />
              Configure
            </Button>
          </div>
        </div>

        {/* Alerts List */}
        <div className="space-y-4">
          {filteredAlerts.map((alert) => (
            <Card
              key={alert.id}
              className={`transition-all ${
                !alert.read ? 'border-l-4 border-l-indigo-500' : ''
              } ${selectedAlerts.includes(alert.id) ? 'ring-2 ring-indigo-500' : ''}`}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleSelectAlert(alert.id)}
                    className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      selectedAlerts.includes(alert.id)
                        ? 'bg-indigo-500 border-indigo-500'
                        : 'border-slate-300 hover:border-indigo-400'
                    }`}
                  >
                    {selectedAlerts.includes(alert.id) && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </button>

                  {/* Icon */}
                  <div className={`p-2 rounded-lg ${getSeverityColor(alert.severity)}`}>
                    {getAlertIcon(alert.type, alert.severity)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className={`font-semibold ${!alert.read ? 'text-primary' : 'text-secondary'}`}>
                            {alert.title}
                          </h3>
                          <Badge
                            variant={
                              alert.severity === 'high' ? 'danger' :
                              alert.severity === 'medium' ? 'warning' : 'success'
                            }
                          >
                            {alert.severity}
                          </Badge>
                          {alert.filingType && (
                            <Badge variant="secondary">
                              <FileText className="w-3 h-3 mr-1" />
                              {alert.filingType}
                            </Badge>
                          )}
                        </div>

                        {alert.sourceTicker && (
                          <div className="flex items-center gap-2 mt-1 text-sm">
                            <span className="font-medium text-indigo-600">{alert.sourceTicker}</span>
                            <span className="text-muted">{alert.sourceName}</span>
                            {alert.affectedTickers.length > 0 && (
                              <>
                                <ArrowRight className="w-3 h-3 text-muted" />
                                <span className="text-secondary">
                                  Affects: {alert.affectedTickers.join(', ')}
                                </span>
                              </>
                            )}
                          </div>
                        )}

                        <p className="text-sm text-secondary mt-2">{alert.summary}</p>

                        {alert.extractedText && (
                          <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <p className="text-xs text-muted mb-1">Extracted from filing:</p>
                            <p className="text-sm text-secondary italic">"{alert.extractedText}"</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <span className="text-xs text-muted whitespace-nowrap flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {alert.timestamp}
                        </span>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredAlerts.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <BellOff className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-primary">No alerts found</h3>
                <p className="text-secondary mt-1">
                  {selectedFilter === 'Unread'
                    ? 'You're all caught up!'
                    : 'No alerts match your current filter.'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
