"use client";

import { useState, useEffect } from "react";

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

function scoreColor(score: number): string {
  if (score <= 20) return "text-red-500";
  if (score <= 40) return "text-orange-500";
  if (score <= 60) return "text-yellow-500";
  if (score <= 80) return "text-green-400";
  return "text-green-500";
}

function scoreBg(score: number): string {
  if (score <= 20) return "from-red-900/30 to-red-800/10";
  if (score <= 40) return "from-orange-900/30 to-orange-800/10";
  if (score <= 60) return "from-yellow-900/30 to-yellow-800/10";
  if (score <= 80) return "from-green-900/30 to-green-800/10";
  return "from-green-900/30 to-green-700/10";
}

export default function Home() {
  const [sentiment, setSentiment] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSentiment = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:5001/api/sentiment");
      const json = await res.json();
      if (json.status === "ok") {
        setSentiment(json.data);
      } else {
        setError(json.message || "Failed to fetch");
      }
    } catch (e) {
      setError("Could not connect to API. Is the backend running on port 5001?");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSentiment();
  }, []);

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">sBTC Sentinel</h1>
            <p className="text-gray-400 mt-1">
              AI-Powered Bitcoin Intelligence for Stacks DeFi
            </p>
          </div>
          <button
            onClick={fetchSentiment}
            disabled={loading}
            className="bg-orange-600 hover:bg-orange-500 disabled:bg-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {loading ? "Analyzing..." : "Refresh"}
          </button>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {loading && !sentiment && (
          <div className="text-center py-20">
            <p className="text-gray-400">Running AI sentiment analysis...</p>
          </div>
        )}

        {sentiment && (
          <div className="space-y-6">
            <div className={`bg-gradient-to-br ${scoreBg(sentiment.score)} border border-gray-800 rounded-xl p-6`}>
              <div className="text-center">
                <div className={`text-6xl font-bold ${scoreColor(sentiment.score)}`}>
                  {sentiment.score}
                </div>
                <div className="text-xl text-gray-300 mt-2 uppercase tracking-wider">
                  {sentiment.label.replace("-", " ")}
                </div>
              </div>
              <div className="mt-6 bg-gray-800 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all duration-1000"
                  style={{ width: `${sentiment.score}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Extreme Fear</span>
                <span>Neutral</span>
                <span>Extreme Greed</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <div className="text-gray-400 text-sm">Bitcoin Price</div>
                <div className="text-2xl font-bold mt-1">
                  ${sentiment.raw_data.btc.price_usd.toLocaleString()}
                </div>
                <div className={`text-sm mt-1 ${sentiment.raw_data.btc.change_24h >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {sentiment.raw_data.btc.change_24h >= 0 ? "+" : ""}
                  {sentiment.raw_data.btc.change_24h.toFixed(2)}% (24h)
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <div className="text-gray-400 text-sm">Fear & Greed Index</div>
                <div className="text-2xl font-bold mt-1">
                  {sentiment.raw_data.fear_greed.value}/100
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  {sentiment.raw_data.fear_greed.classification}
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <div className="text-gray-400 text-sm">sBTC TVL</div>
                <div className="text-2xl font-bold mt-1">
                  ${(sentiment.raw_data.sbtc.tvl_usd / 1_000_000).toFixed(0)}M
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  {sentiment.raw_data.sbtc.holders.toLocaleString()} holders
                </div>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">AI Analysis</h2>
              <p className="text-gray-300 leading-relaxed">{sentiment.summary}</p>

              <div className="mt-4 pt-4 border-t border-gray-800">
                <h3 className="text-sm font-semibold text-orange-400 mb-2">sBTC Outlook</h3>
                <p className="text-gray-300 text-sm">{sentiment.sbtc_outlook}</p>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-800">
                <h3 className="text-sm font-semibold text-blue-400 mb-2">Suggestion</h3>
                <p className="text-gray-300 text-sm">{sentiment.recommendation}</p>
              </div>
            </div>

            <div className="text-center text-gray-600 text-sm py-4">
              Last updated: {new Date(sentiment.timestamp).toLocaleString()}
              <br />
              Built on Stacks - Powered by AI
            </div>
          </div>
        )}
      </div>
    </main>
  );
}