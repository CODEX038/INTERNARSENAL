import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { generateJSON } from "@/lib/openai"
import { generateEmbedding } from "@/lib/openai"
import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/security"
import { z } from "zod"

const ParseSchema = z.object({
  text: z.string().min(10).max(10000),
})

const PARSER_SYSTEM_PROMPT = `
You are an expert internship data extractor.

Extract structured internship data from the provided text.
The text may be a job posting, LinkedIn post, email, or any internship description.

Return ONLY valid JSON with this exact structure:
{
  "title": "exact job title",
  "company": "company name",
  "description": "full job description (keep it detailed)",
  "requiredSkills": ["skill1", "skill2", "skill3"],
  "city": "city name or null",
  "state": "state name or null",
  "workMode": "remote" or "hybrid" or "onsite",
  "stipend": number in INR per month or null,
  "duration": "X months" or null,
  "applyUrl": "application URL or null",
  "deadline": "YYYY-MM-DD" or null
}

Rules:
- requiredSkills must be specific tech skills only (React, Python, SQL etc.)
- workMode must be exactly "remote", "hybrid", or "onsite"
- stipend must be a number (e.g. 15000) not a string
- If information is not available, use null
- Never guess — only extract what is explicitly mentioned
`

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

    // 2. Rate limit — AI endpoint (stricter)
    const { success } = await checkRateLimit(user.id, true)
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Wait a minute." },
        { status: 429 }
      )
    }

    // 3. Validate input
    const body = await req.json()
    const { text } = ParseSchema.parse(body)

    // 4. LLM extraction
    const extracted = await generateJSON<{
      title: string
      company: string
      description: string
      requiredSkills: string[]
      city: string | null
      state: string | null
      workMode: string
      stipend: number | null
      duration: string | null
      applyUrl: string | null
      deadline: string | null
    }>(PARSER_SYSTEM_PROMPT, `Extract internship data from this text:\n\n${text}`)

    // 5. Validate workMode
    const validWorkModes = ["remote", "hybrid", "onsite"]
    if (!validWorkModes.includes(extracted.workMode)) {
      extracted.workMode = "onsite"
    }

    // 6. Generate embedding for semantic search
    const embeddingText = `${extracted.title} ${extracted.company} ${extracted.description} ${extracted.requiredSkills.join(" ")}`
    const embedding = await generateEmbedding(embeddingText)

    // 7. Save to DB
    const internship = await prisma.internship.create({
      data: {
        title:          extracted.title,
        company:        extracted.company,
        description:    extracted.description,
        requiredSkills: extracted.requiredSkills,
        city:           extracted.city,
        state:          extracted.state,
        workMode:       extracted.workMode,
        stipend:        extracted.stipend,
        duration:       extracted.duration,
        applyUrl:       extracted.applyUrl ?? "https://example.com",
        source:         "user_pasted",
        sourceId:       `parsed_${user.id}_${Date.now()}`,
        deadline:       extracted.deadline ? new Date(extracted.deadline) : null,
      },
    })

    // 8. Store embedding separately via raw SQL
    await prisma.$executeRaw`
      UPDATE "Internship"
      SET embedding = ${JSON.stringify(embedding)}::vector
      WHERE id = ${internship.id}
    `

    return NextResponse.json({
      success: true,
      internship,
      extracted,
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 })
    }
    console.error("Parse internship error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}