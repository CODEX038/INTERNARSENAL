// ─── MATCHING ALGORITHM ─────────────────────────────────────
// 5-factor weighted scoring system
// Demonstrates: DSA, weighted algorithms, problem solving

export const MATCH_WEIGHTS = {
  skillMatch:       0.35,  // 35% — most important
  projectRelevance: 0.25,  // 25% — second most important
  locationMatch:    0.20,  // 20% — third
  keywordMatch:     0.10,  // 10% — fourth
  companyRelevance: 0.10,  // 10% — fifth
}

export interface MatchInput {
  userSkills:    string[]
  userProjects:  { tech: string[]; description: string }[]
  userCity:      string | null
  userWorkMode:  string | null
  openToRelocate: boolean
  internship: {
    requiredSkills: string[]
    description:    string
    city:           string | null
    workMode:       string
    company:        string
  }
}

export interface MatchResult {
  total:         number
  breakdown:     Record<string, number>
  matchedSkills: string[]
  missingSkills: string[]
  suggestions:   string[]
}

// ─── HAVERSINE DISTANCE ─────────────────────────────────────
// Calculates distance between two coordinates in km
// Used for location-based internship ranking

export function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371 // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// ─── SKILL NORMALIZER ───────────────────────────────────────
// Normalizes skill strings for comparison
// e.g. "ReactJS" === "React.js" === "React"

function normalizeSkill(skill: string): string {
  return skill
    .toLowerCase()
    .replace(/[.\-_\s]/g, "")
    .replace("reactjs", "react")
    .replace("nodejs", "node")
    .replace("vuejs", "vue")
    .replace("nextjs", "next")
}

// ─── SKILL MATCHER ──────────────────────────────────────────
// Fuzzy skill matching — handles variations

function skillsMatch(userSkill: string, requiredSkill: string): boolean {
  const u = normalizeSkill(userSkill)
  const r = normalizeSkill(requiredSkill)
  return u === r || u.includes(r) || r.includes(u)
}

// ─── MAIN MATCHING ALGORITHM ────────────────────────────────

export function calculateMatchScore(input: MatchInput): MatchResult {
  const {
    userSkills,
    userProjects,
    userCity,
    userWorkMode,
    openToRelocate,
    internship,
  } = input

  // ── Factor 1: Skill Match (35%) ──────────────────────────
  const matchedSkills = userSkills.filter(skill =>
    internship.requiredSkills.some(req => skillsMatch(skill, req))
  )
  const missingSkills = internship.requiredSkills.filter(req =>
    !userSkills.some(skill => skillsMatch(skill, req))
  )
  const skillScore = internship.requiredSkills.length > 0
    ? (matchedSkills.length / internship.requiredSkills.length) * 100
    : 50

  // ── Factor 2: Project Relevance (25%) ───────────────────
  const projectTech = userProjects.flatMap(p => p.tech)
  const projectMatches = internship.requiredSkills.filter(req =>
    projectTech.some(t => skillsMatch(t, req))
  )
  const projectScore = internship.requiredSkills.length > 0
    ? (projectMatches.length / internship.requiredSkills.length) * 100
    : 50

  // ── Factor 3: Location Match (20%) ──────────────────────
  let locationScore = 0
  if (
    internship.workMode === "remote" ||
    userWorkMode === "remote"
  ) {
    locationScore = 100
  } else if (
    userCity &&
    internship.city &&
    userCity.toLowerCase() === internship.city.toLowerCase()
  ) {
    locationScore = 100
  } else if (openToRelocate) {
    locationScore = 60
  } else if (internship.workMode === "hybrid") {
    locationScore = 40
  } else {
    locationScore = 20
  }

  // ── Factor 4: Keyword Match (10%) ───────────────────────
  const jdWords = internship.description.toLowerCase().split(/\s+/)
  const keywordMatches = userSkills.filter(skill =>
    jdWords.some(word => normalizeSkill(word).includes(normalizeSkill(skill)))
  )
  const keywordScore = Math.min(
    (keywordMatches.length / Math.max(userSkills.length, 1)) * 100,
    100
  )

  // ── Factor 5: Company Relevance (10%) ───────────────────
  // Can be enhanced with user preference data
  const companyScore = 70

  // ── Weighted Total ───────────────────────────────────────
  const total = Math.round(
    skillScore    * MATCH_WEIGHTS.skillMatch +
    projectScore  * MATCH_WEIGHTS.projectRelevance +
    locationScore * MATCH_WEIGHTS.locationMatch +
    keywordScore  * MATCH_WEIGHTS.keywordMatch +
    companyScore  * MATCH_WEIGHTS.companyRelevance
  )

  // ── Suggestions ─────────────────────────────────────────
  const suggestions: string[] = []
  if (missingSkills.length > 0) {
    suggestions.push(`Learn ${missingSkills.slice(0, 2).join(" and ")} to improve your match`)
  }
  if (projectScore < 50) {
    suggestions.push("Add a project using the required tech stack")
  }
  if (locationScore < 60 && !openToRelocate) {
    suggestions.push("Enable 'Open to relocate' to see more matches")
  }

  return {
    total:         Math.min(total, 100),
    breakdown: {
      skills:    Math.round(skillScore),
      projects:  Math.round(projectScore),
      location:  Math.round(locationScore),
      keywords:  Math.round(keywordScore),
      company:   Math.round(companyScore),
    },
    matchedSkills,
    missingSkills,
    suggestions,
  }
}

// ─── DEDUPLICATION ──────────────────────────────────────────
// Hash-based deduplication for internship listings
// Prevents same internship appearing twice from different sources

export function deduplicateInternships<T extends {
  title: string
  company: string
  city: string | null
}>(internships: T[]): T[] {
  const seen = new Set<string>()
  return internships.filter(i => {
    const hash = `${i.title.toLowerCase()}_${i.company.toLowerCase()}_${i.city?.toLowerCase() ?? "remote"}`
    if (seen.has(hash)) return false
    seen.add(hash)
    return true
  })
}

// ─── RANKING ALGORITHM ──────────────────────────────────────
// Sorts internships by match score + recency + stipend

export function rankInternships<T extends {
  matchScore?: number
  postedAt?:   Date | string
  stipend?:    number | null
}>(internships: T[]): T[] {
  return [...internships].sort((a, b) => {
    // Primary: match score
    const scoreDiff = (b.matchScore ?? 0) - (a.matchScore ?? 0)
    if (Math.abs(scoreDiff) > 10) return scoreDiff

    // Secondary: recency
    const dateA = new Date(a.postedAt ?? 0).getTime()
    const dateB = new Date(b.postedAt ?? 0).getTime()
    if (dateA !== dateB) return dateB - dateA

    // Tertiary: stipend
    return (b.stipend ?? 0) - (a.stipend ?? 0)
  })
}