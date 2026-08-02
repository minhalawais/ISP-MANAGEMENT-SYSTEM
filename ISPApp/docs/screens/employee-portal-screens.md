# Employee Portal Screens

> **Self-service portal for employees: tasks, complaints, recoveries**

---

## 📊 Employee Dashboard

### Visual Design

```
┌─────────────────────────────────────┐
│       Employee Portal     🔔  👤   │
├─────────────────────────────────────┤
│                                     │
│  [Avatar]                           │
│  Welcome, Ahmad                     │
│  Technician • Gulberg Area          │
│                                     │
│  Today's Summary                    │
│  ┌─────────┐  ┌─────────┐          │
│  │    5    │  │    3    │          │
│  │  Tasks  │  │Complaints│          │
│  │ Pending │  │  Open   │          │
│  └─────────┘  └─────────┘          │
│                                     │
│  ┌─────────┐  ┌─────────┐          │
│  │    8    │  │  ₨45K   │          │
│  │Customers│  │Recovery │          │
│  │Assigned │  │ Target  │          │
│  └─────────┘  └─────────┘          │
│                                     │
│  Urgent Tasks                       │
│  ┌─────────────────────────────┐   │
│  │ 🔴 Installation - John Doe   │   │
│  │    Due: Today 2:00 PM        │   │
│  ├─────────────────────────────┤   │
│  │ 🟡 Repair - Jane Smith       │   │
│  │    Due: Today 5:00 PM        │   │
│  └─────────────────────────────┘   │
│                                     │
│  Recent Complaints                  │
│  ┌─────────────────────────────┐   │
│  │ No Internet - Ahmad Khan     │   │
│  │    Priority: High • 2h ago   │   │
│  └─────────────────────────────┘   │
│                                     │
├─────────────────────────────────────┤
│  🏠    📋    🎫    👤              │
│ Home  Tasks  Issues Profile        │
└─────────────────────────────────────┘
```

### Data Sources

| Section | Endpoint |
|---------|----------|
| Stats | `GET /employee-portal/dashboard` |
| Urgent Tasks | `GET /employee-portal/tasks?urgent=true` |
| Recent Complaints | `GET /employee-portal/complaints?limit=3` |

---

## 📋 My Tasks Screen

### Visual Design

```
┌─────────────────────────────────────┐
│  My Tasks                🔍  ⚙️    │
├─────────────────────────────────────┤
│                                     │
│  [Today] [This Week] [All]         │
│                                     │
│  Today (3)                          │
│  ┌─────────────────────────────┐   │
│  │ 🔴 New Installation          │   │
│  │    Customer: John Doe        │   │
│  │    📍 House 45, Gulberg      │   │
│  │    ⏰ 2:00 PM                │   │
│  │    [Start] [Reschedule]      │   │
│  ├─────────────────────────────┤   │
│  │ 🟡 Router Replacement        │   │
│  │    Customer: Jane Smith      │   │
│  │    📍 Apt 12, DHA Phase 5    │   │
│  │    ⏰ 4:30 PM                │   │
│  │    [Start] [Reschedule]      │   │
│  └─────────────────────────────┘   │
│                                     │
│  Tomorrow (2)                       │
│  ┌─────────────────────────────┐   │
│  │ 🟢 Cable Repair              │   │
│  │    Customer: Ali Hassan      │   │
│  │    📍 Model Town Block C     │   │
│  │    ⏰ 10:00 AM               │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

### Task Actions

| Action | Flow |
|--------|------|
| Start | Update status → In Progress |
| Complete | Open completion form → Submit |
| Reschedule | Open date picker → Update |

### Task Detail Modal

```
┌─────────────────────────────────────┐
│  Task Details              ✕       │
├─────────────────────────────────────┤
│                                     │
│  New Installation                   │
│  Priority: 🔴 High                 │
│                                     │
│  Customer                           │
│  ┌─────────────────────────────┐   │
│  │ 👤 John Doe                  │   │
│  │    📞 0300-1234567           │   │
│  │    📍 House 45, Street 12    │   │
│  │       Gulberg III, Lahore    │   │
│  │    [📞 Call] [💬 WhatsApp]   │   │
│  └─────────────────────────────┘   │
│                                     │
│  Task Details                       │
│  ─────────────────────────────────  │
│  Type: Installation                 │
│  Scheduled: Feb 4, 2026 2:00 PM    │
│  Assigned by: Manager Ali          │
│                                     │
│  Notes:                             │
│  Customer requested 50Mbps plan.   │
│  Router and cable provided.        │
│                                     │
│  Equipment Required                 │
│  • TP-Link Router (1)              │
│  • CAT6 Cable 50m                  │
│                                     │
│  ┌─────────────────────────────┐   │
│  │      Start Task              │   │
│  └─────────────────────────────┘   │
│                                     │
│  [Reschedule]  [Report Issue]      │
│                                     │
└─────────────────────────────────────┘
```

---

## 🎫 My Complaints Screen

### Visual Design

```
┌─────────────────────────────────────┐
│  Assigned Complaints     🔍        │
├─────────────────────────────────────┤
│                                     │
│  [Open: 3] [In Progress: 2] [All]  │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ #TKT-2024-0456              │   │
│  │ No Internet Connection      │   │
│  │ 👤 Ahmad Khan               │   │
│  │ ⏰ 2 hours ago              │   │
│  │ Priority: 🔴 High           │   │
│  │ [View] [Resolve]            │   │
│  ├─────────────────────────────┤   │
│  │ #TKT-2024-0455              │   │
│  │ Slow Speed                  │   │
│  │ 👤 Maria Bibi               │   │
│  │ ⏰ 5 hours ago              │   │
│  │ Priority: 🟡 Medium         │   │
│  │ [View] [Resolve]            │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

### Complaint Actions

| Action | Description |
|--------|-------------|
| View | Open complaint detail |
| Start Progress | Update status to In Progress |
| Resolve | Open resolution form |
| Escalate | Escalate to supervisor |

---

## 💰 Recovery Tasks Screen

### Visual Design

```
┌─────────────────────────────────────┐
│  Recovery Tasks          🔍        │
├─────────────────────────────────────┤
│                                     │
│  Collection Target: ₨45,000        │
│  ┌─────────────────────────────┐   │
│  │ █████████░░░░░░░ 65%        │   │
│  │ Collected: ₨29,250          │   │
│  └─────────────────────────────┘   │
│                                     │
│  [Pending: 8] [Completed: 12]      │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 👤 John Doe                  │   │
│  │    Due: ₨5,000 (2 invoices) │   │
│  │    📞 0300-1234567           │   │
│  │    Last Contact: 2 days ago │   │
│  │    [📞 Call] [💰 Collect]   │   │
│  ├─────────────────────────────┤   │
│  │ 👤 Jane Smith                │   │
│  │    Due: ₨2,500 (1 invoice)  │   │
│  │    📞 0321-9876543           │   │
│  │    Last Contact: 1 week ago │   │
│  │    [📞 Call] [💰 Collect]   │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

### Collection Flow

1. View customer dues
2. Contact customer (call/WhatsApp)
3. Record payment attempt
4. If collected → Record payment
5. If not → Schedule follow-up

---

## 👤 Employee Profile Screen

### Visual Design

```
┌─────────────────────────────────────┐
│  My Profile              ⚙️        │
├─────────────────────────────────────┤
│                                     │
│         [Large Avatar]              │
│          Ahmad Hassan               │
│          Technician                 │
│          Employee since 2022        │
│                                     │
│         [Change Photo]              │
│                                     │
├─────────────────────────────────────┤
│  Personal Information               │
│  ─────────────────────────────────  │
│  📧 ahmad@company.com               │
│  📞 0300-1234567                    │
│  🪪 35201-1234567-1                 │
│                                     │
├─────────────────────────────────────┤
│  Work Details                       │
│  ─────────────────────────────────  │
│  Role: Technician                   │
│  Area: Gulberg, DHA                 │
│  Assigned Customers: 45             │
│                                     │
├─────────────────────────────────────┤
│  Financial                          │
│  ─────────────────────────────────  │
│  Current Balance: ₨12,500          │
│  [View Ledger →]                    │
│                                     │
├─────────────────────────────────────┤
│  Inventory                          │
│  ─────────────────────────────────  │
│  Assigned Items: 5                  │
│  [View Inventory →]                 │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  [Change Password]                  │
│  [Logout]                           │
│                                     │
└─────────────────────────────────────┘
```

---

## 📦 Assigned Inventory Screen

```
┌─────────────────────────────────────┐
│  ←  My Inventory                   │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 📦 TP-Link Router N300      │   │
│  │    Qty: 5                    │   │
│  │    Assigned: Jan 15, 2026   │   │
│  ├─────────────────────────────┤   │
│  │ 📦 CAT6 Cable (100m rolls)  │   │
│  │    Qty: 3                    │   │
│  │    Assigned: Jan 15, 2026   │   │
│  ├─────────────────────────────┤   │
│  │ 📦 RJ45 Connectors (Box)    │   │
│  │    Qty: 2                    │   │
│  │    Assigned: Jan 10, 2026   │   │
│  └─────────────────────────────┘   │
│                                     │
│  [Request More Items]              │
│                                     │
└─────────────────────────────────────┘
```
