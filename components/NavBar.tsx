"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/log", label: "Log New Trade" },
  { href: "/journal", label: "Trade Journal" },
  { href: "/analytics", label: "Analytics & Insights" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="mb-8">
      <div className="inline-flex items-center rounded-full bg-slate-800/80 backdrop-blur px-2 py-1 shadow-sm ring-1 ring-slate-700 border border-slate-700">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                active
                  ? "bg-cyan-500 text-white shadow"
                  : "text-slate-300 hover:text-slate-100 hover:bg-slate-700"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}


