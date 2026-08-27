import type { CrudPeriodConfig } from "../types/crudFilters.ts"

const CURRENT_MONTH_FINANCIAL: Pick<CrudPeriodConfig, "defaultPeriod" | "fetchMode"> = {
  defaultPeriod: "current_month",
  fetchMode: "client",
}

const ALL_TIME_MASTER: Pick<CrudPeriodConfig, "defaultPeriod" | "fetchMode"> = {
  defaultPeriod: "all",
  fetchMode: "client",
}

export const CRUD_PERIOD_CONFIGS: Record<string, CrudPeriodConfig> = {
  invoice: {
    moduleKey: "invoice",
    dateField: "billing_start_date",
    defaultPeriod: "current_month",
    fetchMode: "server",
  },
  payment: {
    moduleKey: "payment",
    dateField: "payment_date",
    defaultPeriod: "current_month",
    fetchMode: "server",
  },
  expense: { moduleKey: "expense", dateField: "expense_date", ...CURRENT_MONTH_FINANCIAL },
  "extra-income": { moduleKey: "extra-income", dateField: "income_date", ...CURRENT_MONTH_FINANCIAL },
  "isp-payment": { moduleKey: "isp-payment", dateField: "payment_date", ...CURRENT_MONTH_FINANCIAL },
  customer: { moduleKey: "customer", dateField: "installation_date", ...ALL_TIME_MASTER },
  complaint: { moduleKey: "complaint", dateField: "created_at", ...ALL_TIME_MASTER },
  logs: { moduleKey: "logs", dateField: "created_at", defaultPeriod: "all", fetchMode: "server" },
  task: { moduleKey: "task", dateField: "created_at", ...ALL_TIME_MASTER },
  "recovery-task": { moduleKey: "recovery-task", dateField: "created_at", ...ALL_TIME_MASTER },
  message: { moduleKey: "message", dateField: "created_at", ...ALL_TIME_MASTER },
  employee: { moduleKey: "employee", dateField: "joining_date", ...ALL_TIME_MASTER },
  vendor: { moduleKey: "vendor", dateField: "created_at", ...ALL_TIME_MASTER },
  supplier: { moduleKey: "supplier", dateField: "created_at", ...ALL_TIME_MASTER },
  isp: { moduleKey: "isp", dateField: "created_at", ...ALL_TIME_MASTER },
  "area-zone": { moduleKey: "area-zone", dateField: "created_at", ...ALL_TIME_MASTER },
  "sub-zone": { moduleKey: "sub-zone", dateField: "created_at", ...ALL_TIME_MASTER },
  "service-plan": { moduleKey: "service-plan", dateField: "created_at", ...ALL_TIME_MASTER },
  "bank-account": { moduleKey: "bank-account", dateField: "created_at", ...ALL_TIME_MASTER },
  inventory: { moduleKey: "inventory", dateField: "created_at", ...ALL_TIME_MASTER },
}

export function getCrudPeriodConfig(moduleKey: string): CrudPeriodConfig {
  return (
    CRUD_PERIOD_CONFIGS[moduleKey] ?? {
      moduleKey,
      dateField: "created_at",
      defaultPeriod: "all",
      fetchMode: "client",
    }
  )
}
