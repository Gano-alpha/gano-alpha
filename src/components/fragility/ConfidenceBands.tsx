'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Info, HelpCircle } from 'lucide-react';

interface ConfidenceData {
  overall_confidence: number;
  confidence_level: 'high' | 'medium' | 'low' | 'very_low';
  factors: {
    name: string;
    score: number;
    impact: string;
  }[];
  data_freshness: {
    source: string;
    hours_old: number;
    is_stale: boolean;
  }[];
  uncertainty_drivers: string[];
}

interface ConfidenceBandsProps {
  data: ConfidenceData;
  showDetails?: boolean;
}

const CONFIDENCE_CONFIG = {
  high: {
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-500',
    label: 'High Confidence',
    description: 'Data is fresh and model predictions are reliable.',
  },
  medium: {
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-500',
    label: 'Medium Confidence',
    description: 'Some data uncertainty exists. Results are generally reliable.',
  },
  low: {
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    borderColor: 'border-amber-500',
    label: 'Low Confidence',
    description: 'Significant uncertainty detected. Use results directionally.',
  },
  very_low: {
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-500',
    label: 'Very Low Confidence',
    description: 'High uncertainty. Results may not be reliable.',
  },
};

export function ConfidenceBands({ data, showDetails = true }: ConfidenceBandsProps) {
  const config = CONFIDENCE_CONFIG[data.confidence_level] || CONFIDENCE_CONFIG.medium;

  return (
    <Card className={`${config.borderColor} border-l-4`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            Model Confidence
          </CardTitle>
          <Badge className={`${config.bgColor} ${config.color}`}>
            {config.label}
          </Badge>
        </div>
        <CardDescription>{config.description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Overall Confidence Bar */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Overall Confidence</span>
            <span className="font-medium">{(data.overall_confidence * 100).toFixed(0)}%</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                data.overall_confidence >= 0.7
                  ? 'bg-green-500'
                  : data.overall_confidence >= 0.5
                  ? 'bg-blue-500'
                  : data.overall_confidence >= 0.3
                  ? 'bg-amber-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${data.overall_confidence * 100}%` }}
            />
          </div>
        </div>

        {/* Low Confidence Warning */}
        {data.confidence_level === 'low' || data.confidence_level === 'very_low' ? (
          <div className={`flex items-start gap-2 p-3 rounded-md ${config.bgColor}`}>
            <AlertTriangle className={`h-4 w-4 mt-0.5 ${config.color}`} />
            <div className="text-sm">
              <p className={`font-medium ${config.color}`}>Confidence Warning</p>
              <p className="text-muted-foreground mt-1">
                {data.uncertainty_drivers.length > 0
                  ? `Uncertainty factors: ${data.uncertainty_drivers.join(', ')}`
                  : 'Data may be sparse or stale. Interpret results with caution.'}
              </p>
            </div>
          </div>
        ) : null}

        {showDetails && (
          <>
            {/* Contributing Factors */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Contributing Factors</h4>
              {data.factors.map((factor, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{factor.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${factor.score * 100}%` }}
                      />
                    </div>
                    <span className="text-xs w-10 text-right">
                      {(factor.score * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Data Freshness */}
            <div className="space-y-2 pt-2 border-t">
              <h4 className="text-sm font-medium">Data Freshness</h4>
              <div className="grid grid-cols-2 gap-2">
                {data.data_freshness.map((source, idx) => (
                  <div
                    key={idx}
                    className={`text-xs p-2 rounded ${
                      source.is_stale ? 'bg-red-50 text-red-700' : 'bg-muted'
                    }`}
                  >
                    <span className="font-medium">{source.source}</span>
                    <span className="ml-2">
                      {source.hours_old < 1
                        ? 'Just now'
                        : `${source.hours_old.toFixed(0)}h ago`}
                    </span>
                    {source.is_stale && (
                      <Badge variant="destructive" className="ml-2 text-xs">
                        Stale
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Info Footer */}
        <div className="flex items-start gap-2 text-xs text-muted-foreground pt-2 border-t">
          <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <span>
            Confidence reflects data quality and model certainty. Lower confidence
            suggests results should be used directionally, not precisely.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Inline confidence indicator for use within other components
 */
export function ConfidenceIndicator({
  confidence,
  size = 'sm',
}: {
  confidence: number;
  size?: 'sm' | 'md';
}) {
  const level =
    confidence >= 0.7
      ? 'high'
      : confidence >= 0.5
      ? 'medium'
      : confidence >= 0.3
      ? 'low'
      : 'very_low';

  const config = CONFIDENCE_CONFIG[level];
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';

  return (
    <Badge
      variant="outline"
      className={`${config.bgColor} ${config.color} ${sizeClasses}`}
    >
      {(confidence * 100).toFixed(0)}% confidence
    </Badge>
  );
}

/**
 * Confidence tooltip content
 */
export function ConfidenceTooltipContent({ data }: { data: ConfidenceData }) {
  const config = CONFIDENCE_CONFIG[data.confidence_level];

  return (
    <div className="space-y-2 text-sm max-w-xs">
      <div className="flex items-center gap-2">
        <Badge className={`${config.bgColor} ${config.color}`}>
          {config.label}
        </Badge>
        <span className="font-medium">{(data.overall_confidence * 100).toFixed(0)}%</span>
      </div>
      <p className="text-muted-foreground">{config.description}</p>
      {data.uncertainty_drivers.length > 0 && (
        <div>
          <span className="font-medium">Uncertainty drivers:</span>
          <ul className="list-disc list-inside text-xs text-muted-foreground">
            {data.uncertainty_drivers.map((driver, idx) => (
              <li key={idx}>{driver}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default ConfidenceBands;
