"use client"

import type React from "react"
import { Building, Calendar, FileText, User, CreditCard, Settings, Clock, Upload, Check, Image } from "lucide-react"
import { useState, useEffect } from "react"
import { getToken } from "../../utils/auth.ts"
import axiosInstance from "../../utils/axiosConfig.ts"

interface ExpenseFormProps {
  formData: any
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  handleFileChange?: (name: string, file: File | null) => void
  isEditing: boolean
  onManageExpenseTypes?: () => void
}

interface BankAccount {
  id: string
  bank_name: string
  account_title: string
  account_number: string
}

interface ExpenseType {
  id: string
  name: string
  description: string
  is_employee_payment: boolean
  is_active: boolean
}

interface Employee {
  id: string
  first_name: string
  last_name: string
  current_balance: number
}

// Helper functions for Pakistani timezone (PKT = UTC+5)
// Helper functions for Pakistani timezone (PKT = UTC+5)
const getPakistaniDate = () => {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
}

const getPakistaniTime = () => {
    return new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Karachi', hour: '2-digit', minute: '2-digit', hour12: false });
}

export function ExpenseForm({ formData, handleInputChange, handleFileChange, isEditing, onManageExpenseTypes }: ExpenseFormProps) {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null)

  const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'online', label: 'Online Payment' }
  ]

  // Check if selected expense type is for employee payments
  const selectedExpenseType = expenseTypes.find(t => t.id === formData.expense_type_id)
  
  // Employee payment detection: Check is_employee_payment flag OR name pattern (fallback for existing data)
  const employeePaymentPatterns = ['salary', 'salaries', 'commission', 'bonus', 'advance', 'payout', 'allowance']
  const isEmployeePaymentByName = selectedExpenseType?.name 
    ? employeePaymentPatterns.some(pattern => selectedExpenseType.name.toLowerCase().includes(pattern))
    : false
  const isEmployeePayment = selectedExpenseType?.is_employee_payment || isEmployeePaymentByName

  // Fetch bank accounts, expense types and employees on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = getToken()

        // Fetch bank accounts
        const bankResponse = await axiosInstance.get('/bank-accounts/list?active_only=true', {
          headers: { Authorization: `Bearer ${token}` },
        })
        setBankAccounts(bankResponse.data)

        // Fetch expense types
        const expenseTypesResponse = await axiosInstance.get('/expense-types/list', {
          headers: { Authorization: `Bearer ${token}` },
        })
        setExpenseTypes(expenseTypesResponse.data.filter((type: ExpenseType) => type.is_active))

        // Fetch employees for employee payments
        const employeesResponse = await axiosInstance.get('/employees/list', {
          headers: { Authorization: `Bearer ${token}` },
        })
        setEmployees(employeesResponse.data)
      } catch (error) {
        console.error('Failed to fetch data', error)
      }
    }

    fetchData()

    // Set default date and time for new expenses
    if (!isEditing) {
      if (!formData.expense_date) {
        handleInputChange({
          target: {
            name: "expense_date",
            value: getPakistaniDate(),
          },
        } as React.ChangeEvent<HTMLInputElement>)
      }

      if (!formData.expense_time) {
        handleInputChange({
          target: {
            name: "expense_time",
            value: getPakistaniTime(),
          },
        } as React.ChangeEvent<HTMLInputElement>)
      }
    }
  }, [isEditing])

  // Check if bank account field should be shown
  const showBankAccountField = formData.payment_method === 'online' || formData.payment_method === 'bank_transfer'

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="expense_type_id" className="block text-sm font-medium text-deep-ocean">
              Expense Type *
            </label>
            <button
              type="button"
              onClick={onManageExpenseTypes}
              className="text-xs text-electric-blue hover:text-btn-hover flex items-center gap-1"
            >
              <Settings className="h-3 w-3" />
              Manage Types
            </button>
          </div>
          <select
            id="expense_type_id"
            name="expense_type_id"
            value={formData.expense_type_id || ""}
            onChange={handleInputChange}
            className="w-full px-4 py-2.5 border border-slate-gray/20 rounded-lg bg-light-sky/30 text-deep-ocean focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200"
            required
          >
            <option value="">Select Expense Type</option>
            {expenseTypes.map(type => (
              <option key={type.id} value={type.id}>{type.name}{type.is_employee_payment ? ' 👤' : ''}</option>
            ))}
          </select>
        </div>

        {/* Employee Selection - shown only for employee payment types */}
        {isEmployeePayment && (
          <div className="space-y-2">
            <label htmlFor="employee_id" className="block text-sm font-medium text-deep-ocean">
              Select Employee *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-slate-gray/60" />
              </div>
              <select
                id="employee_id"
                name="employee_id"
                value={formData.employee_id || ""}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-gray/20 rounded-lg bg-light-sky/30 text-deep-ocean focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200"
                required={isEmployeePayment}
              >
                <option value="">Select Employee</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name} (Pending: PKR {emp.current_balance?.toLocaleString() || 0})
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-slate-gray/70 mt-1">
              This payment will be deducted from the employee's pending balance
            </p>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="amount" className="block text-sm font-medium text-deep-ocean">
            Amount *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-slate-gray/60 font-medium">PKR</span>
            </div>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount || ""}
              onChange={handleInputChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full pl-12 pr-4 py-2.5 border border-slate-gray/20 rounded-lg bg-light-sky/30 text-deep-ocean placeholder-slate-gray/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="expense_date" className="block text-sm font-medium text-deep-ocean">
            Expense Date *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-5 w-5 text-slate-gray/60" />
            </div>
            <input
              type="date"
              id="expense_date"
              name="expense_date"
              value={formData.expense_date || getPakistaniDate()}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-gray/20 rounded-lg bg-light-sky/30 text-deep-ocean focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="expense_time" className="block text-sm font-medium text-deep-ocean">
            Expense Time *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Clock className="h-5 w-5 text-slate-gray/60" />
            </div>
            <input
              type="time"
              id="expense_time"
              name="expense_time"
              value={formData.expense_time || getPakistaniTime()}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-gray/20 rounded-lg bg-light-sky/30 text-deep-ocean focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="payment_method" className="block text-sm font-medium text-deep-ocean">
          Payment Method
        </label>
        <select
          id="payment_method"
          name="payment_method"
          value={formData.payment_method || ""}
          onChange={handleInputChange}
          className="w-full px-4 py-2.5 border border-slate-gray/20 rounded-lg bg-light-sky/30 text-deep-ocean focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200"
        >
          <option value="">Select Payment Method</option>
          {paymentMethods.map(method => (
            <option key={method.value} value={method.value}>{method.label}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="vendor_payee" className="block text-sm font-medium text-deep-ocean">
          Vendor/Payee
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <User className="h-5 w-5 text-slate-gray/60" />
          </div>
          <input
            type="text"
            id="vendor_payee"
            name="vendor_payee"
            value={formData.vendor_payee || ""}
            onChange={handleInputChange}
            placeholder="Enter vendor or payee name"
            className="w-full pl-10 pr-4 py-2.5 border border-slate-gray/20 rounded-lg bg-light-sky/30 text-deep-ocean placeholder-slate-gray/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="block text-sm font-medium text-deep-ocean">
          Description
        </label>
        <div className="relative">
          <div className="absolute top-3 left-3 flex items-start pointer-events-none">
            <FileText className="h-5 w-5 text-slate-gray/60" />
          </div>
          <textarea
            id="description"
            name="description"
            value={formData.description || ""}
            onChange={handleInputChange}
            placeholder="Enter expense description"
            rows={3}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-gray/20 rounded-lg bg-light-sky/30 text-deep-ocean placeholder-slate-gray/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200 resize-y"
          />
        </div>
      </div>

      {showBankAccountField && (
        <div className="space-y-2">
          <label htmlFor="bank_account_id" className="block text-sm font-medium text-deep-ocean">
            Bank Account *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Building className="h-5 w-5 text-slate-gray/60" />
            </div>
            <select
              id="bank_account_id"
              name="bank_account_id"
              value={formData.bank_account_id || ""}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-gray/20 rounded-lg bg-light-sky/30 text-deep-ocean focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200"
              required={showBankAccountField}
            >
              <option value="">Select Bank Account</option>
              {bankAccounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.bank_name} - {account.account_title} (****{account.account_number.slice(-4)})
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-slate-gray/70 mt-1">
            Required for {formData.payment_method === 'online' ? 'online payments' : 'bank transfers'}
          </p>
        </div>
      )}

      {/* Payment Proof Upload */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-deep-ocean">
          Payment Proof
        </label>
        <div className="relative">
          <input
            type="file"
            id="payment_proof"
            name="payment_proof"
            accept="image/*,.pdf"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                handleFileChange?.('payment_proof', file)
                if (file.type.startsWith('image/')) {
                  const reader = new FileReader()
                  reader.onload = (ev) => setPaymentProofPreview(ev.target?.result as string)
                  reader.readAsDataURL(file)
                } else {
                  setPaymentProofPreview(null)
                }
              }
            }}
            className="hidden"
          />
          <label
            htmlFor="payment_proof"
            className="flex items-center justify-center gap-2 w-full py-3 px-4 border-2 border-dashed border-slate-gray/30 rounded-lg cursor-pointer hover:border-electric-blue hover:bg-light-sky/50 transition-all"
          >
            {paymentProofPreview ? (
              <img src={paymentProofPreview} alt="Preview" className="h-16 w-16 object-cover rounded-lg" />
            ) : formData.payment_proof ? (
              <span className="text-sm text-emerald-green flex items-center gap-2">
                <Check className="h-4 w-4" /> Proof uploaded
              </span>
            ) : (
              <>
                <Upload className="h-5 w-5 text-slate-gray/60" />
                <span className="text-sm text-slate-gray">Upload payment proof (image/PDF)</span>
              </>
            )}
          </label>
        </div>
      </div>
    </div>
  )
}