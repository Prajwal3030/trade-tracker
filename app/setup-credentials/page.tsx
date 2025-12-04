"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { setupUsernamePassword, hasUsernamePassword } from "@/lib/userCredentials";

export default function SetupCredentialsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkSetup = async () => {
      if (!loading) {
        if (!user) {
          router.replace("/login");
          return;
        }

        // Check if user already has username/password
        // Allow them to update if they want
        setChecking(false);
      }
    };

    checkSetup();
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!username.trim()) {
      setError("Username is required");
      return;
    }

    if (username.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!user) {
      setError("You must be logged in");
      return;
    }

    setIsLoading(true);

    try {
      await setupUsernamePassword(user, username.trim(), password);
      router.replace("/log");
    } catch (err: any) {
      setError(err.message || "Failed to set up credentials. Please try again.");
      setIsLoading(false);
    }
  };

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#111827] relative overflow-hidden">
        <div className="text-gray-400 z-10">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111827] flex items-center justify-center px-4 py-8 md:py-12 relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#111827] via-[#1a1f2e] to-[#0f1419]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(251,191,36,0.15),transparent_50%)] animate-pulse"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(234,179,8,0.1),transparent_50%)] animate-pulse" style={{ animationDelay: "1s" }}></div>
      </div>

      {/* Setup card */}
      <div className="relative z-10 max-w-md w-full">
        <div className="backdrop-blur-xl bg-gray-900/95 border border-amber-500/20 rounded-2xl md:rounded-3xl shadow-2xl relative overflow-hidden">
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/10 to-transparent animate-shine"></div>
          
          {/* Content wrapper */}
          <div className="relative z-10 px-6 md:px-10 pt-6 md:pt-10 pb-6 md:pb-10">
            <div className="text-center space-y-3 mb-6 md:mb-8">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400 bg-clip-text text-transparent animate-gradient" style={{ backgroundSize: '200% 200%' }}>
                Set Up Your Account
              </h1>
              <p className="text-sm md:text-base text-gray-300/80">
                Create a username and password to access your account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800/50 border border-gray-700/50 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all"
                  placeholder="Choose a username"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800/50 border border-gray-700/50 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all"
                  placeholder="Create a password"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800/50 border border-gray-700/50 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all"
                  placeholder="Confirm your password"
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-6 py-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Setting up..." : "Complete Setup"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

