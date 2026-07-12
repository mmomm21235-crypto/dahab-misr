import { describe, it, expect } from "vitest";
import { formatPrice, formatPercent, getKaratLabel } from "@/lib/utils";

describe("formatPrice", () => {
  it("formats price with Arabic locale", () => {
    expect(formatPrice(3800)).toBe("٣٬٨٠٠");
  });

  it("formats zero", () => {
    expect(formatPrice(0)).toBe("٠");
  });

  it("formats large numbers", () => {
    expect(formatPrice(1000000)).toBe("١٬٠٠٠٬٠٠٠");
  });
});

describe("formatPercent", () => {
  it("adds plus sign for positive", () => {
    expect(formatPercent(1.5)).toBe("+1.50%");
  });

  it("adds minus sign for negative", () => {
    expect(formatPercent(-0.75)).toBe("-0.75%");
  });

  it("handles zero", () => {
    expect(formatPercent(0)).toBe("+0.00%");
  });
});

describe("getKaratLabel", () => {
  it("returns correct label for karat 24", () => {
    expect(getKaratLabel(24)).toBe("عيار 24");
  });

  it("returns correct label for karat 21", () => {
    expect(getKaratLabel(21)).toBe("عيار 21");
  });

  it("returns correct label for pound", () => {
    expect(getKaratLabel("pound")).toBe("الجنيه الذهب");
  });
});
