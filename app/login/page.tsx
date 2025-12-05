"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mousePosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!loading && user) {
      router.replace("/log");
    }
  }, [loading, user, router]);

  // Interactive background animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Trading-themed elements
    class TradingElement {
      x: number;
      y: number;
      vx: number;
      vy: number;
      type: 'candle' | 'arrow' | 'trend' | 'symbol';
      size: number;
      color: string;
      opacity: number;
      rotation: number;
      data: number[]; // For candlestick or trend line data
      isGreen: boolean; // For candlestick color
      isUp: boolean; // For arrow direction

      constructor() {
        this.x = Math.random() * (canvas?.width || window.innerWidth);
        this.y = Math.random() * (canvas?.height || window.innerHeight);
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.type = ['candle', 'arrow', 'trend', 'symbol'][Math.floor(Math.random() * 4)] as any;
        this.size = Math.random() * 15 + 10;
        this.rotation = Math.random() * Math.PI * 2;
        this.opacity = Math.random() * 0.4 + 0.2;
        this.isGreen = Math.random() > 0.5;
        this.isUp = Math.random() > 0.5;
        
        const colors = {
          green: "rgba(34, 197, 94, 0.6)",
          red: "rgba(239, 68, 68, 0.6)",
          amber: "rgba(251, 191, 36, 0.5)",
          yellow: "rgba(234, 179, 8, 0.4)",
        };
        this.color = Object.values(colors)[Math.floor(Math.random() * Object.values(colors).length)];
        
        // Generate data for candlesticks or trend lines
        if (this.type === 'candle' || this.type === 'trend') {
          this.data = Array.from({ length: 5 }, () => Math.random() * 20 - 10);
        } else {
          this.data = [];
        }
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += 0.01;

        // Mouse interaction (very subtle)
        const dx = mousePosRef.current.x - this.x;
        const dy = mousePosRef.current.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 100) {
          const force = (100 - distance) / 100;
          this.vx -= (dx / distance) * force * 0.0001;
          this.vy -= (dy / distance) * force * 0.0001;
        }

        // Boundary wrapping
        const canvasWidth = canvas?.width || window.innerWidth;
        const canvasHeight = canvas?.height || window.innerHeight;
        if (this.x < -50) this.x = canvasWidth + 50;
        if (this.x > canvasWidth + 50) this.x = -50;
        if (this.y < -50) this.y = canvasHeight + 50;
        if (this.y > canvasHeight + 50) this.y = -50;

        // Damping
        this.vx *= 0.99;
        this.vy *= 0.99;
      }

      draw() {
        if (!ctx) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = this.opacity;

        switch (this.type) {
          case 'candle':
            this.drawCandlestick(ctx);
            break;
          case 'arrow':
            this.drawArrow(ctx);
            break;
          case 'trend':
            this.drawTrendLine(ctx);
            break;
          case 'symbol':
            this.drawSymbol(ctx);
            break;
        }

        ctx.globalAlpha = 1;
        ctx.restore();
      }

      drawCandlestick(ctx: CanvasRenderingContext2D) {
        const bodyColor = this.isGreen ? "rgba(34, 197, 94, 0.8)" : "rgba(239, 68, 68, 0.8)";
        const wickColor = this.isGreen ? "rgba(34, 197, 94, 0.6)" : "rgba(239, 68, 68, 0.6)";
        
        const bodyHeight = this.size * 0.6;
        const bodyWidth = this.size * 0.4;
        
        // Wick
        ctx.strokeStyle = wickColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -this.size / 2);
        ctx.lineTo(0, this.size / 2);
        ctx.stroke();
        
        // Body
        ctx.fillStyle = bodyColor;
        ctx.fillRect(-bodyWidth / 2, -bodyHeight / 2, bodyWidth, bodyHeight);
      }

      drawArrow(ctx: CanvasRenderingContext2D) {
        const arrowColor = this.isUp ? "rgba(34, 197, 94, 0.7)" : "rgba(239, 68, 68, 0.7)";
        
        ctx.fillStyle = arrowColor;
        ctx.beginPath();
        if (this.isUp) {
          ctx.moveTo(0, -this.size / 2);
          ctx.lineTo(-this.size / 3, this.size / 3);
          ctx.lineTo(0, 0);
          ctx.lineTo(this.size / 3, this.size / 3);
        } else {
          ctx.moveTo(0, this.size / 2);
          ctx.lineTo(-this.size / 3, -this.size / 3);
          ctx.lineTo(0, 0);
          ctx.lineTo(this.size / 3, -this.size / 3);
        }
        ctx.closePath();
        ctx.fill();
      }

      drawTrendLine(ctx: CanvasRenderingContext2D) {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        const step = this.size / (this.data.length - 1);
        for (let i = 0; i < this.data.length; i++) {
          const x = (i * step) - this.size / 2;
          const y = this.data[i];
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      drawSymbol(ctx: CanvasRenderingContext2D) {
        const symbols = ['$', '↑', '↓', '↗', '↘', '%', '₿', '€', '£'];
        const symbol = symbols[Math.floor(Math.random() * symbols.length)];
        
        ctx.fillStyle = this.color;
        ctx.font = `bold ${this.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(symbol, 0, 0);
      }
    }

    const tradingElements: TradingElement[] = [];
    for (let i = 0; i < 50; i++) {
      tradingElements.push(new TradingElement());
    }

    // Connection lines (price connections)
    const drawConnections = () => {
      if (!ctx) return;
      for (let i = 0; i < tradingElements.length; i++) {
        for (let j = i + 1; j < tradingElements.length; j++) {
          const dx = tradingElements[i].x - tradingElements[j].x;
          const dy = tradingElements[i].y - tradingElements[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            ctx.beginPath();
            ctx.moveTo(tradingElements[i].x, tradingElements[i].y);
            ctx.lineTo(tradingElements[j].x, tradingElements[j].y);
            ctx.strokeStyle = `rgba(251, 191, 36, ${0.15 * (1 - distance / 150)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    };

    let animationId: number;
    const animate = () => {
      if (!ctx) return;
      ctx.fillStyle = "rgba(17, 24, 39, 0.1)";
      ctx.fillRect(0, 0, canvas?.width || window.innerWidth, canvas?.height || window.innerHeight);

      tradingElements.forEach((element) => {
        element.update();
        element.draw();
      });

      drawConnections();

      animationId = requestAnimationFrame(animate);
    };

    animate();

    // Mouse move handler (throttled)
    let lastUpdate = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastUpdate > 16) { // Throttle to ~60fps
        mousePosRef.current = { x: e.clientX, y: e.clientY };
        lastUpdate = now;
      }
    };
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationId);
    };
  }, []);

  const handleGoogleLogin = async () => {
    if (!auth) {
      alert("Firebase Authentication is not configured. Please check your environment variables and ensure Firebase Auth is enabled in your Firebase Console.");
      return;
    }

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.replace("/log");
    } catch (error: any) {
      // Silently handle user cancellation - don't show error
      if (error?.code === "auth/cancelled-popup-request" || error?.code === "auth/popup-closed-by-user") {
        return;
      }
      
      console.error("Error during Google sign-in:", error);
      const errorMessage = error?.code === "auth/configuration-not-found"
        ? "Firebase Auth is not properly configured. Please check your .env.local file and ensure Google Sign-In is enabled in Firebase Console."
        : error?.message || "Failed to sign in. Please try again.";
      alert(errorMessage);
    }
  };

  if (loading || user) {
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
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(217,119,6,0.08),transparent_60%)] animate-pulse" style={{ animationDelay: "2s" }}></div>
      </div>

      {/* Interactive canvas background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ mixBlendMode: "screen" }}
      />

      {/* Floating geometric shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }}></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-amber-400/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "4s" }}></div>
      </div>

      {/* Login card with glassmorphism */}
      <div className="relative z-10 max-w-md w-full">
        <div className="backdrop-blur-xl bg-gray-900/95 border border-amber-500/20 rounded-2xl md:rounded-3xl shadow-2xl relative overflow-hidden">
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/10 to-transparent animate-shine"></div>
          
          {/* Content wrapper with uniform padding */}
          <div className="relative z-10 px-6 md:px-10 pt-6 md:pt-10 pb-6 md:pb-10">
            <div className="text-center space-y-3 mb-6 md:mb-8">
              <div className="inline-block">
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400 bg-clip-text text-transparent animate-gradient" style={{ backgroundSize: '200% 200%' }}>
                  Sign in to Tracer
                </h1>
              </div>
              <p className="text-sm md:text-base text-gray-300/80">
                Log in to access your personal trade journal and analytics.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full group relative inline-flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-white text-gray-900 font-semibold hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] text-base md:text-lg overflow-hidden mb-6 md:mb-8"
            >
              {/* Button shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              <svg className="w-6 h-6 relative z-10" viewBox="0 0 533.5 544.3" aria-hidden="true">
                <path
                  fill="#4285f4"
                  d="M533.5 278.4c0-17.4-1.5-34.1-4.3-50.4H272v95.4h146.9c-6.4 34.6-25.7 63.9-54.7 83.4v68h88.4c51.7-47.6 80.9-117.8 80.9-196.4z"
                />
                <path
                  fill="#34a853"
                  d="M272 544.3c73.5 0 135.3-24.3 180.4-66.1l-88.4-68c-24.6 16.5-56.1 26.3-92 26.3-70.8 0-130.7-47.9-152.3-112.3H28.2v70.6C73.5 492.9 167.6 544.3 272 544.3z"
                />
                <path
                  fill="#fbbc04"
                  d="M119.7 324.2c-10.1-30-10.1-62.7 0-92.7v-70.6H28.2c-36.6 72.9-36.6 159.1 0 232z"
                />
                <path
                  fill="#ea4335"
                  d="M272 107.7c38.9-.6 76.3 14 104.4 40.7l77.7-77.7C407.3 24.6 345.5.3 272 0 167.6 0 73.5 51.4 28.2 148.8l91.5 70.6C141.3 155.6 201.2 107.7 272 107.7z"
                />
              </svg>
              <span className="relative z-10">Continue with Google</span>
            </button>

            <p className="text-xs md:text-sm text-gray-400/70 text-center">
              Your trades are stored securely and are only visible to you when you are
              signed in.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


