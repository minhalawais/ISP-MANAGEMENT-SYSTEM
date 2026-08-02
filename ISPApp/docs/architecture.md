# Application Architecture

> **Clean Architecture for ISP Management Mobile App**

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Screens   │  │  Components │  │    Navigation       │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    Application Layer                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │    Hooks    │  │    Store    │  │    Use Cases        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                       Data Layer                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Services  │  │ Repositories│  │    API Client       │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Folder Structure

```
mobile-app/
├── app/                          # Expo Router pages
│   ├── (auth)/                   # Auth group
│   │   ├── login.tsx
│   │   ├── forgot-password.tsx
│   │   └── _layout.tsx
│   ├── (admin)/                  # Admin portal group
│   │   ├── (tabs)/
│   │   │   ├── dashboard.tsx
│   │   │   ├── customers.tsx
│   │   │   ├── payments.tsx
│   │   │   └── _layout.tsx
│   │   ├── customers/
│   │   │   ├── [id].tsx
│   │   │   └── create.tsx
│   │   └── _layout.tsx
│   ├── (employee)/               # Employee portal group
│   │   ├── (tabs)/
│   │   │   ├── dashboard.tsx
│   │   │   ├── tasks.tsx
│   │   │   └── _layout.tsx
│   │   └── _layout.tsx
│   ├── (customer)/               # Customer portal group
│   │   └── ...
│   ├── _layout.tsx               # Root layout
│   └── index.tsx                 # Entry redirect
│
├── src/
│   ├── components/               # UI Components
│   │   ├── core/
│   │   ├── form/
│   │   ├── data-display/
│   │   ├── feedback/
│   │   ├── navigation/
│   │   ├── overlay/
│   │   └── index.ts
│   │
│   ├── screens/                  # Screen-specific components
│   │   ├── auth/
│   │   ├── admin/
│   │   ├── employee/
│   │   └── customer/
│   │
│   ├── navigation/               # Navigation utilities
│   │   ├── types.ts
│   │   └── linking.ts
│   │
│   ├── store/                    # Zustand stores
│   │   ├── auth.store.ts
│   │   ├── customer.store.ts
│   │   ├── ui.store.ts
│   │   └── index.ts
│   │
│   ├── services/                 # API services
│   │   ├── api.client.ts
│   │   ├── auth.service.ts
│   │   ├── customer.service.ts
│   │   ├── payment.service.ts
│   │   └── index.ts
│   │
│   ├── hooks/                    # Custom hooks
│   │   ├── queries/              # React Query hooks
│   │   │   ├── useCustomers.ts
│   │   │   ├── usePayments.ts
│   │   │   └── index.ts
│   │   ├── useAuth.ts
│   │   ├── useDebounce.ts
│   │   └── index.ts
│   │
│   ├── utils/                    # Utilities
│   │   ├── format.ts
│   │   ├── validation.ts
│   │   ├── storage.ts
│   │   └── index.ts
│   │
│   ├── theme/                    # Theme configuration
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   └── index.ts
│   │
│   ├── types/                    # TypeScript types
│   │   ├── api.types.ts
│   │   ├── models.types.ts
│   │   ├── navigation.types.ts
│   │   └── index.ts
│   │
│   └── assets/                   # Static assets
│       ├── images/
│       ├── fonts/
│       └── icons/
│
├── app.config.ts                 # Expo config
├── package.json
├── tsconfig.json
└── babel.config.js
```

---

## 🧩 Design Patterns

### 1. Container/Presentational Pattern

```typescript
// Container (Smart Component)
// src/screens/admin/CustomerListContainer.tsx
export const CustomerListContainer: React.FC = () => {
  const { data, isLoading, error } = useCustomers();
  const navigation = useNavigation();

  const handleCustomerPress = (id: string) => {
    navigation.navigate('CustomerDetail', { id });
  };

  return (
    <CustomerList
      customers={data}
      loading={isLoading}
      error={error}
      onCustomerPress={handleCustomerPress}
    />
  );
};

// Presentational (Dumb Component)
// src/components/data-display/CustomerList.tsx
interface CustomerListProps {
  customers: Customer[];
  loading: boolean;
  error?: Error;
  onCustomerPress: (id: string) => void;
}

export const CustomerList: React.FC<CustomerListProps> = ({
  customers,
  loading,
  error,
  onCustomerPress,
}) => {
  // Pure UI rendering
};
```

---

### 2. Custom Hooks Pattern

```typescript
// src/hooks/queries/useCustomers.ts
export const useCustomers = (params?: CustomerQueryParams) => {
  return useQuery({
    queryKey: ['customers', params],
    queryFn: () => customerService.getAll(params),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCustomer = (id: string) => {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: () => customerService.getById(id),
    enabled: !!id,
  });
};

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: customerService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
};
```

---

### 3. Service Layer Pattern

```typescript
// src/services/customer.service.ts
class CustomerService {
  async getAll(params?: CustomerQueryParams): Promise<Customer[]> {
    const response = await apiClient.get('/customers', { params });
    return response.data;
  }

  async getById(id: string): Promise<Customer> {
    const response = await apiClient.get(`/customers/${id}`);
    return response.data;
  }

  async create(data: CreateCustomerDTO): Promise<Customer> {
    const response = await apiClient.post('/customers', data);
    return response.data;
  }

  async update(id: string, data: UpdateCustomerDTO): Promise<Customer> {
    const response = await apiClient.put(`/customers/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/customers/${id}`);
  }
}

export const customerService = new CustomerService();
```

---

### 4. Store Pattern (Zustand)

```typescript
// src/store/auth.store.ts
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (credentials) => {
        const response = await authService.login(credentials);
        set({
          user: response.user,
          token: response.token,
          isAuthenticated: true,
        });
      },

      logout: async () => {
        await authService.logout();
        set({ user: null, token: null, isAuthenticated: false });
      },

      setUser: (user) => set({ user }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

---

## 📦 Key Dependencies

```json
{
  "dependencies": {
    "expo": "~50.0.0",
    "expo-router": "~3.4.0",
    "react": "18.2.0",
    "react-native": "0.73.0",
    
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^4.4.0",
    "axios": "^1.6.0",
    
    "react-native-paper": "^5.11.0",
    "lucide-react-native": "^0.300.0",
    
    "@react-native-async-storage/async-storage": "^1.21.0",
    "expo-secure-store": "~12.8.0",
    
    "react-hook-form": "^7.49.0",
    "zod": "^3.22.0",
    "@hookform/resolvers": "^3.3.0",
    
    "date-fns": "^3.0.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/react": "~18.2.0",
    "eslint": "^8.55.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0"
  }
}
```

---

## 🔄 Data Flow

```
User Action
    │
    ▼
Screen (Container)
    │
    ▼
Custom Hook (useQuery/useMutation)
    │
    ▼
Service Layer
    │
    ▼
API Client (Axios)
    │
    ▼
Backend API
    │
    ▼
Response
    │
    ▼
React Query Cache
    │
    ▼
UI Update
```

---

## 🔐 Authentication Flow

```
App Launch
    │
    ▼
Check Token in SecureStore
    │
    ├── No Token ──────► Auth Stack (Login)
    │                         │
    │                         ▼
    │                    Login Form
    │                         │
    │                         ▼
    │                    API Login
    │                         │
    │                         ▼
    │                    Store Token
    │                         │
    ▼                         ▼
Token Valid ──────────► Main App Stack
    │
    └── Token Invalid ──► Refresh Token
                              │
                              ├── Success ──► Main App
                              └── Fail ──────► Auth Stack
```
