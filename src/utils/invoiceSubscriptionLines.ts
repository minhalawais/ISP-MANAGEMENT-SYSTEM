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
