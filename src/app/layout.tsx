import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TalentHub",
  description: "Multi-tenant talent marketplace platform",
};

import { CartProvider } from "@/context/CartContext";
import NavBar from "@/components/ui/NavBar";
import MobileBottomNav from "@/components/ui/MobileBottomNav";
import { RealtimeProvider } from "@/components/RealtimeProvider";
import Script from "next/script";

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
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />
        <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors">
          {/* Navigation Header */}
          <header className="sticky top-0 z-50 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm">
            <nav className="container mx-auto px-6 py-4 flex items-center justify-between">
              <h1 className="text-xl font-bold">TalentHub</h1>
              <NavBar />
            </nav>
          </header>

          {/* Main Content with bottom padding for mobile nav */}
          <CartProvider>
            <RealtimeProvider>
              <main className="pb-20 md:pb-0">
                {children}
              </main>
            </RealtimeProvider>
          </CartProvider>

          {/* Mobile Bottom Navigation */}
          <MobileBottomNav />
        </div>
      </body>
    </html>
  );
}

