"use client"

import type React from "react"
import { useEffect, useState, Fragment, useCallback } from "react"
import { Combobox, Transition } from "@headlessui/react"
import { Search, Check, Paperclip, Calendar, User, X, Loader2, MessageSquare, ChevronDown, Clock } from 'lucide-react'
import axiosInstance from "../../utils/axiosConfig.ts"
import { getToken } from "../../utils/auth.ts"
import { motion } from "framer-motion"

interface ComplaintFormProps {
  formData: any
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  handleFileChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSubmit?: (e: React.FormEvent) => void
  isEditing: boolean
  handleCustomerSearch?: (searchTerm: string) => Promise<any>
  ticketNumber?: string | null
}

interface Customer {
  id: string
  first_name: string
  last_name: string
  internet_id: string
  phone_1: string
  phone_2: string | null
  installation_address: string
  gps_coordinates: string | null
}

interface Employee {
  id: string
  first_name: string
  last_name: string
}

export function ComplaintForm({
  formData,
  handleInputChange,
  handleFileChange,
  handleSubmit,
  isEditing,
  handleCustomerSearch,
  ticketNumber,
}: ComplaintFormProps) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [customerSearchTerm, setCustomerSearchTerm] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [employeeQuery, setEmployeeQuery] = useState("")
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [customerFound, setCustomerFound] = useState<boolean | null>(null)

  useEffect(() => {
    const fetchEmployees = async () => {
      const token = getToken()
      try {
        const response = await axiosInstance.get("/employees/list", {
          headers: { Authorization: `Bearer ${token}` },
        })
        setEmployees(response.data)
      } catch (error) {
        console.error("Failed to fetch employees", error)
      }
    }
    fetchEmployees()
  }, [])

  const handleCustomerSearchChange = async (value: string) => {
    const numericValue = value.replace(/\D/g, "")
    setCustomerSearchTerm(numericValue)
    if (numericValue.length >= 3) {
      setIsSearching(true)
      setCustomerFound(null)
      const customer = await handleCustomerSearch(numericValue)
      setIsSearching(false)
      if (customer) {
        setSelectedCustomer(customer)
        setCustomerFound(true)
        handleInputChange({
          target: { name: "customer_id", value: customer.id },
        } as React.ChangeEvent<HTMLInputElement>)
      } else {
        setSelectedCustomer(null)
        setCustomerFound(false)
      }
    } else {
      setSelectedCustomer(null)
      setCustomerFound(null)
    }
  }

  const FileUploadField = useCallback(
    ({
      label,
      name,
      onChange,
      currentImage,
      currentDocument,
    }: {
      label: string
      name: string
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
      currentImage?: string
      currentDocument?: string
    }) => (
      <div className="space-y-2">
        <label htmlFor={name} className="block text-sm font-medium text-deep-ocean">
          {label}
        </label>
        <div className="relative w-full">
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-gray/20 border-dashed rounded-lg hover:border-electric-blue/30 transition-colors bg-light-sky/30">
            <div className="space-y-1 text-center">
              <div className="flex text-sm text-slate-gray">
                <input
                  id={name}
                  name={name}
                  type="file"
                  onChange={onChange}
                  className="w-full text-sm text-slate-gray file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-electric-blue file:text-white hover:file:bg-btn-hover transition-all duration-200"
                  accept=".png,.jpg,.jpeg,.pdf"
                />
              </div>
              <p className="text-xs text-slate-gray">PNG, JPG, JPEG, or PDF up to 10MB</p>
            </div>
          </div>
          <p className="mt-1 text-xs text-slate-gray">PNG, JPG, JPEG, or PDF up to 10MB</p>
        </div>
        {currentImage && (
          <div className="mt-4">
            <div className="relative w-full h-48 bg-light-sky/50 rounded-lg overflow-hidden border border-slate-gray/20">
              <img src={currentImage || "/placeholder.svg"} alt={`${label} preview`} className="w-full h-full object-contain" />
            </div>
          </div>
        )}
        {currentDocument && (
          <div className="mt-2">
            <a
              href={currentDocument}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-electric-blue hover:text-btn-hover transition-colors"
            >
              <Paperclip className="mr-2 h-4 w-4" />
              View current document
            </a>
          </div>
        )}
      </div>
    ),
    [],
  )

  const handleEmployeeChange = (employee: Employee | null) => {
    setSelectedEmployee(employee)
    handleInputChange({
      target: { name: "assigned_to", value: employee?.id || "" },
    } as React.ChangeEvent<HTMLInputElement>)
  }

  const memoizedHandleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFileChange(e)
    },
    [handleFileChange],
  )

  const filteredEmployees =
    employeeQuery === ""
      ? employees
      : employees.filter((employee) => {
          const fullName = `${employee.first_name} ${employee.last_name}`.toLowerCase()
          return (
            fullName.includes(employeeQuery.toLowerCase()) ||
            employee.id.toLowerCase().includes(employeeQuery.toLowerCase())
          )
        })

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {ticketNumber && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-emerald-green/10 border-l-4 border-emerald-green rounded-r-lg p-4"
        >
          <p className="font-medium text-emerald-green flex items-center">
            <Check className="h-5 w-5 mr-2" /> Ticket Number: {ticketNumber}
          </p>
        </motion.div>
      )}

      <div className="space-y-2">
        <label className="block text-sm font-medium text-deep-ocean">Search Customer</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-gray/60" />
          </div>
          <input
            type="text"
            value={customerSearchTerm}
            onChange={(e) => handleCustomerSearchChange(e.target.value)}
            placeholder="Search by Phone # or Internet ID"
            className="w-full pl-10 pr-10 py-2.5 border border-slate-gray/20 rounded-lg bg-light-sky/30 text-deep-ocean placeholder-slate-gray/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {isSearching && <Loader2 className="h-5 w-5 text-electric-blue animate-spin" />}
            {!isSearching && customerFound === true && <Check className="h-5 w-5 text-emerald-green" />}
            {!isSearching && customerFound === false && <X className="h-5 w-5 text-coral-red" />}
          </div>
        </div>
      </div>

      {/* Customer Details */}
      {selectedCustomer && (
        <div className="bg-light-sky/50 p-4 rounded-lg border border-slate-gray/10 shadow-sm space-y-4">
          <h3 className="text-lg font-medium text-deep-ocean">Customer Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-gray">Customer Name</label>
              <div className="p-2.5 bg-white border border-slate-gray/20 rounded-md text-deep-ocean">
                {`${selectedCustomer.first_name} ${selectedCustomer.last_name}`}
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-gray">Internet ID</label>
              <div className="p-2.5 bg-white border border-slate-gray/20 rounded-md text-deep-ocean">
                {selectedCustomer.internet_id}
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-gray">Phone #</label>
              <div className="p-2.5 bg-white border border-slate-gray/20 rounded-md text-deep-ocean">
                {selectedCustomer.phone_1}
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-gray">Installation Address</label>
              <div className="p-2.5 bg-white border border-slate-gray/20 rounded-md text-deep-ocean">
                {selectedCustomer.installation_address}
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-gray">GPS Coordinates</label>
              <div className="p-2.5 bg-white border border-slate-gray/20 rounded-md text-deep-ocean">
                {selectedCustomer.gps_coordinates || "N/A"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complaint Details */}
      <div className="space-y-2">
        <label htmlFor="description" className="block text-sm font-medium text-deep-ocean">
          Complaint Details
        </label>
        <div className="relative">
          <div className="absolute top-3 left-3 flex items-start pointer-events-none">
            <MessageSquare className="h-5 w-5 text-slate-gray/60" />
          </div>
          <textarea
            id="description"
            name="description"
            value={formData.description || ""}
            onChange={handleInputChange}
            placeholder="Add details here..."
            className="w-full pl-10 pr-4 py-2.5 min-h-[120px] border border-slate-gray/20 rounded-lg bg-light-sky/30 text-deep-ocean placeholder-slate-gray/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200 resize-y"
            required
          />
        </div>
      </div>

      {/* Deadline and File Upload */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="response_due_date" className="block text-sm font-medium text-deep-ocean">
            Deadline
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-5 w-5 text-slate-gray/60" />
            </div>
            <input
              type="date"
              id="response_due_date"
              name="response_due_date"
              value={formData.response_due_date || ""}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-gray/20 rounded-lg bg-light-sky/30 text-deep-ocean placeholder-slate-gray/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        <FileUploadField
          label="Attachment"
          name="attachment"
          onChange={memoizedHandleFileChange}
          currentDocument={
            formData.attachment_path ? `/complaints/attachment/${formData.id}` : undefined
          }
        />
      </div>

      {/* Employee Combobox */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-deep-ocean">Assign To</label>
        <Combobox value={selectedEmployee} onChange={handleEmployeeChange}>
          <div className="relative">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-slate-gray/60" />
              </div>
              <Combobox.Input
                className="w-full pl-10 pr-10 py-2.5 border border-slate-gray/20 rounded-lg bg-light-sky/30 text-deep-ocean placeholder-slate-gray/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200"
                displayValue={(employee: Employee | null) =>
                  employee ? `${employee.first_name} ${employee.last_name} (${employee.id})` : ""
                }
                onChange={(event) => setEmployeeQuery(event.target.value)}
                placeholder="Search employee..."
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <ChevronDown className="h-5 w-5 text-slate-gray/60" />
              </div>
            </div>

            <Transition
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
              afterLeave={() => setEmployeeQuery("")}
            >
              <Combobox.Options className="absolute z-10 mt-2 w-full overflow-auto rounded-lg bg-white py-2 shadow-lg ring-1 ring-slate-gray/10 focus:outline-none max-h-60">
                {filteredEmployees?.length === 0 && employeeQuery !== "" ? (
                  <div className="px-4 py-3 text-sm text-slate-gray italic">No employees found</div>
                ) : (
                  filteredEmployees.map((employee) => (
                    <Combobox.Option
                      key={employee.id}
                      value={employee}
                      className={({ active }) =>
                        `relative cursor-pointer select-none py-3 px-4 ${
                          active ? "bg-electric-blue/10 text-electric-blue" : "text-deep-ocean"
                        }`
                      }
                    >
                      {({ selected, active }) => (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-light-sky flex items-center justify-center text-deep-ocean font-semibold mr-3">
                              {employee.first_name[0]}
                            </div>
                            <div>
                              <div className="font-medium">
                                {employee.first_name} {employee.last_name}
                              </div>
                              <div className={`text-sm ${active ? "text-electric-blue/70" : "text-slate-gray"}`}>
                                {employee.id}
                              </div>
                            </div>
                          </div>
                          {selected && <Check className={`h-4 w-4 ${active ? "text-electric-blue" : "text-deep-ocean"}`} />}
                        </div>
                      )}
                    </Combobox.Option>
                  ))
                )}
              </Combobox.Options>
            </Transition>
          </div>
        </Combobox>
      </div>

      {/* Remarks */}
      <div className="space-y-2">
        <label htmlFor="remarks" className="block text-sm font-medium text-deep-ocean">
          Remarks
        </label>
        <div className="relative">
          <div className="absolute top-3 left-3 flex items-start pointer-events-none">
            <MessageSquare className="h-5 w-5 text-slate-gray/60" />
          </div>
          <textarea
            id="remarks"
            name="remarks"
            value={formData.remarks || ""}
            onChange={handleInputChange}
            placeholder="Add any additional remarks here..."
            className="w-full pl-10 pr-4 py-2.5 min-h-[80px] border border-slate-gray/20 rounded-lg bg-light-sky/30 text-deep-ocean placeholder-slate-gray/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200 resize-y"
          />
        </div>
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-electric-blue hover:bg-electric-blue/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-electric-blue/50 transition-all duration-200"
        >
          {isEditing ? "Update Complaint" : "Create Complaint"}
        </button>
      </div>
    </form>
  )
}
