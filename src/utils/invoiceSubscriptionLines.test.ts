import {
  buildSubscriptionLinesFromPackages,
  packageLineDescription,
  calculateInvoiceDueDate,
  billingPeriodForMonth,
  nextBillingMonth,
} from "./invoiceSubscriptionLines.ts"

describe("invoiceSubscriptionLines", () => {
  test("packageLineDescription includes plan name and optional speed", () => {
    expect(packageLineDescription({ servicePlanName: "Fiber 50" })).toBe("Fiber 50")
    expect(packageLineDescription({ servicePlanName: "Fiber 50", speedMbps: 50 })).toBe(
      "Fiber 50 - 50Mbps",
    )
    expect(packageLineDescription({ servicePlanName: "", speedMbps: null })).toBe("Subscription")
  })

  test("calculateInvoiceDueDate uses customer due day in billing month", () => {
    expect(calculateInvoiceDueDate("2026-10-01", "2024-03-05")).toBe("2026-10-05")
    expect(calculateInvoiceDueDate("2026-09-01", "2024-03-05")).toBe("2026-09-05")
    // Clamp to month length (Feb)
    expect(calculateInvoiceDueDate("2026-02-01", "2024-01-31")).toBe("2026-02-28")
  })

  test("calculateInvoiceDueDate falls back to the fifth", () => {
    expect(calculateInvoiceDueDate("2026-10-01", null)).toBe("2026-10-05")
    expect(calculateInvoiceDueDate("2026-10-01", undefined)).toBe("2026-10-05")
  })

  test("billingPeriodForMonth uses customer due day in October", () => {
    const period = billingPeriodForMonth(10, 2026, "2023-07-05")
    expect(period).toEqual({
      billing_start_date: "2026-10-01",
      billing_end_date: "2026-10-31",
      due_date: "2026-10-05",
    })
  })

  test("nextBillingMonth matches auto-invoice ahead billing", () => {
    expect(nextBillingMonth(new Date(2026, 7, 29))).toEqual({ month: 9, year: 2026 }) // Aug → Sep
    expect(nextBillingMonth(new Date(2026, 8, 29))).toEqual({ month: 10, year: 2026 }) // Sep → Oct
    expect(nextBillingMonth(new Date(2026, 11, 15))).toEqual({ month: 1, year: 2027 }) // Dec → Jan
  })

  test("buildSubscriptionLinesFromPackages creates one line per package", () => {
    const period = {
      billing_start_date: "2026-10-01",
      billing_end_date: "2026-10-31",
      due_date: "2026-10-05",
    }
    const lines = buildSubscriptionLinesFromPackages(
      [
        {
          id: "p1",
          servicePlanId: "sp1",
          servicePlanName: "Fiber 20",
          speedMbps: 20,
          price: 2000,
          discountAmount: 100,
        },
        {
          id: "p2",
          servicePlanId: "sp2",
          servicePlanName: "IPTV",
          speedMbps: null,
          price: 500,
          discountAmount: 0,
        },
      ],
      period,
    )

    expect(lines).toHaveLength(2)
    expect(lines[0]).toMatchObject({
      charge_type: "subscription",
      description: "Fiber 20 - 20Mbps",
      unit_price: 2000,
      discount_amount: 100,
      customer_package_id: "p1",
      billing_start_date: "2026-10-01",
      billing_end_date: "2026-10-31",
    })
    expect(lines[1]).toMatchObject({
      description: "IPTV",
      unit_price: 500,
      customer_package_id: "p2",
    })
  })
})
