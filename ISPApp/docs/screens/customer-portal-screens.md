# Customer Portal Screens

> **Self-service portal for customers: view invoices, payments, complaints**

---

## 🏠 Customer Dashboard

### Visual Design

```
┌─────────────────────────────────────┐
│     [Company Logo]                  │
│     Customer Portal      🚪        │
├─────────────────────────────────────┤
│                                     │
│  Welcome, John Doe                  │
│  Internet ID: ISP-2024-00123       │
│                                     │
│  Account Overview                   │
│  ┌─────────────────────────────┐   │
│  │          ₨ 5,000             │   │
│  │       Current Balance        │   │
│  │    ┌─────────────────┐      │   │
│  │    │   Pay Now  →    │      │   │
│  │    └─────────────────┘      │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────┐  ┌─────────┐          │
│  │   12    │  │   11    │          │
│  │ Invoices│  │Payments │          │
│  │  Total  │  │  Made   │          │
│  └─────────┘  └─────────┘          │
│                                     │
│  My Package                         │
│  ┌─────────────────────────────┐   │
│  │ 📡 50 Mbps Premium           │   │
│  │    Monthly: ₨2,500          │   │
│  │    Status: ● Active          │   │
│  └─────────────────────────────┘   │
│                                     │
│  Quick Actions                      │
│  ┌─────────────────────────────┐   │
│  │ 📄 View Latest Invoice       │   │
│  │ 🎫 Report an Issue           │   │
│  │ 📞 Contact Support           │   │
│  └─────────────────────────────┘   │
│                                     │
├─────────────────────────────────────┤
│  🏠    📄    💳    👤              │
│ Home  Bills  Pay   Profile         │
└─────────────────────────────────────┘
```

### Data Sources

| Section | Endpoint |
|---------|----------|
| Balance | `GET /customer-portal/summary` |
| Package | Customer service plan |
| Invoices Count | Summary data |

---

## 📄 My Invoices Screen

### Visual Design

```
┌─────────────────────────────────────┐
│  ←  My Invoices                    │
├─────────────────────────────────────┤
│                                     │
│  [All] [Pending] [Paid]            │
│                                     │
│  February 2026                      │
│  ┌─────────────────────────────┐   │
│  │ INV-2026-0245               │   │
│  │ February 2026                │   │
│  │ Amount: ₨2,500              │   │
│  │ Due: Feb 10, 2026           │   │
│  │ Status: ○ Pending           │   │
│  │ [View Invoice →]            │   │
│  └─────────────────────────────┘   │
│                                     │
│  January 2026                       │
│  ┌─────────────────────────────┐   │
│  │ INV-2026-0089               │   │
│  │ January 2026                 │   │
│  │ Amount: ₨2,500              │   │
│  │ Paid: Jan 8, 2026           │   │
│  │ Status: ● Paid              │   │
│  │ [View Invoice →]            │   │
│  └─────────────────────────────┘   │
│                                     │
│  December 2025                      │
│  ┌─────────────────────────────┐   │
│  │ INV-2025-1845               │   │
│  │ December 2025                │   │
│  │ Amount: ₨2,500              │   │
│  │ Paid: Dec 12, 2025          │   │
│  │ Status: ● Paid              │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

---

## 📃 Invoice Detail Screen

### Visual Design

```
┌─────────────────────────────────────┐
│  ←  Invoice Detail      📤         │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │     [Company Logo]          │   │
│  │                              │   │
│  │      INVOICE                │   │
│  │      INV-2026-0245          │   │
│  │                              │   │
│  │  Date: Feb 1, 2026          │   │
│  │  Due:  Feb 10, 2026         │   │
│  │  Status: ○ Pending          │   │
│  └─────────────────────────────┘   │
│                                     │
│  Bill To                            │
│  ─────────────────────────────────  │
│  John Doe                           │
│  House 123, Street 45               │
│  Gulberg III, Lahore                │
│  📞 0300-1234567                    │
│                                     │
│  Invoice Details                    │
│  ─────────────────────────────────  │
│  ┌─────────────────────────────┐   │
│  │ Description    Qty   Amount │   │
│  ├─────────────────────────────┤   │
│  │ 50 Mbps        1    ₨2,500  │   │
│  │ Premium Plan               │   │
│  ├─────────────────────────────┤   │
│  │ Previous       -    ₨2,500  │   │
│  │ Balance                     │   │
│  ├─────────────────────────────┤   │
│  │ Subtotal            ₨5,000  │   │
│  │ Discount     -      ₨0      │   │
│  ├─────────────────────────────┤   │
│  │ TOTAL               ₨5,000  │   │
│  └─────────────────────────────┘   │
│                                     │
│  Payment Information                │
│  ─────────────────────────────────  │
│  Bank: HBL                          │
│  Account: 1234567890123             │
│  Title: Company Name                │
│                                     │
│  ┌─────────────────────────────┐   │
│  │      Download PDF 📥        │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

---

## 💳 Payment History Screen

### Visual Design

```
┌─────────────────────────────────────┐
│  ←  Payment History                │
├─────────────────────────────────────┤
│                                     │
│  Total Paid: ₨45,000               │
│                                     │
│  2026                               │
│  ─────────────────────────────────  │
│  ┌─────────────────────────────┐   │
│  │ Jan 8, 2026                  │   │
│  │ ₨2,500                       │   │
│  │ Invoice: INV-2026-0089       │   │
│  │ Method: Bank Transfer        │   │
│  │ Status: ● Verified           │   │
│  └─────────────────────────────┘   │
│                                     │
│  2025                               │
│  ─────────────────────────────────  │
│  ┌─────────────────────────────┐   │
│  │ Dec 12, 2025                 │   │
│  │ ₨2,500                       │   │
│  │ Invoice: INV-2025-1845       │   │
│  │ Method: Cash                 │   │
│  │ Status: ● Verified           │   │
│  ├─────────────────────────────┤   │
│  │ Nov 15, 2025                 │   │
│  │ ₨2,500                       │   │
│  │ Invoice: INV-2025-1623       │   │
│  │ Method: Bank Transfer        │   │
│  │ Status: ● Verified           │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

---

## 🎫 My Complaints Screen

### Visual Design

```
┌─────────────────────────────────────┐
│  ←  My Complaints       ➕         │
├─────────────────────────────────────┤
│                                     │
│  [Open] [Resolved] [All]           │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ #TKT-2024-0456              │   │
│  │ Slow Internet Speed         │   │
│  │ Created: 2 days ago         │   │
│  │ Status: ○ In Progress       │   │
│  │                              │   │
│  │ Assigned: Ahmad (Technician)│   │
│  │ [View Details →]            │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ #TKT-2024-0412              │   │
│  │ Router Not Working          │   │
│  │ Created: Jan 15, 2026       │   │
│  │ Resolved: Jan 16, 2026      │   │
│  │ Status: ● Resolved          │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │        New Complaint         │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

---

## ➕ Create Complaint Screen

### Visual Design

```
┌─────────────────────────────────────┐
│  ←  Report an Issue                │
├─────────────────────────────────────┤
│                                     │
│  Issue Type *                       │
│  ┌─────────────────────────────┐   │
│  │ Select Issue Type        ▼  │   │
│  └─────────────────────────────┘   │
│  • No Internet                      │
│  • Slow Speed                       │
│  • Router Issue                     │
│  • Cable Damage                     │
│  • Billing Issue                    │
│  • Other                            │
│                                     │
│  Description *                      │
│  ┌─────────────────────────────┐   │
│  │ Describe your issue...       │   │
│  │                              │   │
│  │                              │   │
│  │                              │   │
│  └─────────────────────────────┘   │
│                                     │
│  Preferred Contact Time             │
│  ┌─────────────────────────────┐   │
│  │ Any time                 ▼  │   │
│  └─────────────────────────────┘   │
│                                     │
│  Add Photo (Optional)               │
│  ┌─────────────────────────────┐   │
│  │    📷                        │   │
│  │    Tap to add photo         │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │      Submit Complaint        │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

### Form Schema

```typescript
const complaintSchema = z.object({
  issue_type: z.enum([
    'no_internet',
    'slow_speed',
    'router_issue',
    'cable_damage',
    'billing',
    'other'
  ]),
  description: z.string().min(10, 'Please provide more details'),
  preferred_contact_time: z.enum(['morning', 'afternoon', 'evening', 'any']),
  photo: z.string().optional(),
});
```

---

## 👤 Customer Profile Screen

### Visual Design

```
┌─────────────────────────────────────┐
│  ←  My Profile                     │
├─────────────────────────────────────┤
│                                     │
│         [Avatar]                    │
│        John Doe                     │
│     Customer since 2023             │
│                                     │
├─────────────────────────────────────┤
│  Personal Information               │
│  ─────────────────────────────────  │
│  📞 Phone      0300-1234567         │
│  ✉️  Email      john@email.com      │
│  🪪  CNIC       35201-1234567-1     │
│                                     │
├─────────────────────────────────────┤
│  Service Address                    │
│  ─────────────────────────────────  │
│  📍 House 123, Street 45            │
│     Gulberg III, Lahore             │
│                                     │
├─────────────────────────────────────┤
│  Connection Details                 │
│  ─────────────────────────────────  │
│  Internet ID: ISP-2024-00123       │
│  Package: 50 Mbps Premium          │
│  Monthly: ₨2,500                   │
│  Status: ● Active                   │
│                                     │
├─────────────────────────────────────┤
│  Quick Contact                      │
│  ─────────────────────────────────  │
│  📞 Helpline: 042-1234567           │
│  💬 WhatsApp: 0300-1234567          │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │        Logout               │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```
