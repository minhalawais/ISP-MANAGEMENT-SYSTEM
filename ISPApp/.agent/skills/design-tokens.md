---
description: Mandatory design tokens for all ISPApp UI. Every color, spacing, font size, radius, and shadow MUST come from this file. Never invent values.
---

# Design Tokens — Single Source of Truth

> **CRITICAL**: You must NEVER use a hardcoded color hex, font size number, spacing value, border radius, or shadow outside of these tokens. If you need a value that doesn't exist here, ASK — do not invent one.

## Colors

### Primary (Deep Blue)
```javascript
primary: {
  50:  '#EFF6FF',  // Backgrounds, hover states
  100: '#DBEAFE',  // Light backgrounds
  200: '#BFDBFE',  // Borders, dividers on primary bg
  300: '#93C5FD',  // Disabled primary buttons
  400: '#60A5FA',  // Hover states
  500: '#3B82F6',  // Secondary buttons, links, icons
  600: '#2563EB',  // Primary buttons, active tabs
  700: '#1D4ED8',  // Button hover, pressed states
  800: '#1E40AF',  // Headers, emphasis — MAIN PRIMARY
  900: '#1E3A8A',  // Dark text on light primary bg
}
```

### Neutral (Slate)
```javascript
neutral: {
  50:  '#F8FAFC',  // Screen backgrounds
  100: '#F1F5F9',  // Card hover, alternate rows
  200: '#E2E8F0',  // Borders, dividers, input borders
  300: '#CBD5E1',  // Disabled text, placeholder
  400: '#94A3B8',  // Secondary icons, captions
  500: '#64748B',  // Secondary text, labels
  600: '#475569',  // Body text (less emphasis)
  700: '#334155',  // Body text (standard)
  800: '#1E293B',  // Headings, important text
  900: '#0F172A',  // Primary text, titles
}
```

### Semantic
```javascript
semantic: {
  success:      '#10B981',  // Active, paid, connected, online
  successLight: '#D1FAE5',  // Success badges/bg
  successDark:  '#059669',  // Success text on light bg

  warning:      '#F59E0B',  // Pending, due soon, attention
  warningLight: '#FEF3C7',  // Warning badges/bg
  warningDark:  '#D97706',  // Warning text on light bg

  error:        '#EF4444',  // Overdue, failed, disconnected
  errorLight:   '#FEE2E2',  // Error badges/bg
  errorDark:    '#DC2626',  // Error text on light bg

  info:         '#3B82F6',  // Info, tips (same as primary.500)
  infoLight:    '#DBEAFE',  // Info badges/bg
}
```

### Surfaces
```javascript
background: {
  primary:   '#F8FAFC',  // Main screen background (neutral.50)
  secondary: '#FFFFFF',  // Card/surface background
  tertiary:  '#F1F5F9',  // Grouped section bg (neutral.100)
}
surface: {
  card:     '#FFFFFF',
  elevated: '#FFFFFF',
  overlay:  'rgba(15, 23, 42, 0.5)',  // Modal backdrop
  input:    '#F8FAFC',                 // Input bg default
  inputFocused: '#FFFFFF',             // Input bg focused
}
```

## Typography

### Font Family
```
Primary:  'Inter' (load via expo-font) or System default
Fallback: Platform.OS === 'ios' ? 'System' : 'Roboto'
```

### Font Sizes — ONLY THESE ARE ALLOWED
| Token    | Size  | Use Case                              |
|----------|-------|---------------------------------------|
| `xs`     | 10px  | Badges, timestamps, tertiary labels   |
| `sm`     | 12px  | Captions, helper text, table headers  |
| `md`     | 14px  | Body text, input text, list items     |
| `lg`     | 16px  | Emphasized body, input labels, buttons|
| `xl`     | 18px  | Section headers, card titles          |
| `2xl`    | 20px  | Screen subtitles                      |
| `3xl`    | 24px  | Screen titles                         |
| `4xl`    | 30px  | Hero numbers (dashboard stats)        |
| `5xl`    | 36px  | Large hero/feature numbers            |

### Font Weights — ONLY THESE ARE ALLOWED
| Token      | Weight | Use Case                         |
|------------|--------|----------------------------------|
| `regular`  | '400'  | Body text, descriptions          |
| `medium`   | '500'  | Labels, captions, secondary info |
| `semibold` | '600'  | Buttons, card titles, tab labels |
| `bold`     | '700'  | Screen titles, stat values       |
| `extrabold`| '800'  | Hero branding text only          |

### Text Styles — Pre-built combinations
```javascript
textStyles: {
  screenTitle:   { fontSize: 24, fontWeight: '700', color: neutral[900], letterSpacing: -0.3 },
  screenSubtitle:{ fontSize: 14, fontWeight: '400', color: neutral[500], letterSpacing: 0 },
  sectionTitle:  { fontSize: 18, fontWeight: '600', color: neutral[800], letterSpacing: -0.2 },
  cardTitle:     { fontSize: 16, fontWeight: '600', color: neutral[800] },
  body:          { fontSize: 14, fontWeight: '400', color: neutral[700], lineHeight: 20 },
  bodySmall:     { fontSize: 12, fontWeight: '400', color: neutral[500], lineHeight: 16 },
  label:         { fontSize: 12, fontWeight: '500', color: neutral[600], letterSpacing: 0.3, textTransform: 'uppercase' },
  buttonLarge:   { fontSize: 16, fontWeight: '600', color: '#FFFFFF', letterSpacing: 0.3 },
  buttonMedium:  { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  statValue:     { fontSize: 30, fontWeight: '700', color: neutral[900], letterSpacing: -0.5 },
  statLabel:     { fontSize: 12, fontWeight: '500', color: neutral[500] },
  badge:         { fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
}
```

## Spacing — ONLY THESE VALUES

| Token | Pixels | Common Use                              |
|-------|--------|-----------------------------------------|
| `xs`  | 4      | Icon-to-text gap, tight inner padding   |
| `sm`  | 8      | Between related items, small gaps       |
| `md`  | 12     | Input inner padding, badge padding      |
| `lg`  | 16     | Card padding, screen horizontal margin  |
| `xl`  | 20     | Between form fields                     |
| `2xl` | 24     | Section spacing, card gaps              |
| `3xl` | 32     | Between major sections                  |
| `4xl` | 40     | Screen top/bottom padding               |
| `5xl` | 48     | Large section separators                |

### Key Layout Values
```
Screen horizontal padding:  16px  (spacing.lg)
Card internal padding:      16px  (spacing.lg)
Card gap (between cards):   12px  (spacing.md)
List item height:           56px  (minimum touch target)
List item padding:          16px horizontal, 12px vertical
Section gap:                24px  (spacing.2xl)
Input height:               48px
Button height (lg):         48px
Button height (md):         40px
Button height (sm):         32px
Bottom tab bar height:      64px (including safe area)
Header height:              56px
```

## Border Radius — ONLY THESE VALUES

| Token  | Pixels | Use Case                        |
|--------|--------|---------------------------------|
| `sm`   | 6      | Small chips, tags, badges       |
| `md`   | 8      | Inputs, small buttons           |
| `lg`   | 12     | Cards, containers, sections     |
| `xl`   | 16     | Bottom sheets, modals, large cards |
| `full` | 9999   | Avatars, circular buttons, pills |

## Shadows — ONLY THESE 3 LEVELS

```javascript
shadows: {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
}
```

## Icon Set

Use **`@expo/vector-icons` → `Ionicons`** exclusively. Do NOT mix icon libraries.
- Use `outline` variant for inactive/default state (e.g., `home-outline`)
- Use `filled` variant for active state (e.g., `home`)
- Icon sizes: 16 (inline), 20 (inputs/lists), 24 (navigation/headers), 32 (empty states), 48 (features)

## Forbidden Patterns

❌ **NEVER DO THIS:**
- Inline hex colors: `color: '#4A90D9'` — use tokens
- Arbitrary spacing: `marginTop: 13` — use token values
- Random font sizes: `fontSize: 17` — use the scale
- Opacity for text color: `color: 'rgba(0,0,0,0.6)'` — use neutral scale
- Hardcoded border radius: `borderRadius: 10` — use tokens
- Multiple shadow styles: always use sm/md/lg only
- Mixing icon libraries (no FontAwesome, no MaterialIcons)
