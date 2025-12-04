"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import TradeForm from "@/components/TradeForm";
import { useAuth } from "@/components/AuthProvider";

export default function LogPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#111827] flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111827]">
      <div className="mx-auto px-4 md:px-6 py-4 md:py-6 max-w-7xl">
        <TradeForm />
      </div>
    </div>
  );
}



