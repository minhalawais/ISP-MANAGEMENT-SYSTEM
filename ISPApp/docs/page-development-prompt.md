# Page Development Prompt Template

> **Use this template when requesting mobile page development**

---

## 🎯 Quick Template

```
Develop mobile page [PRIORITY] [PAGE NAME] from the page-development-guide.
```

**Example:** `Develop mobile page 2.1 Customer List`

---

## 📋 What I Will Do For Each Page

### 1. Research Phase
- Read web reference file from `page-development-guide.md`
- Read ALL imported components (forms, tables, dialogs)
- Analyze API endpoints and data structures
- Understand complete functionality and user flows

### 2. Design Phase
- Plan mobile layout following enterprise + modern aesthetics
- Design for user-centric flow (most-used actions prominent)
- Ensure information density (no excessive whitespace)
- Plan animations and micro-interactions

### 3. Implementation Phase
- Create screen following all docs guidelines
- Implement with React Native best practices
- Add smooth animations (200-300ms transitions)
- Optimize for performance (FlatList, memoization)

### 4. Verification Phase
- Confirm ALL web features are implemented
- Verify design matches enterprise standards
- Check touch targets (44x44 minimum)
- Ensure accessibility

---

## 🎨 Design Principles Applied

| Principle | How It's Applied |
|-----------|------------------|
| **Information Density** | More data per screen, minimal whitespace waste |
| **User-Centric** | Common actions in thumb-reach zone (bottom 40% of screen) |
| **Enterprise Feel** | Professional colors, structured layouts, clear hierarchy |
| **Modern Touch** | Subtle shadows, smooth animations, rounded corners |
| **Performance First** | 60fps animations, virtualized lists, lazy loading |
| **Consistency** | Same patterns across all screens |

---

## 📱 Mobile-Specific Adaptations

| Web Pattern | Mobile Adaptation |
|-------------|-------------------|
| Data tables | Card lists with key info visible |
| Side-by-side forms | Stacked vertical forms |
| Hover tooltips | Long-press info or inline hints |
| Modal dialogs | Bottom sheets or full-screen modals |
| Dropdown menus | Action sheets |
| Pagination | Infinite scroll with pull-to-refresh |
| Sidebar navigation | Bottom tabs + drawer |

---

## ✨ Animations & Effects

| Element | Animation |
|---------|-----------|
| Screen transitions | Slide/fade (300ms) |
| List items | Stagger fade-in (50ms delay each) |
| Buttons | Scale down on press (0.97) |
| Cards | Subtle shadow elevation on press |
| Loading | Skeleton shimmer effect |
| Success actions | Checkmark with spring animation |
| Pull to refresh | Smooth spinner |

---

## 📝 Detailed Prompt Format

For complex pages, use this detailed format:

```
Develop mobile page [PRIORITY] [PAGE NAME] from [WEB_FILE.tsx]

Focus areas:
- [Specific feature 1]
- [Specific feature 2]
- [Any special requirements]

Skip (if any):
- [Features not needed on mobile]
```

---

## 🔄 Example Prompts

### Basic
```
Develop mobile page 2.1 Customer List
```

### With Focus Areas
```
Develop mobile page 2.2 Customer Detail

Focus areas:
- Quick action buttons (call, WhatsApp)
- Swipeable tabs for invoices/payments/complaints
- Pull-to-refresh for data sync
```

### Complex Page
```
Develop mobile page 8.1 Executive Dashboard

Focus areas:
- KPI cards with trend indicators
- Interactive charts (touch to see values)
- Date range selector
- Offline data caching
```

---

## ✅ Verification Checklist

After each page is developed, I will confirm:

- [ ] All web features implemented
- [ ] Follows design-system.md tokens
- [ ] Uses component-library.md components
- [ ] Matches architecture.md patterns
- [ ] Follows coding-standards.md rules
- [ ] API integration per api-integration.md
- [ ] State management per state-management.md
- [ ] Navigation per navigation.md
- [ ] Touch-friendly (44x44 min targets)
- [ ] Proper loading states
- [ ] Error handling
- [ ] Empty states
