import { Link } from "react-router-dom"
import { ExternalLink, Phone } from "lucide-react"

export interface RecoveryDueInvoice {
  id: string
  invoice_number: string | null
  invoice_status: string
  invoice_type?: string | null
  charge_types?: string[] | null
  charge_summary?: string | null
  due_date: string | null
  billing_start_date?: string | null
  billing_end_date?: string | null
  total_amount: number
  paid_amount: number
  remaining_amount: number
  customer_id?: string | null
  customer_name: string | null
  customer_internet_id: string | null
  customer_phone: string | null
  customer_area: string | null
  customer_sub_zone?: string | null
}

/**
 * Explicit CSS grid — never use bare <table> here.
 * Global table.css forces first/last columns to checkbox/action widths and causes overlap.
 */
export const RECOVERY_INVOICE_GRID_CLASS =
  "grid gap-x-4 gap-y-1 items-start px-3 py-3 min-w-[1100px] " +
  "grid-cols-[minmax(170px,1.2fr)_minmax(200px,1.4fr)_minmax(120px,0.9fr)_minmax(100px,0.7fr)_minmax(90px,0.6fr)_minmax(100px,0.8fr)_minmax(90px,0.7fr)_minmax(110px,0.9fr)_minmax(100px,0.7fr)_minmax(96px,0.6fr)]"

interface Props {
  invoices: RecoveryDueInvoice[]
  onCollect: (invoice: RecoveryDueInvoice) => void
}

function formatMoney(n: number) {
  return `PKR ${n.toLocaleString()}`
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—"
  return new Date(value).toLocaleDateString()
}

function formatInvoiceType(inv: RecoveryDueInvoice) {
  if (inv.charge_summary) return inv.charge_summary
  if (inv.invoice_type === "mixed" && inv.charge_types?.length) {
    return inv.charge_types.join(" + ").replace(/_/g, " ")
  }
  return (inv.invoice_type || "—").replace(/_/g, " ")
}

export function RecoveryInvoiceTable({ invoices, onCollect }: Props) {
  return (
    <div
      className="bg-white border border-slate-200 rounded-lg overflow-hidden"
      data-testid="recovery-invoice-table"
    >
      <div className="overflow-x-auto">
        <div
          className={`${RECOVERY_INVOICE_GRID_CLASS} bg-slate-50 border-b border-slate-100 text-[11px] font-medium uppercase tracking-wide text-slate-500`}
          role="row"
        >
          <div>Invoice</div>
          <div>Customer</div>
          <div>Area</div>
          <div>Type</div>
          <div>Status</div>
          <div className="text-right">Total</div>
          <div className="text-right">Paid</div>
          <div className="text-right">Remaining</div>
          <div>Due</div>
          <div />
        </div>

        <ul className="divide-y divide-slate-100">
          {invoices.map((inv) => {
            const overdue = Boolean(inv.due_date && new Date(inv.due_date) < new Date())
            const areaLabel = [inv.customer_area, inv.customer_sub_zone]
              .filter(Boolean)
              .filter((v, i, arr) => arr.indexOf(v) === i)
              .join(" · ")

            return (
              <li key={inv.id}>
                <div className={`${RECOVERY_INVOICE_GRID_CLASS} text-sm`} role="row">
                  <div className="min-w-0">
                    <Link
                      to={`/invoices/${inv.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-electric-blue hover:text-btn-hover"
                      title={inv.invoice_number || ""}
                    >
                      <span className="font-mono text-sm truncate max-w-[150px]">
                        {inv.invoice_number || "—"}
                      </span>
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </Link>
                    {(inv.billing_start_date || inv.billing_end_date) && (
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {formatDate(inv.billing_start_date)} – {formatDate(inv.billing_end_date)}
                      </p>
                    )}
                  </div>

                  <div className="min-w-0">
                    {inv.customer_id ? (
                      <>
                        <Link
                          to={`/employee-portal/customers/${inv.customer_id}`}
                          className="block font-medium text-slate-800 hover:text-electric-blue truncate"
                          title={inv.customer_name || ""}
                        >
                          {inv.customer_name || "—"}
                        </Link>
                        {inv.customer_internet_id && (
                          <Link
                            to={`/employee-portal/customers/${inv.customer_id}`}
                            className="block text-xs text-electric-blue hover:text-btn-hover truncate"
                          >
                            {inv.customer_internet_id}
                          </Link>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="font-medium text-slate-800 truncate" title={inv.customer_name || ""}>
                          {inv.customer_name || "—"}
                        </div>
                        <div className="text-xs text-slate-500 truncate">{inv.customer_internet_id}</div>
                      </>
                    )}
                    {inv.customer_phone && (
                      <a
                        href={`tel:${inv.customer_phone}`}
                        className="text-xs text-portal-primary inline-flex items-center gap-1 mt-0.5"
                      >
                        <Phone className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{inv.customer_phone}</span>
                      </a>
                    )}
                  </div>

                  <div className="min-w-0 text-xs text-slate-600">
                    <div className="truncate" title={areaLabel || undefined}>
                      {areaLabel || "—"}
                    </div>
                  </div>

                  <div className="text-xs capitalize text-slate-600 truncate" title={formatInvoiceType(inv)}>
                    {formatInvoiceType(inv)}
                  </div>

                  <div>
                    <span className="inline-block px-1.5 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 capitalize">
                      {(inv.invoice_status || "").replace(/_/g, " ")}
                    </span>
                  </div>

                  <div className="text-right whitespace-nowrap tabular-nums">
                    {formatMoney(inv.total_amount)}
                  </div>
                  <div className="text-right whitespace-nowrap tabular-nums text-green-700">
                    {formatMoney(inv.paid_amount)}
                  </div>
                  <div className="text-right whitespace-nowrap tabular-nums font-semibold text-red-700">
                    {formatMoney(inv.remaining_amount)}
                  </div>
                  <div
                    className={`whitespace-nowrap ${
                      overdue ? "text-red-600 font-medium" : "text-slate-600"
                    }`}
                  >
                    {formatDate(inv.due_date)}
                  </div>
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => onCollect(inv)}
                      className="h-9 px-3 text-sm bg-portal-primary text-white rounded-md hover:bg-portal-primary-dark"
                    >
                      Collect
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

/** @deprecated kept for test import compatibility */
export const RECOVERY_INVOICE_TABLE_CLASS = RECOVERY_INVOICE_GRID_CLASS
