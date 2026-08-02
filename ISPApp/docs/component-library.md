# Component Library

> **Reusable UI Components for ISP Management Mobile App**

---

## 📦 Component Categories

1. **Core** - Base building blocks
2. **Form** - Input components
3. **Data Display** - Lists, cards, tables
4. **Feedback** - Alerts, toasts, loaders
5. **Navigation** - Headers, tabs, menus
6. **Overlay** - Modals, sheets, drawers

---

## 🔷 Core Components

### Button

```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size: 'sm' | 'md' | 'lg';
  leftIcon?: IconName;
  rightIcon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  onPress: () => void;
  children: React.ReactNode;
}
```

**Variants:**
| Variant | Background | Text | Border |
|---------|------------|------|--------|
| primary | `primary.500` | `white` | none |
| secondary | `neutral.100` | `neutral.800` | none |
| outline | `transparent` | `primary.500` | `primary.500` |
| ghost | `transparent` | `primary.500` | none |
| danger | `error.main` | `white` | none |

---

### Text

```typescript
interface TextProps {
  variant: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'caption' | 'label';
  color?: ColorToken;
  align?: 'left' | 'center' | 'right';
  numberOfLines?: number;
  children: React.ReactNode;
}
```

---

### Icon

```typescript
interface IconProps {
  name: IconName;
  size?: 16 | 20 | 24 | 28 | 32;
  color?: ColorToken;
}
```

Use: `lucide-react-native` icon library

---

### Avatar

```typescript
interface AvatarProps {
  source?: ImageSource;
  name?: string; // For initials fallback
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'busy';
}
```

**Sizes:**
| Size | Dimension | Font |
|------|-----------|------|
| xs | 24px | 10px |
| sm | 32px | 12px |
| md | 40px | 14px |
| lg | 56px | 18px |
| xl | 72px | 24px |

---

### Badge

```typescript
interface BadgeProps {
  variant: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  children: string;
}
```

---

### Card

```typescript
interface CardProps {
  variant?: 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onPress?: () => void;
  children: React.ReactNode;
}
```

---

## 📝 Form Components

### TextInput

```typescript
interface TextInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  helperText?: string;
  leftIcon?: IconName;
  rightIcon?: IconName;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardType;
  disabled?: boolean;
  required?: boolean;
}
```

---

### Select

```typescript
interface SelectProps<T> {
  label?: string;
  placeholder?: string;
  value: T | null;
  options: Array<{ label: string; value: T }>;
  onSelect: (value: T) => void;
  error?: string;
  searchable?: boolean;
  disabled?: boolean;
}
```

---

### SearchInput

```typescript
interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  debounceMs?: number;
}
```

---

### DatePicker

```typescript
interface DatePickerProps {
  label?: string;
  value: Date | null;
  onChange: (date: Date) => void;
  mode: 'date' | 'time' | 'datetime';
  minimumDate?: Date;
  maximumDate?: Date;
  error?: string;
}
```

---

### Checkbox

```typescript
interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}
```

---

### Switch

```typescript
interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
}
```

---

### RadioGroup

```typescript
interface RadioGroupProps<T> {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ label: string; value: T }>;
  direction?: 'horizontal' | 'vertical';
}
```

---

## 📊 Data Display Components

### ListItem

```typescript
interface ListItemProps {
  title: string;
  subtitle?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
}
```

---

### DataTable

```typescript
interface DataTableProps<T> {
  data: T[];
  columns: Array<{
    key: keyof T;
    header: string;
    width?: number;
    render?: (item: T) => React.ReactNode;
  }>;
  loading?: boolean;
  emptyMessage?: string;
  onRowPress?: (item: T) => void;
}
```

---

### StatCard

```typescript
interface StatCardProps {
  title: string;
  value: string | number;
  change?: { value: number; type: 'increase' | 'decrease' };
  icon?: IconName;
  color?: 'primary' | 'success' | 'warning' | 'error';
  onPress?: () => void;
}
```

---

### EmptyState

```typescript
interface EmptyStateProps {
  icon: IconName;
  title: string;
  description?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}
```

---

## 🔔 Feedback Components

### Toast

```typescript
// Global toast function
toast.show({
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
});
```

---

### Alert

```typescript
interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}
```

---

### Loading

```typescript
interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  color?: ColorToken;
  overlay?: boolean;
  message?: string;
}
```

---

### Skeleton

```typescript
interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  variant?: 'text' | 'circular' | 'rectangular';
}
```

---

## 🧭 Navigation Components

### Header

```typescript
interface HeaderProps {
  title: string;
  subtitle?: string;
  leftAction?: {
    icon: IconName;
    onPress: () => void;
  };
  rightActions?: Array<{
    icon: IconName;
    onPress: () => void;
  }>;
}
```

---

### TabBar

```typescript
interface TabBarProps {
  tabs: Array<{
    key: string;
    label: string;
    icon?: IconName;
    badge?: number;
  }>;
  activeTab: string;
  onTabChange: (key: string) => void;
}
```

---

### SegmentedControl

```typescript
interface SegmentedControlProps<T> {
  segments: Array<{ label: string; value: T }>;
  value: T;
  onChange: (value: T) => void;
}
```

---

## 🎭 Overlay Components

### Modal

```typescript
interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
}
```

---

### BottomSheet

```typescript
interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  snapPoints?: number[];
  children: React.ReactNode;
}
```

---

### ActionSheet

```typescript
interface ActionSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  options: Array<{
    label: string;
    icon?: IconName;
    destructive?: boolean;
    onPress: () => void;
  }>;
}
```

---

### ConfirmDialog

```typescript
interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}
```

---

## 📁 Component File Structure

```
src/components/
├── core/
│   ├── Button.tsx
│   ├── Text.tsx
│   ├── Icon.tsx
│   ├── Avatar.tsx
│   ├── Badge.tsx
│   ├── Card.tsx
│   └── index.ts
├── form/
│   ├── TextInput.tsx
│   ├── Select.tsx
│   ├── SearchInput.tsx
│   ├── DatePicker.tsx
│   ├── Checkbox.tsx
│   ├── Switch.tsx
│   ├── RadioGroup.tsx
│   └── index.ts
├── data-display/
│   ├── ListItem.tsx
│   ├── DataTable.tsx
│   ├── StatCard.tsx
│   ├── EmptyState.tsx
│   └── index.ts
├── feedback/
│   ├── Toast.tsx
│   ├── Alert.tsx
│   ├── Loading.tsx
│   ├── Skeleton.tsx
│   └── index.ts
├── navigation/
│   ├── Header.tsx
│   ├── TabBar.tsx
│   ├── SegmentedControl.tsx
│   └── index.ts
├── overlay/
│   ├── Modal.tsx
│   ├── BottomSheet.tsx
│   ├── ActionSheet.tsx
│   ├── ConfirmDialog.tsx
│   └── index.ts
└── index.ts
```
