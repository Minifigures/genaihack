import type { Metadata } from "next";
import { DM_Serif_Display, Sora, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { AuthGuard } from "@/components/AuthGuard";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ChatWidget } from "@/components/chat-widget";

// Display serif — page titles only
const displayFont = DM_Serif_Display({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-display",
  display: "swap",
});

// Refined grotesque — all UI text
const sansFont = Sora({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

// Monospace — IDs, codes, amounts, section labels
const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "VIGIL — Your Student Health Copilot",
  description:
    "Make the most of your student health plan. Submit a receipt to see what you're covered for.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${displayFont.variable} ${sansFont.variable} ${monoFont.variable}`}>
      <body className={sansFont.className}>
        <TooltipProvider>
          <div className="min-h-screen bg-slate-50/80">
            <Nav />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <AuthGuard>
                {children}
              </AuthGuard>
            </main>
            <Footer />
          </div>
          <ChatWidget />
          <Toaster richColors position="top-right" />
        </TooltipProvider>
      </body>
    </html>
  );
}
