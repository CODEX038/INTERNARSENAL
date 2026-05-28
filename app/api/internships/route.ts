import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { getCached, setCached, cacheKeys, TTL } from "@/lib/cache"
import { checkRateLimit } from "@/lib/security"
import { z } from "zod"

const FilterSchema = z.object({
  role:     z.string().optional(),
  city:     z.string().optional(),
  workMode: z.enum(["remote", "hybrid", "onsite", "any"]).optional(),
  source:   z.string().optional(),
  page:     z.coerce.number().default(1),
  limit:    z.coerce.number().max(50).default(20),
})

export async function GET(req: NextRequest) {
  try {
    // 1. Auth check
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

    // 2. Rate limiting
    const { success } = await checkRateLimit(user.id)
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    // 3. Parse + validate filters
    const { searchParams } = new URL(req.url)
    const params = Object.fromEntries(searchParams.entries())
    const filters = FilterSchema.parse(params)

    // 4. Check cache
    const cacheKey = cacheKeys.internships(JSON.stringify(filters))
    const cached = await getCached(cacheKey)
    if (cached) {
      return NextResponse.json({ ...cached as object, fromCache: true })
    }

    // 5. Build DB query
    const where: any = { isActive: true }
    if (filters.role) {
      where.title = { contains: filters.role, mode: "insensitive" }
    }
    if (filters.city && filters.city !== "remote") {
      where.city = { contains: filters.city, mode: "insensitive" }
    }
    if (filters.workMode && filters.workMode !== "any") {
      where.workMode = filters.workMode
    }
    if (filters.source) {
      where.source = filters.source
    }

    const skip = (filters.page - 1) * filters.limit

    const [internships, total] = await Promise.all([
      prisma.internship.findMany({
        where,
        skip,
        take: filters.limit,
        orderBy: { postedAt: "desc" },
      }),
      prisma.internship.count({ where }),
    ])

    const result = {
      internships,
      total,
      page: filters.page,
      pages: Math.ceil(total / filters.limit),
    }

    // 6. Store in cache
    await setCached(cacheKey, result, TTL.INTERNSHIPS)

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 })
    }
    console.error("Internships API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    // Auth check
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

    const body = await req.json()

    // Validate
    const InternshipSchema = z.object({
      title:          z.string().min(2).max(200),
      company:        z.string().min(2).max(200),
      description:    z.string().min(10),
      requiredSkills: z.array(z.string()).default([]),
      city:           z.string().optional(),
      workMode:       z.enum(["remote", "hybrid", "onsite"]),
      stipend:        z.number().optional(),
      duration:       z.string().optional(),
      applyUrl:       z.string().url(),
    })

    const data = InternshipSchema.parse(body)

    const internship = await prisma.internship.create({
      data: {
        ...data,
        source:   "user_pasted",
        sourceId: `user_${user.id}_${Date.now()}`,
      },
    })

    return NextResponse.json(internship, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 })
    }
    console.error("Create internship error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}