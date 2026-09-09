# InstaSnap Mobile — Remaining Migration Handoff

**Audit Date:** 2026-09-06  
**Auditor:** Antigravity (Claude Sonnet 4.6 Thinking)  
**Repository Root:** `snapgram-ai/`  
**Handoff Path:** `instasnap_mobile_remaining_handoff/`

---

## Purpose

This folder contains everything a conversion AI needs to finish migrating the remaining web (`client/`) features into the React Native Expo app (`mobile/`).

**The `components/` folder in `mobile/src/components/` is fully migrated and excluded from this handoff.**

---

## What Is Already Done (Do NOT re-migrate)

| Area | Status |
|---|---|
| `src/components/**` (all 75+ files) | ✅ FULLY_MIGRATED |
| `src/contexts/ThemeContext.tsx` | ✅ FULLY_MIGRATED |
| `src/contexts/SocketContext.tsx` | ✅ FULLY_MIGRATED |
| `src/store/authSlice.ts` | ✅ FULLY_MIGRATED |
| `src/store/store.ts` | ✅ FULLY_MIGRATED |
| `src/utils/analytics.ts` | ✅ FULLY_MIGRATED |
| `src/utils/cache.ts` | ✅ FULLY_MIGRATED |
| `src/utils/cdn.ts` | ✅ FULLY_MIGRATED |
| `src/utils/cn.ts` | ✅ FULLY_MIGRATED |
| `src/utils/renderCaption.tsx` | ✅ FULLY_MIGRATED |
| `src/utils/authStorage.ts` | ✅ FULLY_MIGRATED |
| `src/services/api.ts` | ✅ FULLY_MIGRATED |
| `src/services/aiService.ts` | ✅ FULLY_MIGRATED |
| `src/services/FilterEngine.ts` | ✅ FULLY_MIGRATED |
| `src/services/ArLensFramework.ts` | ✅ FULLY_MIGRATED |
| `src/services/liveService.ts` | ✅ FULLY_MIGRATED |
| `src/services/vaultService.ts` | ✅ FULLY_MIGRATED |
| `src/hooks/useNetworkStatus.ts` | ✅ FULLY_MIGRATED |
| `src/hooks/useEdgeSwipe.ts` | ✅ FULLY_MIGRATED |
| `src/layouts/**` (4 files) | ✅ FULLY_MIGRATED (as Expo layout wrappers) |
| `src/i18n.ts` | ✅ FULLY_MIGRATED |
| `app/_layout.tsx` | ✅ FULLY_MIGRATED |
| `app/index.tsx` | ✅ FULLY_MIGRATED |
| `app/auth/**` (6 screens) | ✅ FULLY_MIGRATED |
| `app/app/index.tsx` (Feed) | ✅ FULLY_MIGRATED |
| `app/app/camera.tsx` | ✅ FULLY_MIGRATED |
| `app/app/chat.tsx` | ✅ FULLY_MIGRATED |
| `app/app/chat/[id].tsx` | ✅ FULLY_MIGRATED |
| `app/app/create-reel.tsx` | ✅ FULLY_MIGRATED |
| `app/app/create-story.tsx` | ✅ FULLY_MIGRATED |
| `app/app/explore.tsx` | ✅ FULLY_MIGRATED |
| `app/app/followers.tsx` | ✅ FULLY_MIGRATED |
| `app/app/following.tsx` | ✅ FULLY_MIGRATED |
| `app/app/hashtag/[tag].tsx` | ✅ FULLY_MIGRATED |
| `app/app/network.tsx` | ✅ FULLY_MIGRATED |
| `app/app/notifications.tsx` | ✅ FULLY_MIGRATED |
| `app/app/post-detail.tsx` | ✅ FULLY_MIGRATED |
| `app/app/post/[id].tsx` | ✅ FULLY_MIGRATED |
| `app/app/profile/[id].tsx` | ✅ FULLY_MIGRATED |
| `app/app/reels.tsx` | ✅ FULLY_MIGRATED |
| `app/app/reels/create.tsx` | ✅ FULLY_MIGRATED |
| `app/app/search-results.tsx` | ✅ FULLY_MIGRATED |
| `app/app/settings.tsx` | ✅ FULLY_MIGRATED |
| `app/app/stories.tsx` | ✅ FULLY_MIGRATED |
| `app/app/trending-hashtag.tsx` | ✅ FULLY_MIGRATED |
| `app/app/username-lookup.tsx` | ✅ FULLY_MIGRATED |
| `app/app/vault.tsx` | ✅ FULLY_MIGRATED |
| `app/app/ai-studio.tsx` | ✅ FULLY_MIGRATED |

---

## Folder Structure

```
instasnap_mobile_remaining_handoff/
├── README.md                        ← You are here
├── reports/
│   ├── MIGRATION_SUMMARY.md         ← Status counts and overview
│   ├── COMPLETE_FILE_MAP.csv        ← Every file, every status
│   ├── REMAINING_FEATURES.md        ← Detailed feature gaps
│   ├── ROUTE_MAP.md                 ← Web routes → Expo routes mapping
│   ├── API_SOCKET_CONTRACTS.md      ← API endpoints + Socket.IO events
│   ├── DEPENDENCY_REQUIREMENTS.md  ← Dependency chains for each file
│   ├── PLATFORM_LIMITATIONS.md     ← Known mobile limitations
│   └── FILES_TO_SEND_FIRST.md      ← Batched conversion order
└── files/
    ├── client/                      ← Original web source files
    ├── mobile/                      ← Existing mobile stubs/context
    ├── server-contracts/            ← API route/controller/socket files
    └── assets/                      ← Required assets (if any)
```

---

## Critical Rules for the Conversion AI

1. **Do NOT redesign** — preserve identical business logic, validation, API calls
2. **Do NOT create a new backend** — use the existing `server/` as-is
3. **Do NOT invent endpoints** — use only the documented API contracts
4. **Replace web APIs** with React Native equivalents:
   - `localStorage` → `expo-secure-store` (tokens) or `AsyncStorage` (preferences)
   - `window.location` → `expo-router` navigation
   - `framer-motion` → `react-native` `Animated` or `react-native-reanimated`
   - `IntersectionObserver` → `onMomentumScrollEnd` / `FlashList` `onEndReached`
   - `<img>` → `<Image>` from `expo-image` or `react-native`
   - CSS classes → `StyleSheet.create()`
   - `alert()` / `confirm()` → `Alert.alert()`
   - `window.open()` → `expo-linking` or `expo-web-browser`
5. **Preserve all Socket.IO event names** exactly — the server uses: `getOnlineUsers`, `newMessage`, `markDelivered`, `typing`, `stopTyping`, `joinConversation`, `leaveConversation`, `conversationPresenceUpdate`, `chatScreenshot`, `chatScreenshotNotification`, `messageDelivered`, `join-live`, `leave-live`, `webrtc-offer`, `webrtc-answer`, `webrtc-ice-candidate`, `live-chat-message`, `live-like`, `viewer-joined`, `viewer-left`
6. **Use `expo-secure-store`** for auth tokens (already implemented in `authStorage.ts`)
7. **`react-native-webrtc`** requires Expo Development Build — do NOT use Expo Go for live streaming
