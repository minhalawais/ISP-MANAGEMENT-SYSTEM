export type PortalModuleName =
  | "dashboard"
  | "tasks"
  | "complaints"
  | "customers"
  | "recoveries"
  | "financial"
  | "inventory"
  | "profile"

export const PORTAL_MODULE_NAMES: PortalModuleName[] = [
  "dashboard",
  "tasks",
  "complaints",
  "customers",
  "recoveries",
  "financial",
  "inventory",
  "profile",
]

export interface PortalModuleConfig {
  enabled: boolean
  assigned_as_technician?: boolean
  assigned_to_me?: boolean
  for_portal_customers?: boolean
  by_areas?: boolean
  by_sub_zones?: boolean
  custom?: Record<string, unknown>
}

export interface EmployeePortalAccess {
  version: number
  area_ids: string[]
  sub_zone_ids: string[]
  modules: Record<PortalModuleName, PortalModuleConfig>
}

export const DEFAULT_PORTAL_ACCESS: EmployeePortalAccess = {
  version: 1,
  area_ids: [],
  sub_zone_ids: [],
  modules: {
    dashboard: { enabled: true },
    customers: {
      enabled: true,
      assigned_as_technician: true,
      by_areas: false,
      by_sub_zones: false,
    },
    recoveries: {
      enabled: true,
      assigned_to_me: true,
      for_portal_customers: true,
      custom: {},
    },
    tasks: {
      enabled: true,
      assigned_to_me: true,
      for_portal_customers: true,
      by_areas: false,
      by_sub_zones: false,
      custom: {},
    },
    complaints: {
      enabled: true,
      assigned_to_me: true,
      for_portal_customers: true,
      by_areas: false,
      by_sub_zones: false,
      custom: {},
    },
    inventory: {
      enabled: true,
      assigned_to_me: true,
      for_portal_customers: true,
    },
    financial: { enabled: true },
    profile: { enabled: true },
  },
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function deepMerge<T extends Record<string, unknown>>(base: T, overlay?: unknown): T {
  const result: Record<string, unknown> = { ...base }
  if (!isPlainObject(overlay)) return result as T
  for (const [key, value] of Object.entries(overlay)) {
    if (isPlainObject(result[key]) && isPlainObject(value)) {
      result[key] = deepMerge(result[key] as Record<string, unknown>, value)
    } else {
      result[key] = value
    }
  }
  return result as T
}

export function mergePortalAccess(raw?: unknown): EmployeePortalAccess {
  const merged = deepMerge(
    DEFAULT_PORTAL_ACCESS as unknown as Record<string, unknown>,
    raw
  ) as unknown as EmployeePortalAccess

  if (!Array.isArray(merged.area_ids)) merged.area_ids = []
  if (!Array.isArray(merged.sub_zone_ids)) merged.sub_zone_ids = []
  if (!merged.modules) merged.modules = { ...DEFAULT_PORTAL_ACCESS.modules }

  for (const name of PORTAL_MODULE_NAMES) {
    merged.modules[name] = {
      ...DEFAULT_PORTAL_ACCESS.modules[name],
      ...(merged.modules[name] || {}),
    }
  }

  return merged
}

export function enabledModules(access: EmployeePortalAccess): PortalModuleName[] {
  return PORTAL_MODULE_NAMES.filter((name) => !!access.modules[name]?.enabled)
}

export function moduleLabel(name: PortalModuleName): string {
  const labels: Record<PortalModuleName, string> = {
    dashboard: "Dashboard",
    tasks: "My Tasks",
    complaints: "Complaints",
    customers: "Customers",
    recoveries: "Recoveries",
    financial: "Financial",
    inventory: "Inventory",
    profile: "My Profile",
  }
  return labels[name]
}

export type FilterOption = { id: string; name: string }

export const TASK_STATUS_OPTIONS: FilterOption[] = [
  { id: "pending", name: "Pending" },
  { id: "in_progress", name: "In Progress" },
  { id: "completed", name: "Completed" },
  { id: "cancelled", name: "Cancelled" },
]

export const TASK_PRIORITY_OPTIONS: FilterOption[] = [
  { id: "low", name: "Low" },
  { id: "medium", name: "Medium" },
  { id: "high", name: "High" },
  { id: "critical", name: "Critical" },
]

export const TASK_TYPE_OPTIONS: FilterOption[] = [
  { id: "installation", name: "Installation" },
  { id: "maintenance", name: "Maintenance" },
  { id: "complaint", name: "Complaint" },
  { id: "recovery", name: "Recovery" },
]

export const RECOVERY_STATUS_OPTIONS: FilterOption[] = [
  { id: "pending", name: "Pending" },
  { id: "in_progress", name: "In Progress" },
  { id: "collected", name: "Collected" },
  { id: "completed", name: "Completed" },
  { id: "cancelled", name: "Cancelled" },
]

export const COMPLAINT_STATUS_OPTIONS: FilterOption[] = [
  { id: "open", name: "Open" },
  { id: "in_progress", name: "In Progress" },
  { id: "resolved", name: "Resolved" },
  { id: "closed", name: "Closed" },
]

export const COMPLAINT_CATEGORY_OPTIONS: FilterOption[] = [
  { id: "no_internet", name: "No Internet / Connectivity" },
  { id: "slow_speed", name: "Slow Speed" },
  { id: "billing", name: "Billing / Invoice" },
  { id: "installation", name: "Installation / Relocation" },
  { id: "hardware", name: "Hardware / Equipment" },
  { id: "other", name: "Other" },
]

export function toggleFilterValue(selected: string[] | undefined, value: string): string[] {
  const current = selected || []
  return current.includes(value)
    ? current.filter((v) => v !== value)
    : [...current, value]
}
