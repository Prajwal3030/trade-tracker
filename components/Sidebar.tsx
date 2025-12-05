"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/components/AuthProvider";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

const links = [
  { href: "/log", label: "Log New Trade", key: "log" },
  { href: "/journal", label: "Trade Journal", key: "journal" },
  { href: "/analytics", label: "Analytics & Insights", key: "analytics" },
  { href: "/strategies", label: "Setup / Strategy", key: "strategies" },
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

  if (routeKey === "strategies") {
    // Strategy/Setup icon
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-purple-500/10">
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          aria-hidden="true"
          fill="none"
          stroke={active ? "#a855f7" : "#c084fc"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
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
  const router = useRouter();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showUserMenu && !target.closest(".user-menu-container")) {
        setShowUserMenu(false);
      }
      if (isMobileMenuOpen && !target.closest(".mobile-menu-container") && !target.closest(".mobile-menu-button")) {
        setIsMobileMenuOpen(false);
      }
    };

    if (showUserMenu || isMobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showUserMenu, isMobileMenuOpen]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const handleLogout = async () => {
    try {
      if (auth) {
        await signOut(auth);
        router.push("/login");
      }
    } catch (error) {
      console.error("Error signing out:", error);
      alert("Failed to sign out. Please try again.");
    }
  };

  const getUserInitial = () => {
    if (!user) return "?";
    if (user.displayName) {
      return user.displayName.charAt(0).toUpperCase();
    }
    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "?";
  };

  const getUserName = () => {
    if (!user) return "User";
    if (user.displayName) {
      return user.displayName;
    }
    if (user.email) {
      return user.email.split("@")[0];
    }
    return "User";
  };

  const SidebarContent = ({ onLinkClick }: { onLinkClick?: () => void }) => (
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
                    onClick={onLinkClick}
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

        {/* User Section */}
        {user && (
          <div className="p-4 border-t border-gray-700/80 relative user-menu-container">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#0b1120] transition-all duration-200 group"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-900 font-bold text-lg shadow-lg">
                {getUserInitial()}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-sm font-medium text-slate-200 truncate">
                  {getUserName()}
                </div>
                <div className="text-xs text-slate-400 truncate">
                  {user.email}
                </div>
              </div>
              <svg
                className={`w-5 h-5 text-slate-400 transition-transform ${showUserMenu ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute bottom-full left-4 right-4 mb-2 bg-[#0b1120] border border-gray-700/80 rounded-xl shadow-2xl overflow-hidden z-50">
                <div className="p-3 border-b border-gray-700/80">
                  <div className="text-xs text-slate-400 mb-1">Signed in as</div>
                  <div className="text-sm font-medium text-slate-200 truncate">
                    {user.email}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        )}
    </div>
  );

  // Get current page label
  const getCurrentPageLabel = () => {
    const currentLink = links.find(link => link.href === pathname);
    return currentLink ? currentLink.label : "Tracer";
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#1f2937] via-[#111827] to-[#1f2937] border-b border-gray-700/80 backdrop-blur-md shadow-lg safe-area-top">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo and Page Title */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="mobile-menu-button flex-shrink-0 relative group"
              aria-label="Toggle menu"
            >
              <div className="relative w-10 h-10 flex items-center justify-center">
                <div className={`absolute inset-0 rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-600/20 transition-all duration-300 ${
                  isMobileMenuOpen ? "opacity-100 scale-100" : "opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100"
                }`}></div>
                <div className="relative w-6 h-5 flex flex-col justify-between">
                  <span className={`block h-0.5 w-full bg-amber-400 rounded-full transition-all duration-300 origin-center ${
                    isMobileMenuOpen ? "rotate-45 translate-y-2" : ""
                  }`}></span>
                  <span className={`block h-0.5 w-full bg-amber-400 rounded-full transition-all duration-300 ${
                    isMobileMenuOpen ? "opacity-0" : ""
                  }`}></span>
                  <span className={`block h-0.5 w-full bg-amber-400 rounded-full transition-all duration-300 origin-center ${
                    isMobileMenuOpen ? "-rotate-45 -translate-y-2" : ""
                  }`}></span>
                </div>
              </div>
            </button>
            
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="relative flex-shrink-0">
                <Image
                  src="/logo.png"
                  alt="Tracer Logo"
                  width={40}
                  height={40}
                  className="w-10 h-10 object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-sm font-bold bg-gradient-to-r from-slate-100 via-amber-200 to-amber-300 bg-clip-text text-transparent leading-none truncate">
                  {getCurrentPageLabel()}
                </h1>
              </div>
            </div>
          </div>

          {/* User Avatar (optional) */}
          {user && (
            <div className="flex-shrink-0 ml-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-900 font-bold text-sm shadow-lg ring-2 ring-amber-400/30">
                {getUserInitial()}
              </div>
            </div>
          )}
        </div>
        
        {/* Active Indicator */}
        <div className="h-0.5 bg-gradient-to-r from-transparent via-amber-400/50 to-transparent"></div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[42] md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-[#1f2937] border-r border-gray-700/80 z-30 hidden md:flex flex-col shadow-2xl">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={`mobile-menu-container fixed left-0 top-[64px] bottom-0 w-64 bg-[#1f2937] border-r border-gray-700/80 z-[45] md:hidden shadow-2xl transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent onLinkClick={() => setIsMobileMenuOpen(false)} />
      </aside>
    </>
  );
}

