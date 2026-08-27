import { isAnyPathActive, isPathActive } from "./sidebarNav.ts"

describe("sidebarNav", () => {
  test("isPathActive matches exact and nested paths", () => {
    expect(isPathActive("/customer-management", "/customer-management")).toBe(true)
    expect(isPathActive("/customers/abc", "/customer-management")).toBe(true)
    expect(isPathActive("/customers/abc", "/customers")).toBe(true)
    expect(isPathActive("/reporting/executive", "/reporting/executive")).toBe(true)
    expect(isPathActive("/reporting/executive/x", "/reporting/executive")).toBe(true)
    expect(isPathActive("/payment-management", "/billing-invoices")).toBe(false)
    expect(isPathActive("/employees/1/portal-access", "/employee-management")).toBe(true)
  })

  test("isAnyPathActive", () => {
    expect(isAnyPathActive("/task-management", ["/complaint-management", "/task-management"])).toBe(
      true,
    )
    expect(isAnyPathActive("/x", ["/a", "/b"])).toBe(false)
  })
})
