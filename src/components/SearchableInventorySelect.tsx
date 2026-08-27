"use client"

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import { createPortal } from "react-dom"
import { Search, Package, ChevronDown } from "lucide-react"

interface InventoryItem {
  id: string
  item_type: string
  quantity: number
  unit_price: number | null
  vendor_name?: string
}

interface SearchableInventorySelectProps {
  items: InventoryItem[]
  excludeIds?: string[]
  onItemSelect: (itemId: string) => void
  isLoading?: boolean
  placeholder?: string
}

export function SearchableInventorySelect({
  items,
  excludeIds = [],
  onItemSelect,
  isLoading = false,
  placeholder = "Search and select inventory item",
}: SearchableInventorySelectProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({})
  const triggerRef = useRef<HTMLButtonElement>(null)

  const availableItems = useMemo(() => {
    return items.filter((item) => !excludeIds.includes(item.id))
  }, [items, excludeIds])

  const filteredItems = useMemo(() => {
    if (!searchTerm) return availableItems

    return availableItems.filter(
      (item) =>
        (item.item_type?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (item.vendor_name?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    )
  }, [availableItems, searchTerm])

  useEffect(() => {
    if (!isOpen || !triggerRef.current) return

    const placeMenu = () => {
      const rect = triggerRef.current!.getBoundingClientRect()
      const gap = 4
      const preferredHeight = 288
      const spaceBelow = window.innerHeight - rect.bottom - gap - 8
      const spaceAbove = rect.top - gap - 8
      const openUp = spaceBelow < 200 && spaceAbove > spaceBelow
      const maxHeight = Math.max(160, Math.min(preferredHeight, openUp ? spaceAbove : spaceBelow))

      setMenuStyle({
        position: "fixed",
        left: rect.left,
        width: Math.max(rect.width, 240),
        zIndex: 10000,
        maxHeight,
        ...(openUp
          ? { bottom: window.innerHeight - rect.top + gap, top: "auto" }
          : { top: rect.bottom + gap, bottom: "auto" }),
      })
    }

    placeMenu()
    window.addEventListener("resize", placeMenu)
    window.addEventListener("scroll", placeMenu, true)
    return () => {
      window.removeEventListener("resize", placeMenu)
      window.removeEventListener("scroll", placeMenu, true)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [isOpen])

  const handleItemSelect = (itemId: string) => {
    onItemSelect(itemId)
    setIsOpen(false)
    setSearchTerm("")
  }

  const menu =
    isOpen &&
    createPortal(
      <>
        <div className="fixed inset-0 z-[9999]" onClick={() => setIsOpen(false)} aria-hidden="true" />
        <div
          style={menuStyle}
          className="bg-white border border-slate-200 rounded-md shadow-lg overflow-hidden flex flex-col"
        >
          <div className="shrink-0 bg-white p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search item or vendor…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-8 pl-8 pr-2.5 text-sm border border-slate-200 rounded-md bg-white text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                autoFocus
              />
            </div>
          </div>

          <div className="overflow-y-auto flex-1 py-1 min-h-0">
            {filteredItems.length === 0 ? (
              <div className="px-3 py-6 text-center text-slate-400 text-sm">
                {searchTerm ? "No items found" : "No items available"}
              </div>
            ) : (
              filteredItems.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className="w-full px-3 py-2 text-left flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                  onClick={() => handleItemSelect(item.id)}
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-slate-800 truncate">{item.item_type}</span>
                    {item.vendor_name ? (
                      <span className="block text-xs text-slate-500 truncate">{item.vendor_name}</span>
                    ) : null}
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-sm tabular-nums text-slate-700">
                      PKR {(item.unit_price ?? 0).toLocaleString()}
                    </span>
                    <span
                      className={`inline-block mt-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded ${
                        item.quantity > 10
                          ? "bg-slate-100 text-slate-600"
                          : item.quantity > 0
                            ? "bg-amber-50 text-amber-700"
                            : "bg-red-50 text-red-600"
                      }`}
                    >
                      Stock {item.quantity}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </>,
      document.body
    )

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        disabled={isLoading}
        className={`w-full h-9 pl-9 pr-9 text-left text-sm border border-slate-300 rounded-md bg-[#F8FAFB] text-slate-800 cursor-pointer flex items-center shadow-sm transition-colors hover:border-slate-400 hover:bg-white focus:outline-none ${
          isOpen ? "bg-white border-[#2A5C8A] ring-1 ring-[#2A5C8A]/25" : ""
        } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
        onClick={() => !isLoading && setIsOpen(!isOpen)}
      >
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Package className="h-4 w-4 text-slate-400" />
        </span>

        <span className="text-slate-400 truncate">
          {isLoading ? "Loading inventory…" : placeholder}
        </span>

        <span className="absolute inset-y-0 right-0 flex items-center pr-2.5">
          <ChevronDown
            className={`h-4 w-4 text-slate-400 transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      {menu}
    </div>
  )
}
