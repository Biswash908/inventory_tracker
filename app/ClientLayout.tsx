"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getClientSideSupabase } from "@/lib/supabase"
import { signOut } from "@/app/auth/actions"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Package } from "lucide-react"

interface User {
  id: string
  email: string
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = getClientSideSupabase()

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email! })
      } else {
        setUser(null)
        router.push("/login")
      }
      setLoading(false)
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email! })
      } else {
        router.push("/login")
      }
      setLoading(false)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [router, supabase])

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>
  }

  return (
    <>
      {user && (
        <nav className="bg-white shadow-lg border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-indigo-600 mr-3" />
                <span className="text-xl font-bold text-gray-900">Inventory Dashboard</span>
              </div>
              <div className="flex items-center space-x-8">
                <Link href="/" className="text-gray-500 hover:text-gray-700 font-medium">
                  Home
                </Link>
                <Link href="/stock" className="text-gray-500 hover:text-gray-700 font-medium">
                  Stock
                </Link>
                <Link href="/sales" className="text-gray-500 hover:text-gray-700 font-medium">
                  Sales
                </Link>
                <Link href="/pending" className="text-gray-500 hover:text-gray-700 font-medium">
                  Pending
                </Link>
                <Button onClick={() => signOut()} variant="ghost" size="sm">
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </nav>
      )}
      <div>{children}</div>
    </>
  )
}
