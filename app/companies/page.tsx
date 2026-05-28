"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { Input } from "@/components/ui/input"

interface Company {
  id:           string
  name:         string
  city:         string | null
  industry:     string | null
  techStack:    string[]
  hiringStatus: string
  website:      string | null
  isStartup:    boolean
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState("")

  useEffect(() => {
    async function fetch_() {
      try {
        const res  = await fetch("/api/companies")
        const data = await res.json()
        setCompanies(data.companies ?? [])
      } finally {
        setLoading(false)
      }
    }
    fetch_()
  }, [])

  const filtered = companies.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.city?.toLowerCase().includes(search.toLowerCase()) ||
    c.industry?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-1">Companies</h1>
          <p className="text-slate-400">Discover startups and companies hiring interns</p>
        </div>

        <div className="mb-6">
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, city, industry..."
            className="max-w-md bg-slate-800 border-white/10 text-white"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-slate-900 border border-white/10 rounded-xl p-5 animate-pulse h-40" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">🏢</div>
            <h3 className="text-white font-semibold mb-2">No companies found</h3>
            <p className="text-slate-400 text-sm">Try a different search</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(company => (
              <div
                key={company.id}
                className="bg-slate-900 border border-white/10 rounded-xl p-5 hover:border-indigo-500/40 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-white font-semibold text-sm">{company.name}</h3>
                    <p className="text-slate-400 text-xs mt-0.5">
                      {company.city ?? "Remote"} · {company.industry ?? "Tech"}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    company.hiringStatus === "hiring"
                      ? "bg-green-500/10 text-green-400"
                      : "bg-slate-700 text-slate-400"
                  }`}>
                    {company.hiringStatus === "hiring" ? "Hiring" : "Unknown"}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1 mb-4">
                  {company.techStack.slice(0, 4).map(t => (
                    <span
                      key={t}
                      className="text-xs bg-slate-800 text-slate-300 border border-white/10 px-2 py-0.5 rounded-full"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  {company.website && (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-center text-xs bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 py-2 rounded-lg transition-colors"
                    >
                      Website
                    </a>
                  )}
                  <a
                    href={`/cold-email?company=${encodeURIComponent(company.name)}`}
                    className="flex-1 text-center text-xs bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg transition-colors"
                  >
                    Cold Email
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}