"use client"

import type { ReactNode } from "react"
import { useCallback, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft,
  MapPin,
  LayoutDashboard,
  ClipboardList,
  AlertCircle,
  Users,
  RefreshCw,
  Wallet,
  Box,
  User,
  Save,
  Check,
} from "lucide-react"
import axiosInstance from "../utils/axiosConfig.ts"
import { getToken } from "../utils/auth.ts"
import { toast } from "../utils/notify.ts";
import { useCompany } from "../context/CompanyContext.tsx"
import { Sidebar } from "../components/sideNavbar.tsx"
import { Topbar } from "../components/topNavbar.tsx"
import { useOptionalAdminChrome } from "../context/AdminLayoutContext.tsx"
import {
  DEFAULT_PORTAL_ACCESS,
  enabledModules,
  mergePortalAccess,
  moduleLabel,
  PORTAL_MODULE_NAMES,
  TASK_STATUS_OPTIONS,
  TASK_PRIORITY_OPTIONS,
  TASK_TYPE_OPTIONS,
  RECOVERY_STATUS_OPTIONS,
  COMPLAINT_STATUS_OPTIONS,
  COMPLAINT_CATEGORY_OPTIONS,
  toggleFilterValue,
  type EmployeePortalAccess,
  type PortalModuleName,
} from "../utils/employeePortalAccess.ts"

interface AreaOption {
  id: string
  name: string
}

interface SubZoneOption {
  id: string
  name: string
  area_id: string
}

const MODULE_ICONS: Record<PortalModuleName, typeof Users> = {
  dashboard: LayoutDashboard,
  tasks: ClipboardList,
  complaints: AlertCircle,
  customers: Users,
  recoveries: RefreshCw,
  financial: Wallet,
  inventory: Box,
  profile: User,
}

const MODULE_HINTS: Partial<Record<PortalModuleName, string>> = {
  customers: "Visible customers = technician ∪ areas ∪ sub-zones (OR).",
  recoveries: "Assigned recoveries and/or recoveries for portal customers.",
  tasks: "Assigned tasks and/or tasks for portal customers / geo.",
  complaints: "Assigned complaints and/or complaints for portal customers / geo.",
  inventory: "Items assigned to the employee and/or to portal customers.",
  financial: "Own ledger only. Cannot view other employees.",
  dashboard: "KPIs follow the same scope as each enabled module.",
  profile: "Always limited to the signed-in employee.",
}

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  description?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="w-full flex items-start gap-3 text-left group"
    >
      <span
        className={`mt-0.5 relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${
          checked ? "bg-[#89A8B2]" : "bg-slate-200"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-slate-800 group-hover:text-slate-950">
          {label}
        </span>
        {description && (
          <span className="block text-xs text-slate-500 mt-0.5 leading-relaxed">{description}</span>
        )}
      </span>
    </button>
  )
}

function SectionCard({
  icon: Icon,
  title,
  subtitle,
  enabled,
  onEnabledChange,
  showEnable = true,
  children,
}: {
  icon: typeof Users
  title: string
  subtitle?: string
  enabled?: boolean
  onEnabledChange?: (v: boolean) => void
  showEnable?: boolean
  children?: ReactNode
}) {
  return (
    <section className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 bg-slate-50/60">
        <div className="h-9 w-9 rounded-lg bg-[#89A8B2]/15 text-[#5f7d86] flex items-center justify-center shrink-0">
          <Icon className="h-4.5 w-4.5 h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {showEnable && onEnabledChange && (
          <button
            type="button"
            role="switch"
            aria-checked={!!enabled}
            onClick={() => onEnabledChange(!enabled)}
            className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${
              enabled ? "bg-[#89A8B2]" : "bg-slate-200"
            }`}
            title={enabled ? "Module on" : "Module off"}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                enabled ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        )}
      </div>
      {(!showEnable || enabled) && children != null && (
        <div className="p-4 space-y-3">{children}</div>
      )}
      {showEnable && !enabled && (
        <div className="px-4 py-3 text-xs text-slate-400">Hidden from employee portal sidebar.</div>
      )}
    </section>
  )
}

function ChipGrid({
  items,
  selectedIds,
  onToggle,
  emptyText,
}: {
  items: { id: string; name: string }[]
  selectedIds: string[]
  onToggle: (id: string) => void
  emptyText: string
}) {
  if (!items.length) {
    return <p className="text-xs text-slate-400 py-2">{emptyText}</p>
  }
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const selected = selectedIds.includes(item.id)
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onToggle(item.id)}
            className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium border transition-colors ${
              selected
                ? "bg-[#89A8B2] border-[#89A8B2] text-white"
                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            {selected && <Check className="h-3 w-3" />}
            {item.name}
          </button>
        )
      })}
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  )
}

const inputClass =
  "w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#89A8B2]/30 focus:border-[#89A8B2]"

export default function EmployeePortalAccessPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { setPageTitle } = useCompany()
  const hasChrome = useOptionalAdminChrome()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [employeeName, setEmployeeName] = useState("")
  const [access, setAccess] = useState<EmployeePortalAccess>(DEFAULT_PORTAL_ACCESS)
  const [areas, setAreas] = useState<AreaOption[]>([])
  const [subZones, setSubZones] = useState<SubZoneOption[]>([])

  useEffect(() => {
    setPageTitle("Portal Access")
  }, [setPageTitle])

  const loadSubZonesForAreas = useCallback(async (areaIds: string[]) => {
    if (!areaIds.length) {
      setSubZones([])
      return
    }
    const token = getToken()
    const results = await Promise.all(
      areaIds.map((areaId) =>
        axiosInstance
          .get(`/sub-zones/by-area/${areaId}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then((res) =>
            (res.data || []).map((sz: SubZoneOption) => ({
              ...sz,
              area_id: areaId,
            }))
          )
          .catch(() => [])
      )
    )
    setSubZones(results.flat())
  }, [])

  useEffect(() => {
    if (!id) return
    const load = async () => {
      setLoading(true)
      try {
        const token = getToken()
        const [accessRes, areasRes] = await Promise.all([
          axiosInstance.get(`/employees/${id}/portal-access`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axiosInstance.get("/areas/list", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])
        const merged = mergePortalAccess(accessRes.data?.portal_access)
        setAccess(merged)
        setEmployeeName(
          `${accessRes.data?.first_name || ""} ${accessRes.data?.last_name || ""}`.trim() ||
            "Employee"
        )
        setAreas(areasRes.data || [])
        await loadSubZonesForAreas(merged.area_ids)
      } catch (err: any) {
        toast.error(err.response?.data?.error || "Failed to load portal access")
        navigate("/employee-management")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, loadSubZonesForAreas, navigate])

  const toggleArea = async (areaId: string) => {
    const removing = access.area_ids.includes(areaId)
    const nextIds = removing
      ? access.area_ids.filter((x) => x !== areaId)
      : [...access.area_ids, areaId]

    let nextSubZones = access.sub_zone_ids
    if (removing) {
      const zoneIdsInArea = new Set(
        subZones.filter((sz) => sz.area_id === areaId).map((sz) => sz.id)
      )
      nextSubZones = access.sub_zone_ids.filter((x) => !zoneIdsInArea.has(x))
    }

    setAccess((prev) => ({
      ...prev,
      area_ids: nextIds,
      sub_zone_ids: nextSubZones,
    }))
    await loadSubZonesForAreas(nextIds)
  }

  const toggleSubZone = (subZoneId: string) => {
    setAccess((prev) => ({
      ...prev,
      sub_zone_ids: prev.sub_zone_ids.includes(subZoneId)
        ? prev.sub_zone_ids.filter((x) => x !== subZoneId)
        : [...prev.sub_zone_ids, subZoneId],
    }))
  }

  const patchModule = (
    name: PortalModuleName,
    patch: Partial<EmployeePortalAccess["modules"][PortalModuleName]>
  ) => {
    setAccess((prev) => ({
      ...prev,
      modules: {
        ...prev.modules,
        [name]: { ...prev.modules[name], ...patch },
      },
    }))
  }

  const patchCustom = (name: PortalModuleName, key: string, value: unknown) => {
    setAccess((prev) => ({
      ...prev,
      modules: {
        ...prev.modules,
        [name]: {
          ...prev.modules[name],
          custom: {
            ...(prev.modules[name].custom || {}),
            [key]: value,
          },
        },
      },
    }))
  }

  const handleSave = async () => {
    if (!id) return
    setSaving(true)
    try {
      const token = getToken()
      await axiosInstance.put(
        `/employees/${id}/portal-access`,
        { portal_access: access },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success("Portal access saved")
      navigate("/employee-management")
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to save portal access")
    } finally {
      setSaving(false)
    }
  }

  const enabled = enabledModules(access)
  const custom = (name: PortalModuleName) =>
    (access.modules[name].custom || {}) as Record<string, any>

  const renderModuleRules = (name: PortalModuleName) => {
    const mod = access.modules[name]

    if (name === "customers") {
      return (
        <div className="space-y-3">
          <Toggle
            checked={!!mod.assigned_as_technician}
            onChange={(v) => patchModule(name, { assigned_as_technician: v })}
            label="Assigned as technician"
            description="Customers where this employee is listed as technician."
          />
          <Toggle
            checked={!!mod.by_areas}
            onChange={(v) => patchModule(name, { by_areas: v })}
            label="By selected areas"
            description="All customers in the areas chosen under Geography."
          />
          <Toggle
            checked={!!mod.by_sub_zones}
            onChange={(v) => patchModule(name, { by_sub_zones: v })}
            label="By selected sub-zones"
            description="All customers in the sub-zones chosen under Geography."
          />
        </div>
      )
    }

    if (name === "recoveries" || name === "tasks" || name === "complaints" || name === "inventory") {
      return (
        <div className="space-y-3">
          <Toggle
            checked={!!mod.assigned_to_me}
            onChange={(v) => patchModule(name, { assigned_to_me: v })}
            label="Assigned to employee"
            description="Records directly assigned to this employee."
          />
          <Toggle
            checked={!!mod.for_portal_customers}
            onChange={(v) => patchModule(name, { for_portal_customers: v })}
            label="For portal customers"
            description="Records linked to customers in this employee’s customer scope."
          />
          {(name === "tasks" || name === "complaints") && (
            <>
              <Toggle
                checked={!!mod.by_areas}
                onChange={(v) => patchModule(name, { by_areas: v })}
                label="By selected areas"
              />
              <Toggle
                checked={!!mod.by_sub_zones}
                onChange={(v) => patchModule(name, { by_sub_zones: v })}
                label="By selected sub-zones"
              />
            </>
          )}

          {name === "recoveries" && (
            <div className="pt-3 mt-1 border-t border-slate-100 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Custom filters
              </p>
              <Toggle
                checked={!!custom(name).overdue_only}
                onChange={(v) => patchCustom(name, "overdue_only", v)}
                label="Overdue only"
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="Min remaining">
                  <input
                    type="number"
                    className={inputClass}
                    value={custom(name).min_remaining ?? ""}
                    onChange={(e) =>
                      patchCustom(
                        name,
                        "min_remaining",
                        e.target.value === "" ? undefined : Number(e.target.value)
                      )
                    }
                  />
                </Field>
                <Field label="Max remaining">
                  <input
                    type="number"
                    className={inputClass}
                    value={custom(name).max_remaining ?? ""}
                    onChange={(e) =>
                      patchCustom(
                        name,
                        "max_remaining",
                        e.target.value === "" ? undefined : Number(e.target.value)
                      )
                    }
                  />
                </Field>
                <Field label="Created within days">
                  <input
                    type="number"
                    className={inputClass}
                    value={custom(name).created_within_days ?? ""}
                    onChange={(e) =>
                      patchCustom(
                        name,
                        "created_within_days",
                        e.target.value === "" ? undefined : Number(e.target.value)
                      )
                    }
                  />
                </Field>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-600 mb-2">Statuses</p>
                <ChipGrid
                  items={RECOVERY_STATUS_OPTIONS}
                  selectedIds={custom(name).statuses || []}
                  onToggle={(value) =>
                    patchCustom(name, "statuses", toggleFilterValue(custom(name).statuses, value))
                  }
                  emptyText="No status options"
                />
              </div>
            </div>
          )}

          {name === "tasks" && (
            <div className="pt-3 mt-1 border-t border-slate-100 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Custom filters
              </p>
              <div>
                <p className="text-xs font-medium text-slate-600 mb-2">Statuses</p>
                <ChipGrid
                  items={TASK_STATUS_OPTIONS}
                  selectedIds={custom(name).statuses || []}
                  onToggle={(value) =>
                    patchCustom(name, "statuses", toggleFilterValue(custom(name).statuses, value))
                  }
                  emptyText="No status options"
                />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-600 mb-2">Priorities</p>
                <ChipGrid
                  items={TASK_PRIORITY_OPTIONS}
                  selectedIds={custom(name).priorities || []}
                  onToggle={(value) =>
                    patchCustom(name, "priorities", toggleFilterValue(custom(name).priorities, value))
                  }
                  emptyText="No priority options"
                />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-600 mb-2">Task types</p>
                <ChipGrid
                  items={TASK_TYPE_OPTIONS}
                  selectedIds={custom(name).task_types || []}
                  onToggle={(value) =>
                    patchCustom(name, "task_types", toggleFilterValue(custom(name).task_types, value))
                  }
                  emptyText="No type options"
                />
              </div>
            </div>
          )}

          {name === "complaints" && (
            <div className="pt-3 mt-1 border-t border-slate-100 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Custom filters
              </p>
              <div>
                <p className="text-xs font-medium text-slate-600 mb-2">Statuses</p>
                <ChipGrid
                  items={COMPLAINT_STATUS_OPTIONS}
                  selectedIds={custom(name).statuses || []}
                  onToggle={(value) =>
                    patchCustom(name, "statuses", toggleFilterValue(custom(name).statuses, value))
                  }
                  emptyText="No status options"
                />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-600 mb-2">Categories</p>
                <ChipGrid
                  items={COMPLAINT_CATEGORY_OPTIONS}
                  selectedIds={custom(name).categories || []}
                  onToggle={(value) =>
                    patchCustom(
                      name,
                      "categories",
                      toggleFilterValue(custom(name).categories, value)
                    )
                  }
                  emptyText="No category options"
                />
              </div>
            </div>
          )}
        </div>
      )
    }

    return (
      <p className="text-xs text-slate-500 leading-relaxed">{MODULE_HINTS[name]}</p>
    )
  }

  return (
    <div className={hasChrome ? "flex-1 min-w-0 w-full" : "flex h-screen bg-[#F4F6F8]"}>
      {!hasChrome && (
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen((v) => !v)} />
      )}
      <div className={hasChrome ? "flex-1 min-w-0 w-full" : "flex-1 flex flex-col min-w-0 overflow-hidden"}>
        {!hasChrome && <Topbar toggleSidebar={() => setIsSidebarOpen((v) => !v)} />}

        <div className={hasChrome ? "" : "flex-1 overflow-y-auto pt-16"}>
          <div className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur-sm">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center gap-3 justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => navigate("/employee-management")}
                  className="h-9 w-9 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 flex items-center justify-center shrink-0"
                  title="Back"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="min-w-0">
                  <h1 className="text-lg font-semibold text-slate-900 truncate">Portal access</h1>
                  <p className="text-xs text-slate-500 truncate">
                    {employeeName || "…"} · configure what this employee can see
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || loading}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-[#5f7d86] hover:bg-[#516c74] text-white text-sm font-medium disabled:opacity-60 shrink-0"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>

          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 pb-16">
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <div className="h-8 w-8 rounded-full border-2 border-[#89A8B2] border-t-transparent animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs font-medium text-slate-500 mb-2">Enabled in sidebar</p>
                  <div className="flex flex-wrap gap-1.5">
                    {enabled.length ? (
                      enabled.map((m) => (
                        <span
                          key={m}
                          className="inline-flex items-center h-6 px-2.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-medium border border-emerald-100"
                        >
                          {moduleLabel(m)}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">No modules enabled</span>
                    )}
                  </div>
                </div>

                <SectionCard
                  icon={MapPin}
                  title="Geography"
                  subtitle="Shared area and sub-zone lists used when a module enables geo filters."
                  showEnable={false}
                >
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-600 mb-2">Areas</p>
                      <ChipGrid
                        items={areas}
                        selectedIds={access.area_ids}
                        onToggle={toggleArea}
                        emptyText="No areas found for this company."
                      />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-600 mb-2">Sub-zones</p>
                      <ChipGrid
                        items={subZones}
                        selectedIds={access.sub_zone_ids}
                        onToggle={toggleSubZone}
                        emptyText="Select areas above to load sub-zones."
                      />
                    </div>
                  </div>
                </SectionCard>

                {PORTAL_MODULE_NAMES.map((name) => (
                  <SectionCard
                    key={name}
                    icon={MODULE_ICONS[name]}
                    title={moduleLabel(name)}
                    subtitle={MODULE_HINTS[name]}
                    enabled={!!access.modules[name].enabled}
                    onEnabledChange={(v) => patchModule(name, { enabled: v })}
                  >
                    {renderModuleRules(name)}
                  </SectionCard>
                ))}

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-[#5f7d86] hover:bg-[#516c74] text-white text-sm font-medium disabled:opacity-60"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? "Saving…" : "Save portal access"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
