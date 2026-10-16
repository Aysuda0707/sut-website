/**
 * Minimal in-memory sliding-window rate limiter.
 *
 * Suitable for a single-instance deployment (the default Docker Compose setup).
 * For multi-instance deployments, swap the store for Redis/Upstash — the
 * interface is intentionally small so only `hit()` needs reimplementing.
 *
 * Note: this module is imported by middleware, which runs on the Edge runtime.
 * It uses no Node-only APIs.
 */

interface Bucket {
  /** Timestamps (ms) of recent requests within the window. */
  hits: number[];
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Seconds until the oldest hit leaves the window (for Retry-After). */
  retryAfter: number;
}

/**
 * Records a hit for `key` and reports whether it is within the limit.
 *
 * @param key      Unique identifier (e.g. `search:${ip}`).
 * @param limit    Max requests allowed per window.
 * @param windowMs Window length in milliseconds.
 */
export function hit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { hits: [] };

  // Drop hits outside the window.
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);

  if (bucket.hits.length >= limit) {
    const oldest = bucket.hits[0];
    const retryAfter = Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000));
    buckets.set(key, bucket);
    return { allowed: false, remaining: 0, retryAfter };
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);

  // Opportunistic cleanup to bound memory on long-lived instances.
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) {
      if (b.hits.every((t) => now - t >= windowMs)) buckets.delete(k);
    }
  }

  return { allowed: true, remaining: limit - bucket.hits.length, retryAfter: 0 };
}
