import useSWR from "swr"
import axiosInstance from "../utils/axiosConfig.ts"

export interface DropdownInvoice {
  id: string
  invoice_number: string
  customer_name: string
  customer_internet_id: string
  total_amount: number
  due_date: string
  status: string
  billing_start_date: string
  billing_end_date: string
}

const fetcher = async (url: string): Promise<DropdownInvoice[]> => {
  const [path, query] = url.split("?")
  const params = new URLSearchParams(query || "")
  const requestParams: Record<string, string | number> = {
    q: params.get("q") || "",
    limit: params.get("limit") || 50,
  }
  const status = params.get("status")
  if (status) requestParams.status = status
  const includeId = params.get("include_id")
  if (includeId) requestParams.include_id = includeId

  const { data } = await axiosInstance.get(path, { params: requestParams })
  return (Array.isArray(data) ? data : []).map((inv: any) => ({
    id: inv.id,
    invoice_number: inv.invoice_number,
    customer_name: inv.customer_name,
    customer_internet_id: inv.customer_internet_id || "N/A",
    total_amount: Number(inv.total_amount || 0),
    due_date: inv.due_date,
    status: inv.status,
    billing_start_date: inv.billing_start_date,
    billing_end_date: inv.billing_end_date,
  }))
}

/**
 * Shared, SWR-cached invoice lookup for select widgets (Add Payment, Recovery
 * Task forms). Reopening the same (or another) form that calls this hook with
 * the same search/status is served from cache instead of refetching every
 * invoice with every line item — the previous per-modal `useEffect` +
 * `/invoices/list` pattern did that on every single modal open.
 *
 * @param statuses Restrict to these statuses server-side (e.g. only invoices
 * payments can be applied to). Pass undefined/[] for no filter (edit mode).
 * @param includeId When editing, pass the linked invoice_id so it's
 * guaranteed to be present even if it falls outside the status filter or
 * the default top-N/search window (e.g. it's already paid).
 */
export function useInvoiceDropdown(
  search: string = "",
  statuses?: string[],
  limit: number = 50,
  includeId?: string
) {
  const statusKey = statuses && statuses.length ? statuses.join(",") : ""
  const key = `/invoices/dropdown?q=${encodeURIComponent(search.trim())}&limit=${limit}&status=${encodeURIComponent(
    statusKey
  )}${includeId ? `&include_id=${encodeURIComponent(includeId)}` : ""}`
  const { data, isLoading, error } = useSWR<DropdownInvoice[]>(key, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
    keepPreviousData: true,
  })

  return {
    invoices: data || [],
    isLoading: isLoading && !data,
    error,
  }
}

export default useInvoiceDropdown
