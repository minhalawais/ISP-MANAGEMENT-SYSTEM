---
description: Standard navigation patterns for ISPApp. Covers tab bar config, headers, modals, bottom sheets, and routing structure.
---

# Navigation & Layout — Navigation Standard

> **RULE**: All navigation patterns must follow these exact configurations. Header styles, tab bars, and modal behavior are standardized across the entire app.

## Navigation Architecture

```
App.js
├── AuthStack (when !isAuthenticated)
│   ├── LoginScreen
│   └── ForgotPasswordScreen
│
└── MainStack (when isAuthenticated)
    ├── AdminTabs (role === 'company_owner' || 'super_admin' || 'auditor')
    │   ├── Dashboard      (home-outline / home)
    │   ├── Customers      (people-outline / people)
    │   ├── Payments       (card-outline / card)
    │   ├── Invoices       (document-text-outline / document-text)
    │   └── More           (ellipsis-horizontal / ellipsis-horizontal)
    │
    ├── EmployeeTabs (role === 'employee')
    │   ├── Dashboard      (home-outline / home)
    │   ├── Tasks          (clipboard-outline / clipboard)
    │   ├── Complaints     (warning-outline / warning)
    │   └── Profile        (person-outline / person)
    │
    └── CustomerTabs (role === 'customer')
        ├── Dashboard      (home-outline / home)
        ├── Invoices       (document-text-outline / document-text)
        ├── Complaints     (warning-outline / warning)
        └── Profile        (person-outline / person)
```

## Bottom Tab Bar Configuration

```javascript
const tabBarOptions = {
  tabBarStyle: {
    height: 64,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],    // Very subtle border
    ...shadows.md,
  },
  tabBarActiveTintColor: colors.primary[600],    // '#2563EB'
  tabBarInactiveTintColor: colors.neutral[400],  // '#94A3B8'
  tabBarLabelStyle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  tabBarIconStyle: {
    marginBottom: -2,               // Tighten icon-to-label gap
  },
  headerShown: false,               // We handle headers per screen
};
```

### Tab Icon Pattern
```javascript
// Use outline for inactive, filled for active
tabBarIcon: ({ focused, color }) => (
  <Ionicons
    name={focused ? 'home' : 'home-outline'}
    size={22}
    color={color}
  />
)
```

### Tab Badge (notification count)
```javascript
tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
tabBarBadgeStyle: {
  backgroundColor: colors.semantic.error,
  fontSize: 10,
  fontWeight: '600',
  minWidth: 18,
  height: 18,
  borderRadius: 9,
},
```

## Stack Navigator — Screen Options

### Default Stack Options
```javascript
const defaultScreenOptions = {
  headerShown: true,
  headerStyle: {
    backgroundColor: colors.background.primary,  // '#F8FAFC'
    elevation: 0,                                 // Remove Android shadow
    shadowOpacity: 0,                             // Remove iOS shadow
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  headerTitleStyle: {
    fontSize: typography.fontSize.xl,              // 18
    fontWeight: '600',
    color: colors.neutral[900],
  },
  headerTitleAlign: 'center',
  headerBackTitleVisible: false,
  headerTintColor: colors.neutral[800],
  headerLeftContainerStyle: {
    paddingLeft: spacing.sm,                       // 8
  },
  headerRightContainerStyle: {
    paddingRight: spacing.lg,                      // 16
  },
  // Transition animation
  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
  gestureEnabled: true,
};
```

### Custom Back Button
```javascript
headerLeft: ({ onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={{ padding: spacing.sm }}
    hitSlop={8}
  >
    <Ionicons name="arrow-back" size={24} color={colors.neutral[800]} />
  </TouchableOpacity>
),
```

### Header Right Action
```javascript
headerRight: () => (
  <TouchableOpacity
    onPress={handleAction}
    style={{ padding: spacing.sm }}
    hitSlop={8}
  >
    <Ionicons name="add" size={24} color={colors.primary[600]} />
  </TouchableOpacity>
),
```

## Modal Presentation

### Standard Modal (from bottom)
```javascript
// In navigator
<Stack.Screen
  name="CreateCustomer"
  component={CreateCustomerScreen}
  options={{
    presentation: 'modal',
    headerTitle: 'New Customer',
    headerLeft: () => (
      <TouchableOpacity onPress={navigation.goBack}>
        <Ionicons name="close" size={24} color={colors.neutral[700]} />
      </TouchableOpacity>
    ),
    headerRight: () => (
      <TouchableOpacity onPress={handleSave}>
        <Text style={{ color: colors.primary[600], fontSize: 16, fontWeight: '600' }}>
          Save
        </Text>
      </TouchableOpacity>
    ),
  }}
/>
```

### Confirmation Modal (alert-style)
```javascript
// Use a custom overlay component, not Alert.alert
<Modal visible={visible} transparent animationType="fade">
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      <View style={styles.modalIconContainer}>
        <Ionicons name="warning-outline" size={32} color={colors.semantic.warning} />
      </View>
      <Text style={styles.modalTitle}>Confirm Action</Text>
      <Text style={styles.modalMessage}>Are you sure you want to proceed?</Text>
      <View style={styles.modalActions}>
        <Button variant="outline" title="Cancel" onPress={onCancel} style={{ flex: 1 }} />
        <Button variant="danger" title="Delete" onPress={onConfirm} style={{ flex: 1 }} />
      </View>
    </View>
  </View>
</Modal>

modalOverlay: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: colors.surface.overlay,  // rgba(15, 23, 42, 0.5)
  paddingHorizontal: spacing['3xl'],        // 32
},
modalContent: {
  width: '100%',
  backgroundColor: '#FFFFFF',
  borderRadius: borderRadius.xl,            // 16
  padding: spacing['2xl'],                  // 24
  alignItems: 'center',
},
modalTitle: {
  fontSize: typography.fontSize.xl,          // 18
  fontWeight: '600',
  color: colors.neutral[900],
  marginTop: spacing.lg,                    // 16
},
modalMessage: {
  fontSize: typography.fontSize.md,          // 14
  color: colors.neutral[500],
  textAlign: 'center',
  marginTop: spacing.sm,                    // 8
  lineHeight: 20,
},
modalActions: {
  flexDirection: 'row',
  gap: spacing.md,                          // 12
  marginTop: spacing['2xl'],               // 24
  width: '100%',
},
```

## Screen Transition Rules

1. **Push** (stack): Horizontal slide (left-to-right)
2. **Modal**: Slide up from bottom
3. **Tab switch**: No animation (instant)
4. **Back**: Reverse of push animation

## Navigation Helper Patterns

### Navigate with params
```javascript
navigation.navigate('CustomerDetail', { customerId: item.id });
```

### Navigate to nested screen
```javascript
navigation.navigate('AdminTabs', {
  screen: 'Customers',
  params: { filter: 'active' },
});
```

### Reset navigation (after login/logout)
```javascript
// Don't manually reset — use the `isAuthenticated` state in App.js
// The navigator conditionally renders AuthStack vs MainStack
```

## Rules
1. Tab bar uses Ionicons exclusively — outline inactive, filled active
2. Tab icon size is ALWAYS 22
3. Tab label font size is ALWAYS 11
4. Header height is 56px (default React Navigation)
5. Always use `headerShown: false` on tab navigator and handle headers per screen
6. Modals always have a close (X) button on the left and action on the right
7. Never use Alert.alert for confirmations — use custom Modal
8. Always enable gesture-based back navigation
9. Tab bar background is always white with subtle top border
