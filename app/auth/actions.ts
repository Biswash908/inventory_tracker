"use server"

import { getServerSupabase } from "@/lib/supabase-server"
import { redirect } from "next/navigation"

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  const supabase = await getServerSupabase() // ✅ Await here

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { success: false, message: error.message }
  }

  redirect("/")
}

export async function signOut() {
  const supabase = await getServerSupabase() // ✅ Await here
  await supabase.auth.signOut()
  redirect("/login")
}
