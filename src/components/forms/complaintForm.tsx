"use client"

import type React from "react"
import { useEffect, useState, Fragment, useCallback } from "react"
import { Combobox, Transition } from "@headlessui/react"
import { Search, Check, Paperclip, User, X, Loader2, ChevronDown, MapPin, Phone, Globe } from "lucide-react"
import axiosInstance from "../../utils/axiosConfig.ts"
import { getToken } from "../../utils/auth.ts"
import { motion } from "framer-motion"
import { ComplaintFilePreview } from "../complaint/ComplaintFilePreview.tsx"

interface ComplaintFormProps {
  formData: any
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  handleFileChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSubmit?: (e: React.FormEvent) => void
  isEditing: boolean
  handleCustomerSearch?: (searchTerm: string) => Promise<any>
  ticketNumber?: string | null
  hideSubmitButton?: boolean
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

function CustomerField({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value?: string | null
}) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 text-xs text-slate-gray">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        {label}
      </p>
      <p className="mt-0.5 break-words text-sm font-medium text-deep-ocean">{value?.trim() || "—"}</p>
    </div>
  )
}

export function ComplaintForm({
  formData,
  handleInputChange,
  handleFileChange,
  handleSubmit,
  isEditing,
  handleCustomerSearch,
  ticketNumber,
  hideSubmitButton = false,
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

  useEffect(() => {
    if (!formData?.customer_id && !formData?.customer_name && !formData?.internet_id) return

    const fullName = String(formData.customer_name || "").trim()
    const [firstName, ...rest] = fullName.split(/\s+/)
    setSelectedCustomer({
      id: formData.customer_id || "",
      first_name: firstName || fullName || "—",
      last_name: rest.join(" "),
      internet_id: formData.internet_id || "",
      phone_1: formData.phone_number || formData.phone_1 || "",
      phone_2: formData.phone_2 || null,
      installation_address: formData.installation_address || "",
      gps_coordinates: formData.gps_coordinates || null,
    })
    setCustomerFound(true)
    setCustomerSearchTerm(formData.internet_id || formData.phone_number || "")
  }, [formData?.id])

  useEffect(() => {
    if (!employees.length) return
    const assignedId = formData?.assigned_to
    const assignedName = String(formData?.assigned_to_name || "").trim().toLowerCase()
    const match = employees.find((employee) => {
      if (assignedId && employee.id === assignedId) return true
      if (!assignedName) return false
      return `${employee.first_name} ${employee.last_name}`.toLowerCase() === assignedName
    })
    setSelectedEmployee(match || null)
  }, [employees, formData?.id, formData?.assigned_to, formData?.assigned_to_name])

  const handleCustomerSearchChange = async (value: string) => {
    const numericValue = value.replace(/\D/g, "")
    setCustomerSearchTerm(value)
    if (!handleCustomerSearch) return
    if (numericValue.length >= 3 || value.trim().length >= 3) {
      setIsSearching(true)
      setCustomerFound(null)
      const customer = await handleCustomerSearch(value.trim())
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

  const currentAttachmentName =
    formData?.attachment instanceof File
      ? formData.attachment.name
      : formData?.attachment_path
        ? String(formData.attachment_path).split(/[\\/]/).pop()
        : null

  const handleEmployeeChange = (employee: Employee | null) => {
    setSelectedEmployee(employee)
    handleInputChange({
      target: { name: "assigned_to", value: employee?.id || "" },
    } as React.ChangeEvent<HTMLInputElement>)
  }

  const memoizedHandleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFileChange?.(e)
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

  const fields = (
    <>
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
        <p className="text-xs text-slate-gray">Search fills the customer details below.</p>
      </div>

      {selectedCustomer && (
        <div className="rounded-lg border border-slate-gray/15 bg-light-sky/40 p-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <CustomerField
              icon={User}
              label="Customer"
              value={`${selectedCustomer.first_name} ${selectedCustomer.last_name}`.trim()}
            />
            <CustomerField icon={Globe} label="Internet ID" value={selectedCustomer.internet_id} />
            <CustomerField icon={Phone} label="Phone" value={selectedCustomer.phone_1} />
            <CustomerField icon={MapPin} label="Installation address" value={selectedCustomer.installation_address} />
            <div className="sm:col-span-2">
              <CustomerField icon={MapPin} label="GPS coordinates" value={selectedCustomer.gps_coordinates} />
            </div>
          </div>
        </div>
      )}

      {/* Complaint Details */}
      <div className="space-y-2">
        <label htmlFor="category" className="block text-sm font-medium text-deep-ocean">
          Category
        </label>
        <select
          id="category"
          name="category"
          value={formData.category || ""}
          onChange={handleInputChange}
          className="w-full h-10 px-3 text-sm border border-slate-gray/20 rounded-lg bg-white text-deep-ocean focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent"
          required
        >
          <option value="">Select a category</option>
          <option value="no_internet">No Internet / Connectivity</option>
          <option value="slow_speed">Slow Speed</option>
          <option value="billing">Billing / Invoice</option>
          <option value="installation">Installation / Relocation</option>
          <option value="hardware">Hardware / Equipment</option>
          <option value="other">Other</option>
        </select>
      </div>

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
        {currentAttachmentName && formData.id && formData.attachment_path && !(formData.attachment instanceof File) ? (
          <ComplaintFilePreview
            label={currentAttachmentName}
            filePath={String(formData.attachment_path)}
            fetchUrl={`/complaints/attachment/${formData.id}`}
            actionClassName="text-electric-blue"
          />
        ) : currentAttachmentName ? (
          <div className="mt-2 rounded-lg border border-electric-blue/20 bg-electric-blue/5 px-3 py-2.5">
            <p className="text-xs text-slate-gray">
              {formData.attachment instanceof File ? "New file selected" : "Current attachment"}
            </p>
            <p className="truncate text-sm font-medium text-deep-ocean">{currentAttachmentName}</p>
          </div>
        ) : null}
      </div>

      {/* Assign To Employee Dropdown */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-deep-ocean">Assign To</label>
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

      {!hideSubmitButton && handleSubmit && (
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            className="inline-flex items-center px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-electric-blue hover:bg-electric-blue/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-electric-blue/50 transition-all duration-200"
          >
            {isEditing ? "Update Complaint" : "Create Complaint"}
          </button>
        </div>
      )}
    </>
  )

  if (handleSubmit && !hideSubmitButton) {
    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        {fields}
      </form>
    )
  }

  return <div className="space-y-6">{fields}</div>
}
