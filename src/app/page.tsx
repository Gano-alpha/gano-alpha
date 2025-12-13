import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  ArrowRight,
  Network,
  Zap,
  Shield,
  TrendingUp,
  Bell,
  BarChart3,
  CheckCircle2,
} from 'lucide-react'

const features = [
  {
    icon: Network,
    title: 'Supply Chain Intelligence',
    description: 'See the hidden connections between companies. When Apple sneezes, know which suppliers catch a cold.',
  },
  {
    icon: Zap,
    title: 'Whisper Alerts',
    description: 'Get notified when suppliers file 8-Ks that affect your holdings—before the market reacts.',
  },
  {
    icon: Shield,
    title: 'Macro Shock Simulator',
    description: '"What if China invades Taiwan?" Simulate geopolitical events and see your portfolio impact instantly.',
  },
  {
    icon: BarChart3,
    title: 'Portfolio X-Ray',
    description: 'Discover hidden concentration risks. You might be 40% exposed to TSMC without knowing it.',
  },
]

const metrics = [
  { value: '2,800+', label: 'Supply Chain Edges' },
  { value: '1,200+', label: 'Companies Mapped' },
  { value: '47', label: 'Alerts Sent (This Week)' },
  { value: '-12%', label: 'Avg Drawdown Avoided' },
]

const testimonials = [
  {
    quote: "Finally, a tool that shows me what I'm actually exposed to. The TSMC concentration warning saved me during the Taiwan tensions.",
    author: 'Michael R.',
    role: 'Portfolio Manager',
  },
  {
    quote: "The whisper alerts are game-changing. I knew about the Skyworks delays before anyone else.",
    author: 'Sarah K.',
    role: 'Retail Investor',
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-canvas">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-teal-500 flex items-center justify-center">
              <span className="text-white font-bold">G</span>
            </div>
            <span className="text-lg font-semibold text-primary">Gano Alpha</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              Supply Chain Intelligence Platform
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold text-primary leading-tight">
              See the connections
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-teal-500">
                Wall Street misses
              </span>
            </h1>
            <p className="mt-6 text-xl text-secondary max-w-2xl">
              AI-powered supply chain intelligence that reveals hidden risks and opportunities
              before they hit the market. Know when Apple&apos;s supplier stumbles—before Apple does.
            </p>
            <div className="mt-8 flex items-center gap-4">
              <Link href="/signup">
                <Button size="xl">
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button variant="outline" size="xl">
                  Watch Demo
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted">
              No credit card required • 14-day free trial
            </p>
          </div>
        </div>
      </section>

      {/* Metrics Bar */}
      <section className="py-12 bg-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {metrics.map((metric) => (
              <div key={metric.label} className="text-center">
                <p className="text-3xl font-bold text-white">{metric.value}</p>
                <p className="text-slate-400 mt-1">{metric.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-primary">
              Your unfair advantage in the market
            </h2>
            <p className="mt-4 text-lg text-secondary max-w-2xl mx-auto">
              Most investors react to news. You&apos;ll see it coming.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-8 rounded-2xl border border-slate-200 bg-surface hover:shadow-elevated transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-primary">{feature.title}</h3>
                <p className="mt-3 text-secondary">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-primary">How Gano Alpha Works</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'We Parse Everything',
                description: '10-Ks, 10-Qs, 8-Ks—we extract every supplier and customer mention from SEC filings in real-time.',
              },
              {
                step: '02',
                title: 'We Build the Graph',
                description: 'Our AI maps the connections between 1,200+ companies, scoring relationship strength and dependency.',
              },
              {
                step: '03',
                title: 'You Get the Edge',
                description: 'Receive alerts when supply chain events affect your holdings. Simulate shocks. Make informed decisions.',
              },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="text-6xl font-bold text-indigo-100 mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold text-primary">{item.title}</h3>
                <p className="mt-3 text-secondary">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, idx) => (
              <div
                key={idx}
                className="p-8 rounded-2xl bg-surface border border-slate-200"
              >
                <p className="text-lg text-primary italic">&quot;{testimonial.quote}&quot;</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-teal-400" />
                  <div>
                    <p className="font-medium text-primary">{testimonial.author}</p>
                    <p className="text-sm text-secondary">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 px-6 bg-slate-900">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white">Simple, transparent pricing</h2>
          <p className="mt-4 text-slate-400 max-w-2xl mx-auto">
            Start with a 14-day free trial. No credit card required.
          </p>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                name: 'Free',
                price: '$0',
                features: ['5 stocks in watchlist', 'Basic supply chain view', 'Daily email digest'],
              },
              {
                name: 'Pro',
                price: '$49',
                period: '/mo',
                features: ['Unlimited watchlist', 'Real-time whisper alerts', 'Portfolio X-Ray', 'Shock simulator'],
                popular: true,
              },
              {
                name: 'Enterprise',
                price: 'Custom',
                features: ['API access', 'Custom integrations', 'Priority support', 'Dedicated account manager'],
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`p-6 rounded-xl ${
                  plan.popular
                    ? 'bg-indigo-600 ring-2 ring-indigo-400'
                    : 'bg-slate-800'
                }`}
              >
                {plan.popular && (
                  <div className="text-xs font-medium text-indigo-200 mb-2">MOST POPULAR</div>
                )}
                <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-white">{plan.price}</span>
                  {plan.period && <span className="text-slate-400">{plan.period}</span>}
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-teal-400" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.popular ? 'secondary' : 'outline'}
                  className="w-full mt-6"
                >
                  {plan.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-primary">
            Ready to see what you&apos;ve been missing?
          </h2>
          <p className="mt-4 text-lg text-secondary">
            Join thousands of investors using supply chain intelligence to make smarter decisions.
          </p>
          <div className="mt-8">
            <Link href="/signup">
              <Button size="xl">
                Start Your Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-teal-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <span className="font-semibold text-primary">Gano Alpha</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-secondary">
            <Link href="/privacy" className="hover:text-primary">Privacy</Link>
            <Link href="/terms" className="hover:text-primary">Terms</Link>
            <Link href="/contact" className="hover:text-primary">Contact</Link>
          </div>
          <p className="text-sm text-muted">
            © 2024 Gano Alpha. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
