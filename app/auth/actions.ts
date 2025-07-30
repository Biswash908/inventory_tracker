"use server"

import { redirect } from "next/navigation"
import { getServerSupabase } from "@/lib/supabase-server"

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { success: false, message: "Email and password are required" }
  }

  const supabase = await getServerSupabase()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { success: false, message: error.message }
  }

  // ✅ Redirect to dashboard after successful sign-in
  redirect("/")
}

export async function signOut() {
  const supabase = await getServerSupabase()
  // Only sign out on the server, let the client-side handle the redirect
  await supabase.auth.signOut()
  // DO NOT redirect here. The client-side ClientLayout will handle the redirect.
}
