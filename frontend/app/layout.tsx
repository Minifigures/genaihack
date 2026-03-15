import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { AuthGuard } from "@/components/AuthGuard";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "VIGIL - Healthcare Billing Fraud Detection",
  description:
    "Multi-agent system for detecting billing fraud and discovering unused insurance benefits",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <body className={inter.className}>
        <TooltipProvider>
          <div className="min-h-screen bg-background">
            <Nav />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <AuthGuard>{children}</AuthGuard>
            </main>
          </div>
          <Toaster richColors position="top-right" />
        </TooltipProvider>
      </body>
    </html>
  );
}
