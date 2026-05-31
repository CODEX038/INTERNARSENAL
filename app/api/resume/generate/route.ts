import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { generateJSON } from "@/lib/openai"
import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/security"
import { z } from "zod"

const ResumeSchema = z.object({
  role:           z.string().min(2).max(100),
  jobDescription: z.string().min(10).max(20000),
  skills:         z.array(z.string()).min(1).max(50),
  education:      z.string().min(2).max(1000),
  projects: z.array(z.object({
    name:        z.string(),
    description: z.string(),
    tech:        z.array(z.string()),
    url:         z.string().optional(),
  })).max(30),
  achievements: z.array(z.string()).max(30).optional(),
  name:         z.string().min(2).max(100),
  email:        z.string().email(),
  githubUrl:    z.string().optional(),
  linkedinUrl:  z.string().optional(),
  city:         z.string().optional(),
})

const RESUME_SYSTEM_PROMPT = `
You are an expert ATS-optimized resume writer for Indian tech internships.

Your task:
1. Analyze the job description and extract important keywords
2. Write a complete ATS-friendly resume tailored to the role
3. Use strong action verbs: Built, Developed, Designed, Implemented, Optimized
4. Quantify achievements where possible
5. Match keywords from the job description naturally

Return ONLY valid JSON with this exact structure:
{
  "contactInfo": {
    "name": "",
    "email": "",
    "github": "",
    "linkedin": "",
    "city": ""
  },
  "summary": "2-3 sentence professional summary targeting this specific role",
  "skills": {
    "languages": [],
    "frameworks": [],
    "tools": [],
    "databases": []
  },
  "projects": [
    {
      "name": "",
      "tech": [],
      "bullets": ["Action verb + what you built + impact/result"],
      "url": ""
    }
  ],
  "education": {
    "degree": "",
    "institution": "",
    "year": "",
    "cgpa": ""
  },
  "certifications": [],
  "keywords": ["keywords extracted from JD"],
  "missingKeywords": ["important JD keywords not in user profile"],
  "atsScore": 0
}

ATS score rules:
- 90-100: Excellent keyword match
- 70-89: Good match, minor gaps
- 50-69: Average, needs improvement
- Below 50: Poor match

Never fabricate experience. Only use what the user provides.
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
      return NextResponse.json(
        { error: "Too many requests. Wait a minute." },
        { status: 429 }
      )
    }

    // 3. Validate
    const body = await req.json()
    const data = ResumeSchema.parse(body)

    // 4. Build user prompt
    const userPrompt = `
Role: ${data.role}

Job Description:
${data.jobDescription}

My Information:
Name: ${data.name}
Email: ${data.email}
City: ${data.city ?? "Not specified"}
GitHub: ${data.githubUrl ?? "Not provided"}
LinkedIn: ${data.linkedinUrl ?? "Not provided"}

My Skills: ${data.skills.join(", ")}

My Education: ${data.education}

My Projects:
${data.projects.map(p => `
- ${p.name}: ${p.description}
  Tech: ${p.tech.join(", ")}
  URL: ${p.url ?? "Not provided"}
`).join("")}

Achievements: ${data.achievements?.join(", ") ?? "None provided"}

Generate an ATS-optimized resume for this role.
`

    // 5. Generate with the LLM
    const resume = await generateJSON<{
      contactInfo: object
      summary: string
      skills: object
      projects: object[]
      education: object
      certifications: string[]
      keywords: string[]
      missingKeywords: string[]
      atsScore: number
    }>(RESUME_SYSTEM_PROMPT, userPrompt, 3000)

    // 6. Save to DB
    const saved = await prisma.resume.create({
      data: {
        userId:          user.id,
        title:           `${data.role} Resume`,
        role:            data.role,
        content:         resume as object,
        atsScore:        resume.atsScore,
        keywords:        resume.keywords,
        missingKeywords: resume.missingKeywords,
      },
    })

    return NextResponse.json({
      success: true,
      resumeId: saved.id,
      resume,
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.flatten().fieldErrors
      const firstMsg = Object.values(fieldErrors).flat().filter(Boolean)[0] ?? "Invalid input"
      return NextResponse.json({ error: firstMsg, fieldErrors }, { status: 400 })
    }
    console.error("Resume generation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}