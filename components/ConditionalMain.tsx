"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function ConditionalMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Remove left margin on landing page and login page when sidebar is hidden
  // On mobile, never add left margin
  const marginClass = mounted && (pathname === "/" || pathname === "/login") ? "" : "md:ml-64";

  return (
    <main className={`flex-1 ${marginClass} pt-[64px] md:pt-0`} suppressHydrationWarning>
      {children}
    </main>
  );
}

