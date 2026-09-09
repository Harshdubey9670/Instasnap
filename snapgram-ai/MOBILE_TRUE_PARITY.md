# 📱 INSTASNAP — TRUE MOBILE PARITY MATRIX (`client/` as Source of Truth)

## 📊 Summary of Forensic Parity

| Category | Total Web Features | Full Parity in Mobile | Partial Parity | Gaps / Device Tests |
|---|---|---|---|---|
| **1. Auth & Onboarding** | 5 | 5 | 0 | 0 |
| **2. Chat & Presence** | 7 | 7 | 0 | 0 |
| **3. Snaps & Disappearing Media** | 4 | 3 | 1 (Screenshot OS limit) | 0 |
| **4. Stories & Highlights** | 5 | 5 | 0 | 0 |
| **5. Feed, Posts & Comments** | 5 | 5 | 0 | 0 |
| **6. Profile & Social Graph** | 5 | 5 | 0 | 0 |
| **7. Notifications** | 4 | 4 | 0 | 0 |
| **8. Media Vault** | 3 | 3 | 0 | 0 |
| **9. Settings Engine (13 panels)** | 2 | 2 | 0 | 0 |
| **10. AI, Live, Creator, Admin** | 6 | 5 | 1 (WebRTC Device Test) | 0 |
| **TOTAL** | **46 Modules** | **44 (95.6%)** | **2 (4.4%)** | **0** |

---

## 🔍 Detailed Component & Behavioral Verification

| # | Client Feature | Client Source (`client/`) | Mobile Source (`mobile/`) | API Endpoint | Socket Event | Status | Evidence |
|---|---|---|---|---|---|---|---|
| 1 | Presence Avatar | `components/chat/ConversationPresenceAvatar.jsx` | `src/components/chat/ConversationPresenceAvatar.tsx` | N/A | `conversationPresenceUpdate`, `typing`, `stopTyping` | `FULLY_PARITY` | Reanimated animated scale & bouncing typing dots. |
| 2 | Snap Viewer | `components/chat/SnapViewerModal.jsx` | `src/components/chat/SnapViewerModal.tsx` | `POST /api/messages/snap/:id/open` | `snapOpened`, `snapExpired`, `screenshotNotification` | `FULLY_PARITY` | Blur filter, tap countdown, expiration callback. |
| 3 | Story Reaction Tray | `components/feed/StoryViewer.jsx` | `src/components/feed/StoryViewer.tsx` | `POST /api/stories/:id/react` | N/A | `FULLY_PARITY` | 6 emoji floating animation, viewer list modal. |
| 4 | Story Highlights | `components/profile/StoryHighlightsRow.jsx` | `src/components/profile/StoryHighlightsRow.tsx` | `GET/POST /api/stories/highlights` | N/A | `FULLY_PARITY` | Circular rings, archive picker modal, full story playback. |
| 5 | Post Options Sheet | `components/post/PostOptionsModal.jsx` | `src/components/post/PostOptionsSheet.tsx` | `PUT /api/posts/:id/archive`, `pin`, `settings` | `postDeleted` | `FULLY_PARITY` | Archive, Pin, Turn Off Comments, Hide Likes, Delete, Report. |
| 6 | Post Edit Modal | `components/post/EditPostModal.jsx` | `src/components/post/EditPostModal.tsx` | `PUT /api/posts/:id` | N/A | `FULLY_PARITY` | Caption (2200 max) + location editor with optimistic update. |
| 7 | Comment Sheet | `components/feed/CommentModal.jsx` | `src/components/feed/CommentSheet.tsx` | `GET/POST /api/posts/:id/comments` | N/A | `FULLY_PARITY` | Quick emoji bar, pinned comment badge, reply banner. |
| 8 | Edit Profile Modal | `components/profile/EditProfileModal.jsx` | `src/components/profile/EditProfileModal.tsx` | `PUT /api/users/update`, `POST /avatar` | N/A | `FULLY_PARITY` | Full name, username, bio, website, pronouns, gender, category, privacy. |
| 9 | Relationship Controls | `components/profile/RelationshipActionsModal.jsx` | `src/components/profile/RelationshipActionsSheet.tsx` | `POST /api/users/:id/block`, `mute`, `restrict` | N/A | `FULLY_PARITY` | Block dialog, mute, restrict, report reasons picker. |
| 10 | Notifications List | `pages/user/NotificationsPage.jsx` | `app/(app)/notifications.tsx` | `GET /api/notifications` | `notification_count_update` | `FULLY_PARITY` | Today / This Week / Earlier sections, follow requests, badges. |
| 11 | Media Vault PIN | `pages/user/VaultPage.jsx` | `app/(app)/vault.tsx` | `POST /api/vault/verify-pin` | N/A | `FULLY_PARITY` | PIN auth, 5 attempts threshold, 30s lockout, Biometrics. |
| 12 | Settings (13 panels) | `pages/user/SettingsPage.jsx` | `app/(app)/settings/index.tsx` | `GET/PUT /api/settings` | N/A | `FULLY_PARITY` | 13 categorized setting views with instant server synchronization. |
