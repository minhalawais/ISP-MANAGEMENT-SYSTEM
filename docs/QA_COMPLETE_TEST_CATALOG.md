# ISP Management App — Complete QA Test Catalog

**Scope:** Every admin CRUD module, shared table chrome, reporting/ledger, employee portal, customer portal, vendor flows, marketing site, public invoice, auth/host binding, notifications, WhatsApp, and background workers.

**How to use:** Each case is `TC-<AREA>-###`. Mark Pass / Fail / Blocked. Prefer real company + vendor + employee + customer fixtures.

**Roles used in cases**

| Code | Role |
|------|------|
| SA | `super_admin` |
| CO | `company_owner` |
| MG | `manager` |
| AU | `auditor` |
| EM | `employee` |
| TE | `technician` |
| RA | `recovery_agent` |
| CU | `customer` (customer portal JWT) |

---

## 0. Shared CRUD baseline (apply to every generic CRUD page)

Modules using `CRUDPage` / specialized shells inherit these unless noted.

| ID | Feature | Steps | Expected |
|----|---------|-------|----------|
| TC-CRUD-001 | Page load | Open module route as CO | Title, toolbar, table, stats (if configured) render; no console/API errors |
| TC-CRUD-002 | Search | Type query matching name/id/phone | Matching rows; period scope expands for text search when configured |
| TC-CRUD-003 | Search clear | Clear search | Full filtered set restored |
| TC-CRUD-004 | Stat card filter | Click each stat card | Table filters to that bucket; active card highlighted; Total clears status filter |
| TC-CRUD-005 | Quick filter select | Change each select/text quick filter | Rows update; combine with search |
| TC-CRUD-006 | Quick filter clear | Reset filters | All rows for current period |
| TC-CRUD-007 | Period current month | Set current month | Only rows in month (PKT) for date field |
| TC-CRUD-008 | Period previous month | Set previous month | Correct prior month |
| TC-CRUD-009 | Period custom range | Pick from/to | Inclusive range on date field |
| TC-CRUD-010 | Period all | Set All | All-time rows (or server all) |
| TC-CRUD-011 | Add open | Click Add | Modal/form opens with empty defaults |
| TC-CRUD-012 | Add validation | Submit empty/invalid | Field errors; no create |
| TC-CRUD-013 | Add success | Valid submit | Toast; row appears; modal closes |
| TC-CRUD-014 | Edit open | Row Edit | Form prefilled |
| TC-CRUD-015 | Edit save | Change field + save | Persists; table refresh |
| TC-CRUD-016 | Delete confirm | Delete → cancel | No delete |
| TC-CRUD-017 | Delete success | Delete → confirm | Soft/hard delete per module; row gone or inactive |
| TC-CRUD-018 | Row multi-checkbox | Select 1, select all page, deselect | Selection count matches |
| TC-CRUD-019 | Bulk activate | Select inactive → Activate | Status active; toast |
| TC-CRUD-020 | Bulk deactivate | Select active → Deactivate | Status inactive; toast |
| TC-CRUD-021 | Bulk empty | Bulk action with 0 selected | Buttons disabled / no-op |
| TC-CRUD-022 | Pagination / scroll | Large dataset | Navigate pages or scroll loads correctly |
| TC-CRUD-023 | Unauthorized role | Open as EM/TE/RA | Redirect to employee portal / forbidden |
| TC-CRUD-024 | AU read constraints | Open as AU | List ok; write denied if API enforces |
| TC-CRUD-025 | Concurrent edit | Two tabs edit same row | Last write or conflict handled without crash |

---

## 1. Admin CRUD modules

### 1.1 Employee Management — `/employee-management`

| ID | Feature | Steps | Expected |
|----|---------|-------|----------|
| TC-EMP-001 | Baseline CRUD | Run TC-CRUD-001…025 | Pass |
| TC-EMP-002 | Filters | Role, status, phone | Correct subsets |
| TC-EMP-003 | Credentials on create | Create employee | Credentials modal with username/password |
| TC-EMP-004 | Manage credentials | Open credentials action | Reset/view works |
| TC-EMP-005 | View profile | Open `/employees/:id` | Profile, related data, ledger section |
| TC-EMP-006 | Portal access page | `/employees/:id/portal-access` | Modules, areas, sub-zones, scope flags save |
| TC-EMP-007 | Portal access OFF | Disable Tasks module → login as that EM | Tasks hidden; API rejects if called |
| TC-EMP-008 | CNIC / phone validation | Invalid formats | Blocked with message |
| TC-EMP-009 | File uploads | Upload allowed docs | Stored; preview if supported |
| TC-EMP-010 | Role assignment | Set technician / recovery_agent | Login lands on employee portal |

### 1.2 Customer Management — `/customer-management`

| ID | Feature | Steps | Expected |
|----|---------|-------|----------|
| TC-CUS-001 | Baseline + export CSV | Export with filters | CSV downloads filtered set |
| TC-CUS-002 | Filters | Status, area, plan, connection_type | Correct |
| TC-CUS-003 | Bulk add | Enhanced bulk add modal | Valid rows created; invalid rows reported |
| TC-CUS-004 | Portal credentials | Generate/reset portal password | Customer can login with CNIC+password |
| TC-CUS-005 | CNIC image viewer | Open front/back | ImageViewer works |
| TC-CUS-006 | Detail page | `/customers/:id` | Overview, invoices, payments, complaints, tasks, inventory |
| TC-CUS-007 | Packages / technicians | Assign packages & primary tech | Saved; used in complaint auto-assign |
| TC-CUS-008 | GPS / address | Set coords | Persist |
| TC-CUS-009 | Activate/deactivate | Bulk + single | Portal login blocked when inactive |
| TC-CUS-010 | FormData uploads | CNIC/agreement | Paths saved |

### 1.3 Service Plan — `/service-plan-management`

| ID | Feature | Steps | Expected |
|----|---------|-------|----------|
| TC-PLN-001 | Baseline CRUD | — | Pass |
| TC-PLN-002 | Link to ISP | Assign ISP | Filter by ISP works |
| TC-PLN-003 | Price/speed | Create plan | Used in invoices & marketing catalog |
| TC-PLN-004 | Deactivate plan | Deactivate | Still historical; not offered for new assigns if UI filters active |

### 1.4 Vendor Management — `/vendor-management`

| ID | Feature | Steps | Expected |
|----|---------|-------|----------|
| TC-VEN-001 | Baseline CRUD | — | Pass |
| TC-VEN-002 | Create with domain | Set primary host e.g. `vendor.example.com` | `company_hosts` row; FormData ok |
| TC-VEN-003 | Domain validation | Bad host / URL with path | Rejected |
| TC-VEN-004 | Dashboard | `/vendors/:id/dashboard` | KPIs, trends, account info |
| TC-VEN-005 | Reset credentials | Reset portal password | New password shown; vendor can login |
| TC-VEN-006 | Suspend vendor | Set inactive | Vendor login blocked |
| TC-VEN-007 | Reactivate | Set active | Login works again |
| TC-VEN-008 | Host login allow | Login as vendor CO on bound host | Success |
| TC-VEN-009 | Host login deny | Same user on wrong host / nexus without site_host | 403 “can only sign in at …” |
| TC-VEN-010 | Localhost login | Local SPA + local API | Allowed (dev bypass) |
| TC-VEN-011 | Spoof localhost | Remote API + `site_host=localhost` | Denied |
| TC-VEN-012 | Marketing site | Open vendor host | Marketing pages load for that company |

### 1.5 Supplier — `/supplier-management`

| ID | Feature | Steps | Expected |
|----|---------|-------|----------|
| TC-SUP-001 | Baseline CRUD | — | Pass |
| TC-SUP-002 | Filters name/contact | — | Pass |
| TC-SUP-003 | Link inventory | Use supplier on inventory item | FK ok |

### 1.6 ISP — `/isp-management`

| ID | Feature | Steps | Expected |
|----|---------|-------|----------|
| TC-ISP-001 | Baseline CRUD | — | Pass |
| TC-ISP-002 | Link service plans / customers | — | Cascades in filters |
| TC-ISP-003 | ISP payments use ISP | Create ISP payment | Dropdown lists ISP |

### 1.7 Payments — `/payment-management`

| ID | Feature | Steps | Expected |
|----|---------|-------|----------|
| TC-PAY-001 | Baseline + period server | Month switch | Server-scoped list |
| TC-PAY-002 | Export CSV | — | Server export |
| TC-PAY-003 | Filters | Status, method, received_by | Pass |
| TC-PAY-004 | Stat amounts | Check PKR on cards | Match filtered totals |
| TC-PAY-005 | Add paid payment | Invoice remaining updates | Invoice paid/partial |
| TC-PAY-006 | Pending payment | Create pending | Appears pending; verify modal |
| TC-PAY-007 | Verify approve | Approve pending | Status paid; bank balance if bank_transfer |
| TC-PAY-008 | Verify reject | Reject with reason | Rejected; invoice unchanged |
| TC-PAY-009 | Proof viewer | Open proof | Image loads (auth blob) |
| TC-PAY-010 | Bulk delete | CO/MG/SA select → bulk delete confirm | Deleted; others forbidden |
| TC-PAY-011 | Bulk act/deact | — | Pass |
| TC-PAY-012 | Method cash/bank | Bank requires account | Validation |

### 1.8 ISP Payments — `/isp-payment-management`

| ID | Feature | Steps | Expected |
|----|---------|-------|----------|
| TC-ISPP-001 | Baseline + month period | — | Pass |
| TC-ISPP-002 | Proof upload/view | — | Pass |
| TC-ISPP-003 | Filters ISP/type/status | — | Pass |

### 1.9 Billing & Invoices — `/billing-invoices`

| ID | Feature | Steps | Expected |
|----|---------|-------|----------|
| TC-INV-001 | Baseline + server period | — | Pass |
| TC-INV-002 | Export CSV | — | Pass |
| TC-INV-003 | Filters status/type/internet_id | — | Pass |
| TC-INV-004 | Add invoice lines | Subscription + equipment mix | Totals correct; charge types |
| TC-INV-005 | Edit invoice | Change lines | Recalc |
| TC-INV-006 | Bulk delete | Role-gated confirm | Works for CO; denied EM |
| TC-INV-007 | Generate monthly | Bulk invoice modal | Creates; skips duplicates; notification `invoice.bulk_generated` |
| TC-INV-008 | Unified payment | Pending invoice → pay | Payment created; status updates |
| TC-INV-009 | View invoice | `/invoices/:id` | Render/print |
| TC-INV-010 | Public share / WhatsApp | Share link | Opens public page; optional WA enqueue |
| TC-INV-011 | Zero-amount | Edge invoice | No WA auto-send if skipped by policy |
| TC-INV-012 | Complaint billing invoice | Resolve complaint with billing | Linked `complaint_id` |

### 1.10 Bank Accounts — `/bank-management`

| ID | Feature | Steps | Expected |
|----|---------|-------|----------|
| TC-BNK-001 | Baseline CRUD | — | Pass |
| TC-BNK-002 | QR upload | Upload image | Column shows Yes; public invoice shows QR |
| TC-BNK-003 | Balance credit | Paid bank_transfer payment | Balance increases |
| TC-BNK-004 | Active only on public | Deactivate bank | Hidden from public list |

### 1.11 Expenses — `/expense-management`

| ID | Feature | Steps | Expected |
|----|---------|-------|----------|
| TC-EXP-001 | Baseline + month | — | Pass |
| TC-EXP-002 | Proof view | — | Pass |
| TC-EXP-003 | Manage expense types | Add/edit/delete type; `is_employee_payment` | Nested CRUD works |
| TC-EXP-004 | Filters type/method/payee | — | Pass |
| TC-EXP-005 | Ledger impact | Employee payment type | Ledger entry if applicable |

### 1.12 Extra Income — `/extra-income-management`

| ID | Feature | Steps | Expected |
|----|---------|-------|----------|
| TC-INC-001 | Baseline + month | — | Pass |
| TC-INC-002 | Manage income types | Nested CRUD | Pass |
| TC-INC-003 | Proof | — | Pass |

### 1.13 Complaints — `/complaint-management`

| ID | Feature | Steps | Expected |
|----|---------|-------|----------|
| TC-CMP-001 | Baseline + export | — | Pass |
| TC-CMP-002 | Add redirects | Add → `/complaints/new` | Standalone form |
| TC-CMP-003 | Category required | — | Validation |
| TC-CMP-004 | Attachment | Upload image/pdf | Preview in view modal |
| TC-CMP-005 | View modal | Open complaint | Full detail, activity, resolve CTA |
| TC-CMP-006 | Assign | Change assignee | In-app notif; staff WA if prefs on |
| TC-CMP-007 | Resolve with billing | Materials + cash + proof | Invoice/payment/material usages; WA resolve to customer |
| TC-CMP-008 | Collections dock | Settle complaint cash | Settlement flow |
| TC-CMP-009 | Ticket page | `/complaints/ticket/:n` | Display/print |
| TC-CMP-010 | Detail route | `/complaints/:id` | Loads |
| TC-CMP-011 | Filters status/assignee/internet_id | — | Pass |
| TC-CMP-012 | WA created | Lodge complaint | Queue row `complaint_created`, `bypass_send_window` |
| TC-CMP-013 | WA resolved | Resolve | Queue `complaint_resolved` |

### 1.14 Tasks — `/task-management`

| ID | Feature | Steps | Expected |
|----|---------|-------|----------|
| TC-TSK-001 | Baseline CRUD | — | Pass |
| TC-TSK-002 | Multi assignee | Assign 2 employees | Both see in portal if scoped |
| TC-TSK-003 | Block recovery type | Select recovery | Error: use Recovery Tasks |
| TC-TSK-004 | Priority/status filters | — | Pass |
| TC-TSK-005 | Assign notif | Create assigned | `task.assigned` + optional staff WA |
| TC-TSK-006 | Complete notif | Mark completed | `task.completed` |

### 1.15 Recovery Tasks — `/recovery-task-management`

| ID | Feature | Steps | Expected |
|----|---------|-------|----------|
| TC-REC-001 | Baseline CRUD | — | Pass |
| TC-REC-002 | Bulk add | Multi-invoice assign | Creates many; one-open-per-invoice enforced |
| TC-REC-003 | Duplicate open | Second open on same invoice | Rejected by unique index/API |
| TC-REC-004 | Collections dock | Filter all/assigned/adhoc | Lists |
| TC-REC-005 | Settle collected | Owner settle | Payment verified/settled; ledger released |
| TC-REC-006 | Proof viewer | — | Pass |
| TC-REC-007 | Assign notif | — | `recovery.assigned` |
| TC-REC-008 | Collected notif | Employee collect | `recovery.collected` |
| TC-REC-009 | Settled notif | Settle | `recovery.settled` |

### 1.16 Inventory — `/inventory-management`

| ID | Feature | Steps | Expected |
|----|---------|-------|----------|
| TC-INVY-001 | Baseline CRUD | — | Pass |
| TC-INVY-002 | Attribute columns | Item types | Dynamic attrs display |
| TC-INVY-003 | View transactions | Modal | Stock movements |
| TC-INVY-004 | View assignments | Custody modal | Employee/customer custody |
| TC-INVY-005 | Assign to employee | Custody flow | Quantity/company constraints |
| TC-INVY-006 | Install to customer | From custody | Parent/child assignment |
| TC-INVY-007 | Incident statuses | Damage/loss path | `pending_incident` / `incident` |
| TC-INVY-008 | Complaint materials | Resolve using warehouse/custody | `complaint_material_usages` |

### 1.17 Areas — `/area-zone-management`

| ID | Feature | Steps | Expected |
|----|---------|-------|----------|
| TC-AREA-001 | Baseline CRUD | — | Pass |
| TC-AREA-002 | Public flag | Publish area | Marketing coverage shows |
| TC-AREA-003 | Open sub-zones | Navigate | `/areas/:id/sub-zones` |

### 1.18 Sub-zones — `/areas/:areaId/sub-zones`

| ID | Feature | Steps | Expected |
|----|---------|-------|----------|
| TC-SUB-001 | Add/edit/delete | Custom page | Pass |
| TC-SUB-002 | Search/period/stats | — | Pass |
| TC-SUB-003 | Scoped to area | Wrong area URL | Empty/404 |
| TC-SUB-004 | Customer filter | Assign customers to sub-zone | Portal scope uses it |

### 1.19 Messaging — `/message-management`

| ID | Feature | Steps | Expected |
|----|---------|-------|----------|
| TC-MSG-001 | Baseline CRUD | — | Pass |
| TC-MSG-002 | Read/unread stats | — | Pass |
| TC-MSG-003 | Filters | — | Pass |

### 1.20 Logs — `/logs-management`

| ID | Feature | Steps | Expected |
|----|---------|-------|----------|
| TC-LOG-001 | List + server period | — | Pass |
| TC-LOG-002 | Export CSV | — | Pass |
| TC-LOG-003 | Filters action/table/user | — | Pass |
| TC-LOG-004 | View record details | Modal | Diff/payload shown |
| TC-LOG-005 | Stats non-clickable | Click Active/Inactive | No erroneous filter if configured |

---

## 2. Reporting, ledger, profile, notifications (admin chrome)

### 2.1 Reporting — `/reporting/:section`

Sections: `executive`, `customers`, `financial`, `service`, `inventory`, `employees`, `regional`, `plans`, `collections`, `operations`

| ID | Feature | Steps | Expected |
|----|---------|-------|----------|
| TC-REP-001 | Each section loads | Open all 10 | Charts/KPIs; no crash |
| TC-REP-002 | Date / advanced filters | Where present | Data changes |
| TC-REP-003 | Empty company | New vendor | Empty states, not errors |
| TC-REP-004 | Role AU | View only | Loads |

### 2.2 Ledger (Executive / Financial)

| ID | Feature | Steps | Expected |
|----|---------|-------|----------|
| TC-LED-001 | Filters | Date, bank, method, invoice status, ISP type | Totals update |
| TC-LED-002 | Search | — | Pass |
| TC-LED-003 | Credit/debit | Direction filter | Pass |
| TC-LED-004 | Row detail | Open row | Detail panel |

### 2.3 Profile — `/profile`

| ID | Feature | Steps | Expected |
|----|---------|-------|----------|
| TC-PRF-001 | View/edit self | — | Pass |
| TC-PRF-002 | Password change | — | Pass |

### 2.4 Notifications — `/notifications` + bell

| ID | Feature | Steps | Expected |
|----|---------|-------|----------|
| TC-NTF-001 | List + unread filter | — | Pass |
| TC-NTF-002 | Mark one read | — | Badge decrements |
| TC-NTF-003 | Mark all read | — | Zero unread |
| TC-NTF-004 | Deep link | Click payment/complaint/task | Lands correct route |
| TC-NTF-005 | Preferences mute | Mute `complaint.assigned` | No new inbox for that type |
| TC-NTF-006 | WA action-required | Enable; get assignment | Staff alert queued (high priority, bypass window) |
| TC-NTF-007 | WA action-required off | Disable | No staff WA |
| TC-NTF-008 | Bell on admin + employee portal | — | Both show |
| TC-NTF-009 | Events matrix | Trigger each event type | Row created with correct title/body |
| TC-NTF-010 | Retention job | Run scheduler retention | Old rows purged per policy |

**Event triggers to cover:** `payment.created`, `payment.pending_verification`, `payment.verified`, `payment.rejected`, `complaint.created`, `complaint.assigned`, `complaint.resolved`, `task.assigned`, `task.completed`, `recovery.assigned`, `recovery.collected`, `recovery.settled`, `access.changed`, `customer.created`, `customer.status_changed`, `invoice.bulk_generated`.

---

## 3. Employee portal — `/employee-portal`

| ID | Feature | Steps | Expected |
|----|---------|-------|----------|
| TC-EP-001 | Login redirect | EM/TE/RA login | Lands `/employee-portal` |
| TC-EP-002 | Section nav | Switch `?section=` | Persists localStorage |
| TC-EP-003 | Module disabled | Owner disables Recoveries | Hidden + API denied |
| TC-EP-004 | Dashboard KPIs | — | Scoped numbers |
| TC-EP-005 | Tasks list | Status tabs | All hides completed; Completed tab shows them |
| TC-EP-006 | Task complete + proof | Upload image | Proof stored; GET proof works |
| TC-EP-007 | Complaints list | Status filters | Scope only |
| TC-EP-008 | Complaint update | Status/remarks | Assignee-only update |
| TC-EP-009 | Complaint resolve billing | Materials + cash | Same as admin resolve path |
| TC-EP-010 | Customers list | Scope tech∪areas∪zones | Only in-scope |
| TC-EP-011 | Customer detail | `/employee-portal/customers/:id` | Tabs profile/billing/support/equipment |
| TC-EP-012 | Out-of-scope customer | Direct URL | Forbidden |
| TC-EP-013 | Recoveries list | — | Assigned recoveries |
| TC-EP-014 | Collect payment | Cash + proof | Recovery `collected`; payment `pending`; ledger hold |
| TC-EP-015 | Collect bank_transfer | Needs bank_account_id | Validation |
| TC-EP-016 | Collect over remaining | — | Rejected |
| TC-EP-017 | Inventory custody | Accept/install/incident actions | State machine ok |
| TC-EP-018 | Financial | Own ledger only | No other employee data |
| TC-EP-019 | Profile edit | Contact/address | Saves |
| TC-EP-020 | Notifications bell | — | Works in portal chrome |
| TC-EP-021 | Admin API blocked | EM calls `/customers/list` | 403 employee-use-portal |

---

## 4. Customer portal — `/customer-portal` & `customer.*`

| ID | Feature | Steps | Expected |
|----|---------|-------|----------|
| TC-CP-001 | Login | CNIC + password | Token stored |
| TC-CP-002 | Bad credentials | — | Error |
| TC-CP-003 | Inactive customer | — | Blocked |
| TC-CP-004 | Must change password | First login | Gate until set-password |
| TC-CP-005 | Overview KPIs | — | Due, invoices, paid, open complaints |
| TC-CP-006 | Tabs UI | Overview/Invoices/Payments/Complaints | Active styling + icons |
| TC-CP-007 | Profile edit | Email, phones, address, GPS map | Saves via PUT profile |
| TC-CP-008 | Change password | Wrong current | Error; correct works |
| TC-CP-009 | Invoices list | Open public link | Public page |
| TC-CP-010 | Payments list | Open details | Modal fields |
| TC-CP-011 | Payment proof | Auth download | Image loads (not raw path) |
| TC-CP-012 | Lodge complaint | Category + description + file | Ticket created; history updates |
| TC-CP-013 | Complaint detail modal | Click row | Full detail, activity, attachments |
| TC-CP-014 | Complaint attachment/proof download | Portal JWT | Works |
| TC-CP-015 | Exit/logout | — | Token cleared |
| TC-CP-016 | Host `customer.*` | Catch-all routing | Portal only, not admin |

---

## 5. Public invoice — `/public/invoice/:id`

| ID | Feature | Steps | Expected |
|----|---------|-------|----------|
| TC-PI-001 | Load by UUID | — | Invoice details |
| TC-PI-002 | Load by invoice number | — | Same |
| TC-PI-003 | PDF download | — | File generates |
| TC-PI-004 | Bank accounts + QR | — | List for company |
| TC-PI-005 | Submit payment | Amount, method, proof | Pending payment created |
| TC-PI-006 | Missing proof | — | Validation |
| TC-PI-007 | Payment history | After submit | Shows |
| TC-PI-008 | Paid stamp | Fully paid invoice | UI reflects paid |

---

## 6. Marketing site (vendor host)

| ID | Feature | Steps | Expected |
|----|---------|-------|----------|
| TC-MKT-001 | Home | `/` | Hero + CTA + sections |
| TC-MKT-002 | Plans | `/plans` | Catalog |
| TC-MKT-003 | Coverage | `/coverage` | Areas + availability |
| TC-MKT-004 | About / FAQ / Contact | — | CMS content |
| TC-MKT-005 | Contact WhatsApp | Compose link | Opens WA |
| TC-MKT-006 | Unknown host | — | SiteNotConfigured |
| TC-MKT-007 | Local `?site=` | localhost preview | Sticky sessionStorage |
| TC-MKT-008 | API failure | Kill site API | Error state |
| TC-MKT-009 | Portal CTA | customer_portal_url | Correct link |
| TC-MKT-010 | CMS edit | Website content editor (admin) | Marketing reflects changes |

---

## 7. Auth & password recovery

| ID | Feature | Steps | Expected |
|----|---------|-------|----------|
| TC-AUTH-001 | `/admin` login | Each role | Correct home redirect |
| TC-AUTH-002 | Forgot password | Valid email | Mail/token flow |
| TC-AUTH-003 | Reset password | Token | New password works |
| TC-AUTH-004 | Expired token | — | Error |
| TC-AUTH-005 | Deactivated user | — | 403 message |
| TC-AUTH-006 | Deactivated company | — | 403 portal blocked |
| TC-AUTH-007 | RoleRoute bounce | EM opens `/customer-management` | Redirect home |
| TC-AUTH-008 | Guest on protected | No token | Login |
| TC-AUTH-009 | Logout | — | Token cleared |

---

## 8. WhatsApp module

### 8.1 Settings — `/whatsapp/settings`

| ID | Feature | Steps | Expected |
|----|---------|-------|----------|
| TC-WA-001 | Create instance | Owner | Instance created |
| TC-WA-002 | QR connect | Scan | Connected status |
| TC-WA-003 | Disconnect / restart / delete | — | State updates |
| TC-WA-004 | Pause sending | Pause | Dispatcher skips company |
| TC-WA-005 | Send window | Set start/end | Bulk/invoice wait outside window |
| TC-WA-006 | Bypass window msgs | Complaint/onboarding/staff | Still send outside window |
| TC-WA-007 | Quota / warmup | — | Limits enforced |
| TC-WA-008 | Delays min/max | — | Inter-message delay |
| TC-WA-009 | Spintax toggle | Enable | Variants applied |
| TC-WA-010 | Auto-send toggles | invoices, deadlines, complaints, onboarding | Each gate respected |
| TC-WA-011 | Template CRUD | All categories | Save/active |
| TC-WA-012 | Role gate | AU view; CO configure; EM blocked | Correct |

### 8.2 Bulk sender — `/whatsapp/bulk-sender`

| ID | Feature | Steps | Expected |
|----|---------|-------|----------|
| TC-WA-013 | Audience filters | Area, sub-area, plan, ISP, connection | Count updates |
| TC-WA-014 | Search/select | Cap 500 | Enforced |
| TC-WA-015 | Template + preview | Spintax | Preview humanized |
| TC-WA-016 | Priority | 0/10/20 | Queue order |
| TC-WA-017 | Enqueue campaign | Send | Rows pending; campaign_id set |
| TC-WA-018 | Opt-out customer | whatsapp_opt_in false | Skipped |

### 8.3 Queue — `/whatsapp/queue`

| ID | Feature | Steps | Expected |
|----|---------|-------|----------|
| TC-WA-019 | Status filters | pending…failed_permanent | Pass |
| TC-WA-020 | Stats / quota / connection | Auto-refresh ~30s | Pass |
| TC-WA-021 | Retry failed | Retry | Re-queued |
| TC-WA-022 | Pagination | — | Pass |

### 8.4 Lifecycle & worker behavior

| ID | Feature | Steps | Expected |
|----|---------|-------|----------|
| TC-WA-023 | Invoice auto-send | Create invoice (non-zero) | Enqueued if toggle on |
| TC-WA-024 | Complaint created/resolved | — | Customer WA; bypass window; priority ~5 |
| TC-WA-025 | Customer onboarding | Create customer | Onboarding WA |
| TC-WA-026 | Deadline alert | Scheduler minute job at config time | Enqueued |
| TC-WA-027 | Worker drain | Run `whatsapp_worker.py` | Messages → sent |
| TC-WA-028 | Multi-worker | Two workers | No double-send (SKIP LOCKED) |
| TC-WA-029 | Failure cooldown | Force API fail | Cooldown; disconnect after 3 |
| TC-WA-030 | Webhook delivery | Simulate status | Queue status updates |
| TC-WA-031 | Missing phone | Customer without phone_1 | Skip with log |
| TC-WA-032 | Encryption keys | Missing env | Worker fails clearly |

---

## 9. Background workers & infra

| ID | Feature | Steps | Expected |
|----|---------|-------|----------|
| TC-WRK-001 | API alone | Start API without workers | HTTP ok; WA stays pending |
| TC-WRK-002 | `scheduler_worker.py` | Exactly one process | Jobs register |
| TC-WRK-003 | Auto-invoice job | Day 28 01:00 PKT or force path | Next-month invoices; WA optional |
| TC-WRK-004 | `AUTO_INVOICE_SCHEDULER_ENABLED=false` | — | Job skipped |
| TC-WRK-005 | Deadline check | Every minute | Matches config time |
| TC-WRK-006 | Notification retention | 02:30 PKT | Purge |
| TC-WRK-007 | `NOTIFICATION_RETENTION_ENABLED=false` | — | Skip |
| TC-WRK-008 | WhatsApp worker | One+ processes | Drain queue |
| TC-WRK-009 | No Docker in repo | Deploy docs | Use runbook process model (not compose) |
| TC-WRK-010 | Production runbook | Follow `docs/whatsapp-production-runbook.md` | Connect → settings → workers |
| TC-WRK-011 | Stale claim recovery | Kill worker mid-send | Claim released; retry |
| TC-WRK-012 | Commission on paid invoice | Pay invoice fully | Connection commission if rules match |
| TC-WRK-013 | Migrations after 08-27 | Apply consolidated SQL | Idempotent COMMIT |

---

## 10. Cross-cutting workflows (end-to-end)

| ID | Flow | Steps | Expected |
|----|------|-------|----------|
| TC-E2E-001 | New customer → invoice → pay → WA | Create customer, generate invoice, pay, worker | Onboarding + invoice + optional payment staff notifs |
| TC-E2E-002 | Complaint portal → assign → resolve | Customer lodge → owner assign → tech resolve | Customer WA create+resolve; staff notifs |
| TC-E2E-003 | Recovery collect → settle | Assign recovery → EP collect → owner settle | Pending→settled; invoice paid |
| TC-E2E-004 | Vendor onboard | Create vendor+domain → marketing → vendor login | Host binding + site |
| TC-E2E-005 | Public pay → verify | Public submit → owner approve | Invoice updates |
| TC-E2E-006 | Inventory to complaint bill | Assign stock → resolve with materials | Invoice lines + usages |
| TC-E2E-007 | Monthly billing night | Scheduler auto-invoice | Batch + bulk notif + WA invoices |
| TC-E2E-008 | Outside send window | Night bulk vs complaint | Bulk waits; complaint/staff send |

---

## 11. Module coverage checklist (do not skip)

- [ ] Employee CRUD + detail + portal-access  
- [ ] Customer CRUD + detail + bulk add + portal credentials  
- [ ] Service plans  
- [ ] Vendors + dashboard + host login + marketing  
- [ ] Suppliers  
- [ ] ISPs  
- [ ] Payments (+ verify, bulk delete, export)  
- [ ] ISP payments  
- [ ] Invoices (+ bulk gen, unified pay, public, WA share)  
- [ ] Bank accounts (+ QR)  
- [ ] Expenses (+ types)  
- [ ] Extra income (+ types)  
- [ ] Complaints (+ view modal, settle, ticket, billing resolve)  
- [ ] Tasks  
- [ ] Recovery tasks (+ bulk-add, settle dock)  
- [ ] Inventory (+ transactions, assignments, custody)  
- [ ] Areas + sub-zones  
- [ ] Messaging  
- [ ] Logs (+ export, detail)  
- [ ] Reporting (10 sections) + Ledger  
- [ ] Notifications + preferences  
- [ ] Profile / forgot-reset password  
- [ ] Employee portal (all sections)  
- [ ] Customer portal (all tabs + profile)  
- [ ] Public invoice  
- [ ] Marketing site  
- [ ] WhatsApp settings / bulk / queue / lifecycle / worker  
- [ ] Scheduler worker (invoice, deadline, retention)  
- [ ] Auth roles + host binding + localhost bypass  

---

## 12. Suggested execution order

1. Auth + roles + vendor host (blocks everything else if wrong)  
2. Shared CRUD smoke on Customer + Invoice + Payment  
3. Remaining CRUDs module-by-module (baseline + unique rows)  
4. Employee portal scoped workflows  
5. Customer portal + public invoice  
6. WhatsApp settings → worker → lifecycle  
7. Scheduler jobs (staging clock or force endpoints)  
8. Reporting/ledger + notifications matrix  
9. E2E flows TC-E2E-*  

---

*Generated from codebase inventory: `App.tsx`, `sideNavbar.tsx`, `crud_pages/*`, portal components, WhatsApp pages, `scheduler_worker.py`, `whatsapp_worker.py`, `docs/whatsapp-production-runbook.md`.*
