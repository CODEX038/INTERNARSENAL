"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface Resume {
  id:              string
  title:           string
  role:            string
  atsScore:        number | null
  keywords:        string[]
  missingKeywords: string[]
  createdAt:       string
  content:         any
}

interface CoverLetter {
  id:        string
  title:     string
  company:   string
  role:      string
  tone:      string | null
  content:   string
  createdAt: string
}

interface ColdEmail {
  id:            string
  subject:       string
  body:          string
  status:        string
  recipientType: string
  createdAt:     string
}

const ATS_COLOR = (score: number) => {
  if (score >= 80) return "text-green-400"
  if (score >= 60) return "text-yellow-400"
  return "text-red-400"
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT:            "bg-slate-500/10 text-slate-400",
  SENT:             "bg-blue-500/10 text-blue-400",
  REPLIED:          "bg-green-500/10 text-green-400",
  FOLLOW_UP_NEEDED: "bg-yellow-500/10 text-yellow-400",
  REJECTED:         "bg-red-500/10 text-red-400",
}

export default function LibraryPage() {
  const [tab,          setTab]          = useState<"resumes" | "coverLetters" | "coldEmails">("resumes")
  const [resumes,      setResumes]      = useState<Resume[]>([])
  const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([])
  const [coldEmails,   setColdEmails]   = useState<ColdEmail[]>([])
  const [loading,      setLoading]      = useState(true)
  const [preview,      setPreview]      = useState<string | null>(null)
  const [previewTitle, setPreviewTitle] = useState("")

  useEffect(() => {
    async function fetch_() {
      try {
        const res  = await fetch("/api/library")
        const data = await res.json()
        setResumes(data.resumes ?? [])
        setCoverLetters(data.coverLetters ?? [])
        setColdEmails(data.coldEmails ?? [])
      } finally {
        setLoading(false)
      }
    }
    fetch_()
  }, [])

  async function deleteItem(id: string, type: string) {
    if (!confirm("Delete this item?")) return
    try {
      await fetch(`/api/library?id=${id}&type=${type}`, { method: "DELETE" })
      if (type === "resume")      setResumes(prev => prev.filter(r => r.id !== id))
      if (type === "coverLetter") setCoverLetters(prev => prev.filter(c => c.id !== id))
      if (type === "coldEmail")   setColdEmails(prev => prev.filter(e => e.id !== id))
    } catch {
      console.error("Failed to delete")
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    alert("Copied to clipboard!")
  }

  const tabs = [
    { id: "resumes",      label: "Resumes",       count: resumes.length      },
    { id: "coverLetters", label: "Cover Letters",  count: coverLetters.length },
    { id: "coldEmails",   label: "Cold Emails",    count: coldEmails.length   },
  ]

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Document Library</h1>
            <p className="text-slate-400">All your generated resumes, cover letters, and emails</p>
          </div>
          <div className="flex gap-2">
            <Link href="/resume-builder">
              <Button className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm">
                + New Resume
              </Button>
            </Link>
            <Link href="/cover-letter">
              <Button variant="outline" className="border-white/10 text-slate-400 text-sm">
                + Cover Letter
              </Button>
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-900 border border-white/10 rounded-xl p-1 mb-6 w-fit">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.id
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {t.label}
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                tab === t.id ? "bg-white/20" : "bg-slate-800"
              }`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-slate-900 border border-white/10 rounded-xl p-5 animate-pulse h-40" />
            ))}
          </div>
        ) : (
          <>
            {/* Resumes Tab */}
            {tab === "resumes" && (
              resumes.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-4xl mb-4">📄</div>
                  <h3 className="text-white font-semibold mb-2">No resumes yet</h3>
                  <p className="text-slate-400 text-sm mb-4">Generate your first ATS-optimized resume</p>
                  <Link href="/resume-builder">
                    <Button className="bg-indigo-600 hover:bg-indigo-500 text-white">
                      Build Resume
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {resumes.map(resume => (
                    <div key={resume.id} className="bg-slate-900 border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-white font-semibold text-sm">{resume.title}</h3>
                          <p className="text-slate-400 text-xs mt-0.5">{resume.role}</p>
                        </div>
                        {resume.atsScore !== null && (
                          <div className={`text-2xl font-bold ${ATS_COLOR(resume.atsScore)}`}>
                            {resume.atsScore}
                          </div>
                        )}
                      </div>

                      {resume.atsScore !== null && (
                        <div className="mb-3">
                          <div className="flex justify-between text-xs text-slate-400 mb-1">
                            <span>ATS Score</span>
                            <span>{resume.atsScore}/100</span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${
                                resume.atsScore >= 80 ? "bg-green-500" :
                                resume.atsScore >= 60 ? "bg-yellow-500" : "bg-red-500"
                              }`}
                              style={{ width: `${resume.atsScore}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {resume.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {resume.keywords.slice(0, 5).map(kw => (
                            <span key={kw} className="text-xs bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded-full">
                              {kw}
                            </span>
                          ))}
                          {resume.keywords.length > 5 && (
                            <span className="text-xs text-slate-500">+{resume.keywords.length - 5}</span>
                          )}
                        </div>
                      )}

                      {resume.missingKeywords.length > 0 && (
                        <p className="text-xs text-red-400 mb-3">
                          Missing: {resume.missingKeywords.slice(0, 3).join(", ")}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-xs">
                          {new Date(resume.createdAt).toLocaleDateString()}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setPreview(JSON.stringify(resume.content, null, 2))
                              setPreviewTitle(resume.title)
                            }}
                            className="text-xs bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => deleteItem(resume.id, "resume")}
                            className="text-xs bg-slate-800 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 text-slate-400 hover:text-red-400 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Cover Letters Tab */}
            {tab === "coverLetters" && (
              coverLetters.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-4xl mb-4">📝</div>
                  <h3 className="text-white font-semibold mb-2">No cover letters yet</h3>
                  <p className="text-slate-400 text-sm mb-4">Generate personalized cover letters</p>
                  <Link href="/cover-letter">
                    <Button className="bg-indigo-600 hover:bg-indigo-500 text-white">
                      Write Cover Letter
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {coverLetters.map(cl => (
                    <div key={cl.id} className="bg-slate-900 border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors">
                      <div className="mb-3">
                        <h3 className="text-white font-semibold text-sm">{cl.title}</h3>
                        <p className="text-slate-400 text-xs mt-0.5">
                          {cl.company} · {cl.role}
                        </p>
                      </div>

                      {cl.tone && (
                        <span className="text-xs bg-slate-800 text-slate-400 border border-white/10 px-2 py-0.5 rounded-full">
                          {cl.tone}
                        </span>
                      )}

                      <p className="text-slate-500 text-xs mt-3 line-clamp-3">
                        {cl.content.slice(0, 150)}...
                      </p>

                      <div className="flex items-center justify-between mt-4">
                        <span className="text-slate-500 text-xs">
                          {new Date(cl.createdAt).toLocaleDateString()}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => copyToClipboard(cl.content)}
                            className="text-xs bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Copy
                          </button>
                          <button
                            onClick={() => {
                              setPreview(cl.content)
                              setPreviewTitle(cl.title)
                            }}
                            className="text-xs bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => deleteItem(cl.id, "coverLetter")}
                            className="text-xs bg-slate-800 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 text-slate-400 hover:text-red-400 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Cold Emails Tab */}
            {tab === "coldEmails" && (
              coldEmails.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-4xl mb-4">✉️</div>
                  <h3 className="text-white font-semibold mb-2">No cold emails yet</h3>
                  <p className="text-slate-400 text-sm mb-4">Generate ethical outreach emails</p>
                  <Link href="/cold-email">
                    <Button className="bg-indigo-600 hover:bg-indigo-500 text-white">
                      Write Cold Email
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {coldEmails.map(email => (
                    <div key={email.id} className="bg-slate-900 border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-white font-medium text-sm">{email.subject}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[email.status] ?? ""}`}>
                              {email.status}
                            </span>
                          </div>
                          <p className="text-slate-400 text-xs">
                            To: {email.recipientType.replace(/_/g, " ")}
                          </p>
                          <p className="text-slate-500 text-xs mt-2 line-clamp-2">
                            {email.body.slice(0, 120)}...
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => copyToClipboard(`Subject: ${email.subject}\n\n${email.body}`)}
                            className="text-xs bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Copy
                          </button>
                          <button
                            onClick={() => deleteItem(email.id, "coldEmail")}
                            className="text-xs bg-slate-800 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 text-slate-400 hover:text-red-400 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </>
        )}

        {/* Preview Modal */}
        {preview && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-white/10 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h3 className="text-white font-semibold">{previewTitle}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(preview)}
                    className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg"
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => setPreview(null)}
                    className="text-xs bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-400 px-3 py-1.5 rounded-lg"
                  >
                    Close
                  </button>
                </div>
              </div>
              <div className="p-4 overflow-y-auto flex-1">
                <pre className="text-slate-300 text-xs whitespace-pre-wrap leading-relaxed">
                  {preview}
                </pre>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}