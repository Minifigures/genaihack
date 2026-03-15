"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import DashboardPage from "@/components/Dashboard";
import { FlickeringGrid } from "@/components/ui/flickering-grid";
import { HyperText } from "@/components/ui/hyper-text";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { NumberTicker } from "@/components/ui/number-ticker";
import { BlurFade } from "@/components/ui/blur-fade";
import { ShieldCheck, TrendingUp, FileSearch, Users, DollarSign, AlertTriangle, FileText, Building2 } from "lucide-react";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return <DashboardPage />;
  }

  return (
    <div className="flex flex-col items-center -mt-8 -mx-4 sm:-mx-6 lg:-mx-8">
      {/* Hero Section */}
      <section className="w-full relative overflow-hidden">
        <div className="absolute inset-0 z-0 bg-gray-950">
          <FlickeringGrid
            className="absolute inset-0 z-0"
            squareSize={4}
            gridGap={6}
            color="#22c55e"
            maxOpacity={0.15}
            flickerChance={0.3}
          />
        </div>
        <div className="relative z-10 px-8 lg:px-16 py-28 md:py-40 max-w-5xl mx-auto">
          <BlurFade delay={0.1}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-sm font-medium mb-8">
              <ShieldCheck className="w-4 h-4" />
              Built for Students, Powered by AI
            </div>
          </BlurFade>
          <BlurFade delay={0.2}>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-white">
              <HyperText className="text-5xl md:text-7xl font-extrabold text-white">
                SecureFlow AI
              </HyperText>
            </h1>
          </BlurFade>
          <BlurFade delay={0.3}>
            <p className="text-xl md:text-2xl text-gray-400 font-light mb-10 max-w-2xl leading-relaxed">
              Protect your student health benefits from billing fraud. Upload receipts, discover unused coverage, and find trusted clinics near campus.
            </p>
          </BlurFade>
          <BlurFade delay={0.4}>
            <div className="flex gap-4 flex-wrap">
              <Link href="/signup">
                <ShimmerButton
                  className="px-8 py-4 text-lg font-semibold"
                  shimmerColor="#22c55e"
                  shimmerSize="0.1em"
                  background="rgba(22, 163, 74, 0.9)"
                >
                  Get Started
                </ShimmerButton>
              </Link>
              <Link
                href="/login"
                className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 px-8 py-4 rounded-xl font-semibold text-lg transition-all inline-flex items-center"
              >
                Log In
              </Link>
            </div>
          </BlurFade>
        </div>
      </section>

      {/* Stats Section */}
      <section className="w-full max-w-6xl px-4 -mt-12 z-20 relative">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Students Protected", value: 2400, suffix: "+", icon: Users },
            { label: "Savings Found", value: 847, prefix: "$", suffix: "K", icon: ShieldCheck },
            { label: "Clinics Listed", value: 120, suffix: "+", icon: FileSearch },
            { label: "Accuracy Rate", value: 98.7, suffix: "%", icon: TrendingUp, decimals: 1 },
          ].map((stat, i) => (
            <BlurFade key={stat.label} delay={0.5 + i * 0.1}>
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg shadow-gray-200/50 text-center">
                <stat.icon className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                <div className="text-2xl md:text-3xl font-bold text-gray-900">
                  {stat.prefix || ""}
                  <NumberTicker value={stat.value} decimalPlaces={stat.decimals || 0} />
                  {stat.suffix}
                </div>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </div>
            </BlurFade>
          ))}
        </div>
      </section>

      {/* Info Section */}
      <section className="w-full max-w-5xl mb-16 px-4 mt-20">
        <BlurFade delay={0.6}>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              The Cost of Healthcare Fraud in Canada
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Healthcare billing fraud is a multi-billion dollar problem that
              affects premiums, resources, and trust in the system.
            </p>
          </div>
        </BlurFade>

        <div className="grid md:grid-cols-2 gap-6">
          {[
            { icon: DollarSign, color: "red", title: "$600M - $3.4 Billion Annual Loss", desc: "For private insurers in Canada, fraudulent claims are estimated to range from 2% to 10% of the $34 billion paid out in health claims annually.", source: "Canadian Broadcasting Corporation (CBC)" },
            { icon: AlertTriangle, color: "orange", title: "Increased Premiums", desc: "Insurance scams, including those tied to medical and auto claims, add over $1 billion to Canadian insurance premiums annually.", source: "RestoraCare Health" },
            { icon: FileText, color: "blue", title: "Phantom & Upcoding", desc: "Common frauds include billing for services never delivered and intentionally assigning higher billing codes to inflate reimbursement amounts.", source: "GetDefended.ca" },
            { icon: Building2, color: "purple", title: "Collusion & Clinics", desc: "Major insurers have delisted thousands of providers due to false claims, often involving collusion between clinics and employees.", source: "Canadian Broadcasting Corporation (CBC)" },
          ].map((card, i) => (
            <BlurFade key={card.title} delay={0.7 + i * 0.1}>
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all group">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${
                  card.color === "red" ? "bg-red-100 text-red-600" :
                  card.color === "orange" ? "bg-orange-100 text-orange-600" :
                  card.color === "blue" ? "bg-blue-100 text-blue-600" :
                  "bg-purple-100 text-purple-600"
                }`}>
                  <card.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-emerald-700 transition-colors">
                  {card.title}
                </h3>
                <p className="text-gray-600 mb-4 leading-relaxed">{card.desc}</p>
                <p className="text-xs text-gray-400">Source: {card.source}</p>
              </div>
            </BlurFade>
          ))}
        </div>
      </section>
    </div>
  );
}
