"use client"

import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { getClientSideSupabase } from "@/lib/supabase-browser"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Package from "@/components/icons/package" // Custom icon component

const inter = Inter({ subsets: ["latin"] })

interface User {
  id: string
  email: string
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = getClientSideSupabase()

  useEffect(() => {
    const checkInitialSession = async () => {
      const { data } = await supabase.auth.getSession()
      const session = data.session

      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email! })
        if (pathname === "/login") router.push("/")
      } else {
        setUser(null)
        if (pathname !== "/login") router.push("/login")
      }
      setLoading(false)
    }

    checkInitialSession()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email! })
        if (pathname === "/login") router.push("/")
      } else {
        setUser(null)
        if (pathname !== "/login") router.push("/login")
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [router, supabase, pathname])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push("/login")
  }

  if (loading) {
    return (
      <body className={inter.className}>
        <div className="flex min-h-screen items-center justify-center">Loading application...</div>
      </body>
    )
  }

  if (!user && pathname !== "/login") {
    return (
      <body className={inter.className}>
        <div className="flex min-h-screen items-center justify-center">Redirecting to login...</div>
      </body>
    )
  }

  return (
    <body className={inter.className}>
      {user && (
        <nav className="bg-white shadow-lg border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-indigo-600 mr-3" />
                <span className="text-xl font-bold text-gray-900">Inventory Dashboard</span>
              </div>
              <div className="flex items-center space-x-8">
                {["/", "/stock", "/sales", "/pending"].map((path) => (
                  <Link
                    key={path}
                    href={path}
                    className={`font-medium pb-1 ${
                      pathname === path
                        ? "text-indigo-600 border-b-2 border-indigo-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {path === "/" ? "Home" : path.replace("/", "").charAt(0).toUpperCase() + path.slice(2)}
                  </Link>
                ))}
                <Button onClick={handleSignOut} variant="ghost" size="sm">
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </nav>
      )}
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">{children}</main>
    </body>
  )
}
