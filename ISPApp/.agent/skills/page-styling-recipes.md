---
description: Enterprise styling recipes for each page type in ISPApp — dashboards, CRUD lists, forms, detail views. Defines exact visual anatomy, layout, and styling approach per page type. No vibe coding.
---

# Page Styling Recipes — Enterprise UI for Every Page Type

> **RULE**: Each page type has a specific visual recipe. Follow the exact anatomy for that page type. The goal is: **clean, informational, readable, user-friendly** — not decorative. Gradients are ONLY used on the login screen. Everywhere else is flat, clean surfaces.

## Core Styling Philosophy

```
1. CLEAN     — White cards on light gray background. No noise.
2. READABLE  — High contrast text. Clear hierarchy. Generous whitespace.
3. INFORMATIONAL — Data density over decoration. Every pixel shows useful info.
4. SUBTLE    — Color is used to communicate STATUS, not decoration.
5. FLAT      — No gradients except login. No heavy shadows. Barely-there borders.
```

### Color Usage Rules (Enterprise)
| Color for... | Use | DON'T use |
|--------------|-----|-----------|
| Status indicators | semantic colors (success/warning/error badges) | random bright colors |
| Interactive elements | primary[600] for buttons/links | multiple competing colors |
| Text hierarchy | neutral[900] → neutral[500] (3 levels max) | colored text for regular content |
| Backgrounds | neutral[50] screen, white cards | colored backgrounds on content areas |
| Borders | neutral[200] thin (1px) | thick borders, colored borders |
| Icons | neutral[400] default, primary[600] active | multi-colored icon sets |

---

## 1. Dashboard Pages

**Purpose**: At-a-glance overview. Show KPIs, trends, recent activity.

### Visual Anatomy
```
┌────────────────────────────────────────────────────┐
│  bg: neutral[50]                                    │
│                                                     │
│  Good morning, Ahmad 👋            [🔔]  [👤]      │  ← Greeting + actions
│  Here's your overview                               │
│                                                     │
│  ┌──────────┐  ┌──────────┐                        │
│  │ 📊 2,450 │  │ 💰 ₨1.2M │                        │  ← Stat cards (2 per row)
│  │ Customers│  │ Revenue  │                        │
│  │ ↑ 12%    │  │ ↑ 5%     │                        │
│  └──────────┘  └──────────┘                        │
│  ┌──────────┐  ┌──────────┐                        │
│  │ ⚠️ 23    │  │ 🔴 5     │                        │
│  │ Pending  │  │ Overdue  │                        │
│  └──────────┘  └──────────┘                        │
│                                                     │
│  Recent Activity                        See All >  │  ← Section header
│  ┌────────────────────────────────────────────┐    │
│  │  AK  Ahmad Khan paid ₨5,000    2 min ago  │    │  ← Activity list items
│  │──────────────────────────────────────────── │    │
│  │  SM  Sara connected            15 min ago  │    │
│  │──────────────────────────────────────────── │    │
│  │  RF  Raza filed complaint      1 hour ago  │    │
│  └────────────────────────────────────────────┘    │
│                                                     │
│  Quick Actions                                      │  ← Quick action grid
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐   │
│  │ + Add  │  │ 💳 Pay │  │ 📄 Inv │  │ 🔧 Fix │   │
│  │Customer│  │ ment   │  │ oices  │  │ Ticket │   │
│  └────────┘  └────────┘  └────────┘  └────────┘   │
└────────────────────────────────────────────────────┘
```

### Dashboard Styling

```javascript
// Screen background
screen: { backgroundColor: colors.neutral[50] }

// Greeting section
greetingContainer: {
  paddingHorizontal: spacing.lg,      // 16
  paddingTop: spacing.lg,             // 16
  paddingBottom: spacing.xl,          // 20
},
greetingText: {
  fontSize: 24,                        // 3xl
  fontWeight: '700',
  color: colors.neutral[900],
  letterSpacing: -0.3,
},
greetingSubtext: {
  fontSize: 14,                        // md
  color: colors.neutral[500],
  marginTop: 4,
},

// Stat card — use ICON + COLORED ICON BACKGROUND for visual interest
statCard: {
  flex: 1,
  backgroundColor: '#FFFFFF',
  borderRadius: 12,
  padding: 16,
  borderWidth: 1,
  borderColor: colors.neutral[200],
  ...shadows.sm,
},
statIconContainer: {
  width: 40,
  height: 40,
  borderRadius: 10,
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: 12,
  // Color varies by stat:
  // Revenue: primary[50] bg, primary[600] icon
  // Customers: info[50] bg, info icon
  // Pending: warningLight bg, warningDark icon
  // Overdue: errorLight bg, errorDark icon
},
statValue: {
  fontSize: 24,                        // Changed from 30 to 24 for mobile
  fontWeight: '700',
  color: colors.neutral[900],
  letterSpacing: -0.3,
},
statLabel: {
  fontSize: 12,
  fontWeight: '500',
  color: colors.neutral[500],
  marginTop: 2,
},
statTrend: {
  fontSize: 12,
  fontWeight: '600',
  marginTop: 4,
  // color: semantic.success for positive, semantic.error for negative
},
statsRow: {
  flexDirection: 'row',
  gap: 12,
  paddingHorizontal: 16,
  marginBottom: 12,
},

// Quick Action Card
quickActionCard: {
  flex: 1,
  aspectRatio: 1,
  backgroundColor: '#FFFFFF',
  borderRadius: 12,
  padding: 12,
  alignItems: 'center',
  justifyContent: 'center',
  borderWidth: 1,
  borderColor: colors.neutral[200],
},
quickActionIcon: {
  width: 36,
  height: 36,
  borderRadius: 9,
  backgroundColor: colors.primary[50],
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: 8,
},
quickActionLabel: {
  fontSize: 11,
  fontWeight: '600',
  color: colors.neutral[700],
  textAlign: 'center',
},
```

### Dashboard Rules
- ✅ Stat cards use **colored icon backgrounds** (subtle) for visual differentiation
- ✅ Trends use **semantic colors** (green up, red down)
- ✅ Activity list uses **avatar initials** for personalization
- ✅ Quick actions use **light primary[50] icon backgrounds**
- ❌ NO full-color stat card backgrounds
- ❌ NO gradient stat cards
- ❌ NO chart/graph without a clear purpose
- ❌ NO more than 4 stat cards visible (2 rows of 2)

---

## 2. CRUD / List Pages

**Purpose**: Browse, search, filter, and act on entity lists (Customers, Payments, Invoices, Complaints).

### Visual Anatomy
```
┌────────────────────────────────────────────────────┐
│  bg: neutral[50]                                    │
│                                                     │
│  Customers                              [+ Add]    │  ← Title + action
│  2,450 total                                        │  ← Count subtitle
│                                                     │
│  ┌────────────────────────────────────────────┐    │
│  │  🔍 Search customers...                    │    │  ← Search bar
│  └────────────────────────────────────────────┘    │
│                                                     │
│  [All]  [Active]  [Inactive]  [Suspended]          │  ← Filter chips
│                                                     │
│  ┌────────────────────────────────────────────┐    │
│  │  AK  Ahmad Khan                    Active  │    │  ← List items
│  │      PKG: 10Mbps  •  ₨2,500/mo    ₨5,000  │    │  ← Metadata row
│  │───────────────────────────────────────────  │    │
│  │  SM  Sara Malik                    Active  │    │
│  │      PKG: 20Mbps  •  ₨4,000/mo    ₨0      │    │
│  │───────────────────────────────────────────  │    │
│  │  RF  Raza Feroz                  Inactive  │    │
│  │      PKG: 5Mbps   •  ₨1,500/mo    ₨3,500  │    │
│  │───────────────────────────────────────────  │    │
│  │  ...                                       │    │
│  └────────────────────────────────────────────┘    │
│                                                     │
│  Showing 25 of 2,450                               │  ← Pagination info
└────────────────────────────────────────────────────┘
```

### List Page Styling

```javascript
// Search bar
searchContainer: {
  marginHorizontal: 16,
  marginBottom: 12,
},
searchBar: {
  height: 44,
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#FFFFFF',
  borderRadius: 8,
  paddingHorizontal: 12,
  borderWidth: 1,
  borderColor: colors.neutral[200],
},
searchIcon: {
  marginRight: 8,
  color: colors.neutral[400],
},
searchInput: {
  flex: 1,
  fontSize: 14,
  color: colors.neutral[800],
},

// Filter chips row
filterRow: {
  paddingHorizontal: 16,
  marginBottom: 16,
},
filterChip: {
  height: 32,
  paddingHorizontal: 14,
  borderRadius: 9999,
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 8,
},
filterChipActive: {
  backgroundColor: colors.primary[600],
},
filterChipInactive: {
  backgroundColor: colors.neutral[100],
},
filterChipTextActive: {
  fontSize: 12,
  fontWeight: '600',
  color: '#FFFFFF',
},
filterChipTextInactive: {
  fontSize: 12,
  fontWeight: '600',
  color: colors.neutral[600],
},

// Rich List Item (2-line with metadata)
richListItem: {
  backgroundColor: '#FFFFFF',
  paddingHorizontal: 16,
  paddingVertical: 14,
},
richListItemRow: {
  flexDirection: 'row',
  alignItems: 'center',
},
richListItemAvatar: {
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: colors.primary[50],
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 12,
},
richListItemAvatarText: {
  fontSize: 14,
  fontWeight: '600',
  color: colors.primary[700],
},
richListItemContent: {
  flex: 1,
},
richListItemTitle: {
  fontSize: 14,
  fontWeight: '600',
  color: colors.neutral[800],
},
richListItemMeta: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 3,
  gap: 6,
},
richListItemMetaText: {
  fontSize: 12,
  color: colors.neutral[500],
},
richListItemMetaDot: {
  width: 3,
  height: 3,
  borderRadius: 1.5,
  backgroundColor: colors.neutral[300],
},
richListItemTrailing: {
  alignItems: 'flex-end',
},
richListItemBalance: {
  fontSize: 14,
  fontWeight: '600',
  color: colors.neutral[800],
},

// List container (white card wrapping the entire list)
listCard: {
  backgroundColor: '#FFFFFF',
  borderRadius: 12,
  marginHorizontal: 16,
  borderWidth: 1,
  borderColor: colors.neutral[200],
  overflow: 'hidden',      // Clip items to card border radius
},
listSeparator: {
  height: 1,
  backgroundColor: colors.neutral[100],
  marginLeft: 68,           // Avatar width (40) + padding (12) + list padding (16)
},
```

### CRUD Page Rules
- ✅ List items live inside a **single white card container** (not individual cards per item)
- ✅ Each item shows: **Avatar + Name + Metadata row + Status badge + Trailing value**
- ✅ Search bar is in its own container, above the filter chips
- ✅ Filter chips scroll horizontally if more than 4
- ✅ Separator lines are **indented** (start at text, not at edge)
- ✅ Add button is in the **header right**, not floating
- ❌ NO individual cards per list item — too much visual noise
- ❌ NO FAB (Floating Action Button) — use header action instead
- ❌ NO swipe actions (unreliable, not discoverable) — use detail screen
- ❌ NO colored avatars (all use primary[50] bg with primary[700] text)

---

## 3. Form / Data Entry Pages

**Purpose**: Create or edit an entity. Clean, focused, minimal distraction.

### Visual Anatomy
```
┌────────────────────────────────────────────────────┐
│  [✕ Close]      New Customer         [Save]        │  ← Modal-style header
│─────────────────────────────────────────────────── │
│  bg: neutral[50]                                    │
│                                                     │
│  ┌─ Personal Information ──────────────────────┐   │
│  │  bg: white, radius 12, pad 16               │   │
│  │                                              │   │
│  │  Full Name *                                 │   │
│  │  ┌──────────────────────────────────────┐   │   │
│  │  │  [👤]  Enter full name               │   │   │
│  │  └──────────────────────────────────────┘   │   │
│  │                                              │   │
│  │  Phone Number *                              │   │
│  │  ┌──────────────────────────────────────┐   │   │
│  │  │  [📞]  Enter phone number            │   │   │
│  │  └──────────────────────────────────────┘   │   │
│  │                                              │   │
│  │  Email                                       │   │
│  │  ┌──────────────────────────────────────┐   │   │
│  │  │  [✉️]  Enter email address           │   │   │
│  │  └──────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─ Service Details ──────────────────────────┐    │
│  │  bg: white, radius 12, pad 16              │    │
│  │                                             │    │
│  │  Package *                                  │    │
│  │  ┌──────────────────────────────────┐      │    │
│  │  │  Select package...            ▾  │      │    │
│  │  └──────────────────────────────────┘      │    │
│  │                                             │    │
│  │  Installation Address *                     │    │
│  │  ┌──────────────────────────────────┐      │    │
│  │  │                                  │      │    │
│  │  │  Enter address (multiline)       │      │    │
│  │  │                                  │      │    │
│  │  └──────────────────────────────────┘      │    │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌────────────────────────────────────────────┐    │
│  │        [ Save Customer ]                   │    │  ← Full-width primary button
│  └────────────────────────────────────────────┘    │
│                                                     │
└────────────────────────────────────────────────────┘
```

### Form Page Styling

```javascript
// Form page uses GROUPED SECTIONS inside white cards
formScreen: {
  flex: 1,
  backgroundColor: colors.neutral[50],
},
formScroll: {
  paddingHorizontal: 16,
  paddingTop: 16,
  paddingBottom: 48,
},

// Section card (groups related fields)
formSection: {
  backgroundColor: '#FFFFFF',
  borderRadius: 12,
  padding: 16,
  marginBottom: 16,
  borderWidth: 1,
  borderColor: colors.neutral[200],
},
formSectionTitle: {
  fontSize: 14,
  fontWeight: '700',
  color: colors.neutral[800],
  marginBottom: 16,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
},

// Field grouping (2 fields side by side for short values)
fieldRow: {
  flexDirection: 'row',
  gap: 12,
},
fieldHalf: {
  flex: 1,
},

// Submit area
submitContainer: {
  paddingHorizontal: 16,
  paddingVertical: 16,
  paddingBottom: 24,
},
submitButton: {
  height: 48,
  backgroundColor: colors.primary[600],
  borderRadius: 8,
  justifyContent: 'center',
  alignItems: 'center',
},
submitButtonDisabled: {
  backgroundColor: colors.neutral[300],
},
submitButtonText: {
  fontSize: 16,
  fontWeight: '600',
  color: '#FFFFFF',
  letterSpacing: 0.3,
},
```

### Form Page Rules
- ✅ Fields grouped inside **white section cards** with title
- ✅ Section titles are **uppercase, small, bold** (info-label pattern)
- ✅ Screen background is **neutral[50]** — cards float on gray
- ✅ Short fields (city/zip) go **side-by-side** in a row
- ✅ Submit button is **full-width solid primary** at bottom
- ✅ Modal-style: close (X) left, title center, Save right
- ❌ NO gradient buttons on forms — solid primary[600]
- ❌ NO accordion/collapse for sections — all visible
- ❌ NO tabs within forms — use vertical scroll
- ❌ NO inline save (auto-save) — always explicit Save button

---

## 4. Detail / View Pages

**Purpose**: Show everything about one entity. Info-dense but organized.

### Visual Anatomy
```
┌────────────────────────────────────────────────────┐
│  [← Back]    Customer Detail         [⋯]           │  ← Header with overflow menu
│─────────────────────────────────────────────────── │
│  bg: neutral[50]                                    │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │  bg: white                                    │  │
│  │                                               │  │
│  │    [  AK  ]     Ahmad Khan           Active   │  │  ← Entity header
│  │                 PKG: 10Mbps Premium            │  │
│  │                 ID: CUST-0042                  │  │
│  │                                               │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐   │  │  ← Action buttons
│  │  │ 📞 Call  │  │ 💬 WhApp │  │ ✏️ Edit  │   │  │
│  │  └──────────┘  └──────────┘  └──────────┘   │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  Account Info                                       │  ← Section header
│  ┌──────────────────────────────────────────────┐  │
│  │  Phone          +92 300 1234567              │  │  ← Info rows
│  │─────────────────────────────────────────────  │  │
│  │  Address        House 5, Street 7, Lahore    │  │
│  │─────────────────────────────────────────────  │  │
│  │  Joined         Jan 15, 2024                 │  │
│  │─────────────────────────────────────────────  │  │
│  │  Balance        ₨5,000                       │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  Recent Invoices                        See All >  │
│  ┌──────────────────────────────────────────────┐  │
│  │  INV-0234   Jan 2024   ₨2,500        Paid   │  │
│  │──────────────────────────────────────────────│  │
│  │  INV-0235   Feb 2024   ₨2,500      Pending  │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
└────────────────────────────────────────────────────┘
```

### Detail Page Styling

```javascript
// Entity header card
entityHeader: {
  backgroundColor: '#FFFFFF',
  padding: 20,
  alignItems: 'center',
  borderBottomWidth: 1,
  borderBottomColor: colors.neutral[100],
},
entityAvatar: {
  width: 64,
  height: 64,
  borderRadius: 32,
  backgroundColor: colors.primary[50],
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: 12,
},
entityAvatarText: {
  fontSize: 22,
  fontWeight: '700',
  color: colors.primary[700],
},
entityName: {
  fontSize: 20,
  fontWeight: '700',
  color: colors.neutral[900],
},
entitySubtitle: {
  fontSize: 14,
  color: colors.neutral[500],
  marginTop: 2,
},
entityId: {
  fontSize: 12,
  color: colors.neutral[400],
  marginTop: 2,
  fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
},

// Action buttons row
actionButtonsRow: {
  flexDirection: 'row',
  gap: 12,
  marginTop: 16,
},
actionButton: {
  flex: 1,
  height: 40,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  backgroundColor: colors.neutral[50],
  borderRadius: 8,
  borderWidth: 1,
  borderColor: colors.neutral[200],
},
actionButtonText: {
  fontSize: 12,
  fontWeight: '600',
  color: colors.neutral[700],
},

// Info section card
infoCard: {
  backgroundColor: '#FFFFFF',
  borderRadius: 12,
  marginHorizontal: 16,
  marginTop: 12,
  borderWidth: 1,
  borderColor: colors.neutral[200],
  overflow: 'hidden',
},

// Info row (label + value)
infoRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingHorizontal: 16,
  paddingVertical: 14,
},
infoRowBorder: {
  borderBottomWidth: 1,
  borderBottomColor: colors.neutral[100],
},
infoLabel: {
  fontSize: 14,
  color: colors.neutral[500],
},
infoValue: {
  fontSize: 14,
  fontWeight: '500',
  color: colors.neutral[800],
  textAlign: 'right',
  maxWidth: '60%',
},
```

### Detail Page Rules
- ✅ Entity header has **centered avatar + name + meta** at the top
- ✅ Quick actions are **outlined buttons in a row** below the header
- ✅ Info sections use **label-value rows** inside white cards
- ✅ Related entities (invoices, complaints) are **mini-lists** with "See All" link
- ✅ Overflow menu (⋯) in header for dangerous actions (delete, deactivate)
- ❌ NO tabs on detail page — use vertical scroll with sections
- ❌ NO edit-in-place — navigate to edit form screen
- ❌ NO colored header background — always white
- ❌ NO pull-up info (bottom sheet header) — simple scroll

---

## 5. Settings / Profile Pages

### Visual Anatomy
```
Group rows inside white cards with section titles:

Account                     ← uppercase label
┌─────────────────────────────────────┐
│  👤  Profile                    >   │
│─────────────────────────────────────│
│  🔒  Change Password           >   │
│─────────────────────────────────────│
│  🔔  Notifications             >   │
└─────────────────────────────────────┘

Support
┌─────────────────────────────────────┐
│  📞  Contact Support            >   │
│─────────────────────────────────────│
│  ℹ️  About                      >   │
└─────────────────────────────────────┘

[  Sign Out  ]     ← outline danger button
```

```javascript
settingsCard: {
  backgroundColor: '#FFFFFF',
  borderRadius: 12,
  marginHorizontal: 16,
  marginBottom: 16,
  borderWidth: 1,
  borderColor: colors.neutral[200],
  overflow: 'hidden',
},
settingsRow: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 16,
  paddingVertical: 14,
},
settingsIcon: {
  width: 32,
  height: 32,
  borderRadius: 8,
  backgroundColor: colors.neutral[100],
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 12,
},
settingsLabel: {
  flex: 1,
  fontSize: 14,
  fontWeight: '500',
  color: colors.neutral[800],
},
settingsChevron: {
  color: colors.neutral[300],
},
settingsSectionLabel: {
  fontSize: 12,
  fontWeight: '700',
  color: colors.neutral[500],
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  paddingHorizontal: 16,
  marginBottom: 8,
  marginTop: 24,
},
```

---

## Global Styling Truths (Apply to ALL pages)

### 1. Background is ALWAYS `neutral[50]` (#F8FAFC)
No white full-screen backgrounds. No colored backgrounds. The light gray creates contrast for white cards.

### 2. Cards are ALWAYS white with thin border
```javascript
standardCard: {
  backgroundColor: '#FFFFFF',
  borderRadius: 12,
  borderWidth: 1,
  borderColor: colors.neutral[200],  // subtle, barely visible
  ...shadows.sm,                     // barely perceptible shadow
}
```

### 3. Status is shown via Badge ONLY
| Status | Badge bg | Badge text |
|--------|----------|------------|
| Active / Paid / Online | successLight | successDark |
| Pending / Due | warningLight | warningDark |
| Inactive / Failed / Overdue | errorLight | errorDark |
| Default / Draft | neutral[100] | neutral[600] |

### 4. Money always in bold
```javascript
moneyText: {
  fontSize: 14,
  fontWeight: '600',
  color: colors.neutral[900],
  // Negative amounts in errorDark
}
```

### 5. Dates always formatted consistently
```
Format: "Jan 15, 2024"   (short month, day, 4-digit year)
Time:   "2:30 PM"         (12-hour with AM/PM)
Relative: "2 min ago"     (for recent activity < 24h)
```

### 6. Loading is ALWAYS skeleton, NEVER just a spinner
Every page type has its own skeleton shape matching the expected content layout.

### 7. Empty state is ALWAYS icon + title + subtitle (centered)
Consistent empty state treatment across all page types.

### 8. No more than 2 font weights visible at once
On any given screen section, use maximum:
- **Bold/SemiBold** for titles/values
- **Regular** for descriptions/labels
Never mix Regular, Medium, SemiBold, Bold in the same visual section.
