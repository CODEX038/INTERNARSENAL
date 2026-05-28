"use client"

import { useState } from "react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function CoverLetterPage() {
  const [loading,  setLoading]  = useState(false)
  const [content,  setContent]  = useState("")
  const [copied,   setCopied]   = useState(false)
  const [error,    setError]    = useState("")

  const [form, setForm] = useState({
    company:        "",
    role:           "",
    yourName:       "",
    skills:         "",
    topProject:     "",
    tone:           "professional",
    companyContext: "",
  })

  function updateForm(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function generate() {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/cover-letter/generate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          skills: form.skills.split(",").map(s => s.trim()).filter(Boolean),
        }),
      })
      const data = await res.json()
      if (data.content) {
        setContent(data.content)
      } else {
        setError("Failed to generate. Try again.")
      }
    } catch {
      setError("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-1">Cover Letter</h1>
          <p className="text-slate-400">AI-generated personalized cover letters</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <div className="bg-slate-900 border border-white/10 rounded-xl p-6 space-y-4">
            <h2 className="text-white font-semibold">Details</h2>

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
              <Label className="text-slate-300 text-sm">Company Name</Label>
              <Input
                value={form.company}
                onChange={e => updateForm("company", e.target.value)}
                placeholder="Razorpay"
                className="mt-1 bg-slate-800 border-white/10 text-white"
              />
            </div>

            <div>
              <Label className="text-slate-300 text-sm">Role</Label>
              <Input
                value={form.role}
                onChange={e => updateForm("role", e.target.value)}
                placeholder="Frontend Developer Intern"
                className="mt-1 bg-slate-800 border-white/10 text-white"
              />
            </div>

            <div>
              <Label className="text-slate-300 text-sm">Your Skills (comma separated)</Label>
              <Input
                value={form.skills}
                onChange={e => updateForm("skills", e.target.value)}
                placeholder="React, TypeScript, Node.js"
                className="mt-1 bg-slate-800 border-white/10 text-white"
              />
            </div>

            <div>
              <Label className="text-slate-300 text-sm">Your Best Project</Label>
              <Textarea
                value={form.topProject}
                onChange={e => updateForm("topProject", e.target.value)}
                placeholder="Built InternArsenal — an AI internship platform using Next.js and GPT-4o with 500+ users"
                className="mt-1 bg-slate-800 border-white/10 text-white h-20"
              />
            </div>

            <div>
              <Label className="text-slate-300 text-sm">About Company (optional)</Label>
              <Input
                value={form.companyContext}
                onChange={e => updateForm("companyContext", e.target.value)}
                placeholder="Razorpay is India's leading payment gateway..."
                className="mt-1 bg-slate-800 border-white/10 text-white"
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
              {loading ? "Generating..." : "Generate Cover Letter"}
            </Button>
          </div>

          {/* Preview */}
          <div className="bg-slate-900 border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">Generated Letter</h2>
              {content && (
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  className="border-white/10 text-slate-400 text-xs"
                >
                  {copied ? "Copied!" : "Copy"}
                </Button>
              )}
            </div>

            {content ? (
              <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                {content}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="text-4xl mb-3">📝</div>
                <p className="text-slate-500 text-sm">
                  Fill in the details and click Generate
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}