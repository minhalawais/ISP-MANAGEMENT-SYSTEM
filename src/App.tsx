import type React from "react"
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom"
import ForgotPasswordPage from "./pages/forgotPassowrdPage.tsx"
import ResetPasswordPage from "./pages/resetPasswordPage.tsx"
import EmployeeManagement from "./pages/crud_pages/employeeCrud.tsx"
import CustomerManagement from "./pages/crud_pages/customerCrud.tsx"
import ServicePlanManagement from "./pages/crud_pages/servicePlanCrud.tsx"
import Login from "./pages/login.tsx"
import ComplaintManagement from "./pages/crud_pages/complaintCrud.tsx"
import InventoryManagement from "./pages/crud_pages/inventoryCrud.tsx"
import SupplierManagement from "./pages/crud_pages/supplierCrud.tsx"
import AreaZoneManagement from "./pages/crud_pages/areaZoneCrud.tsx"
import SubZoneManagement from "./pages/crud_pages/subZoneCrud.tsx"
import VendorManagement from "./pages/crud_pages/vendorCrud.tsx"
import RecoveryTaskManagement from "./pages/crud_pages/recoveryTaskCrud.tsx"
import TaskManagement from "./pages/crud_pages/taskCrud.tsx"
import PaymentManagement from "./pages/crud_pages/paymentCrud.tsx"
import InvoiceManagement from "./pages/crud_pages/invoiceCrud.tsx"
import InvoiceGeneration from "./pages/invoiceGeneration.tsx"
import CustomerDetailPage from "./pages/customerDetailPage.tsx"
import EmployeeDetailPage from "./pages/employeeDetailPage.tsx"
import ComplaintDetailPage from "./pages/complaint-detail-page.tsx"
import ReportingPage from "./components/dashboard_components/ReportingPage.tsx"
import MessageManagement from "./pages/crud_pages/messageCrud.tsx"
import UserProfile from "./pages/userProfile.tsx"
import LogManagement from "./pages/crud_pages/logsCrud.tsx"

import ISPManagement from "./pages/crud_pages/ispCrud.tsx"
import ExpenseManagement from "./pages/crud_pages/ExpenseCrud.tsx"
import ExtraIncomeManagement from "./pages/crud_pages/ExtraIncomeCrud.tsx"
import NewComplaintPage from "./pages/ComplaintFormPage.tsx"
import TicketDisplayPage from "./pages/TicketDisplayPage.tsx"
import BankAccountManagement from "./pages/crud_pages/BankAccountCrud.tsx"
import ISPPaymentManagement from "./pages/crud_pages/ISPPaymentCrud.tsx"
import "./styles/toastStyles.css"
import PublicInvoicePage from "./pages/PublicInvoicePage.tsx"

// WhatsApp Messaging Pages
import WhatsAppQueueDashboard from "./pages/whatsapp/WhatsAppQueueDashboard.tsx"
import BulkMessageSender from "./pages/whatsapp/BulkMessageSender.tsx"
import WhatsAppSettings from "./pages/whatsapp/WhatsAppSettings.tsx"
import EmployeePortal from "./pages/EmployeePortal.tsx"
import CustomerPortalPage from "./pages/CustomerPortalPage.tsx"


const PrivateRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const isAuthenticated = !!localStorage.getItem("token")
  return isAuthenticated ? element : <Navigate to="/login" />
}

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/employee-management" element={<EmployeeManagement />} />

        <Route path="/employees/:id" element={<PrivateRoute element={<EmployeeDetailPage />} />} />
        <Route path="/customer-management" element={<PrivateRoute element={<CustomerManagement />} />} />
        <Route path="/service-plan-management" element={<PrivateRoute element={<ServicePlanManagement />} />} />
        <Route path="/complaint-management" element={<PrivateRoute element={<ComplaintManagement />} />} />
        <Route path="/complaints/new" element={<PrivateRoute element={<NewComplaintPage />} />} />
        <Route path="/complaints/:id" element={<PrivateRoute element={<ComplaintDetailPage />} />} />
        <Route path="/complaints/ticket/:ticketNumber" element={<PrivateRoute element={<TicketDisplayPage />} />} />
        <Route path="/inventory-management" element={<PrivateRoute element={<InventoryManagement />} />} />
        <Route path="/supplier-management" element={<PrivateRoute element={<SupplierManagement />} />} />
        <Route path="/area-zone-management" element={<PrivateRoute element={<AreaZoneManagement />} />} />
        <Route path="/areas" element={<PrivateRoute element={<AreaZoneManagement />} />} />
        <Route path="/areas/:areaId/sub-zones" element={<PrivateRoute element={<SubZoneManagement />} />} />
        <Route path="/recovery-task-management" element={<PrivateRoute element={<RecoveryTaskManagement />} />} />
        <Route path="/task-management" element={<PrivateRoute element={<TaskManagement />} />} />
        <Route path="/bank-management" element={<PrivateRoute element={<BankAccountManagement />} />} />
        <Route path="/payment-management" element={<PrivateRoute element={<PaymentManagement />} />} />
        <Route path="/isp-payment-management" element={<PrivateRoute element={<ISPPaymentManagement />} />} />
        <Route path="/billing-invoices" element={<PrivateRoute element={<InvoiceManagement />} />} />
        <Route path="/invoices/:id" element={<PrivateRoute element={<InvoiceGeneration />} />} />
        <Route path="/customers/:id" element={<PrivateRoute element={<CustomerDetailPage />} />} />
        
        {/* Reporting & Analytics Routes */}
        <Route path="/reporting/:section" element={<PrivateRoute element={<ReportingPage />} />} />
        <Route path="/reporting-analytics" element={<Navigate to="/reporting/executive" />} />
        <Route path="/message-management" element={<PrivateRoute element={<MessageManagement />} />} />
        <Route path="/profile" element={<PrivateRoute element={<UserProfile />} />} />
        <Route path="/logs-management" element={<PrivateRoute element={<LogManagement />} />} />

        <Route path="/isp-management" element={<PrivateRoute element={<ISPManagement />} />} />
        <Route path="/vendor-management" element={<PrivateRoute element={<VendorManagement />} />} />
        <Route path="/expense-management" element={<PrivateRoute element={<ExpenseManagement />} />} />
        <Route path="/extra-income-management" element={<PrivateRoute element={<ExtraIncomeManagement />} />} />

        <Route path="/public/invoice/:id" element={<PublicInvoicePage />} />

        {/* Customer Self-Service Portal (Public - No Auth) */}
        <Route path="/customer-portal" element={<CustomerPortalPage />} />

        {/* WhatsApp Messaging Routes */}
        <Route path="/whatsapp/queue" element={<PrivateRoute element={<WhatsAppQueueDashboard />} />} />
        <Route path="/whatsapp/bulk-sender" element={<PrivateRoute element={<BulkMessageSender />} />} />
        <Route path="/whatsapp/settings" element={<PrivateRoute element={<WhatsAppSettings />} />} />

        {/* Employee Self-Service Portal */}
        <Route path="/employee-portal" element={<PrivateRoute element={<EmployeePortal />} />} />



      </Routes>
    </Router>
  )
}

export default App

