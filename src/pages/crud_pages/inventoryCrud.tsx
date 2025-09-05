import type React from "react"
import { useMemo, useState, useEffect } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { CRUDPage } from "../../components/crudPage.tsx"
import { InventoryForm } from "../../components/forms/inventoryForm.tsx"
import { InventoryTransactionsModal } from "../../components/modals/InventoryTransactionsModal.tsx"
import { InventoryAssignmentsModal } from "../../components/modals/InventoryAssignmentsModal.tsx"
import axiosInstance from "../../utils/axiosConfig.ts"
import { getToken } from "../../utils/auth.ts"
import { FaExchangeAlt, FaUsersCog } from "react-icons/fa"

interface InventoryItem {
  id: string
  item_type: string
  quantity: number
  vendor: string
  vendor_name: string
  unit_price?: number
  is_active: boolean
  company_id: string
  attributes: any
  created_at?: string
  updated_at?: string
}

const InventoryManagement: React.FC = () => {
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([])
  const [showTransactionsModal, setShowTransactionsModal] = useState(false)
  const [showAssignmentsModal, setShowAssignmentsModal] = useState(false)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const token = getToken()
        const response = await axiosInstance.get("/suppliers/list", {
          headers: { Authorization: `Bearer ${token}` },
        })
        setSuppliers(response.data)
      } catch (error) {
        console.error("Failed to fetch suppliers", error)
      }
      document.title = "MBA NET - Inventory Management"
    }

    fetchSuppliers()
  }, [])

  const columns = useMemo<ColumnDef<InventoryItem>[]>(
    () => [
      {
        header: "Item Type",
        accessorKey: "item_type",
      },
      {
        header: "Details",
        cell: ({ row }) => {
          const item = row.original
          const attributes = item.attributes || {}
          
          switch (item.item_type) {
            case "Fiber Cable":
              return "Fiber Cable"
            case "EtherNet Cable":
              return `Type: ${attributes.type || 'N/A'}`
            case "Splitters":
              return "Splitter"
            case "ONT":
            case "ONU":
            case "Router":
            case "STB":
              return (
                <div>
                  <div>Serial: {attributes.serial_number || 'N/A'}</div>
                  <div>Type: {attributes.type || 'N/A'}</div>
                  <div>Model: {attributes.model || 'N/A'}</div>
                </div>
              )
            case "Fibe OPTIC Patch Cord":
            case "Ethernet Patch Cord":
              return `Type: ${attributes.type || 'N/A'}`
            case "Switches":
              return `Type: ${attributes.type || 'N/A'}`
            case "Node":
              return `Type: ${attributes.type || 'N/A'}`
            case "Dish":
              return (
                <div>
                  <div>MAC: {attributes.mac_address || 'N/A'}</div>
                  <div>Type: {attributes.type || 'N/A'}</div>
                </div>
              )
            case "Adopter":
              return (
                <div>
                  <div>Volt: {attributes.volt || 'N/A'}</div>
                  <div>Amp: {attributes.amp || 'N/A'}</div>
                </div>
              )
            case "Cable Ties":
              return (
                <div>
                  <div>Type: {attributes.type || 'N/A'}</div>
                  <div>Model: {attributes.model || 'N/A'}</div>
                </div>
              )
            case "Others":
              return "Other Item"
            default:
              return "N/A"
          }
        },
      },
      {
        header: "Quantity",
        accessorKey: "quantity",
      },
      {
        header: "Vendor",
        accessorKey: "vendor_name",
      },
      {
        header: "Unit Price",
        accessorKey: "unit_price",
        cell: ({ row }) => (row.original.unit_price ? `PKR${row.original.unit_price.toFixed(2)}` : "N/A"),
      },
      {
        header: "Transactions",
        cell: ({ row }) => (
          <button
            onClick={() => {
              setSelectedItemId(row.original.id);
              setShowTransactionsModal(true);
            }}
            className="px-2 py-1 bg-[#89A8B2] text-white rounded-md hover:bg-[#6f8a9a] transition-colors duration-200 text-sm"
          >
            View Transactions
          </button>
        ),
      },
      {
        header: "Assignments",
        cell: ({ row }) => (
          <button
            onClick={() => {
              setSelectedItemId(row.original.id);
              setShowAssignmentsModal(true);
            }}
            className="px-2 py-1 bg-[#89A8B2] text-white rounded-md hover:bg-[#6f8a9a] transition-colors duration-200 text-sm"
          >
            View Assignments
          </button>
        ),
      },
    ],
    [],
  )

  const validateBeforeSubmit = (formData: Partial<InventoryItem>) => {
    if (!formData.item_type) {
      return "Item type is required"
    }
    if (!formData.vendor) {
      return "Vendor is required"
    }
    if (formData.quantity == null || formData.quantity < 1) {
      return "Quantity must be at least 1"
    }
    
    // Validate type-specific required fields
    const attributes = formData.attributes || {}
    
    if (formData.item_type === 'EtherNet Cable' && !attributes.type) {
      return "Cable type is required"
    }
    
    if (['ONT', 'ONU', 'Router', 'STB'].includes(formData.item_type || '')) {
      if (!attributes.serial_number) {
        return "Serial number is required"
      }
    }
    
    if (formData.item_type === 'Dish' && !attributes.mac_address) {
      return "MAC address is required"
    }
    
    return null
  }

  return (
    <>
      <CRUDPage<InventoryItem>
        title="Inventory"
        endpoint="inventory"
        columns={columns}
        FormComponent={(props) => <InventoryForm {...props} suppliers={suppliers} />}
        validateBeforeSubmit={validateBeforeSubmit}
      />
      {showTransactionsModal && (
        <InventoryTransactionsModal
          isVisible={showTransactionsModal}
          onClose={() => setShowTransactionsModal(false)}
          inventoryItemId={selectedItemId!}
        />
      )}
      {showAssignmentsModal && (
        <InventoryAssignmentsModal
          isVisible={showAssignmentsModal}
          onClose={() => setShowAssignmentsModal(false)}
          inventoryItemId={selectedItemId!}
        />
      )}
    </>
  )
}

export default InventoryManagement