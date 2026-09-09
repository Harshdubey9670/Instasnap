# Dependency Requirements — Per Remaining File

## 1. adminService.ts

**File to create:** `mobile/src/services/adminService.ts`  
**Replace:** current empty stub at same path

**Dependencies needed:**
- `mobile/src/services/api.ts` — axios instance ✅ EXISTS
- TypeScript types for `User`, `Report`, `AuditLog`, `SystemConfig` (define inline or in `src/types/`)

**Pattern to follow:** Look at `mobile/src/services/liveService.ts` for the established pattern

**Functions to implement:**
```typescript
export const getDashboardMetrics = () => api.get('/api/admin/metrics');
export const getUsersList = (params?: { search?: string }) => api.get('/api/admin/users', { params });
export const updateUserStatus = (userId: string, payload: { isBanned?: boolean; isVerified?: boolean; role?: string }) => api.put(`/api/admin/users/${userId}`, payload);
export const getModerationQueue = () => api.get('/api/admin/reports');
export const resolveReport = (reportId: string, payload: { actionTaken: string; removeContent: boolean }) => api.put(`/api/admin/reports/${reportId}`, payload);
export const getAuditLogs = () => api.get('/api/admin/audit-logs');
export const broadcastNotification = (payload: { title: string; message: string }) => api.post('/api/admin/broadcast-notification', payload);
export const getSystemConfig = () => api.get('/api/admin/system-config');
export const updateSystemConfig = (payload: Record<string, any>) => api.put('/api/admin/system-config', payload);
```

---

## 2. creatorService.ts

**File to create:** `mobile/src/services/creatorService.ts`  
**Replace:** current empty stub at same path

**Dependencies needed:**
- `mobile/src/services/api.ts` ✅ EXISTS
- `expo-linking` (for downloadAnalyticsReport — replaces window.open)

**Critical API mismatch:** The web `downloadAnalyticsReport` uses `window.open('http://localhost:5000/api/creator/export', '_blank')`.
Mobile replacement:
```typescript
import * as Linking from 'expo-linking';
export const downloadAnalyticsReport = async () => {
  const url = `${process.env.EXPO_PUBLIC_API_URL}/api/creator/export`;
  await Linking.openURL(url);
};
```

**Functions to implement:**
```typescript
export const getOverviewStats = (timeframe = '30d') => api.get(`/api/creator/overview?timeframe=${timeframe}`);
export const getInsights = (timeframe = '30d') => api.get(`/api/creator/insights?timeframe=${timeframe}`);
export const getAudienceAnalytics = () => api.get('/api/creator/audience');
export const getContentPerformance = (type = 'all') => api.get(`/api/creator/content?type=${type}`);
export const getDraftsAndScheduled = () => api.get('/api/creator/content-manager');
export const bulkContentAction = (payload: { action: string; ids: string[]; contentType: string }) => api.post('/api/creator/bulk-action', payload);
```

---

## 3. monetizationService.ts

**File to create:** `mobile/src/services/monetizationService.ts`  
**Replace:** current empty stub at same path

**Dependencies needed:**
- `mobile/src/services/api.ts` ✅ EXISTS

**Functions to implement:**
```typescript
export const getEarningsOverview = () => api.get('/api/monetization/earnings');
export const getAffiliateLinks = () => api.get('/api/monetization/affiliates');
export const addAffiliateLink = (title: string, url: string) => api.post('/api/monetization/affiliates', { title, url });
export const getPayoutHistory = () => api.get('/api/monetization/payouts');
export const requestPayout = (amount: number, paymentMethod: string) => api.post('/api/monetization/request-payout', { amount, paymentMethod });
export const getTaxInfo = () => api.get('/api/monetization/tax-info');
export const updateTaxInfo = (payload: { legalName: string; taxIdType: string; taxId: string }) => api.put('/api/monetization/tax-info', payload);
```

---

## 4. app/admin/index.tsx (AdminDashboardPage)

**File to create:** `mobile/app/admin/index.tsx`

**Dependencies:**
- `mobile/src/services/adminService.ts` ← must be implemented first
- `react-native` core (View, Text, ScrollView, TextInput, TouchableOpacity, FlatList, Switch, Modal, Alert, ActivityIndicator)
- `lucide-react-native` (icons: Users, ShieldAlert, BarChart3, FileText, Bell, Sliders)
- `mobile/src/store/store.ts` (for useSelector to check admin role)
- `mobile/src/contexts/ThemeContext.tsx` (for theme colors)

**Web → RN replacements needed:**
| Web | React Native |
|---|---|
| `<table>`, `<tr>`, `<td>` | `<FlatList>` with custom row component |
| `<select>` | `<Picker>` from `@react-native-picker/picker` or modal |
| `<input>` | `<TextInput>` |
| `<textarea>` | `<TextInput multiline>` |
| `<form onSubmit>` | `<TouchableOpacity onPress>` |
| `window.confirm()` | `Alert.alert('', '', [{ text: 'Cancel' }, { text: 'OK', onPress }])` |
| `alert()` | `Alert.alert('Title', 'Message')` |
| `<ToggleLeft>/<ToggleRight>` | `<Switch>` |
| CSS grid/flex | StyleSheet flexbox |
| `overflow-x: auto` | `<ScrollView horizontal>` |

**Route guard:** Check `user?.role === 'admin'` at screen mount — redirect to `/app` if not admin.

---

## 5. app/creator/index.tsx (CreatorStudioPage)

**File to create:** `mobile/app/creator/index.tsx`

**Dependencies:**
- `mobile/src/services/creatorService.ts` ← must be implemented first
- `react-native` core
- `lucide-react-native` (BarChart3, Eye, TrendingUp, Users, Clock, Download, etc.)
- `expo-linking` (for CSV export)

**Web → RN replacements needed:**
| Web | React Native |
|---|---|
| HTML div bar charts | `react-native-svg` Bar charts OR simple `View` progress-bar style |
| `<select>` for timeframe | `<Picker>` or segment buttons |
| Image content grid | `FlatList` with 2-column layout |
| `window.confirm()` | `Alert.alert` |
| Progress bars (`style={{ width: X% }}`) | `View` with flex + explicit width calculation |

**Note:** The web uses inline height-percentage CSS for bar charts. In RN, calculate actual pixel heights based on parent container height using `onLayout`.

---

## 6. app/creator/monetization.tsx (MonetizationDashboardPage)

**File to create:** `mobile/app/creator/monetization.tsx`

**Dependencies:**
- `mobile/src/services/monetizationService.ts` ← must be implemented first
- `react-native` core
- `lucide-react-native` (DollarSign, CreditCard, Award, Gift, etc.)
- `Modal` component for payout request modal

**Web → RN replacements needed:**
| Web | React Native |
|---|---|
| Fixed overlay div | `<Modal visible animationType="slide">` |
| `<form onSubmit>` | TouchableOpacity + handlers |
| `<select>` payout method | `<Picker>` or option buttons |
| `type="password"` input | `<TextInput secureTextEntry>` |
| `type="number"` input | `<TextInput keyboardType="numeric">` |
| `window.confirm` | `Alert.alert` |
| `alert()` | `Alert.alert` |

---

## 7. app/app/live/new.tsx (LiveHostView route wrapper)

**File to create:** `mobile/app/app/live/new.tsx`

**Content (thin wrapper only):**
```tsx
export { LiveHostView as default } from '../../../src/components/live/LiveHostView';
```
Or wrap with a Screen component if navigation headers are needed.

**Dependencies:**
- `mobile/src/components/live/LiveHostView.tsx` ✅ EXISTS
- `react-native-webrtc` ✅ IN package.json
- **Requires Expo Development Build** — will NOT work in Expo Go

---

## 8. app/app/live/[id].tsx (LiveViewerView route wrapper)

**File to create:** `mobile/app/app/live/[id].tsx`

**Content (thin wrapper only):**
```tsx
import { useLocalSearchParams } from 'expo-router';
import { LiveViewerView } from '../../../src/components/live/LiveViewerView';
export default function LiveViewerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <LiveViewerView streamId={id} />;
}
```

**Dependencies:**
- `mobile/src/components/live/LiveViewerView.tsx` ✅ EXISTS
- `react-native-webrtc` ✅ IN package.json
- **Requires Expo Development Build**
