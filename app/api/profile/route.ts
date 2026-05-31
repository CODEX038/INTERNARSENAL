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

    const metaName =
      user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      null

    const [profile, dbUser] = await Promise.all([
      prisma.profile.findUnique({
        where:   { userId: user.id },
        include: { projects: true, certifications: true },
      }),
      prisma.user.upsert({
        where:  { supabaseId: user.id },
        update: {},
        create: {
          id:         user.id,
          supabaseId: user.id,
          email:      user.email ?? "",
          name:       metaName ?? user.email ?? "",
        },
        select: { id: true, name: true, email: true },
      }),
    ])

    // Backfill rows that were created earlier with the email as the name
    if (metaName && (!dbUser.name || dbUser.name === dbUser.email)) {
      await prisma.user.update({
        where: { supabaseId: user.id },
        data:  { name: metaName },
      })
      dbUser.name = metaName
    }

    return NextResponse.json({
      profile: profile
        ? { ...profile, name: dbUser.name, email: dbUser.email }
        : { name: dbUser.name, email: dbUser.email },
    })
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
        skills:         body.skills ?? [],
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

    // Also update name in User table
    if (body.name) {
      await prisma.user.upsert({
        where:  { supabaseId: user.id },
        update: { name: body.name },
        create: {
          id:         user.id,
          supabaseId: user.id,
          email:      user.email ?? "",
          name:       body.name,
        },
      })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error("Update profile error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}