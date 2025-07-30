import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function getServerSupabase() {
  const cookieStore = await cookies() // ✅ Await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name) {
          return cookieStore.get(name)?.value
        },
        async set(name, value, options) {
          cookieStore.set(name, value, options)
        },
        async remove(name, options) {
          cookieStore.delete(name, options)
        },
      },
    }
  )
}
