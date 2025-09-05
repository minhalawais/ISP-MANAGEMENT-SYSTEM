"use client"

import type React from "react"
import { useEffect, useState, Fragment, useCallback } from "react"
import { Combobox, Transition } from "@headlessui/react"
import { FaSearch, FaCheck, FaPaperclip, FaCalendarAlt, FaUser, FaTimes, FaSpinner } from "react-icons/fa"
import axiosInstance from "../../../utils/axiosConfig.ts"
import { getToken } from "../../../utils/auth.ts"
import { motion } from "framer-motion"

interface ComplaintFormProps {
  formData: any
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSubmit: (e: React.FormEvent) => void
  isEditing: boolean
  handleCustomerSearch: (searchTerm: string) => Promise<any>
  ticketNumber: string | null
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
        <label htmlFor={name} className="block text-sm font-medium text-[#89A8B2]">
          {label}
        </label>
        <div className="relative w-full">
          <div className="relative w-full p-3 pl-10 border border-[#B3C8CF] rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-[#89A8B2] focus-within:border-transparent transition-all duration-200 bg-white">
            <FaPaperclip className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#B3C8CF]" />
            <input
              id={name}
              name={name}
              type="file"
              onChange={onChange}
              className="w-full text-sm text-[#89A8B2] file:mr-4 file:py-2 file:px-4 
                       file:rounded-md file:border-0 file:text-sm file:font-medium 
                       file:bg-[#E5E1DA] file:text-[#89A8B2] hover:file:bg-[#D1CEC7]
                       focus:outline-none"
              accept=".png,.jpg,.jpeg,.pdf"
            />
          </div>
          <p className="mt-1 text-xs text-[#B3C8CF]">PNG, JPG, JPEG, or PDF up to 10MB</p>
        </div>
        {currentImage && (
          <div className="mt-4">
            <div className="relative w-full h-48 bg-[#E5E1DA] rounded-lg overflow-hidden">
              <img
                src={currentImage}
                alt={`${label} preview`}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        )}
        {currentDocument && (
          <div className="mt-2">
            <a
              href={currentDocument}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-[#89A8B2] hover:text-[#7A97A1] transition-colors"
            >
              <FaPaperclip className="mr-2" />
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
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-[#89A8B2] mb-6">New Complaint</h2>
      {ticketNumber && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded"
        >
          <p className="font-bold">Ticket Number: {ticketNumber}</p>
        </motion.div>
      )}
      <div className="space-y-6">
        {/* Customer Search */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#89A8B2]">Search Customer</label>
          <div className="relative">
            <input
              type="text"
              value={customerSearchTerm}
              onChange={(e) => handleCustomerSearchChange(e.target.value)}
              placeholder="Search by Phone # or Internet ID"
              className="w-full p-3 pl-10 pr-10 border border-[#B3C8CF] rounded-lg shadow-sm focus:ring-2 focus:ring-[#89A8B2] focus:border-transparent transition-all duration-200 bg-white"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#B3C8CF]" />
            {isSearching && (
              <FaSpinner className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#89A8B2] animate-spin" />
            )}
            {!isSearching && customerFound === true && (
              <FaCheck className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500" />
            )}
            {!isSearching && customerFound === false && (
              <FaTimes className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500" />
            )}
          </div>
        </div>

        {/* Customer Details */}
        {selectedCustomer && (
          <div className="bg-[#E5E1DA] p-4 rounded-lg space-y-4">
            <h3 className="text-lg font-semibold text-[#89A8B2]">Customer Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-[#89A8B2]">Customer Name</label>
                <input
                  type="text"
                  value={`${selectedCustomer.first_name} ${selectedCustomer.last_name}`}
                  readOnly
                  className="w-full p-2 bg-white border border-[#B3C8CF] rounded-md shadow-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-[#89A8B2]">Internet ID</label>
                <input
                  type="text"
                  value={selectedCustomer.internet_id}
                  readOnly
                  className="w-full p-2 bg-white border border-[#B3C8CF] rounded-md shadow-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-[#89A8B2]">Phone #</label>
                <input
                  type="text"
                  value={selectedCustomer.phone_1}
                  readOnly
                  className="w-full p-2 bg-white border border-[#B3C8CF] rounded-md shadow-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-[#89A8B2]">Installation Address</label>
                <input
                  type="text"
                  value={selectedCustomer.installation_address}
                  readOnly
                  className="w-full p-2 bg-white border border-[#B3C8CF] rounded-md shadow-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-[#89A8B2]">GPS Coordinates</label>
                <input
                  type="text"
                  value={selectedCustomer.gps_coordinates || "N/A"}
                  readOnly
                  className="w-full p-2 bg-white border border-[#B3C8CF] rounded-md shadow-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* Complaint Details */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#89A8B2]">Complaint Details</label>
          <textarea
            name="description"
            value={formData.description || ""}
            onChange={handleInputChange}
            placeholder="Add details here..."
            className="w-full p-3 min-h-[120px] border border-[#B3C8CF] rounded-lg shadow-sm focus:ring-2 focus:ring-[#89A8B2] focus:border-transparent transition-all duration-200 bg-white resize-y"
            required
          />
        </div>

        {/* Deadline and File Upload */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#89A8B2]">Deadline</label>
            <div className="relative">
              <input
                type="date"
                name="response_due_date"
                value={formData.response_due_date || ""}
                onChange={handleInputChange}
                className="w-full p-3 pl-10 border border-[#B3C8CF] rounded-lg shadow-sm focus:ring-2 focus:ring-[#89A8B2] focus:border-transparent transition-all duration-200 bg-white"
              />
              <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#B3C8CF]" />
            </div>
          </div>

          <FileUploadField
            label="Attachment"
            name="attachment"
            onChange={memoizedHandleFileChange}
            currentDocument={
              formData.agreement_document
                ? `/customers/agreement-document/${formData.id}`
                : undefined
            }
          />
        </div>

        {/* Employee Combobox */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#89A8B2]">Assign To</label>
          <Combobox value={selectedEmployee} onChange={handleEmployeeChange}>
            <div className="relative">
              <div className="relative">
                <Combobox.Input
                  className="w-full p-3 pl-10 border border-[#B3C8CF] rounded-lg shadow-sm bg-white text-[#89A8B2] placeholder-[#B3C8CF] focus:ring-2 focus:ring-[#89A8B2] focus:border-transparent transition-all duration-200"
                  displayValue={(employee: Employee | null) =>
                    employee ? `${employee.first_name} ${employee.last_name} (${employee.id})` : ""
                  }
                  onChange={(event) => setEmployeeQuery(event.target.value)}
                  placeholder="Search employee..."
                />
                <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#B3C8CF]" />
                <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#B3C8CF]">
                  <FaSearch className="h-4 w-4" aria-hidden="true" />
                  </Combobox.Button>
              </div>

              <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
                afterLeave={() => setEmployeeQuery("")}
              >
                <Combobox.Options className="absolute z-10 mt-2 w-full overflow-auto rounded-lg bg-white py-2 shadow-lg ring-1 ring-[#B3C8CF] ring-opacity-5 focus:outline-none max-h-60">
                  {filteredEmployees?.length === 0 && employeeQuery !== "" ? (
                    <div className="px-4 py-3 text-sm text-[#89A8B2] italic">No employees found</div>
                  ) : (
                    filteredEmployees.map((employee) => (
                      <Combobox.Option
                        key={employee.id}
                        value={employee}
                        className={({ active }) =>
                          `relative cursor-pointer select-none py-3 px-4 ${
                            active ? "bg-[#89A8B2] text-white" : "text-[#89A8B2]"
                          }`
                        }
                      >
                        {({ selected, active }) => (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-[#E5E1DA] flex items-center justify-center text-[#89A8B2] font-semibold mr-3">
                                {employee.first_name[0]}
                              </div>
                              <div>
                                <div className="font-medium">
                                  {employee.first_name} {employee.last_name}
                                </div>
                                <div className={`text-sm ${active ? "text-[#E5E1DA]" : "text-[#B3C8CF]"}`}>
                                  {employee.id}
                                </div>
                              </div>
                            </div>
                            {selected && <FaCheck className={`h-4 w-4 ${active ? "text-white" : "text-[#89A8B2]"}`} />}
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
          <label className="block text-sm font-medium text-[#89A8B2]">Remarks</label>
          <textarea
            name="remarks"
            value={formData.remarks || ""}
            onChange={handleInputChange}
            placeholder="Add any additional remarks here..."
            className="w-full p-3 min-h-[80px] border border-[#B3C8CF] rounded-lg shadow-sm focus:ring-2 focus:ring-[#89A8B2] focus:border-transparent transition-all duration-200 bg-white resize-y"
          />
        </div>

        {/* Submit Button */}
        <div className="mt-6">
          <button
            type="submit"
            className="w-full bg-[#89A8B2] text-white px-4 py-2 rounded-lg hover:bg-[#7A97A1] transition duration-300"
          >
            {isEditing ? "Update Complaint" : "Submit Complaint"}
          </button>
        </div>
      </div>
    </form>
  )
}