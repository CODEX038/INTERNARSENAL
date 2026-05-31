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

    const [resumes, coverLetters, coldEmails] = await Promise.all([
      prisma.resume.findMany({
        where:   { userId: user.id },
        orderBy: { createdAt: "desc" },
        select: {
          id:              true,
          title:           true,
          role:            true,
          atsScore:        true,
          keywords:        true,
          missingKeywords: true,
          createdAt:       true,
          content:         true,
        },
      }),
      prisma.coverLetter.findMany({
        where:   { userId: user.id },
        orderBy: { createdAt: "desc" },
        select: {
          id:        true,
          title:     true,
          company:   true,
          role:      true,
          tone:      true,
          content:   true,
          createdAt: true,
        },
      }),
      prisma.coldEmail.findMany({
        where:   { userId: user.id },
        orderBy: { createdAt: "desc" },
        select: {
          id:            true,
          subject:       true,
          body:          true,
          status:        true,
          recipientType: true,
          createdAt:     true,
        },
      }),
    ])

    return NextResponse.json({ resumes, coverLetters, coldEmails })
  } catch (error) {
    console.error("Library error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
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

    const { searchParams } = new URL(req.url)
    const id   = searchParams.get("id")
    const type = searchParams.get("type")

    if (!id || !type) {
      return NextResponse.json({ error: "Missing id or type" }, { status: 400 })
    }

    if (type === "resume") {
      await prisma.resume.delete({ where: { id, userId: user.id } })
    } else if (type === "coverLetter") {
      await prisma.coverLetter.delete({ where: { id, userId: user.id } })
    } else if (type === "coldEmail") {
      await prisma.coldEmail.delete({ where: { id, userId: user.id } })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete library item error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}