import { describe, expect, it } from "vitest";
import { hit } from "./rate-limit";

describe("rate limiter", () => {
  it("allows requests up to the limit", () => {
    const key = `test-allow-${Math.random()}`;
    for (let i = 0; i < 5; i++) {
      const result = hit(key, 5, 60_000);
      expect(result.allowed).toBe(true);
    }
  });

  it("blocks requests beyond the limit", () => {
    const key = `test-block-${Math.random()}`;
    for (let i = 0; i < 3; i++) hit(key, 3, 60_000);
    const blocked = hit(key, 3, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it("tracks separate keys independently", () => {
    const a = `test-a-${Math.random()}`;
    const b = `test-b-${Math.random()}`;
    hit(a, 1, 60_000);
    expect(hit(a, 1, 60_000).allowed).toBe(false);
    expect(hit(b, 1, 60_000).allowed).toBe(true);
  });

  it("reports remaining count", () => {
    const key = `test-remaining-${Math.random()}`;
    expect(hit(key, 3, 60_000).remaining).toBe(2);
    expect(hit(key, 3, 60_000).remaining).toBe(1);
    expect(hit(key, 3, 60_000).remaining).toBe(0);
  });
});
