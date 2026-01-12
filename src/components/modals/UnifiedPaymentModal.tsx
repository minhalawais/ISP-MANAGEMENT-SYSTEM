"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { X, Check, DollarSign, TrendingDown, Wifi, TrendingUp, ArrowRightLeft } from "lucide-react"
import { PaymentForm } from "../forms/paymentForm.tsx"
import { ExpenseForm } from "../forms/ExpenseForm.tsx"
import { ISPPaymentForm } from "../forms/ISPPaymentForm.tsx"
import { ExtraIncomeForm } from "../forms/ExtraIncomeForm.tsx"
import { InternalTransferForm } from "../forms/InternalTransferForm.tsx"
import { getToken } from "../../utils/auth.ts"
import axiosInstance from "../../utils/axiosConfig.ts"
import { toast } from "react-toastify"

interface UnifiedPaymentModalProps {
    isOpen: boolean
    onClose: () => void
    onPaymentAdded: () => void
}

type TabType = "payment" | "expense" | "isp_payment" | "extra_income" | "internal_transfer"

interface TabConfig {
    id: TabType
    label: string
    icon: React.ElementType
    endpoint: string
    successMessage: string
}

const tabs: TabConfig[] = [
    {
        id: "payment",
        label: "Customer Payment",
        icon: DollarSign,
        endpoint: "/payments/add",
        successMessage: "Payment added successfully!",
    },
    {
        id: "expense",
        label: "Expense",
        icon: TrendingDown,
        endpoint: "/expenses/add",
        successMessage: "Expense added successfully!",
    },
    {
        id: "isp_payment",
        label: "ISP Payment",
        icon: Wifi,
        endpoint: "/isp-payments/add",
        successMessage: "ISP Payment added successfully!",
    },
    {
        id: "extra_income",
        label: "Extra Income",
        icon: TrendingUp,
        endpoint: "/extra-incomes/add",
        successMessage: "Extra Income added successfully!",
    },
    {
        id: "internal_transfer",
        label: "Internal Transfer",
        icon: ArrowRightLeft,
        endpoint: "/transfers/add",
        successMessage: "Transfer completed successfully!",
    },
]

export function UnifiedPaymentModal({ isOpen, onClose, onPaymentAdded }: UnifiedPaymentModalProps) {
    const [activeTab, setActiveTab] = useState<TabType>("payment")
    const [showSuccess, setShowSuccess] = useState(false)
    const [successMessage, setSuccessMessage] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Separate form data for each payment type
    const [paymentFormData, setPaymentFormData] = useState<any>({})
    const [expenseFormData, setExpenseFormData] = useState<any>({})
    const [ispPaymentFormData, setIspPaymentFormData] = useState<any>({})
    const [extraIncomeFormData, setExtraIncomeFormData] = useState<any>({})
    const [transferFormData, setTransferFormData] = useState<any>({})

    // Reset modal state when it opens
    useEffect(() => {
        if (isOpen) {
            setShowSuccess(false)
            setActiveTab("payment")
        }
    }, [isOpen])

    // Get current form data based on active tab
    const getCurrentFormData = () => {
        switch (activeTab) {
            case "payment":
                return paymentFormData
            case "expense":
                return expenseFormData
            case "isp_payment":
                return ispPaymentFormData
            case "extra_income":
                return extraIncomeFormData
            case "internal_transfer":
                return transferFormData
            default:
                return {}
        }
    }

    // Handle input change for current active tab
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target

        switch (activeTab) {
            case "payment":
                setPaymentFormData((prev: any) => ({ ...prev, [name]: value }))
                break
            case "expense":
                setExpenseFormData((prev: any) => ({ ...prev, [name]: value }))
                break
            case "isp_payment":
                setIspPaymentFormData((prev: any) => ({ ...prev, [name]: value }))
                break
            case "extra_income":
                setExtraIncomeFormData((prev: any) => ({ ...prev, [name]: value }))
                break
            case "internal_transfer":
                setTransferFormData((prev: any) => ({ ...prev, [name]: value }))
                break
        }
    }

    // Handle tab switch
    const handleTabSwitch = (tabId: TabType) => {
        setActiveTab(tabId)
        setShowSuccess(false) // Hide success screen when switching tabs
    }

    // Reset form data for a specific tab
    const resetFormData = (tabId: TabType) => {
        switch (tabId) {
            case "payment":
                setPaymentFormData({})
                break
            case "expense":
                setExpenseFormData({})
                break
            case "isp_payment":
                setIspPaymentFormData({})
                break
            case "extra_income":
                setExtraIncomeFormData({})
                break
            case "internal_transfer":
                setTransferFormData({})
                break
        }
    }

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const token = getToken()
            const currentTab = tabs.find((tab) => tab.id === activeTab)
            if (!currentTab) return

            const formData = getCurrentFormData()

            // Send form data as-is without combining date and time
            // The backend will handle combining them properly
            const submitData = { ...formData }

            await axiosInstance.post(currentTab.endpoint, submitData, {
                headers: { Authorization: `Bearer ${token}` },
            })

            // Show success screen
            setSuccessMessage(currentTab.successMessage)
            setShowSuccess(true)

            // Call callback to refresh data
            onPaymentAdded()

            // Show toast notification
            toast.success(currentTab.successMessage, {
                style: { background: "#D1FAE5", color: "#10B981" },
            })
        } catch (error: any) {
            console.error("Payment submission failed", error)
            const errorMessage = error.response?.data?.message || "Failed to add payment. Please try again."
            toast.error(errorMessage, {
                style: { background: "#FEE2E2", color: "#EF4444" },
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    // Handle "Add Another" button click
    const handleAddAnother = () => {
        resetFormData(activeTab)
        setShowSuccess(false)
    }

    // Handle modal close
    const handleClose = () => {
        // Reset all form data
        resetFormData("payment")
        resetFormData("expense")
        resetFormData("isp_payment")
        resetFormData("extra_income")
        resetFormData("internal_transfer")
        setShowSuccess(false)
        setActiveTab("payment")
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-gray/10">
                    <h2 className="text-2xl font-bold text-deep-ocean">Add Payment</h2>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-light-sky/50 rounded-lg transition-colors"
                        aria-label="Close modal"
                    >
                        <X className="h-6 w-6 text-slate-gray" />
                    </button>
                </div>

                {/* Tabs - Apple-inspired Design */}
                <div className="px-6 py-4 bg-gradient-to-b from-light-sky/40 to-light-sky/20 border-b border-slate-gray/10">
                    <div className="flex gap-2 bg-slate-gray/5 p-1.5 rounded-2xl backdrop-blur-sm">
                        {tabs.map((tab) => {
                            const Icon = tab.icon
                            const isActive = activeTab === tab.id
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabSwitch(tab.id)}
                                    className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-300 ease-out flex-1 relative overflow-hidden ${isActive
                                        ? "bg-white text-electric-blue shadow-lg shadow-electric-blue/10 scale-[1.02]"
                                        : "text-slate-gray hover:text-electric-blue hover:bg-white/50"
                                        }`}
                                >
                                    {isActive && (
                                        <div className="absolute inset-0 bg-gradient-to-br from-electric-blue/5 to-transparent rounded-xl" />
                                    )}
                                    <Icon className={`h-4 w-4 transition-all duration-300 relative z-10 ${isActive ? "scale-110" : ""}`} />
                                    <span className="text-sm relative z-10 whitespace-nowrap">{tab.label}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {showSuccess ? (
                        // Success Screen
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-20 h-20 bg-emerald-green/10 rounded-full flex items-center justify-center mb-6">
                                <Check className="h-10 w-10 text-emerald-green" />
                            </div>
                            <h3 className="text-2xl font-bold text-deep-ocean mb-2">Success!</h3>
                            <p className="text-slate-gray mb-8">{successMessage}</p>
                            <div className="flex gap-4">
                                <button
                                    onClick={handleAddAnother}
                                    className="px-6 py-3 bg-electric-blue text-white rounded-lg hover:bg-btn-hover transition-colors font-medium"
                                >
                                    Add Another
                                </button>
                                <button
                                    onClick={handleClose}
                                    className="px-6 py-3 border border-slate-gray/20 text-slate-gray rounded-lg hover:bg-light-sky/50 transition-colors font-medium"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    ) : (
                        // Form Content
                        <form onSubmit={handleSubmit}>
                            {activeTab === "payment" && (
                                <PaymentForm
                                    formData={paymentFormData}
                                    handleInputChange={handleInputChange}
                                    handleSubmit={handleSubmit}
                                    isEditing={false}
                                />
                            )}
                            {activeTab === "expense" && (
                                <ExpenseForm
                                    formData={expenseFormData}
                                    handleInputChange={handleInputChange}
                                    isEditing={false}
                                />
                            )}
                            {activeTab === "isp_payment" && (
                                <ISPPaymentForm
                                    formData={ispPaymentFormData}
                                    handleInputChange={handleInputChange}
                                    handleSubmit={handleSubmit}
                                    isEditing={false}
                                />
                            )}
                            {activeTab === "extra_income" && (
                                <ExtraIncomeForm
                                    formData={extraIncomeFormData}
                                    handleInputChange={handleInputChange}
                                    isEditing={false}
                                />
                            )}
                            {activeTab === "internal_transfer" && (
                                <InternalTransferForm
                                    formData={transferFormData}
                                    handleInputChange={handleInputChange}
                                    isEditing={false}
                                />
                            )}

                            {/* Submit Button */}
                            <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-gray/10">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="px-6 py-2.5 border border-slate-gray/20 text-slate-gray rounded-lg hover:bg-light-sky/50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-6 py-2.5 bg-electric-blue text-white rounded-lg hover:bg-btn-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-electric-blue disabled:opacity-50 transition-colors flex items-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg
                                                className="animate-spin h-5 w-5 text-white"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                ></circle>
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                ></path>
                                            </svg>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="h-5 w-5" />
                                            Submit
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}
