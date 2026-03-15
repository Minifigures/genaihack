"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, LogIn } from "lucide-react";

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg">
          <div className="w-6 h-6 rounded-full bg-vigil-100 flex items-center justify-center">
            <span className="text-xs font-semibold text-vigil-700">
              {user.email?.[0]?.toUpperCase()}
            </span>
          </div>
          <span className="text-sm text-slate-600 hidden md:inline">
            {user.email}
          </span>
        </div>
        <button
          onClick={handleSignOut}
          className="btn-ghost text-slate-500 hover:text-red-600"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <Link href="/login" className="btn-primary text-sm">
      <LogIn className="w-4 h-4" />
      Sign in
    </Link>
  );
}
