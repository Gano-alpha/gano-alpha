'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Layers, Brain, BarChart3, Database, BookOpen,
  ChevronDown, ChevronRight, ExternalLink, Info
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.gano.ai';

interface MethodologySection {
  slug: string;
  title: string;
  content: string;
  subsections: { title: string; content: string }[];
}

interface DataSource {
  name: string;
  tier: string;
  description: string;
  update_frequency: string;
  reliability: number;
}

interface MethodologyData {
  version: string;
  last_updated: string;
  sections: MethodologySection[];
  data_sources: DataSource[];
  theoretical_framework: {
    name: string;
    description: string;
    key_concepts: string[];
    citations: string[];
  };
}

export default function MethodologyPage() {
  const [data, setData] = useState<MethodologyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));

  useEffect(() => {
    async function fetchMethodology() {
      try {
        const res = await fetch(`${API_BASE}/api/methodology`);
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.error('Failed to fetch methodology:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchMethodology();
  }, []);

  const toggleSection = (slug: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Failed to load methodology documentation.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto py-12">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="h-10 w-10 text-primary" />
            <div>
              <h1 className="text-4xl font-bold tracking-tight">GANO Methodology</h1>
              <p className="text-muted-foreground mt-1">
                How we measure market fragility and generate signals
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-6">
            <Badge variant="outline">Version {data.version}</Badge>
            <span className="text-sm text-muted-foreground">
              Last updated: {new Date(data.last_updated).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Contents</CardTitle>
              </CardHeader>
              <CardContent>
                <nav className="space-y-1">
                  {data.sections.map(section => (
                    <a
                      key={section.slug}
                      href={`#${section.slug}`}
                      className="block px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors"
                    >
                      {section.title}
                    </a>
                  ))}
                  <a
                    href="#data-sources"
                    className="block px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors"
                  >
                    Data Sources
                  </a>
                  <a
                    href="#theoretical-framework"
                    className="block px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors"
                  >
                    Theoretical Framework
                  </a>
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Three-Layer Architecture Overview */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <LayerCard
                    icon={<Database className="h-8 w-8" />}
                    title="Sensing Layer"
                    description="Ingests multi-modal data: SEC filings, news, prices, supply chain graphs"
                    color="bg-blue-100 text-blue-700"
                  />
                  <LayerCard
                    icon={<Brain className="h-8 w-8" />}
                    title="Learning Layer"
                    description="Graph neural networks process relationships and propagate shock signals"
                    color="bg-purple-100 text-purple-700"
                  />
                  <LayerCard
                    icon={<BarChart3 className="h-8 w-8" />}
                    title="Index Layer"
                    description="Aggregates signals into the GANO Fragility Index and ticker-level scores"
                    color="bg-green-100 text-green-700"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Methodology Sections */}
            {data.sections.map(section => (
              <Card key={section.slug} id={section.slug}>
                <CardHeader
                  className="cursor-pointer"
                  onClick={() => toggleSection(section.slug)}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {expandedSections.has(section.slug) ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                      {section.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                {expandedSections.has(section.slug) && (
                  <CardContent>
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <p className="text-muted-foreground">{section.content}</p>
                      {section.subsections.map((sub, idx) => (
                        <div key={idx} className="mt-4">
                          <h4 className="font-medium">{sub.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{sub.content}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}

            {/* Data Sources */}
            <Card id="data-sources">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Data Sources
                </CardTitle>
                <CardDescription>
                  Tiered data infrastructure powering GANO signals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left text-sm text-muted-foreground">
                        <th className="pb-3 font-medium">Source</th>
                        <th className="pb-3 font-medium">Tier</th>
                        <th className="pb-3 font-medium">Update Frequency</th>
                        <th className="pb-3 font-medium">Reliability</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.data_sources.map((source, idx) => (
                        <tr key={idx} className="border-b last:border-0 text-sm">
                          <td className="py-3">
                            <div>
                              <span className="font-medium">{source.name}</span>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {source.description}
                              </p>
                            </div>
                          </td>
                          <td className="py-3">
                            <TierBadge tier={source.tier} />
                          </td>
                          <td className="py-3">{source.update_frequency}</td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-green-500"
                                  style={{ width: `${source.reliability * 100}%` }}
                                />
                              </div>
                              <span className="text-xs">{(source.reliability * 100).toFixed(0)}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Theoretical Framework */}
            <Card id="theoretical-framework">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Theoretical Framework
                </CardTitle>
                <CardDescription>
                  Academic foundations of the GANO methodology
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-lg">{data.theoretical_framework.name}</h4>
                    <p className="text-muted-foreground mt-2">
                      {data.theoretical_framework.description}
                    </p>
                  </div>

                  <div>
                    <h5 className="font-medium mb-2">Key Concepts</h5>
                    <div className="flex flex-wrap gap-2">
                      {data.theoretical_framework.key_concepts.map((concept, idx) => (
                        <Badge key={idx} variant="secondary">{concept}</Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium mb-2">Citations</h5>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {data.theoretical_framework.citations.map((citation, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <ExternalLink className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          {citation}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Disclaimer */}
            <div className="text-xs text-muted-foreground border-t pt-6">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p>
                    This methodology document describes how GANO measures market fragility.
                    It does not constitute investment advice. The GANO Fragility Index and
                    associated signals are informational tools, not recommendations to buy,
                    sell, or hold any security.
                  </p>
                  <p className="mt-2">
                    For questions about our methodology, contact research@gano.ai
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LayerCard({
  icon,
  title,
  description,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <div className={`p-4 rounded-lg ${color}`}>
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <h3 className="font-semibold">{title}</h3>
      </div>
      <p className="text-sm opacity-90">{description}</p>
    </div>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const tierColors: Record<string, string> = {
    'Tier 1': 'bg-purple-100 text-purple-800',
    'Tier 2': 'bg-blue-100 text-blue-800',
    'Tier 3': 'bg-gray-100 text-gray-800',
  };

  return (
    <Badge variant="outline" className={tierColors[tier] || ''}>
      {tier}
    </Badge>
  );
}
