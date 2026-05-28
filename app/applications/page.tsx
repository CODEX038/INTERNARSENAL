"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Application {
  id:           string
  role:         string
  status:       string
  appliedAt:    string | null
  matchScore:   number | null
  notes:        string | null
  createdAt:    string
  internship:   { title: string; company: string } | null
  company:      { name: string } | null
}

const STATUSES = [
  "SAVED",
  "APPLIED",
  "UNDER_REVIEW",
  "SHORTLISTED",
  "INTERVIEW_SCHEDULED",
  "REJECTED",
  "OFFER",
]

const STATUS_COLORS: Record<string, string> = {
  SAVED:                "bg-slate-500/20 text-slate-300 border-slate-500/30",
  APPLIED:              "bg-blue-500/20 text-blue-300 border-blue-500/30",
  UNDER_REVIEW:         "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  SHORTLISTED:          "bg-purple-500/20 text-purple-300 border-purple-500/30",
  INTERVIEW_SCHEDULED:  "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  REJECTED:             "bg-red-500/20 text-red-300 border-red-500/30",
  OFFER:                "bg-green-500/20 text-green-300 border-green-500/30",
}

const STATUS_LABELS: Record<string, string> = {
  SAVED:                "Saved",
  APPLIED:              "Applied",
  UNDER_REVIEW:         "Under Review",
  SHORTLISTED:          "Shortlisted",
  INTERVIEW_SCHEDULED:  "Interview",
  REJECTED:             "Rejected",
  OFFER:                "Offer",
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading,      setLoading]      = useState(true)
  const [filter,       setFilter]       = useState("ALL")
  const [showAdd,      setShowAdd]      = useState(false)
  const [newRole,      setNewRole]      = useState("")
  const [newCompany,   setNewCompany]   = useState("")
  const [adding,       setAdding]       = useState(false)

  async function fetchApplications() {
    setLoading(true)
    try {
      const res  = await fetch("/api/applications")
      const data = await res.json()
      setApplications(data.applications ?? [])
    } catch {
      console.error("Failed to fetch applications")
    } finally {
      setLoading(false)
    }
  }

  async function addApplication() {
    if (!newRole || !newCompany) return
    setAdding(true)
    try {
      await fetch("/api/applications", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole, company: newCompany }),
      })
      setNewRole("")
      setNewCompany("")
      setShowAdd(false)
      fetchApplications()
    } catch {
      console.error("Failed to add application")
    } finally {
      setAdding(false)
    }
  }

  async function updateStatus(id: string, status: string) {
    try {
      await fetch(`/api/applications/${id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      setApplications(prev =>
        prev.map(a => a.id === id ? { ...a, status } : a)
      )
    } catch {
      console.error("Failed to update status")
    }
  }

  useEffect(() => { fetchApplications() }, [])

  const filtered = filter === "ALL"
    ? applications
    : applications.filter(a => a.status === filter)

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = applications.filter(a => a.status === s).length
    return acc
  }, {} as Record<string, number>)

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Applications</h1>
            <p className="text-slate-400">{applications.length} total applications</p>
          </div>
          <Button
            onClick={() => setShowAdd(!showAdd)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            + Add Application
          </Button>
        </div>

        {/* Add Application Form */}
        {showAdd && (
          <div className="bg-slate-900 border border-indigo-500/30 rounded-xl p-4 mb-6 flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-slate-300 text-xs mb-1 block">Role</label>
              <Input
                value={newRole}
                onChange={e => setNewRole(e.target.value)}
                placeholder="Frontend Developer Intern"
                className="bg-slate-800 border-white/10 text-white"
              />
            </div>
            <div className="flex-1">
              <label className="text-slate-300 text-xs mb-1 block">Company</label>
              <Input
                value={newCompany}
                onChange={e => setNewCompany(e.target.value)}
                placeholder="Razorpay"
                className="bg-slate-800 border-white/10 text-white"
              />
            </div>
            <Button
              onClick={addApplication}
              disabled={adding || !newRole || !newCompany}
              className="bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              {adding ? "Adding..." : "Add"}
            </Button>
            <Button
              onClick={() => setShowAdd(false)}
              variant="outline"
              className="border-white/10 text-slate-400"
            >
              Cancel
            </Button>
          </div>
        )}

        {/* Pipeline Stats */}
        <div className="grid grid-cols-4 md:grid-cols-7 gap-2 mb-6">
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setFilter(filter === s ? "ALL" : s)}
              className={`rounded-lg p-3 text-center border transition-colors ${
                filter === s
                  ? STATUS_COLORS[s]
                  : "bg-slate-900 border-white/10 text-slate-400 hover:border-white/20"
              }`}
            >
              <div className="text-xl font-bold text-white">{counts[s] ?? 0}</div>
              <div className="text-xs mt-0.5">{STATUS_LABELS[s]}</div>
            </button>
          ))}
        </div>

        {/* Applications List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-slate-900 border border-white/10 rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-slate-700 rounded w-1/3 mb-2" />
                <div className="h-3 bg-slate-700 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-white font-semibold mb-2">No applications yet</h3>
            <p className="text-slate-400 text-sm">
              Click "Add Application" to start tracking
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(app => (
              <div
                key={app.id}
                className="bg-slate-900 border border-white/10 rounded-xl p-4 flex items-center justify-between hover:border-white/20 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-white font-medium text-sm">{app.role}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[app.status]}`}>
                      {STATUS_LABELS[app.status]}
                    </span>
                    {app.matchScore && (
                      <span className="text-xs text-indigo-400">
                        {app.matchScore}% match
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400 text-xs">
                    {app.internship?.company ?? app.company?.name ?? "Unknown Company"}
                    {app.appliedAt && (
                      <span className="ml-2">
                        · Applied {new Date(app.appliedAt).toLocaleDateString()}
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={app.status}
                    onChange={e => updateStatus(app.id, e.target.value)}
                    className="bg-slate-800 border border-white/10 text-slate-300 rounded-lg px-2 py-1 text-xs"
                  >
                    {STATUSES.map(s => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}