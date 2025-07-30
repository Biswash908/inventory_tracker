import { createClient } from "@supabase/supabase-js"

// Ensure these environment variables are set in your Vercel project settings
// NEXT_PUBLIC_SUPABASE_URL
// NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client (singleton pattern to prevent multiple instances)
let clientSideSupabase: ReturnType<typeof createClient> | null = null
export function getClientSideSupabase() {
  if (!clientSideSupabase) {
    clientSideSupabase = createClient(supabaseUrl, supabaseAnonKey)
  }
  return clientSideSupabase
}

// Server-side Supabase client (for Server Actions)
export const serverSideSupabase = createClient(supabaseUrl, supabaseAnonKey)
