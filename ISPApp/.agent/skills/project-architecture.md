---
description: Mandatory project file structure and architecture patterns for ISPApp. Defines where every file goes, naming conventions, and the Clean Architecture layering rules.
---

# Project Architecture — File Structure & Design Pattern

> **RULE**: Every file MUST be placed in the correct directory following this exact structure. Never create files outside these defined paths. Never put logic in the wrong layer.

## Architecture Pattern: Feature-Based Clean Architecture

```
ISPApp/
├── App.js                          ← Root: auth check + navigator selection
├── app.json                        ← Expo config
├── package.json
├── babel.config.js
├── metro.config.js
│
├── assets/                         ← Static assets only
│   ├── adaptive-icon.png
│   ├── icon.png
│   ├── splash.png
│   └── fonts/                      ← Custom fonts (if any)
│
├── config/
│   └── constants.js                ← Global constants (API URL, legacy colors)
│
├── src/                            ← ALL source code lives here
│   │
│   ├── theme/                      ← Design system tokens
│   │   └── index.js                ← colors, typography, spacing, shadows, textStyles
│   │
│   ├── components/                 ← SHARED reusable components only
│   │   ├── ui/                     ← Generic primitives (Button, Card, Badge, Avatar, Divider)
│   │   │   ├── Button.js
│   │   │   ├── Card.js
│   │   │   ├── Badge.js
│   │   │   ├── Avatar.js
│   │   │   ├── Divider.js
│   │   │   ├── SkeletonBox.js
│   │   │   └── index.js           ← Barrel export
│   │   ├── form/                   ← Form components (FormInput, FormSelect, FormDatePicker)
│   │   │   ├── FormInput.js
│   │   │   ├── FormSelect.js
│   │   │   └── index.js
│   │   ├── data/                   ← Data display (StatCard, ListItem, SectionHeader, EmptyState, ErrorState)
│   │   │   ├── StatCard.js
│   │   │   ├── ListItem.js
│   │   │   ├── SectionHeader.js
│   │   │   ├── EmptyState.js
│   │   │   ├── ErrorState.js
│   │   │   └── index.js
│   │   └── feedback/               ← Feedback (Toast, LoadingOverlay, ConfirmModal)
│   │       ├── Toast.js
│   │       ├── LoadingOverlay.js
│   │       ├── ConfirmModal.js
│   │       └── index.js
│   │
│   ├── screens/                    ← Screens grouped by user portal
│   │   ├── auth/                   ← Unauthenticated screens
│   │   │   ├── LoginScreen.js
│   │   │   └── ForgotPasswordScreen.js
│   │   │
│   │   ├── admin/                  ← Admin/Owner portal screens
│   │   │   ├── DashboardScreen.js
│   │   │   ├── CustomerListScreen.js
│   │   │   ├── CustomerDetailScreen.js
│   │   │   ├── CreateCustomerScreen.js
│   │   │   ├── PaymentListScreen.js
│   │   │   ├── InvoiceListScreen.js
│   │   │   ├── ComplaintListScreen.js
│   │   │   ├── EmployeeListScreen.js
│   │   │   └── SettingsScreen.js
│   │   │
│   │   ├── employee/               ← Employee portal screens
│   │   │   ├── DashboardScreen.js
│   │   │   ├── TaskListScreen.js
│   │   │   ├── ComplaintListScreen.js
│   │   │   └── ProfileScreen.js
│   │   │
│   │   └── customer/               ← Customer portal screens
│   │       ├── DashboardScreen.js
│   │       ├── InvoiceListScreen.js
│   │       ├── ComplaintListScreen.js
│   │       └── ProfileScreen.js
│   │
│   ├── navigation/                 ← All navigation config
│   │   ├── index.js                ← Root navigator (auth vs main)
│   │   ├── AuthStack.js            ← Auth stack (login, forgot password)
│   │   ├── AdminTabs.js            ← Admin bottom tab navigator
│   │   ├── EmployeeTabs.js         ← Employee bottom tab navigator
│   │   ├── CustomerTabs.js         ← Customer bottom tab navigator
│   │   └── linking.js              ← Deep linking config (if needed)
│   │
│   ├── services/                   ← API layer (HTTP calls only)
│   │   ├── api.client.js           ← Axios instance + interceptors
│   │   ├── auth.service.js         ← POST /auth/login, etc.
│   │   ├── customer.service.js     ← CRUD /customers/
│   │   ├── payment.service.js      ← CRUD /payments/
│   │   ├── invoice.service.js      ← CRUD /invoices/
│   │   └── complaint.service.js    ← CRUD /complaints/
│   │
│   ├── hooks/                      ← Custom React hooks
│   │   ├── queryKeys.js            ← React Query key factory
│   │   ├── useCustomers.js         ← React Query hooks for customers
│   │   ├── usePayments.js          ← React Query hooks for payments
│   │   ├── useInvoices.js          ← React Query hooks for invoices
│   │   ├── useComplaints.js        ← React Query hooks for complaints
│   │   └── useDashboard.js         ← React Query hooks for dashboard stats
│   │
│   ├── stores/                     ← Zustand stores (client state only)
│   │   ├── auth.store.js           ← Auth state (token, role, user)
│   │   ├── filter.store.js         ← Active filters, search query
│   │   └── ui.store.js             ← UI state (toast, modal visibility)
│   │
│   └── utils/                      ← Pure utility functions
│       ├── format.js               ← formatCurrency, formatDate, formatPhone
│       ├── validation.js           ← validateEmail, validatePhone, validateRequired
│       └── helpers.js              ← getInitials, getStatusColor, truncateText
│
├── docs/                           ← Documentation (not shipped in build)
│   ├── design-system.md
│   ├── api-integration.md
│   └── screens/
│       ├── auth-screens.md
│       └── ...
│
└── .agent/                         ← Agent skills (not shipped in build)
    └── skills/
        ├── design-tokens.md
        ├── screen-template.md
        ├── component-patterns.md
        ├── card-and-list-patterns.md
        ├── form-patterns.md
        ├── navigation-and-layout.md
        ├── api-and-state-patterns.md
        ├── animation-and-interaction.md
        └── project-architecture.md  ← This file
```

## Layer Rules (Clean Architecture)

```
┌─────────────────────────────────────────────────┐
│                   SCREENS                        │  ← UI only. No API calls here.
│   Import: components, hooks, stores, theme       │
├─────────────────────────────────────────────────┤
│                    HOOKS                         │  ← React Query wrappers. Call services.
│   Import: services, queryKeys                    │
├─────────────────────────────────────────────────┤
│                   STORES                         │  ← Client state only. No server data.
│   Import: services (for auth only)               │
├─────────────────────────────────────────────────┤
│                  SERVICES                        │  ← HTTP calls only. Return res.data.
│   Import: api.client                             │
├─────────────────────────────────────────────────┤
│               COMPONENTS                         │  ← Reusable, stateless, presentational.
│   Import: theme only                             │
├─────────────────────────────────────────────────┤
│                   THEME                          │  ← Pure constants. No imports.
│   Import: nothing                                │
└─────────────────────────────────────────────────┘
```

### What imports what:
| Layer | Can import | CANNOT import |
|-------|-----------|---------------|
| `screens/` | components, hooks, stores, theme, utils | services directly |
| `hooks/` | services, queryKeys | screens, components, stores |
| `stores/` | services (auth only) | screens, hooks, components |
| `services/` | api.client only | everything else |
| `components/` | theme, utils | screens, hooks, stores, services |
| `theme/` | nothing | everything |
| `utils/` | nothing | everything |

## Naming Conventions

### Files
| Type | Pattern | Example |
|------|---------|---------|
| Screen | `{Name}Screen.js` | `CustomerListScreen.js` |
| Component | `{Name}.js` (PascalCase) | `StatCard.js` |
| Service | `{entity}.service.js` | `customer.service.js` |
| Hook | `use{Entity}.js` | `useCustomers.js` |
| Store | `{name}.store.js` | `auth.store.js` |
| Utility | `{name}.js` (camelCase) | `format.js` |
| Navigator | `{Name}Tabs.js` or `{Name}Stack.js` | `AdminTabs.js` |

### Exports
| Type | Export Style | Example |
|------|-------------|---------|
| Screen | `export default` | `export default CustomerListScreen` |
| Component | `export default` + barrel re-export | `export { Button } from './Button'` |
| Service | Named export (object) | `export const customerService = {...}` |
| Hook | Named export (function) | `export const useCustomers = () => {...}` |
| Store | `export default` | `export default useAuthStore` |
| Utils | Named exports | `export const formatCurrency = () => {...}` |

### Import Aliases (for readability)
```javascript
// ✅ Use relative paths from current file:
import { Button, Card } from '../../components/ui';
import { colors, spacing } from '../../theme';
import { useCustomers } from '../../hooks/useCustomers';
import { customerService } from '../../services/customer.service';

// ❌ NEVER use absolute paths or @/ aliases (not configured):
import { Button } from '@/components/ui';
```

## Where Does New Code Go?

| I need to... | Put it in... |
|--------------|-------------|
| Add a new screen | `src/screens/{portal}/{Name}Screen.js` |
| Add a reusable button/card | `src/components/ui/{Name}.js` + update `index.js` |
| Add a form input variant | `src/components/form/{Name}.js` + update `index.js` |
| Add an API endpoint | `src/services/{entity}.service.js` |
| Add a React Query hook | `src/hooks/use{Entity}.js` |
| Add client-side state | `src/stores/{name}.store.js` |
| Add a helper function | `src/utils/{name}.js` |
| Add a new tab navigator | `src/navigation/{Role}Tabs.js` |
| Add a design token | `src/theme/index.js` — ONLY after consulting design-tokens skill |
| Add a static image | `assets/` |
| Add a custom font | `assets/fonts/` + load in `App.js` |

## Anti-Patterns

❌ **NEVER:**
- Put screens in `components/` — screens are pages, components are reusable pieces
- Put API calls directly in screens — always go through `hooks/` → `services/`
- Put business logic in components — components are presentational only
- Create a `helpers/` folder at root — utilities go in `src/utils/`
- Create screen-specific components inside `screens/` — extract to `components/`
- Mix different portals' screens — admin screens stay in `admin/`, never in `employee/`
- Import `theme` values from `config/constants.js` — always import from `src/theme`
- Store server data in Zustand — use React Query for all server state

## Creating a New Feature Checklist

When adding a new feature (e.g., "Employee Management"), create files in this order:

1. **Service** → `src/services/employee.service.js`
2. **Query Keys** → Add to `src/hooks/queryKeys.js`
3. **Hooks** → `src/hooks/useEmployees.js`
4. **Screen** → `src/screens/admin/EmployeeListScreen.js`
5. **Navigation** → Register in `src/navigation/AdminTabs.js`
6. **Components** → Only if a new reusable component is needed

This order ensures dependencies are resolved bottom-up.
