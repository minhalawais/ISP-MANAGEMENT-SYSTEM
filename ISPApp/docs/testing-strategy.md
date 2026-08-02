# Testing Strategy

> **Testing Approach for ISP Management Mobile App**

---

## 🎯 Testing Pyramid

```
        ╱  ╲
       ╱ E2E ╲           (5%)  Critical user flows
      ╱───────╲
     ╱Integration╲       (25%) API, navigation
    ╱─────────────╲
   ╱   Unit Tests    ╲   (70%) Components, hooks, utils
  ╱───────────────────╲
```

---

## 🔧 Testing Tools

| Tool | Purpose |
|------|---------|
| Jest | Test runner |
| React Native Testing Library | Component testing |
| MSW (Mock Service Worker) | API mocking |
| Detox | E2E testing (optional) |

---

## 📦 Unit Tests

### Component Tests

```typescript
// src/components/__tests__/Button.test.tsx
import { render, fireEvent, screen } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button', () => {
  it('renders label correctly', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeTruthy();
  });

  it('calls onPress handler', () => {
    const onPress = jest.fn();
    render(<Button onPress={onPress}>Click</Button>);
    
    fireEvent.press(screen.getByText('Click'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('disables when loading', () => {
    render(<Button loading>Click</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('applies variant styles', () => {
    render(<Button variant="primary">Primary</Button>);
    // Check for primary styles
  });
});
```

### Hook Tests

```typescript
// src/hooks/__tests__/useDebounce.test.ts
import { renderHook, act } from '@testing-library/react-native';
import { useDebounce } from '../useDebounce';

describe('useDebounce', () => {
  jest.useFakeTimers();

  it('debounces value changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    );

    expect(result.current).toBe('initial');

    rerender({ value: 'updated' });
    expect(result.current).toBe('initial'); // Not yet updated

    act(() => jest.advanceTimersByTime(500));
    expect(result.current).toBe('updated');
  });
});
```

### Utility Tests

```typescript
// src/utils/__tests__/format.test.ts
import { formatCurrency, formatDate, formatCnic } from '../format';

describe('formatCurrency', () => {
  it('formats PKR currency', () => {
    expect(formatCurrency(5000)).toBe('₨ 5,000');
  });

  it('handles zero', () => {
    expect(formatCurrency(0)).toBe('₨ 0');
  });

  it('handles decimals', () => {
    expect(formatCurrency(5000.5)).toBe('₨ 5,001');
  });
});

describe('formatCnic', () => {
  it('formats CNIC with dashes', () => {
    expect(formatCnic('3520112345671')).toBe('35201-1234567-1');
  });
});
```

---

## 🔗 Integration Tests

### Query Hook Tests

```typescript
// src/hooks/queries/__tests__/useCustomers.test.tsx
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCustomers } from '../useCustomers';
import { server } from '@/mocks/server';
import { rest } from 'msw';

const wrapper = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useCustomers', () => {
  it('fetches customers successfully', async () => {
    const { result } = renderHook(() => useCustomers(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(10);
  });

  it('handles error state', async () => {
    server.use(
      rest.get('/api/customers', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    const { result } = renderHook(() => useCustomers(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
```

### Screen Tests

```typescript
// src/screens/__tests__/CustomerListScreen.test.tsx
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CustomerListScreen from '../CustomerListScreen';

const renderWithProviders = (component) => {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        {component}
      </NavigationContainer>
    </QueryClientProvider>
  );
};

describe('CustomerListScreen', () => {
  it('renders customer list', async () => {
    renderWithProviders(<CustomerListScreen />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeTruthy();
    });
  });

  it('filters by search', async () => {
    renderWithProviders(<CustomerListScreen />);

    await waitFor(() => screen.getByText('John Doe'));

    fireEvent.changeText(screen.getByPlaceholderText('Search'), 'Jane');

    await waitFor(() => {
      expect(screen.queryByText('John Doe')).toBeNull();
      expect(screen.getByText('Jane Smith')).toBeTruthy();
    });
  });

  it('navigates to detail on press', async () => {
    const { navigate } = renderWithProviders(<CustomerListScreen />);

    await waitFor(() => screen.getByText('John Doe'));

    fireEvent.press(screen.getByText('John Doe'));

    expect(navigate).toHaveBeenCalledWith('CustomerDetail', { id: '1' });
  });
});
```

---

## 🌐 API Mocking with MSW

```typescript
// src/mocks/handlers.ts
import { rest } from 'msw';

export const handlers = [
  rest.get('/api/customers', (req, res, ctx) => {
    return res(
      ctx.json({
        data: [
          { id: '1', name: 'John Doe', status: 'active' },
          { id: '2', name: 'Jane Smith', status: 'active' },
        ],
        total: 2,
      })
    );
  }),

  rest.get('/api/customers/:id', (req, res, ctx) => {
    return res(
      ctx.json({
        id: req.params.id,
        name: 'John Doe',
        email: 'john@example.com',
      })
    );
  }),

  rest.post('/api/customers', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({ id: '3', ...req.body })
    );
  }),
];

// src/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

---

## 📋 Test Coverage Requirements

| Category | Minimum Coverage |
|----------|-----------------|
| Utils | 90% |
| Hooks | 80% |
| Components | 70% |
| Screens | 60% |
| Overall | 75% |

---

## 🏃 Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific file
npm test Button.test.tsx

# Watch mode
npm test -- --watch
```
