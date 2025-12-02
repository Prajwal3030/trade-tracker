"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

const links = [
  { href: "/log", label: "Log New Trade", key: "log" },
  { href: "/journal", label: "Trade Journal", key: "journal" },
  { href: "/analytics", label: "Analytics & Insights", key: "analytics" },
];

function NavIcon({ routeKey, active }: { routeKey: string; active: boolean }) {
  const baseStroke = active ? "#e5e7eb" : "#9ca3af";

  if (routeKey === "log") {
    // Pencil / document icon
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-cyan-500/20">
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path
            d="M5 19.5V16l9.75-9.75a1.75 1.75 0 0 1 2.5 0l.5.5a1.75 1.75 0 0 1 0 2.5L8 19.5H5Z"
            fill={active ? "#22d3ee" : "#38bdf8"}
          />
          <path
            d="M5 21h14"
            stroke={baseStroke}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </span>
    );
  }

  if (routeKey === "journal") {
    // Column / journal icon
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/10">
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <rect
            x="4"
            y="5"
            width="4"
            height="14"
            rx="1"
            fill={active ? "#22c55e" : "#4ade80"}
          />
          <rect
            x="10"
            y="8"
            width="4"
            height="11"
            rx="1"
            fill={active ? "#22c55e" : "#4ade80"}
            opacity="0.8"
          />
          <rect
            x="16"
            y="11"
            width="4"
            height="8"
            rx="1"
            fill={active ? "#22c55e" : "#4ade80"}
            opacity="0.6"
          />
        </svg>
      </span>
    );
  }

  // Analytics icon
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-rose-500/10">
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path
          d="M4 18.5 9.5 12l4 3 6-7.5"
          fill="none"
          stroke={active ? "#fb7185" : "#f97373"}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx="9.5"
          cy="12"
          r="1.1"
          fill={active ? "#fb7185" : "#f97373"}
        />
        <circle
          cx="13.5"
          cy="15"
          r="1.1"
          fill={active ? "#fb7185" : "#f97373"}
        />
        <circle
          cx="19.5"
          cy="7.5"
          r="1.1"
          fill={active ? "#fb7185" : "#f97373"}
        />
      </svg>
    </span>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#1f2937] border-r border-gray-700/80 z-30 hidden md:block shadow-2xl">
      <div className="flex flex-col h-full">
        {/* Logo/Title */}
        <div className="p-5 border-b border-gray-700 bg-[#1f2937]">
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <Image
                src="/logo.png"
                alt="Tracer Logo"
                width={96}
                height={96}
                className="w-24 h-24 object-contain"
              />
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-100 via-amber-200 to-amber-300 bg-clip-text text-transparent leading-none">
                Tracer
              </h1>
              <p className="text-xs text-slate-400 leading-tight mt-0.5">
                Trade strategy journal & analytics
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {links.map((link, index) => {
              const active = pathname === link.href;
              return (
                <li key={link.href} className="animate-slide-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <Link
                    href={link.href}
                    className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      active
                        ? "bg-amber-400 text-slate-900 shadow-lg shadow-amber-400/40"
                        : "text-slate-300 hover:bg-[#0b1120] hover:text-slate-100"
                    }`}
                  >
                    <span
                      className={`transition-transform ${active ? "scale-110" : "group-hover:scale-110"}`}
                    >
                      <NavIcon routeKey={link.key} active={active} />
                    </span>
                    <span className="font-medium">{link.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </aside>
  );
}

