---
description: Standard patterns for displaying data in cards and lists across ISPApp. Ensures every list, card, stat display, and empty state looks identical.
---

# Card & List Patterns — Data Display Standard

> **RULE**: Cards and lists make up 80% of this app. Every card MUST use the same padding, radius, shadow. Every list MUST use the same item height, separator, and layout pattern.

## Standard Card

```javascript
const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface.card,    // #FFFFFF
    borderRadius: borderRadius.lg,           // 12
    padding: spacing.lg,                     // 16
    borderWidth: 1,
    borderColor: colors.neutral[200],        // #E2E8F0
    ...shadows.sm,
  },
});
```

### Card Variants

#### Info Card (default)
```
┌──────────────────────────────────┐
│  Title                    Badge  │
│  Subtitle / description          │
│                                  │
│  Detail line 1        Value 1    │
│  Detail line 2        Value 2    │
└──────────────────────────────────┘

Padding: 16px all sides
Title: fontSize 16, fontWeight '600', neutral[800]
Subtitle: fontSize 14, fontWeight '400', neutral[500]
Detail label: fontSize 14, neutral[500]
Detail value: fontSize 14, fontWeight '500', neutral[800]
Gap between title/subtitle and details: 12px
Gap between detail rows: 8px
```

#### Pressable Card (navigates to detail)
```javascript
<TouchableOpacity
  style={styles.card}
  onPress={onPress}
  activeOpacity={0.7}
  testID={`card-${item.id}`}
>
  {/* Same layout as info card */}
  <View style={styles.cardChevron}>
    <Ionicons name="chevron-forward" size={20} color={colors.neutral[300]} />
  </View>
</TouchableOpacity>
```
Add a chevron icon on the right to indicate it's tappable.

## Stat Card

Used on dashboards for key metrics.

```
┌────────────────────┐
│  📊  stat icon     │
│                    │
│  2,450             │  ← statValue: fontSize 30, fontWeight '700'
│  Total Customers   │  ← statLabel: fontSize 12, fontWeight '500', neutral[500]
│  ↑ 12% this month  │  ← statTrend: fontSize 12, semantic color
└────────────────────┘

Width:       (screenWidth - 48) / 2   (2 per row with 16px gap)
Padding:     16px
Icon bg:     primary[50] or semantic light
Icon size:   24px
Border:      1px neutral[200]
Radius:      12px
Shadow:      shadows.sm
```

### Stat Card Layout (2 per row)
```javascript
<View style={styles.statsRow}>
  <StatCard icon="people-outline" value="2,450" label="Customers" trend="+12%" />
  <StatCard icon="card-outline" value="₨1.2M" label="Revenue" trend="+5%" />
</View>

statsRow: {
  flexDirection: 'row',
  gap: spacing.md,           // 12
  paddingHorizontal: spacing.lg,  // 16
}
```

## Section Header

Used to separate content sections within a screen.

```
Section Title                [See All >]
```

```javascript
const SectionHeader = ({ title, actionLabel, onAction }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {actionLabel && (
      <TouchableOpacity onPress={onAction} hitSlop={8}>
        <Text style={styles.sectionAction}>{actionLabel}</Text>
      </TouchableOpacity>
    )}
  </View>
);

sectionHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingHorizontal: spacing.lg,  // 16
  marginBottom: spacing.md,       // 12
  marginTop: spacing['2xl'],      // 24
},
sectionTitle: {
  fontSize: typography.fontSize.xl,  // 18
  fontWeight: '600',
  color: colors.neutral[800],
  letterSpacing: -0.2,
},
sectionAction: {
  fontSize: typography.fontSize.sm,  // 12
  fontWeight: '600',
  color: colors.primary[600],
},
```

## Standard List Item

```
┌──────────────────────────────────────────┐
│  [Avatar]  Title Text          ₨5,000  > │
│            Subtitle text       Badge     │
└──────────────────────────────────────────┘

Height:        minimum 64px (content-driven, but never less)
Padding:       16px horizontal, 12px vertical
Avatar:        40x40, borderRadius full
Title:         fontSize 14, fontWeight '500', neutral[800]
Subtitle:      fontSize 12, fontWeight '400', neutral[500]
Trailing value:fontSize 14, fontWeight '600', neutral[800]
Trailing sub:  fontSize 12, fontWeight '400', neutral[400]
Chevron:       20px, neutral[300] — ONLY if navigable
```

```javascript
const ListItem = ({ avatar, title, subtitle, trailingValue, trailingLabel, onPress }) => (
  <TouchableOpacity style={styles.listItem} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.listItemLeft}>
      <Avatar name={avatar} size="md" />
      <View style={styles.listItemContent}>
        <Text style={styles.listItemTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.listItemSubtitle} numberOfLines={1}>{subtitle}</Text>
      </View>
    </View>
    <View style={styles.listItemRight}>
      {trailingValue && (
        <Text style={styles.listItemValue}>{trailingValue}</Text>
      )}
      {trailingLabel && (
        <Badge label={trailingLabel} variant="success" size="sm" />
      )}
    </View>
    {onPress && (
      <Ionicons name="chevron-forward" size={20} color={colors.neutral[300]} />
    )}
  </TouchableOpacity>
);
```

## List Separator

```javascript
// Between list items — NOT a full-width line
separator: {
  height: 1,
  backgroundColor: colors.neutral[100],  // Very subtle
  marginLeft: 72,  // Align with text start (16 padding + 40 avatar + 16 gap)
}
```

## FlatList Configuration (mandatory)

```javascript
<FlatList
  data={items}
  renderItem={renderItem}
  keyExtractor={(item) => String(item.id)}
  contentContainerStyle={{
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['5xl'],    // 48 — for bottom tab clearance
  }}
  showsVerticalScrollIndicator={false}
  ItemSeparatorComponent={Separator}
  ListEmptyComponent={<EmptyState icon="..." title="..." subtitle="..." />}
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      colors={[colors.primary[600]]}
      tintColor={colors.primary[600]}
    />
  }
  // Performance
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={5}
  initialNumToRender={10}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
```

## Empty State

```
        ┌──────────────────┐
        │   📂 (48px icon) │
        │                  │
        │   No items yet   │  ← fontSize 18, fontWeight '600', neutral[700]
        │   Description    │  ← fontSize 14, neutral[400], textAlign center
        │                  │
        │  [ Add Item ]    │  ← Optional CTA button
        └──────────────────┘

Centered vertically in the available space.
Icon color: neutral[300]
Max text width: 260px (prevents overly wide text)
```

## Filter Chips (for list screens)

```
[All]  [Active]  [Inactive]  [Suspended]

Active chip:   bg primary[600], text white, borderRadius full
Inactive chip: bg neutral[100], text neutral[600], borderRadius full
Height:        32px
PaddingH:      12px
FontSize:      12
FontWeight:    '600'
Gap:           8px
Container:     horizontal ScrollView, paddingH 16, marginBottom 16
```

## Rules
1. EVERY card uses: 12px radius, 16px padding, 1px neutral[200] border, shadows.sm
2. EVERY list item has minimum 64px height (touch target)
3. NEVER use a full-width separator line — always indent to align with text
4. ALWAYS include `ListEmptyComponent` on every FlatList
5. ALWAYS add pull-to-refresh on data lists
6. Stat cards always appear in rows of 2
7. Section headers always have 24px top margin and 12px bottom margin
8. Card gaps are always 12px
