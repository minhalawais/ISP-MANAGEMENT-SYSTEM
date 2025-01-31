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
  name: string
  description: string
  serial_number: string
  status: string
  supplier_id: string
  supplier_name: string
  is_splitter: boolean
  splitter_number?: string
  splitter_type?: string
  port_count?: number
  item_type: string
  quantity: number
  unit_price?: number
  is_active: boolean
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
        const response = await axiosInstance.get("https://mbanet.com.pk/api/suppliers/list", {
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
        header: "Name",
        accessorKey: "name",
      },
      {
        header: "Description",
        accessorKey: "description",
      },
      {
        header: "Serial Number",
        accessorKey: "serial_number",
      },
      {
        header: "Status",
        accessorKey: "status",
      },
      {
        header: "Supplier",
        accessorKey: "supplier_name",
      },
      {
        header: "Type",
        accessorKey: "item_type",
      },
      {
        header: "Quantity",
        accessorKey: "quantity",
      },
      {
        header: "Unit Price",
        accessorKey: "unit_price",
        cell: ({ row }) => (row.original.unit_price ? `$${row.original.unit_price.toFixed(2)}` : "N/A"),
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
    if (!formData.name || formData.name.trim() === "") {
      return "Item name is required"
    }
    if (!formData.serial_number || formData.serial_number.trim() === "") {
      return "Serial number is required"
    }
    if (!formData.status) {
      return "Status is required"
    }
    if (!formData.supplier_id) {
      return "Supplier is required"
    }
    if (!formData.item_type) {
      return "Item type is required"
    }
    if (formData.quantity == null || formData.quantity < 1) {
      return "Quantity must be at least 1"
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

