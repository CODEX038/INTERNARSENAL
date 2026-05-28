import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { groq } from "@/lib/openai"
import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/security"
import { z } from "zod"

const ChatSchema = z.object({
  message: z.string().min(1).max(1000),
  history: z.array(z.object({
    role:    z.enum(["user", "assistant"]),
    content: z.string(),
  })).max(20).default([]),
})

const RAG_SYSTEM_PROMPT = `
You are InternBot — an AI career assistant for Indian engineering students.
You help students find internships, improve their profiles, and land their dream roles.

You have access to a database of internships. When relevant internships are provided
in the context, use them to give specific, actionable advice.

Guidelines:
- Be friendly, encouraging, and specific
- Always reference actual internship data when available
- Give actionable next steps
- For resume/email questions, give concrete examples
- Keep responses concise but helpful
- Use Indian context (cities, companies, platforms)

If no relevant internships are found, give general career advice.
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

    // 2. Rate limit
    const { success } = await checkRateLimit(user.id, true)
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    // 3. Validate
    const body = await req.json()
    const { message, history } = ChatSchema.parse(body)

    // 4. Get user profile for personalization
    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
      include: { projects: true },
    })

    // 5. RAG — Keyword-based retrieval
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const keywords = message
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(" ")
      .filter(w => w.length > 3)
      .slice(0, 5)

    const { data: relevantInternships } = await supabaseAdmin
      .from("Internship")
      .select("id, title, company, description, city, workMode")
      .or(
        keywords
          .map(k => `title.ilike.%${k}%,description.ilike.%${k}%,company.ilike.%${k}%`)
          .join(",")
      )
      .eq("isActive", true)
      .limit(5)

    // 6. Build context from retrieved internships
    let internshipContext = ""
    if (relevantInternships && relevantInternships.length > 0) {
      internshipContext = `
Relevant internships from database:
${relevantInternships.map((i: any, idx: number) => `
${idx + 1}. ${i.title} at ${i.company}
   Location: ${i.city ?? "Remote"} | Mode: ${i.workMode}
`).join("")}
`
    }

    // 7. Build personalized context
    const userContext = profile ? `
Student Profile:
- Skills: ${profile.skills?.join(", ") ?? "Not set"}
- City: ${profile.city ?? "Not set"}
- Work mode preference: ${profile.workMode ?? "Not set"}
- Projects: ${profile.projects.map(p => p.name).join(", ") || "None added"}
` : "Student has not set up their profile yet."

    // 8. Augmented prompt with retrieved context
    const augmentedSystemPrompt = `
${RAG_SYSTEM_PROMPT}

${userContext}

${internshipContext}

Answer the student's question using the above context where relevant.
`

    // 9. Generate response with Groq
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: augmentedSystemPrompt },
        ...history,
        { role: "user", content: message },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    })

    const reply = response.choices[0]?.message?.content ?? "Sorry, I could not generate a response."

    // 10. Save chat history to DB
    await prisma.chatMessage.createMany({
      data: [
        { userId: user.id, role: "user",      content: message },
        { userId: user.id, role: "assistant", content: reply   },
      ],
    })

    return NextResponse.json({
      reply,
      internshipsFound: relevantInternships?.length ?? 0,
      searchType: "keyword-rag",
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 })
    }
    console.error("Chat error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}