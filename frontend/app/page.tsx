"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import DashboardPage from "@/components/Dashboard";
import {
  Shield,
  ArrowRight,
  DollarSign,
  TrendingUp,
  FileText,
  Building,
} from "lucide-react";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

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
        <div className="w-12 h-12 border-4 border-vigil-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (user || isDemo) {
    return <DashboardPage />;
  }

  return (
    <div className="flex flex-col items-center animate-fade-in">
      {/* Hero Section */}
      <section className="w-full relative bg-slate-950 text-white rounded-2xl overflow-hidden shadow-panel mb-16">
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero.png"
            alt="VIGIL Dashboard Preview"
            fill
            className="object-cover object-center opacity-30 mix-blend-luminosity"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900/95 to-slate-950/80 z-10" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-vigil-500/10 rounded-full blur-3xl z-10" />
        </div>
        <div className="relative z-20 px-8 lg:px-16 py-24 md:py-32 w-full max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-vigil-500/10 border border-vigil-500/20 text-vigil-400 text-sm font-medium mb-6">
            <Shield className="w-4 h-4" />
            AI-Powered Healthcare Fraud Detection
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-gradient-vigil">
            VIGIL
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 font-light mb-10 max-w-2xl leading-relaxed">
            The next generation of intelligent, real-time healthcare billing
            fraud detection. Protect your enterprise with advanced AI
            verification.
          </p>
          <div className="flex gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-vigil-600 hover:bg-vigil-500 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 hover:shadow-glow-green"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 backdrop-blur-md text-white border border-white/10 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200"
            >
              Log In
            </Link>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="w-full max-w-5xl mb-16 px-4">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-vigil-600 uppercase tracking-wider mb-2">
            The Problem
          </p>
          <h2 className="text-heading text-slate-900 mb-4">
            The Cost of Healthcare Fraud in Canada
          </h2>
          <p className="text-lg text-slate-500 max-w-3xl mx-auto">
            Healthcare billing fraud is a multi-billion dollar problem that
            affects premiums, resources, and trust in the system.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="card-hover p-8 border-l-4 border-l-red-500">
            <div className="w-10 h-10 bg-red-50 text-red-500 rounded-lg flex items-center justify-center mb-5">
              <DollarSign className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              $600M - $3.4 Billion Annual Loss
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-3">
              For private insurers in Canada, fraudulent claims are estimated to
              range from 2% to 10% of the $34 billion paid out in health claims
              annually.
            </p>
            <p className="text-xs text-slate-400">
              Source: Canadian Broadcasting Corporation (CBC)
            </p>
          </div>

          <div className="card-hover p-8 border-l-4 border-l-orange-500">
            <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-lg flex items-center justify-center mb-5">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Increased Premiums
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-3">
              Insurance scams, including those tied to medical and auto claims,
              add over $1 billion to Canadian insurance premiums annually.
            </p>
            <p className="text-xs text-slate-400">
              Source: RestoraCare Health
            </p>
          </div>

          <div className="card-hover p-8 border-l-4 border-l-blue-500">
            <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center mb-5">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Phantom & Upcoding
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-3">
              Common frauds include billing for services never delivered and
              intentionally assigning higher billing codes to inflate
              reimbursement amounts.
            </p>
            <p className="text-xs text-slate-400">Source: GetDefended.ca</p>
          </div>

          <div className="card-hover p-8 border-l-4 border-l-purple-500">
            <div className="w-10 h-10 bg-purple-50 text-purple-500 rounded-lg flex items-center justify-center mb-5">
              <Building className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Collusion & Clinics
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-3">
              Major insurers have delisted thousands of providers due to false
              claims, often involving collusion between clinics and employees.
            </p>
            <p className="text-xs text-slate-400">
              Source: Canadian Broadcasting Corporation (CBC)
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
