import { NextRequest, NextResponse } from "next/server"
import { fetchAllInternships } from "@/jobs/fetchInternships"

// This route can be called by:
// 1. Vercel Cron (automatic, every 6 hours)
// 2. Manual trigger from admin
// 3. GitHub Actions scheduled job

export async function POST(req: NextRequest) {
  try {
    // Simple secret check to prevent abuse
    const authHeader = req.headers.get("authorization")
    const secret     = process.env.CRON_SECRET ?? "internarsenal-cron"

    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await fetchAllInternships()
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error("Fetch internships job error:", error)
    return NextResponse.json({ error: "Job failed" }, { status: 500 })
  }
}

// Allow GET for Vercel Cron
export async function GET(req: NextRequest) {
  return POST(req)
}