# State Management

> **Zustand & React Query State Management for ISP Management Mobile App**

---

## 🏗️ State Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        UI Layer                              │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  Client State │    │  Server State │    │  Form State   │
│   (Zustand)   │    │ (React Query) │    │ (React Hook   │
│               │    │               │    │     Form)     │
└───────────────┘    └───────────────┘    └───────────────┘
        │                     │                     │
        ▼                     ▼                     │
┌───────────────┐    ┌───────────────┐              │
│ SecureStore/  │    │   API Client  │              │
│ AsyncStorage  │    │               │              │
└───────────────┘    └───────────────┘              │
                                                    ▼
                                          ┌───────────────┐
                                          │   Zod Schema  │
                                          │  (Validation) │
                                          └───────────────┘
```

---

## 🐻 Zustand Stores

### Auth Store

```typescript
// src/store/auth.store.ts
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'manager' | 'technician' | 'accountant' | 'collector' | 'support';
  picture?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setAuthenticated: (value: boolean) => void;
  setLoading: (value: boolean) => void;
  logout: () => void;
  hasRole: (roles: string[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setAuthenticated: (value) => set({ isAuthenticated: value }),
      setLoading: (value) => set({ isLoading: value }),
      
      logout: () => {
        SecureStore.deleteItemAsync('auth_token');
        set({ user: null, isAuthenticated: false });
      },

      hasRole: (roles) => {
        const { user } = get();
        return user ? roles.includes(user.role) : false;
      },
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
```

---

### UI Store

```typescript
// src/store/ui.store.ts
import { create } from 'zustand';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
}

interface UIState {
  // Toasts
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  
  // Loading overlay
  globalLoading: boolean;
  setGlobalLoading: (value: boolean) => void;
  
  // Sidebar (tablet)
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  
  // Bottom sheet
  bottomSheetContent: React.ReactNode | null;
  openBottomSheet: (content: React.ReactNode) => void;
  closeBottomSheet: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).slice(2);
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
    // Auto remove after 4 seconds
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 4000);
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  globalLoading: false,
  setGlobalLoading: (value) => set({ globalLoading: value }),

  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  bottomSheetContent: null,
  openBottomSheet: (content) => set({ bottomSheetContent: content }),
  closeBottomSheet: () => set({ bottomSheetContent: null }),
}));
```

---

### Filter Store

```typescript
// src/store/filter.store.ts
import { create } from 'zustand';

interface CustomerFilters {
  status?: 'active' | 'inactive' | 'suspended';
  area_id?: string;
  sub_zone_id?: string;
  isp_id?: string;
  search?: string;
}

interface PaymentFilters {
  status?: 'completed' | 'pending';
  payment_method?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

interface FilterState {
  customerFilters: CustomerFilters;
  paymentFilters: PaymentFilters;
  
  setCustomerFilters: (filters: Partial<CustomerFilters>) => void;
  resetCustomerFilters: () => void;
  
  setPaymentFilters: (filters: Partial<PaymentFilters>) => void;
  resetPaymentFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  customerFilters: {},
  paymentFilters: {},

  setCustomerFilters: (filters) =>
    set((state) => ({
      customerFilters: { ...state.customerFilters, ...filters },
    })),
  resetCustomerFilters: () => set({ customerFilters: {} }),

  setPaymentFilters: (filters) =>
    set((state) => ({
      paymentFilters: { ...state.paymentFilters, ...filters },
    })),
  resetPaymentFilters: () => set({ paymentFilters: {} }),
}));
```

---

## 🔄 React Query Setup

### Query Client Configuration

```typescript
// src/services/query.client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});
```

### Query Key Factory

```typescript
// src/hooks/queries/keys.ts
export const queryKeys = {
  // Customers
  customers: {
    all: ['customers'] as const,
    lists: () => [...queryKeys.customers.all, 'list'] as const,
    list: (params: Record<string, any>) => [...queryKeys.customers.lists(), params] as const,
    details: () => [...queryKeys.customers.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.customers.details(), id] as const,
    invoices: (id: string) => [...queryKeys.customers.detail(id), 'invoices'] as const,
    payments: (id: string) => [...queryKeys.customers.detail(id), 'payments'] as const,
  },

  // Payments
  payments: {
    all: ['payments'] as const,
    lists: () => [...queryKeys.payments.all, 'list'] as const,
    list: (params: Record<string, any>) => [...queryKeys.payments.lists(), params] as const,
    detail: (id: string) => [...queryKeys.payments.all, 'detail', id] as const,
  },

  // Invoices
  invoices: {
    all: ['invoices'] as const,
    lists: () => [...queryKeys.invoices.all, 'list'] as const,
    list: (params: Record<string, any>) => [...queryKeys.invoices.lists(), params] as const,
    detail: (id: string) => [...queryKeys.invoices.all, 'detail', id] as const,
  },

  // Dashboard
  dashboard: {
    executive: ['dashboard', 'executive'] as const,
    financial: ['dashboard', 'financial'] as const,
    customers: ['dashboard', 'customers'] as const,
  },
};
```

---

## 📝 Form State (React Hook Form + Zod)

### Customer Form Schema

```typescript
// src/schemas/customer.schema.ts
import { z } from 'zod';

export const customerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone_1: z.string().min(10, 'Phone number must be at least 10 digits'),
  phone_2: z.string().optional(),
  cnic: z.string().regex(/^\d{5}-\d{7}-\d{1}$/, 'Invalid CNIC format'),
  installation_address: z.string().min(5, 'Address is required'),
  area_id: z.string().uuid('Please select an area'),
  sub_zone_id: z.string().uuid('Please select a sub-zone').optional(),
  service_plan_id: z.string().uuid('Please select a service plan'),
  status: z.enum(['active', 'inactive', 'suspended']),
  monthly_charges: z.number().positive('Monthly charges must be positive'),
});

export type CustomerFormData = z.infer<typeof customerSchema>;
```

### Form Usage

```typescript
// src/screens/admin/CustomerFormScreen.tsx
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export const CustomerFormScreen = () => {
  const { control, handleSubmit, formState: { errors } } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      status: 'active',
    },
  });

  const createMutation = useCreateCustomer();

  const onSubmit = (data: CustomerFormData) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        toast.show({ type: 'success', message: 'Customer created successfully' });
        router.back();
      },
      onError: (error) => {
        toast.show({ type: 'error', message: handleApiError(error) });
      },
    });
  };

  return (
    <ScrollView>
      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, value } }) => (
          <TextInput
            label="Customer Name"
            value={value}
            onChangeText={onChange}
            error={errors.name?.message}
            required
          />
        )}
      />
      {/* More fields... */}
      <Button onPress={handleSubmit(onSubmit)} loading={createMutation.isPending}>
        Create Customer
      </Button>
    </ScrollView>
  );
};
```

---

## 🗺️ State Summary

| State Type | Tool | Purpose |
|------------|------|---------|
| Authentication | Zustand + SecureStore | User session, token |
| UI State | Zustand | Toasts, loading, modals |
| Filters | Zustand | List filters, search |
| Server Data | React Query | API data, caching |
| Form State | React Hook Form + Zod | Form values, validation |
