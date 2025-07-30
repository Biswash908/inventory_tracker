"use client";

import { useState } from "react";
import { signIn } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const formData = new FormData(e.currentTarget);
    const result = isLogin ? await signIn(formData) : await signUp(formData);

    setLoading(false);
    setMessage(result.message);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded shadow-md w-96">
        <h1 className="text-xl font-bold mb-4">{isLogin ? "Login" : "Sign Up"}</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input name="email" type="email" required />
          </div>
          <div>
            <Label>Password</Label>
            <Input name="password" type="password" required />
          </div>
          {message && (
            <p className={`text-sm ${message.includes("success") ? "text-green-600" : "text-red-600"}`}>
              {message}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Please wait..." : isLogin ? "Login" : "Sign Up"}
          </Button>
        </form>
        <div className="text-center mt-4">
          {isLogin ? (
            <button onClick={() => setIsLogin(false)} className="text-blue-500 text-sm">
              Don't have an account? Sign Up
            </button>
          ) : (
            <button onClick={() => setIsLogin(true)} className="text-blue-500 text-sm">
              Already have an account? Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
