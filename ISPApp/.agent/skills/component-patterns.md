---
description: Rules for building reusable components in ISPApp. Covers file structure, props design, styling patterns, and anti-patterns.
---

# Component Patterns — How to Build Components

> **RULE**: Every component follows this exact structure. Components live in `src/components/` organized by category.

## Folder Structure
```
src/components/
├── ui/                    # Generic, reusable primitives
│   ├── Button.js
│   ├── Card.js
│   ├── Badge.js
│   ├── Avatar.js
│   ├── Divider.js
│   ├── SkeletonBox.js
│   └── index.js           # Barrel export
├── form/                  # Form-specific components
│   ├── FormInput.js
│   ├── FormSelect.js
│   ├── FormDatePicker.js
│   └── index.js
├── data/                  # Data display components
│   ├── StatCard.js
│   ├── ListItem.js
│   ├── SectionHeader.js
│   ├── EmptyState.js
│   ├── ErrorState.js
│   └── index.js
└── feedback/              # Feedback components
    ├── Toast.js
    ├── LoadingOverlay.js
    └── index.js
```

## Component File Template

```javascript
// ComponentName — Brief description of what it does

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';

// ─── COMPONENT ──────────────────────────────────────────
const ComponentName = ({
  // Required props first
  title,
  onPress,
  // Optional props with defaults
  variant = 'primary',
  size = 'md',
  disabled = false,
  leftIcon = null,
  style,
  testID,
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      testID={testID}
    >
      {leftIcon && (
        <Ionicons
          name={leftIcon}
          size={ICON_SIZES[size]}
          color={colors.primary[600]}
          style={styles.icon}
        />
      )}
      <Text style={[styles.text, disabled && styles.textDisabled]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

// ─── CONSTANTS ────────────────────────────────────────────
const ICON_SIZES = { sm: 16, md: 20, lg: 24 };

// ─── STYLES ───────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,        // Always use tokens
  },
  icon: {
    marginRight: spacing.sm,    // Always use tokens
  },
  text: {
    fontSize: typography.fontSize.md,
    fontWeight: '500',
    color: colors.neutral[800],
  },
  textDisabled: {
    color: colors.neutral[300],
  },
});

export default ComponentName;
```

## Barrel Exports (index.js)

Every component folder MUST have an `index.js`:
```javascript
export { default as Button } from './Button';
export { default as Card } from './Card';
export { default as Badge } from './Badge';
export { default as Avatar } from './Avatar';
```

Usage in screens:
```javascript
import { Button, Card, Badge } from '../../components/ui';
```

## Props Design Rules

### 1. Use consistent variant/size naming
```javascript
// ✅ CORRECT — consistent across all components
variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
size:    'sm' | 'md' | 'lg'

// ❌ WRONG — inconsistent naming
type: 'filled' | 'bordered'
buttonSize: 'small' | 'large'
```

### 2. Always accept `style` for composition
```javascript
// ✅ Component allows parent to override positioning
<Card style={styles.customMargin}>

// Inside Card component:
<View style={[styles.container, style]}>
```

### 3. Always accept `testID`
```javascript
// ✅ Every interactive component must have testID
<Button testID="login-submit-button" />
```

### 4. Destructure with defaults in params
```javascript
// ✅ Defaults in destructuring
const Button = ({ variant = 'primary', size = 'md', disabled = false }) => {

// ❌ Don't use defaultProps
Button.defaultProps = { variant: 'primary' };
```

## Standard Component Specs

### Button
```
Sizes:
  sm: height 32, fontSize 12, paddingH 12, borderRadius 6
  md: height 40, fontSize 14, paddingH 16, borderRadius 8
  lg: height 48, fontSize 16, paddingH 24, borderRadius 8

Variants:
  primary:   bg primary.600, text white
  secondary: bg primary.50,  text primary.700
  outline:   bg transparent, border primary.600, text primary.600
  ghost:     bg transparent, text primary.600
  danger:    bg error,       text white

Active opacity: 0.7
Disabled: opacity 0.4
Loading: ActivityIndicator (white for primary, primary.600 for others)
```

### Card
```
Background:    surface.card (#FFFFFF)
Border radius: borderRadius.lg (12)
Padding:       spacing.lg (16)
Shadow:        shadows.sm (subtle — NOT md or lg for most cards)
Border:        1px neutral.200 (on iOS where shadows may not render)

Pressable Card: activeOpacity 0.7, slight scale animation (0.98)
```

### Avatar
```
Sizes:
  sm: 32x32, fontSize 12
  md: 40x40, fontSize 14
  lg: 56x56, fontSize 20

Shape: borderRadius.full (circle)
Fallback: First letter of name on colored background
Color: derived from name string (hash to primary/success/warning/info)
```

### Badge
```
Sizes:
  sm: paddingH 6, paddingV 2, fontSize 10
  md: paddingH 8, paddingV 3, fontSize 12

Variants (bg → text):
  success: successLight → successDark
  warning: warningLight → warningDark
  error:   errorLight   → errorDark
  info:    infoLight    → primary.800
  neutral: neutral.100  → neutral.600

Border radius: borderRadius.full (pill shape)
Font weight: '600'
```

## Anti-Patterns — NEVER DO

❌ **Inline styles**
```javascript
// WRONG
<View style={{ marginTop: 15, backgroundColor: '#f0f0f0' }}>
// CORRECT
<View style={styles.container}>
```

❌ **Hardcoded colors/values**
```javascript
// WRONG
color: '#333333'
padding: 13
// CORRECT
color: colors.neutral[800]
padding: spacing.md
```

❌ **Deep nesting (>3 levels)**
```javascript
// WRONG — extract sub-components
<View>
  <View>
    <View>
      <View>
        <Text>Too deep</Text>

// CORRECT — separate component
<CardHeader title="..." />
```

❌ **Business logic in JSX**
```javascript
// WRONG
{data.filter(x => x.status === 'active').map(x => ...)}
// CORRECT
const activeItems = useMemo(() => data.filter(x => x.status === 'active'), [data]);
{activeItems.map(x => ...)}
```

❌ **Platform-specific code without Platform.select**
```javascript
// WRONG
shadow: Platform.OS === 'ios' ? {...} : {}
// CORRECT
...Platform.select({ ios: shadows.md, android: { elevation: 3 } })
```
