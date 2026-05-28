import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { generateEmbedding } from "@/lib/openai"
import { prisma } from "@/lib/prisma"
import { getCached, setCached, cacheKeys, TTL } from "@/lib/cache"
import { checkRateLimit } from "@/lib/security"
import { z } from "zod"

const SearchSchema = z.object({
  query: z.string().min(3).max(500),
  limit: z.coerce.number().max(20).default(10),
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
    const { success } = await checkRateLimit(user.id, true)
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    // 3. Validate
    const body = await req.json()
    const { query, limit } = SearchSchema.parse(body)

    // 4. Check cache
    const cacheKey = `semantic_search:${query}:${limit}`
    const cached = await getCached(cacheKey)
    if (cached) {
      return NextResponse.json({ ...cached as object, fromCache: true })
    }

    // 5. Generate embedding for the search query
    const queryEmbedding = await generateEmbedding(query)

    // 6. Vector similarity search via Supabase RPC
    const { createClient } = await import("@supabase/supabase-js")
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: results, error } = await supabaseAdmin.rpc(
      "match_internships",
      {
        query_embedding:  queryEmbedding,
        match_threshold:  0.3,
        match_count:      limit,
      }
    )

    if (error) {
      console.error("Vector search error:", error)
      // Fallback to keyword search
      const fallback = await prisma.internship.findMany({
        where: {
          isActive: true,
          OR: [
            { title:       { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
            { company:     { contains: query, mode: "insensitive" } },
          ],
        },
        take: limit,
      })
      return NextResponse.json({ results: fallback, searchType: "keyword" })
    }

    // 7. Cache results
    const response = { results: results ?? [], searchType: "semantic" }
    await setCached(cacheKey, response, TTL.INTERNSHIPS)

    return NextResponse.json(response)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 })
    }
    console.error("Search error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}