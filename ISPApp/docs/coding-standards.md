# Coding Standards

> **TypeScript, ESLint, and Code Quality Standards for ISP Management Mobile App**

---

## 📜 General Principles

1. **Type Safety** - Always use TypeScript, avoid `any`
2. **Consistency** - Follow established patterns
3. **Readability** - Self-documenting code
4. **Testability** - Write testable code
5. **Performance** - Optimize for mobile

---

## 📁 File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `CustomerCard.tsx` |
| Hooks | camelCase with 'use' | `useCustomers.ts` |
| Utils | camelCase | `formatCurrency.ts` |
| Types | PascalCase with suffix | `customer.types.ts` |
| Stores | camelCase with suffix | `auth.store.ts` |
| Services | camelCase with suffix | `customer.service.ts` |
| Constants | SCREAMING_SNAKE | `API_ENDPOINTS.ts` |

---

## 🏗️ Component Structure

### Standard Component Template

```typescript
// src/components/core/Button.tsx

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import type { TouchableOpacityProps } from 'react-native';
import { theme } from '@/theme';

// 1. Types at the top
interface ButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

// 2. Component definition
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  style,
  ...props
}) => {
  // 3. Hooks first
  const buttonStyles = getButtonStyles(variant, size, disabled);

  // 4. Early returns for edge cases
  if (loading) {
    return (
      <TouchableOpacity style={[styles.base, buttonStyles, style]} disabled>
        <ActivityIndicator color={getLoaderColor(variant)} />
      </TouchableOpacity>
    );
  }

  // 5. Main render
  return (
    <TouchableOpacity
      style={[styles.base, buttonStyles, style]}
      disabled={disabled}
      {...props}
    >
      {leftIcon}
      <Text style={[styles.text, getTextStyles(variant, size)]}>{children}</Text>
      {rightIcon}
    </TouchableOpacity>
  );
};

// 6. Helper functions
const getButtonStyles = (variant: string, size: string, disabled?: boolean) => {
  // Implementation
};

// 7. Styles at the bottom
const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
  },
  text: {
    fontFamily: theme.typography.fontFamily.semiBold,
  },
});
```

---

## 🪝 Hook Structure

```typescript
// src/hooks/queries/useCustomers.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService } from '@/services';
import type { Customer, CustomerQueryParams } from '@/types';

// 1. Query keys factory
export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (params: CustomerQueryParams) => [...customerKeys.lists(), params] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
};

// 2. Query hooks
export const useCustomers = (params?: CustomerQueryParams) => {
  return useQuery({
    queryKey: customerKeys.list(params ?? {}),
    queryFn: () => customerService.getAll(params),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCustomer = (id: string) => {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: () => customerService.getById(id),
    enabled: !!id,
  });
};

// 3. Mutation hooks
export const useCreateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: customerService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });
};
```

---

## 📝 TypeScript Guidelines

### Do's ✅

```typescript
// ✅ Use explicit types
const customers: Customer[] = [];

// ✅ Use interfaces for objects
interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
}

// ✅ Use type for unions/primitives
type Status = 'active' | 'inactive' | 'suspended';

// ✅ Use generics for reusable types
interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

// ✅ Use optional chaining
const area = customer?.area?.name;

// ✅ Use nullish coalescing
const displayName = customer.name ?? 'Unknown';
```

### Don'ts ❌

```typescript
// ❌ Avoid 'any'
const data: any = {};

// ❌ Avoid type assertions without reason
const customer = data as Customer;

// ❌ Avoid non-null assertions
const name = customer!.name;

// ❌ Avoid implicit any in callbacks
items.map(item => item.name); // Should be: (item: Item) => item.name
```

---

## 📦 Import Organization

```typescript
// 1. React/React Native
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

// 2. Third-party libraries
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';

// 3. Navigation
import { useRouter, useLocalSearchParams } from 'expo-router';

// 4. Internal components
import { Button, Card, TextInput } from '@/components';

// 5. Hooks
import { useCustomers, useAuth } from '@/hooks';

// 6. Services/Utils
import { customerService } from '@/services';
import { formatCurrency } from '@/utils';

// 7. Types
import type { Customer, CustomerFormData } from '@/types';

// 8. Theme/Constants
import { theme } from '@/theme';
```

---

## 🎨 Styling Guidelines

### Use StyleSheet Factory

```typescript
// ✅ Correct
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing[4],
  },
});

// ❌ Avoid inline styles (performance)
<View style={{ flex: 1, padding: 16 }} />
```

### Use Theme Tokens

```typescript
// ✅ Correct - use theme tokens
const styles = StyleSheet.create({
  container: {
    padding: theme.spacing[4],
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.md,
  },
  title: {
    ...theme.textStyles.h2,
    color: theme.colors.text.primary,
  },
});

// ❌ Avoid hardcoded values
const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
});
```

---

## 🧪 Testing Guidelines

### Component Testing

```typescript
// src/components/__tests__/Button.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button', () => {
  it('renders correctly', () => {
    const { getByText } = render(<Button>Click me</Button>);
    expect(getByText('Click me')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button onPress={onPress}>Click</Button>);
    
    fireEvent.press(getByText('Click'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows loading indicator when loading', () => {
    const { getByTestId } = render(<Button loading>Click</Button>);
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });
});
```

---

## 📋 ESLint Configuration

```javascript
// .eslintrc.js
module.exports = {
  root: true,
  extends: [
    'expo',
    '@react-native',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react-hooks'],
  rules: {
    // TypeScript
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': 'off',
    
    // React
    'react/react-in-jsx-scope': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    
    // General
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'prefer-const': 'error',
    'no-var': 'error',
  },
};
```

---

## 🔧 Prettier Configuration

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always"
}
```
