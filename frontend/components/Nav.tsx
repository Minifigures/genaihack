"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthButton } from "./AuthButton";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import {
  LayoutDashboard,
  Upload,
  FolderSearch,
  Heart,
  Building2,
  ScrollText,
  Shield,
  ShieldCheck,
  LucideIcon,
} from "lucide-react";

const navItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/cases", label: "Cases", icon: FolderSearch },
  { href: "/benefits", label: "Benefits", icon: Heart },
  { href: "/providers", label: "Providers", icon: Building2 },
  { href: "/logs", label: "Audit Log", icon: ScrollText },
  { href: "/governance", label: "AI Governance", icon: ShieldCheck },
];

export function Nav() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const showNav = user || isDemo;

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center gap-2">
              <Link
                href="/"
                className="flex items-center gap-2 text-xl font-bold text-vigil-700"
              >
                <Shield className="w-6 h-6 text-vigil-600" />
                VIGIL
              </Link>
              <span className="text-[10px] font-semibold tracking-wider uppercase text-vigil-600 bg-vigil-50 border border-vigil-200 px-2 py-0.5 rounded-full">
                beta
              </span>
            </div>
            {showNav && (
              <div className="hidden sm:ml-8 sm:flex sm:items-center sm:space-x-1">
                {navItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href));
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`relative inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
                        isActive
                          ? "text-vigil-700 bg-vigil-50"
                          : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                      {isActive && (
                        <span className="absolute -bottom-[13px] left-3 right-3 h-0.5 bg-vigil-600 rounded-full" />
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <AuthButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
