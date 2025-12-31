import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="px-6 py-4">
        <Link href="/" className="text-xl font-semibold text-primary tracking-tight">
          GanoAlpha
        </Link>
      </header>

      {/* Centered Form */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="bg-surface border border-border rounded-xl p-8 shadow-card">
            {children}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-6 text-center">
        <p className="text-xs text-muted">
          © 2025 GanoAlpha Inc.
        </p>
      </footer>
    </div>
  );
}
