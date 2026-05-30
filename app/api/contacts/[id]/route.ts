import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const UpdateSchema = z.object({
  name:               z.string().min(2).max(100).optional(),
  role:               z.string().max(100).optional(),
  email:              z.string().email().optional(),
  linkedinUrl:        z.string().optional(),
  verificationStatus: z.string().optional(),
  replyStatus:        z.string().optional(),
  doNotContact:       z.boolean().optional(),
  notes:              z.string().optional(),
  lastContactedAt:    z.string().optional(),
})

async function getUser() {
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
  return user
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const body   = await req.json()
    const data   = UpdateSchema.parse(body)

    const contact = await prisma.contact.update({
      where:  { id, userId: user.id },
      data:   {
        ...data,
        lastContactedAt: data.lastContactedAt
          ? new Date(data.lastContactedAt)
          : undefined,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json(contact)
  } catch (error) {
    console.error("Update contact error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params

    await prisma.contact.delete({
      where: { id, userId: user.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete contact error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}