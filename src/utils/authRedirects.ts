import { getRole, getToken } from "./auth.ts"

/** Roles that use the admin / reporting dashboard as their home portal. */
export const ADMIN_PORTAL_ROLES = new Set([
  "super_admin",
  "company_owner",
  "auditor",
  "manager",
])

/** Roles that use the employee self-service portal as their home. */
export const EMPLOYEE_PORTAL_ROLES = new Set(["employee", "technician", "recovery_agent"])

export const ADMIN_HOME_ROUTE = "/reporting/executive"
export const EMPLOYEE_HOME_ROUTE = "/employee-portal"
export const CUSTOMER_HOME_ROUTE = "/customer-portal"
export const LOGIN_ROUTE = "/admin"

export function getHomeRouteForRole(role: string | null | undefined): string | null {
  if (!role) return null
  if (ADMIN_PORTAL_ROLES.has(role)) return ADMIN_HOME_ROUTE
  if (EMPLOYEE_PORTAL_ROLES.has(role)) return EMPLOYEE_HOME_ROUTE
  if (role === "customer") return CUSTOMER_HOME_ROUTE
  return null
}

export function isAdminPortalRole(role: string | null | undefined): boolean {
  return !!role && ADMIN_PORTAL_ROLES.has(role)
}

export function isEmployeePortalRole(role: string | null | undefined): boolean {
  return !!role && EMPLOYEE_PORTAL_ROLES.has(role)
}

/** Returns the post-login destination when a valid session exists, otherwise null. */
export function getAuthenticatedHomeRoute(): string | null {
  if (!getToken()) return null
  return getHomeRouteForRole(getRole())
}

export function isAuthenticatedSession(): boolean {
  return getAuthenticatedHomeRoute() !== null
}
