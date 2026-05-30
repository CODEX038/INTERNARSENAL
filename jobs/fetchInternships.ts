import axios from "axios"
import { prisma } from "@/lib/prisma"

// ─── REMOTIVE API (100% free, no auth needed) ───────────────
async function fetchFromRemotive() {
  try {
    console.log("Fetching from Remotive...")
    const res = await axios.get(
      "https://remotive.com/api/remote-jobs?category=software-dev&limit=20",
      { timeout: 10000 }
    )

    const jobs = res.data?.jobs ?? []
    let added = 0

    for (const job of jobs) {
      try {
        // Check if already exists
        const existing = await prisma.internship.findFirst({
          where: { sourceId: String(job.id), source: "remotive" },
        })
        if (existing) continue

        // Filter for internship-like roles
        const title = (job.title ?? "").toLowerCase()
        const isInternship =
          title.includes("intern") ||
          title.includes("junior") ||
          title.includes("entry") ||
          title.includes("graduate") ||
          title.includes("fresher")

        if (!isInternship) continue

        // Extract skills from tags
        const skills = (job.tags ?? []).slice(0, 8)

        await prisma.internship.create({
          data: {
            title:          job.title,
            company:        job.company_name ?? "Unknown",
            description:    job.description ?? job.title,
            requiredSkills: skills,
            city:           null,
            state:          null,
            workMode:       "remote",
            stipend:        null,
            duration:       null,
            applyUrl:       job.url ?? "https://remotive.com",
            source:         "remotive",
            sourceId:       String(job.id),
            isActive:       true,
          },
        })
        added++
      } catch {
        // Skip individual failures
      }
    }

    console.log(`Remotive: added ${added} new internships`)
    return added
  } catch (error) {
    console.error("Remotive fetch failed:", error)
    return 0
  }
}

// ─── ARBEITNOW API (free, Europe + Remote jobs) ─────────────
async function fetchFromArbeitnow() {
  try {
    console.log("Fetching from Arbeitnow...")
    const res = await axios.get(
      "https://www.arbeitnow.com/api/job-board-api?page=1",
      { timeout: 10000 }
    )

    const jobs = res.data?.data ?? []
    let added = 0

    for (const job of jobs) {
      try {
        const existing = await prisma.internship.findFirst({
          where: { sourceId: String(job.slug), source: "arbeitnow" },
        })
        if (existing) continue

        const title = (job.title ?? "").toLowerCase()
        const isInternship =
          title.includes("intern") ||
          title.includes("junior") ||
          title.includes("entry level") ||
          title.includes("graduate")

        if (!isInternship) continue

        const skills = (job.tags ?? []).slice(0, 8)

        await prisma.internship.create({
          data: {
            title:          job.title,
            company:        job.company_name ?? "Unknown",
            description:    job.description ?? job.title,
            requiredSkills: skills,
            city:           job.location ?? null,
            state:          null,
            workMode:       job.remote ? "remote" : "onsite",
            stipend:        null,
            duration:       null,
            applyUrl:       job.url ?? "https://arbeitnow.com",
            source:         "arbeitnow",
            sourceId:       String(job.slug),
            isActive:       true,
          },
        })
        added++
      } catch {
        // Skip individual failures
      }
    }

    console.log(`Arbeitnow: added ${added} new internships`)
    return added
  } catch (error) {
    console.error("Arbeitnow fetch failed:", error)
    return 0
  }
}

// ─── MAIN FETCH FUNCTION ────────────────────────────────────
export async function fetchAllInternships() {
  console.log("Starting internship fetch job...")
  const start = Date.now()

  const [remotive, arbeitnow] = await Promise.all([
    fetchFromRemotive(),
    fetchFromArbeitnow(),
  ])

  const total   = remotive + arbeitnow
  const elapsed = ((Date.now() - start) / 1000).toFixed(1)

  console.log(`Fetch complete: ${total} new internships in ${elapsed}s`)
  return { remotive, arbeitnow, total }
}