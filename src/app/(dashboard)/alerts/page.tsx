'use client'

import { useMemo, useState } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Bell, AlertTriangle, Zap, Check, Filter, Search, Clock, FileText, ExternalLink } from 'lucide-react'

type AlertType = 'whisper' | 'signal' | 'exposure'
type Severity = 'high' | 'medium' | 'low'

interface AlertItem {
  id: string
  type: AlertType
  severity: Severity
  title: string
  sourceTicker: string
  affectedTickers?: string[]
  summary: string
  filingType?: string
  filingUrl?: string
  timestamp: string
  read?: boolean
}

const mockAlerts: AlertItem[] = [
  {
    id: '1',
    type: 'whisper',
    severity: 'high',
    title: 'Export control tightening for AI chips',
    sourceTicker: 'NVDA',
    affectedTickers: ['NVDA', 'TSM', 'ASML'],
    summary: 'U.S. reportedly considering tighter export rules on AI accelerators.',
    filingType: 'News',
    filingUrl: '#',
    timestamp: new Date().toISOString(),
    read: false,
  },
  {
    id: '2',
    type: 'signal',
    severity: 'medium',
    title: 'Solvency trend deteriorating',
    sourceTicker: 'QRVO',
    summary: 'Altman Z trending down; CDS proxy elevated.',
    filingType: 'Internal',
    timestamp: new Date(Date.now() - 3600_000).toISOString(),
    read: false,
  },
  {
    id: '3',
    type: 'exposure',
    severity: 'low',
    title: 'Region TW supply stress eased',
    sourceTicker: 'TSM',
    summary: 'Fab utilization stabilizing after prior disruption.',
    filingType: 'Update',
    timestamp: new Date(Date.now() - 24 * 3600_000).toISOString(),
    read: true,
  },
]

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>(mockAlerts)
  const [filter, setFilter] = useState<'All' | AlertType | 'Unread'>('All')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    return alerts.filter((a) => {
      const matchesType = filter === 'All' || (filter === 'Unread' ? !a.read : a.type === filter)
      const matchesSearch =
        !search ||
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.sourceTicker.toLowerCase().includes(search.toLowerCase())
      return matchesType && matchesSearch
    })
  }, [alerts, filter, search])

  const unreadCount = alerts.filter((a) => !a.read).length
  const highCount = alerts.filter((a) => a.severity === 'high').length

  const markRead = (id?: string) => {
    setAlerts((prev) =>
      prev.map((a) => (id ? (a.id === id ? { ...a, read: true } : a) : { ...a, read: true }))
    )
  }

  const severityBadge = (s: Severity) => {
    const tone = s === 'high' ? 'danger' : s === 'medium' ? 'warning' : 'success'
    return <Badge variant={tone}>{s}</Badge>
  }

  const typeBadge = (t: AlertType) => {
    switch (t) {
      case 'whisper':
        return <Badge variant="secondary">Whisper</Badge>
      case 'signal':
        return <Badge variant="outline">Signal</Badge>
      case 'exposure':
        return <Badge variant="secondary">Exposure</Badge>
      default:
        return null
    }
  }

  const timeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <div className="min-h-screen">
      <Header title="Alerts" subtitle="Whispers, signals, and exposure warnings" />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Unread</p>
                  <p className="text-2xl font-semibold text-slate-900">{unreadCount}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">High Priority</p>
                  <p className="text-2xl font-semibold text-rose-600">{highCount}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Whispers</p>
                  <p className="text-2xl font-semibold text-slate-900">{alerts.filter(a => a.type === 'whisper').length}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total</p>
                  <p className="text-2xl font-semibold text-slate-900">{alerts.length}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Filter className="w-5 h-5 text-slate-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4 flex flex-col md:flex-row gap-3 md:items-center">
            <div className="flex items-center gap-2 flex-wrap">
              {['All', 'Unread', 'whisper', 'signal', 'exposure'].map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(f as any)}
                >
                  {f === 'whisper' ? 'Whispers' : f === 'signal' ? 'Signals' : f === 'exposure' ? 'Exposure' : f}
                  {f === 'Unread' && unreadCount > 0 && <Badge className="ml-2" variant="secondary">{unreadCount}</Badge>}
                </Button>
              ))}
            </div>
            <div className="flex-1" />
            <div className="min-w-[240px]">
              <Input
                placeholder="Search title or ticker"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<Search className="w-4 h-4 text-slate-400" />}
              />
            </div>
          </CardContent>
        </Card>

        {/* List */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-slate-500">No alerts match.</CardContent>
            </Card>
          ) : (
            filtered.map((a) => (
              <Card key={a.id} className={cn('border border-slate-200 transition', !a.read && 'border-l-4 border-l-indigo-500')}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className={cn('p-2 rounded-lg border',
                      a.severity === 'high' ? 'border-rose-200 bg-rose-50' :
                      a.severity === 'medium' ? 'border-amber-200 bg-amber-50' :
                      'border-emerald-200 bg-emerald-50'
                    )}>
                      {a.type === 'whisper' ? <Zap className="w-5 h-5 text-amber-600" /> :
                       a.type === 'signal' ? <Bell className="w-5 h-5 text-indigo-600" /> :
                       <AlertTriangle className="w-5 h-5 text-rose-600" />}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={cn('font-semibold', a.read ? 'text-slate-700' : 'text-slate-900')}>{a.title}</h3>
                        {severityBadge(a.severity)}
                        {typeBadge(a.type)}
                        {a.filingType && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <FileText className="w-3 h-3" /> {a.filingType}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-slate-600 flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-indigo-600">{a.sourceTicker}</span>
                        {a.affectedTickers && a.affectedTickers.length > 0 && (
                          <span className="text-slate-500">→ {a.affectedTickers.join(', ')}</span>
                        )}
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {timeAgo(a.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2">{a.summary}</p>
                      {a.filingUrl && (
                        <a href={a.filingUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 inline-flex items-center gap-1">
                          View source <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {!a.read && (
                        <Button variant="outline" size="sm" onClick={() => markRead(a.id)}>
                          <Check className="w-4 h-4 mr-1" /> Mark read
                        </Button>
                      )}
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
