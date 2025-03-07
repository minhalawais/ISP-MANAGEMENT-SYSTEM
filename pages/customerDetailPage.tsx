import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getToken } from '../utils/auth.ts';
import { ChevronDown, ChevronUp, User, Mail, MapPin, Calendar, Package, Home, AlertCircle, DollarSign, BarChart, PhoneCall, Clock, TrendingUp, CreditCard, Image } from 'lucide-react';
import axiosInstance from '../utils/axiosConfig.ts';
import { Sidebar } from '../components/sideNavbar.tsx';
import { Topbar } from '../components/topNavbar.tsx';

interface CustomerDetail {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  area: string;
  service_plan: string;
  installation_address: string;
  installation_date: string;
  is_active: boolean;
  cnic: string;
  cnic_image: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  billing_start_date: string;
  billing_end_date: string;
  due_date: string;
  total_amount: number;
  status: string;
}

interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  status: string;
}

interface Complaint {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
}

interface FinancialMetrics {
  totalAmountPaid: number;
  averageMonthlyPayment: number;
  paymentReliabilityScore: number;
  outstandingBalance: number;
  averageBillAmount: number;
  mostUsedPaymentMethod: string;
  latePaymentFrequency: number;
}

interface ServiceStatistics {
  serviceDuration: number;
  servicePlanHistory: string[];
  upgradeDowngradeFrequency: number;
  areaCoverageStatistics: { [key: string]: number };
}

interface SupportAnalysis {
  totalComplaints: number;
  averageResolutionTime: number;
  complaintCategoriesDistribution: { [key: string]: number };
  satisfactionRatingAverage: number;
  resolutionAttemptsAverage: number;
  supportResponseTime: number;
  mostCommonComplaintTypes: string[];
}

interface BillingPatterns {
  paymentTimeline: { date: string; amount: number }[];
  invoicePaymentHistory: { invoiceId: string; daysToPay: number }[];
  discountUsage: number;
  lateFeeOccurrences: number;
  paymentMethodPreferences: { [key: string]: number };
}

interface RecoveryMetrics {
  recoveryTasksHistory: { date: string; status: string }[];
  recoverySuccessRate: number;
  paymentAfterRecoveryRate: number;
  averageRecoveryTime: number;
}

interface CustomerDetailExtended extends CustomerDetail {
  financialMetrics: FinancialMetrics;
  serviceStatistics: ServiceStatistics;
  supportAnalysis: SupportAnalysis;
  billingPatterns: BillingPatterns;
  recoveryMetrics: RecoveryMetrics;
}

const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<CustomerDetailExtended | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [activeSection, setActiveSection] = useState<string[]>(['info', 'financialMetrics', 'serviceStatistics', 'supportAnalysis', 'billingPatterns', 'recoveryMetrics', 'invoices', 'complaints']);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        const token = getToken();
        const customerResponse = await axiosInstance.get(`/customers/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCustomer(customerResponse.data);

        const invoicesResponse = await axiosInstance.get(`/invoices/customer/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setInvoices(invoicesResponse.data);

        const paymentsResponse = await axiosInstance.get(`/payments/customer/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPayments(paymentsResponse.data);

        const complaintsResponse = await axiosInstance.get(`/complaints/customer/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setComplaints(complaintsResponse.data);
      } catch (error) {
        console.error('Failed to fetch customer data', error);
      }
    };

    fetchCustomerData();
  }, [id]);

  const toggleSection = (section: string) => {
    setActiveSection(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  if (!customer) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#E5E1DA] to-[#F1F0E8]">
        <div className="animate-pulse text-[#89A8B2] text-xl font-semibold">Loading customer details...</div>
      </div>
    );
  }

  const StatusBadge: React.FC<{ isActive: boolean }> = ({ isActive }) => (
    <span
      className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-300 ${
        isActive
          ? 'bg-[#89A8B2] text-white shadow-md'
          : 'bg-[#E5E1DA] text-[#89A8B2]'
      }`}
    >
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar toggleSidebar={toggleSidebar} />
        <div className={`flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6 pt-20 transition-all duration-300 ${isSidebarOpen ? 'ml-72' : 'ml-20'}`}>
          <div className="max-w-5xl mx-auto">
            <div className="mb-8 flex items-center justify-between">
              <h1 className="text-4xl font-bold text-[#89A8B2]">
                Customer Profile
              </h1>
              <StatusBadge isActive={customer.is_active} />
            </div>

            <div className="space-y-6">
              {/* Personal Information Card */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-[#B3C8CF] transition-all duration-300 hover:shadow-xl">
                <div
                  className="flex justify-between items-center p-4 bg-gradient-to-r from-[#89A8B2] to-[#B3C8CF] cursor-pointer hover:bg-opacity-90 transition-colors"
                  onClick={() => toggleSection('info')}
                >
                  <div className="flex items-center space-x-2">
                    <User className="w-5 h-5 text-white" />
                    <h2 className="text-xl font-semibold text-white">
                      Personal Information
                    </h2>
                  </div>
                  {activeSection.includes('info') ? (
                    <ChevronUp className="w-5 h-5 text-white" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-white" />
                  )}
                </div>
                
                {activeSection.includes('info') && (
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-gradient-to-br from-white to-[#F1F0E8] transition-all duration-300">
                    <div className="flex items-start space-x-3">
                      <User className="w-5 h-5 text-[#89A8B2] mt-1" />
                      <div>
                        <p className="text-sm text-[#89A8B2] font-medium">Full Name</p>
                        <p className="text-gray-700">{`${customer.first_name} ${customer.last_name}`}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Mail className="w-5 h-5 text-[#89A8B2] mt-1" />
                      <div>
                        <p className="text-sm text-[#89A8B2] font-medium">Email</p>
                        <p className="text-gray-700">{customer.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-5 h-5 text-[#89A8B2] mt-1" />
                      <div>
                        <p className="text-sm text-[#89A8B2] font-medium">Area</p>
                        <p className="text-gray-700">{customer.area}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Package className="w-5 h-5 text-[#89A8B2] mt-1" />
                      <div>
                        <p className="text-sm text-[#89A8B2] font-medium">Service Plan</p>
                        <p className="text-gray-700">{customer.service_plan}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Home className="w-5 h-5 text-[#89A8B2] mt-1" />
                      <div>
                        <p className="text-sm text-[#89A8B2] font-medium">Installation Address</p>
                        <p className="text-gray-700">{customer.installation_address}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Calendar className="w-5 h-5 text-[#89A8B2] mt-1" />
                      <div>
                        <p className="text-sm text-[#89A8B2] font-medium">Installation Date</p>
                        <p className="text-gray-700">
                          {new Date(customer.installation_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <CreditCard className="w-5 h-5 text-[#89A8B2] mt-1" />
                      <div>
                        <p className="text-sm text-[#89A8B2] font-medium">CNIC</p>
                        <p className="text-gray-700">{customer.cnic}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Image className="w-5 h-5 text-[#89A8B2] mt-1" />
                      <div>
                        <p className="text-sm text-[#89A8B2] font-medium">CNIC Image</p>
                        {customer.cnic_image ? (
                          <img 
                            src={customer.cnic_image} 
                            alt="CNIC" 
                            className="mt-2 max-w-xs rounded-lg shadow-md"
                          />
                        ) : (
                          <p className="text-gray-500 italic">No image available</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Financial Metrics Card */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-[#B3C8CF] transition-all duration-300 hover:shadow-xl">
                <div
                  className="flex justify-between items-center p-4 bg-gradient-to-r from-[#89A8B2] to-[#B3C8CF] cursor-pointer hover:bg-opacity-90 transition-colors"
                  onClick={() => toggleSection('financialMetrics')}
                >
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5 text-white" />
                    <h2 className="text-xl font-semibold text-white">
                      Financial Metrics
                    </h2>
                  </div>
                  {activeSection.includes('financialMetrics') ? (
                    <ChevronUp className="w-5 h-5 text-white" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-white" />
                  )}
                </div>
                
                {activeSection.includes('financialMetrics') && (
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-gradient-to-br from-white to-[#F1F0E8] transition-all duration-300">
                    <div className="flex items-start space-x-3">
                      <DollarSign className="w-5 h-5 text-[#89A8B2] mt-1" />
                      <div>
                        <p className="text-sm text-[#89A8B2] font-medium">Total Amount Paid (All Time)</p>
                        <p className="text-gray-700">${customer.financialMetrics.totalAmountPaid.toFixed(2)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <DollarSign className="w-5 h-5 text-[#89A8B2] mt-1" />
                      <div>
                        <p className="text-sm text-[#89A8B2] font-medium">Average Monthly Payment</p>
                        <p className="text-gray-700">${customer.financialMetrics.averageMonthlyPayment.toFixed(2)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">

                      <TrendingUp className="w-5 h-5 text-[#89A8B2] mt-1" />
                      <div>
                        <p className="text-sm text-[#89A8B2] font-medium">Payment Reliability Score</p>
                        <p className="text-gray-700">{customer.financialMetrics.paymentReliabilityScore.toFixed(2)}%</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <DollarSign className="w-5 h-5 text-[#89A8B2] mt-1" />
                      <div>
                        <p className="text-sm text-[#89A8B2] font-medium">Outstanding Balance</p>
                        <p className="text-gray-700">${customer.financialMetrics.outstandingBalance.toFixed(2)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <DollarSign className="w-5 h-5 text-[#89A8B2] mt-1" />
                      <div>
                        <p className="text-sm text-[#89A8B2] font-medium">Average Bill Amount</p>
                        <p className="text-gray-700">${customer.financialMetrics.averageBillAmount.toFixed(2)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Package className="w-5 h-5 text-[#89A8B2] mt-1" />
                      <div>
                        <p className="text-sm text-[#89A8B2] font-medium">Most Used Payment Method</p>
                        <p className="text-gray-700">{customer.financialMetrics.mostUsedPaymentMethod}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Clock className="w-5 h-5 text-[#89A8B2] mt-1" />
                      <div>
                        <p className="text-sm text-[#89A8B2] font-medium">Late Payment Frequency</p>
                        <p className="text-gray-700">{customer.financialMetrics.latePaymentFrequency} times</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Service Statistics Card */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-[#B3C8CF] transition-all duration-300 hover:shadow-xl">
                <div
                  className="flex justify-between items-center p-4 bg-gradient-to-r from-[#89A8B2] to-[#B3C8CF] cursor-pointer hover:bg-opacity-90 transition-colors"
                  onClick={() => toggleSection('serviceStatistics')}
                >
                  <div className="flex items-center space-x-2">
                    <BarChart className="w-5 h-5 text-white" />
                    <h2 className="text-xl font-semibold text-white">
                      Service Statistics
                    </h2>
                  </div>
                  {activeSection.includes('serviceStatistics') ? (
                    <ChevronUp className="w-5 h-5 text-white" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-white" />
                  )}
                </div>
                
                {activeSection.includes('serviceStatistics') && (
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-gradient-to-br from-white to-[#F1F0E8] transition-all duration-300">
                    <div className="flex items-start space-x-3">
                      <Clock className="w-5 h-5 text-[#89A8B2] mt-1" />
                      <div>
                        <p className="text-sm text-[#89A8B2] font-medium">Service Duration</p>
                        <p className="text-gray-700">{customer.serviceStatistics.serviceDuration} days</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Package className="w-5 h-5 text-[#89A8B2] mt-1" />
                      <div>
                        <p className="text-sm text-[#89A8B2] font-medium">Service Plan History</p>
                        <ul className="text-gray-700 list-disc list-inside">
                          {customer.serviceStatistics.servicePlanHistory.map((plan, index) => (
                            <li key={index}>{plan}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <TrendingUp className="w-5 h-5 text-[#89A8B2] mt-1" />
                      <div>
                        <p className="text-sm text-[#89A8B2] font-medium">Upgrade/Downgrade Frequency</p>
                        <p className="text-gray-700">{customer.serviceStatistics.upgradeDowngradeFrequency} times</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-5 h-5 text-[#89A8B2] mt-1" />
                      <div>
                        <p className="text-sm text-[#89A8B2] font-medium">Area Coverage Statistics</p>
                        <ul className="text-gray-700 list-disc list-inside">
                          {Object.entries(customer.serviceStatistics.areaCoverageStatistics).map(([area, coverage]) => (
                            <li key={area}>{area}: {coverage}%</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Support Analysis Card */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-[#B3C8CF] transition-all duration-300 hover:shadow-xl">
                <div
                  className="flex justify-between items-center p-4 bg-gradient-to-r from-[#89A8B2] to-[#B3C8CF] cursor-pointer hover:bg-opacity-90 transition-colors"
                  onClick={() => toggleSection('supportAnalysis')}
                >
                  <div className="flex items-center space-x-2">
                    <PhoneCall className="w-5 h-5 text-white" />
                    <h2 className="text-xl font-semibold text-white">
                      Support Analysis
                    </h2>
                  </div>
                  {activeSection.includes('supportAnalysis') ? (
                    <ChevronUp className="w-5 h-5 text-white" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-white" />
                  )}
                </div>
                
                {activeSection.includes('supportAnalysis') && (
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-gradient-to-br from-white to-[#F1F0E8] transition-all duration-300">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-[#89A8B2] mt-1" />
                      <div>
                        <p className="text-sm text-[#89A8B2] font-medium">Total Number of Complaints</p>
                        <p className="text-gray-700">{customer.supportAnalysis.totalComplaints}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Clock className="w-5 h-5 text-[#89A8B2] mt-1" />
                      <div>
                        <p className="text-sm text-[#89A8B2] font-medium">Average Resolution Time</p>
                        <p className="text-gray-700">{customer.supportAnalysis.averageResolutionTime.toFixed(2)} hours</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <BarChart className="w-5 h-5 text-[#89A8B2] mt-1" />
                      <div>
                        <p className="text-sm text-[#89A8B2] font-medium">Complaint Categories Distribution</p>
                        <ul className="text-gray-700 list-disc list-inside">
                          {Object.entries(customer.supportAnalysis.complaintCategoriesDistribution).map(([category, count]) => (
                            <li key={category}>{category}: {count}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <TrendingUp className="w-5 h-5 text-[#89A8B2] mt-1" />
                      <div>
                        <p className="text-sm text-[#89A8B2] font-medium">Satisfaction Rating Average</p>
                        <p className="text-gray-700">{customer.supportAnalysis.satisfactionRatingAverage.toFixed(2)}/5</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-[#89A8B2] mt-1" />
                      <div>
                        <p className="text-sm text-[#89A8B2] font-medium">Resolution Attempts Average</p>
                        <p className="text-gray-700">{customer.supportAnalysis.resolutionAttemptsAverage.toFixed(2)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Clock className="w-5 h-5 text-[#89A8B2] mt-1" />
                      <div>
                        <p className="text-sm text-[#89A8B2] font-medium">Support Response Time</p>
                        <p className="text-gray-700">{customer.supportAnalysis.supportResponseTime.toFixed(2)} minutes</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-[#89A8B2] mt-1" />
                      <div>
                        <p className="text-sm text-[#89A8B2] font-medium">Most Common Complaint Types</p>
                        <ul className="text-gray-700 list-disc list-inside">
                          {customer.supportAnalysis.mostCommonComplaintTypes.map((type, index) => (
                            <li key={index}>{type}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Billing Patterns Card */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-[#B3C8CF] transition-all duration-300 hover:shadow-xl">
                <div
                  className="flex justify-between items-center p-4 bg-gradient-to-r from-[#89A8B2] to-[#B3C8CF] cursor-pointer hover:bg-opacity-90 transition-colors"
                  onClick={() => toggleSection('billingPatterns')}
                >
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5 text-white" />
                    <h2 className="text-xl font-semibold text-white">
                      Billing Patterns
                    </h2>
                  </div>
                  {activeSection.includes('billingPatterns') ? (
                    <ChevronUp className="w-5 h-5 text-white" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-white" />
                  )}
                </div>
                
                {activeSection.includes('billingPatterns') && (
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-gradient-to-br from-white to-[#F1F0E8] transition-all duration-300">
                    <div className="flex items-start space-x-3">
                      <TrendingUp className="w-5 h-5 text-[#89A8B2] mt-1" />
                      <div>
                        <p className="text-sm text-[#89A8B2] font-medium">Payment Timeline Analysis</p>
                        <ul className="text-gray-700 list-disc list-inside">
                          {customer.billingPatterns.paymentTimeline.map((payment, index) => (
                            <li key={index}>{payment.date}: ${payment.amount.toFixed(2)}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Clock className="w-5 h-5 text-[#89A8B2] mt-1" />
                      <div>
                        <p className="text-sm text-[#89A8B2] font-medium">Invoice Payment History (Days to Pay)</p>
                        <ul className="text-gray-700 list-disc list-inside">
                          {customer.billingPatterns.invoicePaymentHistory.map((invoice, index) => (
                            <li key={index}>Invoice {invoice.invoiceId}: {invoice.daysToPay} days</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <DollarSign className="w-5 h-5 text-[#89A8B2] mt-1" />
                      <div>
                        <p className="text-sm text-[#89A8B2] font-medium">Discount Usage</p>
                        <p className="text-gray-700">{customer.billingPatterns.discountUsage} times</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-[#89A8B2] mt-1" />
                      <div>
                        <p className="text-sm text-[#89A8B2] font-medium">Late Fee Occurrences</p>
                        <p className="text-gray-700">{customer.billingPatterns.lateFeeOccurrences} times</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">

                      <Package className="w-5 h-5 text-[#89A8B2] mt-1" />
                      <div>
                        <p className="text-sm text-[#89A8B2] font-medium">Payment Method Preferences</p>
                        <ul className="text-gray-700 list-disc list-inside">
                          {Object.entries(customer.billingPatterns.paymentMethodPreferences).map(([method, count]) => (
                            <li key={method}>{method}: {count} times</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Recovery Metrics Card */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-[#B3C8CF] transition-all duration-300 hover:shadow-xl">
                <div
                  className="flex justify-between items-center p-4 bg-gradient-to-r from-[#89A8B2] to-[#B3C8CF] cursor-pointer hover:bg-opacity-90 transition-colors"
                  onClick={() => toggleSection('recoveryMetrics')}
                >
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-white" />
                    <h2 className="text-xl font-semibold text-white">
                      Recovery Metrics
                    </h2>
                  </div>
                  {activeSection.includes('recoveryMetrics') ? (
                    <ChevronUp className="w-5 h-5 text-white" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-white" />
                  )}
                </div>
                
                {activeSection.includes('recoveryMetrics') && (
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-gradient-to-br from-white to-[#F1F0E8] transition-all duration-300">
                    <div className="flex items-start space-x-3">
                      <Clock className="w-5 h-5 text-[#89A8B2] mt-1" />
                      <div>
                        <p className="text-sm text-[#89A8B2] font-medium">Recovery Tasks History</p>
                        <ul className="text-gray-700 list-disc list-inside">
                          {customer.recoveryMetrics.recoveryTasksHistory.map((task, index) => (
                            <li key={index}>{task.date}: {task.status}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <TrendingUp className="w-5 h-5 text-[#89A8B2] mt-1" />
                      <div>
                        <p className="text-sm text-[#89A8B2] font-medium">Recovery Success Rate</p>
                        <p className="text-gray-700">{customer.recoveryMetrics.recoverySuccessRate.toFixed(2)}%</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <TrendingUp className="w-5 h-5 text-[#89A8B2] mt-1" />
                      <div>
                        <p className="text-sm text-[#89A8B2] font-medium">Payment After Recovery Rate</p>
                        <p className="text-gray-700">{customer.recoveryMetrics.paymentAfterRecoveryRate.toFixed(2)}%</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Clock className="w-5 h-5 text-[#89A8B2] mt-1" />
                      <div>
                        <p className="text-sm text-[#89A8B2] font-medium">Average Recovery Time</p>
                        <p className="text-gray-700">{customer.recoveryMetrics.averageRecoveryTime.toFixed(2)} days</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Billing Information Card */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-[#B3C8CF] transition-all duration-300 hover:shadow-xl">
                <div
                  className="flex justify-between items-center p-4 bg-gradient-to-r from-[#89A8B2] to-[#B3C8CF] cursor-pointer hover:bg-opacity-90 transition-colors"
                  onClick={() => toggleSection('invoices')}
                >
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-white" />
                    <h2 className="text-xl font-semibold text-white">
                      Billing Information
                    </h2>
                  </div>
                  {activeSection.includes('invoices') ? (
                    <ChevronUp className="w-5 h-5 text-white" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-white" />
                  )}
                </div>
                
                {activeSection.includes('invoices') && (
                  <div className="p-6 space-y-6 transition-all duration-300">
                    <div className="overflow-x-auto">
                      <h3 className="text-lg font-semibold text-[#89A8B2] mb-4">Invoices</h3>
                      <table className="w-full">
                        <thead className="bg-[#E5E1DA]">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-[#89A8B2]">Invoice #</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-[#89A8B2]">Billing Period</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-[#89A8B2]">Due Date</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-[#89A8B2]">Amount</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-[#89A8B2]">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E1DA]">
                          {invoices.map(invoice => (
                            <tr key={invoice.id} className="hover:bg-[#F1F0E8]">
                              <td className="px-4 py-3 text-sm text-gray-700">{invoice.invoice_number}</td>
                              <td className="px-4 py-3 text-sm text-gray-700">
                                {`${new Date(invoice.billing_start_date).toLocaleDateString()} - 
                                ${new Date(invoice.billing_end_date).toLocaleDateString()}`}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">
                                {new Date(invoice.due_date).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">
                                ${invoice.total_amount.toFixed(2)}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium
                                  ${invoice.status === 'Paid' 
                                    ? 'bg-[#89A8B2] text-white' 
                                    : 'bg-[#E5E1DA] text-[#89A8B2]'}`}>
                                  {invoice.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="overflow-x-auto mt-8">
                      <h3 className="text-lg font-semibold text-[#89A8B2] mb-4">Payments</h3>
                      <table className="w-full">
                        <thead className="bg-[#E5E1DA]">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-[#89A8B2]">Invoice #</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-[#89A8B2]">Date</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-[#89A8B2]">Amount</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-[#89A8B2]">Method</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-[#89A8B2]">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E1DA]">
                          {payments.map(payment => (
                            <tr key={payment.id} className="hover:bg-[#F1F0E8]">
                              <td className="px-4 py-3 text-sm text-gray-700">{payment.invoice_id}</td>
                              <td className="px-4 py-3 text-sm text-gray-700">
                                {new Date(payment.payment_date).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">
                                ${payment.amount.toFixed(2)}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">{payment.payment_method}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium
                                  ${payment.status === 'Completed' 
                                    ? 'bg-[#89A8B2] text-white' 
                                    : 'bg-[#E5E1DA] text-[#89A8B2]'}`}>
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
              <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-[#B3C8CF] transition-all duration-300 hover:shadow-xl mb-8">
                <div
                  className="flex justify-between items-center p-4 bg-gradient-to-r from-[#89A8B2] to-[#B3C8CF] cursor-pointer hover:bg-opacity-90 transition-colors"
                  onClick={() => toggleSection('complaints')}
                >
                 <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-white" />
                    <h2 className="text-xl font-semibold text-white">
                      Support History
                    </h2>
                  </div>
                  {activeSection.includes('complaints') ? (
                    <ChevronUp className="w-5 h-5 text-white" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-white" />
                  )}
                </div>
                
                {activeSection.includes('complaints') && (
                  <div className="p-6 bg-gradient-to-br from-white to-[#F1F0E8] transition-all duration-300">
                    {complaints.length > 0 ? (
                      <div className="space-y-4">
                        {complaints.map(complaint => (
                          <div 
                            key={complaint.id} 
                            className="bg-white p-4 rounded-lg border border-[#B3C8CF] hover:shadow-md transition-shadow"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="text-lg font-semibold text-[#89A8B2]">
                                {complaint.title}
                              </h3>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium
                                ${complaint.status === 'Resolved' 
                                  ? 'bg-[#89A8B2] text-white' 
                                  : 'bg-[#E5E1DA] text-[#89A8B2]'}`}>
                                {complaint.status}
                              </span>
                            </div>
                            
                            <p className="text-sm text-gray-500 mb-2">
                              Submitted: {new Date(complaint.created_at).toLocaleDateString()}
                            </p>
                            
                            <p className="text-gray-700 text-sm leading-relaxed">
                              {complaint.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <AlertCircle className="w-12 h-12 text-[#B3C8CF] mx-auto mb-3" />
                        <p>No support tickets found.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetail;

