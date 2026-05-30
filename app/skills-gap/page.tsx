"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import Link from "next/link"

interface SkillData {
  skill:      string
  count:      number
  hasSkill:   boolean
  roles:      string[]
  percentage: number
}

interface RoleMatch {
  role:  string
  score: number
}

interface SkillsGapData {
  profileStrength:  number
  totalInternships: number
  userSkillCount:   number
  missingSkills:    SkillData[]
  matchedSkills:    SkillData[]
  topRoles:         RoleMatch[]
}

function StrengthBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-full bg-slate-800 rounded-full h-2">
      <div
        className={`h-2 rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${value}%` }}
      />
    </div>
  )
}

export default function SkillsGapPage() {
  const [data,    setData]    = useState<SkillsGapData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch_() {
      try {
        const res  = await fetch("/api/skills-gap")
        const json = await res.json()
        setData(json)
      } catch {
        console.error("Failed to fetch skills gap")
      } finally {
        setLoading(false)
      }
    }
    fetch_()
  }, [])

  function getStrengthLabel(score: number) {
    if (score >= 80) return { label: "Excellent", color: "text-green-400" }
    if (score >= 60) return { label: "Good",      color: "text-blue-400"  }
    if (score >= 40) return { label: "Average",   color: "text-yellow-400"}
    return               { label: "Needs Work",   color: "text-red-400"   }
  }

  function getStrengthBarColor(score: number) {
    if (score >= 80) return "bg-green-500"
    if (score >= 60) return "bg-blue-500"
    if (score >= 40) return "bg-yellow-500"
    return "bg-red-500"
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-5xl mx-auto animate-pulse space-y-4">
          <div className="h-8 bg-slate-800 rounded w-1/3" />
          <div className="h-48 bg-slate-900 border border-white/10 rounded-xl" />
          <div className="h-48 bg-slate-900 border border-white/10 rounded-xl" />
        </div>
      </DashboardLayout>
    )
  }

  if (!data) {
    return (
      <DashboardLayout>
        <div className="max-w-5xl mx-auto text-center py-20">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-white font-semibold mb-2">Failed to load</h3>
          <p className="text-slate-400 text-sm">Try refreshing the page</p>
        </div>
      </DashboardLayout>
    )
  }

  const strength = getStrengthLabel(data.profileStrength)

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-1">Skills Gap Analysis</h1>
          <p className="text-slate-400">
            Based on {data.totalInternships} active internships in our database
          </p>
        </div>

        {/* Profile Strength Card */}
        <div className="bg-slate-900 border border-white/10 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-white font-semibold text-lg">Profile Strength</h2>
              <p className="text-slate-400 text-sm mt-0.5">
                You have {data.userSkillCount} skills matching market demand
              </p>
            </div>
            <div className="text-right">
              <div className={`text-4xl font-bold ${strength.color}`}>
                {data.profileStrength}%
              </div>
              <div className={`text-sm font-medium ${strength.color}`}>
                {strength.label}
              </div>
            </div>
          </div>
          <StrengthBar
            value={data.profileStrength}
            color={getStrengthBarColor(data.profileStrength)}
          />

          {data.userSkillCount === 0 && (
            <div className="mt-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <p className="text-yellow-400 text-sm">
                You haven't added any skills to your profile yet.{" "}
                <Link href="/profile" className="underline hover:text-yellow-300">
                  Add skills now
                </Link>{" "}
                to see your personalized gap analysis.
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

          {/* Missing Skills */}
          <div className="bg-slate-900 border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">🎯</span>
              <h2 className="text-white font-semibold">Skills to Add</h2>
              <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full ml-auto">
                {data.missingSkills.length} missing
              </span>
            </div>

            <div className="space-y-3">
              {data.missingSkills.map(skill => (
                <div key={skill.skill} className="group">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white text-sm font-medium capitalize">
                      {skill.skill}
                    </span>
                    <span className="text-red-400 text-xs">
                      {skill.count} internships need this
                    </span>
                  </div>
                  <StrengthBar value={skill.percentage} color="bg-red-500/60" />
                  {skill.roles.length > 0 && (
                    <p className="text-slate-500 text-xs mt-1">
                      Used in: {skill.roles.join(", ")}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <Link
              href="/profile"
              className="mt-4 block text-center text-xs bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg transition-colors"
            >
              Add Missing Skills to Profile
            </Link>
          </div>

          {/* Matched Skills */}
          <div className="bg-slate-900 border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">✅</span>
              <h2 className="text-white font-semibold">Skills You Have</h2>
              <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full ml-auto">
                {data.matchedSkills.length} matched
              </span>
            </div>

            {data.matchedSkills.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500 text-sm">
                  No skill matches yet.{" "}
                  <Link href="/profile" className="text-indigo-400 hover:text-indigo-300">
                    Add skills to your profile
                  </Link>
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.matchedSkills.map(skill => (
                  <div key={skill.skill}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white text-sm font-medium capitalize">
                        {skill.skill}
                      </span>
                      <span className="text-green-400 text-xs">
                        {skill.count} internships
                      </span>
                    </div>
                    <StrengthBar value={skill.percentage} color="bg-green-500" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top Role Matches */}
        <div className="bg-slate-900 border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🚀</span>
            <h2 className="text-white font-semibold">Best Role Matches For You</h2>
          </div>

          {data.topRoles.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 text-sm">
                Add skills to your profile to see role matches
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.topRoles.map((role, i) => (
                <div key={role.role}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-sm">#{i + 1}</span>
                      <span className="text-white text-sm font-medium">{role.role}</span>
                    </div>
                    <span className={`text-sm font-bold ${
                      role.score >= 80 ? "text-green-400" :
                      role.score >= 60 ? "text-blue-400"  :
                      role.score >= 40 ? "text-yellow-400": "text-red-400"
                    }`}>
                      {role.score}% match
                    </span>
                  </div>
                  <StrengthBar
                    value={role.score}
                    color={
                      role.score >= 80 ? "bg-green-500" :
                      role.score >= 60 ? "bg-blue-500"  :
                      role.score >= 40 ? "bg-yellow-500": "bg-red-500"
                    }
                  />
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex gap-3">
            <Link
              href="/internships"
              className="flex-1 text-center text-xs bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg transition-colors"
            >
              Browse Matching Internships
            </Link>
            <Link
              href="/profile"
              className="flex-1 text-center text-xs bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 py-2 rounded-lg transition-colors"
            >
              Improve Your Profile
            </Link>
          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}