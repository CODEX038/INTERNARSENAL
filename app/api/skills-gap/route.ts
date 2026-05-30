import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { getCached, setCached, deleteCached } from "@/lib/cache"

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (c) => c.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          ),
        },
      }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const cacheKey = `skills-gap:${user.id}`

    // Clear old cache to get fresh data
    await deleteCached(cacheKey)

    // Get user profile + skills
    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
    })

    const userSkills = (profile?.skills ?? []).map(s => s.toLowerCase())

    // Get all active internships + their required skills
    const internships = await prisma.internship.findMany({
      where:  { isActive: true },
      select: { requiredSkills: true, title: true, workMode: true },
      take:   100,
    })

    // Count skill frequency across all internships
    const skillFrequency: Record<string, number> = {}
    const skillRoles: Record<string, string[]>   = {}

    for (const internship of internships) {
      for (const skill of internship.requiredSkills) {
        const key = skill.toLowerCase()
        skillFrequency[key] = (skillFrequency[key] ?? 0) + 1
        if (!skillRoles[key]) skillRoles[key] = []
        if (!skillRoles[key].includes(internship.title)) {
          skillRoles[key].push(internship.title)
        }
      }
    }

    // Sort by frequency
    const allSkills = Object.entries(skillFrequency)
      .sort((a, b) => b[1] - a[1])
      .map(([skill, count]) => ({
        skill,
        count,
        hasSkill:   userSkills.includes(skill),
        roles:      (skillRoles[skill] ?? []).slice(0, 3),
        percentage: Math.round((count / internships.length) * 100),
      }))

    // Split into have and missing
    const missingSkills = allSkills.filter(s => !s.hasSkill).slice(0, 15)
    const matchedSkills = allSkills.filter(s => s.hasSkill).slice(0, 10)

    // Profile strength
    const topSkills       = allSkills.slice(0, 20)
    const matchedTopCount = topSkills.filter(s => s.hasSkill).length
    const profileStrength = Math.round((matchedTopCount / 20) * 100)

    // Role recommendations
    const roleMatch: Record<string, number> = {}
    for (const internship of internships) {
      const matched = internship.requiredSkills.filter(s =>
        userSkills.includes(s.toLowerCase())
      ).length
      const total = internship.requiredSkills.length
      if (total > 0) {
        const score = Math.round((matched / total) * 100)
        roleMatch[internship.title] = Math.max(
          roleMatch[internship.title] ?? 0,
          score
        )
      }
    }

    const topRoles = Object.entries(roleMatch)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([role, score]) => ({ role, score }))

    const result = {
      profileStrength,
      totalInternships: internships.length,
      userSkillCount:   userSkills.length,
      missingSkills,
      matchedSkills,
      topRoles,
    }

    await setCached(cacheKey, result, 60 * 15)
    return NextResponse.json(result)

  } catch (error) {
    console.error("Skills gap error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}