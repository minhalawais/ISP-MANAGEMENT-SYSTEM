# Design System

> **Enterprise Color Palette & Design Tokens for ISP Management Mobile App**

---

## 🎨 Color Palette

### Primary Colors (Brand)

```typescript
const colors = {
  primary: {
    50: '#E8F4FD',
    100: '#C5E4FA',
    200: '#9ED2F7',
    300: '#77BFF3',
    400: '#59B0F0',
    500: '#3B9FED',  // Main Primary
    600: '#3590DB',
    700: '#2D7EC4',
    800: '#266DAD',
    900: '#1A4F84',
  },
}
```

| Token | Hex | Usage |
|-------|-----|-------|
| `primary.500` | #3B9FED | Primary actions, links, active states |
| `primary.600` | #3590DB | Pressed states |
| `primary.100` | #C5E4FA | Light backgrounds |

### Secondary Colors (Accent)

```typescript
secondary: {
  50: '#F0F4F7',
  100: '#D9E2EA',
  200: '#B3C8CF',  // From user palette
  300: '#89A8B2',  // From user palette
  400: '#6B8E99',
  500: '#4D7580',
  600: '#3D5E66',
  700: '#2E474D',
  800: '#1F3033',
  900: '#0F181A',
}
```

### Neutral Colors (Grays)

```typescript
neutral: {
  50: '#F9FAFB',
  100: '#F3F4F6',
  200: '#E5E7EB',
  300: '#D1D5DB',
  400: '#9CA3AF',
  500: '#6B7280',
  600: '#4B5563',
  700: '#374151',
  800: '#1F2937',
  900: '#111827',
}
```

### Semantic Colors

```typescript
semantic: {
  success: {
    light: '#D1FAE5',
    main: '#10B981',
    dark: '#047857',
  },
  warning: {
    light: '#FEF3C7',
    main: '#F59E0B',
    dark: '#B45309',
  },
  error: {
    light: '#FEE2E2',
    main: '#EF4444',
    dark: '#B91C1C',
  },
  info: {
    light: '#DBEAFE',
    main: '#3B82F6',
    dark: '#1D4ED8',
  },
}
```

### Background Colors

```typescript
background: {
  primary: '#FFFFFF',
  secondary: '#F9FAFB',
  tertiary: '#F3F4F6',
  elevated: '#FFFFFF',
  overlay: 'rgba(0, 0, 0, 0.5)',
}
```

### Surface Colors (Cards)

```typescript
surface: {
  base: '#FFFFFF',
  elevated: '#FFFFFF',
  subtle: '#F9FAFB',
  muted: '#F1F0E8',   // From user palette
  warm: '#E5E1DA',    // From user palette
}
```

---

## 📝 Typography

### Font Family

```typescript
const typography = {
  fontFamily: {
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semiBold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
  },
}
```

### Font Sizes

| Token | Size | Line Height | Usage |
|-------|------|-------------|-------|
| `xs` | 10px | 14px | Tiny labels, badges |
| `sm` | 12px | 16px | Captions, helper text |
| `base` | 14px | 20px | Body text |
| `md` | 16px | 24px | List items, inputs |
| `lg` | 18px | 28px | Subheadings |
| `xl` | 20px | 28px | Section titles |
| `2xl` | 24px | 32px | Page titles |
| `3xl` | 30px | 36px | Hero text |
| `4xl` | 36px | 44px | Large headlines |

### Text Styles

```typescript
textStyles: {
  h1: { fontSize: 30, fontFamily: 'Inter-Bold', lineHeight: 36 },
  h2: { fontSize: 24, fontFamily: 'Inter-SemiBold', lineHeight: 32 },
  h3: { fontSize: 20, fontFamily: 'Inter-SemiBold', lineHeight: 28 },
  h4: { fontSize: 18, fontFamily: 'Inter-Medium', lineHeight: 28 },
  body: { fontSize: 14, fontFamily: 'Inter-Regular', lineHeight: 20 },
  bodyMedium: { fontSize: 14, fontFamily: 'Inter-Medium', lineHeight: 20 },
  caption: { fontSize: 12, fontFamily: 'Inter-Regular', lineHeight: 16 },
  label: { fontSize: 12, fontFamily: 'Inter-Medium', lineHeight: 16 },
  button: { fontSize: 14, fontFamily: 'Inter-SemiBold', lineHeight: 20 },
}
```

---

## 📐 Spacing Scale

```typescript
const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
}
```

| Token | Value | Usage |
|-------|-------|-------|
| `1` | 4px | Tight spacing, icons |
| `2` | 8px | Inline elements |
| `3` | 12px | Small padding |
| `4` | 16px | Standard padding |
| `6` | 24px | Section spacing |
| `8` | 32px | Large sections |

---

## 🔲 Border Radius

```typescript
const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
}
```

| Token | Value | Usage |
|-------|-------|-------|
| `sm` | 4px | Small buttons, chips |
| `md` | 8px | Cards, inputs |
| `lg` | 12px | Modals, sheets |
| `xl` | 16px | Large cards |
| `full` | 9999px | Avatars, pills |

---

## 🌑 Shadows

```typescript
const shadows = {
  none: {},
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
}
```

---

## 📱 Component Tokens

### Buttons

```typescript
button: {
  height: {
    sm: 32,
    md: 40,
    lg: 48,
    xl: 56,
  },
  paddingHorizontal: {
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
  },
}
```

### Inputs

```typescript
input: {
  height: 48,
  paddingHorizontal: 16,
  borderWidth: 1,
  borderRadius: 8,
  borderColor: neutral[300],
  focusBorderColor: primary[500],
}
```

### Cards

```typescript
card: {
  padding: 16,
  borderRadius: 12,
  backgroundColor: surface.base,
  shadow: shadows.md,
}
```

---

## 📦 Status Badges

| Status | Background | Text | Border |
|--------|------------|------|--------|
| Active | `#D1FAE5` | `#047857` | none |
| Inactive | `#F3F4F6` | `#6B7280` | none |
| Pending | `#FEF3C7` | `#B45309` | none |
| Paid | `#D1FAE5` | `#047857` | none |
| Unpaid | `#FEE2E2` | `#B91C1C` | none |
| Overdue | `#FEE2E2` | `#B91C1C` | none |
| Open | `#DBEAFE` | `#1D4ED8` | none |
| Resolved | `#D1FAE5` | `#047857` | none |
| In Progress | `#FEF3C7` | `#B45309` | none |

---

## 🌙 Dark Mode (Optional)

```typescript
darkMode: {
  background: {
    primary: '#111827',
    secondary: '#1F2937',
    tertiary: '#374151',
  },
  surface: {
    base: '#1F2937',
    elevated: '#374151',
  },
  text: {
    primary: '#F9FAFB',
    secondary: '#D1D5DB',
    tertiary: '#9CA3AF',
  },
}
```

---

## 📋 Implementation

```typescript
// src/theme/index.ts
export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  components: {
    button,
    input,
    card,
  },
};
```
