import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// True only when real Supabase credentials are present. When false, the app
// runs in demo mode and we hand back a no-op stub so importing this module
// never throws (createClient throws on undefined url/key, which would crash
// every page that imports it).
export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

function createStubClient(): SupabaseClient {
  const noSession = { data: { session: null }, error: null };
  const authError = { message: "Authentication is disabled in demo mode." };
  const stub = {
    auth: {
      getSession: async () => noSession,
      getUser: async () => ({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
      signInWithPassword: async () => ({ data: { user: null, session: null }, error: authError }),
      signUp: async () => ({ data: { user: null, session: null }, error: authError }),
      signOut: async () => ({ error: null }),
    },
  };
  return stub as unknown as SupabaseClient;
}

export const supabase: SupabaseClient = supabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : createStubClient();
