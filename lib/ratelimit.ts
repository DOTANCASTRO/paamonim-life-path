// In-memory rate limiter per IP.
// Works within a single serverless instance — a lightweight first layer
// before adding Redis (Upstash) at higher scale.

interface BucketEntry {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, BucketEntry>();

// Purge expired entries every 5 minutes to avoid memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of buckets.entries()) {
    if (entry.resetAt < now) buckets.delete(key);
  }
}, 5 * 60 * 1000);

export function checkRateLimit(
  ip: string,
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const bucketKey = `${key}:${ip}`;
  const now = Date.now();
  const entry = buckets.get(bucketKey);

  if (!entry || entry.resetAt < now) {
    buckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

export function getClientIp(req: Request): string {
  const forwarded = (req.headers as Headers).get('x-forwarded-for') ?? '';
  return (forwarded.split(',')[0] ?? 'unknown').trim();
}
