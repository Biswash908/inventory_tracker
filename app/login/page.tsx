"use client"

import { useState } from "react"
import { signIn, signUp } from "@/app/auth/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
  const [isLoginMode, setIsLoginMode] = useState(true)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const formData = new FormData(e.currentTarget)

    const response = isLoginMode ? await signIn(formData) : await signUp(formData)

    if (response?.message) {
      setMessage(response.message)
    }

    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">{isLoginMode ? "Login" : "Sign Up"}</CardTitle>
          <CardDescription>
            {isLoginMode ? "Access your inventory dashboard" : "Create an account to manage your inventory"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required placeholder="you@example.com" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required placeholder="••••••••" />
            </div>

            {message && (
              <p className={`text-sm ${message.includes("Check your email") ? "text-green-500" : "text-red-500"}`}>
                {message}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoginMode ? "Log In" : "Sign Up"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            {isLoginMode ? (
              <>
                Don't have an account?{" "}
                <Button variant="link" onClick={() => setIsLoginMode(false)} className="p-0 h-auto">
                  Sign Up
                </Button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Button variant="link" onClick={() => setIsLoginMode(true)} className="p-0 h-auto">
                  Log In
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
