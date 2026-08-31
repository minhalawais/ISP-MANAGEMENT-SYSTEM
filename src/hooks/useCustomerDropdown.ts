import useSWR from "swr"
import axiosInstance from "../utils/axiosConfig.ts"
import type { DropdownCustomerPackage } from "../utils/invoiceSubscriptionLines.ts"

export interface DropdownCustomer {
  id: string
  name: string
  internetId: string
  servicePlanPrice: number
  discountAmount: number
  /** YYYY-MM-DD; its day is reused as the recurring invoice due day. */
  dueDate: string | null
  packages: DropdownCustomerPackage[]
}

function mapPackages(raw: any[] | undefined): DropdownCustomerPackage[] {
  if (!Array.isArray(raw)) return []
  return raw.map((p) => ({
    id: String(p.id),
    servicePlanId: String(p.service_plan_id ?? p.servicePlanId ?? ""),
    servicePlanName: String(p.service_plan_name ?? p.servicePlanName ?? ""),
    speedMbps: p.speed_mbps ?? p.speedMbps ?? null,
    price: Number(p.price ?? 0),
    discountAmount: Number(p.discount_amount ?? p.discountAmount ?? 0),
  }))
}

const fetcher = async (url: string): Promise<DropdownCustomer[]> => {
  const [path, query] = url.split("?")
  const params = new URLSearchParams(query || "")
  const requestParams: Record<string, string | number> = {
    q: params.get("q") || "",
    limit: params.get("limit") || 50,
  }
  const includeId = params.get("include_id")
  if (includeId) requestParams.include_id = includeId

  const { data } = await axiosInstance.get(path, { params: requestParams })
  return (Array.isArray(data) ? data : []).map((c: any) => ({
    id: c.id,
    name: c.name || `${c.first_name || ""} ${c.last_name || ""}`.trim(),
    internetId: c.internet_id,
    servicePlanPrice: Number(c.service_plan_price ?? c.servicePlanPrice ?? 0),
    discountAmount: Number(c.discount_amount ?? c.discountAmount ?? 0),
    dueDate: c.due_date
      ? String(c.due_date).slice(0, 10)
      : c.dueDate
        ? String(c.dueDate).slice(0, 10)
        : null,
    packages: mapPackages(c.packages),
  }))
}

/**
 * Shared, SWR-cached customer lookup for select/autocomplete widgets.
 * Because the SWR cache lives outside any single modal, reopening the same
 * (or another) form that calls this hook with the same search term is
 * served from cache instead of refetching the whole customer list — the
 * previous per-modal `useEffect` + `/customers/list` pattern refetched every
 * customer, with every field, on every single modal open.
 *
 * @param includeId When editing an existing record, pass its customer_id so
 * the selected customer is guaranteed to be present even if it falls outside
 * the default top-N/search window.
 */
export function useCustomerDropdown(search: string = "", limit: number = 50, includeId?: string) {
  const key = `/customers/dropdown?q=${encodeURIComponent(search.trim())}&limit=${limit}${
    includeId ? `&include_id=${encodeURIComponent(includeId)}` : ""
  }`
  const { data, isLoading, error } = useSWR<DropdownCustomer[]>(key, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
    keepPreviousData: true,
  })

  return {
    customers: data || [],
    isLoading: isLoading && !data,
    error,
  }
}

export default useCustomerDropdown
