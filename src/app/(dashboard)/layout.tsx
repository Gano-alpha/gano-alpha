"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { OnboardingProvider, WelcomeModal, TourStyles, RestartTourButton } from "@/components/onboarding";
import Link from "next/link";
import { User, LogOut, Shield, MessageSquare, LayoutDashboard } from "lucide-react";

const NAV_ITEMS = [
  { href: "/home", label: "Dashboard", icon: LayoutDashboard },
  { href: "/fragility", label: "Fragility", icon: Shield },
  { href: "/chat", label: "Chat", icon: MessageSquare },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, loading, user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

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
        {/* Top Bar with Logo + Nav + Profile */}
        <header className="h-12 border-b border-border bg-surface/50 backdrop-blur-sm flex-shrink-0">
          <div className="h-full px-4 flex items-center justify-between">
            {/* Left: Logo + Nav */}
            <div className="flex items-center gap-6">
              <Link href="/home" className="text-lg font-semibold text-primary tracking-tight">
                GanoAlpha
              </Link>

              {/* Navigation Tabs */}
              <nav className="hidden sm:flex items-center gap-1">
                {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                  const isActive = pathname === href || (href !== '/home' && pathname?.startsWith(href));
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 font-medium'
                          : 'text-muted hover:text-secondary hover:bg-surface'
                      }`}
                    >
                      <Icon size={14} />
                      <span>{label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right: Profile */}
            <div className="flex items-center gap-3">
              <RestartTourButton />
              <div className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-surface transition-colors">
                <User size={14} className="text-muted" />
                <span className="text-xs text-muted hidden md:inline">{user?.email}</span>
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

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </OnboardingProvider>
  );
}
