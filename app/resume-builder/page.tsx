"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface ResumeOutput {
  contactInfo:     { name: string; email: string; github: string; linkedin: string; city: string }
  summary:         string
  skills:          Record<string, string[]>
  projects:        { name: string; tech: string[]; bullets: string[]; url?: string }[]
  education:       { degree: string; institution: string; year: string; cgpa: string }
  certifications:  string[]
  keywords:        string[]
  missingKeywords: string[]
  atsScore:        number
}

export default function ResumeBuilderPage() {
  const [step,    setStep]    = useState(1)
  const [loading, setLoading] = useState(false)
  const [resume,  setResume]  = useState<ResumeOutput | null>(null)
  const [error,   setError]   = useState("")

  const [form, setForm] = useState({
    name:           "",
    email:          "",
    phone:          "",
    city:           "",
    githubUrl:      "",
    linkedinUrl:    "",
    role:           "",
    jobDescription: "",
    skills:         "",
    education:      "",
    projects:       "",
    achievements:   "",
    certifications: "",
    objective:      "",
  })

  // Auto-fill from profile
  useEffect(() => {
    async function loadProfile() {
      try {
        const res  = await fetch("/api/profile")
        const data = await res.json()
        if (data.profile) {
          const p = data.profile
          setForm(prev => ({
            ...prev,
            name:        p.name        ?? prev.name,
            email:       p.email       ?? prev.email,
            phone:       p.phone       ?? prev.phone,
            city:        p.city        ?? prev.city,
            githubUrl:   p.githubUrl   ?? prev.githubUrl,
            linkedinUrl: p.linkedinUrl ?? prev.linkedinUrl,
            objective:   p.bio         ?? prev.objective,
            skills:      (p.skills ?? []).join(", "),
            education:   [
              p.degree,
              p.college,
              p.year  ? `Year ${p.year}`  : "",
              p.cgpa  ? `CGPA: ${p.cgpa}` : "",
            ].filter(Boolean).join(", "),
          }))
        }
      } catch {
        console.error("Failed to load profile")
      }
    }
    loadProfile()
  }, [])

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
      if (!res.ok) {
        setError(data.error ?? "Failed to generate resume. Try again.")
        return
      }
      if (data.resume) {
        setResume(data.resume)
        setStep(3)
      } else {
        setError("Failed to generate resume. Try again.")
      }
    } catch {
      setError("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  async function downloadPDF() {
    if (!resume) return
    const { default: jsPDF } = await import("jspdf")
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })

    const W        = 210
    const margin   = 15
    const contentW = W - margin * 2
    let y          = 20

    function addText(text: string, x: number, yPos: number, size: number, style: string = "normal", color: number[] = [0, 0, 0]) {
      doc.setFontSize(size)
      doc.setFont("helvetica", style)
      doc.setTextColor(color[0], color[1], color[2])
      doc.text(text, x, yPos)
    }

    function addWrappedText(text: string, x: number, yPos: number, maxW: number, size: number, style: string = "normal"): number {
      doc.setFontSize(size)
      doc.setFont("helvetica", style)
      doc.setTextColor(0, 0, 0)
      const lines = doc.splitTextToSize(text, maxW)
      doc.text(lines, x, yPos)
      return yPos + lines.length * (size * 0.4)
    }

    function addSectionLine(yPos: number) {
      doc.setDrawColor(0, 0, 0)
      doc.setLineWidth(0.3)
      doc.line(margin, yPos, W - margin, yPos)
    }

    function sectionHeader(title: string, yPos: number): number {
      addText(title.toUpperCase(), margin, yPos, 10, "bold")
      addSectionLine(yPos + 1.5)
      return yPos + 6
    }

    function checkNewPage(yPos: number, needed: number = 15): number {
      if (yPos + needed > 280) {
        doc.addPage()
        return 20
      }
      return yPos
    }

    // NAME
    const name = resume.contactInfo?.name || form.name
    doc.setFontSize(18)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(0, 0, 0)
    doc.text(name, W / 2, y, { align: "center" })
    y += 7

    // Role
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(80, 80, 80)
    doc.text(form.role || "Software Developer", W / 2, y, { align: "center" })
    y += 6

    // Contact line
    const contact = [
      form.city || resume.contactInfo?.city,
      form.phone,
      resume.contactInfo?.email || form.email,
      resume.contactInfo?.github || form.githubUrl,
      resume.contactInfo?.linkedin || form.linkedinUrl,
    ].filter(Boolean).join(" | ")

    doc.setFontSize(8.5)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(60, 60, 60)
    const contactLines = doc.splitTextToSize(contact, contentW)
    doc.text(contactLines, W / 2, y, { align: "center" })
    y += contactLines.length * 4 + 4

    // CAREER OBJECTIVE
    if (form.objective || resume.summary) {
      y = sectionHeader("Career Objective", y)
      y = addWrappedText(form.objective || resume.summary, margin, y, contentW, 9) + 4
    }

    // EDUCATION
    y = checkNewPage(y)
    y = sectionHeader("Education", y)
    if (resume.education) {
      addText(resume.education.degree, margin, y, 9, "bold")
      addText(
        resume.education.year || form.education.split(",").pop()?.trim() || "",
        W - margin, y, 9, "normal", [60, 60, 60]
      )
      y += 4
      addText(resume.education.institution, margin, y, 9, "normal", [60, 60, 60])
      y += 4
      if (resume.education.cgpa) {
        addText(`CGPA: ${resume.education.cgpa}`, margin, y, 9, "normal", [60, 60, 60])
        y += 4
      }
    } else {
      y = addWrappedText(form.education, margin, y, contentW, 9) + 2
    }
    y += 2

    // TECHNICAL SKILLS
    y = checkNewPage(y)
    y = sectionHeader("Technical Skills", y)
    if (resume.skills && Object.keys(resume.skills).length > 0) {
      for (const [category, skills] of Object.entries(resume.skills)) {
        if (!skills || (skills as string[]).length === 0) continue
        const line = `${category.charAt(0).toUpperCase() + category.slice(1)}: ${(skills as string[]).join(", ")}`
        y = checkNewPage(y, 6)
        y = addWrappedText(line, margin, y, contentW, 9) + 2
      }
    } else {
      y = addWrappedText(form.skills, margin, y, contentW, 9) + 2
    }
    y += 2

    // PROJECTS
    if (resume.projects && resume.projects.length > 0) {
      y = checkNewPage(y)
      y = sectionHeader("Projects", y)
      for (const project of resume.projects) {
        y = checkNewPage(y, 20)
        addText(project.name, margin, y, 9, "bold")
        if (project.tech && project.tech.length > 0) {
          const techStr = project.tech.join(", ")
          doc.setFontSize(8.5)
          doc.setFont("helvetica", "normal")
          doc.setTextColor(80, 80, 80)
          const techW = doc.getTextWidth(techStr)
          doc.text(techStr, W - margin - techW, y)
        }
        y += 4
        for (const bullet of project.bullets) {
          y = checkNewPage(y, 6)
          doc.setFontSize(8.5)
          doc.setFont("helvetica", "normal")
          doc.setTextColor(0, 0, 0)
          doc.text("•", margin + 2, y)
          const bulletLines = doc.splitTextToSize(bullet, contentW - 8)
          doc.text(bulletLines, margin + 6, y)
          y += bulletLines.length * 3.8
        }
        y += 3
      }
    }

    // CERTIFICATIONS
    const certs = resume.certifications?.length > 0
      ? resume.certifications
      : form.certifications.split("\n").filter(Boolean)
    if (certs.length > 0) {
      y = checkNewPage(y)
      y = sectionHeader("Certifications", y)
      for (const cert of certs) {
        y = checkNewPage(y, 6)
        doc.setFontSize(8.5)
        doc.text("•", margin + 2, y)
        const certLines = doc.splitTextToSize(cert, contentW - 6)
        doc.text(certLines, margin + 6, y)
        y += certLines.length * 4
      }
      y += 2
    }

    // ACHIEVEMENTS
    if (form.achievements) {
      const achievementList = form.achievements.split(",").map(a => a.trim()).filter(Boolean)
      if (achievementList.length > 0) {
        y = checkNewPage(y)
        y = sectionHeader("Achievements", y)
        for (const achievement of achievementList) {
          y = checkNewPage(y, 6)
          doc.setFontSize(8.5)
          doc.text("•", margin + 2, y)
          const aLines = doc.splitTextToSize(achievement, contentW - 6)
          doc.text(aLines, margin + 6, y)
          y += aLines.length * 4
        }
      }
    }

    const filename = `${(form.name || "Resume").replace(/\s+/g, "_")}_Resume.pdf`
    doc.save(filename)
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
          <p className="text-slate-400">AI-powered ATS-optimized resume — auto-filled from your profile</p>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-4 mb-8">
          {[
            { n: 1, label: "Your Info" },
            { n: 2, label: "Job Details" },
            { n: 3, label: "Generated Resume" },
          ].map((s, i) => (
            <div key={s.n} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step >= s.n ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400"
              }`}>{s.n}</div>
              <span className={`text-sm ${step >= s.n ? "text-white" : "text-slate-500"}`}>{s.label}</span>
              {i < 2 && <div className="w-8 h-px bg-slate-700" />}
            </div>
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="bg-slate-900 border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">Personal Information</h2>
              <span className="text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
                Auto-filled from your profile
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300 text-sm">Full Name</Label>
                <Input value={form.name} onChange={e => updateForm("name", e.target.value)} placeholder="Shreepad Salvi" className="mt-1 bg-slate-800 border-white/10 text-white" />
              </div>
              <div>
                <Label className="text-slate-300 text-sm">Email</Label>
                <Input value={form.email} onChange={e => updateForm("email", e.target.value)} placeholder="you@email.com" className="mt-1 bg-slate-800 border-white/10 text-white" />
              </div>
              <div>
                <Label className="text-slate-300 text-sm">Phone</Label>
                <Input value={form.phone} onChange={e => updateForm("phone", e.target.value)} placeholder="7558674124" className="mt-1 bg-slate-800 border-white/10 text-white" />
              </div>
              <div>
                <Label className="text-slate-300 text-sm">City</Label>
                <Input value={form.city} onChange={e => updateForm("city", e.target.value)} placeholder="Khopoli, Maharashtra" className="mt-1 bg-slate-800 border-white/10 text-white" />
              </div>
              <div>
                <Label className="text-slate-300 text-sm">GitHub URL</Label>
                <Input value={form.githubUrl} onChange={e => updateForm("githubUrl", e.target.value)} placeholder="https://github.com/username" className="mt-1 bg-slate-800 border-white/10 text-white" />
              </div>
              <div>
                <Label className="text-slate-300 text-sm">LinkedIn URL</Label>
                <Input value={form.linkedinUrl} onChange={e => updateForm("linkedinUrl", e.target.value)} placeholder="https://linkedin.com/in/username" className="mt-1 bg-slate-800 border-white/10 text-white" />
              </div>
              <div className="md:col-span-2">
                <Label className="text-slate-300 text-sm">Career Objective</Label>
                <Textarea value={form.objective} onChange={e => updateForm("objective", e.target.value)} placeholder="Motivated Computer Engineering student seeking internship..." className="mt-1 bg-slate-800 border-white/10 text-white h-20" />
              </div>
              <div className="md:col-span-2">
                <Label className="text-slate-300 text-sm">Education</Label>
                <Input value={form.education} onChange={e => updateForm("education", e.target.value)} placeholder="B.E. Computer Engineering, Bharat College of Engineering, 2027, CGPA: 8.5" className="mt-1 bg-slate-800 border-white/10 text-white" />
              </div>
              <div className="md:col-span-2">
                <Label className="text-slate-300 text-sm">Technical Skills (comma separated)</Label>
                <Input value={form.skills} onChange={e => updateForm("skills", e.target.value)} placeholder="Java, Python, React, Node.js, MySQL, MongoDB, Git" className="mt-1 bg-slate-800 border-white/10 text-white" />
              </div>
              <div className="md:col-span-2">
                <Label className="text-slate-300 text-sm">Projects (one per line)</Label>
                <Textarea value={form.projects} onChange={e => updateForm("projects", e.target.value)} placeholder="Driver Drowsiness Detection System&#10;Blockchain Crowdfunding Platform&#10;InternArsenal — AI Internship Platform" className="mt-1 bg-slate-800 border-white/10 text-white h-24" />
              </div>
              <div className="md:col-span-2">
                <Label className="text-slate-300 text-sm">Certifications (one per line)</Label>
                <Textarea value={form.certifications} onChange={e => updateForm("certifications", e.target.value)} placeholder="IJRASET Certificate — Blockchain Crowdfunding Platform" className="mt-1 bg-slate-800 border-white/10 text-white h-16" />
              </div>
              <div className="md:col-span-2">
                <Label className="text-slate-300 text-sm">Achievements (comma separated)</Label>
                <Input value={form.achievements} onChange={e => updateForm("achievements", e.target.value)} placeholder="Smart India Hackathon finalist, 5 star HackerRank" className="mt-1 bg-slate-800 border-white/10 text-white" />
              </div>
            </div>
            <Button onClick={() => setStep(2)} disabled={!form.name || !form.email} className="mt-6 bg-indigo-600 hover:bg-indigo-500 text-white">
              Next: Job Details
            </Button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="bg-slate-900 border border-white/10 rounded-xl p-6">
            <h2 className="text-white font-semibold mb-4">Job Details</h2>
            <div className="space-y-4">
              <div>
                <Label className="text-slate-300 text-sm">Target Role</Label>
                <Input value={form.role} onChange={e => updateForm("role", e.target.value)} placeholder="Frontend Developer Intern" className="mt-1 bg-slate-800 border-white/10 text-white" />
              </div>
              <div>
                <Label className="text-slate-300 text-sm">Job Description — paste the full JD here</Label>
                <Textarea value={form.jobDescription} onChange={e => updateForm("jobDescription", e.target.value)} placeholder="Paste the full job description here. The AI will extract keywords and tailor your resume to match this specific role..." className="mt-1 bg-slate-800 border-white/10 text-white h-48" />
              </div>
            </div>
            {error && (
              <p className="mt-4 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
            )}
            <div className="flex gap-3 mt-6">
              <Button onClick={() => setStep(1)} variant="outline" className="border-white/10 text-slate-400">Back</Button>
              <Button onClick={generateResume} disabled={loading || !form.role || !form.jobDescription} className="bg-indigo-600 hover:bg-indigo-500 text-white">
                {loading ? "Generating with AI..." : "Generate Resume"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && resume && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-white/10 rounded-xl p-6 flex items-center justify-between">
              <div>
                <h2 className="text-white font-semibold">ATS Score</h2>
                <p className="text-slate-400 text-sm mt-1">How well your resume matches the job description</p>
              </div>
              <div className={`text-5xl font-bold ${getScoreColor(resume.atsScore)}`}>{resume.atsScore}</div>
            </div>

            {resume.missingKeywords.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <p className="text-red-400 font-medium text-sm mb-2">Missing Keywords — add these to improve your score:</p>
                <div className="flex flex-wrap gap-2">
                  {resume.missingKeywords.map(kw => (
                    <span key={kw} className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded-full">{kw}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Resume Preview */}
            <div className="bg-white rounded-xl p-8 text-black">
              <div className="text-center mb-4">
                <h1 className="text-2xl font-bold text-black">{resume.contactInfo?.name || form.name}</h1>
                <p className="text-gray-600 text-sm mt-1">{form.role}</p>
                <p className="text-gray-500 text-xs mt-1">
                  {[form.city, form.phone, resume.contactInfo?.email || form.email, form.githubUrl, form.linkedinUrl].filter(Boolean).join(" | ")}
                </p>
              </div>

              {(form.objective || resume.summary) && (
                <div className="mb-4">
                  <h2 className="text-sm font-bold uppercase border-b border-black pb-0.5 mb-2">Career Objective</h2>
                  <p className="text-xs text-gray-700 leading-relaxed">{form.objective || resume.summary}</p>
                </div>
              )}

              {resume.education && (
                <div className="mb-4">
                  <h2 className="text-sm font-bold uppercase border-b border-black pb-0.5 mb-2">Education</h2>
                  <div className="flex justify-between">
                    <p className="text-xs font-semibold">{resume.education.degree}</p>
                    <p className="text-xs text-gray-600">{resume.education.year}</p>
                  </div>
                  <p className="text-xs text-gray-600">{resume.education.institution}</p>
                  {resume.education.cgpa && <p className="text-xs text-gray-600">CGPA: {resume.education.cgpa}</p>}
                </div>
              )}

              {resume.skills && (
                <div className="mb-4">
                  <h2 className="text-sm font-bold uppercase border-b border-black pb-0.5 mb-2">Technical Skills</h2>
                  {Object.entries(resume.skills).map(([cat, skills]) => (
                    (skills as string[]).length > 0 && (
                      <p key={cat} className="text-xs mb-1">
                        <span className="font-semibold capitalize">{cat}: </span>
                        {(skills as string[]).join(", ")}
                      </p>
                    )
                  ))}
                </div>
              )}

              {resume.projects && resume.projects.length > 0 && (
                <div className="mb-4">
                  <h2 className="text-sm font-bold uppercase border-b border-black pb-0.5 mb-2">Projects</h2>
                  {resume.projects.map((project, i) => (
                    <div key={i} className="mb-3">
                      <div className="flex justify-between items-center">
                        <p className="text-xs font-semibold">{project.name}</p>
                        <p className="text-xs text-gray-500">{project.tech?.join(", ")}</p>
                      </div>
                      <ul className="mt-1">
                        {project.bullets?.map((bullet, j) => (
                          <li key={j} className="text-xs text-gray-700 flex gap-1">
                            <span>•</span><span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {(resume.certifications?.length > 0 || form.certifications) && (
                <div className="mb-4">
                  <h2 className="text-sm font-bold uppercase border-b border-black pb-0.5 mb-2">Certifications</h2>
                  {(resume.certifications?.length > 0
                    ? resume.certifications
                    : form.certifications.split("\n").filter(Boolean)
                  ).map((cert, i) => (
                    <p key={i} className="text-xs text-gray-700">• {cert}</p>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button onClick={() => { setStep(1); setResume(null) }} variant="outline" className="border-white/10 text-slate-400">
                Generate New
              </Button>
              <Button onClick={downloadPDF} className="bg-indigo-600 hover:bg-indigo-500 text-white">
                Download PDF
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}