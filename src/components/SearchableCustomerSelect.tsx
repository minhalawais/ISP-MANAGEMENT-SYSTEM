import { useEffect, useMemo, useRef, useState } from "react"
import { Search, Users, Hash, ChevronDown, Loader2 } from "lucide-react"

interface Customer {
  id: string
  name: string
  internetId: string
}

interface SearchableCustomerSelectProps {
  customers: Customer[]
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  onCustomerSelect?: (customerId: string) => void
  /**
   * Called (debounced ~300ms) whenever the search box changes, so a parent
   * can re-query a server-side search endpoint instead of relying solely on
   * client-side filtering of whatever `customers` it was handed.
   */
  onSearchChange?: (term: string) => void
  isLoading?: boolean
  error?: string
  placeholder?: string
}

export function SearchableCustomerSelect({
  customers,
  value,
  onChange,
  onCustomerSelect,
  onSearchChange,
  isLoading = false,
  error,
  placeholder = "Search and select customer",
}: SearchableCustomerSelectProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (!onSearchChange) return
    debounceRef.current = setTimeout(() => onSearchChange(searchTerm), 300)
    return () => clearTimeout(debounceRef.current)
  }, [searchTerm, onSearchChange])

  const filteredCustomers = useMemo(() => {
    // When a parent supplies onSearchChange, it already narrows `customers`
    // server-side, so avoid double-filtering (and dropping results the
    // server matched on fields the client filter doesn't know about).
    if (!searchTerm || onSearchChange) return customers

    return customers.filter(
      (customer) =>
        (customer.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (customer.internetId?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (customer.id?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    )
  }, [customers, searchTerm, onSearchChange])

  const selectedCustomer = customers.find((customer) => customer.id === value)

  const handleCustomerSelect = (customerId: string) => {
    if (onCustomerSelect) {
      onCustomerSelect(customerId)
    } else {
      onChange({
        target: {
          name: "customer_id",
          value: customerId,
        },
      } as React.ChangeEvent<HTMLSelectElement>)
    }
    setIsOpen(false)
    setSearchTerm("")
  }

  return (
    <div className="relative">
      <button
        type="button"
        className={`w-full h-9 pl-9 pr-9 text-left text-sm border rounded-md bg-[#F8FAFB] text-slate-800 cursor-pointer flex items-center shadow-sm transition-colors ${
          error
            ? "border-red-400"
            : isOpen
              ? "bg-white border-[#2A5C8A] ring-1 ring-[#2A5C8A]/25"
              : "border-slate-300 hover:border-slate-400 hover:bg-white"
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Users className="h-4 w-4 text-slate-400" />
        </span>

        {selectedCustomer ? (
          <span className="flex items-center gap-2 min-w-0 truncate">
            <span className="font-medium text-slate-800 truncate">{selectedCustomer.name}</span>
            {selectedCustomer.internetId ? (
              <span className="inline-flex items-center gap-0.5 shrink-0 text-[11px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                <Hash className="h-3 w-3" />
                {selectedCustomer.internetId}
              </span>
            ) : null}
          </span>
        ) : (
          <span className="text-slate-400">{placeholder}</span>
        )}

        <span className="absolute inset-y-0 right-0 flex items-center pr-2.5">
          <ChevronDown
            className={`h-4 w-4 text-slate-400 transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-md max-h-72 overflow-hidden">
          <div className="sticky top-0 bg-white p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search name or internet ID…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-8 pl-8 pr-2.5 text-sm border border-slate-200 rounded-md bg-white text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                autoFocus
              />
            </div>
          </div>

          <div className="overflow-y-auto max-h-56 py-1">
            {isLoading ? (
              <div className="px-3 py-6 flex items-center justify-center gap-2 text-slate-400 text-sm">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Searching…
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="px-3 py-6 text-center text-slate-400 text-sm">No customers found</div>
            ) : (
              filteredCustomers.map((customer) => {
                const selected = value === customer.id
                return (
                  <button
                    type="button"
                    key={customer.id}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between gap-2 transition-colors ${
                      selected ? "bg-slate-100" : "hover:bg-slate-50"
                    }`}
                    onClick={() => handleCustomerSelect(customer.id)}
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-slate-800 truncate">{customer.name}</span>
                      <span className="block text-xs text-slate-500 truncate">{customer.internetId || "—"}</span>
                    </span>
                    {selected ? (
                      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Selected
                      </span>
                    ) : null}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}

      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}

      {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
    </div>
  )
}
