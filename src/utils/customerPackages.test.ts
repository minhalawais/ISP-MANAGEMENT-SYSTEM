import {
  addPackageRow,
  removePackageRow,
  updatePackageDiscount,
  sumPackageDiscounts,
  addTechnicianRow,
  removeTechnicianRow,
  packagesFromApi,
} from "./customerPackages.ts"

describe("customer package helpers", () => {
  it("allows the same service plan more than once", () => {
    const planId = "plan-1"
    const rows = addPackageRow(addPackageRow([], planId), planId)
    expect(rows).toHaveLength(2)
    expect(rows[0].service_plan_id).toBe(planId)
    expect(rows[1].service_plan_id).toBe(planId)
    expect(rows[0].key).not.toBe(rows[1].key)
  })

  it("removes only the selected package instance", () => {
    const rows = addPackageRow(addPackageRow([], "plan-1"), "plan-1")
    const remaining = removePackageRow(rows, rows[0].key)
    expect(remaining).toHaveLength(1)
    expect(remaining[0].key).toBe(rows[1].key)
  })

  it("sums per-package discounts for the legacy customer total", () => {
    const withFirst = updatePackageDiscount(addPackageRow([], "plan-1"), "unused", 0)
    const rows = [
      { key: "a", service_plan_id: "p1", discount_amount: 100 },
      { key: "b", service_plan_id: "p1", discount_amount: 50 },
    ]
    expect(sumPackageDiscounts(rows)).toBe(150)
    expect(withFirst).toHaveLength(1)
  })

  it("maps API packages including duplicate plans and discounts", () => {
    const rows = packagesFromApi([
      { id: "pkg-1", service_plan_id: "plan-1", discount_amount: 200 },
      { id: "pkg-2", service_plan_id: "plan-1", discount_amount: 75 },
    ])
    expect(rows).toHaveLength(2)
    expect(sumPackageDiscounts(rows)).toBe(275)
  })
})

describe("customer technician helpers", () => {
  it("does not add the same technician twice", () => {
    const once = addTechnicianRow([], "tech-1", 100)
    const twice = addTechnicianRow(once, "tech-1", 50)
    expect(twice).toHaveLength(1)
    expect(twice[0].commission_amount).toBe(100)
  })

  it("removes a technician assignment", () => {
    const rows = addTechnicianRow(addTechnicianRow([], "tech-1", 10), "tech-2", 20)
    expect(removeTechnicianRow(rows, "tech-1")).toEqual([{ technician_id: "tech-2", commission_amount: 20 }])
  })
})
