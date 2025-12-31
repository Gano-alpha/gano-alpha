import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "@/styles/globals.css";
import { AuthProvider } from "@/contexts/auth-context";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GANO | Structural Alpha Engine",
  description: "207,000-edge Knowledge Graph for U.S. Equities. We mapped the structure of the economy to predict mean reversion.",
  keywords: ["structural alpha", "supply chain", "knowledge graph", "quant trading", "factor investing", "RGBA model"],
  authors: [{ name: "Gano Alpha" }],
  openGraph: {
    title: "GANO | Structural Alpha Engine",
    description: "207,000-edge Knowledge Graph for U.S. Equities. Price is noise. Structure is signal.",
    url: "https://ganoalpha.com",
    siteName: "Gano Alpha",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetbrains.variable} bg-background text-primary antialiased font-sans selection:bg-accent/20 selection:text-accent`}>
        <AuthProvider>
          <main className="min-h-screen flex flex-col">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
