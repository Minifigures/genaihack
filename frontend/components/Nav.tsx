"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthButton } from "./AuthButton";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Upload,
  ShieldAlert,
  Heart,
  MapPin,
  ScrollText,
  Shield,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/benefits", label: "Benefits", icon: Heart },
  { href: "/clinics", label: "Clinics", icon: MapPin },
  { href: "/cases", label: "Cases", icon: ShieldAlert },
  { href: "/logs", label: "Audit Log", icon: ScrollText },
];

export function Nav() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

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

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 mr-8 text-xl font-bold text-emerald-700">
              <Shield className="w-6 h-6 text-emerald-600" />
              VIGIL
              <span className="text-[10px] font-semibold tracking-wider uppercase text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                beta
              </span>
            </Link>
            {user && (
              <div className="hidden sm:flex items-center gap-1">
                {navItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "relative inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                        isActive
                          ? "text-emerald-700 bg-emerald-50"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                      {isActive && (
                        <span className="absolute -bottom-[13px] left-3 right-3 h-0.5 bg-emerald-600 rounded-full" />
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
