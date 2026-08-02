# Admin Portal Screens

> **Dashboard, Lists, Details, Forms for Admin Users**

---

## 📊 Dashboard Screen

### Visual Design

```
┌─────────────────────────────────────┐
│  ≡  Dashboard           🔔  👤     │
├─────────────────────────────────────┤
│                                     │
│  Good Morning, John 👋              │
│  Tuesday, Feb 4, 2026               │
│                                     │
│  ┌─────────┐  ┌─────────┐          │
│  │  1,245  │  │  ₨4.2M  │          │
│  │Customers│  │ Revenue │          │
│  │  +12 ▲  │  │ +8% ▲   │          │
│  └─────────┘  └─────────┘          │
│                                     │
│  ┌─────────┐  ┌─────────┐          │
│  │   47    │  │   12    │          │
│  │ Pending │  │  Open   │          │
│  │Invoices │  │Complaints│          │
│  └─────────┘  └─────────┘          │
│                                     │
│  Recent Activity                    │
│  ┌─────────────────────────────┐   │
│  │ 💰 Payment received - ₨5,000│   │
│  │    John Doe • 2 mins ago    │   │
│  ├─────────────────────────────┤   │
│  │ 📝 Invoice generated #1234  │   │
│  │    Jane Smith • 15 mins ago │   │
│  └─────────────────────────────┘   │
│                                     │
│  Quick Actions                      │
│  [+ Customer] [+ Payment] [+ Task] │
│                                     │
├─────────────────────────────────────┤
│  🏠    👥    💳    📊    ≡        │
│ Home  Cust  Pay   Stats  More      │
└─────────────────────────────────────┘
```

### Components

| Section | Data Source |
|---------|-------------|
| Greeting | Auth store user |
| Stat Cards | `GET /dashboard/executive` |
| Recent Activity | `GET /dashboard/activity` |
| Quick Actions | Navigation buttons |

---

## 👥 Customer List Screen

### Visual Design

```
┌─────────────────────────────────────┐
│  ←  Customers            🔍  ➕    │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │ 🔍 Search customers...       │   │
│  └─────────────────────────────┘   │
│                                     │
│  [All] [Active] [Inactive] [Susp]  │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 👤 John Doe            →    │   │
│  │    📞 0300-1234567          │   │
│  │    📍 Gulberg III           │   │
│  │    ○ Active    ₨2,500/mo    │   │
│  ├─────────────────────────────┤   │
│  │ 👤 Jane Smith          →    │   │
│  │    📞 0321-9876543          │   │
│  │    📍 DHA Phase 5           │   │
│  │    ○ Active    ₨3,500/mo    │   │
│  ├─────────────────────────────┤   │
│  │ 👤 Ahmed Khan          →    │   │
│  │    📞 0333-5555555          │   │
│  │    📍 Model Town            │   │
│  │    ○ Suspended ₨2,000/mo    │   │
│  └─────────────────────────────┘   │
│                                     │
│      Load More (showing 20/1245)   │
│                                     │
├─────────────────────────────────────┤
│  🏠    👥    💳    📊    ≡        │
└─────────────────────────────────────┘
```

### Features

| Feature | Implementation |
|---------|----------------|
| Search | Debounced search with `useDebounce` |
| Filters | Status filter chips |
| Pull to Refresh | `RefreshControl` |
| Infinite Scroll | `useInfiniteQuery` |
| FAB | Floating action button for create |

### Data Query

```typescript
const { 
  data, 
  fetchNextPage, 
  hasNextPage, 
  isLoading, 
  refetch 
} = useInfiniteQuery({
  queryKey: ['customers', filters],
  queryFn: ({ pageParam = 1 }) => 
    customerService.getAll({ ...filters, page: pageParam }),
  getNextPageParam: (lastPage) => lastPage.next_page,
});
```

---

## 👤 Customer Detail Screen

### Visual Design

```
┌─────────────────────────────────────┐
│  ←  Customer Detail    ⋯           │
├─────────────────────────────────────┤
│                                     │
│        [Avatar]                     │
│       John Doe                      │
│      ID: CUS-001234                 │
│      ○ Active                       │
│                                     │
│  [Call]   [WhatsApp]   [Edit]      │
│                                     │
├─────────────────────────────────────┤
│  Contact Information                │
│  ─────────────────────────────────  │
│  📞 Phone 1    0300-1234567         │
│  📞 Phone 2    0321-9876543         │
│  ✉️ Email      john@email.com       │
│  🪪 CNIC       35201-1234567-1      │
│                                     │
├─────────────────────────────────────┤
│  Service Details                    │
│  ─────────────────────────────────  │
│  📡 Internet ID   ISP-2024-001     │
│  📦 Package       50 Mbps Premium  │
│  💰 Monthly       ₨ 2,500          │
│  📍 Area          Gulberg III      │
│                                     │
├─────────────────────────────────────┤
│  [Invoices] [Payments] [Complaints]│
│                                     │
│  Balance Summary                    │
│  ┌─────────────────────────────┐   │
│  │  Total Due      ₨ 5,000     │   │
│  │  Total Paid     ₨ 45,000    │   │
│  │  Last Payment   Jan 15, 2026│   │
│  └─────────────────────────────┘   │
│                                     │
│  Recent Invoices                    │
│  ┌─────────────────────────────┐   │
│  │ INV-2026-0134    ₨2,500     │   │
│  │ Feb 2026  ○ Pending         │   │
│  ├─────────────────────────────┤   │
│  │ INV-2026-0089    ₨2,500     │   │
│  │ Jan 2026  ● Paid            │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

### Tabs

| Tab | Content |
|-----|---------|
| Info | Contact, service details |
| Invoices | Customer invoice list |
| Payments | Payment history |
| Complaints | Complaint history |
| Inventory | Assigned equipment |

### Actions Menu (⋯)

- Edit Customer
- Generate Invoice
- Record Payment
- Create Complaint
- Assign Equipment
- Change Status
- Delete Customer

---

## 📝 Customer Create/Edit Form

### Form Fields

```
┌─────────────────────────────────────┐
│  ←  New Customer        [Save]     │
├─────────────────────────────────────┤
│                                     │
│  Basic Information                  │
│  ─────────────────────────────────  │
│  Customer Name *                    │
│  ┌─────────────────────────────┐   │
│  │                              │   │
│  └─────────────────────────────┘   │
│                                     │
│  CNIC *                             │
│  ┌─────────────────────────────┐   │
│  │ _____-_______-_             │   │
│  └─────────────────────────────┘   │
│                                     │
│  Contact Information                │
│  ─────────────────────────────────  │
│  Phone 1 *         Phone 2          │
│  ┌────────────┐   ┌────────────┐   │
│  │            │   │            │   │
│  └────────────┘   └────────────┘   │
│                                     │
│  Email                              │
│  ┌─────────────────────────────┐   │
│  │                              │   │
│  └─────────────────────────────┘   │
│                                     │
│  Location                           │
│  ─────────────────────────────────  │
│  Area *                             │
│  ┌─────────────────────────────┐   │
│  │ Select Area              ▼  │   │
│  └─────────────────────────────┘   │
│                                     │
│  Sub-Zone                           │
│  ┌─────────────────────────────┐   │
│  │ Select Sub-Zone          ▼  │   │
│  └─────────────────────────────┘   │
│                                     │
│  Installation Address *             │
│  ┌─────────────────────────────┐   │
│  │                              │   │
│  │                              │   │
│  └─────────────────────────────┘   │
│                                     │
│  Service Details                    │
│  ─────────────────────────────────  │
│  ISP *                              │
│  ┌─────────────────────────────┐   │
│  │ Select ISP              ▼   │   │
│  └─────────────────────────────┘   │
│                                     │
│  Service Plan *                     │
│  ┌─────────────────────────────┐   │
│  │ Select Plan             ▼   │   │
│  └─────────────────────────────┘   │
│                                     │
│  Monthly Charges *                  │
│  ┌─────────────────────────────┐   │
│  │ ₨                           │   │
│  └─────────────────────────────┘   │
│                                     │
│  Status *                           │
│  ( ) Active  ( ) Inactive          │
│                                     │
│  ┌─────────────────────────────┐   │
│  │        Create Customer       │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

---

## 💰 Payment List Screen

### Features

- Date range filter
- Payment method filter
- Search by customer/invoice
- Quick stats header
- Pull to refresh

---

## 📄 Invoice List Screen

### Features

- Status filter (All/Paid/Pending/Overdue)
- Month picker filter
- Bulk actions support
- Quick generate button

---

## 🎫 Complaint List Screen

### Features

- Status tabs (Open/In Progress/Resolved)
- Priority indicators
- Assigned to filter
- Create FAB

---

## ⚙️ More/Settings Screen

### Menu Items

```
┌─────────────────────────────────────┐
│  More                               │
├─────────────────────────────────────┤
│                                     │
│  Management                         │
│  ┌─────────────────────────────┐   │
│  │ 👥 Employee Management   →  │   │
│  │ 🏢 Vendor Management     →  │   │
│  │ 🚚 Supplier Management   →  │   │
│  │ 📦 Inventory Management  →  │   │
│  │ 🗺️ Area Management       →  │   │
│  │ 📋 Task Management       →  │   │
│  └─────────────────────────────┘   │
│                                     │
│  Reports                            │
│  ┌─────────────────────────────┐   │
│  │ 📊 Executive Dashboard   →  │   │
│  │ 💰 Financial Reports     →  │   │
│  │ 👥 Customer Analytics    →  │   │
│  │ 📈 Employee Performance  →  │   │
│  └─────────────────────────────┘   │
│                                     │
│  Settings                           │
│  ┌─────────────────────────────┐   │
│  │ 👤 My Profile            →  │   │
│  │ 💬 WhatsApp Settings     →  │   │
│  │ 📝 System Logs           →  │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🚪 Logout                   │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```
