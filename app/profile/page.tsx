"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Profile {
  college:        string
  degree:         string
  year:           number
  cgpa:           number
  city:           string
  state:          string
  workMode:       string
  skills:         string[]
  githubUrl:      string
  linkedinUrl:    string
  portfolioUrl:   string
  bio:            string
  openToRelocate: boolean
}

const CITIES = [
  "Mumbai", "Bengaluru", "Delhi", "Pune", "Hyderabad",
  "Chennai", "Noida", "Gurugram", "Ahmedabad", "Kolkata",
  "Kochi", "Jaipur", "Indore", "Nagpur", "Chandigarh",
]

export default function ProfilePage() {
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [newSkill, setNewSkill] = useState("")

  const [profile, setProfile] = useState<Profile>({
    college:        "",
    degree:         "",
    year:           3,
    cgpa:           0,
    city:           "",
    state:          "",
    workMode:       "any",
    skills:         [],
    githubUrl:      "",
    linkedinUrl:    "",
    portfolioUrl:   "",
    bio:            "",
    openToRelocate: false,
  })

  async function fetchProfile() {
    try {
      const res  = await fetch("/api/profile")
      const data = await res.json()
      if (data.profile) {
        setProfile(prev => ({ ...prev, ...data.profile }))
      }
    } catch {
      console.error("Failed to fetch profile")
    } finally {
      setLoading(false)
    }
  }

  async function saveProfile() {
    setSaving(true)
    try {
      await fetch("/api/profile", {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(profile),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      console.error("Failed to save profile")
    } finally {
      setSaving(false)
    }
  }

  function updateProfile(key: string, value: any) {
    setProfile(prev => ({ ...prev, [key]: value }))
  }

  function addSkill() {
    const skill = newSkill.trim()
    if (skill && !profile.skills.includes(skill)) {
      updateProfile("skills", [...profile.skills, skill])
      setNewSkill("")
    }
  }

  function removeSkill(skill: string) {
    updateProfile("skills", profile.skills.filter(s => s !== skill))
  }

  useEffect(() => { fetchProfile() }, [])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto animate-pulse space-y-4">
          <div className="h-8 bg-slate-800 rounded w-1/3" />
          <div className="h-64 bg-slate-900 border border-white/10 rounded-xl" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Profile</h1>
            <p className="text-slate-400">Your information used for AI matching and resume generation</p>
          </div>
          <Button
            onClick={saveProfile}
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            {saving ? "Saving..." : saved ? "Saved!" : "Save Profile"}
          </Button>
        </div>

        <div className="space-y-6">

          {/* Basic Info */}
          <div className="bg-slate-900 border border-white/10 rounded-xl p-6">
            <h2 className="text-white font-semibold mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300 text-sm">College</Label>
                <Input
                  value={profile.college}
                  onChange={e => updateProfile("college", e.target.value)}
                  placeholder="VJTI Mumbai"
                  className="mt-1 bg-slate-800 border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm">Degree</Label>
                <Input
                  value={profile.degree}
                  onChange={e => updateProfile("degree", e.target.value)}
                  placeholder="B.E. Computer Engineering"
                  className="mt-1 bg-slate-800 border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm">Year</Label>
                <select
                  value={profile.year}
                  onChange={e => updateProfile("year", Number(e.target.value))}
                  className="mt-1 w-full bg-slate-800 border border-white/10 text-slate-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value={1}>1st Year</option>
                  <option value={2}>2nd Year</option>
                  <option value={3}>3rd Year</option>
                  <option value={4}>4th Year</option>
                </select>
              </div>
              <div>
                <Label className="text-slate-300 text-sm">CGPA</Label>
                <Input
                  type="number"
                  value={profile.cgpa}
                  onChange={e => updateProfile("cgpa", Number(e.target.value))}
                  placeholder="8.5"
                  min={0}
                  max={10}
                  step={0.1}
                  className="mt-1 bg-slate-800 border-white/10 text-white"
                />
              </div>
              <div className="md:col-span-2">
                <Label className="text-slate-300 text-sm">Bio</Label>
                <Textarea
                  value={profile.bio}
                  onChange={e => updateProfile("bio", e.target.value)}
                  placeholder="3rd year CS student passionate about full-stack development and AI..."
                  className="mt-1 bg-slate-800 border-white/10 text-white h-20"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-slate-900 border border-white/10 rounded-xl p-6">
            <h2 className="text-white font-semibold mb-4">Location & Work Preference</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300 text-sm">City</Label>
                <select
                  value={profile.city}
                  onChange={e => updateProfile("city", e.target.value)}
                  className="mt-1 w-full bg-slate-800 border border-white/10 text-slate-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Select city</option>
                  {CITIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-slate-300 text-sm">Work Mode Preference</Label>
                <select
                  value={profile.workMode}
                  onChange={e => updateProfile("workMode", e.target.value)}
                  className="mt-1 w-full bg-slate-800 border border-white/10 text-slate-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="any">Any</option>
                  <option value="remote">Remote Only</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="onsite">Onsite</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="relocate"
                  checked={profile.openToRelocate}
                  onChange={e => updateProfile("openToRelocate", e.target.checked)}
                  className="w-4 h-4 accent-indigo-600"
                />
                <Label htmlFor="relocate" className="text-slate-300 text-sm cursor-pointer">
                  Open to relocate
                </Label>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="bg-slate-900 border border-white/10 rounded-xl p-6">
            <h2 className="text-white font-semibold mb-4">Skills</h2>
            <div className="flex gap-2 mb-4">
              <Input
                value={newSkill}
                onChange={e => setNewSkill(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addSkill()}
                placeholder="Add a skill (e.g. React)"
                className="bg-slate-800 border-white/10 text-white"
              />
              <Button
                onClick={addSkill}
                disabled={!newSkill.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map(skill => (
                <span
                  key={skill}
                  className="flex items-center gap-1 text-sm bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-3 py-1 rounded-full"
                >
                  {skill}
                  <button
                    onClick={() => removeSkill(skill)}
                    className="text-indigo-400 hover:text-white ml-1"
                  >
                    x
                  </button>
                </span>
              ))}
              {profile.skills.length === 0 && (
                <p className="text-slate-500 text-sm">No skills added yet</p>
              )}
            </div>
          </div>

          {/* Links */}
          <div className="bg-slate-900 border border-white/10 rounded-xl p-6">
            <h2 className="text-white font-semibold mb-4">Links</h2>
            <div className="space-y-4">
              <div>
                <Label className="text-slate-300 text-sm">GitHub URL</Label>
                <Input
                  value={profile.githubUrl}
                  onChange={e => updateProfile("githubUrl", e.target.value)}
                  placeholder="https://github.com/username"
                  className="mt-1 bg-slate-800 border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm">LinkedIn URL</Label>
                <Input
                  value={profile.linkedinUrl}
                  onChange={e => updateProfile("linkedinUrl", e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="mt-1 bg-slate-800 border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm">Portfolio URL</Label>
                <Input
                  value={profile.portfolioUrl}
                  onChange={e => updateProfile("portfolioUrl", e.target.value)}
                  placeholder="https://yourportfolio.com"
                  className="mt-1 bg-slate-800 border-white/10 text-white"
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  )
}