"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { OnboardingProvider, WelcomeModal, TourStyles, RestartTourButton } from "@/components/onboarding";
import Link from "next/link";
import { User, LogOut } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, loading, user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <OnboardingProvider>
      <TourStyles />
      <WelcomeModal />
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        {/* Minimal Top Bar - Logo only, no tabs */}
        <header className="h-12 border-b border-border bg-surface/50 backdrop-blur-sm flex-shrink-0">
          <div className="h-full px-4 flex items-center justify-between">
            {/* Logo */}
            <Link href="/chat" className="text-lg font-semibold text-primary tracking-tight">
              GanoAlpha
            </Link>

            {/* Profile Menu */}
            <div className="flex items-center gap-3">
              <RestartTourButton />
              <div className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-surface transition-colors">
                <User size={14} className="text-muted" />
                <span className="text-xs text-muted">{user?.email}</span>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted hover:text-secondary rounded-lg hover:bg-surface transition-colors"
              >
                <LogOut size={12} />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content - Full height below header */}
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </OnboardingProvider>
  );
}
