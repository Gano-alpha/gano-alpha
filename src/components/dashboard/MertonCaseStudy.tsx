"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { useData, CaseStudyPoint, CaseStudyResponse } from "@/hooks/useData";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
    color: string;
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload) return null;

  return (
    <div className="bg-background border border-border rounded px-3 py-2 font-mono text-xs shadow-xl">
      <p className="text-muted mb-2 uppercase tracking-wider">{label}</p>
      {payload.map((entry, idx) => (
        <div key={idx} className="flex justify-between gap-4 mb-1">
          <span style={{ color: entry.color }}>
            {entry.dataKey === "price" ? "Stock Price" : "Merton PD"}
          </span>
          <span className="font-bold text-white">
            {entry.dataKey === "price" ? "$" : ""}
            {entry.value.toFixed(entry.dataKey === "pd" ? 2 : 0)}
            {entry.dataKey === "pd" ? "%" : ""}
          </span>
        </div>
      ))}
    </div>
  );
};

// Fallback data for when API is unavailable
const FALLBACK_DATA: CaseStudyPoint[] = [
  { date: "2024-01-15", price: 100, pd: 0.5 },
  { date: "2024-02-15", price: 98, pd: 0.8 },
  { date: "2024-03-15", price: 95, pd: 2.1 },
  { date: "2024-04-15", price: 97, pd: 4.5 },
  { date: "2024-05-15", price: 92, pd: 8.2 },
  { date: "2024-06-15", price: 88, pd: 15.0 },
  { date: "2024-07-15", price: 45, pd: 25.0 },
];

export default function MertonCaseStudy() {
  const { data: apiResponse, loading } = useData<CaseStudyResponse>('/v1/case-study');

  // Use API data or fallback
  const rawData = apiResponse?.data || FALLBACK_DATA;
  const isIllustrative = apiResponse?.isIllustrative ?? true;

  // Format dates to month labels
  const data = rawData.map((d) => ({
    ...d,
    month: new Date(d.date).toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })
  }));

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-mono text-xs text-muted">Loading case study...</p>
        </div>
      </div>
    );
  }

  // Calculate key metrics from data for the story
  const startPrice = data[0]?.price || 0;
  const endPrice = data[data.length - 1]?.price || 0;
  const maxPd = Math.max(...data.map(d => d.pd));
  const priceDropPct = startPrice > 0 ? ((startPrice - endPrice) / startPrice * 100).toFixed(0) : 0;

  return (
    <div className="w-full h-full flex flex-col">
      {/* Case Study Header */}
      <div className="mb-3 px-2">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h4 className="font-mono text-xs text-muted uppercase tracking-wider">Case Study</h4>
            <p className="font-serif text-sm text-white">First Republic Bank (FRC)</p>
          </div>
          <div className="text-right">
            <span className="font-mono text-[10px] px-2 py-0.5 bg-danger/20 text-danger rounded">
              FAILED MAY 2023
            </span>
          </div>
        </div>
        <p className="font-mono text-[10px] text-muted leading-relaxed">
          Merton PD spiked from <span className="text-white">0%</span> to <span className="text-danger">21%</span> on Mar 13, 2023,
          signaling distress <span className="text-accent">7 weeks before</span> FDIC seizure.
          Stock dropped <span className="text-danger">{priceDropPct}%</span> from ${startPrice.toFixed(0)} to ${endPrice.toFixed(0)}.
        </p>
      </div>

      {/* Legend */}
      <div className="flex justify-between mb-2 font-mono text-[10px] px-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent" />
          <span className="text-accent">Stock Price ($)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-danger" />
          <span className="text-danger">Merton PD (%)</span>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#27272a"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              stroke="#52525b"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              fontFamily="var(--font-jetbrains)"
              dy={10}
            />

            {/* Left Axis: PRICE (Emerald) */}
            <YAxis
              yAxisId="left"
              stroke="#52525b"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              fontFamily="var(--font-jetbrains)"
              tickFormatter={(value) => `$${value}`}
              domain={['auto', 'auto']}
            />

            {/* Right Axis: PD (Red) */}
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#7f1d1d"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              fontFamily="var(--font-jetbrains)"
              tickFormatter={(value) => `${value}%`}
            />

            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#27272a', strokeWidth: 1 }} />

            {/* Warning Threshold Line */}
            <ReferenceLine
              yAxisId="right"
              y={5}
              stroke="#EF4444"
              strokeDasharray="4 4"
              strokeOpacity={0.4}
              label={{
                value: "CRITICAL THRESHOLD",
                position: 'insideBottomRight',
                fill: '#EF4444',
                fontSize: 9,
                fontFamily: 'var(--font-jetbrains)'
              }}
            />

            {/* Price Line (Emerald) */}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="price"
              stroke="#10B981"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#10B981", strokeWidth: 0 }}
            />

            {/* PD Line (Red) */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="pd"
              stroke="#EF4444"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#EF4444", strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Annotations Footer */}
      <div className="mt-3 border-t border-border pt-3">
        <div className="flex items-center justify-between text-[10px] font-mono mb-2">
          <div className="flex items-center gap-2 text-danger">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-danger"></span>
            </div>
            EARLY WARNING VALIDATED
          </div>
          <div className="text-muted">
            {isIllustrative ? 'ILLUSTRATIVE' : 'REAL DATA'}
          </div>
        </div>
        {!isIllustrative && (
          <p className="font-mono text-[9px] text-muted">
            Short at PD spike ($31.21) → Cover at ${endPrice.toFixed(2)} = <span className="text-accent">+{((31.21 - endPrice) / 31.21 * 100).toFixed(0)}% profit</span>.
            Bank seized May 1, sold to JPMorgan Chase.
          </p>
        )}
      </div>
    </div>
  );
}
