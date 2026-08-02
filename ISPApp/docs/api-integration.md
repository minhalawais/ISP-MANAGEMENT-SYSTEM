# API Integration

> **Backend API Integration Patterns for ISP Management Mobile App**

---

## 🔌 API Configuration

### Base Configuration

```typescript
// src/services/api.client.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, logout user
      await SecureStore.deleteItemAsync('auth_token');
      // Navigate to login
    }
    return Promise.reject(error);
  }
);
```

---

## 🔐 Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | User login |
| POST | `/auth/logout` | User logout |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password/{token}` | Reset password |
| GET | `/auth/protected` | Verify token |

### Auth Service

```typescript
// src/services/auth.service.ts
interface LoginCredentials {
  username: string;
  password: string;
}

interface AuthResponse {
  access_token: string;
  user: User;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/login', credentials);
    await SecureStore.setItemAsync('auth_token', response.data.access_token);
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      await SecureStore.deleteItemAsync('auth_token');
    }
  }

  async forgotPassword(email: string): Promise<void> {
    await apiClient.post('/auth/forgot-password', { email });
  }

  async resetPassword(token: string, password: string): Promise<void> {
    await apiClient.post(`/auth/reset-password/${token}`, { password });
  }
}

export const authService = new AuthService();
```

---

## 👥 Customer Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/customers` | List customers (paginated) |
| GET | `/customers/{id}` | Get customer detail |
| POST | `/customers` | Create customer |
| PUT | `/customers/{id}` | Update customer |
| DELETE | `/customers/{id}` | Delete customer |
| GET | `/customers/search` | Search customers |

### Query Parameters

```typescript
interface CustomerQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: 'active' | 'inactive' | 'suspended';
  area_id?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}
```

### Customer Service

```typescript
// src/services/customer.service.ts
class CustomerService {
  async getAll(params?: CustomerQueryParams): Promise<PaginatedResponse<Customer>> {
    const response = await apiClient.get('/customers', { params });
    return response.data;
  }

  async getById(id: string): Promise<CustomerDetail> {
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

  async search(query: string): Promise<Customer[]> {
    const response = await apiClient.get('/customers/search', {
      params: { query },
    });
    return response.data;
  }
}

export const customerService = new CustomerService();
```

---

## 💰 Payment Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/payments` | List payments |
| GET | `/payments/{id}` | Get payment detail |
| POST | `/payments` | Record payment |
| GET | `/payments/summary` | Payment summary stats |

---

## 📄 Invoice Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/invoices` | List invoices |
| GET | `/invoices/{id}` | Get invoice detail |
| POST | `/invoices` | Create invoice |
| POST | `/invoices/generate` | Generate invoice PDF |
| POST | `/invoices/bulk` | Bulk invoice generation |
| GET | `/invoices/public/{id}` | Public invoice view |

---

## 🎫 Complaint Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/complaints` | List complaints |
| GET | `/complaints/{id}` | Get complaint detail |
| POST | `/complaints` | Create complaint |
| PUT | `/complaints/{id}` | Update complaint |
| PUT | `/complaints/{id}/assign` | Assign complaint |
| PUT | `/complaints/{id}/resolve` | Resolve complaint |

---

## 📊 Dashboard Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard/executive` | Executive KPIs |
| GET | `/dashboard/financial` | Financial analytics |
| GET | `/dashboard/customers` | Customer analytics |
| GET | `/dashboard/employees` | Employee analytics |
| GET | `/dashboard/inventory` | Inventory stats |

---

## 🪝 React Query Integration

### Query Hooks

```typescript
// src/hooks/queries/useCustomers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Query keys factory
export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (params: CustomerQueryParams) => [...customerKeys.lists(), params] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
};

// Hooks
export const useCustomers = (params?: CustomerQueryParams) => {
  return useQuery({
    queryKey: customerKeys.list(params ?? {}),
    queryFn: () => customerService.getAll(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCustomer = (id: string) => {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: () => customerService.getById(id),
    enabled: !!id,
  });
};

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: customerService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCustomerDTO }) =>
      customerService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });
};

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: customerService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });
};
```

---

## 📱 Offline Support

```typescript
// src/services/offline.ts
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PendingAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: string;
  data: any;
  timestamp: number;
}

class OfflineService {
  private pendingActions: PendingAction[] = [];

  async queueAction(action: Omit<PendingAction, 'id' | 'timestamp'>) {
    const pendingAction: PendingAction = {
      ...action,
      id: generateUUID(),
      timestamp: Date.now(),
    };
    
    this.pendingActions.push(pendingAction);
    await this.persistQueue();
  }

  async syncPendingActions() {
    const { isConnected } = await NetInfo.fetch();
    
    if (!isConnected) return;

    for (const action of this.pendingActions) {
      try {
        await this.executeAction(action);
        this.pendingActions = this.pendingActions.filter(a => a.id !== action.id);
      } catch (error) {
        console.error('Sync failed for action:', action.id);
      }
    }

    await this.persistQueue();
  }

  private async persistQueue() {
    await AsyncStorage.setItem('pending_actions', JSON.stringify(this.pendingActions));
  }
}

export const offlineService = new OfflineService();
```

---

## ⚙️ Error Handling

```typescript
// src/utils/error.ts
interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, string[]>;
}

export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data as ApiError;
    
    if (apiError?.message) {
      return apiError.message;
    }
    
    switch (error.response?.status) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'Session expired. Please login again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return 'An unexpected error occurred.';
    }
  }
  
  return 'Network error. Please check your connection.';
};
```
