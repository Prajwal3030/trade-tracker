"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function ConditionalMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Remove left margin on landing page when sidebar is hidden
  const marginClass = mounted && pathname === "/" ? "" : "md:ml-64";

  return (
    <main className={`flex-1 ${marginClass}`} suppressHydrationWarning>
      {children}
    </main>
  );
}

