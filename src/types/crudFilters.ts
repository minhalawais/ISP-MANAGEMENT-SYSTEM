import type { LucideIcon } from "lucide-react"

export type FilterValue = string | boolean | null

export type CrudFilterState = Record<string, FilterValue>

export type QuickFilterOption = { value: string; label: string }

export type QuickFilterDef =
  | {
      id: string
      label: string
      type: "select"
      field: string
      options: QuickFilterOption[]
      placeholder?: string
    }
  | {
      id: string
      label: string
      type: "text"
      field: string
      placeholder?: string
    }

export type StatCardTone = "neutral" | "success" | "danger" | "warning" | "info"

export type StatCardDef = {
  id: string
  label: string
  value: number | string
  tone: StatCardTone
  icon: LucideIcon
  filter?: { field: string; value: FilterValue }
  clearFields?: string[]
  clickable?: boolean
}

export type CrudFilterConfig = {
  moduleKey: string
  statCards: Omit<StatCardDef, "value">[]
  quickFilters: QuickFilterDef[]
  statFilterGroupField?: string
}

export type CrudFilterMode = "client" | "server" | "invoice"

export type CrudPeriodDefault = "all" | "current_month"
export type CrudPeriodFetchMode = "client" | "server"

export type CrudPeriod = { year: number; month: number } | null

export type CrudPeriodConfig = {
  moduleKey: string
  dateField: string
  defaultPeriod: CrudPeriodDefault
  fetchMode: CrudPeriodFetchMode
}
