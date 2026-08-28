/**
 * Simple in-memory IP-based rate limiter.
 * Not suitable for distributed systems; works for single-server deployments.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Clean up old entries periodically (every 5 minutes)
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  const cutoff = now - windowMs;
  for (const [key, entry] of store.entries()) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    if (entry.timestamps.length === 0) {
      store.delete(key);
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs?: number;
}

/**
 * Check rate limit for a given key (e.g., IP address).
 * @param key - unique identifier (usually IP)
 * @param limit - max requests per window
 * @param windowMs - time window in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  cleanup(windowMs);
  const now = Date.now();
  const cutoff = now - windowMs;

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

  if (entry.timestamps.length >= limit) {
    const oldest = entry.timestamps[0];
    const retryAfterMs = oldest + windowMs - now;
    return { allowed: false, retryAfterMs };
  }

  entry.timestamps.push(now);
  return { allowed: true };
}

/**
 * Extract client IP from request headers.
 * Returns "unknown" if not found.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    // x-forwarded-for may contain multiple IPs; first is client
    const first = forwarded.split(",")[0].trim();
    if (first) return first;
  }
  // Fallback to a random identifier (not ideal)
  return "unknown";
}