import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/styles/globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Gano Alpha | Supply Chain Intelligence',
  description: 'AI-powered supply chain intelligence for smarter investment decisions. See the connections Wall Street misses.',
  keywords: ['supply chain', 'investing', 'stock analysis', 'AI', 'trading signals'],
  authors: [{ name: 'Gano Alpha' }],
  openGraph: {
    title: 'Gano Alpha | Supply Chain Intelligence',
    description: 'AI-powered supply chain intelligence for smarter investment decisions.',
    url: 'https://ganoalpha.com',
    siteName: 'Gano Alpha',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-canvas font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
