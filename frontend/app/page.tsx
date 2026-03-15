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
import { ShieldCheck, TrendingUp, FileSearch, Users, Stethoscope, Sparkles, Receipt, BookOpen } from "lucide-react";

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
              Your Student Health Copilot
            </div>
          </BlurFade>
          <BlurFade delay={0.2}>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-white">
              <HyperText className="text-5xl md:text-7xl font-extrabold text-white">
                VIGIL
              </HyperText>
            </h1>
          </BlurFade>
          <BlurFade delay={0.3}>
            <p className="text-xl md:text-2xl text-gray-400 font-light mb-10 max-w-2xl leading-relaxed">
              Make the most of your student health plan. Submit a receipt to see
              what you&apos;re covered for — VIGIL flags anything unusual automatically.
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
                className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 px-8 py-4 rounded-2xl font-semibold text-lg transition-all inline-flex items-center"
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
            { label: "Receipts Reviewed", value: 14200, suffix: "+", icon: FileSearch },
            { label: "Avg Unused Benefits", value: 340, prefix: "$", suffix: "", icon: ShieldCheck },
            { label: "AI Agents", value: 14, suffix: "", icon: Users },
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
              Your UTSU plan works harder with VIGIL
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Over $1,700 in annual health coverage comes with your student fees —
              VIGIL helps you find it, use it, and protect it.
            </p>
          </div>
        </BlurFade>

        <div className="grid md:grid-cols-2 gap-6">
          {[
            { icon: Receipt, color: "blue", title: "Know before you go", desc: "Look up what your UTSU plan covers before your appointment — dental, vision, paramedical, psychology, and prescriptions, all in one place." },
            { icon: Sparkles, color: "green", title: "Get what you're owed", desc: "Submit a receipt and see exactly how much you're entitled to claim back. VIGIL checks your annual limits and calculates your reimbursement." },
            { icon: ShieldCheck, color: "orange", title: "Spot billing errors automatically", desc: "VIGIL's 14 AI agents flag overcharges, split billing, and fees above the ODA guide — so you can follow up with confidence." },
            { icon: BookOpen, color: "purple", title: "Make the most of your plan", desc: "Many students don't use their psychology, vision, or paramedical benefits before they expire. VIGIL reminds you what's left and what to book." },
          ].map((card, i) => (
            <BlurFade key={card.title} delay={0.7 + i * 0.1}>
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all group">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${
                  card.color === "red" ? "bg-red-100 text-red-600" :
                  card.color === "orange" ? "bg-orange-100 text-orange-600" :
                  card.color === "blue" ? "bg-blue-100 text-blue-600" :
                  card.color === "green" ? "bg-emerald-100 text-emerald-600" :
                  "bg-purple-100 text-purple-600"
                }`}>
                  <card.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-emerald-700 transition-colors">
                  {card.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">{card.desc}</p>
              </div>
            </BlurFade>
          ))}
        </div>
      </section>
    </div>
  );
}
