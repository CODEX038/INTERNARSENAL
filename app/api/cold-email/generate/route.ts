import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { generateJSON } from "@/lib/openai"
import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/security"
import { z } from "zod"

const EMAIL_DAILY_LIMIT = 10

const EmailSchema = z.object({
  company:       z.string().min(2).max(100),
  recipientType: z.enum(["hr", "founder", "recruiter", "hiring_manager"]),
  role:          z.string().min(2).max(100),
  yourName:      z.string().min(2).max(100),
  yourSkills:    z.array(z.string()).min(1),
  achievement:   z.string().max(300).optional(),
  tone:          z.enum(["professional", "friendly", "bold"]),
})

const EMAIL_SYSTEM_PROMPT = `
You are an expert cold email writer for Indian students doing ethical outreach.

Rules:
- Under 150 words total
- First sentence: who you are and what you want
- Never say "I hope this email finds you well"
- Mention ONE specific thing about the company
- Include ONE achievement or project
- End with ONE clear ask (15-min call OR portfolio review)
- This is a one-time professional outreach, not spam

Return ONLY valid JSON:
{
  "subjectLines": ["option1", "option2", "option3"],
  "body": "full email text here"
}
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

    // Check daily email limit
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const sentToday = await prisma.coldEmail.count({
      where: {
        userId: user.id,
        status: "SENT",
        sentAt: { gte: today },
      },
    })
    if (sentToday >= EMAIL_DAILY_LIMIT) {
      return NextResponse.json(
        { error: "Daily email limit reached (10/day)" },
        { status: 429 }
      )
    }

    const body = await req.json()
    const data = EmailSchema.parse(body)

    const userPrompt = `
Company: ${data.company}
Recipient: ${data.recipientType}
Role I want: ${data.role}
My name: ${data.yourName}
My skills: ${data.yourSkills.join(", ")}
My achievement: ${data.achievement ?? "Not provided"}
Tone: ${data.tone}

Generate a cold email for this outreach.
`

    const result = await generateJSON<{
      subjectLines: string[]
      body: string
    }>(EMAIL_SYSTEM_PROMPT, userPrompt, 800)

    const saved = await prisma.coldEmail.create({
      data: {
        userId:        user.id,
        recipientType: data.recipientType,
        subject:       result.subjectLines[0],
        body:          result.body,
        status:        "DRAFT",
      },
    })

    return NextResponse.json({
      success:      true,
      emailId:      saved.id,
      subjectLines: result.subjectLines,
      body:         result.body,
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 })
    }
    console.error("Cold email error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}