import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { generateText } from "@/lib/openai"
import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/security"
import { z } from "zod"

const CoverLetterSchema = z.object({
  company:       z.string().min(2).max(100),
  role:          z.string().min(2).max(100),
  yourName:      z.string().min(2).max(100),
  skills:        z.array(z.string()).min(1),
  topProject:    z.string().min(10).max(500),
  tone:          z.enum(["professional", "friendly", "bold"]),
  companyContext: z.string().max(500).optional(),
})

const COVER_LETTER_PROMPT = `
You are an expert cover letter writer for Indian students applying to tech internships.

Rules:
- Do NOT start with "I am writing to apply for..."
- Be direct, confident, and genuine
- Mention the company specifically
- Reference 1 relevant project briefly
- Keep it to 3-4 short paragraphs
- End with a clear call to action
- professional = formal tone
- friendly = warm but respectful
- bold = confident and direct

Write only the cover letter text. No subject line. No JSON.
`

export async function POST(req: NextRequest) {
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

    const { success } = await checkRateLimit(user.id, true)
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const body = await req.json()
    const data = CoverLetterSchema.parse(body)

    const userPrompt = `
Company: ${data.company}
Role: ${data.role}
My name: ${data.yourName}
My skills: ${data.skills.join(", ")}
My best project: ${data.topProject}
Tone: ${data.tone}
About the company: ${data.companyContext ?? "Not provided"}

Write a cover letter for this internship application.
`

    const content = await generateText(COVER_LETTER_PROMPT, userPrompt, 1000)

    const saved = await prisma.coverLetter.create({
      data: {
        userId:  user.id,
        title:   `${data.company} — ${data.role}`,
        company: data.company,
        role:    data.role,
        content,
        tone:    data.tone,
      },
    })

    return NextResponse.json({ success: true, coverLetterId: saved.id, content })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 })
    }
    console.error("Cover letter error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}