import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/security"
import { z } from "zod"

const ContactSchema = z.object({
  name:               z.string().min(2).max(100),
  role:               z.string().max(100).optional(),
  email:              z.string().email().optional(),
  linkedinUrl:        z.string().url().optional().or(z.literal("")),
  companyId:          z.string().optional(),
  source:             z.string().optional(),
  verificationStatus: z.enum(["verified", "unverified", "bounced", "do_not_contact"]).optional(),
  notes:              z.string().max(1000).optional(),
})

async function getUser(_req: NextRequest) {
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

export async function GET(req: NextRequest) {
  try {
    const user = await getUser(req)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const search  = searchParams.get("search")
    const status  = searchParams.get("status")
    const company = searchParams.get("company")

    const where: Record<string, unknown> = { userId: user.id }
    if (search) {
      where.OR = [
        { name:  { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { role:  { contains: search, mode: "insensitive" } },
      ]
    }
    if (status)  where.verificationStatus = status
    if (company) where.companyId          = company

    const contacts = await prisma.contact.findMany({
      where,
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ contacts })
  } catch (error) {
    console.error("Get contacts error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { success } = await checkRateLimit(user.id)
    if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 })

    const body = await req.json()
    const data = ContactSchema.parse(body)

    // Check duplicate email
    if (data.email) {
      const existing = await prisma.contact.findFirst({
        where: { userId: user.id, email: data.email },
      })
      if (existing) {
        return NextResponse.json(
          { error: "Contact with this email already exists" },
          { status: 409 }
        )
      }
    }

    const contact = await prisma.contact.create({
      data: { ...data, userId: user.id },
    })

    return NextResponse.json(contact, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 })
    }
    console.error("Create contact error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}