"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Modal } from "../modal.tsx"
import axiosInstance from "../../utils/axiosConfig.ts"
import { getToken } from "../../utils/auth.ts"
import { toast } from "react-toastify"
import { Plus, Minus } from "lucide-react"

interface InventoryTransaction {
  id: string
  inventory_item_name: string
  transaction_type: string
  performed_by: string
  performed_at: string
  notes: string
  quantity: number
}

interface InventoryTransactionsModalProps {
  isVisible: boolean
  onClose: () => void
  inventoryItemId: string
}

export const InventoryTransactionsModal: React.FC<InventoryTransactionsModalProps> = ({
  isVisible,
  onClose,
  inventoryItemId,
}) => {
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([])
  const [newTransaction, setNewTransaction] = useState({
    transaction_type: "",
    notes: "",
    quantity: 1,
  })

  useEffect(() => {
    if (isVisible) {
      fetchTransactions()
    }
  }, [isVisible])

  const fetchTransactions = async () => {
    try {
      const token = getToken()
      const response = await axiosInstance.get(
        `/inventory/transactions?inventory_item_id=${inventoryItemId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      setTransactions(response.data)
    } catch (error) {
      console.error("Failed to fetch inventory transactions", error)
      toast.error("Failed to fetch inventory transactions")
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewTransaction((prev) => ({ ...prev, [name]: name === "quantity" ? Number.parseInt(value) : value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = getToken()
      await axiosInstance.post(
        "/inventory/transactions/add",
        {
          inventory_item_id: inventoryItemId,
          transaction_type: newTransaction.transaction_type,
          quantity: newTransaction.quantity,
          notes: newTransaction.notes,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      toast.success("Transaction added successfully")
      fetchTransactions()
      setNewTransaction({ transaction_type: "", notes: "", quantity: 1 })
    } catch (error) {
      console.error("Failed to add inventory transaction", error)
      toast.error("Failed to add inventory transaction")
    }
  }

  const getTransactionTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "add":
        return "bg-[#D1FAE5] text-[#10B981]"
      case "remove":
        return "bg-[#FEE2E2] text-[#EF4444]"
      default:
        return "bg-[#EBF5FF] text-[#3A86FF]"
    }
  }

  const getTransactionTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "add":
        return <Plus className="h-3 w-3" />
      case "remove":
        return <Minus className="h-3 w-3" />
      default:
        return null
    }
  }

  return (
    <Modal isVisible={isVisible} onClose={onClose} title="Inventory Transactions">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-[#2A5C8A]">Add New Transaction</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#4A5568] mb-1">Transaction Type</label>
            <select
              name="transaction_type"
              value={newTransaction.transaction_type}
              onChange={handleInputChange}
              className="w-full px-3 py-2 rounded-lg border border-[#EBF5FF] text-[#4A5568] focus:border-[#3A86FF] focus:ring-2 focus:ring-[#3A86FF]/20 transition-colors"
              required
            >
              <option value="">Select type</option>
              <option value="add" className="text-[#10B981]">
                Add
              </option>
              <option value="remove" className="text-[#EF4444]">
                Remove
              </option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4A5568] mb-1">Quantity</label>
            <input
              type="number"
              name="quantity"
              value={newTransaction.quantity}
              onChange={handleInputChange}
              className="w-full px-3 py-2 rounded-lg border border-[#EBF5FF] text-[#4A5568] focus:border-[#3A86FF] focus:ring-2 focus:ring-[#3A86FF]/20 transition-colors"
              required
              min="1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4A5568] mb-1">Notes</label>
            <textarea
              name="notes"
              value={newTransaction.notes}
              onChange={handleInputChange}
              className="w-full px-3 py-2 rounded-lg border border-[#EBF5FF] text-[#4A5568] focus:border-[#3A86FF] focus:ring-2 focus:ring-[#3A86FF]/20 transition-colors resize-y"
              rows={3}
              placeholder="Enter transaction notes"
            />
          </div>
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-[#3A86FF] hover:bg-[#2563EB] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3A86FF] transition-colors"
          >
            Add Transaction
          </button>
        </form>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-3 text-[#2A5C8A]">Transaction History</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#EBF5FF]">
            <thead className="bg-[#EBF5FF]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#2A5C8A] uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#2A5C8A] uppercase tracking-wider">
                  Performed By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#2A5C8A] uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#2A5C8A] uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#2A5C8A] uppercase tracking-wider">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#EBF5FF]">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-[#F8FAFC]">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${getTransactionTypeColor(
                        transaction.transaction_type,
                      )}`}
                    >
                      {getTransactionTypeIcon(transaction.transaction_type)}
                      <span className="ml-1">{transaction.transaction_type}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4A5568]">{transaction.performed_by}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4A5568]">
                    {new Date(transaction.performed_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4A5568]">{transaction.quantity}</td>
                  <td className="px-6 py-4 text-sm text-[#4A5568]">{transaction.notes}</td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-[#4A5568]">
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  )
}
