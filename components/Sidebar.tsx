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
  { href: "/strategies", label: "Setup / Strategy", key: "strategies" },
  { href: "/fund-accounts", label: "Fund Accounts", key: "fundAccounts" },
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

  if (routeKey === "fundAccounts") {
    // Fund Accounts icon
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/10">
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          aria-hidden="true"
          fill="none"
          stroke={active ? "#10b981" : "#34d399"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
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
        {/* Navigation Links */}
        <nav className="flex-1 p-4 pt-10">
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
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] border-b border-amber-500/20 backdrop-blur-xl shadow-2xl safe-area-top h-16">
        {/* Animated background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-amber-500/5 opacity-50"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(251,191,36,0.1),transparent_50%)]"></div>
        
        <div className="relative flex items-center justify-between px-4 py-2 h-full">
          {/* Logo and Page Title */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="mobile-menu-button flex-shrink-0 relative group"
              aria-label="Toggle menu"
            >
              <div className="relative w-10 h-10 flex items-center justify-center">
                <div className={`absolute inset-0 rounded-xl bg-gradient-to-br from-amber-400/30 to-amber-600/30 blur-md transition-all duration-300 ${
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
              <div className="relative flex-shrink-0 group">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-600/20 blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <Image
                    src="/logo.png"
                    alt="Tracer Logo"
                    width={36}
                    height={36}
                    className="w-9 h-9 object-contain drop-shadow-lg"
                  />
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <h1 className="text-sm font-extrabold bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400 bg-clip-text text-transparent leading-none truncate drop-shadow">
                  {getCurrentPageLabel()}
                </h1>
                <div className="h-1 w-1 rounded-full bg-amber-400 animate-pulse flex-shrink-0"></div>
              </div>
            </div>
          </div>

          {/* User Profile - Mobile */}
          {user && (
            <div className="relative user-menu-container ml-2">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-amber-500/10 border border-transparent hover:border-amber-500/30 transition-all duration-200 group backdrop-blur-sm"
              >
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400/30 to-amber-600/30 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-900 font-bold text-sm shadow-lg ring-1 ring-amber-500/20 group-hover:ring-amber-500/40 transition-all">
                    {getUserInitial()}
                  </div>
                </div>
                <svg
                  className={`w-4 h-4 text-slate-400 group-hover:text-amber-400 transition-all duration-200 ${showUserMenu ? "rotate-180" : ""}`}
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

              {/* Dropdown Menu - Mobile */}
              {showUserMenu && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-gradient-to-br from-[#0b1120] to-[#1e293b] border border-amber-500/20 rounded-xl shadow-2xl overflow-hidden z-50 backdrop-blur-xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent pointer-events-none"></div>
                  <div className="relative p-3 border-b border-amber-500/20">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-900 font-bold text-lg shadow-lg ring-2 ring-amber-500/30">
                        {getUserInitial()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-200 truncate">
                          {getUserName()}
                        </div>
                        <div className="text-xs text-slate-400 truncate">
                          {user.email}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-amber-400/80 font-medium">Signed in as</div>
                    <div className="text-sm font-medium text-slate-300 truncate mt-1">
                      {user.email}
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="relative w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 group"
                  >
                    <svg
                      className="w-5 h-5 transition-transform group-hover:translate-x-1"
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
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Enhanced Active Indicator */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-amber-500/40 via-amber-400/80 to-amber-500/40"></div>
      </header>

      {/* Desktop Top Bar */}
      <header className="hidden md:flex fixed top-0 left-0 right-0 z-40 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] border-b border-amber-500/20 backdrop-blur-xl shadow-2xl">
        {/* Animated background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-amber-500/5 opacity-50"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(251,191,36,0.1),transparent_50%)]"></div>
        
        <div className="relative flex items-center justify-between px-6 py-2.5 w-full h-16">
          {/* Logo and Page Title */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative flex-shrink-0 group">
              {/* Glowing effect around logo */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-amber-400/30 to-amber-600/30 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <Image
                  src="/logo.png"
                  alt="Tracer Logo"
                  width={36}
                  height={36}
                  className="w-9 h-9 object-contain drop-shadow-lg transition-transform duration-300 group-hover:scale-110"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400 bg-clip-text text-transparent leading-none drop-shadow-lg">
                Tracer
              </h1>
              {/* Decorative accent */}
              <div className="h-1 w-1 rounded-full bg-amber-400 animate-pulse"></div>
            </div>
          </div>

          {/* User Profile */}
          {user && (
            <div className="relative user-menu-container">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 px-3 py-1.5 rounded-xl hover:bg-amber-500/10 border border-transparent hover:border-amber-500/30 transition-all duration-200 group backdrop-blur-sm"
              >
                <div className="relative flex-shrink-0">
                  {/* Glow effect */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400/40 to-amber-600/40 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-900 font-bold text-base shadow-lg ring-2 ring-amber-500/20 group-hover:ring-amber-500/40 transition-all">
                    {getUserInitial()}
                  </div>
                </div>
                <div className="hidden lg:block flex-1 min-w-0 text-left">
                  <div className="text-sm font-semibold text-slate-100 truncate group-hover:text-amber-200 transition-colors">
                    {getUserName()}
                  </div>
                  <div className="text-xs text-slate-400 truncate group-hover:text-slate-300 transition-colors">
                    {user.email}
                  </div>
                </div>
                <svg
                  className={`w-4 h-4 text-slate-400 group-hover:text-amber-400 transition-all duration-200 ${showUserMenu ? "rotate-180" : ""}`}
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
                <div className="absolute top-full right-0 mt-3 w-72 bg-gradient-to-br from-[#0b1120] to-[#1e293b] border border-amber-500/20 rounded-xl shadow-2xl overflow-hidden z-50 backdrop-blur-xl">
                  {/* Glow effect on dropdown */}
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent pointer-events-none"></div>
                  <div className="relative p-4 border-b border-amber-500/20">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-900 font-bold text-xl shadow-lg ring-2 ring-amber-500/30">
                        {getUserInitial()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-100 truncate">
                          {getUserName()}
                        </div>
                        <div className="text-xs text-slate-400 truncate mt-0.5">
                          {user.email}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-amber-400/80 font-medium">Signed in as</div>
                    <div className="text-sm font-medium text-slate-300 truncate mt-1">
                      {user.email}
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="relative w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 group"
                  >
                    <svg
                      className="w-5 h-5 transition-transform group-hover:translate-x-1"
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
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Enhanced Active Indicator */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-amber-500/40 via-amber-400/80 to-amber-500/40"></div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[42] md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-16 bottom-0 w-64 bg-[#1f2937] border-r border-gray-700/80 z-30 hidden md:flex flex-col shadow-2xl">
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

