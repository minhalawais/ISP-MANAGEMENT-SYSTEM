export type CustomerPackageRow = {
  key: string
  id?: string
  service_plan_id: string
  discount_amount: number
}

export type CustomerTechnicianRow = {
  technician_id: string
  commission_amount: number
}

export const createPackageRow = (
  servicePlanId: string,
  discountAmount = 0,
  id?: string,
): CustomerPackageRow => ({
  key: id || `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  id,
  service_plan_id: servicePlanId,
  discount_amount: Number(discountAmount) || 0,
})

export const addPackageRow = (
  rows: CustomerPackageRow[],
  servicePlanId: string,
): CustomerPackageRow[] => [...rows, createPackageRow(servicePlanId)]

export const removePackageRow = (rows: CustomerPackageRow[], key: string): CustomerPackageRow[] =>
  rows.filter((row) => row.key !== key)

export const updatePackageDiscount = (
  rows: CustomerPackageRow[],
  key: string,
  discountAmount: number,
): CustomerPackageRow[] =>
  rows.map((row) => (row.key === key ? { ...row, discount_amount: Number(discountAmount) || 0 } : row))

export const sumPackageDiscounts = (rows: CustomerPackageRow[]): number =>
  rows.reduce((total, row) => total + (Number(row.discount_amount) || 0), 0)

export const packagesFromApi = (packages: any[]): CustomerPackageRow[] => {
  if (!Array.isArray(packages)) return []
  return packages
    .filter((pkg) => pkg && pkg.service_plan_id)
    .map((pkg) => createPackageRow(String(pkg.service_plan_id), Number(pkg.discount_amount) || 0, pkg.id ? String(pkg.id) : undefined))
}

export const packagesToPayload = (rows: CustomerPackageRow[]) =>
  rows.map((row) => ({
    id: row.id || undefined,
    service_plan_id: row.service_plan_id,
    discount_amount: Number(row.discount_amount) || 0,
  }))

export const addTechnicianRow = (
  rows: CustomerTechnicianRow[],
  technicianId: string,
  commissionAmount = 0,
): CustomerTechnicianRow[] => {
  if (!technicianId || rows.some((row) => row.technician_id === technicianId)) {
    return rows
  }
  return [...rows, { technician_id: technicianId, commission_amount: Number(commissionAmount) || 0 }]
}

export const removeTechnicianRow = (rows: CustomerTechnicianRow[], technicianId: string): CustomerTechnicianRow[] =>
  rows.filter((row) => row.technician_id !== technicianId)

export const updateTechnicianCommission = (
  rows: CustomerTechnicianRow[],
  technicianId: string,
  commissionAmount: number,
): CustomerTechnicianRow[] =>
  rows.map((row) =>
    row.technician_id === technicianId
      ? { ...row, commission_amount: Number(commissionAmount) || 0 }
      : row,
  )

export const techniciansFromApi = (technicians: any[], fallbackTechnicianId?: string, fallbackCommission?: number): CustomerTechnicianRow[] => {
  if (Array.isArray(technicians) && technicians.length > 0) {
    const seen = new Set<string>()
    return technicians
      .map((tech) => ({
        technician_id: String(tech.technician_id || tech.id || ""),
        commission_amount: Number(tech.commission_amount) || 0,
      }))
      .filter((tech) => {
        if (!tech.technician_id || seen.has(tech.technician_id)) return false
        seen.add(tech.technician_id)
        return true
      })
  }
  if (fallbackTechnicianId) {
    return [{ technician_id: fallbackTechnicianId, commission_amount: Number(fallbackCommission) || 0 }]
  }
  return []
}
