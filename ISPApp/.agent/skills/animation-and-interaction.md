---
description: Standard animation and interaction patterns for ISPApp. Defines exact timing, easing, and effects for all interactive elements. Prevents vibe-coded or excessive animations.
---

# Animation & Interaction — Micro-Interaction Standard

> **RULE**: Animations must be subtle, purposeful, and identical across the entire app. Every button press, screen transition, and feedback effect follows these exact specs.

## Core Principle

**SUBTLE > FLASHY**. Enterprise apps should feel smooth and responsive, not bouncy or playful. Think Stripe/Linear, not TikTok.

## Button Press Feedback

### Primary/Secondary Buttons
```javascript
const [scaleAnim] = useState(new Animated.Value(1));

const handlePressIn = () => {
  Animated.timing(scaleAnim, {
    toValue: 0.97,
    duration: 80,
    useNativeDriver: true,
  }).start();
};

const handlePressOut = () => {
  Animated.timing(scaleAnim, {
    toValue: 1,
    duration: 120,
    useNativeDriver: true,
  }).start();
};

// Usage
<Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
  <TouchableOpacity
    onPressIn={handlePressIn}
    onPressOut={handlePressOut}
    activeOpacity={0.85}
  >
    ...
  </TouchableOpacity>
</Animated.View>
```

### Specs
| Property       | Value | Notes                      |
|----------------|-------|----------------------------|
| Scale target   | 0.97  | Barely perceptible         |
| Press-in time  | 80ms  | Instant feedback           |
| Press-out time | 120ms | Slightly slower for feel   |
| activeOpacity  | 0.85  | For non-animated buttons   |

### List Items and Cards
```javascript
// For cards/list items, use activeOpacity only — no scale animation
<TouchableOpacity activeOpacity={0.7}>
```

## Screen Entry Animation

### Fade-in + Slide-up (for content appearing on screen)
```javascript
const fadeAnim = useRef(new Animated.Value(0)).current;
const slideAnim = useRef(new Animated.Value(12)).current;

useEffect(() => {
  Animated.parallel([
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }),
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }),
  ]).start();
}, []);

// Usage
<Animated.View style={{
  opacity: fadeAnim,
  transform: [{ translateY: slideAnim }],
}}>
  {/* Screen content */}
</Animated.View>
```

### Specs
| Property     | Value | Notes                    |
|--------------|-------|--------------------------|
| Duration     | 250ms | Fast but noticeable      |
| Fade: 0 → 1 | Linear|                          |
| Slide: 12 → 0| Linear| Subtle upward movement  |
| Delay        | 0ms   | Immediate on mount       |

## List Item Stagger (optional, for small lists only)

Use ONLY for lists with ≤10 items (dashboard cards, stat rows). Never for large data lists.

```javascript
const animateItem = (index) => ({
  opacity: fadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  }),
  transform: [{
    translateY: fadeAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [8, 0],
    }),
  }],
});

// Stagger timing
items.forEach((_, index) => {
  Animated.timing(anims[index], {
    toValue: 1,
    duration: 200,
    delay: index * 50,              // 50ms between each item
    useNativeDriver: true,
  }).start();
});
```

### Specs
| Property       | Value | Notes                    |
|----------------|-------|--------------------------|
| Item duration  | 200ms |                          |
| Stagger delay  | 50ms  | Between consecutive items|
| Max items      | 10    | Don't stagger large lists|
| SlideY         | 8px   | Very subtle              |

## Loading Skeleton Shimmer

```javascript
// Use a reusable SkeletonBox component
const SkeletonBox = ({ width, height, style }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          backgroundColor: colors.neutral[200],
          borderRadius: borderRadius.sm,    // 6
          opacity,
        },
        style,
      ]}
    />
  );
};
```

### Specs
| Property       | Value  | Notes                 |
|----------------|--------|-----------------------|
| Background     | neutral[200] | '#E2E8F0'       |
| Opacity range  | 0.3 → 0.7 | Subtle pulse     |
| Cycle duration | 2400ms | Full loop (1200 each) |
| Border radius  | 6px    | Matches sm radius     |

### Skeleton patterns for common screens
```
Dashboard skeleton:
  ┌─ [████████] ──── [████] ──┐  ← Header skeleton
  │ [████] [████]             │  ← 2 stat card skeletons
  │ [████████████████████]    │  ← Section title skeleton
  │ [████████████████████]    │  ← List item skeletons x3-4
  │ [████████████████████]    │
  │ [████████████████████]    │

List skeleton:
  [████████████████████████████]  ← Search bar skeleton
  [████████████████████████████]  ← List item skeleton x5-6
  [████████████████████████████]
  [████████████████████████████]
```

## Tab Switch
```
NO animation for tab switches. Tabs render instantly.
The tab bar indicator (if using top tabs) slides: duration 200ms.
```

## Toast / Snackbar

```javascript
// Slide in from top
enterAnimation: {
  from: { translateY: -60, opacity: 0 },
  to:   { translateY: 0,   opacity: 1 },
  duration: 250,
}

// Auto-dismiss after 3 seconds
dismissAnimation: {
  from: { translateY: 0,   opacity: 1 },
  to:   { translateY: -60, opacity: 0 },
  duration: 200,
}

// Toast styles:
toastContainer: {
  position: 'absolute',
  top: Platform.OS === 'ios' ? 50 : 20,
  left: spacing.lg,
  right: spacing.lg,
  backgroundColor: colors.neutral[800],
  borderRadius: borderRadius.lg,         // 12
  padding: spacing.lg,                   // 16
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing.md,                       // 12
  ...shadows.lg,
}
toastText: {
  color: '#FFFFFF',
  fontSize: typography.fontSize.md,      // 14
  fontWeight: '500',
  flex: 1,
}
```

## Pull-to-Refresh
```javascript
// Already handled by RefreshControl — these are the colors:
refreshControl={
  <RefreshControl
    refreshing={refreshing}
    onRefresh={onRefresh}
    colors={[colors.primary[600]]}        // Android
    tintColor={colors.primary[600]}       // iOS
    progressBackgroundColor="#FFFFFF"      // Android background
  />
}
```

## Forbidden Animations

❌ **NEVER use these:**
- `spring` with high bounciness/damping — feels like a toy
- `bounce` easing — unprofessional
- Scale animations > 1.02 or < 0.95 — too dramatic
- Rotation animations — disorienting on mobile
- Duration > 400ms for any UI feedback — feels sluggish
- `useNativeDriver: false` for transforms — causes jank
- Parallax scrolling effects — heavy and distracting
- Auto-playing Lottie animations everywhere — bloats bundle
- Continuous looping animations (except skeleton shimmer)

## Animation Timing Reference

| Interaction       | Duration | Easing  | Transform         |
|-------------------|----------|---------|-------------------|
| Button press      | 80ms in, 120ms out | Linear | scale 0.97    |
| Screen content    | 250ms    | Linear  | fade + translateY 12 |
| List stagger      | 200ms/item, 50ms delay | Linear | fade + translateY 8 |
| Skeleton shimmer  | 1200ms × 2 | Linear | opacity 0.3 ↔ 0.7 |
| Toast enter       | 250ms    | Linear  | translateY -60 → 0 |
| Toast exit        | 200ms    | Linear  | translateY 0 → -60 |
| Modal backdrop    | 200ms    | Linear  | opacity 0 → 0.5   |
| Tab indicator     | 200ms    | Linear  | translateX         |

## Rules
1. ALL animations use `useNativeDriver: true` — no exceptions for transforms/opacity
2. NO animation exceeds 400ms duration
3. Button press scale is ALWAYS 0.97 (not 0.95 or 0.9)
4. List stagger is ONLY for ≤10 items
5. Skeleton shimmer is the ONLY acceptable continuous animation
6. Toast auto-dismisses after 3 seconds
7. Every animation uses `Linear` easing — no springs, no bounces
