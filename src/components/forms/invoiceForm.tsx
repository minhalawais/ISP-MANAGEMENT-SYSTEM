"use client"

import React, { useEffect, useState } from "react"
import { getToken } from "../../utils/auth.ts"
import axiosInstance from "../../utils/axiosConfig.ts"
import { Users, Calendar, DollarSign, Percent, FileText, MessageSquare, ChevronDown } from 'lucide-react'
import { SearchableCustomerSelect } from "../SearchableCustomerSelect.tsx"

interface InvoiceFormProps {
  formData: any
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  isEditing: boolean
}

interface Customer {
  id: string;
  name: string;
  internetId: string;
  servicePlanId: string;
  servicePlanPrice: number;
  discountAmount: number;
}

export function InvoiceForm({ formData, handleInputChange, isEditing }: InvoiceFormProps) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedMonth, setSelectedMonth] = useState<string>("")
  const [months] = useState([
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" }
  ])

  useEffect(() => {
    fetchCustomers()
  }, [])

  useEffect(() => {
    if (formData.customer_id && customers.length > 0) {
      const selectedCustomer = customers.find(c => c.id === formData.customer_id)
      if (selectedCustomer) {
        updatePrices(selectedCustomer)
      }
    }
  }, [formData.customer_id, customers])

  const fetchCustomers = async () => {
    try {
      const token = getToken()
      const response = await axiosInstance.get("/customers/list", {
        headers: { Authorization: `Bearer ${token}` },
      })
      console.log('Fetched customers:', response.data)
      setCustomers(
        response.data.map((customer: any) => ({
          id: customer.id,
          name: `${customer.first_name} ${customer.last_name}`,
          internetId: customer.internet_id,
          servicePlanId: customer.service_plan_id,
          servicePlanPrice: customer.servicePlanPrice || 0,
          discountAmount: customer.discount_amount || 0,
        })),
      )
    } catch (error) {
      console.error("Failed to fetch customers", error)
    }
  }

  const updatePrices = (customer: Customer) => {
    const subtotal = customer.servicePlanPrice
    const discountPercentage = customer.discountAmount > 0 ? 
      (customer.discountAmount / subtotal) * 100 : 0
    const totalAmount = subtotal - customer.discountAmount

    // Update form data
    handleInputChange({
      target: { name: "subtotal", value: subtotal.toString() }
    } as React.ChangeEvent<HTMLInputElement>)
    
    handleInputChange({
      target: { name: "discount_percentage", value: discountPercentage.toString() }
    } as React.ChangeEvent<HTMLInputElement>)
    
    handleInputChange({
      target: { name: "total_amount", value: totalAmount.toString() }
    } as React.ChangeEvent<HTMLInputElement>)
  }

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const month = e.target.value
    setSelectedMonth(month)
    
    if (month) {
      const year = new Date().getFullYear()
      const startDate = new Date(year, parseInt(month) - 1, 1)
      const endDate = new Date(year, parseInt(month), 0) // Last day of the month
      const dueDate = new Date(endDate)
      dueDate.setDate(dueDate.getDate() + 5) // 5 days after end date

      // Update dates in form data
      handleInputChange({
        target: { name: "billing_start_date", value: startDate.toISOString().split('T')[0] }
      } as React.ChangeEvent<HTMLInputElement>)
      
      handleInputChange({
        target: { name: "billing_end_date", value: endDate.toISOString().split('T')[0] }
      } as React.ChangeEvent<HTMLInputElement>)
      
      handleInputChange({
        target: { name: "due_date", value: dueDate.toISOString().split('T')[0] }
      } as React.ChangeEvent<HTMLInputElement>)
    }
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    handleInputChange({
      target: { name, value },
    } as React.ChangeEvent<HTMLInputElement>)

    // If end date is changed, update due date to 5 days later
    if (name === "billing_end_date" && value) {
      const endDate = new Date(value)
      const dueDate = new Date(endDate)
      dueDate.setDate(dueDate.getDate() + 5)
      
      handleInputChange({
        target: { 
          name: "due_date", 
          value: dueDate.toISOString().split('T')[0] 
        },
      } as React.ChangeEvent<HTMLInputElement>)
    }
  }

  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    handleInputChange(e)
    
    // Update prices when customer changes
    const customerId = e.target.value
    const selectedCustomer = customers.find(c => c.id === customerId)
    if (selectedCustomer) {
      updatePrices(selectedCustomer)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="customer_id" className="block text-sm font-medium text-deep-ocean">
          Customer
        </label>
        <SearchableCustomerSelect
          customers={customers}
          value={formData.customer_id || ""}
          onChange={handleCustomerChange}
          placeholder="Search and select customer"
        />
      </div>

      {/* Month Selection */}
      <div className="space-y-2">
        <label htmlFor="month" className="block text-sm font-medium text-deep-ocean">
          Select Month (Optional)
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Calendar className="h-5 w-5 text-slate-gray/60" />
          </div>
          <select
            id="month"
            name="month"
            value={selectedMonth}
            onChange={handleMonthChange}
            className="w-full pl-10 pr-10 py-2.5 border border-slate-gray/20 rounded-lg bg-light-sky/30 text-deep-ocean placeholder-slate-gray/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200 appearance-none"
          >
            <option value="">Select Month</option>
            {months.map(month => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <ChevronDown className="h-5 w-5 text-slate-gray/60" />
          </div>
        </div>
        <p className="text-sm text-slate-gray/70">
          Selecting a month will automatically set billing dates and due date
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label htmlFor="billing_start_date" className="block text-sm font-medium text-deep-ocean">
            Billing Start Date
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-5 w-5 text-slate-gray/60" />
            </div>
            <input
              type="date"
              id="billing_start_date"
              name="billing_start_date"
              value={formData.billing_start_date || ""}
              onChange={handleDateChange}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-gray/20 rounded-lg bg-light-sky/30 text-deep-ocean placeholder-slate-gray/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="billing_end_date" className="block text-sm font-medium text-deep-ocean">
            Billing End Date
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-5 w-5 text-slate-gray/60" />
            </div>
            <input
              type="date"
              id="billing_end_date"
              name="billing_end_date"
              value={formData.billing_end_date || ""}
              onChange={handleDateChange}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-gray/20 rounded-lg bg-light-sky/30 text-deep-ocean placeholder-slate-gray/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="due_date" className="block text-sm font-medium text-deep-ocean">
            Due Date
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-5 w-5 text-slate-gray/60" />
            </div>
            <input
              type="date"
              id="due_date"
              name="due_date"
              value={formData.due_date || ""}
              onChange={handleDateChange}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-gray/20 rounded-lg bg-light-sky/30 text-deep-ocean placeholder-slate-gray/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label htmlFor="subtotal" className="block text-sm font-medium text-deep-ocean">
            Subtotal
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DollarSign className="h-5 w-5 text-slate-gray/60" />
            </div>
            <input
              type="number"
              id="subtotal"
              name="subtotal"
              value={formData.subtotal || ""}
              onChange={handleInputChange}
              placeholder="Enter subtotal amount"
              step="0.01"
              min="0"
              className="w-full pl-10 pr-4 py-2.5 border border-slate-gray/20 rounded-lg bg-light-sky/30 text-deep-ocean placeholder-slate-gray/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="discount_percentage" className="block text-sm font-medium text-deep-ocean">
            Discount Percentage
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Percent className="h-5 w-5 text-slate-gray/60" />
            </div>
            <input
              type="number"
              id="discount_percentage"
              name="discount_percentage"
              value={formData.discount_percentage || ""}
              onChange={handleInputChange}
              placeholder="Enter discount percentage"
              step="0.01"
              min="0"
              max="100"
              className="w-full pl-10 pr-4 py-2.5 border border-slate-gray/20 rounded-lg bg-light-sky/30 text-deep-ocean placeholder-slate-gray/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="total_amount" className="block text-sm font-medium text-deep-ocean">
            Total Amount
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DollarSign className="h-5 w-5 text-slate-gray/60" />
            </div>
            <input
              type="number"
              id="total_amount"
              name="total_amount"
              value={formData.total_amount || ""}
              onChange={handleInputChange}
              placeholder="Enter total amount"
              step="0.01"
              min="0"
              className="w-full pl-10 pr-4 py-2.5 border border-slate-gray/20 rounded-lg bg-light-sky/30 text-deep-ocean placeholder-slate-gray/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="invoice_type" className="block text-sm font-medium text-deep-ocean">
          Invoice Type
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FileText className="h-5 w-5 text-slate-gray/60" />
          </div>
          <select
            id="invoice_type"
            name="invoice_type"
            value={formData.invoice_type || ""}
            onChange={handleInputChange}
            className="w-full pl-10 pr-10 py-2.5 border border-slate-gray/20 rounded-lg bg-light-sky/30 text-deep-ocean placeholder-slate-gray/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200 appearance-none"
            required
          >
            <option value="subscription">Subscription</option>
            <option value="installation">Installation</option>
            <option value="equipment">Equipment</option>
            <option value="add_on">Add-on</option>
            <option value="refund">Refund</option>
            <option value="deposit">Deposit</option>
            <option value="maintenance">Maintenance</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <ChevronDown className="h-5 w-5 text-slate-gray/60" />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="notes" className="block text-sm font-medium text-deep-ocean">
          Notes
        </label>
        <div className="relative">
          <div className="absolute top-3 left-3 flex items-start pointer-events-none">
            <MessageSquare className="h-5 w-5 text-slate-gray/60" />
          </div>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes || ""}
            onChange={handleInputChange}
            placeholder="Enter additional notes"
            rows={3}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-gray/20 rounded-lg bg-light-sky/30 text-deep-ocean placeholder-slate-gray/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200 resize-y"
          />
        </div>
      </div>
    </div>
  )
}