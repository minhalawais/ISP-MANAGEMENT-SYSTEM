import {
  DEFAULT_PORTAL_ACCESS,
  enabledModules,
  mergePortalAccess,
  moduleLabel,
  toggleFilterValue,
} from "./employeePortalAccess.ts"

describe("employeePortalAccess", () => {
  it("merges empty config to assignment-only defaults", () => {
    const access = mergePortalAccess({})
    expect(access.modules.customers.assigned_as_technician).toBe(true)
    expect(access.modules.customers.by_areas).toBe(false)
    expect(access.modules.recoveries.assigned_to_me).toBe(true)
    expect(access.modules.recoveries.for_portal_customers).toBe(true)
    expect(enabledModules(access)).toEqual(
      expect.arrayContaining(["dashboard", "customers", "recoveries", "profile"])
    )
  })

  it("deep-merges module overlays", () => {
    const access = mergePortalAccess({
      area_ids: ["area-1"],
      modules: {
        customers: {
          assigned_as_technician: false,
          by_areas: true,
        },
        recoveries: {
          for_portal_customers: true,
          custom: { overdue_only: true },
        },
      },
    })
    expect(access.area_ids).toEqual(["area-1"])
    expect(access.modules.customers.assigned_as_technician).toBe(false)
    expect(access.modules.customers.by_areas).toBe(true)
    expect(access.modules.customers.enabled).toBe(true)
    expect(access.modules.recoveries.assigned_to_me).toBe(true)
    expect(access.modules.recoveries.for_portal_customers).toBe(true)
    expect((access.modules.recoveries.custom as any).overdue_only).toBe(true)
  })

  it("omits disabled modules from enabledModules", () => {
    const access = mergePortalAccess({
      modules: {
        customers: { enabled: false },
        financial: { enabled: false },
      },
    })
    const enabled = enabledModules(access)
    expect(enabled).not.toContain("customers")
    expect(enabled).not.toContain("financial")
    expect(enabled).toContain("dashboard")
  })

  it("keeps default module map keys", () => {
    expect(Object.keys(DEFAULT_PORTAL_ACCESS.modules).sort()).toEqual(
      [
        "complaints",
        "customers",
        "dashboard",
        "financial",
        "inventory",
        "profile",
        "recoveries",
        "tasks",
      ].sort()
    )
    expect(moduleLabel("recoveries")).toBe("Recoveries")
  })

  it("toggles multi-select filter values", () => {
    expect(toggleFilterValue(undefined, "pending")).toEqual(["pending"])
    expect(toggleFilterValue(["pending"], "in_progress")).toEqual(["pending", "in_progress"])
    expect(toggleFilterValue(["pending", "in_progress"], "pending")).toEqual(["in_progress"])
  })
})
