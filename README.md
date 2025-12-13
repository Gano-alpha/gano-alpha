# Gano Alpha

AI-powered supply chain intelligence for smarter investment decisions.

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000)

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Components**: Custom + Radix UI primitives
- **Charts**: Recharts
- **Graph**: React Flow
- **State**: Zustand + React Query

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth pages (login, signup)
│   ├── (dashboard)/       # Dashboard pages
│   └── page.tsx           # Landing page
├── components/
│   ├── ui/                # Base UI components
│   ├── layout/            # Layout components
│   └── features/          # Feature-specific components
├── lib/                   # Utilities
├── hooks/                 # Custom hooks
├── types/                 # TypeScript types
└── styles/                # Global styles
```

## Deployment

Deploy to Vercel:

```bash
vercel
```
