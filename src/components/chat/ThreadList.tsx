"use client";

import { useState, useMemo } from "react";
import { Plus, MessageSquare, MoreHorizontal, Trash2, Edit2, Search } from "lucide-react";
import { type ThreadChipType } from "@/lib/block-state";

export interface Thread {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  isActive?: boolean;
  chips?: ThreadChipType[];
  confidence?: number; // For optional confidence dot
}

interface ThreadListProps {
  threads: Thread[];
  activeThreadId?: string;
  onSelectThread: (threadId: string) => void;
  onNewThread: () => void;
  onDeleteThread?: (threadId: string) => void;
  onRenameThread?: (threadId: string, newTitle: string) => void;
}

const chipColors: Record<ThreadChipType, string> = {
  macro: "bg-blue-500/10 text-blue-400",
  scenario: "bg-purple-500/10 text-purple-400",
  signals: "bg-teal/10 text-teal",
  risk: "bg-amber-500/10 text-amber-400",
  ticker: "bg-accent/10 text-accent",
};

function getRelativeTime(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getConfidenceColor(confidence?: number): string {
  if (!confidence) return "";
  if (confidence >= 0.7) return "bg-teal";
  if (confidence >= 0.4) return "bg-amber-400";
  return "bg-muted";
}

export function ThreadList({
  threads,
  activeThreadId,
  onSelectThread,
  onNewThread,
  onDeleteThread,
  onRenameThread,
}: ThreadListProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter threads by search
  const filteredThreads = useMemo(() => {
    if (!searchQuery.trim()) return threads;
    const q = searchQuery.toLowerCase();
    return threads.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.lastMessage.toLowerCase().includes(q)
    );
  }, [threads, searchQuery]);

  // Group threads by date
  const groupedThreads = useMemo(() => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    return filteredThreads.reduce((groups, thread) => {
      const threadDate = new Date(thread.timestamp).toDateString();
      let group = "Older";
      if (threadDate === today) group = "Today";
      else if (threadDate === yesterday) group = "Yesterday";
      else if (Date.now() - new Date(thread.timestamp).getTime() < 7 * 86400000)
        group = "Previous 7 days";

      if (!groups[group]) groups[group] = [];
      groups[group].push(thread);
      return groups;
    }, {} as Record<string, Thread[]>);
  }, [filteredThreads]);

  const groupOrder = ["Today", "Yesterday", "Previous 7 days", "Older"];

  return (
    <div className="h-full flex flex-col bg-surface/30">
      {/* Top Bar - Logo wordmark + New button */}
      <div className="p-3 border-b border-border">
        <button
          onClick={onNewThread}
          className="w-full flex items-center gap-2 px-3 py-2.5 bg-surface border border-border rounded-lg text-sm text-secondary hover:text-primary hover:border-muted transition-colors"
        >
          <Plus size={16} />
          <span>New question</span>
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions, tickers, scenarios..."
            className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-xs text-primary placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent/30 focus:border-accent transition-all"
          />
        </div>
      </div>

      {/* Thread List */}
      <div className="flex-1 overflow-y-auto">
        {filteredThreads.length === 0 ? (
          <div className="p-4 text-center">
            <MessageSquare size={24} className="mx-auto text-muted mb-2" />
            <p className="text-sm text-muted">
              {searchQuery ? "No matching conversations" : "No conversations yet"}
            </p>
            {!searchQuery && (
              <p className="text-xs text-muted mt-1">Start by asking a question</p>
            )}
          </div>
        ) : (
          <div className="p-2 space-y-4">
            {groupOrder.map((group) => {
              const groupThreads = groupedThreads[group];
              if (!groupThreads || groupThreads.length === 0) return null;

              return (
                <div key={group}>
                  <p className="px-2 py-1 text-[10px] text-muted uppercase tracking-wider">
                    {group}
                  </p>
                  <div className="space-y-0.5">
                    {groupThreads.map((thread) => (
                      <div
                        key={thread.id}
                        className="relative"
                        onMouseEnter={() => setHoveredId(thread.id)}
                        onMouseLeave={() => {
                          setHoveredId(null);
                          setMenuOpenId(null);
                        }}
                      >
                        <button
                          onClick={() => onSelectThread(thread.id)}
                          className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                            activeThreadId === thread.id
                              ? "bg-accent/10 text-primary"
                              : "text-secondary hover:bg-surface hover:text-primary"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {/* Confidence dot */}
                            {thread.confidence !== undefined && (
                              <div
                                className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${getConfidenceColor(
                                  thread.confidence
                                )}`}
                              />
                            )}

                            <div className="flex-1 min-w-0">
                              {/* Title */}
                              <p className="text-sm truncate pr-12">{thread.title}</p>

                              {/* Chips + Time */}
                              <div className="flex items-center gap-2 mt-1">
                                {thread.chips?.slice(0, 2).map((chip) => (
                                  <span
                                    key={chip}
                                    className={`text-[9px] px-1.5 py-0.5 rounded ${chipColors[chip]}`}
                                  >
                                    {chip}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Time */}
                            <span className="text-[10px] text-muted flex-shrink-0">
                              {getRelativeTime(thread.timestamp)}
                            </span>
                          </div>
                        </button>

                        {/* Hover Actions */}
                        {hoveredId === thread.id && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpenId(menuOpenId === thread.id ? null : thread.id);
                              }}
                              className="p-1 text-muted hover:text-secondary rounded transition-colors"
                            >
                              <MoreHorizontal size={14} />
                            </button>

                            {/* Dropdown Menu */}
                            {menuOpenId === thread.id && (
                              <div className="absolute right-0 top-full mt-1 w-32 bg-surface border border-border rounded-lg shadow-lg py-1 z-50">
                                {onRenameThread && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const newTitle = prompt("Rename thread:", thread.title);
                                      if (newTitle) onRenameThread(thread.id, newTitle);
                                      setMenuOpenId(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-secondary hover:bg-background transition-colors"
                                  >
                                    <Edit2 size={12} />
                                    Rename
                                  </button>
                                )}
                                {onDeleteThread && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteThread(thread.id);
                                      setMenuOpenId(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-background transition-colors"
                                  >
                                    <Trash2 size={12} />
                                    Delete
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
