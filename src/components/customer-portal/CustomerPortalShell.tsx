"use client"

import type React from "react"
import { LogOut, Plus } from "lucide-react"
import { DomainLoginLogo } from "../DomainLoginLogo.tsx"
import { PortalStatusPill } from "../employee-portal/shared/PortalStatusPill.tsx"

interface CustomerPortalShellProps {
  customerName: string
  internetId: string
  isActive: boolean
  onLodgeComplaint: () => void
  onLogout: () => void
  children: React.ReactNode
}

export function CustomerPortalShell({
  customerName,
  internetId,
  isActive,
  onLodgeComplaint,
  onLogout,
  children,
}: CustomerPortalShellProps) {
  return (
    <div className="min-h-screen bg-[#F4F7FA]">
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white shadow-sm">
        <div className="h-0.5 bg-gradient-to-r from-portal-accent to-portal-primary" />
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-32 shrink-0 items-center">
              <DomainLoginLogo
                className="w-full"
                connectxClassName="h-7 w-auto max-w-full object-contain"
              />
            </div>
            <div className="hidden min-w-0 sm:block">
              <p className="text-sm font-semibold text-deep-ocean">Customer portal</p>
              <p className="truncate text-xs text-slate-gray">
                {customerName}
                <span className="text-gray-300"> · </span>
                {internetId}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="min-w-0 sm:hidden">
              <p className="truncate text-xs font-medium text-gray-900">{customerName}</p>
              <p className="truncate text-[11px] text-slate-gray">{internetId}</p>
            </div>
            <PortalStatusPill status={isActive ? "active" : "inactive"} />
            <button
              type="button"
              onClick={onLodgeComplaint}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-portal-primary px-3 text-sm font-medium text-white hover:bg-portal-primary-dark"
            >
              <Plus className="h-4 w-4" />
              Lodge complaint
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-slate-gray hover:bg-gray-50"
            >
              <LogOut className="h-4 w-4" />
              Exit
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5">{children}</main>
    </div>
  )
}
