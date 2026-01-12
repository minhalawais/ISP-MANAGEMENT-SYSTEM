"use client"

import { useState, useMemo } from "react"
import { Search, Package, DollarSign, ChevronDown, Box } from "lucide-react"

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
    placeholder = "Search and select inventory item"
}: SearchableInventorySelectProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const [isOpen, setIsOpen] = useState(false)

    const availableItems = useMemo(() => {
        return items.filter(item => !excludeIds.includes(item.id))
    }, [items, excludeIds])

    const filteredItems = useMemo(() => {
        if (!searchTerm) return availableItems;

        return availableItems.filter(item =>
            (item.item_type?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            (item.vendor_name?.toLowerCase() || "").includes(searchTerm.toLowerCase())
        );
    }, [availableItems, searchTerm]);

    const handleItemSelect = (itemId: string) => {
        onItemSelect(itemId)
        setIsOpen(false)
        setSearchTerm("")
    }

    return (
        <div className="relative">
            {/* Trigger button */}
            <div
                className={`w-full pl-10 pr-10 py-2.5 border border-slate-gray/20 rounded-lg bg-white text-deep-ocean cursor-pointer flex items-center transition-all duration-200 hover:border-electric-blue/30 ${isLoading ? 'opacity-50' : ''}`}
                onClick={() => !isLoading && setIsOpen(!isOpen)}
            >
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Package className="h-5 w-5 text-slate-gray/60" />
                </div>

                <span className="text-slate-gray/50">
                    {isLoading ? "Loading inventory..." : placeholder}
                </span>

                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <ChevronDown className={`h-5 w-5 text-slate-gray/60 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {/* Dropdown menu */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-gray/20 rounded-lg shadow-lg max-h-80 overflow-y-auto animate-dropdown">
                    {/* Search input */}
                    <div className="sticky top-0 bg-white p-3 border-b border-slate-gray/20">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-gray/60" />
                            <input
                                type="text"
                                placeholder="Search by item type or vendor..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border border-slate-gray/20 rounded-md focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Options list */}
                    <div className="p-2">
                        {filteredItems.length === 0 ? (
                            <div className="p-4 text-center text-slate-gray text-sm">
                                <Search className="h-8 w-8 mx-auto mb-2 text-slate-gray/40" />
                                <p>{searchTerm ? `No items found matching "${searchTerm}"` : "No items available"}</p>
                            </div>
                        ) : (
                            filteredItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="p-3 cursor-pointer rounded-lg mb-1 transition-all duration-200 hover:bg-light-sky/50 hover:border-electric-blue/20 border border-transparent bg-white"
                                    onClick={() => handleItemSelect(item.id)}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        {/* Item Type with Icon */}
                                        <div className="flex items-center gap-2 min-w-[150px]">
                                            <Box className="h-4 w-4 text-electric-blue" />
                                            <div>
                                                <span className="text-sm font-medium text-deep-ocean block">
                                                    {item.item_type}
                                                </span>
                                                {item.vendor_name && (
                                                    <span className="text-xs text-slate-gray">
                                                        {item.vendor_name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Price */}
                                        <div className="flex items-center gap-1 text-sm">
                                            <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                                            <span className="font-medium text-emerald-600">
                                                PKR {(item.unit_price ?? 0).toLocaleString()}
                                            </span>
                                        </div>

                                        {/* Stock */}
                                        <div className="text-right min-w-[80px]">
                                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${item.quantity > 10
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : item.quantity > 0
                                                        ? 'bg-amber-100 text-amber-700'
                                                        : 'bg-red-100 text-red-700'
                                                }`}>
                                                Stock: {item.quantity}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Click outside to close */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    )
}
