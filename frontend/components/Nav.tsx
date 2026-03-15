"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthButton } from "./AuthButton";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";
import { Upload, FileText, Heart, LayoutDashboard } from "lucide-react";

const navItems = [
  { href: "/",        label: "Home",             icon: LayoutDashboard },
  { href: "/upload",  label: "Submit a Receipt", icon: Upload },
  { href: "/cases",   label: "My Claims",        icon: FileText },
  { href: "/benefits",label: "My Plan",          icon: Heart },
];

export function Nav() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );
    return () => subscription.unsubscribe();
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5">
              {/* Monogram mark */}
              <div className="w-6 h-6 bg-primary rounded-sm flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-primary-foreground tracking-tight leading-none">V</span>
              </div>
              <span className="font-sans text-sm font-semibold tracking-tight text-foreground">
                VIGIL
              </span>
              <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm border border-border">
                beta
              </span>
            </Link>

            {/* Nav items — authenticated only */}
            {user && (
              <div className="hidden sm:flex items-center">
                {navItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "relative inline-flex items-center gap-1.5 px-3 h-14 text-sm transition-colors",
                        isActive
                          ? "text-foreground font-medium"
                          : "text-muted-foreground hover:text-foreground font-normal"
                      )}
                    >
                      {item.label}
                      {/* Active indicator: 2px bottom border */}
                      {isActive && (
                        <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-primary" />
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: auth */}
          <div className="flex items-center">
            <AuthButton />
          </div>

        </div>
      </div>
    </nav>
  );
}
