"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

/* ─── Types ────────────────────────────────────────── */

interface SentimentData {
  score: number;
  label: string;
  summary: string;
  sbtc_outlook: string;
  recommendation: string;
  raw_data: {
    fear_greed: { value: number; classification: string };
    btc: { price_usd: number; change_24h: number };
    sbtc: { tvl_usd: number; holders: number };
  };
  timestamp: string;
}

interface PricePoint {
  date: string;
  price: number;
}

interface VolumePoint {
  date: string;
  volume: number;
}

/* ─── Helpers ──────────────────────────────────────── */

function classifyScore(score: number) {
  if (score <= 20) return { color: "#ef4444", bg: "rgba(239,68,68,0.08)", text: "EXTREME FEAR" };
  if (score <= 40) return { color: "#f97316", bg: "rgba(249,115,22,0.08)", text: "FEAR" };
  if (score <= 60) return { color: "#eab308", bg: "rgba(234,179,8,0.08)", text: "NEUTRAL" };
  if (score <= 80) return { color: "#22c55e", bg: "rgba(34,197,94,0.08)", text: "GREED" };
  return { color: "#10b981", bg: "rgba(16,185,129,0.08)", text: "EXTREME GREED" };
}

function formatUSD(n: number) {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
}

/* ─── Custom Tooltip for Charts ────────────────────── */

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="tt-box">
      <p className="tt-label">{label}</p>
      <p className="tt-value">${payload[0].value.toLocaleString()}</p>
    </div>
  );
}

function VolumeTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="tt-box">
      <p className="tt-label">{label}</p>
      <p className="tt-value">{formatUSD(payload[0].value)}</p>
    </div>
  );
}

/* ─── Gauge Component ──────────────────────────────── */

function SentimentGauge({ score }: { score: number }) {
  const { color, text } = classifyScore(score);
  const rotation = (score / 100) * 180 - 90;

  return (
    <div className="gauge-wrap">
      <svg viewBox="0 0 200 120" className="gauge-svg">
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="25%" stopColor="#f97316" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="75%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray="251.2"
          strokeDashoffset={251.2 - (score / 100) * 251.2}
          style={{ transition: "stroke-dashoffset 1.2s ease" }}
        />
        <line
          x1="100"
          y1="100"
          x2="100"
          y2="30"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          transform={`rotate(${rotation}, 100, 100)`}
          style={{ transition: "transform 1.2s ease" }}
        />
        <circle cx="100" cy="100" r="5" fill={color} />
      </svg>
      <div className="gauge-score" style={{ color }}>{score}</div>
      <div className="gauge-label" style={{ color }}>{text}</div>
    </div>
  );
}

/* ─── Stat Card ────────────────────────────────────── */

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="stat-card">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {sub && <span className="stat-sub" style={accent ? { color: accent } : undefined}>{sub}</span>}
    </div>
  );
}

/* ─── Nav Tab ──────────────────────────────────────── */

function NavTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button className={`nav-tab ${active ? "nav-tab-active" : ""}`} onClick={onClick}>
      {label}
    </button>
  );
}

/* ─── Main Page ────────────────────────────────────── */

export default function Home() {
  const [sentiment, setSentiment] = useState<SentimentData | null>(null);
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [volumeHistory, setVolumeHistory] = useState<VolumePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartRange, setChartRange] = useState<"7" | "30" | "90">("30");
  const [activeTab, setActiveTab] = useState<"overview" | "analysis">("overview");
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [connectingWallet, setConnectingWallet] = useState(false);

  /* Fetch sentiment */
  const fetchSentiment = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:5001/api/sentiment");
      const json = await res.json();
      if (json.status === "ok") setSentiment(json.data);
    } catch (e) {
      console.error("Sentiment fetch failed", e);
    }
  }, []);

  /* Fetch BTC price history from CoinGecko */
  const fetchPriceHistory = useCallback(async (days: string) => {
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${days}&interval=daily`
      );
      const data = await res.json();
      if (data.prices) {
        const prices: PricePoint[] = data.prices.map((p: number[]) => ({
          date: new Date(p[0]).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          price: Math.round(p[1]),
        }));
        setPriceHistory(prices);
      }
      if (data.total_volumes) {
        const vols: VolumePoint[] = data.total_volumes.map((v: number[]) => ({
          date: new Date(v[0]).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          volume: Math.round(v[1]),
        }));
        setVolumeHistory(vols);
      }
    } catch (e) {
      console.error("Price history fetch failed", e);
    }
  }, []);

  /* Connect Wallet */
  const connectWallet = async () => {
    setConnectingWallet(true);
    try {
      const mod = await import("@stacks/connect");
      const appConfig = new mod.AppConfig(["store_write"]);
      const userSession = new mod.UserSession({ appConfig });

      mod.showConnect({
        appDetails: {
          name: "sBTC Sentinel",
          icon: "https://www.stacks.co/favicon.ico",
        },
        onFinish: () => {
          const userData = userSession.loadUserData();
          const addr = userData.profile.stxAddress.testnet;
          setWalletAddress(addr);
          setConnectingWallet(false);
        },
        onCancel: () => {
          setConnectingWallet(false);
        },
        userSession,
      });
    } catch (e) {
      console.error("Wallet connect failed", e);
      setConnectingWallet(false);
    }
  };

  /* Initial load */
  useEffect(() => {
    Promise.all([fetchSentiment(), fetchPriceHistory(chartRange)]).then(() => setLoading(false));
  }, []);

  /* Chart range change */
  useEffect(() => {
    fetchPriceHistory(chartRange);
  }, [chartRange]);

  const cls = sentiment ? classifyScore(sentiment.score) : null;

  return (
    <div className="page">
      {/* ── Header ── */}
      <header className="header">
        <div className="logo-area">
          <div className="logo-dot" />
          <div>
            <div className="logo-text">sBTC Sentinel</div>
            <div className="logo-sub">Bitcoin Intelligence for Stacks</div>
          </div>
        </div>
        <div className="header-right">
          <div className="chain-badge">
            <span className="chain-dot" />
            Stacks Testnet
          </div>
          <button
            className="btn-refresh"
            onClick={() => {
              setLoading(true);
              Promise.all([fetchSentiment(), fetchPriceHistory(chartRange)]).then(() =>
                setLoading(false)
              );
            }}
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
          <button
            className={`btn-wallet ${walletAddress ? "btn-wallet-connected" : ""}`}
            onClick={connectWallet}
            disabled={connectingWallet}
          >
            {connectingWallet
              ? "Connecting..."
              : walletAddress
              ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
              : "Connect Wallet"}
          </button>
        </div>
      </header>

      {/* ── Loading State ── */}
      {loading && !sentiment ? (
        <div className="loading-wrap">
          <div className="spinner" />
          <span style={{ color: "var(--text3)", fontSize: 13 }}>
            Fetching market intelligence...
          </span>
        </div>
      ) : (
        <>
          {/* ── Stats Row ── */}
          <div className="stats-row">
            <StatCard
              label="Bitcoin"
              value={sentiment ? `$${sentiment.raw_data.btc.price_usd.toLocaleString()}` : "--"}
              sub={
                sentiment
                  ? `${sentiment.raw_data.btc.change_24h >= 0 ? "+" : ""}${sentiment.raw_data.btc.change_24h.toFixed(2)}% 24h`
                  : ""
              }
              accent={
                sentiment
                  ? sentiment.raw_data.btc.change_24h >= 0
                    ? "var(--green)"
                    : "var(--red)"
                  : undefined
              }
            />
            <StatCard
              label="Fear & Greed"
              value={sentiment ? `${sentiment.raw_data.fear_greed.value}` : "--"}
              sub={sentiment?.raw_data.fear_greed.classification}
            />
            <StatCard
              label="sBTC TVL"
              value={sentiment ? formatUSD(sentiment.raw_data.sbtc.tvl_usd) : "--"}
              sub={sentiment ? `${sentiment.raw_data.sbtc.holders.toLocaleString()} holders` : ""}
            />
            <StatCard
              label="Sentinel Score"
              value={sentiment ? `${sentiment.score}` : "--"}
              sub={sentiment ? classifyScore(sentiment.score).text : ""}
              accent={sentiment ? classifyScore(sentiment.score).color : undefined}
            />
          </div>

          {/* ── Tabs ── */}
          <div className="nav-tabs">
            <NavTab label="Overview" active={activeTab === "overview"} onClick={() => setActiveTab("overview")} />
            <NavTab label="AI Analysis" active={activeTab === "analysis"} onClick={() => setActiveTab("analysis")} />
          </div>

          {activeTab === "overview" ? (
            <div className="grid-main">
              {/* ── Left Column ── */}
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Price Chart */}
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">BTC / USD</span>
                    <div className="range-btns">
                      {(["7", "30", "90"] as const).map((r) => (
                        <button
                          key={r}
                          className={`range-btn ${chartRange === r ? "range-btn-active" : ""}`}
                          onClick={() => setChartRange(r)}
                        >
                          {r}D
                        </button>
                      ))}
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={priceHistory}>
                      <defs>
                        <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f7931a" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="#f7931a" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#52535b", fontSize: 10, fontFamily: "JetBrains Mono" }}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#52535b", fontSize: 10, fontFamily: "JetBrains Mono" }}
                        domain={["dataMin - 1000", "dataMax + 1000"]}
                        tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                        width={55}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke="#f7931a"
                        strokeWidth={2}
                        fill="url(#priceGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Volume Chart */}
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">BTC Volume (24h)</span>
                  </div>
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={volumeHistory}>
                      <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#52535b", fontSize: 10, fontFamily: "JetBrains Mono" }}
                        interval="preserveStartEnd"
                      />
                      <YAxis hide />
                      <Tooltip content={<VolumeTooltip />} />
                      <Bar dataKey="volume" fill="rgba(85,70,255,0.5)" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ── Right Column ── */}
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Sentiment Gauge */}
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Market Sentiment</span>
                    <div className="chain-badge" style={{ fontSize: 10 }}>
                      <span className="chain-dot" /> On-chain
                    </div>
                  </div>
                  {sentiment && <SentimentGauge score={sentiment.score} />}
                  {sentiment && (
                    <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6, marginTop: 12 }}>
                      {sentiment.summary}
                    </p>
                  )}
                </div>

                {/* Contract Info */}
                <div className="card">
                  <span className="card-title">Contract</span>
                  <div className="contract-info">
                    <div className="contract-row">
                      <span className="contract-key">Network</span>
                      <span className="contract-val">Stacks Testnet</span>
                    </div>
                    <div className="contract-row">
                      <span className="contract-key">Contract</span>
                      <span className="contract-val">sentinel</span>
                    </div>
                    <div className="contract-row">
                      <span className="contract-key">Deployer</span>
                      <span className="contract-val">ST1VSN...NB6P</span>
                    </div>
                    <div className="contract-row">
                      <span className="contract-key">Language</span>
                      <span className="contract-val">Clarity v4</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ── Analysis Tab ── */
            <div className="grid-main">
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div className="card">
                  <span className="card-title">AI Sentiment Report</span>
                  {sentiment && (
                    <div className="analysis-block">
                      <div className="analysis-section">
                        <div className="analysis-tag" style={{ color: "var(--accent)" }}>
                          Summary
                        </div>
                        <p className="analysis-text">{sentiment.summary}</p>
                      </div>
                      <div className="analysis-section">
                        <div className="analysis-tag" style={{ color: "var(--accent)" }}>
                          sBTC Outlook
                        </div>
                        <p className="analysis-text">{sentiment.sbtc_outlook}</p>
                      </div>
                      <div className="analysis-section">
                        <div className="analysis-tag" style={{ color: "var(--accent2)" }}>
                          Recommendation
                        </div>
                        <p className="analysis-text">{sentiment.recommendation}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="card">
                  <span className="card-title">Data Sources</span>
                  <div className="contract-info" style={{ marginTop: 12 }}>
                    <div className="contract-row">
                      <span className="contract-key">AI Model</span>
                      <span className="contract-val">DeepSeek</span>
                    </div>
                    <div className="contract-row">
                      <span className="contract-key">Price Feed</span>
                      <span className="contract-val">CoinGecko</span>
                    </div>
                    <div className="contract-row">
                      <span className="contract-key">Sentiment</span>
                      <span className="contract-val">Alternative.me</span>
                    </div>
                    <div className="contract-row">
                      <span className="contract-key">On-chain</span>
                      <span className="contract-val">Stacks API</span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div className="card">
                  <span className="card-title">Sentiment Gauge</span>
                  {sentiment && <SentimentGauge score={sentiment.score} />}
                </div>

                <div className="card">
                  <span className="card-title">Raw Metrics</span>
                  <div className="contract-info" style={{ marginTop: 12 }}>
                    <div className="contract-row">
                      <span className="contract-key">Sentinel Score</span>
                      <span className="contract-val" style={{ color: cls?.color }}>{sentiment?.score}/100</span>
                    </div>
                    <div className="contract-row">
                      <span className="contract-key">BTC Price</span>
                      <span className="contract-val">${sentiment?.raw_data.btc.price_usd.toLocaleString()}</span>
                    </div>
                    <div className="contract-row">
                      <span className="contract-key">24h Change</span>
                      <span className="contract-val" style={{
                        color: sentiment && sentiment.raw_data.btc.change_24h >= 0 ? "var(--green)" : "var(--red)"
                      }}>
                        {sentiment?.raw_data.btc.change_24h.toFixed(2)}%
                      </span>
                    </div>
                    <div className="contract-row">
                      <span className="contract-key">Fear & Greed</span>
                      <span className="contract-val">{sentiment?.raw_data.fear_greed.value}/100</span>
                    </div>
                    <div className="contract-row">
                      <span className="contract-key">sBTC TVL</span>
                      <span className="contract-val">{formatUSD(sentiment?.raw_data.sbtc.tvl_usd || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Footer ── */}
          <div className="footer">
            Built on Stacks
            {sentiment && (
              <span> &middot; Updated {new Date(sentiment.timestamp).toLocaleString()}</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
