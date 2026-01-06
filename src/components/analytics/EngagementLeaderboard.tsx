'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Trophy, Loader2, Medal, TrendingUp, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getEngagementScores, type EngagementScore } from '@/lib/api';

interface EngagementLeaderboardProps {
  getAccessToken: () => Promise<string | null>;
}

export function EngagementLeaderboard({ getAccessToken }: EngagementLeaderboardProps) {
  const [scores, setScores] = useState<EngagementScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getAccessTokenRef = useRef(getAccessToken);
  getAccessTokenRef.current = getAccessToken;

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getEngagementScores(getAccessTokenRef.current, {
        limit: 50,
        order: 'desc',
      });
      setScores(data);
    } catch (err) {
      console.error('Failed to load engagement scores:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-emerald-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-slate-500';
  };

  const getScoreBg = (score: number): string => {
    if (score >= 90) return 'bg-emerald-100';
    if (score >= 70) return 'bg-blue-100';
    if (score >= 50) return 'bg-amber-100';
    return 'bg-slate-100';
  };

  const maxScore = Math.max(...scores.map(s => s.engagement_score), 100);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 size={32} className="animate-spin text-indigo-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="text-center text-red-600 py-8">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
            <Trophy size={20} className="text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Engagement Leaderboard</h3>
            <p className="text-sm text-slate-500">Top users by engagement score</p>
          </div>
        </div>
        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
          Admin Only
        </span>
      </div>

      {/* Top 3 Podium */}
      {scores.length >= 3 && (
        <div className="flex items-end justify-center gap-4 mb-8">
          {/* 2nd Place */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center mb-2">
              <Medal size={24} className="text-slate-500" />
            </div>
            <p className="text-xs font-medium text-slate-900 truncate max-w-[80px]">
              {scores[1].email.split('@')[0]}
            </p>
            <p className="text-lg font-bold text-slate-600">{scores[1].engagement_score}</p>
            <div className="w-20 h-16 bg-slate-200 rounded-t-lg mt-2" />
          </div>

          {/* 1st Place */}
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mb-2 ring-4 ring-amber-200">
              <Medal size={28} className="text-amber-600" />
            </div>
            <p className="text-sm font-medium text-slate-900 truncate max-w-[100px]">
              {scores[0].email.split('@')[0]}
            </p>
            <p className="text-xl font-bold text-amber-600">{scores[0].engagement_score}</p>
            <div className="w-24 h-24 bg-amber-100 rounded-t-lg mt-2" />
          </div>

          {/* 3rd Place */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-2">
              <Medal size={24} className="text-orange-500" />
            </div>
            <p className="text-xs font-medium text-slate-900 truncate max-w-[80px]">
              {scores[2].email.split('@')[0]}
            </p>
            <p className="text-lg font-bold text-orange-600">{scores[2].engagement_score}</p>
            <div className="w-20 h-12 bg-orange-100 rounded-t-lg mt-2" />
          </div>
        </div>
      )}

      {/* Full List */}
      <div className="max-h-96 overflow-y-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-white">
            <tr className="border-b border-slate-100">
              <th className="text-left text-xs font-medium text-slate-500 uppercase pb-3 w-12">
                Rank
              </th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase pb-3">
                User
              </th>
              <th className="text-right text-xs font-medium text-slate-500 uppercase pb-3 px-4">
                Score
              </th>
              <th className="text-right text-xs font-medium text-slate-500 uppercase pb-3">
                Last Active
              </th>
            </tr>
          </thead>
          <tbody>
            {scores.map((user, index) => (
              <tr
                key={user.user_id}
                className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
              >
                <td className="py-3">
                  <span className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
                    index === 0 ? 'bg-amber-100 text-amber-700' :
                    index === 1 ? 'bg-slate-200 text-slate-600' :
                    index === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-slate-50 text-slate-500'
                  )}>
                    {index + 1}
                  </span>
                </td>
                <td className="py-3">
                  <p className="text-sm font-medium text-slate-900">{user.email}</p>
                  <p className="text-xs text-slate-400">{user.user_id.slice(0, 8)}...</p>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 h-2 bg-slate-100 rounded-full">
                      <div
                        className={cn('h-full rounded-full', getScoreBg(user.engagement_score))}
                        style={{ width: `${(user.engagement_score / maxScore) * 100}%` }}
                      />
                    </div>
                    <span className={cn(
                      'text-sm font-bold min-w-[2rem] text-right',
                      getScoreColor(user.engagement_score)
                    )}>
                      {user.engagement_score}
                    </span>
                  </div>
                </td>
                <td className="py-3 text-right">
                  <span className="text-xs text-slate-500 flex items-center justify-end gap-1">
                    <Clock size={10} />
                    {formatDate(user.last_active_at)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {scores.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          No engagement data available
        </div>
      )}
    </div>
  );
}
