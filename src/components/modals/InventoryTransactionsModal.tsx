"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Modal } from "../modal.tsx"
import axiosInstance from "../../utils/axiosConfig.ts"
import { getToken } from "../../utils/auth.ts"
import { toast } from "react-toastify"

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
        `http://mbanet.com.pk/api/inventory/transactions?inventory_item_id=${inventoryItemId}`,
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
        "http://mbanet.com.pk/api/inventory/transactions/add",
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

  return (
    <Modal isVisible={isVisible} onClose={onClose} title="Inventory Transactions">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Add New Transaction</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Transaction Type</label>
            <select
              name="transaction_type"
              value={newTransaction.transaction_type}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              required
            >
              <option value="">Select type</option>
              <option value="add">Add</option>
              <option value="remove">Remove</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Quantity</label>
            <input
              type="number"
              name="quantity"
              value={newTransaction.quantity}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              required
              min="1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              name="notes"
              value={newTransaction.notes}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Add Transaction
          </button>
        </form>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">Transaction History</h3>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Performed By
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <tr key={transaction.id}>
                <td className="px-6 py-4 whitespace-nowrap">{transaction.transaction_type}</td>
                <td className="px-6 py-4 whitespace-nowrap">{transaction.performed_by}</td>
                <td className="px-6 py-4 whitespace-nowrap">{new Date(transaction.performed_at).toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">{transaction.quantity}</td>
                <td className="px-6 py-4 whitespace-nowrap">{transaction.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  )
}

