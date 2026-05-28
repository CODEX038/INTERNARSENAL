import { Redis } from "@upstash/redis"

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Cache TTL constants (in seconds)
export const TTL = {
  INTERNSHIPS: 60 * 30,    // 30 minutes
  DASHBOARD:   60 * 5,     // 5 minutes
  PROFILE:     60 * 10,    // 10 minutes
  COMPANIES:   60 * 60,    // 1 hour
  MATCH_SCORE: 60 * 15,    // 15 minutes
}

// Generic get with cache
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const cached = await redis.get<T>(key)
    return cached
  } catch {
    return null
  }
}

// Generic set with TTL
export async function setCached<T>(
  key: string,
  value: T,
  ttl: number
): Promise<void> {
  try {
    await redis.set(key, value, { ex: ttl })
  } catch {
    // fail silently — cache is optional
  }
}

// Delete cache key
export async function deleteCached(key: string): Promise<void> {
  try {
    await redis.del(key)
  } catch {}
}

// Cache key builders
export const cacheKeys = {
  internships: (filters: string) => `internships:${filters}`,
  dashboard:   (userId: string) => `dashboard:${userId}`,
  profile:     (userId: string) => `profile:${userId}`,
  companies:   (filters: string) => `companies:${filters}`,
  matchScore:  (userId: string, internshipId: string) => `match:${userId}:${internshipId}`,
}