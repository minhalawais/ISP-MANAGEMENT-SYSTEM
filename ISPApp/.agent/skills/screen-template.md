---
description: Standard screen template that every ISPApp screen MUST follow. Covers file structure, state handling, layout patterns, and required code patterns.
---

# Screen Template — Standard Screen Structure

> **RULE**: Every screen file MUST follow this exact structure. No exceptions. Copy this template and fill in the specifics.

## File Location
```
src/screens/{portal}/{ScreenName}Screen.js

Portals: auth, admin, employee, customer
Example: src/screens/admin/CustomerListScreen.js
```

## Template

```javascript
// {ScreenName}Screen — {Brief description}

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  RefreshControl,
  FlatList,          // or ScrollView for non-list screens
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';

// ─── COMPONENT ──────────────────────────────────────────
const {ScreenName}Screen = ({ navigation, route }) => {
  // ── Params ───────────────────────────────────────────
  // const { id } = route.params ?? {};

  // ── State ────────────────────────────────────────────
  const [refreshing, setRefreshing] = useState(false);

  // ── Data Hooks ───────────────────────────────────────
  // const { data, isLoading, isError, error, refetch } = useQuery(...);

  // ── Handlers ─────────────────────────────────────────
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // await refetch();
    setRefreshing(false);
  }, []);

  // ── Render Helpers ───────────────────────────────────

  // ── Loading State ────────────────────────────────────
  // if (isLoading) return <LoadingSkeleton />;

  // ── Error State ──────────────────────────────────────
  // if (isError) return <ErrorState message={error.message} onRetry={refetch} />;

  // ── Empty State ──────────────────────────────────────
  // if (data?.length === 0) return <EmptyState ... />;

  // ── Main Render ──────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.primary} />

      {/* Screen Header */}
      <View style={styles.header}>
        <Text style={styles.screenTitle}>{Screen Title}</Text>
        <Text style={styles.screenSubtitle}>{Optional subtitle}</Text>
      </View>

      {/* Content */}
      <FlatList
        data={[]}
        renderItem={({ item }) => null}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary[600]]}
            tintColor={colors.primary[600]}
          />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={null}
      />
    </SafeAreaView>
  );
};

// ─── STYLES ───────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    paddingHorizontal: spacing.lg,    // 16
    paddingTop: spacing.lg,           // 16
    paddingBottom: spacing.md,        // 12
    backgroundColor: colors.background.primary,
  },
  screenTitle: {
    fontSize: typography.fontSize['3xl'],   // 24
    fontWeight: '700',
    color: colors.neutral[900],
    letterSpacing: -0.3,
  },
  screenSubtitle: {
    fontSize: typography.fontSize.md,       // 14
    fontWeight: '400',
    color: colors.neutral[500],
    marginTop: spacing.xs,           // 4
  },
  listContent: {
    paddingHorizontal: spacing.lg,   // 16
    paddingBottom: spacing['4xl'],   // 40
  },
  separator: {
    height: spacing.md,              // 12
  },
});

export default {ScreenName}Screen;
```

## Mandatory State Handling

Every screen that fetches data MUST handle these 4 states:

### 1. Loading → Skeleton (NOT spinner)
```javascript
if (isLoading && !data) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.primary} />
      <View style={styles.header}>
        <SkeletonBox width={160} height={28} />
        <SkeletonBox width={100} height={16} style={{ marginTop: 4 }} />
      </View>
      <View style={styles.listContent}>
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </View>
    </SafeAreaView>
  );
}
```

### 2. Error → Message + Retry
```javascript
if (isError) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.centeredState}>
        <Ionicons name="cloud-offline-outline" size={48} color={colors.neutral[300]} />
        <Text style={styles.stateTitle}>Something went wrong</Text>
        <Text style={styles.stateSubtitle}>{error?.message || 'Please try again'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refetch}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
```

### 3. Empty → Illustration + CTA
```javascript
if (data?.length === 0) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.centeredState}>
        <Ionicons name="folder-open-outline" size={48} color={colors.neutral[300]} />
        <Text style={styles.stateTitle}>No items yet</Text>
        <Text style={styles.stateSubtitle}>Items will appear here once added</Text>
      </View>
    </SafeAreaView>
  );
}
```

### 4. Success → Normal render with pull-to-refresh

## State Styles (add to every screen)
```javascript
centeredState: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  paddingHorizontal: spacing['3xl'],   // 32
},
stateTitle: {
  fontSize: typography.fontSize.xl,     // 18
  fontWeight: '600',
  color: colors.neutral[700],
  marginTop: spacing.lg,              // 16
  textAlign: 'center',
},
stateSubtitle: {
  fontSize: typography.fontSize.md,     // 14
  color: colors.neutral[400],
  marginTop: spacing.sm,              // 8
  textAlign: 'center',
  lineHeight: 20,
},
retryButton: {
  marginTop: spacing.xl,              // 20
  paddingHorizontal: spacing['2xl'],  // 24
  paddingVertical: spacing.md,        // 12
  backgroundColor: colors.primary[600],
  borderRadius: borderRadius.md,      // 8
},
retryButtonText: {
  fontSize: typography.fontSize.md,    // 14
  fontWeight: '600',
  color: '#FFFFFF',
},
```

## Screen Header Variants

### Simple Header (most screens)
```
┌──────────────────────────────┐
│  Screen Title                │
│  Optional subtitle           │
└──────────────────────────────┘
```

### Header with Action (list screens)
```
┌──────────────────────────────┐
│  Screen Title         [+ Add]│
│  Subtitle / count            │
└──────────────────────────────┘
```

### Header with Search (filterable lists)
```
┌──────────────────────────────┐
│  Screen Title                │
│  ┌──────────────────────┐    │
│  │ 🔍 Search...         │    │
│  └──────────────────────┘    │
│  [Filter Chips]              │
└──────────────────────────────┘
```

## Rules
1. Always use `SafeAreaView` with `edges={['top']}` — never rely on status bar height
2. Always set `StatusBar` explicitly in every screen
3. Screen background is ALWAYS `colors.background.primary` (#F8FAFC)
4. Never use `ScrollView` for data lists — always use `FlatList` for performance
5. Always add `pull-to-refresh` on data screens
6. Never put business logic in the JSX — extract to handlers
7. Styles object goes BELOW the component, using `StyleSheet.create`
8. Export default at the bottom — never inline export
