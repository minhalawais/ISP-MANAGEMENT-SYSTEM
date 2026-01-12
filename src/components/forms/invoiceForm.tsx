"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { getToken } from "../../utils/auth.ts"
import axiosInstance from "../../utils/axiosConfig.ts"
import { Calendar, FileText, MessageSquare, ChevronDown } from "lucide-react"
import { SearchableCustomerSelect } from "../SearchableCustomerSelect.tsx"
import { SearchableInventorySelect } from "../SearchableInventorySelect.tsx"

interface InvoiceFormProps {
  formData: any
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  isEditing: boolean
}

interface Customer {
  id: string
  name: string
  internetId: string
  servicePlanPrice: number
  discountAmount: number
}

interface InventoryItem {
  id: string
  item_type: string
  quantity: number
  unit_price: number | null
  vendor_name?: string
}

interface SelectedEquipment {
  id: string
  item_type: string
  quantity: number
  unit_price: number
  available: number
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
    { value: "12", label: "December" },
  ])

  // Equipment invoice state
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [selectedEquipment, setSelectedEquipment] = useState<SelectedEquipment[]>([])
  const [isLoadingInventory, setIsLoadingInventory] = useState(false)

  // Get current invoice type
  const currentInvoiceType = formData.invoice_type || "subscription"

  useEffect(() => {
    if (!formData.invoice_type) {
      handleInputChange({
        target: {
          name: "invoice_type",
          value: "subscription",
        },
      } as React.ChangeEvent<HTMLInputElement>)
    }
    fetchCustomers()
  }, [])

  useEffect(() => {
    // When formData changes (like when editing), update customer selection
    if (formData.customer_id && customers.length > 0 && currentInvoiceType === "subscription") {
      const selectedCustomer = customers.find((c) => c.id === formData.customer_id)
      if (selectedCustomer) {
        updatePrices(selectedCustomer)
      }
    }
  }, [formData.customer_id, customers, currentInvoiceType])

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

  const fetchInventoryItems = async () => {
    try {
      setIsLoadingInventory(true)
      const token = getToken()
      const response = await axiosInstance.get("/inventory/list", {
        headers: { Authorization: `Bearer ${token}` },
      })
      setInventoryItems(response.data.filter((item: InventoryItem) => item.quantity > 0))
    } catch (error) {
      console.error("Failed to fetch inventory items", error)
    } finally {
      setIsLoadingInventory(false)
    }
  }

  const updatePrices = (customer: Customer) => {
    if (currentInvoiceType !== "subscription") return

    const subtotal = customer.servicePlanPrice
    const discountAmount = customer.discountAmount
    const discountPercentage = discountAmount > 0 ? (discountAmount / subtotal) * 100 : 0
    const totalAmount = subtotal - discountAmount

    // Update form data
    handleInputChange({
      target: { name: "subtotal", value: subtotal.toString() },
    } as React.ChangeEvent<HTMLInputElement>)

    handleInputChange({
      target: { name: "discount_amount", value: discountAmount.toString() },
    } as React.ChangeEvent<HTMLInputElement>)

    handleInputChange({
      target: { name: "discount_percentage", value: discountPercentage.toString() },
    } as React.ChangeEvent<HTMLInputElement>)

    handleInputChange({
      target: { name: "total_amount", value: totalAmount.toString() },
    } as React.ChangeEvent<HTMLInputElement>)
  }

  const handleInvoiceTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value

    handleInputChange(e)

    // Reset prices and dates when switching from subscription to other types
    if (currentInvoiceType === "subscription" && newType !== "subscription") {
      // Clear subscription-specific fields
      handleInputChange({
        target: { name: "subtotal", value: "" },
      } as React.ChangeEvent<HTMLInputElement>)

      handleInputChange({
        target: { name: "discount_amount", value: "0" },
      } as React.ChangeEvent<HTMLInputElement>)

      handleInputChange({
        target: { name: "discount_percentage", value: "0" },
      } as React.ChangeEvent<HTMLInputElement>)

      handleInputChange({
        target: { name: "total_amount", value: "" },
      } as React.ChangeEvent<HTMLInputElement>)

      // Clear date fields
      handleInputChange({
        target: { name: "billing_start_date", value: "" },
      } as React.ChangeEvent<HTMLInputElement>)

      handleInputChange({
        target: { name: "billing_end_date", value: "" },
      } as React.ChangeEvent<HTMLInputElement>)
    }

    // If switching to subscription and customer is selected, auto-fill prices
    if (newType === "subscription" && formData.customer_id) {
      const selectedCustomer = customers.find((c) => c.id === formData.customer_id)
      if (selectedCustomer) {
        updatePrices(selectedCustomer)
      }
    }

    // If switching to equipment, fetch inventory items
    if (newType === "equipment") {
      fetchInventoryItems()
      setSelectedEquipment([])
    }
  }

  // Equipment invoice handlers
  const handleAddEquipment = (itemId: string) => {
    const item = inventoryItems.find(i => i.id === itemId)
    if (!item) return

    const existing = selectedEquipment.find(e => e.id === itemId)
    if (existing) return // Already added

    // Use 0 as default if unit_price is null or undefined
    const price = item.unit_price ?? 0

    const newEquipment = [...selectedEquipment, {
      id: item.id,
      item_type: item.item_type,
      quantity: 1,
      unit_price: price,
      available: item.quantity
    }]
    setSelectedEquipment(newEquipment)
    updateEquipmentTotals(newEquipment)
  }

  const handleRemoveEquipment = (itemId: string) => {
    const newEquipment = selectedEquipment.filter(e => e.id !== itemId)
    setSelectedEquipment(newEquipment)
    updateEquipmentTotals(newEquipment)
  }

  const handleEquipmentQuantityChange = (itemId: string, quantity: number) => {
    const newEquipment = selectedEquipment.map(e => {
      if (e.id === itemId) {
        return { ...e, quantity: Math.min(quantity, e.available) }
      }
      return e
    })
    setSelectedEquipment(newEquipment)
    updateEquipmentTotals(newEquipment)
  }

  const updateEquipmentTotals = (equipment: SelectedEquipment[]) => {
    const subtotal = equipment.reduce((sum, e) => sum + (e.unit_price * e.quantity), 0)

    handleInputChange({
      target: { name: "subtotal", value: subtotal.toString() },
    } as React.ChangeEvent<HTMLInputElement>)

    handleInputChange({
      target: { name: "total_amount", value: subtotal.toString() },
    } as React.ChangeEvent<HTMLInputElement>)

    // Store inventory_items in formData for submission
    handleInputChange({
      target: { name: "inventory_items", value: JSON.stringify(equipment.map(e => ({ id: e.id, quantity: e.quantity }))) },
    } as React.ChangeEvent<HTMLInputElement>)
  }

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (currentInvoiceType !== "subscription") return

    const month = e.target.value
    setSelectedMonth(month)

    if (month) {
      const year = new Date().getFullYear()
      const monthNum = Number.parseInt(month)
      // Start date: 1st of selected month (month is 1-12, JS Date uses 0-11)
      const startDate = new Date(year, monthNum - 1, 1)
      // End date: Last day of selected month (day 0 of next month = last day of current month)
      const endDate = new Date(year, monthNum, 0)
      // Due date: 5 days after start date
      const dueDate = new Date(startDate)
      dueDate.setDate(dueDate.getDate() + 5)

      // Format dates as YYYY-MM-DD in local timezone (avoid toISOString which uses UTC)
      const formatDate = (date: Date) => {
        const y = date.getFullYear()
        const m = String(date.getMonth() + 1).padStart(2, '0')
        const d = String(date.getDate()).padStart(2, '0')
        return `${y}-${m}-${d}`
      }

      // Update dates in form data
      handleInputChange({
        target: { name: "billing_start_date", value: formatDate(startDate) },
      } as React.ChangeEvent<HTMLInputElement>)

      handleInputChange({
        target: { name: "billing_end_date", value: formatDate(endDate) },
      } as React.ChangeEvent<HTMLInputElement>)

      handleInputChange({
        target: { name: "due_date", value: formatDate(dueDate) },
      } as React.ChangeEvent<HTMLInputElement>)
    }
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    handleInputChange({
      target: { name, value },
    } as React.ChangeEvent<HTMLInputElement>)

    // If end date is changed, update due date to 5 days later (subscription only)
    if (name === "billing_end_date" && value && currentInvoiceType === "subscription") {
      const endDate = new Date(value)
      const dueDate = new Date(endDate)
      dueDate.setDate(dueDate.getDate() + 5)

      handleInputChange({
        target: {
          name: "due_date",
          value: dueDate.toISOString().split("T")[0],
        },
      } as React.ChangeEvent<HTMLInputElement>)
    }
  }

  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    handleInputChange(e)

    // Update prices when customer changes (subscription only)
    const customerId = e.target.value
    const selectedCustomer = customers.find((c) => c.id === customerId)
    if (selectedCustomer && currentInvoiceType === "subscription") {
      updatePrices(selectedCustomer)
    }
  }

  const handleCustomerSelect = (customerId: string) => {
    handleInputChange({
      target: {
        name: "customer_id",
        value: customerId,
      },
    } as React.ChangeEvent<HTMLSelectElement>)

    // Update prices when customer changes (subscription only)
    const selectedCustomer = customers.find((c) => c.id === customerId)
    if (selectedCustomer && currentInvoiceType === "subscription") {
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
        target: { name: "total_amount", value: "" },
      } as React.ChangeEvent<HTMLInputElement>)
      return
    }

    const subtotal = Number.parseFloat(value) || 0

    // Validate subtotal
    if (!validateAmount(subtotal, "Subtotal")) return

    // For subscription invoices, calculate with discount
    if (currentInvoiceType === "subscription") {
      const discountAmount = Number.parseFloat(formData.discount_amount) || 0
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
            value: adjustedDiscountAmount.toFixed(2),
          },
        } as React.ChangeEvent<HTMLInputElement>)
      }

      // Update discount percentage and total amount
      handleInputChange({
        target: {
          name: "discount_percentage",
          value: discountPercentage.toFixed(2),
        },
      } as React.ChangeEvent<HTMLInputElement>)

      handleInputChange({
        target: {
          name: "total_amount",
          value: adjustedTotalAmount === 0 ? "0.00" : adjustedTotalAmount.toFixed(2),
        },
      } as React.ChangeEvent<HTMLInputElement>)
    } else {
      // For non-subscription invoices, total = subtotal
      handleInputChange(e)
      handleInputChange({
        target: {
          name: "total_amount",
          value: subtotal.toFixed(2),
        },
      } as React.ChangeEvent<HTMLInputElement>)
    }
  }

  const handleDiscountAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentInvoiceType !== "subscription") return

    const value = e.target.value

    // Allow empty for typing
    if (value === "") {
      handleInputChange(e)
      return
    }

    const discountAmount = Number.parseFloat(value)
    if (isNaN(discountAmount)) {
      handleInputChange(e)
      return
    }

    const subtotal = Number.parseFloat(formData.subtotal) || 0

    // Validate but don't format yet
    if (discountAmount < 0) {
      alert("Discount amount cannot be less than 0")
      return
    }

    // Cap at subtotal
    const adjustedDiscountAmount = Math.min(discountAmount, subtotal)
    const discountPercentage = subtotal > 0 ? (adjustedDiscountAmount / subtotal) * 100 : 0
    const totalAmount = subtotal - adjustedDiscountAmount

    // Update values (leave raw user input here!)
    handleInputChange({
      target: { name: "discount_amount", value } as any,
    })

    handleInputChange({
      target: { name: "discount_percentage", value: discountPercentage.toString() } as any,
    })

    handleInputChange({
      target: { name: "total_amount", value: totalAmount.toString() } as any,
    })
  }

  const handleDiscountBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (currentInvoiceType !== "subscription") return

    const value = e.target.value
    if (value === "") return

    const formatted = Number.parseFloat(value).toFixed(2)
    handleInputChange({
      target: { name: "discount_amount", value: formatted } as any,
    })
  }

  const handleInputChangeWithValidation = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target

    // For number fields, validate immediately
    if (name === "subtotal" || name === "discount_amount") {
      // Allow empty values
      if (value === "") {
        handleInputChange(e)
        return
      }

      const numValue = Number.parseFloat(value) || 0
      if (numValue < 0) {
        alert(`${name.replace("_", " ")} cannot be less than 0`)
        return
      }
    }

    handleInputChange(e)
  }

  // Render different date fields based on invoice type
  const renderDateFields = () => {
    if (currentInvoiceType === "subscription") {
      return (
        <>
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
        </>
      )
    } else {
      return null
    }
  }

  // Render discount fields only for subscription invoices
  const renderDiscountFields = () => {
    if (currentInvoiceType !== "subscription") return null

    return (
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
          <p className="text-xs text-slate-gray/70">Max: ${Number.parseFloat(formData.subtotal).toFixed(2)}</p>
        )}
      </div>
    )
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

      {/* Month Selection - Only for subscription */}
      {currentInvoiceType === "subscription" && (
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
              {months.map((month) => (
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
      )}

      <div
        className={`grid gap-6 ${currentInvoiceType === "subscription" ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-1"}`}
      >
        {renderDateFields()}

        <div className="space-y-2">
          <label htmlFor="due_date" className="block text-sm font-medium text-deep-ocean">
            {currentInvoiceType === "subscription" ? "Due Date" : "Invoice Date"}
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

        {renderDiscountFields()}

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
            {currentInvoiceType === "subscription"
              ? "Calculated automatically (Subtotal - Discount)"
              : "Same as subtotal for non-subscription invoices"}
          </p>
        </div>
      </div>

      {/* Hidden discount percentage field to maintain backward compatibility */}
      <input type="hidden" name="discount_percentage" value={formData.discount_percentage || "0"} />

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
            value={currentInvoiceType}
            onChange={handleInvoiceTypeChange}
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

      {/* Equipment Selection - Only shown for equipment invoice type */}
      {currentInvoiceType === "equipment" && (
        <div className="space-y-4 p-4 bg-light-sky/20 rounded-lg border border-slate-gray/20">
          <h3 className="text-sm font-semibold text-deep-ocean">Select Equipment Items</h3>

          {/* Available Items Dropdown */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-gray">Add Item</label>
            <SearchableInventorySelect
              items={inventoryItems}
              excludeIds={selectedEquipment.map(e => e.id)}
              onItemSelect={handleAddEquipment}
              isLoading={isLoadingInventory}
              placeholder="Search and select equipment to add..."
            />
          </div>

          {/* Selected Items Table */}
          {selectedEquipment.length > 0 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-gray">Selected Items</label>
              <div className="bg-white rounded-lg border border-slate-gray/20 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-gray/10">
                    <tr>
                      <th className="px-3 py-2 text-left text-deep-ocean font-medium">Item</th>
                      <th className="px-3 py-2 text-center text-deep-ocean font-medium">Qty</th>
                      <th className="px-3 py-2 text-right text-deep-ocean font-medium">Price</th>
                      <th className="px-3 py-2 text-right text-deep-ocean font-medium">Total</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedEquipment.map(item => (
                      <tr key={item.id} className="border-t border-slate-gray/10">
                        <td className="px-3 py-2 text-deep-ocean">{item.item_type}</td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="1"
                            max={item.available}
                            value={item.quantity}
                            onChange={(e) => handleEquipmentQuantityChange(item.id, parseInt(e.target.value) || 1)}
                            className="w-16 px-2 py-1 text-center border border-slate-gray/20 rounded"
                          />
                        </td>
                        <td className="px-3 py-2 text-right text-slate-gray">
                          PKR {item.unit_price?.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-deep-ocean">
                          PKR {(item.unit_price * item.quantity).toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveEquipment(item.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-gray/5 border-t border-slate-gray/20">
                    <tr>
                      <td colSpan={3} className="px-3 py-2 text-right font-semibold text-deep-ocean">
                        Grand Total:
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-electric-blue">
                        PKR {selectedEquipment.reduce((sum, e) => sum + (e.unit_price * e.quantity), 0).toLocaleString()}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {selectedEquipment.length === 0 && !isLoadingInventory && (
            <p className="text-sm text-slate-gray/70 italic">No equipment selected. Use the dropdown above to add items.</p>
          )}
        </div>
      )}

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
