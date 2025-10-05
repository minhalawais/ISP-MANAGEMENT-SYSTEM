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
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false)
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
    if (!formData.invoice_type) {
      handleInputChange({
        target: {
          name: "invoice_type",
          value: 'subscription',
        },
      } as React.ChangeEvent<HTMLInputElement>)
    }
    fetchCustomers()
  }, [])

  useEffect(() => {
    // When formData changes (like when editing), update customer selection
    if (formData.customer_id && customers.length > 0) {
      const selectedCustomer = customers.find(c => c.id === formData.customer_id)
      if (selectedCustomer) {
        updatePrices(selectedCustomer)
      }
    }
  }, [formData.customer_id, customers])

  const fetchCustomers = async () => {
    try {
      setIsLoadingCustomers(true)
      const token = getToken()
      const response = await axiosInstance.get("/customers/list", {
        headers: { Authorization: `Bearer ${token}` },
      })
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
    } finally {
      setIsLoadingCustomers(false)
    }
  }

  const updatePrices = (customer: Customer) => {
    const subtotal = customer.servicePlanPrice
    const discountAmount = customer.discountAmount
    const discountPercentage = discountAmount > 0 ? 
      (discountAmount / subtotal) * 100 : 0
    const totalAmount = subtotal - discountAmount

    // Update form data
    handleInputChange({
      target: { name: "subtotal", value: subtotal.toString() }
    } as React.ChangeEvent<HTMLInputElement>)
    
    handleInputChange({
      target: { name: "discount_amount", value: discountAmount.toString() }
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

  // Add this function to handle customer selection from SearchableCustomerSelect
  const handleCustomerSelect = (customerId: string) => {
    handleInputChange({
      target: {
        name: "customer_id",
        value: customerId,
      },
    } as React.ChangeEvent<HTMLSelectElement>)
    
    // Update prices when customer changes
    const selectedCustomer = customers.find(c => c.id === customerId)
    if (selectedCustomer) {
      updatePrices(selectedCustomer)
    }
  }

  const validateAmount = (value: number, fieldName: string): boolean => {
    if (value < 0) {
      alert(`${fieldName} cannot be less than 0`)
      return false
    }
    return true
  }

  const handleSubtotalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    
    // Allow empty value for better UX
    if (value === "") {
      handleInputChange(e)
      // Also reset dependent fields
      handleInputChange({
        target: { name: "total_amount", value: "" }
      } as React.ChangeEvent<HTMLInputElement>)
      return
    }
    
    const subtotal = parseFloat(value) || 0
    const discountAmount = parseFloat(formData.discount_amount) || 0
    
    // Validate subtotal
    if (!validateAmount(subtotal, "Subtotal")) return
    
    // Calculate total amount
    const totalAmount = subtotal - discountAmount
    
    // If discount is greater than new subtotal, adjust discount
    let adjustedDiscountAmount = discountAmount
    let adjustedTotalAmount = totalAmount
    
    if (discountAmount > subtotal) {
      adjustedDiscountAmount = subtotal
      adjustedTotalAmount = 0
    }
    
    const discountPercentage = subtotal > 0 ? (adjustedDiscountAmount / subtotal) * 100 : 0

    // Update subtotal
    handleInputChange(e)
    
    // Update discount amount if it was adjusted
    if (adjustedDiscountAmount !== discountAmount) {
      handleInputChange({
        target: { 
          name: "discount_amount", 
          value: adjustedDiscountAmount.toFixed(2) 
        }
      } as React.ChangeEvent<HTMLInputElement>)
    }
    
    // Update discount percentage and total amount
    handleInputChange({
      target: { 
        name: "discount_percentage", 
        value: discountPercentage.toFixed(2) 
      }
    } as React.ChangeEvent<HTMLInputElement>)
    
    handleInputChange({
      target: { 
        name: "total_amount", 
        value: adjustedTotalAmount === 0 ? "0.00" : adjustedTotalAmount.toFixed(2) 
      }
    } as React.ChangeEvent<HTMLInputElement>)
  }

  const handleDiscountAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
  
    // Allow empty for typing
    if (value === "") {
      handleInputChange(e);
      return;
    }
  
    const discountAmount = parseFloat(value);
    if (isNaN(discountAmount)) {
      handleInputChange(e);
      return;
    }
  
    const subtotal = parseFloat(formData.subtotal) || 0;
  
    // Validate but don't format yet
    if (discountAmount < 0) {
      alert("Discount amount cannot be less than 0");
      return;
    }
  
    // Cap at subtotal
    const adjustedDiscountAmount = Math.min(discountAmount, subtotal);
    const discountPercentage = subtotal > 0 ? (adjustedDiscountAmount / subtotal) * 100 : 0;
    const totalAmount = subtotal - adjustedDiscountAmount;
  
    // Update values (leave raw user input here!)
    handleInputChange({
      target: { name: "discount_amount", value } as any,
    });
  
    handleInputChange({
      target: { name: "discount_percentage", value: discountPercentage.toString() } as any,
    });
  
    handleInputChange({
      target: { name: "total_amount", value: totalAmount.toString() } as any,
    });
  };
  const handleDiscountBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") return;
  
    const formatted = parseFloat(value).toFixed(2);
    handleInputChange({
      target: { name: "discount_amount", value: formatted } as any,
    });
  };
  

  const handleInputChangeWithValidation = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    // For number fields, validate immediately
    if (name === 'subtotal' || name === 'discount_amount') {
      // Allow empty values
      if (value === "") {
        handleInputChange(e)
        return
      }
      
      const numValue = parseFloat(value) || 0
      if (numValue < 0) {
        alert(`${name.replace('_', ' ')} cannot be less than 0`)
        return
      }
    }
    
    handleInputChange(e)
  }

  return (
     <div className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="customer_id" className="block text-sm font-medium text-deep-ocean">
          Customer
        </label>
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
            onChange={handleCustomerChange}
            onCustomerSelect={handleCustomerSelect}
            placeholder="Search and select customer"
          />
        )}
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
              <span className="text-slate-gray/60 font-medium">PKR</span>
            </div>
            <input
              type="number"
              id="subtotal"
              name="subtotal"
              value={formData.subtotal || ""}
              onChange={handleSubtotalChange}
              placeholder="Enter subtotal amount"
              step="0.01"
              min="0"
              className="w-full pl-10 pr-4 py-2.5 border border-slate-gray/20 rounded-lg bg-light-sky/30 text-deep-ocean placeholder-slate-gray/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="discount_amount" className="block text-sm font-medium text-deep-ocean">
            Discount Amount
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-slate-gray/60 font-medium">PKR</span>
            </div>
            <input
  type="number"
  id="discount_amount"
  name="discount_amount"
  value={formData.discount_amount || ""}
  onChange={handleDiscountAmountChange}
  onBlur={handleDiscountBlur}
  placeholder="Enter discount amount"
  step="0.01"
  min="0"
  className="w-full pl-10 pr-4 py-2.5 border border-slate-gray/20 rounded-lg bg-light-sky/30 text-deep-ocean placeholder-slate-gray/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200"
/>

          </div>
          {formData.subtotal && (
            <p className="text-xs text-slate-gray/70">
              Max: ${parseFloat(formData.subtotal).toFixed(2)}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="total_amount" className="block text-sm font-medium text-deep-ocean">
            Total Amount
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-slate-gray/60 font-medium">PKR</span>
            </div>
            <input
              type="number"
              id="total_amount"
              name="total_amount"
              value={formData.total_amount || ""}
              readOnly
              placeholder="Calculated automatically"
              step="0.01"
              className="w-full pl-10 pr-4 py-2.5 border border-slate-gray/20 rounded-lg bg-slate-gray/10 text-deep-ocean placeholder-slate-gray/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200 cursor-not-allowed"
              required
            />
          </div>
          <p className="text-xs text-slate-gray/70">
            Calculated automatically (Subtotal - Discount)
          </p>
        </div>
      </div>

      {/* Hidden discount percentage field to maintain backward compatibility */}
      <input
        type="hidden"
        name="discount_percentage"
        value={formData.discount_percentage || ""}
      />

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
            onChange={handleInputChangeWithValidation}
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
            onChange={handleInputChangeWithValidation}
            placeholder="Enter additional notes"
            rows={3}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-gray/20 rounded-lg bg-light-sky/30 text-deep-ocean placeholder-slate-gray/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200 resize-y"
          />
        </div>
      </div>
    </div>
  )
}