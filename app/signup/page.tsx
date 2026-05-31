"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SignupPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSignup() {
    setLoading(true)
    setError("")

    const { error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: { name },
    emailRedirectTo: `${window.location.origin}/auth/callback`,
  },
})

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-2xl p-8 text-center">
          <div className="text-4xl mb-4">📧</div>
          <h1 className="text-white text-xl font-bold mb-2">Check your email</h1>
          <p className="text-slate-400 text-sm mb-6">
            We sent a confirmation link to <span className="text-indigo-400">{email}</span>. 
            Click it to activate your account.
          </p>
          <Link href="/login">
            <Button className="w-full bg-indigo-600 hover:bg-indigo-500">
              Go to Login
            </Button>
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-2xl p-8">
        <div className="mb-8">
          <Link href="/" className="text-white font-bold text-lg">
            Intern<span className="text-indigo-400">Arsenal</span>
          </Link>
          <h1 className="text-white text-2xl font-bold mt-6 mb-1">Create account</h1>
          <p className="text-slate-400 text-sm">Start finding internships today</p>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-slate-300 text-sm">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Rahul Sharma"
              value={name}
              onChange={e => setName(e.target.value)}
              className="mt-1 bg-slate-800 border-white/10 text-white placeholder:text-slate-500"
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-slate-300 text-sm">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@college.edu"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="mt-1 bg-slate-800 border-white/10 text-white placeholder:text-slate-500"
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-slate-300 text-sm">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Min. 6 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="mt-1 bg-slate-800 border-white/10 text-white placeholder:text-slate-500"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <Button
            onClick={handleSignup}
            disabled={loading || !name || !email || !password}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            {loading ? "Creating account..." : "Create Account"}
          </Button>
        </div>

        <p className="text-slate-400 text-sm text-center mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}