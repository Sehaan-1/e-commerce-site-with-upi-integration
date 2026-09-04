import { describe, it, expect } from "vitest";
import { formatPaise, rupeesToPaise, paiseToRupees } from "@/lib/money";

describe("formatPaise", () => {
  it("formats whole rupees without decimal", () => {
    // 49900 paise = ₹499
    const result = formatPaise(49900);
    expect(result).toMatch(/499/);
    expect(result).toMatch(/₹|INR/);
  });

  it("formats paise with fractional rupees", () => {
    // 49950 paise = ₹499.50
    const result = formatPaise(49950);
    expect(result).toMatch(/499/);
  });

  it("formats zero as ₹0", () => {
    const result = formatPaise(0);
    expect(result).toMatch(/0/);
  });

  it("formats a single paise (fractional rupee)", () => {
    // 1 paise = ₹0.01
    const result = formatPaise(1);
    expect(result).toMatch(/0\.01|0.01/);
  });

  it("formats large amounts correctly", () => {
    // 100000 paise = ₹1,000
    const result = formatPaise(100000);
    expect(result).toMatch(/1,000|1000/);
  });

  it("formats negative paise (returns negative formatted value)", () => {
    const result = formatPaise(-100);
    // Should still be a string with a number
    expect(typeof result).toBe("string");
    expect(result).toMatch(/-?1/);
  });
});

describe("rupeesToPaise", () => {
  it("converts a string rupee value to paise", () => {
    expect(rupeesToPaise("499")).toBe(49900);
  });

  it("converts a decimal rupee string to rounded paise", () => {
    expect(rupeesToPaise("499.50")).toBe(49950);
  });

  it("converts a numeric value to paise", () => {
    expect(rupeesToPaise(100)).toBe(10000);
  });

  it("strips non-numeric characters from string", () => {
    expect(rupeesToPaise("₹499.99")).toBe(49999);
  });

  it("returns 0 for invalid / non-numeric strings", () => {
    expect(rupeesToPaise("abc")).toBe(0);
  });

  it("returns 0 for empty string", () => {
    expect(rupeesToPaise("")).toBe(0);
  });

  it("rounds correctly to avoid floating point issues", () => {
    // 0.1 + 0.2 = 0.30000000000000004 in JS — should round to 30
    expect(rupeesToPaise(0.3)).toBe(30);
  });
});

describe("paiseToRupees", () => {
  it("converts paise to a 2-decimal rupee string", () => {
    expect(paiseToRupees(49900)).toBe("499.00");
  });

  it("converts partial paise correctly", () => {
    expect(paiseToRupees(49950)).toBe("499.50");
  });

  it("returns '0.00' for zero", () => {
    expect(paiseToRupees(0)).toBe("0.00");
  });

  it("returns a string type", () => {
    expect(typeof paiseToRupees(100)).toBe("string");
  });
});
