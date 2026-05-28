"use client"

import { useState } from "react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface ResumeOutput {
  summary:        string
  skills:         Record<string, string[]>
  projects:       { name: string; tech: string[]; bullets: string[]; url?: string }[]
  education:      Record<string, string>
  certifications: string[]
  keywords:       string[]
  missingKeywords: string[]
  atsScore:       number
}

export default function ResumeBuilderPage() {
  const [step,    setStep]    = useState(1)
  const [loading, setLoading] = useState(false)
  const [resume,  setResume]  = useState<ResumeOutput | null>(null)
  const [error,   setError]   = useState("")

  const [form, setForm] = useState({
    name:           "",
    email:          "",
    city:           "",
    githubUrl:      "",
    linkedinUrl:    "",
    role:           "",
    jobDescription: "",
    skills:         "",
    education:      "",
    projects:       "",
    achievements:   "",
  })

  function updateForm(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function generateResume() {
    setLoading(true)
    setError("")
    try {
      const skillsArray   = form.skills.split(",").map(s => s.trim()).filter(Boolean)
      const projectsArray = form.projects.split("\n").filter(Boolean).map(p => ({
        name:        p,
        description: p,
        tech:        skillsArray.slice(0, 3),
      }))

      const res = await fetch("/api/resume/generate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:           form.name,
          email:          form.email,
          city:           form.city,
          githubUrl:      form.githubUrl,
          linkedinUrl:    form.linkedinUrl,
          role:           form.role,
          jobDescription: form.jobDescription,
          skills:         skillsArray,
          education:      form.education,
          projects:       projectsArray,
          achievements:   form.achievements.split(",").map(s => s.trim()).filter(Boolean),
        }),
      })

      const data = await res.json()
      if (data.resume) {
        setResume(data.resume)
        setStep(3)
      } else {
        setError("Failed to generate resume. Try again.")
      }
    } catch {
      setError("Something went wrong. Try again.")
    } finally {
      setLoading(false)
    }
  }

  function getScoreColor(score: number) {
    if (score >= 80) return "text-green-400"
    if (score >= 60) return "text-yellow-400"
    return "text-red-400"
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-1">Resume Builder</h1>
          <p className="text-slate-400">AI-powered ATS-optimized resume generator</p>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-4 mb-8">
          {[
            { n: 1, label: "Your Info" },
            { n: 2, label: "Job Details" },
            { n: 3, label: "Generated Resume" },
          ].map(s => (
            <div key={s.n} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step >= s.n ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400"
              }`}>
                {s.n}
              </div>
              <span className={`text-sm ${step >= s.n ? "text-white" : "text-slate-500"}`}>
                {s.label}
              </span>
              {s.n < 3 && <div className="w-8 h-px bg-slate-700" />}
            </div>
          ))}
        </div>

        {/* Step 1 — Personal Info */}
        {step === 1 && (
          <div className="bg-slate-900 border border-white/10 rounded-xl p-6">
            <h2 className="text-white font-semibold mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300 text-sm">Full Name</Label>
                <Input
                  value={form.name}
                  onChange={e => updateForm("name", e.target.value)}
                  placeholder="Rahul Sharma"
                  className="mt-1 bg-slate-800 border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm">Email</Label>
                <Input
                  value={form.email}
                  onChange={e => updateForm("email", e.target.value)}
                  placeholder="rahul@college.edu"
                  className="mt-1 bg-slate-800 border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm">City</Label>
                <Input
                  value={form.city}
                  onChange={e => updateForm("city", e.target.value)}
                  placeholder="Mumbai"
                  className="mt-1 bg-slate-800 border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm">GitHub URL</Label>
                <Input
                  value={form.githubUrl}
                  onChange={e => updateForm("githubUrl", e.target.value)}
                  placeholder="https://github.com/username"
                  className="mt-1 bg-slate-800 border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm">LinkedIn URL</Label>
                <Input
                  value={form.linkedinUrl}
                  onChange={e => updateForm("linkedinUrl", e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="mt-1 bg-slate-800 border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm">Education</Label>
                <Input
                  value={form.education}
                  onChange={e => updateForm("education", e.target.value)}
                  placeholder="B.E. CS, VJTI Mumbai, 2025, 8.5 CGPA"
                  className="mt-1 bg-slate-800 border-white/10 text-white"
                />
              </div>
              <div className="md:col-span-2">
                <Label className="text-slate-300 text-sm">Skills (comma separated)</Label>
                <Input
                  value={form.skills}
                  onChange={e => updateForm("skills", e.target.value)}
                  placeholder="React, TypeScript, Node.js, Python, SQL"
                  className="mt-1 bg-slate-800 border-white/10 text-white"
                />
              </div>
              <div className="md:col-span-2">
                <Label className="text-slate-300 text-sm">Projects (one per line)</Label>
                <Textarea
                  value={form.projects}
                  onChange={e => updateForm("projects", e.target.value)}
                  placeholder="InternArsenal - AI internship platform&#10;Portfolio website - Personal portfolio"
                  className="mt-1 bg-slate-800 border-white/10 text-white h-24"
                />
              </div>
              <div className="md:col-span-2">
                <Label className="text-slate-300 text-sm">Achievements (comma separated)</Label>
                <Input
                  value={form.achievements}
                  onChange={e => updateForm("achievements", e.target.value)}
                  placeholder="Hackathon winner, 5 star on HackerRank"
                  className="mt-1 bg-slate-800 border-white/10 text-white"
                />
              </div>
            </div>
            <Button
              onClick={() => setStep(2)}
              disabled={!form.name || !form.email || !form.skills}
              className="mt-6 bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              Next: Job Details
            </Button>
          </div>
        )}

        {/* Step 2 — Job Details */}
        {step === 2 && (
          <div className="bg-slate-900 border border-white/10 rounded-xl p-6">
            <h2 className="text-white font-semibold mb-4">Job Details</h2>
            <div className="space-y-4">
              <div>
                <Label className="text-slate-300 text-sm">Target Role</Label>
                <Input
                  value={form.role}
                  onChange={e => updateForm("role", e.target.value)}
                  placeholder="Frontend Developer Intern"
                  className="mt-1 bg-slate-800 border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm">Job Description</Label>
                <Textarea
                  value={form.jobDescription}
                  onChange={e => updateForm("jobDescription", e.target.value)}
                  placeholder="Paste the full job description here..."
                  className="mt-1 bg-slate-800 border-white/10 text-white h-48"
                />
              </div>
            </div>

            {error && (
              <p className="mt-4 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setStep(1)}
                variant="outline"
                className="border-white/10 text-slate-400"
              >
                Back
              </Button>
              <Button
                onClick={generateResume}
                disabled={loading || !form.role || !form.jobDescription}
                className="bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                {loading ? "Generating with AI..." : "Generate Resume"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3 — Generated Resume */}
        {step === 3 && resume && (
          <div className="space-y-4">
            {/* ATS Score */}
            <div className="bg-slate-900 border border-white/10 rounded-xl p-6 flex items-center justify-between">
              <div>
                <h2 className="text-white font-semibold">ATS Score</h2>
                <p className="text-slate-400 text-sm mt-1">
                  How well your resume matches the job description
                </p>
              </div>
              <div className={`text-5xl font-bold ${getScoreColor(resume.atsScore)}`}>
                {resume.atsScore}
              </div>
            </div>

            {/* Missing Keywords */}
            {resume.missingKeywords.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <p className="text-red-400 font-medium text-sm mb-2">
                  Missing Keywords — add these to improve your score:
                </p>
                <div className="flex flex-wrap gap-2">
                  {resume.missingKeywords.map(kw => (
                    <span key={kw} className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded-full">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="bg-slate-900 border border-white/10 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-2">Professional Summary</h3>
              <p className="text-slate-300 text-sm leading-relaxed">{resume.summary}</p>
            </div>

            {/* Skills */}
            <div className="bg-slate-900 border border-white/10 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-3">Skills</h3>
              {Object.entries(resume.skills).map(([category, skills]) => (
                <div key={category} className="mb-3">
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">{category}</p>
                  <div className="flex flex-wrap gap-2">
                    {(skills as string[]).map(skill => (
                      <span key={skill} className="text-xs bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-1 rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Projects */}
            <div className="bg-slate-900 border border-white/10 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-3">Projects</h3>
              {resume.projects.map((project, i) => (
                <div key={i} className="mb-4 pb-4 border-b border-white/5 last:border-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-white font-medium text-sm">{project.name}</p>
                    <div className="flex gap-1">
                      {project.tech.slice(0, 3).map(t => (
                        <span key={t} className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ul className="space-y-1">
                    {project.bullets.map((bullet, j) => (
                      <li key={j} className="text-slate-400 text-xs flex gap-2">
                        <span className="text-indigo-400 mt-0.5">•</span>
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={() => { setStep(1); setResume(null) }}
                variant="outline"
                className="border-white/10 text-slate-400"
              >
                Generate New
              </Button>
              <Button
                onClick={() => window.print()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                Print / Save PDF
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}