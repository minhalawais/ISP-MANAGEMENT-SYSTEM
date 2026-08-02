---
description: Standard form and input patterns for ISPApp. Covers input anatomy, validation display, form layout, keyboard handling, and action button placement.
---

# Form Patterns — Form & Input Standard

> **RULE**: Every form in the app follows these exact patterns. Input heights, label placement, error display, and button positioning are non-negotiable.

## Input Anatomy

```
   Label *                                    ← 12px, fontWeight '600', neutral[700]
   ┌─ [icon] ── Input text ──────────────┐    ← 48px height
   │  🔍        Placeholder...            │
   └──────────────────────────────────────┘
   Helper text or error message               ← 12px, neutral[400] or error
   ↕ 20px gap to next field
```

## Input States

### Default
```javascript
inputContainer: {
  height: 48,
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: colors.surface.input,     // '#F8FAFC'
  borderWidth: 1.5,
  borderColor: colors.neutral[200],          // '#E2E8F0'
  borderRadius: borderRadius.md,             // 8
  paddingHorizontal: spacing.lg,             // 16
},
```

### Focused
```javascript
inputContainerFocused: {
  borderColor: colors.primary[500],          // '#3B82F6'
  backgroundColor: colors.surface.inputFocused, // '#FFFFFF'
  ...shadows.sm,
},
```

### Error
```javascript
inputContainerError: {
  borderColor: colors.semantic.error,        // '#EF4444'
  backgroundColor: '#FEF2F2',
},
```

### Disabled
```javascript
inputContainerDisabled: {
  backgroundColor: colors.neutral[100],      // '#F1F5F9'
  borderColor: colors.neutral[200],
  opacity: 0.6,
},
```

## FormInput Component Pattern

```javascript
const FormInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  helperText,
  required = false,
  leftIcon,
  rightIcon,
  onRightIconPress,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  disabled = false,
  multiline = false,
  numberOfLines = 1,
  testID,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.inputGroup}>
      {/* Label */}
      {label && (
        <Text style={styles.inputLabel}>
          {label}
          {required && <Text style={styles.requiredAsterisk}> *</Text>}
        </Text>
      )}

      {/* Input Container */}
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputContainerFocused,
        error && styles.inputContainerError,
        disabled && styles.inputContainerDisabled,
      ]}>
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={isFocused ? colors.primary[500] : colors.neutral[400]}
            style={{ marginRight: spacing.md }}
          />
        )}
        <TextInput
          style={[styles.textInput, multiline && { height: numberOfLines * 24, textAlignVertical: 'top' }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.neutral[300]}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={!disabled}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          testID={testID}
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} hitSlop={8}>
            <Ionicons name={rightIcon} size={20} color={colors.neutral[400]} />
          </TouchableOpacity>
        )}
      </View>

      {/* Error or Helper Text */}
      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={14} color={colors.semantic.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
};
```

## Form Input Styles

```javascript
inputGroup: {
  marginBottom: spacing.xl,            // 20px between fields
},
inputLabel: {
  fontSize: typography.fontSize.sm,     // 12
  fontWeight: '600',
  color: colors.neutral[700],
  marginBottom: spacing.sm,            // 8
},
requiredAsterisk: {
  color: colors.semantic.error,
},
textInput: {
  flex: 1,
  fontSize: typography.fontSize.md,     // 14
  color: colors.neutral[800],
  paddingVertical: 0,
},
errorRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing.xs,                    // 4
  marginTop: spacing.xs,              // 4
},
errorText: {
  fontSize: typography.fontSize.sm,    // 12
  color: colors.semantic.error,
  fontWeight: '500',
},
helperText: {
  fontSize: typography.fontSize.sm,    // 12
  color: colors.neutral[400],
  marginTop: spacing.xs,              // 4
},
```

## Form Layout

```javascript
// Wrap entire form in KeyboardAvoidingView
<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  style={{ flex: 1 }}
  keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
>
  <ScrollView
    contentContainerStyle={styles.formContainer}
    keyboardShouldPersistTaps="handled"
    showsVerticalScrollIndicator={false}
  >
    {/* Form fields here */}
  </ScrollView>
</KeyboardAvoidingView>

formContainer: {
  paddingHorizontal: spacing.lg,       // 16
  paddingTop: spacing.lg,             // 16
  paddingBottom: spacing['5xl'],      // 48 — room for keyboard
},
```

## Form Sections (grouping related fields)

```
┌─ Personal Information ──────────────────┐
│  First Name                             │
│  [_________________________]            │
│                                         │
│  Last Name                              │
│  [_________________________]            │
│                                         │
│  Email                                  │
│  [_________________________]            │
└─────────────────────────────────────────┘

   ↕ 24px gap (spacing.2xl)

┌─ Address ───────────────────────────────┐
│  Street                                 │
│  [_________________________]            │
│  ...                                    │
└─────────────────────────────────────────┘
```

```javascript
formSection: {
  marginBottom: spacing['2xl'],          // 24
},
formSectionTitle: {
  fontSize: typography.fontSize.lg,       // 16
  fontWeight: '600',
  color: colors.neutral[800],
  marginBottom: spacing.lg,              // 16
},
```

## Select / Dropdown

```javascript
// Use a TouchableOpacity that opens a BottomSheet with options
<TouchableOpacity style={[styles.inputContainer, styles.selectContainer]} onPress={openPicker}>
  {leftIcon && <Ionicons name={leftIcon} size={20} ... />}
  <Text style={[styles.textInput, !value && styles.placeholderText]}>
    {selectedLabel || placeholder}
  </Text>
  <Ionicons name="chevron-down" size={20} color={colors.neutral[400]} />
</TouchableOpacity>

// Options in BottomSheet:
optionItem: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: spacing.md,           // 12
  paddingHorizontal: spacing.lg,         // 16
},
optionItemSelected: {
  backgroundColor: colors.primary[50],
},
optionText: {
  fontSize: typography.fontSize.md,      // 14
  color: colors.neutral[700],
  flex: 1,
},
optionCheckmark: {
  // Show checkmark icon for selected item
  color: colors.primary[600],
},
```

## Form Action Buttons

```
┌──────────────────────────────────────────┐
│                                          │
│  [ Cancel ]              [ Save / Submit]│  ← Sticky at bottom
│                                          │
└──────────────────────────────────────────┘

OR for single action forms:

┌──────────────────────────────────────────┐
│  [       Submit / Save                  ]│  ← Full width
└──────────────────────────────────────────┘
```

```javascript
formActions: {
  flexDirection: 'row',
  gap: spacing.md,                        // 12
  paddingHorizontal: spacing.lg,          // 16
  paddingVertical: spacing.lg,            // 16
  paddingBottom: spacing['2xl'],          // 24 — safe area
  backgroundColor: colors.background.primary,
  borderTopWidth: 1,
  borderTopColor: colors.neutral[100],
},
```

## Validation Rules

1. Show errors only AFTER the user has interacted with a field (blur or submit)
2. Clear the error when the user starts typing again
3. Required fields: show asterisk (*) next to label in red
4. Validate on blur for individual fields, validate all on submit
5. Scroll to first error field on submit failure

## Rules
1. Input height is ALWAYS 48px (single-line)
2. Gap between fields is ALWAYS 20px (spacing.xl)
3. Labels are ALWAYS above the input (never floating/inside)
4. Error messages appear BELOW the input with error icon
5. NEVER use alert() for validation errors — always inline
6. ALWAYS wrap forms in KeyboardAvoidingView
7. ALWAYS use `keyboardShouldPersistTaps="handled"` on ScrollView
8. Submit button is disabled when form is invalid or submitting
