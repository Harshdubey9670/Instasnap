# Session Changes Report

**Scope:** Mobile app debugging, UI/branding parity with the website, business-logic and security review, chat system logging, and search performance.
**Files changed:** 23 tracked files (1,269 insertions / 961 deletions) across `mobile/`, `server/`, and `client/`.
**Verification:** 88/88 backend Jest tests passing, `tsc --noEmit` clean across the mobile app, client build/lint clean, changes confirmed live in the Android emulator against the real backend (not just statically reviewed) unless noted otherwise.

---

## 1. Critical launch-blocking crash (mobile) — fixed

**Symptom:** The app crashed on 100% of launches, in both debug and release builds. It had never successfully run on a device before this session (explains the pile of stale "parity audit" `.md` files already in the repo — they were written without ever running the app).

**Root cause:** `android/gradle.properties` had `newArchEnabled=false`, but Expo SDK 54 requires the New Architecture's native "SO-merging" scheme regardless. `MainApplication.kt` used a stale manual `SoLoader.init()` call instead of the framework-generated `ReactNativeApplicationEntryPoint.loadReactNative()` entry point, so at runtime it couldn't find `libreact_featureflagsjni.so` (no longer shipped as a separate file — merged into `libreactnative.so`).

**Follow-on issue:** Turning on New Architecture to satisfy Expo 54 then broke `@react-native-async-storage/async-storage` (`NativeModule: AsyncStorage is null` — a real TurboModule-registration gap in that dependency combination). Since the codebase has no Fabric-specific code, the fix was to keep `newArchEnabled=false` (now consistent in both `gradle.properties` and `app.json`) and fix the SoLoader initialization instead — which resolves both crashes.

**Files changed:**
- `mobile/android/app/src/main/java/com/snapgramai/mobile/MainApplication.kt` — use the generated `loadReactNative()` entry point.
- `mobile/android/gradle.properties`, `mobile/app.json` — `newArchEnabled` made consistent (`false`) in both places.

---

## 2. Branding/theme inconsistency — fixed on 7 screens

**Symptom:** Several screens never imported the app's theme system at all. They were hardcoded to a generic dark slate palette with the wrong accent color — some used a rose/red accent (`#f43f5e`) instead of the brand purple (`#a855f7`), and Chat used literal **Instagram's own blue** (`#0095f6`) as a copy-paste leftover. These screens also ignored the light/dark toggle entirely.

Each fix was verified against the actual web source before applying — in two cases (Monetization's green, Admin's rose) the "wrong-looking" color was confirmed **intentional** on web too and left untouched; only the underlying non-theme-aware surface/text colors were fixed there.

**Files changed** (all converted to theme-aware `createStyles(colors, isDark)` factories, verified colors against `client/src` equivalents):
- `mobile/src/pages/user/ExplorePage.tsx`
- `mobile/src/pages/user/ChatPage.tsx`
- `mobile/src/pages/user/VaultPage.tsx`
- `mobile/src/pages/user/PostDetailPage.tsx`
- `mobile/src/pages/creator/CreatorStudioPage.tsx`
- `mobile/src/pages/creator/MonetizationDashboardPage.tsx` (kept its intentional emerald/green accent)
- `mobile/src/pages/admin/AdminDashboardPage.tsx` (kept its intentional rose accent)

**Important caveat discovered:** these `src/pages/user/*.tsx` files are **not** what the bottom navigation actually renders — see §3.

---

## 3. Major discovery: duplicate live implementations

The bottom-nav screens (Explore, Vault, Chat, Reels, Post Detail) are **not** rendered by the `src/pages/*.tsx` files fixed in §2. Those are reachable only via an orphaned `/app/discover` route. The screens users actually see are separate, self-contained implementations under `app/app/*.tsx` — 1,500 to 3,100 lines each, independently written, with their own copies of the same bugs (and some their own unique ones).

This was confirmed by installing the app, logging in with a real test account, and navigating the live bottom nav — not by inference.

---

## 4. Live web vs. mobile comparison — 3 real pixel mismatches fixed

Ran the website (Playwright + system Chrome, mobile viewport, same test login) side-by-side with the emulator and diffed screen-by-screen. Several things already matched well and were left alone (Feed layout, the "InstaSnap" navbar wordmark, the empty-state whitespace, the "every verified user shows a badge" behavior — all confirmed present identically on web, not mobile bugs). Three real, fixable mismatches found in the **live** `app/app/*.tsx` files:

1. **Explore search bar** — web uses an intentional always-dark "spotlight" input style (from a Uiverse.io CSS component) regardless of theme; mobile followed the theme (white in light mode). Fixed to match exactly, including icon/placeholder contrast.
2. **Reels action rail** — web has a working Save/Download-to-device button (fetch → permission → save to gallery, with 403 handling for creator-restricted downloads); mobile was missing it. The complete implementation already existed, unused, in the orphaned duplicate file — ported it into the live screen.
3. **Vault header** — web uses a purple→pink gradient title (`GradientText` component, already used elsewhere in the app) and a gradient "Add Memory" pill button with an icon + label; mobile had plain black text and an icon-only circle button, plus a truncated subtitle and "Synced" instead of "Cloud Synced". Fixed to match exactly.

**Files changed:**
- `mobile/app/app/explore.tsx`
- `mobile/app/app/reels/index.tsx`
- `mobile/app/app/vault.tsx`

All three verified live in the emulator post-fix (no crashes, screenshots confirm the match).

---

## 5. Business logic & security review

Ran the backend's existing Jest suite (88 tests, all passing) and did a manual audit of auth/session/vault code paths.

1. **Logout didn't actually log out** (`mobile/app/app/settings.tsx`) — tapping "Log Out" cleared Redux state and redirected to the login screen, but never removed the JWT from `SecureStore`. The stale credential stayed on the device. *(Note: the website's Settings logout has the identical gap — flagged, not fixed, since it's shared/out of the mobile scope of this session.)*
2. **Multi-account tokens stored in plaintext** (`mobile/src/utils/authStorage.ts`) — the account-switcher feature stored full JWTs in unencrypted `AsyncStorage`, while the primary session token correctly used encrypted `SecureStore`. Fixed: tokens now live in `SecureStore` per-account (`account_token_<id>`); only non-sensitive profile metadata stays in the plaintext list.
3. **Vault PIN brute-forceable** (`server/src/controllers/vaultController.js`, `server/src/routes/vaultRoutes.js`) — the "5 attempts then 30s lockout" was client-side only; nothing stopped a script from hitting `/api/vault/verify-pin` directly and trying all 10,000 combinations of a 4-digit PIN. Added a real server-side rate limit (5 attempts / 15 min, per user).

**Flagged but intentionally not changed (needs a product decision, not a silent code fix):**
- The vault PIN hash is unsalted SHA-256 — for a 4-digit PIN that's barely better than plaintext (a 10,000-entry rainbow table reverses it instantly). Rate-limiting now blocks online brute-force; anyone with direct DB access still reads PINs trivially.
- New vaults with no PIN set silently default to `1234` server-side, with no mobile UI warning about it.

---

## 6. Chat system: business logic, data-integrity bug, and logging

1. **Critical data-integrity bug fixed** (`server/src/controllers/conversationController.js`): `seedMockConversationsIfNeeded` ran **unconditionally**, including in production. Any user with an empty inbox got 5 auto-generated fake conversations with invented messages attributed to real other accounts on the platform. Now gated to non-production environments only.
2. **`clientMessageId` consistency fixed** (`server/src/controllers/messageController.js`): it was echoed back in the socket broadcast but never in the HTTP response and never persisted on the `Message` document, so a sent message's client-side dedup key depended on which channel (REST vs. socket) delivered it first. Now included in both.
3. **Logging was silently dead:** `requestMonitorMiddleware` (warns on any request >1s — e.g. an unindexed search scan) was imported in `server/src/server.js` but never actually `app.use()`'d. Now wired in.
4. Replaced ad-hoc `console.log`/`console.error` with the project's existing structured `logger` (with real context — conversationId, userId, message counts, block-check results) across `messageController.js`, `conversationController.js`, and `socket/index.js`, at both success and failure points.

**Investigated, not conclusively resolved:** the reported "message bubbles sometimes combine" and "image lands in the middle of the screen" symptoms. Traced the full rendering pipeline (sender/grouping logic, bubble alignment, `keyExtractor`, absolute-positioning scoping) in `ChatDetail.tsx` and `MessageBubble.tsx` — everything checks out correct in the code. These read like runtime/timing symptoms that are hard to pin down from static reading alone and would be faster to confirm via a live repro.

---

## 7. Search: fixed the actual causes of "slow"/wrong results

1. **Race condition (both platforms):** search had no staleness guard — a slow response for an earlier keystroke could arrive after a newer one and overwrite it with stale results. Fixed with a stale-response guard on both:
   - `mobile/app/app/explore.tsx`
   - `client/src/pages/user/ExplorePage.jsx`
2. **Missing indexes:** `Post.location`, `Post.media.type`, and `User.fullName` had zero index support despite being actively filtered/searched on in `searchController.js`. Added compound indexes so the query planner can narrow the candidate set before the regex pass instead of scanning the full collection on every search.
   - `server/src/models/Post.js`
   - `server/src/models/User.js`

---

## Full file list

| File | Change |
|---|---|
| `mobile/android/app/src/main/java/com/snapgramai/mobile/MainApplication.kt` | Fixed native entry point → resolves the 100%-reproducing launch crash |
| `mobile/android/gradle.properties` | `newArchEnabled=false`, made consistent |
| `mobile/app.json` | `newArchEnabled: false`, made consistent |
| `mobile/app/app/explore.tsx` | Search bar dark-style match + search race-condition fix |
| `mobile/app/app/reels/index.tsx` | Added missing Save/Download action (parity with web) |
| `mobile/app/app/vault.tsx` | Gradient title, gradient "Add Memory" button, subtitle, badge text (parity with web) |
| `mobile/app/app/settings.tsx` | Logout now actually clears the stored token |
| `mobile/src/pages/user/ExplorePage.tsx` | Theme-aware colors (brand purple, not rose) |
| `mobile/src/pages/user/ChatPage.tsx` | Theme-aware colors (brand purple, not Instagram blue) |
| `mobile/src/pages/user/VaultPage.tsx` | Theme-aware colors |
| `mobile/src/pages/user/PostDetailPage.tsx` | Theme-aware colors |
| `mobile/src/pages/creator/CreatorStudioPage.tsx` | Theme-aware colors |
| `mobile/src/pages/creator/MonetizationDashboardPage.tsx` | Theme-aware surfaces (kept intentional green accent) |
| `mobile/src/pages/admin/AdminDashboardPage.tsx` | Theme-aware surfaces (kept intentional rose accent) |
| `mobile/src/utils/authStorage.ts` | Multi-account tokens moved from plaintext `AsyncStorage` to encrypted `SecureStore` |
| `client/src/pages/user/ExplorePage.jsx` | Search race-condition fix (parity with mobile fix) |
| `server/src/controllers/conversationController.js` | Fixed unconditional fake-conversation seeding (prod data-integrity bug) + logging |
| `server/src/controllers/messageController.js` | `clientMessageId` consistency fix + logging |
| `server/src/models/Post.js` | Added `location` / `media.type` indexes for search |
| `server/src/models/User.js` | Added `fullName` index for search |
| `server/src/routes/vaultRoutes.js` | Server-side rate limit on PIN verification (anti-brute-force) |
| `server/src/server.js` | Wired in the previously-dead slow-request logging middleware |
| `server/src/socket/index.js` | Structured logging on connect/disconnect/errors |

---

## Known remaining gaps (flagged, not in scope of what was fixed)

- Website's Settings "Log Out" button has the same missing-token-cleanup gap as the mobile bug fixed in §5.1.
- Vault PIN hashing is weak for its keyspace (see §5).
- New vaults silently default to PIN `1234` with no mobile-side warning.
- The `app/app/*.tsx` duplicate-implementation pattern (§3) exists for other screens too (Chat, Post Detail, Create Reel/Story, etc.) — only the ones actually compared against web in §4 were touched. A full page-by-page pixel audit of the remaining screens was requested but not completed this session.
- The reported chat "bubbles combine" / "image in the middle of the screen" symptoms were investigated at the code level (§6) but not conclusively reproduced or fixed — recommend a live repro pass.
