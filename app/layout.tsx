import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ConditionalSidebar from "@/components/ConditionalSidebar";
import ConditionalMain from "@/components/ConditionalMain";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tracer - Personal Trade Strategy Tracker",
  description: "Log, view, and analyze your trade data for Setup 1 and Setup 2 strategies",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <div className="flex min-h-screen" suppressHydrationWarning>
          <ConditionalSidebar />
          <ConditionalMain>
            {children}
          </ConditionalMain>
        </div>
      </body>
    </html>
  );
}
