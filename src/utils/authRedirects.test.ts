import {
  ADMIN_PORTAL_ROLES,
  EMPLOYEE_PORTAL_ROLES,
  getHomeRouteForRole,
  isAdminPortalRole,
  isEmployeePortalRole,
} from "./authRedirects.ts"

describe("authRedirects role portals", () => {
  it("maps company_owner to admin home", () => {
    expect(getHomeRouteForRole("company_owner")).toBe("/reporting/executive")
    expect(isAdminPortalRole("company_owner")).toBe(true)
    expect(isEmployeePortalRole("company_owner")).toBe(false)
  })

  it("maps employee roles to employee portal", () => {
    expect(getHomeRouteForRole("employee")).toBe("/employee-portal")
    expect(isEmployeePortalRole("employee")).toBe(true)
    expect(isAdminPortalRole("employee")).toBe(false)
  })

  it("keeps role sets disjoint", () => {
    for (const role of EMPLOYEE_PORTAL_ROLES) {
      expect(ADMIN_PORTAL_ROLES.has(role)).toBe(false)
    }
  })
})
