"use client";

import TradeForm from "@/components/TradeForm";
import NavBar from "@/components/NavBar";

export default function LogPage() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto px-4 py-10 max-w-6xl">
        <header className="mb-6">
          <h1 className="text-4xl font-semibold tracking-tight text-slate-50 mb-1">
            Personal Trade Strategy Tracker
          </h1>
          <p className="text-slate-300">
            Capture every detail of your trade so you can analyze it later.
          </p>
        </header>

        <NavBar />

        <TradeForm />
      </div>
    </div>
  );
}


