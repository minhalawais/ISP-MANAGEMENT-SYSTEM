"use client"

import type React from "react"
import { useEffect, useState, Fragment, useCallback } from "react"
import { Combobox, Transition } from "@headlessui/react"
import { Search, Check, Paperclip, Calendar, User, X, Loader2, MessageSquare, ChevronDown, MapPin, Phone, Globe } from 'lucide-react'
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

      {/* Search Customer Section */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-deep-ocean">
          Search User by Phone # or Internet ID
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-gray/60" />
          </div>
          <input
            type="text"
            value={customerSearchTerm}
            onChange={(e) => handleCustomerSearchChange(e.target.value)}
            placeholder="Enter Phone # or Internet ID..."
            className="w-full pl-10 pr-10 py-2.5 border border-slate-gray/20 rounded-lg bg-light-sky/30 text-deep-ocean placeholder-slate-gray/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {isSearching && <Loader2 className="h-5 w-5 text-electric-blue animate-spin" />}
            {!isSearching && customerFound === true && <Check className="h-5 w-5 text-emerald-green" />}
            {!isSearching && customerFound === false && <X className="h-5 w-5 text-coral-red" />}
          </div>
        </div>
        <p className="text-xs text-slate-gray">When the user searches, the form below will auto-fill</p>
      </div>

      {/* Customer Details Table - Matching the image layout */}
      {selectedCustomer && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-slate-gray/30 rounded-lg overflow-hidden"
        >
          <table className="w-full border-collapse">
            <tbody>
              {/* Row 1: User Name | Internet ID */}
              <tr className="border-b border-slate-gray/20">
                <td className="px-4 py-3 bg-slate-50 font-medium text-sm text-deep-ocean border-r border-slate-gray/20 w-1/4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-gray" />
                    User Name
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-deep-ocean border-r border-slate-gray/20 w-1/4 bg-white">
                  {`${selectedCustomer.first_name} ${selectedCustomer.last_name}`}
                </td>
                <td className="px-4 py-3 bg-slate-50 font-medium text-sm text-deep-ocean border-r border-slate-gray/20 w-1/4">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-slate-gray" />
                    Internet ID
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-deep-ocean w-1/4 bg-white">
                  {selectedCustomer.internet_id}
                </td>
              </tr>
              
              {/* Row 2: Phone # | Installation Address */}
              <tr className="border-b border-slate-gray/20">
                <td className="px-4 py-3 bg-slate-50 font-medium text-sm text-deep-ocean border-r border-slate-gray/20">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-gray" />
                    Phone #
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-deep-ocean border-r border-slate-gray/20 bg-white">
                  {selectedCustomer.phone_1}
                </td>
                <td className="px-4 py-3 bg-slate-50 font-medium text-sm text-deep-ocean border-r border-slate-gray/20">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-gray" />
                    Installation Address
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-deep-ocean bg-white">
                  {selectedCustomer.installation_address}
                </td>
              </tr>
              
              {/* Row 3: GPS Coordinates (full width) */}
              <tr>
                <td className="px-4 py-3 bg-slate-50 font-medium text-sm text-deep-ocean border-r border-slate-gray/20">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-gray" />
                    GPS Coordinates
                  </div>
                </td>
                <td colSpan={3} className="px-4 py-3 text-sm text-deep-ocean bg-white">
                  {selectedCustomer.gps_coordinates || "N/A"}
                </td>
              </tr>
            </tbody>
          </table>
        </motion.div>
      )}

      {/* Complaint Details */}
      <div className="space-y-2">
        <label htmlFor="description" className="block text-sm font-medium text-deep-ocean">
          Complaint Details
        </label>
        <div className="relative">
          <textarea
            id="description"
            name="description"
            value={formData.description || ""}
            onChange={handleInputChange}
            placeholder="Add details here...."
            className="w-full px-4 py-3 min-h-[120px] border border-slate-gray/20 rounded-lg bg-white text-deep-ocean placeholder-slate-gray/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200 resize-y"
            required
          />
        </div>
      </div>

      {/* Attachment Section */}
      <div className="space-y-2">
        <label htmlFor="attachment" className="block text-sm font-medium text-deep-ocean">
          ATTACHMENT (IF ANY)
        </label>
        <div className="border-2 border-dashed border-slate-gray/30 rounded-lg p-6 bg-white hover:border-electric-blue/50 transition-colors">
          <div className="flex flex-col items-center justify-center">
            <Paperclip className="h-8 w-8 text-slate-gray/50 mb-2" />
            <input
              id="attachment"
              name="attachment"
              type="file"
              onChange={memoizedHandleFileChange}
              className="w-full text-sm text-slate-gray file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-electric-blue file:text-white hover:file:bg-btn-hover transition-all duration-200"
              accept=".png,.jpg,.jpeg,.pdf"
            />
            <p className="mt-2 text-xs text-slate-gray">PNG, JPG, JPEG, or PDF up to 10MB</p>
          </div>
        </div>
        {formData.attachment_path && (
          <div className="mt-2">
            <a
              href={`/complaints/attachment/${formData.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-electric-blue hover:text-btn-hover transition-colors"
            >
              <Paperclip className="mr-2 h-4 w-4" />
              View current attachment
            </a>
          </div>
        )}
      </div>

      {/* Assign To Employee Dropdown */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-deep-ocean">Assign To</label>
        <p className="text-xs text-slate-gray mb-1">Drop Down (Show all employee's name here)</p>
        <Combobox value={selectedEmployee} onChange={handleEmployeeChange}>
          <div className="relative">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-slate-gray/60" />
              </div>
              <Combobox.Input
                className="w-full pl-10 pr-10 py-2.5 border border-slate-gray/20 rounded-lg bg-white text-deep-ocean placeholder-slate-gray/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200"
                displayValue={(employee: Employee | null) =>
                  employee ? `${employee.first_name} ${employee.last_name}` : ""
                }
                onChange={(event) => setEmployeeQuery(event.target.value)}
                placeholder="Select an employee..."
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

      {/* Submit Button */}
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          className="inline-flex items-center px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-electric-blue hover:bg-electric-blue/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-electric-blue/50 transition-all duration-200"
        >
          {isEditing ? "Update Complaint" : "Create Complaint"}
        </button>
      </div>
    </form>
  )
}
