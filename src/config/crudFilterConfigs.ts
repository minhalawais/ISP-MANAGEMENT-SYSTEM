import {
  Users,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  AlertCircle,
  MessageSquare,
} from "lucide-react"
import type { CrudFilterConfig, QuickFilterDef } from "../types/crudFilters.ts"

const ACTIVE_INACTIVE_SELECT: QuickFilterDef = {
  id: "status_active",
  label: "Status",
  type: "select",
  field: "is_active",
  placeholder: "All statuses",
  options: [
    { value: "", label: "All statuses" },
    { value: "true", label: "Active" },
    { value: "false", label: "Inactive" },
  ],
}

const genericActiveInactiveStats = (title: string) => ({
  statCards: [
    { id: "total", label: `Total ${title}s`, tone: "neutral" as const, icon: Users, filter: { field: "is_active", value: null }, clearFields: ["is_active"] },
    { id: "active", label: `Active ${title}s`, tone: "success" as const, icon: CheckCircle2, filter: { field: "is_active", value: true } },
    { id: "inactive", label: `Inactive ${title}s`, tone: "danger" as const, icon: XCircle, filter: { field: "is_active", value: false } },
  ],
  quickFilters: [ACTIVE_INACTIVE_SELECT],
  statFilterGroupField: "is_active",
})

export const CRUD_FILTER_CONFIGS: Record<string, CrudFilterConfig> = {
  customer: {
    moduleKey: "customer",
    statFilterGroupField: "is_active",
    statCards: [
      { id: "total", label: "Total Customers", tone: "neutral", icon: Users, filter: { field: "is_active", value: null }, clearFields: ["is_active"] },
      { id: "active", label: "Active Customers", tone: "success", icon: CheckCircle2, filter: { field: "is_active", value: true } },
      { id: "inactive", label: "Inactive Customers", tone: "danger", icon: XCircle, filter: { field: "is_active", value: false } },
    ],
    quickFilters: [
      ACTIVE_INACTIVE_SELECT,
      { id: "area", label: "Area", type: "select", field: "area", placeholder: "All areas", options: [{ value: "", label: "All areas" }] },
      { id: "service_plan", label: "Plan", type: "select", field: "service_plan", placeholder: "All plans", options: [{ value: "", label: "All plans" }] },
      {
        id: "connection_type",
        label: "Connection",
        type: "select",
        field: "connection_type",
        placeholder: "All types",
        options: [
          { value: "", label: "All types" },
          { value: "internet", label: "Internet" },
          { value: "tv_cable", label: "TV Cable" },
          { value: "both", label: "Both" },
        ],
      },
    ],
  },

  invoice: {
    moduleKey: "invoice",
    statFilterGroupField: "status",
    statCards: [
      { id: "total", label: "Total Invoices", tone: "neutral", icon: FileText, filter: { field: "status", value: null }, clearFields: ["status"] },
      { id: "paid", label: "Paid Invoices", tone: "success", icon: CheckCircle2, filter: { field: "status", value: "paid" } },
      { id: "pending", label: "Pending Invoices", tone: "warning", icon: Clock, filter: { field: "status", value: "pending" } },
    ],
    quickFilters: [
      {
        id: "status",
        label: "Status",
        type: "select",
        field: "status",
        placeholder: "All statuses",
        options: [
          { value: "", label: "All statuses" },
          { value: "paid", label: "Paid" },
          { value: "pending", label: "Pending" },
        ],
      },
      {
        id: "invoice_type",
        label: "Type",
        type: "select",
        field: "invoice_type",
        placeholder: "All types",
        options: [
          { value: "", label: "All types" },
          { value: "subscription", label: "Subscription" },
          { value: "installation", label: "Installation" },
          { value: "equipment", label: "Equipment" },
          { value: "mixed", label: "Mixed" },
        ],
      },
      { id: "internet_id", label: "Internet ID", type: "text", field: "internet_id", placeholder: "Internet ID" },
    ],
  },

  payment: {
    moduleKey: "payment",
    statFilterGroupField: "status",
    statCards: [
      { id: "total", label: "Total Payments", tone: "neutral", icon: FileText, filter: { field: "status", value: null }, clearFields: ["status"] },
      { id: "active", label: "Active Payments", tone: "success", icon: CheckCircle2, filter: { field: "status", value: "paid" } },
      { id: "pending", label: "Pending Payments", tone: "warning", icon: Clock, filter: { field: "status", value: "pending" } },
    ],
    quickFilters: [
      {
        id: "status",
        label: "Status",
        type: "select",
        field: "status",
        placeholder: "All statuses",
        options: [
          { value: "", label: "All statuses" },
          { value: "paid", label: "Paid" },
          { value: "pending", label: "Pending" },
        ],
      },
      {
        id: "payment_method",
        label: "Method",
        type: "select",
        field: "payment_method",
        placeholder: "All methods",
        options: [
          { value: "", label: "All methods" },
          { value: "cash", label: "Cash" },
          { value: "bank_transfer", label: "Bank Transfer" },
          { value: "online", label: "Online" },
        ],
      },
      { id: "received_by", label: "Received by", type: "text", field: "received_by", placeholder: "Received by" },
    ],
  },

  complaint: {
    moduleKey: "complaint",
    statFilterGroupField: "status",
    statCards: [
      { id: "total", label: "Total Complaints", tone: "neutral", icon: AlertCircle, filter: { field: "status", value: null }, clearFields: ["status"] },
      { id: "open", label: "Open", tone: "danger", icon: XCircle, filter: { field: "status", value: "open" } },
      { id: "in_progress", label: "In Progress", tone: "warning", icon: Clock, filter: { field: "status", value: "in_progress" } },
      { id: "resolved", label: "Resolved", tone: "success", icon: CheckCircle2, filter: { field: "status", value: "resolved" } },
    ],
    quickFilters: [
      {
        id: "status",
        label: "Status",
        type: "select",
        field: "status",
        placeholder: "All statuses",
        options: [
          { value: "", label: "All statuses" },
          { value: "open", label: "Open" },
          { value: "in_progress", label: "In Progress" },
          { value: "resolved", label: "Resolved" },
          { value: "closed", label: "Closed" },
        ],
      },
      { id: "assigned_to_name", label: "Assigned to", type: "text", field: "assigned_to_name", placeholder: "Technician" },
      { id: "internet_id", label: "Internet ID", type: "text", field: "internet_id", placeholder: "Internet ID" },
    ],
  },

  logs: {
    moduleKey: "logs",
    statFilterGroupField: "action",
    statCards: [
      { id: "total", label: "Total Logs", tone: "neutral", icon: FileText, filter: { field: "action", value: null }, clearFields: ["action"] },
      { id: "active", label: "Active Logs", tone: "success", icon: CheckCircle2, clickable: false },
      { id: "inactive", label: "Inactive Logs", tone: "danger", icon: XCircle, clickable: false },
    ],
    quickFilters: [
      {
        id: "action",
        label: "Action",
        type: "select",
        field: "action",
        placeholder: "All actions",
        options: [
          { value: "", label: "All actions" },
          { value: "CREATE", label: "Create" },
          { value: "UPDATE", label: "Update" },
          { value: "DELETE", label: "Delete" },
        ],
      },
      { id: "table_name", label: "Table", type: "text", field: "table_name", placeholder: "Table name" },
      { id: "user_name", label: "User", type: "text", field: "user_name", placeholder: "User name" },
    ],
  },

  employee: {
    moduleKey: "employee",
    ...genericActiveInactiveStats("Employee"),
    quickFilters: [
      ACTIVE_INACTIVE_SELECT,
      {
        id: "role",
        label: "Role",
        type: "select",
        field: "role",
        placeholder: "All roles",
        options: [
          { value: "", label: "All roles" },
          { value: "technician", label: "Technician" },
          { value: "manager", label: "Manager" },
          { value: "company_owner", label: "Owner" },
          { value: "recovery_officer", label: "Recovery Officer" },
        ],
      },
      { id: "contact_number", label: "Phone", type: "text", field: "contact_number", placeholder: "Phone" },
    ],
  },

  "service-plan": {
    moduleKey: "service-plan",
    ...genericActiveInactiveStats("Service Plan"),
    quickFilters: [
      ACTIVE_INACTIVE_SELECT,
      { id: "isp_name", label: "ISP", type: "text", field: "isp_name", placeholder: "ISP" },
      { id: "name", label: "Plan name", type: "text", field: "name", placeholder: "Plan name" },
    ],
  },

  inventory: {
    moduleKey: "inventory",
    ...genericActiveInactiveStats("Item"),
    quickFilters: [
      {
        id: "item_type",
        label: "Item type",
        type: "select",
        field: "item_type",
        placeholder: "All types",
        options: [
          { value: "", label: "All types" },
          { value: "Fiber Cable", label: "Fiber Cable" },
          { value: "Router", label: "Router" },
          { value: "ONT", label: "ONT" },
          { value: "ONU", label: "ONU" },
          { value: "STB", label: "STB" },
        ],
      },
      { id: "vendor_name", label: "Vendor", type: "text", field: "vendor_name", placeholder: "Vendor" },
      ACTIVE_INACTIVE_SELECT,
    ],
  },

  supplier: {
    moduleKey: "supplier",
    ...genericActiveInactiveStats("Supplier"),
    quickFilters: [
      ACTIVE_INACTIVE_SELECT,
      { id: "name", label: "Name", type: "text", field: "name", placeholder: "Name" },
      { id: "contact_person", label: "Contact", type: "text", field: "contact_person", placeholder: "Contact person" },
    ],
  },

  "area-zone": {
    moduleKey: "area-zone",
    ...genericActiveInactiveStats("Area"),
    quickFilters: [
      ACTIVE_INACTIVE_SELECT,
      { id: "name", label: "Name", type: "text", field: "name", placeholder: "Area name" },
    ],
  },

  "recovery-task": {
    moduleKey: "recovery-task",
    statFilterGroupField: "status",
    statCards: [
      { id: "total", label: "Total Tasks", tone: "neutral", icon: FileText, filter: { field: "status", value: null }, clearFields: ["status"] },
      { id: "pending", label: "Pending", tone: "warning", icon: Clock, filter: { field: "status", value: "pending" } },
      { id: "completed", label: "Completed", tone: "success", icon: CheckCircle2, filter: { field: "status", value: "completed" } },
    ],
    quickFilters: [
      {
        id: "status",
        label: "Status",
        type: "select",
        field: "status",
        placeholder: "All statuses",
        options: [
          { value: "", label: "All statuses" },
          { value: "pending", label: "Pending" },
          { value: "in_progress", label: "In Progress" },
          { value: "completed", label: "Completed" },
          { value: "cancelled", label: "Cancelled" },
        ],
      },
      { id: "assigned_to_name", label: "Assigned to", type: "text", field: "assigned_to_name", placeholder: "Assignee" },
    ],
  },

  task: {
    moduleKey: "task",
    statFilterGroupField: "status",
    statCards: [
      { id: "total", label: "Total Tasks", tone: "neutral", icon: FileText, filter: { field: "status", value: null }, clearFields: ["status"] },
      { id: "pending", label: "Pending", tone: "warning", icon: Clock, filter: { field: "status", value: "pending" } },
      { id: "completed", label: "Completed", tone: "success", icon: CheckCircle2, filter: { field: "status", value: "completed" } },
    ],
    quickFilters: [
      {
        id: "status",
        label: "Status",
        type: "select",
        field: "status",
        placeholder: "All statuses",
        options: [
          { value: "", label: "All statuses" },
          { value: "pending", label: "Pending" },
          { value: "in_progress", label: "In Progress" },
          { value: "completed", label: "Completed" },
          { value: "cancelled", label: "Cancelled" },
        ],
      },
      {
        id: "priority",
        label: "Priority",
        type: "select",
        field: "priority",
        placeholder: "All priorities",
        options: [
          { value: "", label: "All priorities" },
          { value: "low", label: "Low" },
          { value: "medium", label: "Medium" },
          { value: "high", label: "High" },
          { value: "critical", label: "Critical" },
        ],
      },
      {
        id: "task_type",
        label: "Type",
        type: "select",
        field: "task_type",
        placeholder: "All types",
        options: [
          { value: "", label: "All types" },
          { value: "installation", label: "Installation" },
          { value: "maintenance", label: "Maintenance" },
          { value: "complaint", label: "Complaint" },
          { value: "inspection", label: "Inspection" },
        ],
      },
    ],
  },

  message: {
    moduleKey: "message",
    statFilterGroupField: "is_read",
    statCards: [
      { id: "total", label: "Total Messages", tone: "neutral", icon: MessageSquare, filter: { field: "is_read", value: null }, clearFields: ["is_read"] },
      { id: "unread", label: "Unread", tone: "warning", icon: Clock, filter: { field: "is_read", value: false } },
      { id: "read", label: "Read", tone: "success", icon: CheckCircle2, filter: { field: "is_read", value: true } },
    ],
    quickFilters: [
      {
        id: "is_read",
        label: "Read status",
        type: "select",
        field: "is_read",
        placeholder: "All",
        options: [
          { value: "", label: "All" },
          { value: "true", label: "Read" },
          { value: "false", label: "Unread" },
        ],
      },
      { id: "sender", label: "Sender", type: "text", field: "sender", placeholder: "Sender" },
    ],
  },

  "isp-payment": {
    moduleKey: "isp-payment",
    ...genericActiveInactiveStats("ISP Payment"),
    quickFilters: [
      { id: "isp_name", label: "ISP", type: "text", field: "isp_name", placeholder: "ISP" },
      {
        id: "payment_type",
        label: "Type",
        type: "select",
        field: "payment_type",
        placeholder: "All types",
        options: [
          { value: "", label: "All types" },
          { value: "bandwidth", label: "Bandwidth" },
          { value: "fixed", label: "Fixed" },
        ],
      },
      { id: "status", label: "Status", type: "text", field: "status", placeholder: "Status" },
    ],
  },

  expense: {
    moduleKey: "expense",
    ...genericActiveInactiveStats("Expense"),
    quickFilters: [
      { id: "expense_type_name", label: "Type", type: "text", field: "expense_type_name", placeholder: "Expense type" },
      {
        id: "payment_method",
        label: "Method",
        type: "select",
        field: "payment_method",
        placeholder: "All methods",
        options: [
          { value: "", label: "All methods" },
          { value: "cash", label: "Cash" },
          { value: "bank_transfer", label: "Bank Transfer" },
        ],
      },
      { id: "vendor_payee", label: "Payee", type: "text", field: "vendor_payee", placeholder: "Payee" },
    ],
  },

  "extra-income": {
    moduleKey: "extra-income",
    ...genericActiveInactiveStats("Income"),
    quickFilters: [
      { id: "income_type_name", label: "Type", type: "text", field: "income_type_name", placeholder: "Income type" },
      {
        id: "payment_method",
        label: "Method",
        type: "select",
        field: "payment_method",
        placeholder: "All methods",
        options: [
          { value: "", label: "All methods" },
          { value: "cash", label: "Cash" },
          { value: "bank_transfer", label: "Bank Transfer" },
        ],
      },
    ],
  },

  "bank-account": {
    moduleKey: "bank-account",
    ...genericActiveInactiveStats("Account"),
    quickFilters: [
      ACTIVE_INACTIVE_SELECT,
      { id: "bank_name", label: "Bank", type: "text", field: "bank_name", placeholder: "Bank name" },
    ],
  },

  vendor: {
    moduleKey: "vendor",
    ...genericActiveInactiveStats("Vendor"),
    quickFilters: [
      ACTIVE_INACTIVE_SELECT,
      { id: "name", label: "Name", type: "text", field: "name", placeholder: "Vendor name" },
      { id: "phone", label: "Phone", type: "text", field: "phone", placeholder: "Phone" },
    ],
  },

  isp: {
    moduleKey: "isp",
    ...genericActiveInactiveStats("ISP"),
    quickFilters: [
      ACTIVE_INACTIVE_SELECT,
      { id: "name", label: "Name", type: "text", field: "name", placeholder: "ISP name" },
      { id: "contact_person", label: "Contact", type: "text", field: "contact_person", placeholder: "Contact person" },
    ],
  },

  "sub-zone": {
    moduleKey: "sub-zone",
    ...genericActiveInactiveStats("Sub Zone"),
    quickFilters: [
      ACTIVE_INACTIVE_SELECT,
      { id: "name", label: "Name", type: "text", field: "name", placeholder: "Sub zone name" },
    ],
  },
}

export function getCrudFilterConfig(moduleKey: string): CrudFilterConfig {
  return (
    CRUD_FILTER_CONFIGS[moduleKey] ?? {
      moduleKey,
      ...genericActiveInactiveStats("Record"),
    }
  )
}

export function mergeQuickFilterOptions(
  config: CrudFilterConfig,
  dynamicOptions: Record<string, { value: string; label: string }[]>,
): QuickFilterDef[] {
  return config.quickFilters.map((qf) => {
    if (qf.type === "select" && dynamicOptions[qf.field]) {
      const base = qf.options.filter((o) => o.value === "")
      return { ...qf, options: [...base, ...dynamicOptions[qf.field]] }
    }
    return qf
  })
}
