'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Bell,
  BellOff,
  Check,
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
  Loader2,
} from 'lucide-react'

interface Alert {
  id: string
  type: 'whisper' | 'signal' | 'exposure'
  severity: 'high' | 'medium' | 'low'
  title: string
  sourceTicker: string
  sourceName: string
  affectedTickers: string[]
  summary: string
  extractedText: string
  filingType: string
  filingDate: string
  filingUrl: string
  timestamp: string
  read: boolean
}

const alertFilters = ['All', 'Unread', 'Whispers', 'Signals', 'Exposure']

function getRelativeTime(timestamp: string): string {
  const now = new Date()
  const then = new Date(timestamp)
  const diffMs = now.getTime() - then.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return '1d ago'
  if (diffDays < 7) return `${diffDays}d ago`
  return then.toLocaleDateString()
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFilter, setSelectedFilter] = useState('All')
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([])

  useEffect(() => {
    async function fetchAlerts() {
      try {
        const res = await fetch('/api/whispers?limit=20')
        if (res.ok) {
          const data = await res.json()
          // Transform whisper data to alert format
          const transformedAlerts: Alert[] = data.map((w: any) => ({
            id: w.id,
            type: 'whisper',
            severity: w.severity || 'medium',
            title: w.title,
            sourceTicker: w.sourceTicker,
            sourceName: w.sourceName,
            affectedTickers: w.affectedTickers || [],
            summary: w.summary,
            extractedText: w.extractedText || '',
            filingType: w.filingType || '',
            filingDate: w.filingDate || '',
            filingUrl: w.filingUrl || '',
            timestamp: w.timestamp,
            read: w.read || false,
          }))
          setAlerts(transformedAlerts)
        }
      } catch (error) {
        console.error('Error fetching alerts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAlerts()
  }, [])

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

  const toggleSelectAlert = (id: string) => {
    setSelectedAlerts((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    )
  }

  const markAsRead = (ids: string[]) => {
    setAlerts((prev) =>
      prev.map((a) => (ids.includes(a.id) ? { ...a, read: true } : a))
    )
    setSelectedAlerts([])
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
        subtitle="Market whispers and signal changes"
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
                  <p className="text-sm text-secondary">Total Alerts</p>
                  <p className="text-2xl font-semibold text-primary mt-1">{alerts.length}</p>
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
                <Button variant="outline" size="sm" onClick={() => markAsRead(selectedAlerts)}>
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
          {loading ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
                <p className="text-secondary">Loading alerts...</p>
              </CardContent>
            </Card>
          ) : filteredAlerts.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <BellOff className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-primary">No alerts found</h3>
                <p className="text-secondary mt-1">
                  {selectedFilter === 'Unread'
                    ? "You're all caught up!"
                    : 'No alerts match your current filter.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredAlerts.map((alert) => (
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
                              <p className="text-sm text-secondary italic">&quot;{alert.extractedText}&quot;</p>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <span className="text-xs text-muted whitespace-nowrap flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {getRelativeTime(alert.timestamp)}
                          </span>
                          {alert.filingUrl && (
                            <a href={alert.filingUrl} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="sm">
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
