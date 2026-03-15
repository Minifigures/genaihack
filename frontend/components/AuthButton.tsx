"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  if (user) {
    const initials = user.email?.slice(0, 2).toUpperCase() ?? "ST";
    return (
      <Link href="/profile" className="flex items-center group">
        {/* Square avatar — 4px radius per design system */}
        <div className="w-7 h-7 rounded-sm bg-muted border border-border flex items-center justify-center font-mono text-[11px] font-semibold text-muted-foreground group-hover:border-primary group-hover:text-primary transition-colors">
          {initials}
        </div>
      </Link>
    );
  }

  return (
    <Link
      href="/login"
      className="inline-flex items-center text-sm font-medium text-primary-foreground bg-primary hover:opacity-90 px-3 py-1.5 rounded-md transition-opacity"
    >
      Sign in
    </Link>
  );
}
