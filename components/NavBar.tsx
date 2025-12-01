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
      <div className="inline-flex items-center rounded-full bg-white/70 backdrop-blur px-2 py-1 shadow-sm ring-1 ring-slate-200">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                active
                  ? "bg-slate-900 text-slate-50 shadow"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
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


