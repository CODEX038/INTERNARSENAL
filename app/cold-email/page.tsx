"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface EmailResult {
  emailId:      string
  subjectLines: string[]
  body:         string
}

function ColdEmailForm() {
  const searchParams = useSearchParams()
  const [loading,  setLoading]  = useState(false)
  const [result,   setResult]   = useState<EmailResult | null>(null)
  const [selected, setSelected] = useState(0)
  const [copied,   setCopied]   = useState(false)
  const [error,    setError]    = useState("")

  const [form, setForm] = useState({
    company:       "",
    recipientType: "hr",
    role:          "",
    yourName:      "",
    yourSkills:    "",
    achievement:   "",
    tone:          "professional",
  })

  useEffect(() => {
    const company = searchParams.get("company")
    if (company) {
      setForm(prev => ({ ...prev, company }))
    }
  }, [searchParams])

  function updateForm(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function generate() {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/cold-email/generate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          yourSkills: form.yourSkills.split(",").map(s => s.trim()).filter(Boolean),
        }),
      })
      const data = await res.json()
      if (data.subjectLines) {
        setResult(data)
        setSelected(0)
      } else {
        setError(data.error ?? "Failed to generate email.")
      }
    } catch {
      setError("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  function copyEmail() {
    if (!result) return
    const full = `Subject: ${result.subjectLines[selected]}\n\n${result.body}`
    navigator.clipboard.writeText(full)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-slate-900 border border-white/10 rounded-xl p-6 space-y-4">
        <h2 className="text-white font-semibold">Email Details</h2>

        <div>
          <Label className="text-slate-300 text-sm">Your Name</Label>
          <Input
            value={form.yourName}
            onChange={e => updateForm("yourName", e.target.value)}
            placeholder="Rahul Sharma"
            className="mt-1 bg-slate-800 border-white/10 text-white"
          />
        </div>

        <div>
          <Label className="text-slate-300 text-sm">Company</Label>
          <Input
            value={form.company}
            onChange={e => updateForm("company", e.target.value)}
            placeholder="Razorpay"
            className="mt-1 bg-slate-800 border-white/10 text-white"
          />
        </div>

        <div>
          <Label className="text-slate-300 text-sm">Role You Want</Label>
          <Input
            value={form.role}
            onChange={e => updateForm("role", e.target.value)}
            placeholder="Frontend Developer Intern"
            className="mt-1 bg-slate-800 border-white/10 text-white"
          />
        </div>

        <div>
          <Label className="text-slate-300 text-sm">Recipient Type</Label>
          <select
            value={form.recipientType}
            onChange={e => updateForm("recipientType", e.target.value)}
            className="mt-1 w-full bg-slate-800 border border-white/10 text-slate-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="hr">HR</option>
            <option value="founder">Founder</option>
            <option value="recruiter">Recruiter</option>
            <option value="hiring_manager">Hiring Manager</option>
          </select>
        </div>

        <div>
          <Label className="text-slate-300 text-sm">Your Skills (comma separated)</Label>
          <Input
            value={form.yourSkills}
            onChange={e => updateForm("yourSkills", e.target.value)}
            placeholder="React, TypeScript, Node.js"
            className="mt-1 bg-slate-800 border-white/10 text-white"
          />
        </div>

        <div>
          <Label className="text-slate-300 text-sm">Key Achievement (optional)</Label>
          <Textarea
            value={form.achievement}
            onChange={e => updateForm("achievement", e.target.value)}
            placeholder="Built an AI platform with 500+ users, won Smart India Hackathon"
            className="mt-1 bg-slate-800 border-white/10 text-white h-20"
          />
        </div>

        <div>
          <Label className="text-slate-300 text-sm">Tone</Label>
          <select
            value={form.tone}
            onChange={e => updateForm("tone", e.target.value)}
            className="mt-1 w-full bg-slate-800 border border-white/10 text-slate-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="professional">Professional</option>
            <option value="friendly">Friendly</option>
            <option value="bold">Bold</option>
          </select>
        </div>

        {error && (
          <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <Button
          onClick={generate}
          disabled={loading || !form.company || !form.role || !form.yourName}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white"
        >
          {loading ? "Generating..." : "Generate Cold Email"}
        </Button>
      </div>

      <div className="bg-slate-900 border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold">Generated Email</h2>
          {result && (
            <Button
              onClick={copyEmail}
              variant="outline"
              className="border-white/10 text-slate-400 text-xs"
            >
              {copied ? "Copied!" : "Copy All"}
            </Button>
          )}
        </div>

        {result ? (
          <div className="space-y-4">
            <div>
              <p className="text-slate-400 text-xs mb-2">Choose subject line:</p>
              <div className="space-y-2">
                {result.subjectLines.map((subject, i) => (
                  <button
                    key={i}
                    onClick={() => setSelected(i)}
                    className={`w-full text-left text-sm px-3 py-2 rounded-lg border transition-colors ${
                      selected === i
                        ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-300"
                        : "border-white/10 bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {subject}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-white/10 pt-4">
              <p className="text-slate-400 text-xs mb-2">Email body:</p>
              <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                {result.body}
              </div>
            </div>

            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              <p className="text-green-400 text-xs">
                This is a one-time professional outreach — not spam.
                Always personalize before sending.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="text-4xl mb-3">✉️</div>
            <p className="text-slate-500 text-sm">
              Fill in the details and click Generate
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ColdEmailPage() {
  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-1">Cold Email</h1>
          <p className="text-slate-400">AI-generated ethical outreach emails</p>
        </div>
        <Suspense fallback={<div className="text-slate-400">Loading...</div>}>
          <ColdEmailForm />
        </Suspense>
      </div>
    </DashboardLayout>
  )
}