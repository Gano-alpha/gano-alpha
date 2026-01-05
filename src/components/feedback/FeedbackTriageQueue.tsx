'use client';

import { useState } from 'react';
import {
  Bug, Lightbulb, HelpCircle, Database, MessageCircle, Heart,
  ChevronDown, Clock, User, Paperclip, ExternalLink,
  AlertTriangle, CheckCircle2, XCircle, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  type FeedbackItem,
  type FeedbackStatus,
  type FeedbackPriority,
  type FeedbackType,
  updateFeedbackStatus,
} from '@/lib/api';

interface FeedbackTriageQueueProps {
  items: FeedbackItem[];
  getAccessToken: () => Promise<string | null>;
  onItemUpdated?: (item: FeedbackItem) => void;
  isLoading?: boolean;
}

const TYPE_ICONS: Record<FeedbackType, React.ElementType> = {
  bug: Bug,
  feature_request: Lightbulb,
  usability: HelpCircle,
  data_issue: Database,
  general: MessageCircle,
  praise: Heart,
};

const TYPE_LABELS: Record<FeedbackType, string> = {
  bug: 'Bug',
  feature_request: 'Feature',
  usability: 'Usability',
  data_issue: 'Data Issue',
  general: 'General',
  praise: 'Praise',
};

const PRIORITY_COLORS: Record<FeedbackPriority, string> = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low: 'bg-slate-100 text-slate-600 border-slate-200',
  unset: 'bg-slate-50 text-slate-400 border-slate-200',
};

const STATUS_CONFIG: Record<FeedbackStatus, { label: string; color: string; icon: React.ElementType }> = {
  new: { label: 'New', color: 'bg-blue-100 text-blue-700', icon: Clock },
  triaged: { label: 'Triaged', color: 'bg-purple-100 text-purple-700', icon: CheckCircle2 },
  in_progress: { label: 'In Progress', color: 'bg-amber-100 text-amber-700', icon: Loader2 },
  resolved: { label: 'Resolved', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  wont_fix: { label: "Won't Fix", color: 'bg-slate-100 text-slate-600', icon: XCircle },
  duplicate: { label: 'Duplicate', color: 'bg-slate-100 text-slate-600', icon: XCircle },
};

export function FeedbackTriageQueue({
  items,
  getAccessToken,
  onItemUpdated,
  isLoading,
}: FeedbackTriageQueueProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleStatusChange = async (item: FeedbackItem, newStatus: FeedbackStatus) => {
    setUpdatingId(item.feedback_id);
    try {
      const updated = await updateFeedbackStatus(getAccessToken, item.feedback_id, {
        status: newStatus,
      });
      onItemUpdated?.(updated);
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePriorityChange = async (item: FeedbackItem, newPriority: FeedbackPriority) => {
    setUpdatingId(item.feedback_id);
    try {
      const updated = await updateFeedbackStatus(getAccessToken, item.feedback_id, {
        status: item.status,
        priority: newPriority,
      });
      onItemUpdated?.(updated);
    } catch (err) {
      console.error('Failed to update priority:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={32} className="animate-spin text-indigo-600" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <MessageCircle size={48} className="mx-auto mb-4 text-slate-300" />
        <p className="text-lg font-medium">No feedback items</p>
        <p className="text-sm">Feedback submissions will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const TypeIcon = TYPE_ICONS[item.feedback_type] || MessageCircle;
        const StatusConfig = STATUS_CONFIG[item.status];
        const StatusIcon = StatusConfig.icon;
        const isExpanded = expandedId === item.feedback_id;
        const isUpdating = updatingId === item.feedback_id;

        return (
          <div
            key={item.feedback_id}
            className={cn(
              'bg-white border border-slate-200 rounded-lg overflow-hidden transition-shadow',
              isExpanded && 'shadow-md'
            )}
          >
            {/* Header Row */}
            <div
              onClick={() => setExpandedId(isExpanded ? null : item.feedback_id)}
              className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50"
            >
              {/* Type Icon */}
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                item.feedback_type === 'bug' ? 'bg-red-100' :
                item.feedback_type === 'feature_request' ? 'bg-amber-100' :
                item.feedback_type === 'praise' ? 'bg-pink-100' :
                'bg-slate-100'
              )}>
                <TypeIcon size={20} className={cn(
                  item.feedback_type === 'bug' ? 'text-red-600' :
                  item.feedback_type === 'feature_request' ? 'text-amber-600' :
                  item.feedback_type === 'praise' ? 'text-pink-600' :
                  'text-slate-600'
                )} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-slate-400 uppercase">
                    {TYPE_LABELS[item.feedback_type]}
                  </span>
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded-full border',
                    PRIORITY_COLORS[item.priority]
                  )}>
                    {item.priority === 'unset' ? 'Unset' : item.priority}
                  </span>
                  {item.has_attachments && (
                    <Paperclip size={12} className="text-slate-400" />
                  )}
                </div>
                <h4 className="font-medium text-slate-900 truncate">{item.title}</h4>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {formatDate(item.created_at)}
                  </span>
                  {item.email && (
                    <span className="flex items-center gap-1">
                      <User size={12} />
                      {item.email}
                    </span>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              <div className={cn(
                'px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1',
                StatusConfig.color
              )}>
                <StatusIcon size={12} />
                {StatusConfig.label}
              </div>

              {/* Expand Icon */}
              <ChevronDown
                size={20}
                className={cn(
                  'text-slate-400 transition-transform',
                  isExpanded && 'rotate-180'
                )}
              />
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="px-4 pb-4 border-t border-slate-100">
                {/* Description */}
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-slate-700 mb-2">Description</h5>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap bg-slate-50 p-3 rounded-lg">
                    {item.description}
                  </p>
                </div>

                {/* Metadata */}
                {item.page_url && (
                  <div className="mt-3">
                    <h5 className="text-sm font-medium text-slate-700 mb-1">Page URL</h5>
                    <a
                      href={item.page_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      {item.page_url}
                      <ExternalLink size={12} />
                    </a>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
                  {/* Status Dropdown */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Status:</span>
                    <select
                      value={item.status}
                      onChange={(e) => handleStatusChange(item, e.target.value as FeedbackStatus)}
                      disabled={isUpdating}
                      className="text-sm border border-slate-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="new">New</option>
                      <option value="triaged">Triaged</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="wont_fix">Won&apos;t Fix</option>
                      <option value="duplicate">Duplicate</option>
                    </select>
                  </div>

                  {/* Priority Dropdown */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Priority:</span>
                    <select
                      value={item.priority}
                      onChange={(e) => handlePriorityChange(item, e.target.value as FeedbackPriority)}
                      disabled={isUpdating}
                      className="text-sm border border-slate-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="unset">Unset</option>
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>

                  {isUpdating && (
                    <Loader2 size={16} className="animate-spin text-indigo-600" />
                  )}
                </div>

                {/* Attachments indicator */}
                {item.has_attachments && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                    <Paperclip size={14} />
                    {item.attachment_count} attachment{item.attachment_count > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
