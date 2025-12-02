"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="container mx-auto px-4 py-16 max-w-4xl text-center animate-fade-in">
        <div className="mb-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500 flex items-center justify-center shadow-2xl shadow-amber-400/40">
              <span className="text-white font-bold text-3xl">T</span>
            </div>
            <h1 className="text-6xl font-bold bg-gradient-to-r from-slate-50 via-amber-200 to-amber-300 bg-clip-text text-transparent">
              Tracer
            </h1>
          </div>
          <p className="text-slate-400 text-xl mb-12 max-w-2xl mx-auto">
            Log your trades, review your journal, and study analytics to find the
            patterns that make you consistently profitable.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href="/log"
            className="group inline-flex justify-center items-center gap-2 px-8 py-4 rounded-xl bg-amber-400 text-slate-900 font-semibold hover:bg-amber-500 transition-all duration-200 shadow-lg shadow-amber-400/40 hover:shadow-xl hover:shadow-amber-400/60 hover:-translate-y-1"
          >
            <span>📝</span>
            <span>Log a New Trade</span>
          </Link>
          <Link
            href="/journal"
            className="group inline-flex justify-center items-center gap-2 px-8 py-4 rounded-xl bg-[#111827] text-slate-100 font-semibold hover:bg-[#1f2937] transition-all duration-200 shadow-lg shadow-black/40 hover:shadow-xl hover:-translate-y-1"
          >
            <span>📊</span>
            <span>View Trade Journal</span>
          </Link>
          <Link
            href="/analytics"
            className="group inline-flex justify-center items-center gap-2 px-8 py-4 rounded-xl bg-[#020617] text-slate-100 font-semibold hover:bg-[#020617]/90 transition-all duration-200 shadow-lg shadow-black/40 hover:shadow-xl hover:-translate-y-1"
          >
            <span>📈</span>
            <span>Open Analytics</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
