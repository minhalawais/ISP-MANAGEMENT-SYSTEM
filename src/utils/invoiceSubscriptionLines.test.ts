import {
  buildSubscriptionLinesFromPackages,
  packageLineDescription,
} from "./invoiceSubscriptionLines.ts"

describe("invoiceSubscriptionLines", () => {
  test("packageLineDescription includes plan name and optional speed", () => {
    expect(packageLineDescription({ servicePlanName: "Fiber 50" })).toBe("Fiber 50")
    expect(packageLineDescription({ servicePlanName: "Fiber 50", speedMbps: 50 })).toBe(
      "Fiber 50 - 50Mbps",
    )
    expect(packageLineDescription({ servicePlanName: "", speedMbps: null })).toBe("Subscription")
  })

  test("buildSubscriptionLinesFromPackages creates one line per package", () => {
    const period = {
      billing_start_date: "2026-09-01",
      billing_end_date: "2026-09-30",
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
      billing_start_date: "2026-09-01",
      billing_end_date: "2026-09-30",
    })
    expect(lines[1]).toMatchObject({
      description: "IPTV",
      unit_price: 500,
      customer_package_id: "p2",
    })
  })
})
