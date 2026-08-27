"use client"

import type { ReactNode } from "react"
import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { toast } from "../utils/notify.ts";
import {
  ArrowLeft,
  AlertCircle,
  AlertTriangle,
  Box,
  ClipboardList,
  Clock,
  DollarSign,
  LogOut,
  MapPin,
  Package,
  Phone,
  Router,
  TrendingUp,
  User,
  Users,
  Wifi,
} from "lucide-react"
import { getToken, removeToken } from "../utils/auth.ts"
import axiosInstance from "../utils/axiosConfig.ts"
import { LOGIN_ROUTE } from "../utils/authRedirects.ts"
import { portalHomePath } from "../utils/employeePortalNavigation.ts"
import { PortalStatStrip, type PortalStatItem } from "../components/employee-portal/shared/PortalStatStrip.tsx"
import { PortalStatusPill } from "../components/employee-portal/shared/PortalStatusPill.tsx"

interface CustomerDetail {
  id: string
  internet_id: string
  first_name: string
  last_name: string
  email: string | null
  phone_1: string | null
  phone_2: string | null
  installation_address: string | null
  area: string | null
  sub_zone: string | null
  isp_name: string | null
  connection_type: string | null
  internet_connection_type: string | null
  is_active: boolean
  installation_date: string | null
  created_at: string | null
  total_due: number
  gps_coordinates: string | null
  wire_length: number | null
  wire_ownership: string | null
  router_ownership: string | null
  router_serial_number: string | null
  patch_cord_ownership: string | null
  patch_cord_count: number | null
  ethernet_cable_ownership: string | null
  ethernet_cable_length: number | null
  dish_ownership: string | null
  dish_mac_address: string | null
  tv_cable_connection_type: string | null
  node_count: number | null
  stb_serial_number: string | null
  miscellaneous_details: string | null
  miscellaneous_charges: number | null
  packages: Array<{ name: string; price: number; discount_amount: number }>
  technicians: Array<{ id: string; name: string }>
  kpis: {
    total_paid: number
    payment_reliability: number
    outstanding: number
    days_as_customer: number
    total_invoiced: number
    total_complaints: number
    resolved_complaints: number
    open_tasks: number
    open_complaints: number
  }
  invoices: Array<{
    id: string
    invoice_number: string
    due_date: string | null
    total_amount: number
    total_paid: number
    remaining: number
    status: string
    invoice_type?: string | null
    charge_types?: string[]
    created_at: string | null
  }>
  payments: Array<{
    id: string
    invoice_id?: string | null
    invoice_number: string | null
    amount: number
    payment_date: string | null
    payment_method: string | null
    status: string
  }>
  complaints: Array<{
    id: string
    ticket_number: string
    description: string | null
    category: string | null
    status: string
    created_at: string | null
    assigned_to_name: string | null
  }>
  tasks: Array<{
    id: string
    task_type: string
    priority: string
    status: string
    due_date: string | null
    notes: string | null
    assignees: Array<{ id: string; name: string }>
  }>
  inventory: Array<{
    id: string
    item_type: string | null
    serial_number: string | null
    status: string
    assigned_at: string | null
  }>
}

type CustomerTab = "profile" | "billing" | "support" | "equipment"

const TAB_VALUES: CustomerTab[] = ["profile", "billing", "support", "equipment"]

const money = (n: number) =>
  `PKR ${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`

const fmtDate = (value: string | null | undefined) => {
  if (!value) return "—"
  const d = new Date(value)
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

const fmtMonthYear = (value: string | null | undefined) => {
  if (!value) return "—"
  const d = new Date(value)
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(undefined, { year: "numeric", month: "long" })
}

const titleCase = (value: string | null | undefined) =>
  (value || "—").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

const INFO_TONES = [
  "border-electric-blue/15 bg-electric-blue/[0.04]",
  "border-deep-ocean/15 bg-deep-ocean/[0.04]",
  "border-emerald-green/15 bg-emerald-green/[0.04]",
  "border-golden-amber/15 bg-golden-amber/[0.04]",
] as const

function Panel({
  title,
  icon: Icon,
  toneClass,
  children,
}: {
  title: string
  icon: typeof User
  toneClass: string
  children: ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-deep-ocean/10 bg-white shadow-sm">
      <div className={`flex items-center gap-2.5 border-b px-4 py-3 ${toneClass}`}>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/70 text-deep-ocean">
          <Icon className="h-4 w-4" />
        </div>
        <h2 className="text-sm font-semibold text-deep-ocean">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}

function InfoGrid({ items }: { items: Array<{ label: string; value: ReactNode }> }) {
  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      {items.map((item, index) => (
        <div
          key={item.label}
          className={`rounded-lg border px-3 py-2.5 ${INFO_TONES[index % INFO_TONES.length]}`}
        >
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-gray">{item.label}</p>
          <div className="mt-0.5 break-words text-sm font-semibold text-deep-ocean">{item.value || "—"}</div>
        </div>
      ))}
    </div>
  )
}

function EmptyRow({ text }: { text: string }) {
  return <p className="py-3 text-center text-xs text-slate-gray">{text}</p>
}

function MiniMetric({
  label,
  value,
  tone = "default",
}: {
  label: string
  value: ReactNode
  tone?: "default" | "success" | "warning" | "danger" | "accent"
}) {
  const tones = {
    default: "border-deep-ocean/15 bg-light-sky/70 text-deep-ocean",
    success: "border-emerald-green/25 bg-emerald-green/10 text-emerald-green",
    warning: "border-golden-amber/30 bg-golden-amber/10 text-golden-amber",
    danger: "border-coral-red/25 bg-coral-red/10 text-coral-red",
    accent: "border-electric-blue/25 bg-electric-blue/10 text-electric-blue",
  }
  return (
    <div className={`rounded-lg border px-3 py-2 ${tones[tone]}`}>
      <p className="text-[11px] font-medium text-slate-gray">{label}</p>
      <p className="text-sm font-bold tabular-nums">{value}</p>
    </div>
  )
}

function parseTab(value: string | null): CustomerTab {
  if (value && TAB_VALUES.includes(value as CustomerTab)) return value as CustomerTab
  return "profile"
}

export default function EmployeeCustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [customer, setCustomer] = useState<CustomerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const activeTab = parseTab(searchParams.get("tab"))

  const setActiveTab = (tab: CustomerTab) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (tab === "profile") next.delete("tab")
        else next.set("tab", tab)
        return next
      },
      { replace: true },
    )
  }

  useEffect(() => {
    if (!id) return
    const fetchDetail = async () => {
      setLoading(true)
      try {
        const token = getToken()
        const response = await axiosInstance.get(`/employee-portal/customers/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setCustomer(response.data)
      } catch (error: any) {
        toast.error(error?.response?.data?.message || "Failed to load customer profile")
      } finally {
        setLoading(false)
      }
    }
    fetchDetail()
  }, [id, navigate])

  const handleLogout = () => {
    removeToken()
    navigate(LOGIN_ROUTE)
  }

  const kpis = useMemo(() => {
    if (!customer) return null
    return (
      customer.kpis || {
        total_paid: 0,
        payment_reliability: 0,
        outstanding: customer.total_due || 0,
        days_as_customer: 0,
        total_invoiced: 0,
        total_complaints: 0,
        resolved_complaints: 0,
        open_tasks: 0,
        open_complaints: 0,
      }
    )
  }, [customer])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-light-sky/40">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-electric-blue border-t-transparent" />
      </div>
    )
  }

  if (!customer || !kpis) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-light-sky/40 p-4">
        <div className="w-full max-w-md rounded-xl border border-deep-ocean/10 bg-white p-6 text-center shadow-sm">
          <p className="mb-4 text-sm text-slate-gray">Customer not available.</p>
          <Link
            to={portalHomePath()}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-portal-primary px-3 text-sm font-medium text-white hover:bg-portal-primary-dark"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to portal
          </Link>
        </div>
      </div>
    )
  }

  const fullName = `${customer.first_name} ${customer.last_name}`.trim()
  const initials = `${customer.first_name?.[0] || ""}${customer.last_name?.[0] || ""}`.toUpperCase() || "C"

  const kpiItems: PortalStatItem[] = [
    { key: "paid", label: "Total paid", value: money(kpis.total_paid), icon: DollarSign, tone: "success" },
    {
      key: "reliability",
      label: "Payment reliability",
      value: `${kpis.payment_reliability}%`,
      icon: TrendingUp,
      tone: "accent",
    },
    {
      key: "outstanding",
      label: "Outstanding",
      value: money(kpis.outstanding),
      icon: AlertTriangle,
      tone: kpis.outstanding > 0 ? "warning" : "default",
    },
    {
      key: "days",
      label: "Days as customer",
      value: String(kpis.days_as_customer),
      icon: Clock,
      tone: "default",
    },
  ]

  const openSupportCount = (kpis.open_complaints || 0) + (kpis.open_tasks || 0)
  const tabs: Array<{ id: CustomerTab; label: string; count?: number }> = [
    { id: "profile", label: "Profile" },
    { id: "billing", label: "Billing", count: customer.invoices?.length || 0 },
    { id: "support", label: "Support", count: openSupportCount },
    { id: "equipment", label: "Equipment", count: customer.inventory?.length || 0 },
  ]

  return (
    <div className="min-h-screen bg-light-sky/50">
      <header className="sticky top-0 z-40 border-b border-deep-ocean/10 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => navigate(portalHomePath())}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-electric-blue/20 bg-light-sky text-deep-ocean hover:bg-electric-blue/10"
              title="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <p className="text-xs font-medium text-electric-blue">Employee Portal · Customer</p>
              <h1 className="truncate text-base font-semibold text-deep-ocean">{fullName}</h1>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-coral-red hover:bg-coral-red/10"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </header>

      <div className="bg-gradient-to-br from-deep-ocean via-deep-ocean to-electric-blue text-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-start justify-between gap-4 px-4 py-5 sm:px-6">
          <div className="flex min-w-0 items-start gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/25 bg-white/15 text-base font-semibold shadow-sm sm:h-14 sm:w-14 sm:text-lg">
              {initials}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold tracking-tight sm:text-xl">{fullName}</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-white/15 px-2.5 text-xs font-medium">
                  <Wifi className="h-3.5 w-3.5" />
                  {customer.internet_id}
                </span>
                {(customer.area || customer.sub_zone) && (
                  <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-white/15 px-2.5 text-xs font-medium">
                    <MapPin className="h-3.5 w-3.5" />
                    {[customer.area, customer.sub_zone].filter(Boolean).join(" · ")}
                  </span>
                )}
                <span
                  className={`inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold ${
                    customer.is_active ? "bg-emerald-green text-white" : "bg-coral-red/90 text-white"
                  }`}
                >
                  {customer.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {customer.phone_1 && (
                  <a
                    href={`tel:${customer.phone_1}`}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-semibold text-deep-ocean shadow-sm hover:bg-light-sky"
                  >
                    <Phone className="h-3.5 w-3.5 text-electric-blue" />
                    Call
                  </a>
                )}
                {customer.phone_1 && (
                  <a
                    href={`https://wa.me/${String(customer.phone_1).replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/30 bg-white/15 px-3 text-xs font-semibold text-white hover:bg-white/25"
                  >
                    WhatsApp
                  </a>
                )}
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-right text-sm backdrop-blur-sm">
            <p className="text-xs text-white/75">Customer since</p>
            <p className="font-semibold">{fmtMonthYear(customer.installation_date || customer.created_at)}</p>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl space-y-4 px-4 py-4 pb-16 sm:px-6">
        <PortalStatStrip items={kpiItems} columnsMobile={2} columnsDesktop={4} />

        {kpis.outstanding > 0 && (
          <div className="flex items-start gap-2 rounded-xl border border-golden-amber/30 bg-golden-amber/10 px-4 py-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-golden-amber" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-deep-ocean">
                Outstanding balance {money(kpis.outstanding)}
              </p>
              <p className="mt-0.5 text-xs text-slate-gray">Follow up on unpaid invoices for this customer.</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("billing")}
              className="h-8 shrink-0 rounded-lg bg-white px-2.5 text-xs font-semibold text-deep-ocean ring-1 ring-golden-amber/30 hover:bg-light-sky"
            >
              View billing
            </button>
          </div>
        )}

        <div className="sticky top-[57px] z-30 -mx-4 border-y border-deep-ocean/10 bg-light-sky/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
          <div
            role="tablist"
            aria-label="Customer sections"
            className="flex gap-1 overflow-x-auto rounded-lg border border-electric-blue/15 bg-white p-1 shadow-sm"
          >
            {tabs.map((tab) => {
              const selected = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md px-3 text-xs font-semibold transition-colors ${
                    selected
                      ? "bg-electric-blue text-white shadow-sm"
                      : "text-slate-gray hover:bg-light-sky hover:text-deep-ocean"
                  }`}
                >
                  {tab.label}
                  {typeof tab.count === "number" && tab.count > 0 && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                        selected ? "bg-white/20 text-white" : "bg-light-sky text-electric-blue"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div role="tabpanel" className="space-y-4">
          {activeTab === "profile" && (
            <>
              <Panel
                title="Personal information"
                icon={User}
                toneClass="border-electric-blue/20 bg-gradient-to-r from-light-sky to-white"
              >
                <InfoGrid
                  items={[
                    { label: "Full name", value: fullName },
                    {
                      label: "Internet ID",
                      value: (
                        <code className="rounded bg-electric-blue/10 px-1.5 py-0.5 text-xs font-semibold text-electric-blue">
                          {customer.internet_id}
                        </code>
                      ),
                    },
                    { label: "Email", value: customer.email },
                    { label: "Phone", value: customer.phone_1 },
                    { label: "Phone 2", value: customer.phone_2 },
                    { label: "Area", value: customer.area },
                    { label: "Sub-zone", value: customer.sub_zone },
                    { label: "Address", value: customer.installation_address },
                  ]}
                />
              </Panel>

              <Panel
                title="Service details"
                icon={Wifi}
                toneClass="border-deep-ocean/15 bg-gradient-to-r from-deep-ocean/[0.06] to-white"
              >
                <InfoGrid
                  items={[
                    { label: "ISP provider", value: customer.isp_name },
                    { label: "Connection type", value: titleCase(customer.connection_type) },
                    { label: "Internet type", value: titleCase(customer.internet_connection_type) },
                    { label: "Installation date", value: fmtDate(customer.installation_date) },
                    {
                      label: "Assigned technicians",
                      value:
                        customer.technicians?.length > 0
                          ? customer.technicians.map((t) => t.name).join(", ")
                          : "—",
                    },
                  ]}
                />
                {customer.packages?.length > 0 && (
                  <div className="mt-4 border-t border-deep-ocean/10 pt-4">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-deep-ocean">
                      Packages
                    </p>
                    <div className="space-y-2">
                      {customer.packages.map((pkg, idx) => (
                        <div
                          key={`${pkg.name}-${idx}`}
                          className="flex items-center justify-between gap-3 rounded-lg border border-electric-blue/15 bg-light-sky/50 px-3 py-2"
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-electric-blue/15 text-electric-blue">
                              <Package className="h-3.5 w-3.5" />
                            </span>
                            <span className="truncate text-sm font-medium text-deep-ocean">{pkg.name}</span>
                          </div>
                          <span className="text-sm font-bold tabular-nums text-emerald-green">
                            {money(Math.max((pkg.price || 0) - (pkg.discount_amount || 0), 0))}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Panel>
            </>
          )}

          {activeTab === "billing" && (
            <Panel
              title="Billing & finance"
              icon={DollarSign}
              toneClass="border-emerald-green/20 bg-gradient-to-r from-emerald-green/[0.06] to-white"
            >
              <div className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                <MiniMetric label="Total invoiced" value={money(kpis.total_invoiced)} tone="accent" />
                <MiniMetric label="Total paid" value={money(kpis.total_paid)} tone="success" />
                <MiniMetric
                  label="Outstanding"
                  value={money(kpis.outstanding)}
                  tone={kpis.outstanding > 0 ? "warning" : "default"}
                />
              </div>

              <p className="mb-2 text-xs font-semibold text-deep-ocean">Invoice history</p>
              <div className="mb-4 overflow-x-auto rounded-lg border border-emerald-green/20">
                <table className="w-full min-w-[720px] text-sm table-fixed">
                  <thead className="bg-emerald-green/10 text-left text-[11px] uppercase tracking-wide text-deep-ocean">
                    <tr>
                      <th className="px-3 py-2.5 font-semibold w-[160px]">Invoice</th>
                      <th className="px-3 py-2.5 font-semibold w-[140px]">Type</th>
                      <th className="px-3 py-2.5 font-semibold w-[110px]">Date</th>
                      <th className="px-3 py-2.5 font-semibold w-[120px] text-right">Amount</th>
                      <th className="px-3 py-2.5 font-semibold w-[120px] text-right">Remaining</th>
                      <th className="px-3 py-2.5 font-semibold w-[110px]">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(customer.invoices || []).length === 0 ? (
                      <tr>
                        <td colSpan={6}>
                          <EmptyRow text="No invoices" />
                        </td>
                      </tr>
                    ) : (
                      customer.invoices.map((inv, index) => (
                        <tr
                          key={inv.id}
                          className={`border-t border-emerald-green/10 ${
                            index % 2 === 0 ? "bg-white" : "bg-light-sky/40"
                          }`}
                        >
                          <td className="px-3 py-2.5">
                            <Link
                              to={`/invoices/${inv.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-xs sm:text-sm font-semibold text-electric-blue whitespace-nowrap hover:underline"
                            >
                              {inv.invoice_number}
                            </Link>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="inline-block max-w-full truncate px-1.5 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 capitalize">
                              {inv.invoice_type === "mixed" && inv.charge_types?.length
                                ? inv.charge_types.join(" + ").replace(/_/g, " ")
                                : (inv.invoice_type || "—").replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-slate-gray whitespace-nowrap">
                            {fmtDate(inv.created_at || inv.due_date)}
                          </td>
                          <td className="px-3 py-2.5 font-medium tabular-nums text-deep-ocean text-right whitespace-nowrap">
                            {money(inv.total_amount)}
                          </td>
                          <td className="px-3 py-2.5 font-medium tabular-nums text-deep-ocean text-right whitespace-nowrap">
                            {money(inv.remaining)}
                          </td>
                          <td className="px-3 py-2.5">
                            <PortalStatusPill status={inv.status} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <p className="mb-2 text-xs font-semibold text-deep-ocean">Payment history</p>
              <div className="overflow-x-auto rounded-lg border border-electric-blue/20">
                <table className="w-full min-w-[640px] text-sm table-fixed">
                  <thead className="bg-electric-blue/10 text-left text-[11px] uppercase tracking-wide text-deep-ocean">
                    <tr>
                      <th className="px-3 py-2.5 font-semibold w-[120px]">Date</th>
                      <th className="px-3 py-2.5 font-semibold w-[160px]">Invoice</th>
                      <th className="px-3 py-2.5 font-semibold w-[120px] text-right">Amount</th>
                      <th className="px-3 py-2.5 font-semibold w-[120px]">Method</th>
                      <th className="px-3 py-2.5 font-semibold w-[110px]">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(customer.payments || []).length === 0 ? (
                      <tr>
                        <td colSpan={5}>
                          <EmptyRow text="No payments" />
                        </td>
                      </tr>
                    ) : (
                      customer.payments.map((p, index) => (
                        <tr
                          key={p.id}
                          className={`border-t border-electric-blue/10 ${
                            index % 2 === 0 ? "bg-white" : "bg-light-sky/40"
                          }`}
                        >
                          <td className="px-3 py-2.5 text-slate-gray whitespace-nowrap">
                            {fmtDate(p.payment_date)}
                          </td>
                          <td className="px-3 py-2.5">
                            {p.invoice_id && p.invoice_number ? (
                              <Link
                                to={`/invoices/${p.invoice_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono text-xs sm:text-sm font-medium text-electric-blue whitespace-nowrap hover:underline"
                              >
                                {p.invoice_number}
                              </Link>
                            ) : (
                              <span className="font-mono text-xs sm:text-sm font-medium text-deep-ocean whitespace-nowrap">
                                {p.invoice_number || "—"}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 font-semibold tabular-nums text-emerald-green text-right whitespace-nowrap">
                            {money(p.amount)}
                          </td>
                          <td className="px-3 py-2.5 text-slate-gray whitespace-nowrap">
                            {titleCase(p.payment_method)}
                          </td>
                          <td className="px-3 py-2.5">
                            <PortalStatusPill status={p.status} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}

          {activeTab === "support" && (
            <Panel
              title="Support & tasks"
              icon={ClipboardList}
              toneClass="border-golden-amber/20 bg-gradient-to-r from-golden-amber/[0.06] to-white"
            >
              <div className="mb-4 grid grid-cols-3 gap-2.5">
                <MiniMetric label="Complaints" value={kpis.total_complaints} tone="accent" />
                <MiniMetric label="Resolved" value={kpis.resolved_complaints} tone="success" />
                <MiniMetric
                  label="Open tasks"
                  value={kpis.open_tasks}
                  tone={kpis.open_tasks > 0 ? "warning" : "default"}
                />
              </div>

              <p className="mb-2 text-xs font-semibold text-deep-ocean">Complaints</p>
              <div className="mb-4 space-y-2">
                {(customer.complaints || []).length === 0 ? (
                  <EmptyRow text="No complaints" />
                ) : (
                  customer.complaints.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-lg border border-golden-amber/20 border-l-4 border-l-golden-amber bg-golden-amber/[0.04] px-3 py-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-electric-blue">{c.ticket_number}</p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-slate-gray">{c.description || "—"}</p>
                          <p className="mt-1 text-[11px] text-slate-gray">
                            {fmtDate(c.created_at)}
                            {c.assigned_to_name ? ` · ${c.assigned_to_name}` : ""}
                            {c.category ? ` · ${titleCase(c.category)}` : ""}
                          </p>
                        </div>
                        <PortalStatusPill status={c.status} />
                      </div>
                    </div>
                  ))
                )}
              </div>

              <p className="mb-2 text-xs font-semibold text-deep-ocean">Tasks</p>
              <div className="space-y-2">
                {(customer.tasks || []).length === 0 ? (
                  <EmptyRow text="No tasks" />
                ) : (
                  customer.tasks.map((t) => (
                    <div
                      key={t.id}
                      className="rounded-lg border border-electric-blue/15 border-l-4 border-l-electric-blue bg-electric-blue/[0.04] px-3 py-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold capitalize text-deep-ocean">
                            {titleCase(t.task_type)}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-gray">
                            Priority: {titleCase(t.priority)}
                            {t.due_date ? ` · Due ${fmtDate(t.due_date)}` : ""}
                          </p>
                          {t.assignees?.length > 0 && (
                            <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-gray">
                              <Users className="h-3 w-3 text-electric-blue" />
                              {t.assignees.map((a) => a.name).join(", ")}
                            </p>
                          )}
                        </div>
                        <PortalStatusPill status={t.status} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Panel>
          )}

          {activeTab === "equipment" && (
            <Panel
              title="Equipment"
              icon={Box}
              toneClass="border-violet/15 bg-gradient-to-r from-violet/[0.05] to-white"
            >
              <InfoGrid
                items={[
                  { label: "Router ownership", value: titleCase(customer.router_ownership) },
                  { label: "Router serial", value: customer.router_serial_number },
                  { label: "Dish ownership", value: titleCase(customer.dish_ownership) },
                  { label: "Dish MAC", value: customer.dish_mac_address },
                  {
                    label: "Wire",
                    value:
                      customer.wire_length != null
                        ? `${customer.wire_length} m (${titleCase(customer.wire_ownership)})`
                        : titleCase(customer.wire_ownership),
                  },
                  {
                    label: "Ethernet",
                    value:
                      customer.ethernet_cable_length != null
                        ? `${customer.ethernet_cable_length} m (${titleCase(customer.ethernet_cable_ownership)})`
                        : titleCase(customer.ethernet_cable_ownership),
                  },
                  { label: "TV cable", value: titleCase(customer.tv_cable_connection_type) },
                  { label: "STB serial", value: customer.stb_serial_number },
                  { label: "Nodes", value: customer.node_count != null ? String(customer.node_count) : null },
                  { label: "Misc details", value: customer.miscellaneous_details },
                ]}
              />

              <div className="mt-4 border-t border-violet/15 pt-4">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-deep-ocean">
                  <Router className="h-3.5 w-3.5 text-violet" />
                  Assigned inventory
                </p>
                <div className="overflow-x-auto rounded-lg border border-violet/20">
                  <table className="min-w-full text-sm">
                    <thead className="bg-violet/10 text-left text-[11px] uppercase tracking-wide text-deep-ocean">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Type</th>
                        <th className="px-3 py-2 font-semibold">Serial</th>
                        <th className="px-3 py-2 font-semibold">Assigned</th>
                        <th className="px-3 py-2 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(customer.inventory || []).length === 0 ? (
                        <tr>
                          <td colSpan={4}>
                            <EmptyRow text="No inventory assigned" />
                          </td>
                        </tr>
                      ) : (
                        customer.inventory.map((item, index) => (
                          <tr
                            key={item.id}
                            className={`border-t border-violet/10 ${index % 2 === 0 ? "bg-white" : "bg-light-sky/40"}`}
                          >
                            <td className="px-3 py-2 font-medium text-deep-ocean">{titleCase(item.item_type)}</td>
                            <td className="px-3 py-2 font-mono text-xs text-slate-gray">
                              {item.serial_number || "—"}
                            </td>
                            <td className="px-3 py-2 text-slate-gray">{fmtDate(item.assigned_at)}</td>
                            <td className="px-3 py-2">
                              <PortalStatusPill status={item.status} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </Panel>
          )}
        </div>
      </main>
    </div>
  )
}
