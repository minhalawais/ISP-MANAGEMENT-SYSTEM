import React, { useEffect, useRef, useState } from "react"
import { Calendar, ChevronDown } from "lucide-react"
import type { CrudPeriod } from "../../types/crudFilters.ts"
import { buildMonthOptions, buildYearOptions, getPktNow } from "../../utils/crudPeriodUtils.ts"

type CrudPeriodFilterProps = {
  period: CrudPeriod
  label: string
  isActive: boolean
  onSetPeriod: (period: CrudPeriod) => void
  onSetAll: () => void
}

export function CrudPeriodFilter({
  period,
  label,
  isActive,
  onSetPeriod,
  onSetAll,
}: CrudPeriodFilterProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const pktNow = getPktNow()
  const draftYear = period?.year ?? pktNow.year
  const draftMonth = period?.month ?? pktNow.month
  const [year, setYear] = useState(draftYear)
  const [month, setMonth] = useState(draftMonth)

  useEffect(() => {
    if (period) {
      setYear(period.year)
      setMonth(period.month)
    }
  }, [period])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const yearOptions = buildYearOptions()
  const monthOptions = buildMonthOptions(year)

  const applySelection = () => {
    onSetPeriod({ year, month })
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg border text-sm transition-colors ${
          isActive
            ? "border-electric-blue/50 bg-electric-blue/[0.06] text-deep-ocean ring-1 ring-electric-blue/20"
            : "border-slate-gray/30 bg-white text-slate-gray hover:bg-light-sky/50"
        }`}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Calendar className="h-4 w-4 shrink-0 text-slate-gray/70" />
        <span className="text-xs text-slate-gray">Period</span>
        <span className="font-medium text-deep-ocean">{label}</span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className="absolute right-0 z-20 mt-1 w-56 rounded-lg border border-slate-gray/15 bg-white shadow-lg p-3">
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => {
                onSetAll()
                setOpen(false)
              }}
              className={`w-full text-left h-8 px-2 rounded-md text-sm ${
                !isActive ? "bg-electric-blue/10 text-deep-ocean font-medium" : "text-slate-gray hover:bg-light-sky/50"
              }`}
            >
              All time
            </button>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-slate-gray mb-1">Year</label>
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full h-8 px-2 text-sm border border-slate-gray/30 rounded-md bg-white"
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-gray mb-1">Month</label>
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="w-full h-8 px-2 text-sm border border-slate-gray/30 rounded-md bg-white"
                >
                  {monthOptions.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={applySelection}
              className="w-full h-8 rounded-md bg-electric-blue text-white text-sm font-medium hover:bg-btn-hover"
            >
              Apply
            </button>
          </div>
          <p className="mt-2 text-[10px] text-slate-gray/80 text-right">Asia/Karachi (PKT)</p>
        </div>
      ) : null}
    </div>
  )
}
