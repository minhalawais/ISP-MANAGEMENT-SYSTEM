import { PORTAL_MODULE_NAMES, type PortalModuleName } from "./employeePortalAccess.ts"

export const EMPLOYEE_PORTAL_PATH = "/employee-portal"
export const EMPLOYEE_PORTAL_SECTION_STORAGE_KEY = "employee-portal-section"

export function isPortalSection(value: string | null | undefined): value is PortalModuleName {
  return !!value && (PORTAL_MODULE_NAMES as readonly string[]).includes(value)
}

export function readStoredPortalSection(): PortalModuleName | null {
  try {
    const value = sessionStorage.getItem(EMPLOYEE_PORTAL_SECTION_STORAGE_KEY)
    return isPortalSection(value) ? value : null
  } catch {
    return null
  }
}

export function storePortalSection(section: PortalModuleName) {
  try {
    sessionStorage.setItem(EMPLOYEE_PORTAL_SECTION_STORAGE_KEY, section)
  } catch {
    // Ignore private-mode / unavailable storage.
  }
}

export function sectionFromSearch(search: string): PortalModuleName | null {
  const query = search.startsWith("?") ? search.slice(1) : search
  const value = new URLSearchParams(query).get("section")
  return isPortalSection(value) ? value : null
}

export function portalHomePath(section?: PortalModuleName | null) {
  const resolved = section ?? readStoredPortalSection()
  if (!resolved || resolved === "dashboard") return EMPLOYEE_PORTAL_PATH
  return `${EMPLOYEE_PORTAL_PATH}?section=${resolved}`
}
