import { describe, expect, it } from "vitest";
import { formatDuration, formatYear, toPersianDigits } from "./format";

describe("toPersianDigits", () => {
  it("converts Western digits to Persian digits", () => {
    expect(toPersianDigits("1403")).toBe("۱۴۰۳");
    expect(toPersianDigits(42)).toBe("۴۲");
  });

  it("leaves non-digits untouched", () => {
    expect(toPersianDigits("a-b")).toBe("a-b");
  });
});

describe("formatDuration", () => {
  it("formats seconds as m:ss with Persian digits", () => {
    expect(formatDuration(0)).toBe("۰:۰۰");
    expect(formatDuration(65)).toBe("۱:۰۵");
    expect(formatDuration(600)).toBe("۱۰:۰۰");
  });

  it("handles invalid input gracefully", () => {
    expect(formatDuration(-5)).toBe("۰:۰۰");
    expect(formatDuration(Number.NaN)).toBe("۰:۰۰");
  });
});

describe("formatYear", () => {
  it("formats a year with Persian digits", () => {
    expect(formatYear(1403)).toBe("۱۴۰۳");
  });
});
