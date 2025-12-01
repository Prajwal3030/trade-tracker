"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16 max-w-3xl text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Personal Trade Strategy Tracker
        </h1>
        <p className="text-gray-600 mb-8">
          Log your trades, review your journal, and study analytics to find the
          patterns that make you consistently profitable.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href="/log"
            className="inline-flex justify-center items-center px-6 py-3 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700"
          >
            Log a New Trade
          </Link>
          <Link
            href="/journal"
            className="inline-flex justify-center items-center px-6 py-3 rounded-md border border-gray-300 text-gray-800 font-medium hover:bg-gray-100"
          >
            View Trade Journal
          </Link>
          <Link
            href="/analytics"
            className="inline-flex justify-center items-center px-6 py-3 rounded-md border border-gray-300 text-gray-800 font-medium hover:bg-gray-100"
          >
            Open Analytics
          </Link>
        </div>
      </div>
    </div>
  );
}
