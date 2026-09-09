# Remaining Features — Detailed Gap Analysis

## 1. AdminDashboardPage — NOT_MIGRATED

**Web source:** `client/src/pages/admin/AdminDashboardPage.jsx` (477 lines)  
**Mobile stub:** `mobile/src/pages/admin/AdminDashboardPage.tsx` (returns null)  
**Missing Expo Route:** `app/admin/index.tsx`  
**Missing service:** `mobile/src/services/adminService.ts` (empty export `{}`)

### Sub-features and their gaps:

#### Tab 1: Analytics Overview
- Displays 4 metric cards: Total Users, Total Posts, Pending Reports, Platform Revenue
- **API:** `GET /api/admin/metrics`
- **Missing:** entire screen, adminService.getDashboardMetrics()

#### Tab 2: User Management
- Searchable table of all users
- Actions: Ban/Unban, Verify/Unverify, Role change (user/admin)
- **API:** `GET /api/admin/users?search=`, `PUT /api/admin/users/:id`
- **Missing:** adminService.getUsersList(), adminService.updateUserStatus()
- **RN Note:** `<table>` → use `FlatList` with custom row components, `<select>` → `Picker` or modal

#### Tab 3: Moderation Queue
- Lists flagged reports with reporter info
- Actions: Dismiss Report, Remove Content
- **API:** `GET /api/admin/reports`, `PUT /api/admin/reports/:id`
- **Missing:** adminService.getModerationQueue(), adminService.resolveReport()

#### Tab 4: Broadcast Notification
- Form: title + message body
- Sends platform-wide notification to all users
- **API:** `POST /api/admin/broadcast-notification`
- **Missing:** adminService.broadcastNotification()
- **RN Note:** `<form>` → `<TextInput>` + `<TouchableOpacity>`

#### Tab 5: Audit Logs
- Table showing admin actions with timestamp, admin user, action type, target, details
- **API:** `GET /api/admin/audit-logs`
- **Missing:** adminService.getAuditLogs()
- **RN Note:** `<table>` → `FlatList`

#### Tab 6: Feature Flags & System Config
- Toggle feature flags on/off
- Toggle maintenance mode
- **API:** `GET /api/admin/system-config`, `PUT /api/admin/system-config`
- **Missing:** adminService.getSystemConfig(), adminService.updateSystemConfig()
- **RN Note:** `<ToggleLeft>/<ToggleRight>` → `Switch` component

### Missing States:
- Loading state (shows spinner per tab)
- Error state (no retry UI in web — add for mobile)
- RBAC: Only admin-role users should see this route — use existing ProtectedRoute concept with adminOnly check

---

## 2. CreatorStudioPage — NOT_MIGRATED

**Web source:** `client/src/pages/creator/CreatorStudioPage.jsx` (525 lines)  
**Mobile stub:** `mobile/src/pages/creator/CreatorStudioPage.tsx` (returns null)  
**Missing Expo Route:** `app/creator/index.tsx`  
**Missing service:** `mobile/src/services/creatorService.ts` (empty export `{}`)

### Sub-features and their gaps:

#### Tab 1: Dashboard / Overview
- Summary cards: Estimated Reach, Impressions, Watch Time (hours), Profile Visits
- Bar chart: daily impressions over last 14 days (currently HTML div bars — use `react-native-svg` or similar)
- Timeframe selector: 7d / 30d / 90d / 1y
- **API:** `GET /api/creator/overview?timeframe=30d`, `GET /api/creator/insights?timeframe=30d`

#### Tab 2: Content Insights
- Filter: all / posts / reels / stories
- Grid of content items with: media thumbnail, caption, likes, comments, saves, impressions
- **API:** `GET /api/creator/content?type=all`

#### Tab 3: Audience Analytics
- Gender breakdown (progress bars)
- Age distribution (progress bars)
- Top locations (progress bars)
- Peak active hours (bar chart)
- **API:** `GET /api/creator/audience`

#### Tab 4: Drafts & Scheduled
- List of drafts with media thumbnail + caption + updated date
- List of scheduled posts with release date
- Bulk select + Archive/Delete actions
- **API:** `GET /api/creator/content-manager`, `POST /api/creator/bulk-action`

#### Export CSV button:
- Web: `window.open('/api/creator/export', '_blank')`
- **Mobile:** use `expo-linking` to open URL OR `expo-file-system` + `expo-sharing`

### Missing States:
- Loading skeleton (4 placeholder cards)
- Empty states for empty drafts/scheduled lists
- Confirmation dialog before bulk delete (`Alert.alert` instead of `window.confirm`)

---

## 3. MonetizationDashboardPage — NOT_MIGRATED

**Web source:** `client/src/pages/creator/MonetizationDashboardPage.jsx` (603 lines)  
**Mobile stub:** `mobile/src/pages/creator/MonetizationDashboardPage.tsx` (returns null)  
**Missing Expo Route:** `app/creator/monetization.tsx`  
**Missing service:** `mobile/src/services/monetizationService.ts` (empty export `{}`)

### Sub-features and their gaps:

#### Tab 1: Earnings Overview
- 3 highlight cards: Available Balance, Total Gross Earnings, Paid Out To Date
- Revenue sources breakdown (subscriptions, tips, badges, sponsorships, ads, affiliates)
- Monthly revenue bar chart (last N months)
- **API:** `GET /api/monetization/earnings`

#### Tab 2: Subscriptions & Tiers
- Static display of 3 subscription tiers (Fan $4.99, Superfan $9.99, VIP Patron $24.99)
- Edit Tier buttons (no backend action currently — UI only)

#### Tab 3: Tips & Badges
- List of recent tips with user/message/amount
- List of supporter badges sold (static data in web)

#### Tab 4: Affiliate & Sponsorships
- Add affiliate link form (title + URL)
- List of active affiliate links with click count and earnings
- **API:** `GET /api/monetization/affiliates`, `POST /api/monetization/affiliates`

#### Tab 5: Payouts & Tax Info
- Payout history list with status badges
- Tax information form (W-9/W-8BEN)
- **API:** `GET /api/monetization/payouts`, `GET /api/monetization/tax-info`, `PUT /api/monetization/tax-info`

#### Request Payout Modal:
- Amount input (min $10), payment method selector (bank/PayPal/Stripe)
- **API:** `POST /api/monetization/request-payout`
- **RN Note:** Use `Modal` component instead of fixed overlay

### Missing States:
- Loading skeleton
- `alert()` → `Alert.alert()`

---

## 4. LandingPage — NOT_MIGRATED (May be skipped for mobile)

**Web source:** `client/src/pages/public/LandingPage.jsx` (253 lines)  
**Mobile stub:** `mobile/src/pages/public/LandingPage.tsx` (returns null)  
**No Expo Route assigned**

### Assessment:
The LandingPage is a **marketing/onboarding page** using `framer-motion`, web-CSS gradients, and `<Link>` from `react-router-dom`. It has:
- Animated hero section with Sparkles icon
- Feature cards (AI, Chat, Vault, Creator Tools)
- Testimonial cards with user avatars
- FAQ accordion with framer-motion animations

**Recommendation:** Either:
- **Option A (Skip):** Keep `app/index.tsx` redirecting to `/auth/login` directly (current behavior). No landing page needed for a mobile app.
- **Option B (Simplified):** Create a simple React Native onboarding screen with `ScrollView`, gradient background, feature list, and CTA buttons using `expo-linear-gradient`.

The conversion AI should implement Option B if a landing/onboarding experience is required.

---

## 5. Missing Expo Router Routes — Live Streaming

**Components exist** in `mobile/src/components/live/` (fully migrated):
- `LiveHostView.tsx` — WebRTC camera broadcast
- `LiveViewerView.tsx` — WebRTC viewer
- `LiveChat.tsx` — live chat messages
- `LiveLikes.tsx` — floating heart animations

**Missing Expo Router files:**
- `app/app/live/new.tsx` — should render `<LiveHostView />`
- `app/app/live/[id].tsx` — should render `<LiveViewerView />`

**Critical:** These require `react-native-webrtc` which requires an **Expo Development Build**, not Expo Go.

---

## 6. src/pages/ Stubs — PLACEHOLDER_OR_STATIC

All 27 files in `mobile/src/pages/` are stubs that return `null`. The real implementations are in `mobile/app/` screens. These stubs need to either:
- Re-export from the corresponding `app/` screen component
- Be populated with the actual implementation

The `notification.tsx` stub already shows the correct pattern:
```ts
export { default } from "../../src/pages/user/NotificationsPage";
```

But `NotificationsPage.tsx` in `src/pages/` is also a stub (`return null`). The actual implementation is in `app/app/notifications.tsx`.

**Resolution:** The `src/pages/` directory should either be removed (since Expo Router doesn't use it for routing) OR each stub should re-export from `app/app/` screens. This is a code organization issue, not a feature gap.
