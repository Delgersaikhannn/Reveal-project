"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

interface Slide5Props {
  isActive: boolean;
}

const Slide5 = ({ isActive }: Slide5Props) => {
  const walletTypeData = [
    { year: "2023", total: 10, hot: 5.6, cold: 4.4 },
    { year: "2024", total: 12.6, hot: 7.1, cold: 5.5 },
    { year: "2025", total: 15.5, hot: 8.7, cold: 6.8 },
    { year: "2026", total: 19.5, hot: 10.9, cold: 8.6 },
    { year: "2027", total: 24.5, hot: 13.7, cold: 10.8 },
    { year: "2028", total: 31.0, hot: 17.4, cold: 13.6 },
    { year: "2029", total: 39.5, hot: 22.1, cold: 17.4 },
    { year: "2030", total: 50.5, hot: 28.3, cold: 22.2 },
    { year: "2031", total: 64.5, hot: 36.1, cold: 28.4 },
    { year: "2032", total: 82.0, hot: 45.9, cold: 36.1 },
    { year: "2033", total: 100.7, hot: 56.4, cold: 44.3 },
  ];

  const chartData = walletTypeData.map((row) => ({
    year: row.year,
    hot: row.hot,
    cold: row.cold,
  }));

  const chartConfig: ChartConfig = {
    hot: {
      label: "Hot Wallets",
      color: "#22d3ee",
    },
    cold: {
      label: "Cold Wallets",
      color: "#34d399",
    },
  };

  return (
    <div className="font-bold tracking-tight h-full w-full flex flex-col items-center justify-center bg-black px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-12 overflow-y-auto">
      {/* Commercial Potential */}
      <div className="max-w-7xl w-full space-y-4 sm:space-y-6 md:space-y-8">
        {/* Header */}
        <div className="text-center space-y-1 sm:space-y-2">
          <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white">
            Commercial Potential
          </h3>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
          {/* Primary Market */}
          <div className="relative group">
            <div className="absolute inset-0 bg-blue-500/10 rounded-xl sm:rounded-2xl blur-xl transition-all" />

            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg px-3 sm:px-4 py-2 sm:py-3 border border-blue-500/20 mb-5">
              <p className="text-blue-300 font-semibold text-center text-xs sm:text-sm">
                Primary market: DAOs, communities, gated events, and creator
                platforms
              </p>
            </div>
            <div className="relative bg-slate-900/60 backdrop-blur-sm border border-emerald-500/30 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-5">
              <div className="flex items-center gap-2 sm:gap-3">
                <h4 className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                  Monetization Model
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {/* Freemium for Users */}
                <div className="bg-slate-800/40 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 border border-emerald-500/20 space-y-2 sm:space-y-3">
                  <h5 className="text-sm sm:text-base md:text-lg font-bold text-emerald-300 flex items-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    Freemium for Users
                  </h5>

                  <div className="space-y-2">
                    <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/20">
                      <p className="text-sm font-semibold text-emerald-300 mb-2">
                        Free Tier:
                      </p>
                      <ul className="space-y-1 text-sm text-slate-300">
                        <li className="flex gap-2">
                          <span className="text-emerald-400">✓</span>
                          <span>Generate limited claims</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="text-emerald-400">✓</span>
                          <span>Basic privacy controls</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-lg p-3 border border-emerald-400/40">
                      <p className="text-sm font-semibold text-emerald-200 mb-2">
                        Pro Tier:
                      </p>
                      <ul className="space-y-1 text-sm text-slate-200">
                        <li className="flex gap-2">
                          <span className="text-emerald-300">★</span>
                          <span>Advanced claim history</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="text-emerald-300">★</span>
                          <span>Expiration controls</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="text-emerald-300">★</span>
                          <span>Verifier management</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Subscription for Verifiers */}
                <div className="bg-slate-800/40 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 border border-cyan-500/20 space-y-2 sm:space-y-3">
                  <h5 className="text-sm sm:text-base md:text-lg font-bold text-cyan-300 flex items-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    Subscription for Verifiers / DAOs
                  </h5>

                  <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg p-4 border border-cyan-400/40 space-y-3">
                    <p className="text-sm font-semibold text-cyan-300">
                      Paid Dashboard:
                    </p>
                    <ul className="space-y-2 text-sm text-slate-200">
                      <li className="flex gap-2">
                        <span className="text-cyan-400">📊</span>
                        <span>Verification analytics</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-cyan-400">🛡️</span>
                        <span>Abuse prevention</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-cyan-400">⚙️</span>
                        <span>Custom claim modules</span>
                      </li>
                    </ul>
                    <div className="bg-cyan-500/20 rounded-lg px-3 py-2 border border-cyan-400/30 mt-3">
                      <p className="text-sm font-bold text-cyan-200 text-center">
                        Monthly SaaS-style fee
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Wallet Type Mix - Chart */}
          <div className="relative group lg:col-span-1">
            <div className="absolute inset-0 bg-cyan-500/10 rounded-xl sm:rounded-2xl blur-xl transition-all" />
            <div className="relative bg-slate-900/60 backdrop-blur-sm border border-cyan-500/30 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 space-y-2 sm:space-y-3 md:space-y-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <h4 className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                  Crypto Wallet Market Growth
                </h4>
              </div>

              <div className="text-xs sm:text-sm text-slate-300">
                Market size projection (2023-2033) showing hot wallet dominance
                at 56% share vs cold wallets at 44% (Grand View Research).
              </div>

              <div className="flex items-center gap-2 sm:gap-3 md:gap-4 text-[10px] sm:text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-cyan-500" /> Hot
                  Wallets
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-emerald-500" /> Cold
                  Wallets
                </div>
              </div>

              <ChartContainer
                config={chartConfig}
                className="bg-slate-950/40 rounded-lg sm:rounded-xl p-2 sm:p-3 border border-slate-800 h-[200px] sm:h-[240px] md:h-[260px]"
              >
                <BarChart
                  data={chartData}
                  margin={{ left: 8, right: 8, top: 8 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(148,163,184,0.25)"
                  />
                  <XAxis
                    dataKey="year"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#cbd5e1", fontSize: 12 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={40}
                    tickFormatter={(value) => `$${value}B`}
                    tick={{ fill: "#cbd5e1", fontSize: 10 }}
                    label={{
                      value: "Market Size (USD Billion)",
                      angle: -90,
                      position: "insideLeft",
                      style: { fill: "#cbd5e1", fontSize: 10 },
                    }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="hot"
                    stackId="wallets"
                    fill="var(--color-hot)"
                    radius={[0, 0, 0, 0]}
                    name="Hot Wallets"
                  />
                  <Bar
                    dataKey="cold"
                    stackId="wallets"
                    fill="var(--color-cold)"
                    radius={[6, 6, 0, 0]}
                    name="Cold Wallets"
                  />
                </BarChart>
              </ChartContainer>

              <div className="text-[10px] sm:text-xs text-slate-400">
                Source: Grand View Research, Crypto Wallet Market (2025-2033).
                Market growing at 26.3% CAGR from $12.6B (2024) to $100.7B
                (2033).
              </div>
            </div>
          </div>
        </div>

        {/* Why This Market Wins */}
      </div>
    </div>
  );
};

export default Slide5;
