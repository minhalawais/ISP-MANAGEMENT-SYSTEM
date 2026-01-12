"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Calendar, AlertCircle, Tag, Clock, Users } from "lucide-react"
import axiosInstance from "../../utils/axiosConfig.ts"
import { getToken } from "../../utils/auth.ts"
import { SearchableCustomerSelect } from "../SearchableCustomerSelect.tsx"

interface Employee {
  id: string
  first_name: string
  last_name: string
}

interface Customer {
  id: string
  name: string
  internetId: string
}

interface TaskFormProps {
  formData: any
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  isEditing: boolean
}

export function TaskForm({ formData, handleInputChange, isEditing }: TaskFormProps) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const token = getToken()
      
      // Fetch employees
      try {
        const response = await axiosInstance.get('/employees/list', {
          headers: { Authorization: `Bearer ${token}` }
        })
        setEmployees(Array.isArray(response.data) ? response.data : [])
      } catch (error) {
        console.error('Failed to fetch employees', error)
      }

      // Fetch customers
      try {
        setIsLoadingCustomers(true)
        const response = await axiosInstance.get('/customers/list', {
          headers: { Authorization: `Bearer ${token}` }
        })
        setCustomers(
          response.data.map((customer: any) => ({
            id: customer.id,
            name: `${customer.first_name} ${customer.last_name}`,
            internetId: customer.internet_id,
          }))
        )
      } catch (error) {
        console.error('Failed to fetch customers', error)
      } finally {
        setIsLoadingCustomers(false)
      }
    }
    
    fetchData()
  }, [])

  useEffect(() => {
    // Initialize selected employees from formData
    if (formData.assigned_to) {
      const assignedTo = Array.isArray(formData.assigned_to) 
        ? formData.assigned_to 
        : [formData.assigned_to].filter(Boolean)
      setSelectedEmployees(assignedTo)
    }
  }, [formData.assigned_to])

  const handleCustomerSelect = (customerId: string) => {
    handleInputChange({
      target: {
        name: "customer_id",
        value: customerId,
      },
    } as React.ChangeEvent<HTMLSelectElement>)
  }

  const handleEmployeeToggle = (employeeId: string) => {
    const newSelection = selectedEmployees.includes(employeeId)
      ? selectedEmployees.filter(id => id !== employeeId)
      : [...selectedEmployees, employeeId]
    
    setSelectedEmployees(newSelection)
    
    // Trigger form data update
    const syntheticEvent = {
      target: { name: 'assigned_to', value: newSelection }
    } as unknown as React.ChangeEvent<HTMLInputElement>
    handleInputChange(syntheticEvent)
  }

  const inputClasses = `
    w-full px-4 py-2.5 rounded-lg border border-[#EBF5FF] bg-white text-[#4A5568]
    placeholder-[#4A5568]/60 focus:border-[#3A86FF] focus:ring-2 focus:ring-[#3A86FF]/20
    transition-colors duration-200 text-sm
  `

  const iconInputClasses = `
    w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#EBF5FF] bg-white text-[#4A5568]
    placeholder-[#4A5568]/60 focus:border-[#3A86FF] focus:ring-2 focus:ring-[#3A86FF]/20
    transition-colors duration-200 text-sm
  `

  const selectClasses = `
    w-full pl-10 pr-10 py-2.5 rounded-lg border border-[#EBF5FF] bg-white text-[#4A5568]
    focus:border-[#3A86FF] focus:ring-2 focus:ring-[#3A86FF]/20 transition-colors duration-200 text-sm
    appearance-none bg-no-repeat
    bg-[url('data:image/svg+xml;charset=US-ASCII,<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 8L10 12L14 8" stroke="%234A5568" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>')]
    bg-right-4 bg-center-y
  `

  const labelClasses = "block text-sm font-medium text-[#2A5C8A] mb-1"
  const iconClasses = "h-5 w-5 text-[#4A5568]/60"

  return (
    <div className="space-y-6">
      {/* Task Type */}
      <div>
        <label className={labelClasses}>Task Type *</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Tag className={iconClasses} />
          </div>
          <select
            name="task_type"
            value={formData.task_type || ""}
            onChange={handleInputChange}
            required
            className={selectClasses}
          >
            <option value="">Select Type</option>
            <option value="installation">Installation</option>
            <option value="maintenance">Maintenance</option>
            <option value="complaint">Complaint</option>
            <option value="recovery">Recovery</option>
          </select>
        </div>
      </div>

      {/* Customer Search (Optional) */}
      <div>
        <label className={labelClasses}>Customer (Optional)</label>
        {isLoadingCustomers ? (
          <div className="w-full pl-10 pr-10 py-2.5 border border-slate-gray/20 rounded-lg bg-light-sky/30 text-deep-ocean">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-electric-blue"></div>
              <span className="ml-2 text-slate-gray/60">Loading customers...</span>
            </div>
          </div>
        ) : (
          <SearchableCustomerSelect
            customers={customers}
            value={formData.customer_id || ""}
            onChange={(e) => handleInputChange(e)}
            onCustomerSelect={handleCustomerSelect}
            placeholder="Search and select customer (optional)"
          />
        )}
      </div>

      {/* Priority and Due Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClasses}>Priority *</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <AlertCircle className={iconClasses} />
            </div>
            <select
              name="priority"
              value={formData.priority || "medium"}
              onChange={handleInputChange}
              required
              className={selectClasses}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelClasses}>Due Date & Time *</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className={iconClasses} />
            </div>
            <input
              type="datetime-local"
              name="due_date"
              value={formData.due_date ? formData.due_date.slice(0, 16) : ""}
              onChange={handleInputChange}
              required
              className={iconInputClasses}
            />
          </div>
        </div>
      </div>

      {/* Status */}
      <div>
        <label className={labelClasses}>Status *</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Clock className={iconClasses} />
          </div>
          <select
            name="status"
            value={formData.status || "pending"}
            onChange={handleInputChange}
            required
            className={selectClasses}
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Assign To (Multiple Employees) */}
      <div>
        <label className={labelClasses}>Assign To (Select Multiple) *</label>
        <div className="border border-[#EBF5FF] rounded-lg p-3 bg-white max-h-48 overflow-y-auto">
          {employees.length === 0 ? (
            <p className="text-slate-gray text-sm">Loading employees...</p>
          ) : (
            <div className="space-y-2">
              {employees.map((employee) => (
                <label
                  key={employee.id}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                    selectedEmployees.includes(employee.id)
                      ? 'bg-electric-blue/10 border border-electric-blue/30'
                      : 'hover:bg-light-sky/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedEmployees.includes(employee.id)}
                    onChange={() => handleEmployeeToggle(employee.id)}
                    className="w-4 h-4 text-electric-blue border-slate-gray/30 rounded focus:ring-electric-blue"
                  />
                  <Users className="h-4 w-4 text-slate-gray/60" />
                  <span className="text-sm text-deep-ocean">
                    {employee.first_name} {employee.last_name}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
        {selectedEmployees.length > 0 && (
          <p className="text-xs text-slate-gray mt-1">
            {selectedEmployees.length} employee(s) selected
          </p>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className={labelClasses}>Notes</label>
        <textarea
          name="notes"
          value={formData.notes || ""}
          onChange={handleInputChange}
          placeholder="Enter any additional notes..."
          rows={4}
          className={`${inputClasses} resize-none`}
        />
      </div>
    </div>
  )
}

export default TaskForm
