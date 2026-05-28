import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// 10 requests per 10 seconds per user
export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  analytics: true,
})

// AI endpoints — stricter limit (5 per minute)
export const aiRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "60 s"),
  analytics: true,
})

export async function checkRateLimit(identifier: string, isAI = false) {
  const limiter = isAI ? aiRatelimit : ratelimit
  const { success, limit, remaining } = await limiter.limit(identifier)
  return { success, limit, remaining }
}