import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis =
  UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: UPSTASH_REDIS_REST_URL,
        token: UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

type RateResult = { success: boolean; remaining: number; reset: number };

function disabledResult(): RateResult {
  return { success: true, remaining: Number.POSITIVE_INFINITY, reset: 0 };
}

const inMemoryStore = new Map<string, { count: number; reset: number }>();

function inMemoryLimit(key: string, limit: number, windowSec: number): RateResult {
  const now = Date.now();
  const entry = inMemoryStore.get(key);
  if (!entry || entry.reset < now) {
    inMemoryStore.set(key, { count: 1, reset: now + windowSec * 1000 });
    return { success: true, remaining: limit - 1, reset: now + windowSec * 1000 };
  }
  entry.count += 1;
  return {
    success: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
    reset: entry.reset,
  };
}

export function createRateLimiter(opts: {
  prefix: string;
  limit: number;
  windowSec: number;
}) {
  const ratelimit = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(opts.limit, `${opts.windowSec} s`),
        prefix: `ratelimit:${opts.prefix}`,
        analytics: true,
      })
    : null;

  return async function limit(identifier: string): Promise<RateResult> {
    if (!ratelimit) {
      return inMemoryLimit(`${opts.prefix}:${identifier}`, opts.limit, opts.windowSec);
    }
    const { success, remaining, reset } = await ratelimit.limit(identifier);
    return { success, remaining, reset };
  };
}

export function getClientIdentifier(request: Request, fallbackKey: string) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return fallbackKey;
}
