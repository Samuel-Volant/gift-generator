import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { rateLimit, getClientIp } from "./rate-limit";

describe("rateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests within limit", () => {
    const result = rateLimit("ip1", 5, 60000);
    expect(result.allowed).toBe(true);
    expect(result.retryAfterMs).toBeUndefined();
  });

  it("denies requests exceeding limit", () => {
    for (let i = 0; i < 5; i++) {
      rateLimit("ip2", 5, 60000);
    }
    const result = rateLimit("ip2", 5, 60000);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeGreaterThan(0);
    expect(result.retryAfterMs).toBeLessThanOrEqual(60000);
  });

  it("allows requests after window expires", () => {
    for (let i = 0; i < 5; i++) {
      rateLimit("ip3", 5, 60000);
    }
    // Advance time by 60 seconds
    vi.advanceTimersByTime(60000);
    const result = rateLimit("ip3", 5, 60000);
    expect(result.allowed).toBe(true);
  });

  it("does not mix different IPs", () => {
    for (let i = 0; i < 5; i++) {
      rateLimit("ip4", 5, 60000);
    }
    const result = rateLimit("ip5", 5, 60000);
    expect(result.allowed).toBe(true);
  });

  it("cleans up old entries", () => {
    rateLimit("ip6", 5, 60000);
    vi.advanceTimersByTime(5 * 60 * 1000 + 1); // trigger cleanup
    // Should allow again
    const result = rateLimit("ip6", 5, 60000);
    expect(result.allowed).toBe(true);
  });
});

describe("getClientIp", () => {
  it("extracts first IP from x-forwarded-for", () => {
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(getClientIp(req)).toBe("1.2.3.4");
  });

  it("returns unknown when header missing", () => {
    const req = new Request("http://localhost");
    expect(getClientIp(req)).toBe("unknown");
  });
});