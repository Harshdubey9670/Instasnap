# Platform Limitations

## 1. Expo SDK Version Mismatch

**Current mobile package.json:** `expo: ~50.0.0` (SDK 50)  
**Spec requirement:** Expo SDK 57

This is a **significant discrepancy**. The spec asks for SDK 57, but the installed codebase is on SDK 50.

**Impact on remaining work:**
- All converted files should target SDK 50 APIs to be compatible with the current codebase
- Upgrading to SDK 57 would require updating all expo-* package versions
- `expo-router` `~3.4.10` (SDK 50) vs `expo-router` v5 (SDK 57) has **breaking API changes**
- **Do NOT upgrade** packages during conversion — flag this for human decision

**Recommendation:** Convert remaining files for SDK 50. Document SDK upgrade as a separate task.

---

## 2. react-native-webrtc Requires Development Build

**Feature:** Live Streaming (LiveHostView, LiveViewerView)  
**Package:** `react-native-webrtc` ^124.0.8 is in package.json ✅

`react-native-webrtc` uses native modules that are **not included in Expo Go**. Testing live streaming requires:
1. Running `expo run:ios` or `expo run:android` with a development build
2. OR building a custom development client using `eas build --profile development`

**Impact:** The route wrappers `app/app/live/new.tsx` and `app/app/live/[id].tsx` can be created, but they will crash in Expo Go. This is expected behavior.

**Mitigation:** Add a platform check or a development-only warning when `__DEV__` is true.

---

## 3. framer-motion Is Not Available in React Native

**Affected file:** `client/src/pages/public/LandingPage.jsx`

The LandingPage uses `framer-motion` extensively:
- `motion.div` with spring animations
- `whileInView` viewport detection
- `animate` with scale/opacity keyframes

**React Native alternatives:**
- `react-native` `Animated` API (basic)
- `react-native-reanimated` (advanced, similar to framer-motion)
- `moti` (wrapper around reanimated, framer-motion-like API)

**Current mobile package.json** does NOT include `react-native-reanimated` or `moti`.

**Recommendation:** Build the LandingPage with `Animated.Value` from `react-native` core (no extra package needed) or skip the page entirely (redirect to auth on launch).

---

## 4. HTML Tables → FlatList

**Affected screens:** AdminDashboardPage (User Management, Audit Logs)

Web uses `<table>`, `<thead>`, `<tr>`, `<td>` which do not exist in React Native.

**Mobile equivalent:** Use `<FlatList>` with custom row components + `<ScrollView horizontal>` for wide tables.

---

## 5. window.open() → expo-linking

**Affected service:** `client/src/services/creatorService.js` → `downloadAnalyticsReport`

```js
// Web
window.open('http://localhost:5000/api/creator/export', '_blank');

// Mobile replacement
import * as Linking from 'expo-linking';
await Linking.openURL(`${process.env.EXPO_PUBLIC_API_URL}/api/creator/export`);
```

`expo-linking` is already in `package.json` ✅

---

## 6. select / option → Picker or Custom Modal

**Affected screens:** AdminDashboardPage (role selector, feature flag toggles), MonetizationDashboardPage (payout method, tax ID type), CreatorStudioPage (timeframe selector)

`<select>` does not exist in React Native. Options:
- `@react-native-picker/picker` — native picker (not in current package.json, would need install)
- Custom modal with `TouchableOpacity` list items
- `react-native-dropdown-picker` (third party)

**Recommendation:** Use custom modal pattern consistent with existing mobile UI (see how other components handle selection in existing migrated screens).

---

## 7. Progress Bars with Percentage Widths

**Affected screen:** CreatorStudioPage (audience analytics), MonetizationDashboardPage (revenue breakdown)

Web uses: `style={{ width: '75%' }}` on `div` elements for progress bars.

In React Native, percentage widths work in `View` but **only relative to parent**. Ensure the parent has a defined width (use `flex: 1` or measure with `onLayout`).

**Pattern:**
```tsx
<View style={{ flex: 1, height: 10, backgroundColor: '#1e293b', borderRadius: 9999 }}>
  <View style={{ width: `${percentage}%`, height: '100%', backgroundColor: '#a855f7', borderRadius: 9999 }} />
</View>
```

---

## 8. Bar Charts

**Affected screens:** CreatorStudioPage (impressions chart, active hours), MonetizationDashboardPage (monthly revenue chart)

Web uses `div` elements with percentage heights as a visual bar chart.

Same approach works in React Native using `View` with `height` values derived from data normalization. No charting library required — just use `flexbox` with `alignItems: 'flex-end'`.

---

## 9. i18n Packages Not Installed

**Current mobile package.json** does NOT include:
- `i18next`
- `react-i18next`
- `i18next-browser-languagedetector` (not applicable for RN anyway)

The `mobile/src/i18n.ts` file exists but i18n packages are not installed.

**Impact:** If any converted screen uses `useTranslation()` from `react-i18next`, it will fail at runtime.

**Recommendation:** For the remaining screens (Admin, Creator, Monetization, Landing), use hardcoded strings (no i18n) matching the web source. The i18n integration can be added as a separate task.

---

## 10. Google OAuth (expo-auth-session)

`expo-auth-session: ~5.4.0` is in package.json ✅  
`expo-web-browser: ~12.8.2` is in package.json ✅

The signup screen already uses Google OAuth. The admin/creator/monetization screens do NOT use Google OAuth, so this is not a blocker for the remaining work.

---

## 11. Missing Packages Required for Full Spec

These packages are mentioned in the spec but are NOT in `mobile/package.json`:

| Package | Purpose | Status |
|---|---|---|
| `@tanstack/react-query` | Data fetching + caching | ❌ Not installed — use useState/useEffect (current pattern) |
| `zustand` | State management | ❌ Not installed — use Redux (current pattern) |
| `nativewind` | CSS-in-JS for RN | ❌ Not installed — use StyleSheet (current pattern) |
| `react-native-reanimated` | Advanced animations | ❌ Not installed — use Animated API |
| `@react-native-picker/picker` | Native picker/select | ❌ Not installed — use custom modal |

**Action:** Do NOT install these. The existing codebase uses Redux + StyleSheet. Continue with the same pattern for consistency.
