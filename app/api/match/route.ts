import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { generateEmbedding } from "@/lib/openai"
import { prisma } from "@/lib/prisma"
import { getCached, setCached, cacheKeys, TTL } from "@/lib/cache"
import { checkRateLimit } from "@/lib/security"
import { z } from "zod"

const MATCH_WEIGHTS = {
  skillMatch:       0.35,
  projectRelevance: 0.25,
  locationMatch:    0.20,
  keywordMatch:     0.10,
  companyRelevance: 0.10,
}

const MatchSchema = z.object({
  internshipId: z.string(),
})

export async function POST(req: NextRequest) {
  try {
    // 1. Auth
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

    // 2. Rate limit
    const { success } = await checkRateLimit(user.id)
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const body = await req.json()
    const { internshipId } = MatchSchema.parse(body)

    // 3. Check cache
    const cacheKey = cacheKeys.matchScore(user.id, internshipId)
    const cached = await getCached(cacheKey)
    if (cached) {
      return NextResponse.json({ ...cached as object, fromCache: true })
    }

    // 4. Get user profile + internship
    const [profile, internship] = await Promise.all([
      prisma.profile.findUnique({
        where: { userId: user.id },
        include: { projects: true },
      }),
      prisma.internship.findUnique({
        where: { id: internshipId },
      }),
    ])

    if (!internship) {
      return NextResponse.json({ error: "Internship not found" }, { status: 404 })
    }

    if (!profile) {
      return NextResponse.json({ score: 0, message: "Complete your profile first" })
    }

    // 5. Calculate match score (DSA — weighted algorithm)
    const userSkills = profile.skills ?? []
    const requiredSkills = internship.requiredSkills ?? []

    // Skill match (35%)
    const matchedSkills = userSkills.filter(skill =>
      requiredSkills.some(req =>
        req.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(req.toLowerCase())
      )
    )
    const missingSkills = requiredSkills.filter(req =>
      !userSkills.some(skill =>
        skill.toLowerCase().includes(req.toLowerCase())
      )
    )
    const skillScore = requiredSkills.length > 0
      ? (matchedSkills.length / requiredSkills.length) * 100
      : 50

    // Project relevance (25%)
    const projectTech = profile.projects.flatMap(p => p.tech)
    const projectMatches = requiredSkills.filter(req =>
      projectTech.some(t => t.toLowerCase().includes(req.toLowerCase()))
    )
    const projectScore = requiredSkills.length > 0
      ? (projectMatches.length / requiredSkills.length) * 100
      : 50

    // Location match (20%)
    let locationScore = 0
    if (internship.workMode === "remote" || profile.workMode === "remote") {
      locationScore = 100
    } else if (
      profile.city &&
      internship.city &&
      profile.city.toLowerCase() === internship.city.toLowerCase()
    ) {
      locationScore = 100
    } else if (profile.openToRelocate) {
      locationScore = 60
    } else {
      locationScore = 20
    }

    // Keyword match (10%)
    const jdText = internship.description.toLowerCase()
    const keywordMatches = userSkills.filter(s =>
      jdText.includes(s.toLowerCase())
    )
    const keywordScore = Math.min(
      (keywordMatches.length / Math.max(userSkills.length, 1)) * 100,
      100
    )

    // Company relevance (10%)
    const companyScore = 70

    // Final weighted score
    const total = Math.round(
      skillScore    * MATCH_WEIGHTS.skillMatch +
      projectScore  * MATCH_WEIGHTS.projectRelevance +
      locationScore * MATCH_WEIGHTS.locationMatch +
      keywordScore  * MATCH_WEIGHTS.keywordMatch +
      companyScore  * MATCH_WEIGHTS.companyRelevance
    )

    const result = {
      score: Math.min(total, 100),
      breakdown: {
        skills:    Math.round(skillScore),
        projects:  Math.round(projectScore),
        location:  Math.round(locationScore),
        keywords:  Math.round(keywordScore),
        company:   Math.round(companyScore),
      },
      matchedSkills,
      missingSkills,
    }

    // 6. Cache it
    await setCached(cacheKey, result, TTL.MATCH_SCORE)

    return NextResponse.json(result)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 })
    }
    console.error("Match score error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}