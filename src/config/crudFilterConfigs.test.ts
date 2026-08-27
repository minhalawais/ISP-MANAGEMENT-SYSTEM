import { CRUD_FILTER_CONFIGS, getCrudFilterConfig } from "./crudFilterConfigs.ts"

const MODULE_KEYS = [
  "customer",
  "invoice",
  "payment",
  "complaint",
  "logs",
  "employee",
  "service-plan",
  "inventory",
  "supplier",
  "area-zone",
  "recovery-task",
  "task",
  "message",
  "isp-payment",
  "expense",
  "extra-income",
  "bank-account",
  "vendor",
  "isp",
  "sub-zone",
]

describe("crudFilterConfigs", () => {
  test.each(MODULE_KEYS)("module %s has stat cards and quick filters", (key) => {
    const config = CRUD_FILTER_CONFIGS[key]
    expect(config.statCards.length).toBeGreaterThanOrEqual(1)
    expect(config.quickFilters.length).toBeGreaterThanOrEqual(2)
    expect(config.quickFilters.length).toBeLessThanOrEqual(4)
  })

  test("quick filter fields are unique per module", () => {
    MODULE_KEYS.forEach((key) => {
      const fields = CRUD_FILTER_CONFIGS[key].quickFilters.map((f) => f.field)
      expect(new Set(fields).size).toBe(fields.length)
    })
  })

  test("getCrudFilterConfig falls back for unknown module", () => {
    const config = getCrudFilterConfig("unknown-module")
    expect(config.moduleKey).toBe("unknown-module")
    expect(config.statCards.length).toBeGreaterThan(0)
  })

  test("invoice type filter uses subscription not monthly, and includes mixed/installation", () => {
    const typeFilter = CRUD_FILTER_CONFIGS.invoice.quickFilters.find((f) => f.field === "invoice_type")
    expect(typeFilter).toBeTruthy()
    const values = (typeFilter?.options || []).map((o) => o.value)
    expect(values).toContain("subscription")
    expect(values).not.toContain("monthly")
    expect(values).toContain("mixed")
    expect(values).toContain("installation")
  })
})
