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
        `/inventory/assignments?inventory_item_id=${inventoryItemId}`,
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
      const response = await axiosInstance.get("/customers/list", {
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
      const response = await axiosInstance.get("/employees/list", {
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
        "/inventory/assignments/add",
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
        `/inventory/assignments/return/${assignmentId}`,
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "assigned":
        return "bg-[#FEF3C7] text-[#F59E0B]"
      case "returned":
        return "bg-[#D1FAE5] text-[#10B981]"
      default:
        return "bg-[#EBF5FF] text-[#3A86FF]"
    }
  }

  return (
    <Modal isVisible={isVisible} onClose={onClose} title="Inventory Assignments">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-[#2A5C8A]">Add New Assignment</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#4A5568] mb-1">Assign to Customer</label>
            <select
              name="assigned_to_customer_id"
              value={newAssignment.assigned_to_customer_id}
              onChange={handleInputChange}
              className="w-full px-3 py-2 rounded-lg border border-[#EBF5FF] text-[#4A5568] focus:border-[#3A86FF] focus:ring-2 focus:ring-[#3A86FF]/20 transition-colors"
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
            <label className="block text-sm font-medium text-[#4A5568] mb-1">Assign to Employee</label>
            <select
              name="assigned_to_employee_id"
              value={newAssignment.assigned_to_employee_id}
              onChange={handleInputChange}
              className="w-full px-3 py-2 rounded-lg border border-[#EBF5FF] text-[#4A5568] focus:border-[#3A86FF] focus:ring-2 focus:ring-[#3A86FF]/20 transition-colors"
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
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-[#3A86FF] hover:bg-[#2563EB] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3A86FF] transition-colors"
          >
            Add Assignment
          </button>
        </form>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-3 text-[#2A5C8A]">Assignment History</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#EBF5FF]">
            <thead className="bg-[#EBF5FF]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#2A5C8A] uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#2A5C8A] uppercase tracking-wider">
                  Assigned At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#2A5C8A] uppercase tracking-wider">
                  Returned At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#2A5C8A] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#2A5C8A] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#EBF5FF]">
              {assignments.map((assignment) => (
                <tr key={assignment.id} className="hover:bg-[#F8FAFC]">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4A5568]">
                    {assignment.assigned_to_customer || assignment.assigned_to_employee}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4A5568]">
                    {new Date(assignment.assigned_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4A5568]">
                    {assignment.returned_at ? new Date(assignment.returned_at).toLocaleString() : "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                        assignment.status,
                      )}`}
                    >
                      {assignment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {assignment.status === "assigned" && (
                      <button
                        onClick={() => handleReturn(assignment.id)}
                        className="text-[#3A86FF] hover:text-[#2563EB] font-medium transition-colors"
                      >
                        Return
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {assignments.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-[#4A5568]">
                    No assignments found
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
