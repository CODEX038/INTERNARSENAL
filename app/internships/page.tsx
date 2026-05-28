"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface Internship {
  id:             string
  title:          string
  company:        string
  city:           string | null
  workMode:       string
  stipend:        number | null
  duration:       string | null
  requiredSkills: string[]
  applyUrl:       string
  source:         string
  postedAt:       string
}

const WORK_MODE_COLORS: Record<string, string> = {
  remote: "bg-green-500/10 text-green-400 border-green-500/20",
  hybrid: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  onsite: "bg-blue-500/10 text-blue-400 border-blue-500/20",
}

const CITIES = [
  "All Cities", "Mumbai", "Bengaluru", "Delhi", "Pune",
  "Hyderabad", "Chennai", "Noida", "Gurugram", "Remote",
]

export default function InternshipsPage() {
  const [internships, setInternships] = useState<Internship[]>([])
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState("")
  const [city,        setCity]        = useState("")
  const [workMode,    setWorkMode]    = useState("")
  const [total,       setTotal]       = useState(0)
  const [page,        setPage]        = useState(1)
  const [searching,   setSearching]   = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  async function fetchInternships() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("role", search)
      if (city && city !== "All Cities") params.set("city", city)
      if (workMode) params.set("workMode", workMode)
      params.set("page", String(page))
      params.set("limit", "12")
      const res = await fetch(`/api/internships?${params}`)
      const data = await res.json()
      setInternships(data.internships ?? [])
      setTotal(data.total ?? 0)
    } catch {
      console.error("Failed to fetch internships")
    } finally {
      setLoading(false)
    }
  }

  async function handleSemanticSearch() {
    if (!searchQuery.trim()) return
    setSearching(true)
    try {
      const res = await fetch("/api/internships/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      })
      const data = await res.json()
      setInternships(data.results ?? [])
      setTotal(data.results?.length ?? 0)
    } catch {
      console.error("Search failed")
    } finally {
      setSearching(false)
    }
  }

  useEffect(() => { fetchInternships() }, [city, workMode, page])

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-1">Internships</h1>
          <p className="text-slate-400">{total} opportunities found</p>
        </div>

        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 mb-6">
          <p className="text-indigo-400 text-sm font-medium mb-2">
            AI Semantic Search — describe what you want
          </p>
          <div className="flex gap-3">
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSemanticSearch()}
              placeholder="e.g. Python internship in Mumbai..."
              className="flex-1 bg-slate-800 border-white/10 text-white placeholder:text-slate-500"
            />
            <Button
              onClick={handleSemanticSearch}
              disabled={searching}
              className="bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              {searching ? "Searching..." : "AI Search"}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && fetchInternships()}
            placeholder="Search by role..."
            className="w-48 bg-slate-800 border-white/10 text-white placeholder:text-slate-500"
          />
          <select
            value={city}
            onChange={e => { setCity(e.target.value); setPage(1) }}
            className="bg-slate-800 border border-white/10 text-slate-300 rounded-lg px-3 py-2 text-sm"
          >
            {CITIES.map(c => (
              <option key={c} value={c === "All Cities" ? "" : c}>{c}</option>
            ))}
          </select>
          <select
            value={workMode}
            onChange={e => { setWorkMode(e.target.value); setPage(1) }}
            className="bg-slate-800 border border-white/10 text-slate-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All Modes</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="onsite">Onsite</option>
          </select>
          <Button
            onClick={() => { setSearch(""); setCity(""); setWorkMode(""); setPage(1) }}
            variant="outline"
            className="border-white/10 text-slate-400 hover:text-white"
          >
            Clear
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-slate-900 border border-white/10 rounded-xl p-5 animate-pulse">
                <div className="h-4 bg-slate-700 rounded mb-3 w-3/4" />
                <div className="h-3 bg-slate-700 rounded mb-2 w-1/2" />
                <div className="h-3 bg-slate-700 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : internships.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-white font-semibold mb-2">No internships found</h3>
            <p className="text-slate-400 text-sm">Try different filters or use AI search</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {internships.map(internship => (
              <div
                key={internship.id}
                className="bg-slate-900 border border-white/10 rounded-xl p-5 hover:border-indigo-500/40 transition-colors flex flex-col"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-white font-semibold text-sm leading-tight mb-1">
                      {internship.title}
                    </h3>
                    <p className="text-indigo-400 text-sm">{internship.company}</p>
                  </div>
                  <Badge className={`text-xs border ${WORK_MODE_COLORS[internship.workMode] ?? ""}`}>
                    {internship.workMode}
                  </Badge>
                </div>

                <div className="flex items-center gap-3 text-slate-400 text-xs mb-3">
                  <span>📍 {internship.city ?? "Remote"}</span>
                  {internship.stipend && (
                    <span>💰 ₹{internship.stipend.toLocaleString()}/mo</span>
                  )}
                  {internship.duration && (
                    <span>⏱ {internship.duration}</span>
                  )}
                </div>

                <div className="flex flex-wrap gap-1 mb-4 flex-1">
                  {internship.requiredSkills.slice(0, 4).map(skill => (
                    <span
                      key={skill}
                      className="text-xs bg-slate-800 text-slate-300 border border-white/10 px-2 py-0.5 rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                  {internship.requiredSkills.length > 4 && (
                    <span className="text-xs text-slate-500">
                      +{internship.requiredSkills.length - 4} more
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  
                    <a href={internship.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center bg-indigo-600 hover:bg-indigo-500 text-white text-xs py-2 rounded-lg transition-colors"
                  >
                    Apply
                  </a>
                  <button className="bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 text-xs px-3 py-2 rounded-lg transition-colors">
                    Save
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {total > 12 && (
          <div className="flex justify-center gap-3 mt-8">
            <Button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              variant="outline"
              className="border-white/10 text-slate-400"
            >
              Previous
            </Button>
            <span className="text-slate-400 py-2 text-sm">
              Page {page} of {Math.ceil(total / 12)}
            </span>
            <Button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= Math.ceil(total / 12)}
              variant="outline"
              className="border-white/10 text-slate-400"
            >
              Next
            </Button>
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}