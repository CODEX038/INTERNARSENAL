import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"

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

    const profile = await prisma.profile.findUnique({
      where:   { userId: user.id },
      include: { projects: true, certifications: true },
    })

    return NextResponse.json({ profile })
  } catch (error) {
    console.error("Get profile error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
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

    const body = await req.json()

    const profile = await prisma.profile.upsert({
      where:  { userId: user.id },
      update: {
        college:        body.college,
        degree:         body.degree,
        year:           body.year,
        cgpa:           body.cgpa,
        city:           body.city,
        state:          body.state,
        workMode:       body.workMode,
        skills:         body.skills,
        githubUrl:      body.githubUrl,
        linkedinUrl:    body.linkedinUrl,
        portfolioUrl:   body.portfolioUrl,
        bio:            body.bio,
        openToRelocate: body.openToRelocate,
        updatedAt:      new Date(),
      },
      create: {
        userId:         user.id,
        college:        body.college,
        degree:         body.degree,
        year:           body.year,
        cgpa:           body.cgpa,
        city:           body.city,
        state:          body.state,
        workMode:       body.workMode,
        skills:         body.skills ?? [],
        githubUrl:      body.githubUrl,
        linkedinUrl:    body.linkedinUrl,
        portfolioUrl:   body.portfolioUrl,
        bio:            body.bio,
        openToRelocate: body.openToRelocate ?? false,
        achievements:   [],
        updatedAt:      new Date(),
      },
    })

    return NextResponse.json({ profile })
  } catch (error) {
    console.error("Update profile error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}