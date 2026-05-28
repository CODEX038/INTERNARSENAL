import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { getCached, setCached, cacheKeys, TTL } from "@/lib/cache"

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

    const cacheKey = cacheKeys.dashboard(user.id)
    const cached   = await getCached(cacheKey)
    if (cached) {
      return NextResponse.json({ ...cached as object, fromCache: true })
    }

    // Use raw SQL to avoid enum type conflicts
    const [
      statsResult,
      emailResult,
      internshipResult,
      recentResult,
    ] = await Promise.all([
      prisma.$queryRaw<{ status: string; count: bigint }[]>`
        SELECT status, COUNT(*) as count
        FROM "Application"
        WHERE "userId" = ${user.id}
        GROUP BY status
      `,
      prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*) as count
        FROM "ColdEmail"
        WHERE "userId" = ${user.id}
        AND status = 'SENT'
      `,
      prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*) as count
        FROM "Internship"
        WHERE "isActive" = true
      `,
      prisma.$queryRaw<{
        id: string
        role: string
        status: string
        "createdAt": Date
      }[]>`
        SELECT id, role, status, "createdAt"
        FROM "Application"
        WHERE "userId" = ${user.id}
        ORDER BY "createdAt" DESC
        LIMIT 5
      `,
    ])

    // Parse counts by status
    const countByStatus = (status: string) => {
      const row = statsResult.find(r => r.status === status)
      return row ? Number(row.count) : 0
    }

    const totalApplications = statsResult.reduce((sum, r) => sum + Number(r.count), 0)

    const stats = {
      totalApplications,
      savedCount:       countByStatus("SAVED"),
      appliedCount:     countByStatus("APPLIED"),
      shortlistedCount: countByStatus("SHORTLISTED"),
      interviewCount:   countByStatus("INTERVIEW_SCHEDULED"),
      offerCount:       countByStatus("OFFER"),
      emailsSent:       Number(emailResult[0]?.count ?? 0),
      totalInternships: Number(internshipResult[0]?.count ?? 0),
      recentApplications: recentResult.map(a => ({
        id:         a.id,
        role:       a.role,
        status:     a.status,
        createdAt:  a.createdAt,
        internship: null,
      })),
    }

    await setCached(cacheKey, stats, TTL.DASHBOARD)
    return NextResponse.json(stats)

  } catch (error) {
    console.error("Dashboard stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}