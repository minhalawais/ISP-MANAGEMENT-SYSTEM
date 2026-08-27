import React, { Suspense } from "react"
import { BrowserRouter as Router, Route, Routes, Navigate, Outlet } from "react-router-dom"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { CompanyProvider } from "./context/CompanyContext.tsx"
import { resolveMarketingHost } from "./marketing/resolveMarketingHost.ts"
import { getRole, getToken } from "./utils/auth.ts"
import {
  ADMIN_PORTAL_ROLES,
  EMPLOYEE_PORTAL_ROLES,
  getAuthenticatedHomeRoute,
  LOGIN_ROUTE,
} from "./utils/authRedirects.ts"
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
import VendorDashboardPage from "./pages/VendorDashboardPage.tsx"
import RecoveryTaskManagement from "./pages/crud_pages/recoveryTaskCrud.tsx"
import TaskManagement from "./pages/crud_pages/taskCrud.tsx"
import PaymentManagement from "./pages/crud_pages/paymentCrud.tsx"
import InvoiceManagement from "./pages/crud_pages/invoiceCrud.tsx"
import InvoiceGeneration from "./pages/invoiceGeneration.tsx"
import CustomerDetailPage from "./pages/customerDetailPage.tsx"
import EmployeeDetailPage from "./pages/employeeDetailPage.tsx"
import EmployeePortalAccessPage from "./pages/EmployeePortalAccessPage.tsx"
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
import EmployeeCustomerDetailPage from "./pages/EmployeeCustomerDetailPage.tsx"
import CustomerPortalPage from "./pages/CustomerPortalPage.tsx"
import NotificationsPage from "./pages/NotificationsPage.tsx"
import AdminPortalLayout, { StaffAwareAdminLayout } from "./layouts/AdminPortalLayout.tsx"

// Code-split so the marketing theme/CSS and components never ship in the
// admin app's bundle unless a vendor domain actually renders them.
const MarketingSiteRouter = React.lazy(() => import("./marketing/MarketingSiteRouter.tsx"))

const PrivateRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const isAuthenticated = !!getToken()
  return isAuthenticated ? element : <Navigate to={LOGIN_ROUTE} replace />
}

/** Requires auth + an allowed role. Unauthorized roles are sent to their home portal. */
const RoleRoute: React.FC<{ element: React.ReactElement; allowedRoles: Set<string> }> = ({
  element,
  allowedRoles,
}) => {
  if (!getToken()) {
    return <Navigate to={LOGIN_ROUTE} replace />
  }
  const role = getRole()
  if (!role || !allowedRoles.has(role)) {
    return <Navigate to={getAuthenticatedHomeRoute() ?? LOGIN_ROUTE} replace />
  }
  return element
}

const AdminRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => (
  <RoleRoute element={element} allowedRoles={ADMIN_PORTAL_ROLES} />
)

const EmployeeRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => (
  <RoleRoute element={element} allowedRoles={EMPLOYEE_PORTAL_ROLES} />
)

const StaffRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => (
  <RoleRoute
    element={element}
    allowedRoles={new Set([...ADMIN_PORTAL_ROLES, ...EMPLOYEE_PORTAL_ROLES])}
  />
)

const GuestRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const homeRoute = getAuthenticatedHomeRoute()
  return homeRoute ? <Navigate to={homeRoute} replace /> : element
}

const RootRedirect: React.FC = () => {
  const homeRoute = getAuthenticatedHomeRoute()
  return <Navigate to={homeRoute ?? LOGIN_ROUTE} replace />
}

const App: React.FC = () => {
  const hostname = window.location.hostname
  const pathname = window.location.pathname
  const isCustomerPortal = hostname.includes("customer.")
  const isPortalPath = pathname === "/admin" || pathname.startsWith("/admin/") || pathname.startsWith("/customer-portal") || pathname.startsWith("/public/invoice/")
  const marketingSiteHost = !isCustomerPortal && !isPortalPath
    ? resolveMarketingHost(hostname, window.location.search)
    : null

  if (!isCustomerPortal && marketingSiteHost) {
    return (
      <Suspense
        fallback={
          <div style={{ minHeight: "100vh", background: "#f8f8f6" }} />
        }
      >
        <MarketingSiteRouter siteHost={marketingSiteHost} />
      </Suspense>
    )
  }

  if (isCustomerPortal) {
    return (
      <CompanyProvider>
        <Router>
          <Routes>
            <Route path="/public/invoice/:id" element={<PublicInvoicePage />} />
            <Route path="*" element={<CustomerPortalPage />} />
          </Routes>
          <ToastContainer
            position="top-right"
            autoClose={4000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable={false}
            pauseOnHover
            theme="light"
            limit={4}
            toastClassName="fos-toast"
            bodyClassName="fos-toast-body"
          />
        </Router>
      </CompanyProvider>
    )
  }

  return (
    <CompanyProvider>
      <Router>
        <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/admin" element={<GuestRoute element={<Login />} />} />
        <Route path="/login" element={<Navigate to={LOGIN_ROUTE} replace />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

        {/* Admin + shared staff shell — one layout instance so sidebar state survives */}
        <Route element={<StaffAwareAdminLayout />}>
          <Route element={<AdminRoute element={<Outlet />} />}>
            <Route path="/employee-management" element={<EmployeeManagement />} />
            <Route path="/employees/:id" element={<EmployeeDetailPage />} />
            <Route path="/employees/:id/portal-access" element={<EmployeePortalAccessPage />} />
            <Route path="/customer-management" element={<CustomerManagement />} />
            <Route path="/service-plan-management" element={<ServicePlanManagement />} />
            <Route path="/complaint-management" element={<ComplaintManagement />} />
            <Route path="/complaints/new" element={<NewComplaintPage />} />
            <Route path="/complaints/:id" element={<ComplaintDetailPage />} />
            <Route path="/complaints/ticket/:ticketNumber" element={<TicketDisplayPage />} />
            <Route path="/inventory-management" element={<InventoryManagement />} />
            <Route path="/supplier-management" element={<SupplierManagement />} />
            <Route path="/area-zone-management" element={<AreaZoneManagement />} />
            <Route path="/areas" element={<AreaZoneManagement />} />
            <Route path="/areas/:areaId/sub-zones" element={<SubZoneManagement />} />
            <Route path="/recovery-task-management" element={<RecoveryTaskManagement />} />
            <Route path="/task-management" element={<TaskManagement />} />
            <Route path="/bank-management" element={<BankAccountManagement />} />
            <Route path="/payment-management" element={<PaymentManagement />} />
            <Route path="/isp-payment-management" element={<ISPPaymentManagement />} />
            <Route path="/billing-invoices" element={<InvoiceManagement />} />
            <Route path="/customers/:id" element={<CustomerDetailPage />} />
            <Route path="/reporting/:section" element={<ReportingPage />} />
            <Route path="/reporting-analytics" element={<Navigate to="/reporting/executive" replace />} />
            <Route path="/message-management" element={<MessageManagement />} />
            <Route path="/logs-management" element={<LogManagement />} />
            <Route path="/isp-management" element={<ISPManagement />} />
            <Route path="/vendor-management" element={<VendorManagement />} />
            <Route path="/vendors/:vendorId/dashboard" element={<VendorDashboardPage />} />
            <Route path="/expense-management" element={<ExpenseManagement />} />
            <Route path="/extra-income-management" element={<ExtraIncomeManagement />} />
            <Route path="/whatsapp/queue" element={<WhatsAppQueueDashboard />} />
            <Route path="/whatsapp/bulk-sender" element={<BulkMessageSender />} />
            <Route path="/whatsapp/settings" element={<WhatsAppSettings />} />
            <Route path="/profile" element={<UserProfile />} />
          </Route>
          <Route element={<StaffRoute element={<Outlet />} />}>
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/invoices/:id" element={<InvoiceGeneration />} />
          </Route>
        </Route>

        <Route path="/public/invoice/:id" element={<PublicInvoicePage />} />

        {/* Customer Self-Service Portal (Public - No Auth) */}
        <Route path="/customer-portal" element={<CustomerPortalPage />} />

        {/* Employee Self-Service Portal */}
        <Route path="/employee-portal" element={<EmployeeRoute element={<EmployeePortal />} />} />
        <Route
          path="/employee-portal/customers/:id"
          element={<EmployeeRoute element={<EmployeeCustomerDetailPage />} />}
        />



        </Routes>
        <ToastContainer
          position="top-right"
          autoClose={4000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable={false}
          pauseOnHover
          theme="light"
          limit={4}
          toastClassName="fos-toast"
          bodyClassName="fos-toast-body"
        />
      </Router>
    </CompanyProvider>
  )
}

export default App
