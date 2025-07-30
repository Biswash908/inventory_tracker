"use server"

import { serverSideSupabase } from "@/lib/supabase"
import { redirect } from "next/navigation"

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const supabase = serverSideSupabase

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_VERCEL_URL}/auth/callback`, // Adjust if you have a custom callback URL
    },
  })

  if (error) {
    console.error("Sign up error:", error.message)
    return { success: false, message: error.message }
  }

  return { success: true, message: "Check your email for a confirmation link!" }
}

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const supabase = serverSideSupabase

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error("Sign in error:", error.message)
    return { success: false, message: error.message }
  }

  redirect("/") // Redirect to dashboard on successful login
}

export async function signOut() {
  const supabase = serverSideSupabase
  await supabase.auth.signOut()
  redirect("/login")
}
