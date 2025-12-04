"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/components/AuthProvider";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const handleStartLogging = () => {
    if (loading) return;
    if (user) {
      router.push("/log");
    } else {
      router.push("/login");
    }
  };

  const handleViewJournal = () => {
    if (loading) return;
    if (user) {
      router.push("/journal");
    } else {
      router.push("/login");
    }
  };
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-400/5 rounded-full blur-3xl"></div>
      </div>

      {/* Hero Section */}
      <div className="relative container mx-auto px-4 py-8 md:py-16 max-w-6xl">
        <div className="text-center mb-12 md:mb-20 animate-fade-in">
          {/* Logo and Title - Centered */}
          <div className="flex items-center justify-center gap-3 md:gap-5 mb-8 md:mb-12">
            <div className="relative flex-shrink-0 group flex items-center">
              <Image
                src="/logo.png"
                alt="Tracer Logo"
                width={96}
                height={96}
                className="w-16 h-16 md:w-24 md:h-24 object-contain transition-transform duration-300 group-hover:scale-110"
              />
            </div>
            <div className="flex flex-col justify-center items-start">
              <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-slate-100 via-amber-200 to-amber-300 bg-clip-text text-transparent leading-tight">
                Tracer
              </h1>
              <p className="text-xs md:text-sm text-slate-400 leading-tight mt-1">
                Trade strategy journal & analytics
              </p>
            </div>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-400/10 border border-amber-400/20 mb-8">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="text-sm text-amber-300 font-medium">Built for Multi-Timeframe Traders</span>
          </div>

          <h2 className="text-3xl md:text-5xl lg:text-7xl font-extrabold text-gray-100 mb-4 md:mb-6 leading-tight px-2">
            Master Your Trading Strategy
            <br />
            <span className="bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
              One Trade at a Time
            </span>
          </h2>
          
          <p className="text-base md:text-xl lg:text-2xl text-gray-300 mb-4 md:mb-6 max-w-3xl mx-auto leading-relaxed font-medium px-4">
            Tracer is your personal trading journal built specifically for{" "}
            <span className="text-amber-300 font-bold">multi-timeframe strategy tracking</span>.
          </p>
          
          <p className="text-sm md:text-lg text-gray-400 mb-8 md:mb-12 max-w-2xl mx-auto leading-relaxed px-4">
            Log every trade, track adherence to your setups, analyze performance patterns, and discover what makes you consistently profitable.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4 mb-12 md:mb-20 px-4">
            <button
              onClick={handleStartLogging}
              disabled={loading}
              className="group relative inline-flex justify-center items-center gap-2 md:gap-3 px-6 md:px-10 py-3 md:py-5 rounded-xl md:rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 text-gray-900 font-bold text-base md:text-lg hover:from-amber-500 hover:to-yellow-600 transition-all duration-300 shadow-2xl shadow-amber-400/30 hover:shadow-amber-400/50 hover:-translate-y-1 hover:scale-105 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              <svg className="w-5 h-5 md:w-6 md:h-6 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span className="relative z-10">Start Logging Trades</span>
            </button>
            <button
              onClick={handleViewJournal}
              disabled={loading}
              className="group inline-flex justify-center items-center gap-2 md:gap-3 px-6 md:px-10 py-3 md:py-5 rounded-xl md:rounded-2xl bg-[#1f2937] text-gray-200 font-semibold hover:bg-[#374151] transition-all duration-300 shadow-xl border border-gray-700/50 hover:border-amber-400/30 hover:shadow-amber-400/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>View Journal</span>
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12 md:mb-20 px-4">
          {/* Feature 1 */}
          <div className="group relative bg-gradient-to-br from-[#1f2937] to-[#111827] rounded-3xl p-8 border border-gray-700/50 hover:border-amber-400/50 transition-all duration-500 hover:shadow-2xl hover:shadow-amber-400/20 hover:-translate-y-2 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/5 rounded-full blur-3xl group-hover:bg-amber-400/10 transition-all duration-500"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-100 mb-3">Structured Trade Logging</h3>
              <p className="text-gray-400 leading-relaxed">
                Log trades with detailed checklists for <strong className="text-amber-300">Setup 1</strong> and <strong className="text-amber-300">Setup 2</strong>. Track entry/exit prices, position sizing, risk management, and adherence to your strategy rules.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="group relative bg-gradient-to-br from-[#1f2937] to-[#111827] rounded-3xl p-8 border border-gray-700/50 hover:border-emerald-400/50 transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-400/20 hover:-translate-y-2 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/5 rounded-full blur-3xl group-hover:bg-emerald-400/10 transition-all duration-500"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-100 mb-3">Complete Trade Journal</h3>
              <p className="text-gray-400 leading-relaxed">
                Review all your trades in one place. Filter by strategy, direction, date range, and adherence. Edit or delete entries to keep your journal accurate and up-to-date.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="group relative bg-gradient-to-br from-[#1f2937] to-[#111827] rounded-3xl p-8 border border-gray-700/50 hover:border-rose-400/50 transition-all duration-500 hover:shadow-2xl hover:shadow-rose-400/20 hover:-translate-y-2 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-400/5 rounded-full blur-3xl group-hover:bg-rose-400/10 transition-all duration-500"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500/20 to-rose-600/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-100 mb-3">Deep Analytics & Insights</h3>
              <p className="text-gray-400 leading-relaxed">
                Discover your best trading hours, most profitable days, win/loss patterns, risk metrics, and performance tracking. Visual charts help you identify what works.
              </p>
            </div>
          </div>
        </div>

        {/* Use Case Section */}
        <div className="relative bg-gradient-to-br from-[#1f2937] via-[#1a1f2e] to-[#111827] rounded-2xl md:rounded-3xl p-6 md:p-10 lg:p-14 border border-gray-700/50 mb-12 md:mb-20 overflow-hidden mx-4 md:mx-0">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-400/5 via-transparent to-emerald-400/5"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-10">
              <div className="w-2 h-8 md:h-10 bg-gradient-to-b from-amber-400 to-yellow-500 rounded-full"></div>
              <h2 className="text-2xl md:text-4xl font-bold text-gray-100">Perfect For Multi-Timeframe Traders</h2>
            </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-400/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-100 mb-1">Track Setup Adherence</h4>
                  <p className="text-gray-400 text-sm">
                    Ensure you're following your strategy rules. Auto-calculated adherence tracking for H1 trend alignment, M15/M5 structure, confirmations, and exit rules.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-400/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-100 mb-1">Performance Analysis</h4>
                  <p className="text-gray-400 text-sm">
                    Track win rate, average R:R, expectancy, and adherence rate. See which setups and timeframes work best for your trading style.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-400/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-100 mb-1">Pattern Recognition</h4>
                  <p className="text-gray-400 text-sm">
                    Identify your best trading hours, most profitable days of the week, and patterns in your winning vs losing trades through visual analytics.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-400/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-100 mb-1">Risk Management Tracking</h4>
                  <p className="text-gray-400 text-sm">
                    Monitor risk percentages, position sizing, max drawdown, MFE/MAE, and peak profit metrics to refine your risk management.
                  </p>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center relative px-4">
          <div className="relative inline-block bg-gradient-to-br from-[#1f2937] to-[#111827] rounded-2xl md:rounded-3xl p-8 md:p-12 border border-gray-700/50 shadow-2xl overflow-hidden w-full max-w-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400/10 via-transparent to-yellow-400/10"></div>
            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-amber-400/10 mb-4 md:mb-6">
                <svg className="w-8 h-8 md:w-10 md:h-10 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-100 mb-3 md:mb-4">
                Ready to Improve Your Trading?
              </h3>
              <p className="text-gray-400 mb-6 md:mb-8 max-w-md mx-auto text-base md:text-lg">
                Start logging your trades today and discover the patterns that lead to consistent profitability.
              </p>
              <button
                onClick={handleStartLogging}
                disabled={loading}
                className="group inline-flex items-center gap-2 md:gap-3 px-8 md:px-10 py-3 md:py-5 rounded-xl md:rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 text-gray-900 font-bold text-base md:text-lg hover:from-amber-500 hover:to-yellow-600 transition-all duration-300 shadow-2xl shadow-amber-400/30 hover:shadow-amber-400/50 hover:-translate-y-1 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Get Started</span>
                <svg className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
