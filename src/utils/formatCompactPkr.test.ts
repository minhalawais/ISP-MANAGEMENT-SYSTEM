import { formatCompactPkr, formatCountLabel } from "./formatCompactPkr.ts"

describe("formatCompactPkr", () => {
  test("formats millions", () => {
    expect(formatCompactPkr(17_200_000)).toBe("PKR 17.2M")
  })

  test("formats thousands", () => {
    expect(formatCompactPkr(12500)).toBe("PKR 13K")
  })

  test("formats small values", () => {
    expect(formatCompactPkr(500)).toBe("PKR 500")
  })

  test("handles nullish", () => {
    expect(formatCompactPkr(null)).toBe("PKR 0")
  })
})

describe("formatCountLabel", () => {
  test("singular and plural", () => {
    expect(formatCountLabel(1, "invoice")).toBe("1 invoice")
    expect(formatCountLabel(42, "invoice")).toBe("42 invoices")
  })

  test("returns null for invalid", () => {
    expect(formatCountLabel(null, "invoice")).toBeNull()
  })
})
