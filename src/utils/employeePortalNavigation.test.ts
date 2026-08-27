import {
  isPortalSection,
  portalHomePath,
  sectionFromSearch,
  storePortalSection,
  readStoredPortalSection,
  EMPLOYEE_PORTAL_SECTION_STORAGE_KEY,
} from "./employeePortalNavigation.ts"

describe("employeePortalNavigation", () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it("parses a valid section from the query string", () => {
    expect(sectionFromSearch("?section=complaints")).toBe("complaints")
    expect(sectionFromSearch("section=tasks")).toBe("tasks")
    expect(sectionFromSearch("?section=not-a-module")).toBeNull()
    expect(isPortalSection("recoveries")).toBe(true)
  })

  it("builds a portal path from the last stored section", () => {
    expect(portalHomePath()).toBe("/employee-portal")
    storePortalSection("complaints")
    expect(readStoredPortalSection()).toBe("complaints")
    expect(portalHomePath()).toBe("/employee-portal?section=complaints")
    expect(portalHomePath("dashboard")).toBe("/employee-portal")
    expect(sessionStorage.getItem(EMPLOYEE_PORTAL_SECTION_STORAGE_KEY)).toBe("complaints")
  })
})
