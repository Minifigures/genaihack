"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import DashboardPage from "@/components/Dashboard";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-vigil-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (user) {
    return <DashboardPage />;
  }

  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full relative bg-gray-900 text-white rounded-3xl overflow-hidden shadow-2xl mb-16">
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero.png"
            alt="SecureFlow AI Dashboard Preview"
            fill
            className="object-cover object-center opacity-40 mix-blend-luminosity"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/90 to-transparent z-10"></div>
        </div>
        <div className="relative z-20 px-8 lg:px-16 py-24 md:py-32 w-full max-w-4xl">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            SecureFlow AI
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 font-light mb-10 max-w-2xl leading-relaxed">
            The next generation of intelligent, real-time healthcare billing fraud detection. Protect your enterprise with advanced AI verification.
          </p>
          <div className="flex gap-4">
            <Link
              href="/signup"
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 shadow-lg shadow-blue-500/30"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 px-8 py-4 rounded-xl font-semibold text-lg transition-all"
            >
              Log In
            </Link>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="w-full max-w-5xl mb-16 px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">The Cost of Healthcare Fraud in Canada</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Healthcare billing fraud is a multi-billion dollar problem that affects premiums, resources, and trust in the system.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">$600M - $3.4 Billion Annual Loss</h3>
            <p className="text-gray-600 mb-4 leading-relaxed">
              For private insurers in Canada, fraudulent claims are estimated to range from 2% to 10% of the $34 billion paid out in health claims annually.
            </p>
            <p className="text-xs text-gray-400">Source: Canadian Broadcasting Corporation (CBC)</p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Increased Premiums</h3>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Insurance scams, including those tied to medical and auto claims, add over $1 billion to Canadian insurance premiums annually.
            </p>
            <p className="text-xs text-gray-400">Source: RestoraCare Health</p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Phantom & Upcoding</h3>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Common frauds include billing for services never delivered and intentionally assigning higher billing codes to inflate reimbursement amounts.
            </p>
            <p className="text-xs text-gray-400">Source: GetDefended.ca</p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Collusion & Clinics</h3>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Major insurers have delisted thousands of providers due to false claims, often involving collusion between clinics and employees.
            </p>
            <p className="text-xs text-gray-400">Source: Canadian Broadcasting Corporation (CBC)</p>
          </div>
        </div>
      </section>
    </div>
  );
}
