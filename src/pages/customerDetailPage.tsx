import type React from "react"
import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { getToken } from "../utils/auth.ts"
import { ChevronDown, ChevronUp, User, Mail, MapPin, Calendar, Package, Home, AlertCircle, DollarSign, BarChart, PhoneCall, Clock, TrendingUp, CreditCard, ImageIcon, Hash, Phone, Globe, Share2, Box, Wifi, Ruler, PenToolIcon as Tool, Router, Cable, Disc, Tv, FileText } from 'lucide-react'
import axiosInstance from "../utils/axiosConfig.ts"
import { Sidebar } from "../components/sideNavbar.tsx"
import { Topbar } from "../components/topNavbar.tsx"

interface CustomerDetail {
  id: string
  first_name: string
  last_name: string
  email: string
  internet_id: string
  phone_1: string
  phone_2: string | null
  area: string
  service_plan: string
  isp: string
  installation_address: string
  installation_date: string
  connection_type: string
  internet_connection_type: string | null
  wire_length: number | null
  wire_ownership: string | null
  router_ownership: string | null
  router_id: string | null
  router_serial_number: string | null
  patch_cord_ownership: string | null
  patch_cord_count: number | null
  patch_cord_ethernet_ownership: string | null
  patch_cord_ethernet_count: number | null
  splicing_box_ownership: string | null
  splicing_box_serial_number: string | null
  ethernet_cable_ownership: string | null
  ethernet_cable_length: number | null
  dish_ownership: string | null
  dish_id: string | null
  dish_mac_address: string | null
  tv_cable_connection_type: string | null
  node_count: number | null
  stb_serial_number: string | null
  discount_amount: number | null
  recharge_date: string | null
  miscellaneous_details: string | null
  miscellaneous_charges: number | null
  is_active: boolean
  cnic: string
  cnic_front_image: string
  cnic_back_image: string
  gps_coordinates: string | null
  agreement_document: string | null
}

interface Invoice {
  id: string
  invoice_number: string
  billing_start_date: string
  billing_end_date: string
  due_date: string
  total_amount: number
  status: string
}

interface Payment {
  id: string
  invoice_id: string
  amount: number
  payment_date: string
  payment_method: string
  status: string
}

interface Complaint {
  id: string
  ticket_number: string  // Changed from title
  description: string
  status: string
  created_at: string
}

interface FinancialMetrics {
  totalAmountPaid: number
  averageMonthlyPayment: number
  paymentReliabilityScore: number
  outstandingBalance: number
  averageBillAmount: number
  mostUsedPaymentMethod: string
  latePaymentFrequency: number
}

interface ServiceStatistics {
  serviceDuration: number
  servicePlanHistory: string[]
  upgradeDowngradeFrequency: number
  areaCoverageStatistics: { [key: string]: number }
}

interface SupportAnalysis {
  totalComplaints: number
  averageResolutionTime: number
  complaintCategoriesDistribution: { [key: string]: number }
  satisfactionRatingAverage: number
  resolutionAttemptsAverage: number
  supportResponseTime: number
  mostCommonComplaintTypes: string[]
}

interface BillingPatterns {
  paymentTimeline: { date: string; amount: number }[]
  invoicePaymentHistory: { invoiceId: string; daysToPay: number }[]
  discountUsage: number
  lateFeeOccurrences: number
  paymentMethodPreferences: { [key: string]: number }
}

interface RecoveryMetrics {
  recoveryTasksHistory: { date: string; status: string }[]
  recoverySuccessRate: number
  paymentAfterRecoveryRate: number
  averageRecoveryTime: number
}

interface CustomerDetailExtended extends CustomerDetail {
  financialMetrics: FinancialMetrics
  serviceStatistics: ServiceStatistics
  supportAnalysis: SupportAnalysis
  billingPatterns: BillingPatterns
  recoveryMetrics: RecoveryMetrics
}

const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [customer, setCustomer] = useState<CustomerDetailExtended | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [activeSection, setActiveSection] = useState<string[]>([
    "info",
    "financialMetrics",
    "serviceStatistics",
    "supportAnalysis",
    "billingPatterns",
    "recoveryMetrics",
    "invoices",
    "complaints",
    "equipment",
  ])
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [cnicImageUrls, setCnicImageUrls] = useState<{ front: string | null; back: string | null }>({
    front: null,
    back: null,
  })

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev)
  }

  useEffect(() => {
    document.title = "MBA NET - Customer Profile"
    const fetchCustomerData = async () => {
      try {
        const token = getToken()
        const customerResponse = await axiosInstance.get(`/customers/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setCustomer(customerResponse.data)

        const invoicesResponse = await axiosInstance.get(`/invoices/customer/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setInvoices(invoicesResponse.data)

        const paymentsResponse = await axiosInstance.get(`/payments/customer/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setPayments(paymentsResponse.data)

        const complaintsResponse = await axiosInstance.get(`/complaints/customer/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setComplaints(complaintsResponse.data)
      } catch (error) {
        console.error("Failed to fetch customer data", error)
      }
    }

    fetchCustomerData()
  }, [id])

  useEffect(() => {
    const fetchCnicImage = async () => {
      if (customer && customer.cnic_front_image && customer.cnic_back_image) {
        try {
          const token = getToken()
          const responseFront = await axiosInstance.get(`/customers/cnic-front-image/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
            responseType: "blob",
          })
          const responseBack = await axiosInstance.get(`/customers/cnic-back-image/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
            responseType: "blob",
          })
          const imageUrlFront = URL.createObjectURL(responseFront.data)
          const imageUrlBack = URL.createObjectURL(responseBack.data)
          setCnicImageUrls({ front: imageUrlFront, back: imageUrlBack })
        } catch (error) {
          console.error("Failed to fetch CNIC images", error)
        }
      }
    }

    fetchCnicImage()
    return () => {
      if (cnicImageUrls.front) URL.revokeObjectURL(cnicImageUrls.front)
      if (cnicImageUrls.back) URL.revokeObjectURL(cnicImageUrls.back)
    }
  }, [customer, id, cnicImageUrls.back]) // Added cnicImageUrls.back to dependencies

  const toggleSection = (section: string) => {
    setActiveSection((prev) => (prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]))
  }

  if (!customer) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#EBF5FF] to-white">
        <div className="animate-pulse text-[#2A5C8A] text-xl font-semibold">Loading customer details...</div>
      </div>
    )
  }

  const StatusBadge: React.FC<{ isActive: boolean }> = ({ isActive }) => (
    <span
      className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-300 ${
        isActive ? "bg-[#10B981] text-white shadow-md" : "bg-[#EF4444] text-white shadow-md"
      }`}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  )

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar toggleSidebar={toggleSidebar} />
        <div
          className={`flex-1 overflow-x-hidden overflow-y-auto bg-[#EBF5FF] p-6 pt-20 transition-all duration-300 ${isSidebarOpen ? "ml-72" : "ml-20"}`}
        >
          <div className="max-w-5xl mx-auto">
            <div className="mb-8 flex items-center justify-between">
              <h1 className="text-4xl font-bold text-[#2A5C8A]">Customer Profile</h1>
              <StatusBadge isActive={customer.is_active} />
            </div>

            <div className="space-y-6">
              {/* Personal Information Card */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-[#4A5568]/10 transition-all duration-300 hover:shadow-xl">
                <div
                  className="flex justify-between items-center p-4 bg-gradient-to-r from-[#2A5C8A] to-[#3A86FF] cursor-pointer hover:bg-opacity-90 transition-colors"
                  onClick={() => toggleSection("info")}
                >
                  <div className="flex items-center space-x-2">
                    <User className="w-5 h-5 text-white" />
                    <h2 className="text-xl font-semibold text-white">Personal Information</h2>
                  </div>
                  {activeSection.includes("info") ? (
                    <ChevronUp className="w-5 h-5 text-white" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-white" />
                  )}
                </div>

                {activeSection.includes("info") && (
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-gradient-to-br from-white to-[#EBF5FF] transition-all duration-300">
                    <div className="flex items-start space-x-3">
                      <User className="w-5 h-5 text-[#3A86FF] mt-1" />
                      <div>
                        <p className="text-sm text-[#4A5568] font-medium">Full Name</p>
                        <p className="text-[#2A5C8A] font-medium">{`${customer.first_name} ${customer.last_name}`}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Mail className="w-5 h-5 text-[#3A86FF] mt-1" />
                      <div>
                        <p className="text-sm text-[#4A5568] font-medium">Email</p>
                        <p className="text-[#2A5C8A] font-medium">{customer.email}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Hash className="w-5 h-5 text-[#3A86FF] mt-1" />
                      <div>
                        <p className="text-sm text-[#4A5568] font-medium">Internet ID</p>
                        <p className="text-[#2A5C8A] font-medium">{customer.internet_id}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Phone className="w-5 h-5 text-[#3A86FF] mt-1" />
                      <div>
                        <p className="text-sm text-[#4A5568] font-medium">Phone Numbers</p>
                        <p className="text-[#2A5C8A] font-medium">{customer.phone_1}</p>
                        {customer.phone_2 && <p className="text-[#2A5C8A] font-medium">{customer.phone_2}</p>}
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <MapPin className="w-5 h-5 text-[#3A86FF] mt-1" />
                      <div>
                        <p className="text-sm text-[#4A5568] font-medium">Area</p>
                        <p className="text-[#2A5C8A] font-medium">{customer.area}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Package className="w-5 h-5 text-[#3A86FF] mt-1" />
                      <div>
                        <p className="text-sm text-[#4A5568] font-medium">Service Plan</p>
                        <p className="text-[#2A5C8A] font-medium">{customer.service_plan}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Globe className="w-5 h-5 text-[#3A86FF] mt-1" />
                      <div>
                        <p className="text-sm text-[#4A5568] font-medium">ISP</p>
                        <p className="text-[#2A5C8A] font-medium">{customer.isp}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Home className="w-5 h-5 text-[#3A86FF] mt-1" />
                      <div>
                        <p className="text-sm text-[#4A5568] font-medium">Installation Address</p>
                        <p className="text-[#2A5C8A] font-medium">{customer.installation_address}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Calendar className="w-5 h-5 text-[#3A86FF] mt-1" />
                      <div>
                        <p className="text-sm text-[#4A5568] font-medium">Installation Date</p>
                        <p className="text-[#2A5C8A] font-medium">{new Date(customer.installation_date).toLocaleDateString()}</p>
                      </div>
                    </div>


                    <div className="flex items-start space-x-3">
                      <Wifi className="w-5 h-5 text-[#3A86FF] mt-1" />
                      <div>
                        <p className="text-sm text-[#4A5568] font-medium">Connection Type</p>
                        <p className="text-[#2A5C8A] font-medium">{customer.connection_type}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Ruler className="w-5 h-5 text-[#3A86FF] mt-1" />
                      <div>
                        <p className="text-sm text-[#4A5568] font-medium">Wire Length</p>
                        <p className="text-[#2A5C8A] font-medium">
                          {customer.wire_length ? `${customer.wire_length} meters` : "N/A"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <CreditCard className="w-5 h-5 text-[#3A86FF] mt-1" />
                      <div>
                        <p className="text-sm text-[#4A5568] font-medium">CNIC</p>
                        <p className="text-[#2A5C8A] font-medium">{customer.cnic}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <ImageIcon className="w-5 h-5 text-[#3A86FF] mt-1" />
                      <div>
                        <p className="text-sm text-[#4A5568] font-medium">CNIC Images</p>
                        <div className="flex space-x-2 mt-2">
                          {cnicImageUrls.front && (
                            <img
                              src={cnicImageUrls.front || "/placeholder.svg"}
                              alt="CNIC Front"
                              className="w-24 h-16 object-cover rounded-md shadow-sm"
                            />
                          )}
                          {cnicImageUrls.back && (
                            <img
                              src={cnicImageUrls.back || "/placeholder.svg"}
                              alt="CNIC Back"
                              className="w-24 h-16 object-cover rounded-md shadow-sm"
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <MapPin className="w-5 h-5 text-[#3A86FF] mt-1" />
                      <div>
                        <p className="text-sm text-[#4A5568] font-medium">GPS Coordinates</p>
                        <p className="text-[#2A5C8A] font-medium">{customer.gps_coordinates || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <FileText className="w-5 h-5 text-[#3A86FF] mt-1" />
                      <div>
                        <p className="text-sm text-[#4A5568] font-medium">Agreement Document</p>
                        {customer.agreement_document ? (
                          <button
                            onClick={() => {
                              const token = getToken()
                              fetch(`/customers/agreement-document/${customer.id}`, {
                                headers: { Authorization: `Bearer ${token}` },
                              })
                                .then((response) => response.blob())
                                .then((blob) => {
                                  const url = window.URL.createObjectURL(blob)
                                  const a = document.createElement("a")
                                  a.style.display = "none"
                                  a.href = url
                                  a.target = "_blank"
                                  document.body.appendChild(a)
                                  a.click()
                                  window.URL.revokeObjectURL(url)
                                })
                                .catch((error) => console.error("Error:", error))
                            }}
                            className="px-2 py-1 bg-[#3A86FF] text-white text-sm rounded-md shadow-md hover:bg-[#2A5C8A] transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105"
                          >
                            View Agreement
                          </button>
                        ) : (
                          <p className="text-[#4A5568]">No agreement document available</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Financial Metrics Card */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-[#4A5568]/10 transition-all duration-300 hover:shadow-xl">
                <div
                  className="flex justify-between items-center p-4 bg-gradient-to-r from-[#2A5C8A] to-[#3A86FF] cursor-pointer hover:bg-opacity-90 transition-colors"
                  onClick={() => toggleSection("financialMetrics")}
                >
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5 text-white" />
                    <h2 className="text-xl font-semibold text-white">Financial Metrics</h2>
                  </div>
                  {activeSection.includes("financialMetrics") ? (
                    <ChevronUp className="w-5 h-5 text-white" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-white" />
                  )}
                </div>

                {activeSection.includes("financialMetrics") && (
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-gradient-to-br from-white to-[#EBF5FF] transition-all duration-300">
                    <div className="flex items-start space-x-3">
                      <DollarSign className="w-5 h-5 text-[#3A86FF] mt-1" />
                      <div>
                        <p className="text-sm text-[#4A5568] font-medium">Total Amount Paid (All Time)</p>
                        <p className="text-[#2A5C8A] font-medium">${customer.financialMetrics.totalAmountPaid.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <DollarSign className="w-5 h-5 text-[#3A86FF] mt-1" />
                      <div>
                        <p className="text-sm text-[#4A5568] font-medium">Average Monthly Payment</p>
                        <p className="text-[#2A5C8A] font-medium">${customer.financialMetrics.averageMonthlyPayment.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <TrendingUp className="w-5 h-5 text-[#3A86FF] mt-1" />
                      <div>
                        <p className="text-sm text-[#4A5568] font-medium">Payment Reliability Score</p>
                        <p className="text-[#2A5C8A] font-medium">{customer.financialMetrics.paymentReliabilityScore.toFixed(2)}%</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <DollarSign className="w-5 h-5 text-[#3A86FF] mt-1" />
                      <div>
                        <p className="text-sm text-[#4A5568] font-medium">Outstanding Balance</p>
                        <p className="text-[#2A5C8A] font-medium">${customer.financialMetrics.outstandingBalance.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <DollarSign className="w-5 h-5 text-[#3A86FF] mt-1" />
                      <div>
                        <p className="text-sm text-[#4A5568] font-medium">Average Bill Amount</p>
                        <p className="text-[#2A5C8A] font-medium">${customer.financialMetrics.averageBillAmount.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Package className="w-5 h-5 text-[#3A86FF] mt-1" />
                      <div>
                        <p className="text-sm text-[#4A5568] font-medium">Most Used Payment Method</p>
                        <p className="text-[#2A5C8A] font-medium">{customer.financialMetrics.mostUsedPaymentMethod}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Clock className="w-5 h-5 text-[#3A86FF] mt-1" />
                      <div>
                        <p className="text-sm text-[#4A5568] font-medium">Late Payment Frequency</p>
                        <p className="text-[#2A5C8A] font-medium">{customer.financialMetrics.latePaymentFrequency} times</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Service Statistics Card */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-[#4A5568]/10 transition-all duration-300 hover:shadow-xl">
                <div
                  className="flex justify-between items-center p-4 bg-gradient-to-r from-[#2A5C8A] to-[#3A86FF] cursor-pointer hover:bg-opacity-90 transition-colors"
                  onClick={() => toggleSection("serviceStatistics")}
                >
                  <div className="flex items-center space-x-2">
                    <BarChart className="w-5 h-5 text-white" />
                    <h2 className="text-xl font-semibold text-white">Service Statistics</h2>
                  </div>
                  {activeSection.includes("serviceStatistics") ? (
                    <ChevronUp className="w-5 h-5 text-white" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-white" />
                  )}
                </div>

                {activeSection.includes("serviceStatistics") && (
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-gradient-to-br from-white to-[#EBF5FF] transition-all duration-300">
                    <div className="flex items-start space-x-3">
                      <Clock className="w-5 h-5 text-[#3A86FF] mt-1" />
                      <div>
                        <p className="text-sm text-[#4A5568] font-medium">Service Duration</p>
                        <p className="text-[#2A5C8A] font-medium">{customer.serviceStatistics.serviceDuration} days</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Package className="w-5 h-5 text-[#3A86FF] mt-1" />
                      <div>
                        <p className="text-sm text-[#4A5568] font-medium">Service Plan History</p>
                        <ul className="text-[#2A5C8A] list-disc list-inside">
                          {customer.serviceStatistics.servicePlanHistory.map((plan, index) => (
                            <li key={index}>{plan}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <TrendingUp className="w-5 h-5 text-[#3A86FF] mt-1" />
                      <div>
                        <p className="text-sm text-[#4A5568] font-medium">Upgrade/Downgrade Frequency</p>
                        <p className="text-[#2A5C8A] font-medium">{customer.serviceStatistics.upgradeDowngradeFrequency} times</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <MapPin className="w-5 h-5 text-[#3A86FF] mt-1" />
                      <div>
                        <p className="text-sm text-[#4A5568] font-medium">Area Coverage Statistics</p>
                        <ul className="text-[#2A5C8A] list-disc list-inside">
                          {Object.entries(customer.serviceStatistics.areaCoverageStatistics).map(([area, coverage]) => (
                            <li key={area}>
                              {area}: {coverage}%
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Support Analysis Card */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-[#4A5568]/10 transition-all duration-300 hover:shadow-xl">
                <div
                  className="flex justify-between items-center p-4 bg-gradient-to-r from-[#2A5C8A] to-[#3A86FF] cursor-pointer hover:bg-opacity-90 transition-colors"
                  onClick={() => toggleSection("supportAnalysis")}
                >
                  <div className="flex items-center space-x-2">
                    <PhoneCall className="w-5 h-5 text-white" />
                    <h2 className="text-xl font-semibold text-white">Support Analysis</h2>
                  </div>
                  {activeSection.includes("supportAnalysis") ? (
                    <ChevronUp className="w-5 h-5 text-white" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-white" />
                  )}
                </div>

                {activeSection.includes("supportAnalysis") && (
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-gradient-to-br from-white to-[#EBF5FF] transition-all duration-300">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-[#3A86FF] mt-1" />
                      <div>
                        <p className="text-sm text-[#4A5568] font-medium">Total Number of Complaints</p>
                        <p className="text-[#2A5C8A] font-medium">{customer.supportAnalysis.totalComplaints}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Clock className="w-5 h-5 text-[#3A86FF] mt-1" />
                      <div>
                        <p className="text-sm text-[#4A5568] font-medium">Average Resolution Time</p>
                        <p className="text-[#2A5C8A] font-medium">
                          {customer.supportAnalysis.averageResolutionTime.toFixed(2)} hours
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <TrendingUp className="w-5 h-5 text-[#3A86FF] mt-1" />
                      <div>
                        <p className="text-sm text-[#4A5568] font-medium">Satisfaction Rating Average</p>
                        <p className="text-[#2A5C8A] font-medium">
                          {customer.supportAnalysis.satisfactionRatingAverage.toFixed(2)}/5
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-[#3A86FF] mt-1" />
                      <div>
                        <p className="text-sm text-[#4A5568] font-medium">Resolution Attempts Average</p>
                        <p className="text-[#2A5C8A] font-medium">{customer.supportAnalysis.resolutionAttemptsAverage.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Clock className="w-5 h-5 text-[#3A86FF] mt-1" />
                      <div>
                        <p className="text-sm text-[#4A5568] font-medium">Support Response Time</p>
                        <p className="text-[#2A5C8A] font-medium">
                          {customer.supportAnalysis.supportResponseTime.toFixed(2)} minutes
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Billing Patterns Card */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-[#4A5568]/10 transition-all duration-300 hover:shadow-xl">
                <div
                  className="flex justify-between items-center p-4 bg-gradient-to-r from-[#2A5C8A] to-[#3A86FF] cursor-pointer hover:bg-opacity-90 transition-colors"
                  onClick={() => toggleSection("billingPatterns")}
                >
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5 text-white" />
                    <h2 className="text-xl font-semibold text-white">Billing Patterns</h2>
                  </div>
                  {activeSection.includes("billingPatterns") ? (
                    <ChevronUp className="w-5 h-5 text-white" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-white" />
                  )}
                </div>

                {activeSection.includes("billingPatterns") && (
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-gradient-to-br from-white to-[#EBF5FF] transition-all duration-300">
                    <div className="flex items-start space-x-3">
                      <TrendingUp className="w-5 h-5 text-[#3A86FF] mt-1" />
                      <div>
                        <p className="text-sm text-[#4A5568] font-medium">Payment Timeline Analysis</p>
                        <ul className="text-[#2A5C8A] list-disc list-inside">
                          {customer.billingPatterns.paymentTimeline.map((payment, index) => (
                            <li key={index}>
                              {payment.date}: ${payment.amount.toFixed(2)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Clock className="w-5 h-5 text-[#3A86FF] mt-1" />
                      <div>
                        <p className="text-sm text-[#4A5568] font-medium">Invoice Payment History (Days to Pay)</p>
                        <ul className="text-[#2A5C8A] list-disc list-inside">
                          {customer.billingPatterns.invoicePaymentHistory.map((invoice, index) => (
                            <li key={index}>
                              Invoice {invoice.invoiceId}: {invoice.daysToPay} days
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <DollarSign className="w-5 h-5 text-[#3A86FF] mt-1" />
                      <div>
                        <p className="text-sm text-[#4A5568] font-medium">Discount Usage</p>
                        <p className="text-[#2A5C8A] font-medium">{customer.billingPatterns.discountUsage} times</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-[#3A86FF] mt-1" />
                      <div>
                        <p className="text-sm text-[#4A5568] font-medium">Late Fee Occurrences</p>
                        <p className="text-[#2A5C8A] font-medium">{customer.billingPatterns.lateFeeOccurrences} times</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Package className="w-5 h-5 text-[#3A86FF] mt-1" />
                      <div>
                        <p className="text-sm text-[#4A5568] font-medium">Payment Method Preferences</p>
                        <ul className="text-[#2A5C8A] list-disc list-inside">
                          {Object.entries(customer.billingPatterns.paymentMethodPreferences).map(([method, count]) => (
                            <li key={method}>
                              {method}: {count} times
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Recovery Metrics Card */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-[#4A5568]/10 transition-all duration-300 hover:shadow-xl">
                <div
                  className="flex justify-between items-center p-4 bg-gradient-to-r from-[#2A5C8A] to-[#3A86FF] cursor-pointer hover:bg-opacity-90 transition-colors"
                  onClick={() => toggleSection("recoveryMetrics")}
                >
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-white" />
                    <h2 className="text-xl font-semibold text-white">Recovery Metrics</h2>
                  </div>
                  {activeSection.includes("recoveryMetrics") ? (
                    <ChevronUp className="w-5 h-5 text-white" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-white" />
                  )}
                </div>

                {activeSection.includes("recoveryMetrics") && (
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-gradient-to-br from-white to-[#EBF5FF] transition-all duration-300">
                    <div className="flex items-start space-x-3">
                      <Clock className="w-5 h-5 text-[#3A86FF] mt-1" />
                      <div>
                        <p className="text-sm text-[#4A5568] font-medium">Recovery Tasks History</p>
                        <ul className="text-[#2A5C8A] list-disc list-inside">
                          {customer.recoveryMetrics.recoveryTasksHistory.map((task, index) => (
                            <li key={index}>
                              {task.date}: {task.status}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <TrendingUp className="w-5 h-5 text-[#3A86FF] mt-1" />
                      <div>
                        <p className="text-sm text-[#4A5568] font-medium">Recovery Success Rate</p>
                        <p className="text-[#2A5C8A] font-medium">{customer.recoveryMetrics.recoverySuccessRate.toFixed(2)}%</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <TrendingUp className="w-5 h-5 text-[#3A86FF] mt-1" />
                      <div>
                        <p className="text-sm text-[#4A5568] font-medium">Payment After Recovery Rate</p>
                        <p className="text-[#2A5C8A] font-medium">{customer.recoveryMetrics.paymentAfterRecoveryRate.toFixed(2)}%</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Clock className="w-5 h-5 text-[#3A86FF] mt-1" />
                      <div>
                        <p className="text-sm text-[#4A5568] font-medium">Average Recovery Time</p>
                        <p className="text-[#2A5C8A] font-medium">{customer.recoveryMetrics.averageRecoveryTime.toFixed(2)} days</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Billing Information Card */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-[#4A5568]/10 transition-all duration-300 hover:shadow-xl">
                <div
                  className="flex justify-between items-center p-4 bg-gradient-to-r from-[#2A5C8A] to-[#3A86FF] cursor-pointer hover:bg-opacity-90 transition-colors"
                  onClick={() => toggleSection("invoices")}
                >
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-white" />
                    <h2 className="text-xl font-semibold text-white">Billing Information</h2>
                  </div>
                  {activeSection.includes("invoices") ? (
                    <ChevronUp className="w-5 h-5 text-white" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-white" />
                  )}
                </div>

                {activeSection.includes("invoices") && (
                  <div className="p-6 space-y-6 transition-all duration-300">
                    <div className="overflow-x-auto">
                      <h3 className="text-lg font-semibold text-[#2A5C8A] mb-4">Invoices</h3>
                      <table className="w-full">
                        <thead className="bg-[#EBF5FF]">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-[#2A5C8A]">Invoice #</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-[#2A5C8A]">Billing Period</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-[#2A5C8A]">Due Date</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-[#2A5C8A]">Amount</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-[#2A5C8A]">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EBF5FF]">
                          {invoices.map((invoice) => (
                            <tr key={invoice.id} className="hover:bg-[#F8FAFC]">
                              <td className="px-4 py-3 text-sm text-[#4A5568]">{invoice.invoice_number}</td>
                              <td className="px-4 py-3 text-sm text-[#4A5568]">
                                {`${new Date(invoice.billing_start_date).toLocaleDateString()} - 
                                ${new Date(invoice.billing_end_date).toLocaleDateString()}`}
                              </td>
                              <td className="px-4 py-3 text-sm text-[#4A5568]">
                                {new Date(invoice.due_date).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3 text-sm text-[#4A5568]">${invoice.total_amount.toFixed(2)}</td>
                              <td className="px-4 py-3">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium
                                  ${
                                    invoice.status === "Paid"
                                      ? "bg-[#10B981] text-white"
                                      : "bg-[#F59E0B] text-white"
                                  }`}
                                >
                                  {invoice.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="overflow-x-auto mt-8">
                      <h3 className="text-lg font-semibold text-[#2A5C8A] mb-4">Payments</h3>
                      <table className="w-full">
                        <thead className="bg-[#EBF5FF]">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-[#2A5C8A]">Invoice #</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-[#2A5C8A]">Date</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-[#2A5C8A]">Amount</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-[#2A5C8A]">Method</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-[#2A5C8A]">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EBF5FF]">
                          {payments.map((payment) => (
                            <tr key={payment.id} className="hover:bg-[#F8FAFC]">
                              <td className="px-4 py-3 text-sm text-[#4A5568]">{payment.invoice_id}</td>
                              <td className="px-4 py-3 text-sm text-[#4A5568]">
                                {new Date(payment.payment_date).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3 text-sm text-[#4A5568]">${payment.amount.toFixed(2)}</td>
                              <td className="px-4 py-3 text-sm text-[#4A5568]">{payment.payment_method}</td>
                              <td className="px-4 py-3">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium
                                  ${
                                    payment.status === "Completed"
                                      ? "bg-[#10B981] text-white"
                                      : "bg-[#F59E0B] text-white"
                                  }`}
                                >
                                  {payment.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

            {/* Support History Card */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-[#4A5568]/10 transition-all duration-300 hover:shadow-xl mb-8">
              <div
                className="flex justify-between items-center p-4 bg-gradient-to-r from-[#2A5C8A] to-[#3A86FF] cursor-pointer hover:bg-opacity-90 transition-colors"
                onClick={() => toggleSection("complaints")}
              >
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-white" />
                  <h2 className="text-xl font-semibold text-white">Support History</h2>
                </div>
                {activeSection.includes("complaints") ? (
                  <ChevronUp className="w-5 h-5 text-white" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-white" />
                )}
              </div>

              {activeSection.includes("complaints") && (
                <div className="p-6 bg-gradient-to-br from-white to-[#EBF5FF] transition-all duration-300">
                  {complaints.length > 0 ? (
                    <div className="space-y-4">
                      {complaints.map((complaint) => (
                        <div
                          key={complaint.id}
                          className="bg-white p-4 rounded-lg border border-[#4A5568]/10 hover:shadow-md transition-shadow"
                        >
                          <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-semibold text-[#2A5C8A]">
                              Ticket #{complaint.ticket_number}  {/* Changed from title to ticket_number */}
                            </h3>                            
                          <span
                              className={`px-2 py-1 rounded-full text-xs font-medium
                              ${
                                complaint.status === "Resolved"
                                  ? "bg-[#10B981] text-white"
                                  : complaint.status === "Pending"
                                  ? "bg-[#F59E0B] text-white"
                                  : "bg-[#EF4444] text-white"
                              }`}
                            >
                              {complaint.status}
                            </span>
                          </div>

                          <p className="text-sm text-[#4A5568] mb-2">
                            Submitted: {new Date(complaint.created_at).toLocaleDateString()}
                          </p>

                          <p className="text-[#4A5568] text-sm leading-relaxed">{complaint.description}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-[#4A5568]">
                      <AlertCircle className="w-12 h-12 text-[#3A86FF] mx-auto mb-3" />
                      <p>No support tickets found.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Equipment Details Card */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-[#4A5568]/10 transition-all duration-300 hover:shadow-xl">
              <div
                className="flex justify-between items-center p-4 bg-gradient-to-r from-[#2A5C8A] to-[#3A86FF] cursor-pointer hover:bg-opacity-90 transition-colors"
                onClick={() => toggleSection("equipment")}
              >
                <div className="flex items-center space-x-2">
                  <Tool className="w-5 h-5 text-white" />
                  <h2 className="text-xl font-semibold text-white">Equipment Details</h2>
                </div>
                {activeSection.includes("equipment") ? (
                  <ChevronUp className="w-5 h-5 text-white" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-white" />
                )}
              </div>

              {activeSection.includes("equipment") && (
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-gradient-to-br from-white to-[#EBF5FF] transition-all duration-300">
                  <div className="flex items-start space-x-3">
                    <Router className="w-5 h-5 text-[#3A86FF] mt-1" />
                    <div>
                      <p className="text-sm text-[#4A5568] font-medium">Router Details</p>
                      <p className="text-[#2A5C8A] font-medium">Ownership: {customer.router_ownership || "N/A"}</p>
                      <p className="text-[#2A5C8A] font-medium">Serial Number: {customer.router_serial_number || "N/A"}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Cable className="w-5 h-5 text-[#3A86FF] mt-1" />
                    <div>
                      <p className="text-sm text-[#4A5568] font-medium">Patch Cord Details</p>
                      <p className="text-[#2A5C8A] font-medium">Ownership: {customer.patch_cord_ownership || "N/A"}</p>
                      <p className="text-[#2A5C8A] font-medium">Count: {customer.patch_cord_count || "N/A"}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Box className="w-5 h-5 text-[#3A86FF] mt-1" />
                    <div>
                      <p className="text-sm text-[#4A5568] font-medium">Splicing Box Details</p>
                      <p className="text-[#2A5C8A] font-medium">Ownership: {customer.splicing_box_ownership || "N/A"}</p>
                      <p className="text-[#2A5C8A] font-medium">Serial Number: {customer.splicing_box_serial_number || "N/A"}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Cable className="w-5 h-5 text-[#3A86FF] mt-1" />
                    <div>
                      <p className="text-sm text-[#4A5568] font-medium">Ethernet Cable Details</p>
                      <p className="text-[#2A5C8A] font-medium">Ownership: {customer.ethernet_cable_ownership || "N/A"}</p>
                      <p className="text-[#2A5C8A] font-medium">Length: {customer.ethernet_cable_length ? `${customer.ethernet_cable_length} meters` : "N/A"}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Disc className="w-5 h-5 text-[#3A86FF] mt-1" />
                    <div>
                      <p className="text-sm text-[#4A5568] font-medium">Dish Details</p>
                      <p className="text-[#2A5C8A] font-medium">Ownership: {customer.dish_ownership || "N/A"}</p>
                      <p className="text-[#2A5C8A] font-medium">MAC Address: {customer.dish_mac_address || "N/A"}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Tv className="w-5 h-5 text-[#3A86FF] mt-1" />
                    <div>
                      <p className="text-sm text-[#4A5568] font-medium">TV Cable Details</p>
                      <p className="text-[#2A5C8A] font-medium">Connection Type: {customer.tv_cable_connection_type || "N/A"}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Share2 className="w-5 h-5 text-[#3A86FF] mt-1" />
                    <div>
                      <p className="text-sm text-[#4A5568] font-medium">Node Details</p>
                      <p className="text-[#2A5C8A] font-medium">Count: {customer.node_count || "N/A"}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Box className="w-5 h-5 text-[#3A86FF] mt-1" />
                    <div>
                      <p className="text-sm text-[#4A5568] font-medium">STB Details</p>
                      <p className="text-[#2A5C8A] font-medium">Serial Number: {customer.stb_serial_number || "N/A"}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}

export default CustomerDetail
