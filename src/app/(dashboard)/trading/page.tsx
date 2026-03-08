"use client";

import { useEffect, useState } from "react";

// --- Types ---

interface DealSignal {
  ticker: string;
  earnings_date: string | null;
  market_cap_b: number | null;
  iv30: number;
  iv_expected_move: number;
  hist_avg_move: number;
  iv_hist_ratio: number;
  signal: string;
  confidence: string;
  expected_win_rate: number;
  n_historical: number;
}

interface Position {
  ticker: string;
  qty: number;
  avg_entry: number;
  current_price: number;
  market_value: number;
  unrealized_pl: number;
  unrealized_pl_pct: number;
  side: string;
}

interface Portfolio {
  equity: number;
  cash: number;
  buying_power: number;
  portfolio_value: number;
  total_unrealized_pl: number;
  positions: Position[];
  is_paper: boolean;
}

interface TradeRecord {
  id: number;
  trade_date: string;
  ticker: string;
  action: string;
  quantity: number;
  price: number;
  confidence: number | null;
  status: string;
  exit_date: string | null;
  exit_price: number | null;
  pnl: number | null;
  pnl_pct: number | null;
}

interface PerformanceStats {
  total_trades: number;
  open_trades: number;
  closed_trades: number;
  wins: number;
  losses: number;
  win_rate: number | null;
  total_pnl: number;
  avg_pnl_pct: number | null;
  best_trade_pnl: number | null;
  worst_trade_pnl: number | null;
  avg_hold_days: number | null;
}

interface BacktestResult {
  signal: string;
  n_trades: number;
  wins: number;
  win_rate: number;
  avg_profit_pct: number;
}

// --- Component ---

export default function TradingPage() {
  const [tab, setTab] = useState<"deals" | "portfolio" | "history">("deals");
  const [deals, setDeals] = useState<DealSignal[]>([]);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [performance, setPerformance] = useState<PerformanceStats | null>(null);
  const [backtest, setBacktest] = useState<BacktestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    setError(null);
    try {
      const [dealsRes, portfolioRes, tradesRes, perfRes, btRes] = await Promise.allSettled([
        fetch("/backend/api/deals/scan?days_ahead=14"),
        fetch("/backend/api/trading/portfolio"),
        fetch("/backend/api/trading/trades?limit=50"),
        fetch("/backend/api/trading/performance"),
        fetch("/backend/api/deals/backtest"),
      ]);

      if (dealsRes.status === "fulfilled" && dealsRes.value.ok)
        setDeals(await dealsRes.value.json());
      if (portfolioRes.status === "fulfilled" && portfolioRes.value.ok)
        setPortfolio(await portfolioRes.value.json());
      if (tradesRes.status === "fulfilled" && tradesRes.value.ok)
        setTrades(await tradesRes.value.json());
      if (perfRes.status === "fulfilled" && perfRes.value.ok)
        setPerformance(await perfRes.value.json());
      if (btRes.status === "fulfilled" && btRes.value.ok)
        setBacktest(await btRes.value.json());
    } catch (e) {
      setError("Failed to load trading data");
    } finally {
      setLoading(false);
    }
  }

  const sellDeals = deals.filter((d) => d.signal === "SELL");
  const buyDeals = deals.filter((d) => d.signal === "BUY");

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-primary">Trading</h1>
          <p className="text-sm text-muted mt-1">
            Options deal scanner + Alpaca auto-trader portfolio
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {(["deals", "portfolio", "history"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === t
                  ? "border-indigo-500 text-indigo-700"
                  : "border-transparent text-muted hover:text-secondary"
              }`}
            >
              {t === "deals" ? "Deal Scanner" : t === "portfolio" ? "Portfolio" : "Trade History"}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {tab === "deals" && (
          <DealsTab sellDeals={sellDeals} buyDeals={buyDeals} backtest={backtest} />
        )}
        {tab === "portfolio" && (
          <PortfolioTab portfolio={portfolio} performance={performance} />
        )}
        {tab === "history" && <HistoryTab trades={trades} />}
      </div>
    </div>
  );
}

// --- Deals Tab ---

function DealsTab({
  sellDeals,
  buyDeals,
  backtest,
}: {
  sellDeals: DealSignal[];
  buyDeals: DealSignal[];
  backtest: BacktestResult[];
}) {
  return (
    <div className="space-y-6">
      {/* Backtest stats */}
      {backtest.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {backtest.map((b) => (
            <div
              key={b.signal}
              className="bg-surface border border-border rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded ${
                    b.signal === "SELL"
                      ? "bg-red-100 text-red-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {b.signal} Premium
                </span>
                <span className="text-xs text-muted">
                  {b.n_trades} trades (2020-2025)
                </span>
              </div>
              <div className="flex items-baseline gap-4">
                <div>
                  <p className="text-2xl font-bold text-primary">
                    {b.win_rate}%
                  </p>
                  <p className="text-xs text-muted">Win Rate</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-primary">
                    {b.avg_profit_pct > 0 ? "+" : ""}
                    {b.avg_profit_pct}%
                  </p>
                  <p className="text-xs text-muted">Avg Profit</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SELL signals */}
      <SignalTable
        title="SELL Signals (IV Overpriced)"
        subtitle="Strategy: Sell straddle/strangle before earnings"
        deals={sellDeals}
        color="red"
      />

      {/* BUY signals */}
      <SignalTable
        title="BUY Signals (IV Underpriced)"
        subtitle="Strategy: Buy straddle/strangle before earnings"
        deals={buyDeals}
        color="emerald"
      />

      {sellDeals.length === 0 && buyDeals.length === 0 && (
        <div className="text-center py-12 text-muted">
          <p className="text-lg">No upcoming earnings deals found</p>
          <p className="text-sm mt-1">
            Check back when earnings season approaches
          </p>
        </div>
      )}
    </div>
  );
}

function SignalTable({
  title,
  subtitle,
  deals,
  color,
}: {
  title: string;
  subtitle: string;
  deals: DealSignal[];
  color: "red" | "emerald";
}) {
  if (deals.length === 0) return null;

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="font-semibold text-primary">{title}</h3>
        <p className="text-xs text-muted">{subtitle}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-background text-muted text-xs uppercase">
              <th className="px-4 py-2 text-left">Ticker</th>
              <th className="px-4 py-2 text-left">Earnings</th>
              <th className="px-4 py-2 text-right">IV30</th>
              <th className="px-4 py-2 text-right">IV Move</th>
              <th className="px-4 py-2 text-right">Hist Move</th>
              <th className="px-4 py-2 text-right">Ratio</th>
              <th className="px-4 py-2 text-right">Win Rate</th>
              <th className="px-4 py-2 text-center">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {deals.map((d) => (
              <tr
                key={d.ticker + d.earnings_date}
                className="border-t border-border hover:bg-background/50"
              >
                <td className="px-4 py-2 font-medium text-primary">
                  {d.ticker}
                </td>
                <td className="px-4 py-2 text-muted">{d.earnings_date}</td>
                <td className="px-4 py-2 text-right">{d.iv30}%</td>
                <td className="px-4 py-2 text-right">{d.iv_expected_move}%</td>
                <td className="px-4 py-2 text-right">{d.hist_avg_move}%</td>
                <td className="px-4 py-2 text-right font-semibold">
                  <span
                    className={
                      color === "red" ? "text-red-600" : "text-emerald-600"
                    }
                  >
                    {d.iv_hist_ratio}x
                  </span>
                </td>
                <td className="px-4 py-2 text-right">
                  ~{d.expected_win_rate}%
                </td>
                <td className="px-4 py-2 text-center">
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      d.confidence === "HIGH"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {d.confidence}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- Portfolio Tab ---

function PortfolioTab({
  portfolio,
  performance,
}: {
  portfolio: Portfolio | null;
  performance: PerformanceStats | null;
}) {
  if (!portfolio) {
    return (
      <div className="text-center py-12 text-muted">
        <p className="text-lg">Could not connect to Alpaca</p>
        <p className="text-sm mt-1">Check API credentials on the server</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Account summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Portfolio Value"
          value={`$${portfolio.portfolio_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
        />
        <StatCard
          label="Cash"
          value={`$${portfolio.cash.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
        />
        <StatCard
          label="Unrealized P&L"
          value={`${portfolio.total_unrealized_pl >= 0 ? "+" : ""}$${portfolio.total_unrealized_pl.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          color={portfolio.total_unrealized_pl >= 0 ? "emerald" : "red"}
        />
        <StatCard
          label="Buying Power"
          value={`$${portfolio.buying_power.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
        />
      </div>

      {portfolio.is_paper && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-lg text-xs">
          Paper Trading Account — No real money at risk
        </div>
      )}

      {/* Performance stats */}
      {performance && performance.total_trades > 0 && (
        <div className="bg-surface border border-border rounded-lg p-4">
          <h3 className="font-semibold text-primary mb-3">
            Trading Performance
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-sm">
            <div>
              <p className="text-muted text-xs">Total Trades</p>
              <p className="font-semibold text-primary">
                {performance.total_trades}
              </p>
            </div>
            <div>
              <p className="text-muted text-xs">Win Rate</p>
              <p className="font-semibold text-primary">
                {performance.win_rate != null
                  ? `${performance.win_rate}%`
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-muted text-xs">Total P&L</p>
              <p
                className={`font-semibold ${performance.total_pnl >= 0 ? "text-emerald-600" : "text-red-600"}`}
              >
                {performance.total_pnl >= 0 ? "+" : ""}$
                {performance.total_pnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-muted text-xs">Avg P&L %</p>
              <p className="font-semibold text-primary">
                {performance.avg_pnl_pct != null
                  ? `${performance.avg_pnl_pct > 0 ? "+" : ""}${performance.avg_pnl_pct}%`
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-muted text-xs">Avg Hold</p>
              <p className="font-semibold text-primary">
                {performance.avg_hold_days != null
                  ? `${performance.avg_hold_days} days`
                  : "—"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Positions */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-primary">
            Open Positions ({portfolio.positions.length})
          </h3>
        </div>
        {portfolio.positions.length === 0 ? (
          <div className="px-4 py-8 text-center text-muted text-sm">
            No open positions
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-background text-muted text-xs uppercase">
                  <th className="px-4 py-2 text-left">Ticker</th>
                  <th className="px-4 py-2 text-right">Qty</th>
                  <th className="px-4 py-2 text-right">Avg Entry</th>
                  <th className="px-4 py-2 text-right">Current</th>
                  <th className="px-4 py-2 text-right">Mkt Value</th>
                  <th className="px-4 py-2 text-right">P&L</th>
                  <th className="px-4 py-2 text-right">P&L %</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.positions.map((p) => (
                  <tr
                    key={p.ticker}
                    className="border-t border-border hover:bg-background/50"
                  >
                    <td className="px-4 py-2 font-medium text-primary">
                      {p.ticker}
                    </td>
                    <td className="px-4 py-2 text-right">{p.qty}</td>
                    <td className="px-4 py-2 text-right">
                      ${p.avg_entry.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      ${p.current_price.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      ${p.market_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td
                      className={`px-4 py-2 text-right font-medium ${p.unrealized_pl >= 0 ? "text-emerald-600" : "text-red-600"}`}
                    >
                      {p.unrealized_pl >= 0 ? "+" : ""}$
                      {p.unrealized_pl.toFixed(2)}
                    </td>
                    <td
                      className={`px-4 py-2 text-right font-medium ${p.unrealized_pl_pct >= 0 ? "text-emerald-600" : "text-red-600"}`}
                    >
                      {p.unrealized_pl_pct >= 0 ? "+" : ""}
                      {p.unrealized_pl_pct.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: "emerald" | "red";
}) {
  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <p className="text-xs text-muted">{label}</p>
      <p
        className={`text-lg font-bold mt-1 ${
          color === "emerald"
            ? "text-emerald-600"
            : color === "red"
              ? "text-red-600"
              : "text-primary"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

// --- History Tab ---

function HistoryTab({ trades }: { trades: TradeRecord[] }) {
  if (trades.length === 0) {
    return (
      <div className="text-center py-12 text-muted">
        <p className="text-lg">No trades yet</p>
        <p className="text-sm mt-1">
          Trades will appear here once the auto-trader places orders
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="font-semibold text-primary">
          Trade History ({trades.length})
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-background text-muted text-xs uppercase">
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Ticker</th>
              <th className="px-4 py-2 text-center">Action</th>
              <th className="px-4 py-2 text-right">Qty</th>
              <th className="px-4 py-2 text-right">Entry</th>
              <th className="px-4 py-2 text-right">Exit</th>
              <th className="px-4 py-2 text-right">P&L</th>
              <th className="px-4 py-2 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t) => (
              <tr
                key={t.id}
                className="border-t border-border hover:bg-background/50"
              >
                <td className="px-4 py-2 text-muted">{t.trade_date}</td>
                <td className="px-4 py-2 font-medium text-primary">
                  {t.ticker}
                </td>
                <td className="px-4 py-2 text-center">
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded ${
                      t.action === "BUY"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {t.action}
                  </span>
                </td>
                <td className="px-4 py-2 text-right">{t.quantity}</td>
                <td className="px-4 py-2 text-right">${t.price.toFixed(2)}</td>
                <td className="px-4 py-2 text-right">
                  {t.exit_price ? `$${t.exit_price.toFixed(2)}` : "—"}
                </td>
                <td
                  className={`px-4 py-2 text-right font-medium ${
                    t.pnl != null
                      ? t.pnl >= 0
                        ? "text-emerald-600"
                        : "text-red-600"
                      : "text-muted"
                  }`}
                >
                  {t.pnl != null
                    ? `${t.pnl >= 0 ? "+" : ""}$${t.pnl.toFixed(2)}`
                    : "—"}
                  {t.pnl_pct != null && (
                    <span className="text-xs ml-1">
                      ({t.pnl_pct >= 0 ? "+" : ""}
                      {t.pnl_pct.toFixed(1)}%)
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 text-center">
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      t.status === "OPEN"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {t.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
