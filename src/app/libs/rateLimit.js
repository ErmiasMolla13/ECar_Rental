// Lightweight in-memory rate limiter.
//
// NOTE: This is scoped to a single Node process. It's a real improvement
// over "no rate limiting at all" and works well for a single-server / dev
// deployment, but if you deploy multiple server instances behind a load
// balancer you'll want a shared store (e.g. Redis) instead, since each
// instance would otherwise track limits independently.

const buckets = new Map();

// Periodically clear stale buckets so this doesn't grow forever.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets.entries()) {
    if (now - bucket.windowStart > bucket.windowMs) buckets.delete(key);
  }
}, 5 * 60 * 1000).unref?.();

export function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

/**
 * Returns { limited: boolean, remaining: number, retryAfterSeconds: number }
 *
 * key      - unique bucket key, e.g. `login:${ip}:${email}`
 * limit    - max attempts allowed within windowMs
 * windowMs - time window in milliseconds
 */
export function checkRateLimit(key, limit = 5, windowMs = 60 * 1000) {
  const now = Date.now();
  let bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStart > windowMs) {
    bucket = { count: 0, windowStart: now, windowMs };
    buckets.set(key, bucket);
  }

  bucket.count += 1;

  const limited = bucket.count > limit;
  const retryAfterSeconds = Math.max(
    0,
    Math.ceil((bucket.windowStart + windowMs - now) / 1000)
  );

  return {
    limited,
    remaining: Math.max(0, limit - bucket.count),
    retryAfterSeconds,
  };
}
