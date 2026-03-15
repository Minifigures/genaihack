"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setError(error.message);
    } else {
      setMessage("Account created! Check your email to confirm, or sign in directly.");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-[70vh] flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        {/* Wordmark */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-7 h-7 bg-primary rounded-sm flex items-center justify-center shrink-0">
            <span className="font-mono text-xs font-semibold text-primary-foreground">V</span>
          </div>
          <span className="font-sans font-semibold text-base tracking-tight text-foreground">VIGIL</span>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <div className="mb-6">
            <h1 className="font-display text-2xl font-normal text-foreground leading-tight">
              Create account
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Already have one?{" "}
              <Link href="/login" className="text-primary hover:opacity-80 transition-opacity">
                Sign in
              </Link>
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSignUp}>
            <div className="space-y-1.5">
              <label className="font-mono text-2xs uppercase tracking-[0.1em] text-muted-foreground">
                Email
              </label>
              <Input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-mono text-2xs uppercase tracking-[0.1em] text-muted-foreground">
                Password
              </label>
              <Input
                type="password"
                required
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <Alert variant="destructive" className="rounded-lg">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}
            {message && (
              <Alert className="rounded-lg border-[hsl(var(--status-resolved-border))] bg-[hsl(var(--status-resolved-bg))]">
                <CheckCircle2 className="h-4 w-4 text-[hsl(var(--status-resolved-fg))]" />
                <AlertDescription className="text-sm text-[hsl(var(--status-resolved-fg))]">
                  {message}
                </AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={loading} className="w-full mt-2">
              {loading ? "Creating account..." : "Sign up"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
