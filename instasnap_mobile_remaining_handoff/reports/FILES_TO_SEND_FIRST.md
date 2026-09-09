# Files to Send First — Conversion Batches

## Batch Order Overview

| Batch | Feature | Files | Dependencies |
|---|---|---|---|
| 1 | Service Layer Foundation | adminService, creatorService, monetizationService | None (beyond api.ts) |
| 2 | Admin Dashboard | app/admin/index.tsx | Batch 1 |
| 3 | Creator Studio | app/creator/index.tsx | Batch 1 |
| 4 | Monetization Dashboard | app/creator/monetization.tsx | Batch 1 |
| 5 | Live Route Wrappers + Landing | app/app/live/new.tsx, app/app/live/[id].tsx, LandingPage | Components exist |

---

## BATCH 1 — Service Layer (Do This First!)

**Feature domain:** API Service Functions  
**Must be done BEFORE any screens**

### Files to provide to conversion AI:

**Source (web):**
1. `files/client/src/services/adminService.js` — 8 functions
2. `files/client/src/services/creatorService.js` — 7 functions  
3. `files/client/src/services/monetizationService.js` — 7 functions

**Existing mobile stubs (to replace):**
1. `files/mobile/src/services/adminService.ts` (empty export)
2. `files/mobile/src/services/creatorService.ts` (empty export)
3. `files/mobile/src/services/monetizationService.ts` (empty export)

**Reference (for pattern):**
- `files/mobile/src/services/api.ts` — the axios instance to import

### Destination paths in mobile repo:
- `mobile/src/services/adminService.ts`
- `mobile/src/services/creatorService.ts`
- `mobile/src/services/monetizationService.ts`

### Required packages: None additional (axios already installed)

### Special instructions:
- `adminService.ts`: Simple 1:1 port. Each function calls `api.get/put/post`.
- `creatorService.ts`: Replace `window.open(...)` in `downloadAnalyticsReport` with:
  ```ts
  import * as Linking from 'expo-linking';
  export const downloadAnalyticsReport = async () => {
    const url = `${process.env.EXPO_PUBLIC_API_URL}/api/creator/export`;
    await Linking.openURL(url);
  };
  ```
- `monetizationService.ts`: Simple 1:1 port.
- All functions should return the full axios response or `.data` — match the pattern used in `liveService.ts`

### Expected behavior after Batch 1:
- `adminService`, `creatorService`, `monetizationService` can be imported without errors
- TypeScript types inferred correctly
- Functions make correct HTTP requests to the backend

---

## BATCH 2 — Admin Dashboard

**Feature domain:** Admin Control Panel  
**Depends on:** Batch 1

### Files to provide to conversion AI:

**Source (web):**
- `files/client/src/pages/admin/AdminDashboardPage.jsx` (477 lines)

**Existing mobile stub:**
- `files/mobile/src/pages/admin/AdminDashboardPage.tsx` (returns null)
- `files/mobile/app/admin/` (empty directory — needs _layout.tsx or index.tsx)

**Reference files:**
- `files/mobile/src/services/adminService.ts` (from Batch 1)
- `files/mobile/src/store/authSlice.ts` (for role check)
- `files/mobile/app/_layout.tsx` (pattern for providers)
- `files/mobile/app/index.tsx` (pattern for auth guard)

### Destination paths:
- `mobile/app/admin/index.tsx` — main screen
- (Optional) `mobile/app/admin/_layout.tsx` — if admin needs its own layout

### Expo Router route:
- Route: `/admin`
- Guard: check `user.role === 'admin'` — redirect to `/app` if not admin

### Required packages: None additional

### Key Web → RN conversions:
- `<table>` → `<FlatList>` with header and row components
- `<select>` → custom modal picker OR inline `<View>` with `TouchableOpacity` options
- `window.confirm()` → `Alert.alert`
- `alert()` → `Alert.alert`
- Tab navigation → horizontal `<ScrollView>` with `TouchableOpacity` tab buttons (same pattern as client)
- `<Switch>` for feature flags (already exists in RN)

### Expected behavior after Batch 2:
- `/admin` route accessible to admin users
- Overview metrics load from API
- User management table loads, ban/unban/verify/role-change work
- Moderation queue loads and resolve actions work
- Broadcast notification sends
- Audit logs table displays
- Feature flags toggle + maintenance mode toggle work

---

## BATCH 3 — Creator Studio

**Feature domain:** Creator Analytics & Content Management  
**Depends on:** Batch 1

### Files to provide to conversion AI:

**Source (web):**
- `files/client/src/pages/creator/CreatorStudioPage.jsx` (525 lines)

**Existing mobile stub:**
- `files/mobile/src/pages/creator/CreatorStudioPage.tsx` (returns null)

**Reference files:**
- `files/mobile/src/services/creatorService.ts` (from Batch 1)

### Destination paths:
- `mobile/app/creator/index.tsx`

### Expo Router route:
- Route: `/creator` (mapped from web `/app/creator`)

### Key Web → RN conversions:
- Bar chart (div percentage heights) → `View` components with calculated pixel heights using `useWindowDimensions`
- Progress bars (audience analytics) → `View` with percentage `width`
- Content grid → `FlatList` with `numColumns={2}`
- `window.confirm()` → `Alert.alert`
- `downloadAnalyticsReport` → `expo-linking` (already handled in Batch 1)
- `<select>` timeframe selector → row of `TouchableOpacity` buttons (like segment control)
- `<select>` content type filter → same button row approach
- Bulk select checkboxes → `TouchableOpacity` items with check state

### Expected behavior after Batch 3:
- Creator Studio accessible from navigation
- Dashboard/overview tab shows stats and impressions chart
- Content insights tab shows content grid with type filter
- Audience analytics tab shows demographics data
- Drafts & Scheduled tab shows content list with bulk select
- CSV export opens browser (expo-linking)

---

## BATCH 4 — Monetization Dashboard

**Feature domain:** Creator Monetization  
**Depends on:** Batch 1

### Files to provide to conversion AI:

**Source (web):**
- `files/client/src/pages/creator/MonetizationDashboardPage.jsx` (603 lines)

**Existing mobile stub:**
- `files/mobile/src/pages/creator/MonetizationDashboardPage.tsx` (returns null)

**Reference files:**
- `files/mobile/src/services/monetizationService.ts` (from Batch 1)

### Destination paths:
- `mobile/app/creator/monetization.tsx`

### Expo Router route:
- Route: `/creator/monetization` (mapped from web `/app/monetization`)

### Key Web → RN conversions:
- Fixed overlay modal → `<Modal visible animationType="slide">` 
- `<form>` payout request → controlled inputs + handler
- `type="password"` → `<TextInput secureTextEntry>`
- `type="number"` → `<TextInput keyboardType="numeric">`
- `<select>` → custom picker
- Revenue breakdown list → `FlatList` or mapped `View`
- Monthly bar chart → same RN height calculation approach as Batch 3
- `alert()` / `window.confirm()` → `Alert.alert`

### Expected behavior after Batch 4:
- Monetization page accessible from navigation
- Earnings overview tab shows balance, breakdown, monthly chart
- Subscriptions tab shows 3 tiers
- Tips & Badges tab shows recent transactions
- Affiliate links tab shows list + add form
- Payouts tab shows history + tax info form
- Request Payout modal opens and submits

---

## BATCH 5 — Live Route Wrappers + Optional Landing

**Feature domain:** Live Streaming Routes + (optional) Landing/Onboarding  
**Depends on:** Nothing (components already exist)

### Files to provide to conversion AI:

**Source (existing mobile components — no web source needed):**
- `mobile/src/components/live/LiveHostView.tsx` ✅ EXISTS
- `mobile/src/components/live/LiveViewerView.tsx` ✅ EXISTS

**For landing page (web source):**
- `files/client/src/pages/public/LandingPage.jsx` (253 lines)

### Destination paths:
- `mobile/app/app/live/new.tsx` — thin wrapper for LiveHostView
- `mobile/app/app/live/[id].tsx` — thin wrapper for LiveViewerView  
- `mobile/app/index.tsx` — optionally add landing screen logic (or keep existing redirect)

### Expo Router routes:
- `/app/live/new` → LiveHostView
- `/app/live/:id` → LiveViewerView

### Special notes for live routes:
```tsx
// app/app/live/new.tsx
export { LiveHostView as default } from '../../../src/components/live/LiveHostView';

// app/app/live/[id].tsx  
import { useLocalSearchParams } from 'expo-router';
import { LiveViewerView } from '../../../src/components/live/LiveViewerView';
export default function LiveViewerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <LiveViewerView streamId={id} />;
}
```

### Landing Page notes:
- Replace `framer-motion` with `react-native` `Animated` API
- Replace CSS gradient background with `expo-linear-gradient`
- Replace `<Link>` with `router.push()` from `expo-router`
- Replace FAQ accordion `motion.div` with controlled `Animated.View` height

### Required packages:
- `expo-linear-gradient` ✅ ALREADY IN package.json
- `react-native-webrtc` ✅ ALREADY IN package.json (needs dev build)

### Expected behavior after Batch 5:
- `/app/live/new` route starts camera + WebRTC broadcast (dev build only)
- `/app/live/:id` route shows live viewer with chat + likes (dev build only)
- Landing/onboarding screen shows with animated hero, features, and CTAs

---

## Summary: Total Work Remaining

| Item | Batch | Priority | Complexity |
|---|---|---|---|
| `adminService.ts` | 1 | HIGH | LOW |
| `creatorService.ts` | 1 | HIGH | LOW |
| `monetizationService.ts` | 1 | HIGH | LOW |
| `app/admin/index.tsx` | 2 | HIGH | MEDIUM |
| `app/creator/index.tsx` | 3 | HIGH | MEDIUM |
| `app/creator/monetization.tsx` | 4 | HIGH | MEDIUM |
| `app/app/live/new.tsx` | 5 | MEDIUM | LOW (wrapper only) |
| `app/app/live/[id].tsx` | 5 | MEDIUM | LOW (wrapper only) |
| LandingPage (optional) | 5 | LOW | MEDIUM |
| `src/pages/` stubs (27 files) | N/A | LOW | VERY LOW (cleanup only) |

**Total: 8 meaningful files to convert (+ 27 stub cleanups)**
