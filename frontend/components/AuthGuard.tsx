"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase, supabaseConfigured } from "@/lib/supabase";

const PUBLIC_ROUTES = ["/", "/login", "/signup"];

// In demo mode (no Supabase configured, or NEXT_PUBLIC_DEMO_MODE=true) every
// route is accessible without a session.
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true" || !supabaseConfigured;

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(!DEMO_MODE);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (DEMO_MODE) {
      setLoading(false);
      return;
    }

    let mounted = true;

    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (mounted) {
        if (!session && !PUBLIC_ROUTES.includes(pathname)) {
          router.push("/login");
        } else {
          setLoading(false);
        }
      }
    }

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        if (!session && !PUBLIC_ROUTES.includes(pathname)) {
          router.push("/login");
        } else if (session && (pathname === "/login" || pathname === "/signup")) {
          router.push("/");
        } else {
          setLoading(false);  
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-vigil-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return <>{children}</>;
}
