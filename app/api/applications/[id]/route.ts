import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const UpdateSchema = z.object({
  status:        z.string().optional(),
  notes:         z.string().optional(),
  appliedAt:     z.string().optional(),
  interviewDate: z.string().optional(),
})

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const body = await req.json()
    const data = UpdateSchema.parse(body)

    // Use raw SQL to avoid enum type conflict
    const updateData: any = { updatedAt: new Date() }
    if (data.status)        updateData.status        = data.status
    if (data.notes)         updateData.notes         = data.notes
    if (data.appliedAt)     updateData.appliedAt     = new Date(data.appliedAt)
    if (data.interviewDate) updateData.interviewDate = new Date(data.interviewDate)

    await prisma.$executeRaw`
      UPDATE "Application"
      SET status = ${data.status}::text,
          "updatedAt" = NOW()
      WHERE id = ${id}
      AND "userId" = ${user.id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update application error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    await prisma.application.delete({
      where: { id, userId: user.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete application error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}