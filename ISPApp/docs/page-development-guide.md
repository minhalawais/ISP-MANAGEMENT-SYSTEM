# Page Development Guide

> **Complete reference for developing mobile app pages from web app**

---

## 📋 Development Priority

Pages are organized by **development priority** (Phase 1 = Core, Phase 5 = Advanced). Each phase builds on the previous, ensuring a logical development flow.

---

## 🔐 Phase 1: Authentication & Foundation (Develop First)

These screens are essential - the app cannot function without them.

| Priority | Mobile Screen | Web Reference File | Role | Access |
|----------|---------------|-------------------|------|--------|
| 1.1 | Login | [login.tsx](file:///d:/PycharmProjects/isp-management-system/src/pages/login.tsx) | User authentication for admin/employee | Public |
| 1.2 | Forgot Password | [forgotPassowrdPage.tsx](file:///d:/PycharmProjects/isp-management-system/src/pages/forgotPassowrdPage.tsx) | Password reset request | Public |
| 1.3 | Reset Password | [resetPasswordPage.tsx](file:///d:/PycharmProjects/isp-management-system/src/pages/resetPasswordPage.tsx) | Set new password via token | Public |
| 1.4 | Customer Portal Login | [CustomerPortalPage.tsx](file:///d:/PycharmProjects/isp-management-system/src/pages/CustomerPortalPage.tsx) | CNIC-based customer login | Public |

**Components to Build First:**
- Text inputs, Buttons, Forms
- Secure token storage
- API client with interceptors

---

## 👥 Phase 2: Customer Management (Core Business)

Customer management is the heart of ISP operations.

| Priority | Mobile Screen | Web Reference File | Role | Access |
|----------|---------------|-------------------|------|--------|
| 2.1 | Customer List | [customerCrud.tsx](file:///d:/PycharmProjects/isp-management-system/src/pages/crud_pages/customerCrud.tsx) | List all customers with search/filter | Admin |
| 2.2 | Customer Detail | [customerDetailPage.tsx](file:///d:/PycharmProjects/isp-management-system/src/pages/customerDetailPage.tsx) | View customer full profile, invoices, payments | Admin |
| 2.3 | Customer Form | [customerCrud.tsx](file:///d:/PycharmProjects/isp-management-system/src/pages/crud_pages/customerCrud.tsx) | Create/Edit customer | Admin |

**Key Components:**
- [customerForm.tsx](file:///d:/PycharmProjects/isp-management-system/src/components/forms/customerForm.tsx)
- [CustomerPaymentHistoryTable.tsx](file:///d:/PycharmProjects/isp-management-system/src/components/CustomerPaymentHistoryTable.tsx)
- [CustomerInvoiceTable.tsx](file:///d:/PycharmProjects/isp-management-system/src/components/CustomerInvoiceTable.tsx)

---

## 💰 Phase 3: Payments & Invoices (Revenue)

Financial operations - critical for business.

| Priority | Mobile Screen | Web Reference File | Role | Access |
|----------|---------------|-------------------|------|--------|
| 3.1 | Payment List | [paymentCrud.tsx](file:///d:/PycharmProjects/isp-management-system/src/pages/crud_pages/paymentCrud.tsx) | View/record customer payments | Admin |
| 3.2 | Payment Form | [paymentCrud.tsx](file:///d:/PycharmProjects/isp-management-system/src/pages/crud_pages/paymentCrud.tsx) | Record new payment | Admin |
| 3.3 | Invoice List | [invoiceCrud.tsx](file:///d:/PycharmProjects/isp-management-system/src/pages/crud_pages/invoiceCrud.tsx) | View all invoices | Admin |
| 3.4 | Invoice Detail | [invoiceGeneration.tsx](file:///d:/PycharmProjects/isp-management-system/src/pages/invoiceGeneration.tsx) | View/print invoice | Admin |
| 3.5 | Public Invoice | [PublicInvoicePage.tsx](file:///d:/PycharmProjects/isp-management-system/src/pages/PublicInvoicePage.tsx) | Customer-facing invoice view | Public |

**Key Components:**
- [paymentForm.tsx](file:///d:/PycharmProjects/isp-management-system/src/components/forms/paymentForm.tsx)
- [invoiceForm.tsx](file:///d:/PycharmProjects/isp-management-system/src/components/forms/invoiceForm.tsx)
- [BulkInvoiceDialog.tsx](file:///d:/PycharmProjects/isp-management-system/src/components/BulkInvoiceDialog.tsx)

---

## 🎫 Phase 4: Complaints & Tasks (Operations)

Operational workflow management.

| Priority | Mobile Screen | Web Reference File | Role | Access |
|----------|---------------|-------------------|------|--------|
| 4.1 | Complaint List | [complaintCrud.tsx](file:///d:/PycharmProjects/isp-management-system/src/pages/crud_pages/complaintCrud.tsx) | View all complaints | Admin |
| 4.2 | Complaint Detail | [complaint-detail-page.tsx](file:///d:/PycharmProjects/isp-management-system/src/pages/complaint-detail-page.tsx) | Full complaint with actions | Admin |
| 4.3 | Create Complaint | [ComplaintFormPage.tsx](file:///d:/PycharmProjects/isp-management-system/src/pages/ComplaintFormPage.tsx) | Register new complaint | Admin |
| 4.4 | Ticket Display | [TicketDisplayPage.tsx](file:///d:/PycharmProjects/isp-management-system/src/pages/TicketDisplayPage.tsx) | Print ticket receipt | Admin |
| 4.5 | Task List | [taskCrud.tsx](file:///d:/PycharmProjects/isp-management-system/src/pages/crud_pages/taskCrud.tsx) | Manage tasks/assignments | Admin |
| 4.6 | Recovery Tasks | [recoveryTaskCrud.tsx](file:///d:/PycharmProjects/isp-management-system/src/pages/crud_pages/recoveryTaskCrud.tsx) | Payment recovery tracking | Admin |

**Key Components:**
- [complaintForm.tsx](file:///d:/PycharmProjects/isp-management-system/src/components/forms/complaintForm.tsx)
- [taskForm.tsx](file:///d:/PycharmProjects/isp-management-system/src/components/forms/taskForm.tsx)

---

## 👨‍💼 Phase 5: Employee Portal (Self-Service)

Employee-facing screens for field workers.

| Priority | Mobile Screen | Web Reference File | Role | Access |
|----------|---------------|-------------------|------|--------|
| 5.1 | Employee Dashboard | [EmployeePortal.tsx](file:///d:/PycharmProjects/isp-management-system/src/pages/EmployeePortal.tsx) | My tasks, complaints, stats | Employee |
| 5.2 | My Tasks | [EmployeePortal.tsx](file:///d:/PycharmProjects/isp-management-system/src/pages/EmployeePortal.tsx) | View/update assigned tasks | Employee |
| 5.3 | My Complaints | [EmployeePortal.tsx](file:///d:/PycharmProjects/isp-management-system/src/pages/EmployeePortal.tsx) | View/resolve assigned complaints | Employee |
| 5.4 | My Profile | [EmployeePortal.tsx](file:///d:/PycharmProjects/isp-management-system/src/pages/EmployeePortal.tsx) | Employee info, ledger | Employee |

**Key Components:**
- [EmployeeDashboard](file:///d:/PycharmProjects/isp-management-system/src/components/employee-portal/EmployeeDashboard.tsx)
- [MyTasks](file:///d:/PycharmProjects/isp-management-system/src/components/employee-portal/MyTasks.tsx)
- [MyComplaints](file:///d:/PycharmProjects/isp-management-system/src/components/employee-portal/MyComplaints.tsx)

---

## 🧑‍💻 Phase 6: Customer Portal (Self-Service)

Customer-facing self-service portal.

| Priority | Mobile Screen | Web Reference File | Role | Access |
|----------|---------------|-------------------|------|--------|
| 6.1 | Customer Dashboard | [CustomerPortalPage.tsx](file:///d:/PycharmProjects/isp-management-system/src/pages/CustomerPortalPage.tsx) | Account summary | Customer |
| 6.2 | My Invoices | [CustomerPortalPage.tsx](file:///d:/PycharmProjects/isp-management-system/src/pages/CustomerPortalPage.tsx) | View invoices | Customer |
| 6.3 | Payment History | [CustomerPortalPage.tsx](file:///d:/PycharmProjects/isp-management-system/src/pages/CustomerPortalPage.tsx) | View payments | Customer |
| 6.4 | My Complaints | [CustomerPortalPage.tsx](file:///d:/PycharmProjects/isp-management-system/src/pages/CustomerPortalPage.tsx) | View/create complaints | Customer |
| 6.5 | My Profile | [CustomerPortalPage.tsx](file:///d:/PycharmProjects/isp-management-system/src/pages/CustomerPortalPage.tsx) | View account info | Customer |

---

## 👔 Phase 7: Employee Management (HR)

Employee/staff management features.

| Priority | Mobile Screen | Web Reference File | Role | Access |
|----------|---------------|-------------------|------|--------|
| 7.1 | Employee List | [employeeCrud.tsx](file:///d:/PycharmProjects/isp-management-system/src/pages/crud_pages/employeeCrud.tsx) | View all employees | Admin |
| 7.2 | Employee Detail | [employeeDetailPage.tsx](file:///d:/PycharmProjects/isp-management-system/src/pages/employeeDetailPage.tsx) | Full employee profile, ledger | Admin |
| 7.3 | Employee Form | [employeeCrud.tsx](file:///d:/PycharmProjects/isp-management-system/src/pages/crud_pages/employeeCrud.tsx) | Create/Edit employee | Admin |

**Key Components:**
- [employeeForm.tsx](file:///d:/PycharmProjects/isp-management-system/src/components/forms/employeeForm.tsx)
- [EmployeeLedgerTable.tsx](file:///d:/PycharmProjects/isp-management-system/src/components/EmployeeLedgerTable.tsx)

---

## 📊 Phase 8: Analytics & Reports (Insights)

Dashboards and analytics.

| Priority | Mobile Screen | Web Reference File | Role | Access |
|----------|---------------|-------------------|------|--------|
| 8.1 | Executive Dashboard | [ReportingPage.tsx](file:///d:/PycharmProjects/isp-management-system/src/components/dashboard_components/ReportingPage.tsx) + [executive](file:///d:/PycharmProjects/isp-management-system/src/components/dashboard_components/ExecutiveDashboard.tsx) | High-level KPIs | Admin |
| 8.2 | Financial Analytics | [FinancialAnalytics.tsx](file:///d:/PycharmProjects/isp-management-system/src/components/dashboard_components/FinancialAnalytics.tsx) | Revenue, expenses | Admin |
| 8.3 | Customer Analytics | [CustomerAnalytics.tsx](file:///d:/PycharmProjects/isp-management-system/src/components/dashboard_components/CustomerAnalytics.tsx) | Customer metrics | Admin |
| 8.4 | Collections Analytics | [CollectionAnalytics.tsx](file:///d:/PycharmProjects/isp-management-system/src/components/dashboard_components/CollectionAnalytics.tsx) | Payment collection stats | Admin |

---

## 📦 Phase 9: Inventory & Assets (Equipment)

Equipment and stock management.

| Priority | Mobile Screen | Web Reference File | Role | Access |
|----------|---------------|-------------------|------|--------|
| 9.1 | Inventory List | [inventoryCrud.tsx](file:///d:/PycharmProjects/isp-management-system/src/pages/crud_pages/inventoryCrud.tsx) | View all inventory | Admin |
| 9.2 | Inventory Form | [inventoryCrud.tsx](file:///d:/PycharmProjects/isp-management-system/src/pages/crud_pages/inventoryCrud.tsx) | Add/Edit inventory | Admin |
| 9.3 | Supplier List | [supplierCrud.tsx](file:///d:/PycharmProjects/isp-management-system/src/pages/crud_pages/supplierCrud.tsx) | Manage suppliers | Admin |

---

## ⚙️ Phase 10: Settings & Configuration (Setup)

System configuration screens.

| Priority | Mobile Screen | Web Reference File | Role | Access |
|----------|---------------|-------------------|------|--------|
| 10.1 | User Profile | [userProfile.tsx](file:///d:/PycharmProjects/isp-management-system/src/pages/userProfile.tsx) | Current user settings | All |
| 10.2 | Area Management | [areaZoneCrud.tsx](file:///d:/PycharmProjects/isp-management-system/src/pages/crud_pages/areaZoneCrud.tsx) | Manage areas | Admin |
| 10.3 | Sub-Zone Management | [subZoneCrud.tsx](file:///d:/PycharmProjects/isp-management-system/src/pages/crud_pages/subZoneCrud.tsx) | Manage sub-zones | Admin |
| 10.4 | ISP Management | [ispCrud.tsx](file:///d:/PycharmProjects/isp-management-system/src/pages/crud_pages/ispCrud.tsx) | Manage ISPs | Admin |
| 10.5 | Service Plans | [servicePlanCrud.tsx](file:///d:/PycharmProjects/isp-management-system/src/pages/crud_pages/servicePlanCrud.tsx) | Manage plans | Admin |
| 10.6 | Vendor Management | [vendorCrud.tsx](file:///d:/PycharmProjects/isp-management-system/src/pages/crud_pages/vendorCrud.tsx) | Manage vendors | Admin |
| 10.7 | Bank Accounts | [BankAccountCrud.tsx](file:///d:/PycharmProjects/isp-management-system/src/pages/crud_pages/BankAccountCrud.tsx) | Manage banks | Admin |

---

## 💼 Phase 11: Financial Operations (Advanced)

Advanced financial features.

| Priority | Mobile Screen | Web Reference File | Role | Access |
|----------|---------------|-------------------|------|--------|
| 11.1 | Expense Management | [ExpenseCrud.tsx](file:///d:/PycharmProjects/isp-management-system/src/pages/crud_pages/ExpenseCrud.tsx) | Record expenses | Admin |
| 11.2 | Extra Income | [ExtraIncomeCrud.tsx](file:///d:/PycharmProjects/isp-management-system/src/pages/crud_pages/ExtraIncomeCrud.tsx) | Record extra income | Admin |
| 11.3 | ISP Payments | [ISPPaymentCrud.tsx](file:///d:/PycharmProjects/isp-management-system/src/pages/crud_pages/ISPPaymentCrud.tsx) | Payments to ISPs | Admin |

---

## 📱 Phase 12: WhatsApp & Messaging (Optional)

WhatsApp integration features.

| Priority | Mobile Screen | Web Reference File | Role | Access |
|----------|---------------|-------------------|------|--------|
| 12.1 | Message Queue | [WhatsAppQueueDashboard.tsx](file:///d:/PycharmProjects/isp-management-system/src/pages/whatsapp/WhatsAppQueueDashboard.tsx) | View message queue | Admin |
| 12.2 | Bulk Sender | [BulkMessageSender.tsx](file:///d:/PycharmProjects/isp-management-system/src/pages/whatsapp/BulkMessageSender.tsx) | Send bulk messages | Admin |
| 12.3 | WhatsApp Settings | [WhatsAppSettings.tsx](file:///d:/PycharmProjects/isp-management-system/src/pages/whatsapp/WhatsAppSettings.tsx) | Configure WhatsApp | Admin |
| 12.4 | Messages | [messageCrud.tsx](file:///d:/PycharmProjects/isp-management-system/src/pages/crud_pages/messageCrud.tsx) | Message history | Admin |

---

## 📋 Phase 13: System Administration (Last)

System-level administration.

| Priority | Mobile Screen | Web Reference File | Role | Access |
|----------|---------------|-------------------|------|--------|
| 13.1 | System Logs | [logsCrud.tsx](file:///d:/PycharmProjects/isp-management-system/src/pages/crud_pages/logsCrud.tsx) | View audit logs | Admin |

---

## 🔧 Shared Components Reference

When building any page, reference these shared components:

| Component | Web Path | Purpose |
|-----------|----------|---------|
| Table | [table.tsx](file:///d:/PycharmProjects/isp-management-system/src/components/ui/table.tsx) | Data tables |
| Dialog | [dialog.tsx](file:///d:/PycharmProjects/isp-management-system/src/components/ui/dialog.tsx) | Modals/dialogs |
| Card | [card.tsx](file:///d:/PycharmProjects/isp-management-system/src/components/ui/card.tsx) | Card containers |
| Button | [button.tsx](file:///d:/PycharmProjects/isp-management-system/src/components/ui/button.tsx) | Buttons |
| Input | [input.tsx](file:///d:/PycharmProjects/isp-management-system/src/components/ui/input.tsx) | Text inputs |
| Select | [select.tsx](file:///d:/PycharmProjects/isp-management-system/src/components/ui/select.tsx) | Dropdowns |
| Badge | [badge.tsx](file:///d:/PycharmProjects/isp-management-system/src/components/ui/badge.tsx) | Status badges |
| Toast | [toast.tsx](file:///d:/PycharmProjects/isp-management-system/src/components/ui/toast.tsx) | Notifications |

---

## 📝 How to Use This Document

1. **Pick a page** from the priority list
2. **View the web reference file** to understand structure
3. **Check the form component** if it's a CRUD page
4. **Ask me to develop it** - I'll read the web code and create the mobile version

Example: "Develop mobile page 2.1 Customer List from customerCrud.tsx"
