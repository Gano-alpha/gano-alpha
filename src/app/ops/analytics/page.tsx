'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3, ArrowLeft, RefreshCw, Loader2, ShieldAlert,
  Users, Grid3X3, Filter, Layers, Trophy
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import {
  ActiveUsersChart,
  RetentionHeatmap,
  ConversionFunnel,
  FeatureUsageTable,
  EngagementLeaderboard,
} from '@/components/analytics';

// Allowed roles for analytics - analyst role and above
const ALLOWED_ROLES = ['analyst', 'admin', 'pm'];
// Admin-only components
const ADMIN_ROLES = ['admin'];

type TabType = 'overview' | 'retention' | 'funnel' | 'features' | 'engagement';

export default function AnalyticsDashboardPage() {
  const { user, isAuthenticated, loading, getAccessToken } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Check role access
  const hasAccess = user && ALLOWED_ROLES.includes(user.role);
  const isAdmin = user && ADMIN_ROLES.includes(user.role);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshKey((k) => k + 1);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <Loader2 size={32} className="animate-spin text-indigo-600 mx-auto" />
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Show access denied for users without proper role
  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4 max-w-md px-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert size={32} className="text-red-600" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Access Denied</h1>
          <p className="text-slate-600">
            You do not have permission to access the Analytics Dashboard.
            This page is restricted to analyst, admin, and PM roles.
          </p>
          <Link
            href="/dashboard"
            className="inline-block px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const tabs: { id: TabType; label: string; icon: React.ElementType; adminOnly?: boolean }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'retention', label: 'Retention', icon: Grid3X3 },
    { id: 'funnel', label: 'Funnel', icon: Filter },
    { id: 'features', label: 'Features', icon: Layers },
    { id: 'engagement', label: 'Engagement', icon: Trophy, adminOnly: true },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-slate-600" />
              </Link>
              <div className="flex items-center gap-2">
                <BarChart3 size={24} className="text-indigo-600" />
                <span className="text-xl font-bold text-slate-900">Product Analytics</span>
              </div>
              {user && (
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                  {user.role}
                </span>
              )}
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <RefreshCw size={16} className={cn(isRefreshing && 'animate-spin')} />
              Refresh
            </button>
          </div>
        </div>
      </nav>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1 -mb-px">
            {tabs.map((tab) => {
              // Hide admin-only tabs from non-admins
              if (tab.adminOnly && !isAdmin) return null;

              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                    activeTab === tab.id
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  )}
                >
                  <Icon size={16} />
                  {tab.label}
                  {tab.adminOnly && (
                    <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                      Admin
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <div key={`overview-${refreshKey}`} className="space-y-6">
            {/* Top Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ActiveUsersChart getAccessToken={getAccessToken} />
              <RetentionHeatmap getAccessToken={getAccessToken} />
            </div>
            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ConversionFunnel getAccessToken={getAccessToken} />
              <FeatureUsageTable getAccessToken={getAccessToken} />
            </div>
          </div>
        )}

        {activeTab === 'retention' && (
          <div key={`retention-${refreshKey}`}>
            <RetentionHeatmap getAccessToken={getAccessToken} />
          </div>
        )}

        {activeTab === 'funnel' && (
          <div key={`funnel-${refreshKey}`}>
            <ConversionFunnel getAccessToken={getAccessToken} />
          </div>
        )}

        {activeTab === 'features' && (
          <div key={`features-${refreshKey}`}>
            <FeatureUsageTable getAccessToken={getAccessToken} />
          </div>
        )}

        {activeTab === 'engagement' && isAdmin && (
          <div key={`engagement-${refreshKey}`}>
            <EngagementLeaderboard getAccessToken={getAccessToken} />
          </div>
        )}
      </div>
    </div>
  );
}
