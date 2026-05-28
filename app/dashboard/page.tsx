"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import Link from "next/link"

interface Stats {
  totalApplications: number
  savedCount:        number
  appliedCount:      number
  shortlistedCount:  number
  interviewCount:    number
  offerCount:        number
  emailsSent:        number
  totalInternships:  number
  recentApplications: {
    id:         string
    role:       string
    status:     string
    createdAt:  string
    internship: { title: string; company: string } | null
  }[]
}

const STATUS_COLORS: Record<string, string> = {
  SAVED:               "text-slate-400",
  APPLIED:             "text-blue-400",
  UNDER_REVIEW:        "text-yellow-400",
  SHORTLISTED:         "text-purple-400",
  INTERVIEW_SCHEDULED: "text-indigo-400",
  REJECTED:            "text-red-400",
  OFFER:               "text-green-400",
}

export default function DashboardPage() {
  const [stats,   setStats]   = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res  = await fetch("/api/dashboard/stats")
        const data = await res.json()
        setStats(data)
      } catch {
        console.error("Failed to fetch stats")
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">Dashboard</h1>
          <p className="text-slate-400">Your internship hunt at a glance</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Internships",  value: stats?.totalInternships,  icon: "🔍", color: "indigo" },
            { label: "Applied",            value: stats?.appliedCount,       icon: "📨", color: "blue"   },
            { label: "Shortlisted",        value: stats?.shortlistedCount,   icon: "⭐", color: "yellow" },
            { label: "Emails Sent",        value: stats?.emailsSent,         icon: "✉️", color: "green"  },
            { label: "Saved",              value: stats?.savedCount,          icon: "🔖", color: "slate"  },
            { label: "Under Review",       value: stats?.totalApplications,  icon: "👀", color: "purple" },
            { label: "Interviews",         value: stats?.interviewCount,     icon: "📅", color: "indigo" },
            { label: "Offers",             value: stats?.offerCount,         icon: "🎉", color: "green"  },
          ].map(stat => (
            <div key={stat.label} className="bg-slate-900 border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors">
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold text-white">
                {loading ? (
                  <div className="h-7 w-8 bg-slate-700 rounded animate-pulse" />
                ) : (
                  stat.value ?? 0
                )}
              </div>
              <div className="text-slate-400 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Recent Activity */}
          <div className="bg-slate-900 border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">Recent Applications</h2>
              <Link href="/applications" className="text-indigo-400 text-sm hover:text-indigo-300">
                View all
              </Link>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 bg-slate-800 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (stats?.recentApplications?.length ?? 0) === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500 text-sm">No applications yet</p>
                <Link href="/internships" className="text-indigo-400 text-sm hover:text-indigo-300 mt-2 block">
                  Browse internships
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {stats?.recentApplications.map(app => (
                  <div key={app.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div>
                      <p className="text-white text-sm font-medium">{app.role}</p>
                      <p className="text-slate-500 text-xs">
                        {app.internship?.company ?? "Unknown"}
                      </p>
                    </div>
                    <span className={`text-xs font-medium ${STATUS_COLORS[app.status]}`}>
                      {app.status.replace(/_/g, " ")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-900 border border-white/10 rounded-xl p-6">
            <h2 className="text-white font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              {[
                { label: "🔍 Browse Internships",    href: "/internships",    desc: `${stats?.totalInternships ?? 0} available`     },
                { label: "🤖 Ask InternBot",          href: "/internbot",      desc: "AI career assistant"                           },
                { label: "📄 Build Resume",           href: "/resume-builder", desc: "ATS-optimized in 2 minutes"                    },
                { label: "✉️ Send Cold Email",        href: "/cold-email",     desc: "Reach out to companies"                        },
                { label: "📋 Track Applications",     href: "/applications",   desc: `${stats?.totalApplications ?? 0} tracked`      },
                { label: "💎 Hidden Opportunities",   href: "/hidden-opportunities", desc: "Startups not on job boards"              },
              ].map(action => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center justify-between bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-lg px-4 py-3 transition-colors group"
                >
                  <div>
                    <p className="text-white text-sm">{action.label}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{action.desc}</p>
                  </div>
                  <span className="text-slate-600 group-hover:text-white transition-colors">→</span>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  )
}