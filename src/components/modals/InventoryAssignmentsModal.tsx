"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Modal } from "../modal.tsx"
import axiosInstance from "../../utils/axiosConfig.ts"
import { getToken } from "../../utils/auth.ts"
import { toast } from "react-toastify"

interface InventoryAssignment {
  id: string
  inventory_item_id: string
  inventory_item_type: string
  assigned_to_customer: string | null
  assigned_to_employee: string | null
  assigned_at: string
  returned_at: string | null
  status: string
}

interface InventoryAssignmentsModalProps {
  isVisible: boolean
  onClose: () => void
  inventoryItemId: string
}

export const InventoryAssignmentsModal: React.FC<InventoryAssignmentsModalProps> = ({
  isVisible,
  onClose,
  inventoryItemId,
}) => {
  const [assignments, setAssignments] = useState<InventoryAssignment[]>([])
  const [newAssignment, setNewAssignment] = useState({
    assigned_to_customer_id: "",
    assigned_to_employee_id: "",
  })
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([])
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    if (isVisible) {
      fetchAssignments()
      fetchCustomers()
      fetchEmployees()
    }
  }, [isVisible])

  const fetchAssignments = async () => {
    try {
      const token = getToken()
      const response = await axiosInstance.get(
        `http://127.0.0.1:5000/inventory/assignments?inventory_item_id=${inventoryItemId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      setAssignments(response.data)
    } catch (error) {
      console.error("Failed to fetch inventory assignments", error)
      toast.error("Failed to fetch inventory assignments")
    }
  }

  const fetchCustomers = async () => {
    try {
      const token = getToken()
      const response = await axiosInstance.get("http://127.0.0.1:5000/customers/list", {
        headers: { Authorization: `Bearer ${token}` },
      })
      setCustomers(
        response.data.map((customer: any) => ({
          id: customer.id,
          name: `${customer.first_name} ${customer.last_name}`,
        })),
      )
    } catch (error) {
      console.error("Failed to fetch customers", error)
      toast.error("Failed to fetch customers")
    }
  }

  const fetchEmployees = async () => {
    try {
      const token = getToken()
      const response = await axiosInstance.get("http://127.0.0.1:5000/employees/list", {
        headers: { Authorization: `Bearer ${token}` },
      })
      setEmployees(
        response.data.map((employee: any) => ({
          id: employee.id,
          name: `${employee.first_name} ${employee.last_name}`,
        })),
      )
    } catch (error) {
      console.error("Failed to fetch employees", error)
      toast.error("Failed to fetch employees")
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target
    setNewAssignment((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = getToken()
      await axiosInstance.post(
        "http://127.0.0.1:5000/inventory/assignments/add",
        { ...newAssignment, inventory_item_id: inventoryItemId },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      toast.success("Assignment added successfully")
      fetchAssignments()
      setNewAssignment({ assigned_to_customer_id: "", assigned_to_employee_id: "" })
    } catch (error) {
      console.error("Failed to add inventory assignment", error)
      toast.error("Failed to add inventory assignment")
    }
  }

  const handleReturn = async (assignmentId: string) => {
    try {
      const token = getToken()
      await axiosInstance.put(
        `http://127.0.0.1:5000/inventory/assignments/return/${assignmentId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      toast.success("Item returned successfully")
      fetchAssignments()
    } catch (error) {
      console.error("Failed to return inventory item", error)
      toast.error("Failed to return inventory item")
    }
  }

  return (
    <Modal isVisible={isVisible} onClose={onClose} title="Inventory Assignments">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Add New Assignment</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Assign to Customer</label>
            <select
              name="assigned_to_customer_id"
              value={newAssignment.assigned_to_customer_id}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            >
              <option value="">Select customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Assign to Employee</label>
            <select
              name="assigned_to_employee_id"
              value={newAssignment.assigned_to_employee_id}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            >
              <option value="">Select employee</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Add Assignment
          </button>
        </form>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">Assignment History</h3>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assigned To
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assigned At
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Returned At
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {assignments.map((assignment) => (
              <tr key={assignment.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {assignment.assigned_to_customer || assignment.assigned_to_employee}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{new Date(assignment.assigned_at).toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {assignment.returned_at ? new Date(assignment.returned_at).toLocaleString() : "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{assignment.status}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {assignment.status === "assigned" && (
                    <button
                      onClick={() => handleReturn(assignment.id)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Return
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  )
}

