# Development Rules

> **Consistency Guidelines and Best Practices for ISP Management Mobile App**

---

## 🎯 Core Principles

1. **Consistency over cleverness** - Follow established patterns
2. **Mobile-first thinking** - Optimize for touch, performance
3. **Offline-ready** - Handle network failures gracefully
4. **Accessible** - Support screen readers, large text
5. **Secure** - Protect user data

---

## 📱 Screen Development Rules

### Rule 1: Follow Screen Template

Every screen must follow this structure:

```typescript
// app/(admin)/customers/[id].tsx

export default function CustomerDetailScreen() {
  // 1. Route params
  const { id } = useLocalSearchParams<{ id: string }>();
  
  // 2. Navigation
  const router = useRouter();
  
  // 3. Data fetching
  const { data, isLoading, error } = useCustomer(id);
  
  // 4. Local state
  const [showModal, setShowModal] = useState(false);
  
  // 5. Handlers
  const handleEdit = () => router.push(`/customers/${id}/edit`);
  
  // 6. Loading state
  if (isLoading) return <ScreenLoader />;
  
  // 7. Error state
  if (error) return <ErrorView error={error} onRetry={refetch} />;
  
  // 8. Empty state
  if (!data) return <EmptyState message="Customer not found" />;
  
  // 9. Main render
  return (
    <ScreenContainer>
      {/* Screen content */}
    </ScreenContainer>
  );
}
```

### Rule 2: Use Screen Container

Always wrap screens with `ScreenContainer`:

```typescript
<ScreenContainer
  title="Customers"
  headerRight={<IconButton icon="plus" onPress={handleAdd} />}
  loading={isLoading}
>
  {/* Content */}
</ScreenContainer>
```

### Rule 3: Handle All States

Every data-fetching screen must handle:
- Loading state
- Error state
- Empty state
- Success state

---

## 🧩 Component Rules

### Rule 1: Single Responsibility

Components should do one thing:

```typescript
// ✅ Good - focused component
export const CustomerCard = ({ customer, onPress }) => (
  <Card onPress={onPress}>
    <CustomerAvatar customer={customer} />
    <CustomerInfo customer={customer} />
    <CustomerStatus status={customer.status} />
  </Card>
);

// ❌ Bad - too many responsibilities
export const CustomerCard = ({ customer, onPress, onEdit, onDelete, showActions }) => {
  // Too much logic here
};
```

### Rule 2: Props Interface Required

All components must have typed props:

```typescript
interface CustomerCardProps {
  customer: Customer;
  onPress?: () => void;
  variant?: 'default' | 'compact';
}

export const CustomerCard: React.FC<CustomerCardProps> = ({ ... }) => { ... };
```

### Rule 3: Export from Index

All components export through index files:

```typescript
// src/components/index.ts
export * from './core';
export * from './form';
export * from './data-display';
```

---

## 📊 Data Fetching Rules

### Rule 1: Use React Query for Server State

```typescript
// ✅ Correct
const { data, isLoading } = useCustomers(filters);

// ❌ Avoid manual fetching in useEffect
useEffect(() => {
  fetch('/api/customers').then(...);
}, []);
```

### Rule 2: Use Query Key Factory

```typescript
// ✅ Centralized keys
export const customerKeys = {
  all: ['customers'],
  list: (params) => ['customers', 'list', params],
  detail: (id) => ['customers', 'detail', id],
};

// ❌ Avoid inline keys
useQuery({ queryKey: ['customers', filters], ... });
```

### Rule 3: Invalidate on Mutations

```typescript
// ✅ Correct - invalidate related queries
const createMutation = useMutation({
  mutationFn: customerService.create,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
  },
});
```

---

## 📝 Form Rules

### Rule 1: Use React Hook Form + Zod

```typescript
const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

const { control, handleSubmit } = useForm({
  resolver: zodResolver(schema),
});
```

### Rule 2: Wrap Inputs with Controller

```typescript
<Controller
  control={control}
  name="name"
  render={({ field: { onChange, value }, fieldState: { error } }) => (
    <TextInput
      value={value}
      onChangeText={onChange}
      error={error?.message}
    />
  )}
/>
```

### Rule 3: Show Feedback on Submit

```typescript
const onSubmit = (data) => {
  mutation.mutate(data, {
    onSuccess: () => {
      toast.show({ type: 'success', message: 'Customer created!' });
      router.back();
    },
    onError: (error) => {
      toast.show({ type: 'error', message: handleApiError(error) });
    },
  });
};
```

---

## 🎨 Styling Rules

### Rule 1: Use Theme Tokens Only

```typescript
// ✅ Theme tokens
styles.container = {
  padding: theme.spacing[4],
  borderRadius: theme.borderRadius.md,
};

// ❌ Never hardcode
styles.container = {
  padding: 16,
  borderRadius: 8,
};
```

### Rule 2: Use Text Styles

```typescript
// ✅ Predefined text styles
<Text style={theme.textStyles.h2}>Title</Text>
<Text style={theme.textStyles.body}>Body text</Text>

// ❌ Manual text styling
<Text style={{ fontSize: 24, fontWeight: 'bold' }}>Title</Text>
```

### Rule 3: Responsive Layout

```typescript
// ✅ Flex-based layout
<View style={{ flexDirection: 'row', gap: theme.spacing[2] }}>
  <View style={{ flex: 1 }}>{/* Left */}</View>
  <View style={{ flex: 1 }}>{/* Right */}</View>
</View>
```

---

## 🔒 Security Rules

### Rule 1: Store Tokens Securely

```typescript
// ✅ Use SecureStore for sensitive data
await SecureStore.setItemAsync('auth_token', token);

// ❌ Never use AsyncStorage for tokens
await AsyncStorage.setItem('token', token);
```

### Rule 2: Validate All Inputs

```typescript
// Always validate with Zod before API calls
const validatedData = schema.parse(formData);
await apiClient.post('/customers', validatedData);
```

### Rule 3: Sanitize Displayed Data

```typescript
// Escape potentially dangerous content
<Text>{sanitize(userInput)}</Text>
```

---

## ⚡ Performance Rules

### Rule 1: Memoize Expensive Computations

```typescript
const filteredCustomers = useMemo(() => 
  customers.filter(c => c.name.includes(search)),
  [customers, search]
);
```

### Rule 2: Use FlatList for Long Lists

```typescript
// ✅ FlatList for virtualization
<FlatList
  data={customers}
  renderItem={({ item }) => <CustomerCard customer={item} />}
  keyExtractor={(item) => item.id}
/>

// ❌ Never map in ScrollView
<ScrollView>
  {customers.map(c => <CustomerCard key={c.id} />)}
</ScrollView>
```

### Rule 3: Optimize Images

```typescript
// Use Expo Image with caching
import { Image } from 'expo-image';

<Image
  source={{ uri: imageUrl }}
  placeholder={blurhash}
  contentFit="cover"
  transition={200}
/>
```

---

## 📲 UX Rules

### Rule 1: Provide Feedback

- Show loading indicators
- Confirm destructive actions
- Toast for success/error

### Rule 2: Handle Edge Cases

- Empty states with actions
- Error states with retry
- Offline states with cache

### Rule 3: Touch-Friendly

- Min touch target: 44x44
- Adequate spacing between buttons
- Clear active/pressed states

---

## ✅ PR Checklist

Before submitting PR, verify:

- [ ] TypeScript compiles without errors
- [ ] ESLint passes without warnings
- [ ] All states handled (loading, error, empty)
- [ ] Theme tokens used (no hardcoded values)
- [ ] Components are typed
- [ ] Query keys use factory
- [ ] Forms use React Hook Form + Zod
- [ ] Accessible labels added
- [ ] Tested on iOS and Android
