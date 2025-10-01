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
import RecoveryTaskManagement from "./pages/crud_pages/recoveryTaskCrud.tsx"
import TaskManagement from "./pages/crud_pages/taskCrud.tsx"
import PaymentManagement from "./pages/crud_pages/paymentCrud.tsx"
import InvoiceManagement from "./pages/crud_pages/invoiceCrud.tsx"
import InvoiceGeneration from "./pages/invoiceGeneration.tsx"
import CustomerDetailPage from "./pages/customerDetailPage.tsx"
import ComplaintDetailPage from "./pages/complaint-detail-page.tsx"
import Dashboard from "./components/dashboard_components/Dashboard.tsx"
import MessageManagement from "./pages/crud_pages/messageCrud.tsx"
import UserProfile from "./pages/userProfile.tsx"
import LogManagement from "./pages/crud_pages/logsCrud.tsx"
import EmployeeDashboard from "./pages/employee_portal/dashboard.tsx"
import CustomerManagementForEmployee from "./pages/employee_portal/crud_pages/customerCrud.tsx"
import EmployeeComplaintManagement from "./pages/employee_portal/crud_pages/complaintCrud.tsx"
import EmployeeTaskManagement from "./pages/employee_portal/crud_pages/taskCrud.tsx"
import EmployeeRecoveryTaskManagement from "./pages/employee_portal/crud_pages/recoveryTaskCrud.tsx"
import EmployeeServicePlanManagement from "./pages/employee_portal/crud_pages/servicePlanCrud.tsx"
import EmployeePaymentManagement from "./pages/employee_portal/crud_pages/paymentCrud.tsx"
import EmployeeInventoryManagement from "./pages/employee_portal/crud_pages/inventoryCrud.tsx"
import EmployeeInvoiceManagement from "./pages/employee_portal/crud_pages/invoiceCrud.tsx"
import ISPManagement from "./pages/crud_pages/ispCrud.tsx"
import NewComplaintPage from "./pages/ComplaintFormPage.tsx"
import TicketDisplayPage from "./pages/TicketDisplayPage.tsx"
import BankAccountManagement from "./pages/crud_pages/BankAccountCrud.tsx"
import ISPPaymentManagement from "./pages/crud_pages/ISPPaymentCrud.tsx"
import "./styles/toastStyles.css"
import PublicInvoicePage from "./pages/PublicInvoicePage.tsx"
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
        <Route path="/customer-management" element={<PrivateRoute element={<CustomerManagement />} />} />
        <Route path="/service-plan-management" element={<PrivateRoute element={<ServicePlanManagement />} />} />
        <Route path="/complaint-management" element={<PrivateRoute element={<ComplaintManagement />} />} />
        <Route path="/complaints/new" element={<PrivateRoute element={<NewComplaintPage />} />} />
        <Route path="/complaints/:id" element={<PrivateRoute element={<ComplaintDetailPage />} />} />
        <Route path="/complaints/ticket/:ticketNumber" element={<PrivateRoute element={<TicketDisplayPage />} />} />
        <Route path="/inventory-management" element={<PrivateRoute element={<InventoryManagement />} />} />
        <Route path="/supplier-management" element={<PrivateRoute element={<SupplierManagement />} />} />
        <Route path="/area-zone-management" element={<PrivateRoute element={<AreaZoneManagement />} />} />
        <Route path="/recovery-task-management" element={<PrivateRoute element={<RecoveryTaskManagement />} />} />
        <Route path="/task-management" element={<PrivateRoute element={<TaskManagement />} />} />
        <Route path="/bank-management" element={<PrivateRoute element={<BankAccountManagement />} />} />
        <Route path="/payment-management" element={<PrivateRoute element={<PaymentManagement />} />} />
        <Route path="/isp-payment-management" element={<PrivateRoute element={<ISPPaymentManagement />} />} />
        <Route path="/billing-invoices" element={<PrivateRoute element={<InvoiceManagement />} />} />
        <Route path="/invoices/:id" element={<PrivateRoute element={<InvoiceGeneration />} />} />
        <Route path="/customers/:id" element={<PrivateRoute element={<CustomerDetailPage />} />} />
        <Route path="/reporting-analytics" element={<PrivateRoute element={<Dashboard />} />} />
        <Route path="/message-management" element={<PrivateRoute element={<MessageManagement />} />} />
        <Route path="/profile" element={<PrivateRoute element={<UserProfile />} />} />
        <Route path="/logs-management" element={<PrivateRoute element={<LogManagement />} />} />
        <Route path="/employee_portal" element={<PrivateRoute element={<EmployeeDashboard />} />} />
        <Route path="/isp-management" element={<PrivateRoute element={<ISPManagement />} />} />
        <Route path="/public/invoice/:id" element={<PublicInvoicePage />} />

        <Route
          path="/employee_portal/customer-management"
          element={<PrivateRoute element={<CustomerManagementForEmployee />} />}
        />
        <Route
          path="/employee_portal/complaint-handling"
          element={<PrivateRoute element={<EmployeeComplaintManagement />} />}
        />
        <Route
          path="/employee_portal/task-management"
          element={<PrivateRoute element={<EmployeeTaskManagement />} />}
        />
        <Route
          path="/employee_portal/recovery-task-management"
          element={<PrivateRoute element={<EmployeeRecoveryTaskManagement />} />}
        />
        <Route
          path="/employee_portal/service-plans"
          element={<PrivateRoute element={<EmployeeServicePlanManagement />} />}
        />
        <Route
          path="/employee_portal/payments-management"
          element={<PrivateRoute element={<EmployeePaymentManagement />} />}
        />
        <Route
          path="/employee_portal/inventory-management"
          element={<PrivateRoute element={<EmployeeInventoryManagement />} />}
        />
        <Route
          path="/employee_portal/invoices-management"
          element={<PrivateRoute element={<EmployeeInvoiceManagement />} />}
        />
      </Routes>
    </Router>
  )
}

export default App

