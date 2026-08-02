---
description: Standard API integration and state management patterns for ISPApp. Covers data fetching, Zustand stores, React Query usage, and error handling.
---

# API & State Patterns — Data Fetching Standard

> **RULE**: Every data fetch goes through `apiClient`. Every server-state uses React Query hooks. Every client-state uses Zustand. No exceptions.

## State Decision Matrix

| Data Type | Solution | Example |
|-----------|----------|---------|
| Server data (lists, details) | React Query | Customer list, invoice detail |
| Auth state | Zustand + SecureStore | Token, role, user info |
| UI state (modals, toggles) | Local `useState` | Modal open/close, tab index |
| Filters / search | Zustand store | Active filters, search query |
| Form data | Local `useState` | Form field values |
| Cross-screen shared state | Zustand | Selected customer, active filters |

## API Service Layer

### File structure
```
src/services/
├── api.client.js         # Axios instance (already created)
├── auth.service.js       # Auth API calls
├── customer.service.js   # Customer API calls
├── payment.service.js    # Payment API calls
├── invoice.service.js    # Invoice API calls
└── complaint.service.js  # Complaint API calls
```

### Service file template
```javascript
// customer.service.js
import apiClient from './api.client';

export const customerService = {
  getAll: (params) =>
    apiClient.get('/customers/', { params }).then(res => res.data),

  getById: (id) =>
    apiClient.get(`/customers/${id}`).then(res => res.data),

  create: (data) =>
    apiClient.post('/customers/', data).then(res => res.data),

  update: (id, data) =>
    apiClient.put(`/customers/${id}`, data).then(res => res.data),

  delete: (id) =>
    apiClient.delete(`/customers/${id}`).then(res => res.data),

  search: (query) =>
    apiClient.get('/customers/search', { params: { q: query } }).then(res => res.data),
};
```

## React Query Hooks

### Query Key Factory
```javascript
// src/hooks/queryKeys.js
export const queryKeys = {
  customers: {
    all:    ['customers'],
    list:   (params) => ['customers', 'list', params],
    detail: (id) => ['customers', 'detail', id],
    search: (query) => ['customers', 'search', query],
  },
  payments: {
    all:    ['payments'],
    list:   (params) => ['payments', 'list', params],
    detail: (id) => ['payments', 'detail', id],
  },
  invoices: {
    all:    ['invoices'],
    list:   (params) => ['invoices', 'list', params],
    detail: (id) => ['invoices', 'detail', id],
  },
  complaints: {
    all:    ['complaints'],
    list:   (params) => ['complaints', 'list', params],
    detail: (id) => ['complaints', 'detail', id],
  },
  dashboard: {
    stats:  ['dashboard', 'stats'],
    recent: ['dashboard', 'recent'],
  },
};
```

### Custom Query Hook Template
```javascript
// src/hooks/useCustomers.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService } from '../services/customer.service';
import { queryKeys } from './queryKeys';

// ── List Hook ──────────────────────────────────────────
export const useCustomers = (params = {}) => {
  return useQuery({
    queryKey: queryKeys.customers.list(params),
    queryFn: () => customerService.getAll(params),
    staleTime: 1000 * 60 * 5,    // 5 minutes
    retry: 2,
  });
};

// ── Detail Hook ────────────────────────────────────────
export const useCustomer = (id) => {
  return useQuery({
    queryKey: queryKeys.customers.detail(id),
    queryFn: () => customerService.getById(id),
    enabled: !!id,               // Don't fetch if no id
    staleTime: 1000 * 60 * 5,
  });
};

// ── Create Mutation ────────────────────────────────────
export const useCreateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: customerService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
    },
  });
};

// ── Update Mutation ────────────────────────────────────
export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => customerService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.detail(id) });
    },
  });
};

// ── Delete Mutation ────────────────────────────────────
export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: customerService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
    },
  });
};
```

### Usage in Screen
```javascript
const CustomerListScreen = () => {
  const [filters, setFilters] = useState({ status: 'all', page: 1 });
  const { data, isLoading, isError, error, refetch } = useCustomers(filters);

  // Loading → show skeleton
  if (isLoading) return <CustomerListSkeleton />;

  // Error → show retry
  if (isError) return <ErrorState message={error.message} onRetry={refetch} />;

  // Empty → show empty state
  if (data?.length === 0) return <EmptyState ... />;

  // Success → render list
  return <FlatList data={data} ... />;
};
```

## Zustand Store Pattern

### Store template
```javascript
// src/stores/{name}.store.js
import { create } from 'zustand';

const useFilterStore = create((set, get) => ({
  // ── State ────────────────────────────
  searchQuery: '',
  statusFilter: 'all',
  sortBy: 'name',
  sortOrder: 'asc',

  // ── Actions ──────────────────────────
  setSearchQuery: (query) => set({ searchQuery: query }),
  setStatusFilter: (status) => set({ statusFilter: status }),
  setSortBy: (field) => set({ sortBy: field }),
  toggleSortOrder: () => set((state) => ({
    sortOrder: state.sortOrder === 'asc' ? 'desc' : 'asc',
  })),
  resetFilters: () => set({
    searchQuery: '',
    statusFilter: 'all',
    sortBy: 'name',
    sortOrder: 'asc',
  }),
}));

export default useFilterStore;
```

## Error Handling Pattern

### API errors should be handled at 3 levels:
1. **Interceptor level** (api.client.js): 401 → logout, network errors
2. **React Query level**: `retry: 2`, `onError` callbacks
3. **Screen level**: Display error state with retry button

### Never show raw error messages to users
```javascript
// ✅ CORRECT — friendly message
const getErrorMessage = (error) => {
  if (!error.response) return 'Network error. Check your connection.';
  if (error.response.status === 404) return 'Item not found.';
  if (error.response.status === 403) return 'You don\'t have permission.';
  if (error.response.status >= 500) return 'Server error. Try again later.';
  return error.response.data?.error || 'Something went wrong.';
};

// ❌ WRONG — raw error
<Text>{error.message}</Text>   // "Request failed with status code 500"
```

## QueryClient Configuration
```javascript
// In App.js
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,     // 5 min
      cacheTime: 1000 * 60 * 30,    // 30 min
      retry: 2,
      refetchOnWindowFocus: false,   // Mobile doesn't need this
    },
    mutations: {
      retry: 1,
    },
  },
});
```

## Rules
1. NEVER call axios/fetch directly in components — always through service layer
2. EVERY list query uses the query key factory
3. EVERY mutation invalidates related queries on success
4. EVERY screen shows skeleton loading (not just a spinner)
5. EVERY error shows a retry button
6. Zustand stores are ONLY for client state — never duplicate server data
7. React Query is ONLY for server state — never for UI toggles
8. Service files return `res.data` (unwrap Axios response)
