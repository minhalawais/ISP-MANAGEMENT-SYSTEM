export type DropdownCustomerPackage = {
  id: string
  servicePlanId: string
  servicePlanName: string
  speedMbps?: number | null
  price: number
  discountAmount: number
}

export type SubscriptionLineSeed = {
  charge_type: "subscription"
  description: string
  quantity: number
  unit_price: number
  discount_amount: number
  billing_start_date: string
  billing_end_date: string
  customer_package_id: string
}

export type BillingPeriod = {
  billing_start_date: string
  billing_end_date: string
  due_date: string
}

function pad2(n: number) {
  return String(n).padStart(2, "0")
}

export function formatDateLocal(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

/**
 * Same rule as api/app/services/invoice_due_date.py
 * (auto batch, bulk monthly, and manual create all use that module).
 * due = customer's configured due day within the billing month; else the 5th.
 */
export function calculateInvoiceDueDate(
  billingStartIso: string,
  customerDueDateIso?: string | null,
): string {
  const [y, m] = billingStartIso.split("-").map((p) => Number(p))
  if (!y || !m) return billingStartIso

  const lastDay = new Date(y, m, 0).getDate()
  if (!customerDueDateIso) return formatDateLocal(new Date(y, m - 1, 5))

  const dayPart = String(customerDueDateIso).slice(0, 10).split("-")[2]
  const dueDay = Number(dayPart)
  if (!Number.isFinite(dueDay) || dueDay < 1) return formatDateLocal(new Date(y, m - 1, 5))
  return formatDateLocal(new Date(y, m - 1, Math.min(dueDay, lastDay)))
}

/** Calendar year for a selected month number (1–12). Dec → Jan rolls to next year. */
export function yearForBillingMonth(month: number, reference: Date = new Date()): number {
  const curMonth = reference.getMonth() + 1
  const curYear = reference.getFullYear()
  if (month === 1 && curMonth === 12) return curYear + 1
  return curYear
}

/** Next calendar month (auto-invoice bills ahead). */
export function nextBillingMonth(reference: Date = new Date()): { month: number; year: number } {
  const d = new Date(reference.getFullYear(), reference.getMonth() + 1, 1)
  return { month: d.getMonth() + 1, year: d.getFullYear() }
}

export function billingPeriodForMonth(
  month: number,
  year: number,
  customerDueDateIso?: string | null,
): BillingPeriod {
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0)
  const billing_start_date = formatDateLocal(start)
  return {
    billing_start_date,
    billing_end_date: formatDateLocal(end),
    due_date: calculateInvoiceDueDate(billing_start_date, customerDueDateIso),
  }
}

/** Match auto/bulk invoice description: plan name, optionally with speed. */
export function packageLineDescription(pkg: {
  servicePlanName?: string | null
  speedMbps?: number | null
}): string {
  const name = (pkg.servicePlanName || "").trim() || "Subscription"
  if (pkg.speedMbps != null && Number(pkg.speedMbps) > 0) {
    return `${name} - ${pkg.speedMbps}Mbps`
  }
  return name
}

export function buildSubscriptionLinesFromPackages(
  packages: DropdownCustomerPackage[],
  period: BillingPeriod,
): SubscriptionLineSeed[] {
  return packages.map((pkg) => ({
    charge_type: "subscription" as const,
    description: packageLineDescription(pkg),
    quantity: 1,
    unit_price: Number(pkg.price) || 0,
    discount_amount: Number(pkg.discountAmount) || 0,
    billing_start_date: period.billing_start_date,
    billing_end_date: period.billing_end_date,
    customer_package_id: pkg.id,
  }))
}
