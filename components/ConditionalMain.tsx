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
  // Remove top padding on login page since there's no mobile top bar
  const marginClass = mounted && (pathname === "/" || pathname === "/login") ? "" : "md:ml-64";
  const paddingTopClass = mounted && pathname === "/login" ? "" : "pt-[64px] md:pt-0";

  return (
    <main className={`flex-1 ${marginClass} ${paddingTopClass} w-full max-w-full overflow-x-hidden`} suppressHydrationWarning>
      {children}
    </main>
  );
}

