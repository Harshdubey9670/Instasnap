# 📋 INSTASNAP — Master Mobile Parity Matrix

> **Source of Truth**: `client/` and `server/`  
> **Status Taxonomy**: `FULL_PARITY` | `PARTIAL_PARITY` | `MOBILE_MISSING` | `MOBILE_BROKEN` | `BACKEND_GAP` | `NATIVE_LIMITATION` | `DEVICE_TEST_REQUIRED`

---

## 📊 Matrix of Functional Parity

| ID | Client Feature | Client Source | Mobile Source | API | Socket | UI | Behavior | Animation | Gesture | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| F-01 | Email/User Login | `pages/auth/LoginPage.jsx` | `app/auth/login.tsx` | `POST /api/auth/login` | N/A | Form + Toasts | Token saved in SecureStore | Fade / Slide | Tap | `FULL_PARITY` |
| F-02 | Signup Registration | `pages/auth/SignupPage.jsx` | `app/auth/signup.tsx` | `POST /api/auth/register` | N/A | Step form | Account creation + auto login | Slide | Tap | `FULL_PARITY` |
| F-03 | Forgot/Reset Password | `pages/auth/ForgotPasswordPage.jsx` | `app/auth/forgot-password.tsx` | `POST /api/auth/forgot-password` | N/A | OTP + Reset | Token reset verification | Fade | Tap | `FULL_PARITY` |
| F-04 | Profile Setup Onboarding | `pages/auth/ProfileSetupPage.jsx` | `app/auth/profile-setup.tsx` | `PUT /api/users/update` | N/A | Avatar + Bio setup | First time user setup | Slide | Tap | `FULL_PARITY` |
| F-05 | Protected Auth Guard | `components/routing/ProtectedRoute.jsx` | `app/_layout.tsx` | Redux `auth.isAuthenticated` | N/A | Splash redirect | Auto-routes unauthenticated users | Fade | N/A | `FULL_PARITY` |
| F-06 | Conversation List | `pages/user/ChatPage.jsx` | `app/(app)/chat/index.tsx` | `GET /api/conversations` | `getOnlineUsers` | Search + Row list | Unread counters, online dots | Staggered fade | Tap / Pull | `FULL_PARITY` |
| F-07 | Real-Time Chat Stream | `components/chat/ChatDetail.jsx` | `app/(app)/chat/[id].tsx` | `GET/POST /api/messages/:id` | `newMessage`, `messagesSeen` | Inverted FlatList | Dedup by `clientMessageId` | Bubble slide-in | Tap / Scroll | `FULL_PARITY` |
| F-08 | Presence & Typing Avatar | `components/chat/ConversationPresenceAvatar.jsx` | `src/components/chat/ConversationPresenceAvatar.tsx` | N/A | `conversationPresenceUpdate`, `typing`, `stopTyping` | Floating avatar ring | Staggered 3-dot typing bubble | Reanimated float & bounce | Tap | `FULL_PARITY` |
| F-09 | Emoji Message Reactions | `components/chat/MessageBubble.jsx` | `app/(app)/chat/[id].tsx` | `POST /api/messages/:id/react` | `newMessage` | 6-emoji popup tray | Optimistic badge append | Scale spring | Long Press | `FULL_PARITY` |
| F-10 | Voice Audio Notes | `components/chat/ChatDetail.jsx` | `app/(app)/chat/[id].tsx` | `POST /api/messages/:id` | `newMessage` | Waveform + Play/Pause | `expo-av` mic recorder & player | Pulse ring | Tap / Hold | `FULL_PARITY` |
| F-11 | Cursor-based Pagination | `components/chat/ChatDetail.jsx` | `app/(app)/chat/[id].tsx` | `GET /api/messages/:id?before=&limit=30` | N/A | Top loading spinner | Seamless history load | Smooth scroll | Inverted scroll | `FULL_PARITY` |
| F-12 | Disappearing Snaps | `components/chat/SnapViewerModal.jsx` | `src/components/chat/SnapViewerModal.tsx` | `POST /api/messages/snap/:id/open` | `snapOpened`, `snapExpired` | Blur cover + Timer | Tap reveal countdown + auto-destruct | Fade / Zoom | Tap | `FULL_PARITY` |
| F-13 | Screenshot Detection | `components/chat/SnapViewerModal.jsx` | `src/components/chat/SnapViewerModal.tsx` | `POST /api/messages/snap/:id/screenshot` | `chatScreenshot`, `screenshotNotification` | Red warning banner | Notifies sender in real time | Pulse badge | N/A | `NATIVE_LIMITATION` |
| F-14 | Stories Feed Row | `components/feed/StoriesRow.jsx` | `src/components/feed/StoriesRow.tsx` | `GET /api/stories` | N/A | Gradient rings | Unviewed vs viewed distinction | Spring scale | Tap / Horizontal scroll | `FULL_PARITY` |
| F-15 | Story Viewer & Reactions | `components/feed/StoryViewer.jsx` | `src/components/feed/StoryViewer.tsx` | `PUT /api/stories/:id/view`, `react`, `reply` | N/A | Fullscreen + Progress bars | 6-emoji float tray + DM reply | Progress bar & emoji float | Tap / Hold / Swipe Down | `FULL_PARITY` |
| F-16 | Story Highlights on Profile | `components/profile/StoryHighlightsRow.jsx` | `src/components/profile/StoryHighlightsRow.tsx` | `GET/POST /api/stories/highlights` | N/A | Circular highlight list | Archive picker modal + player | Fade | Tap | `FULL_PARITY` |
| F-17 | Feed Stream & Suggested | `pages/user/FeedPage.jsx` | `app/(app)/index.tsx` | `GET /api/posts/feed`, `GET /users/suggested` | N/A | Feed cards stream | Infinite scroll + muted filter | Skeleton shimmer | Pull-to-refresh / Scroll | `FULL_PARITY` |
| F-18 | Multi-Image Post Carousel | `components/feed/PostCard.jsx` | `src/components/feed/PostCard.tsx` | `POST /api/posts/:id/like`, `save` | N/A | Paged carousel | Double tap heart animation | Heart pop spring | Double Tap / Swipe | `FULL_PARITY` |
| F-19 | Post Options Sheet | `components/post/PostOptionsModal.jsx` | `src/components/post/PostOptionsSheet.tsx` | `DELETE /api/posts/:id`, `archive`, `pin`, `settings` | `postDeleted` | Bottom sheet | Archive, Pin, Delete, Report | Sheet slide-up | Tap | `FULL_PARITY` |
| F-20 | Post Editing Modal | `components/post/EditPostModal.jsx` | `src/components/post/EditPostModal.tsx` | `PUT /api/posts/:id` | N/A | Modal form | Caption (2200 max) + location | Modal slide | Tap | `FULL_PARITY` |
| F-21 | Threaded Comments Sheet | `components/feed/CommentModal.jsx` | `src/components/feed/CommentSheet.tsx` | `GET/POST /api/posts/:id/comments` | N/A | Bottom sheet + emoji bar | Quick emoji bar, pin, reply banner | Sheet slide-up | Tap | `FULL_PARITY` |
| F-22 | Profile & Grid Tabs | `pages/user/ProfilePage.jsx` | `app/(app)/profile/index.tsx` | `GET /api/posts/user/:id`, `saved` | N/A | 3-column photo grid | Posts & Saved tabs | Fade | Tap | `FULL_PARITY` |
| F-23 | Edit Profile Modal | `components/profile/EditProfileModal.jsx` | `src/components/profile/EditProfileModal.tsx` | `PUT /api/users/update`, `POST /avatar` | N/A | Multi-field modal | Avatar picker, 8 bio fields | Slide up | Tap | `FULL_PARITY` |
| F-24 | Relationship Controls | `components/profile/RelationshipActionsModal.jsx` | `src/components/profile/RelationshipActionsSheet.tsx` | `POST /api/users/:id/block`, `mute`, `restrict` | N/A | Action sheet | Block, mute, restrict, report | Sheet slide-up | Tap | `FULL_PARITY` |
| F-25 | Notifications Grouping | `pages/user/NotificationsPage.jsx` | `app/(app)/notifications.tsx` | `GET /api/notifications` | `notification_count_update` | Categorized sections | Today / This Week / Earlier | Fade | Tap | `FULL_PARITY` |
| F-26 | Follow Requests Management | `pages/user/NotificationsPage.jsx` | `app/(app)/notifications.tsx` | `POST /api/users/follow-requests/:id/accept` | `follow_accepted` | Action buttons | Accept & Decline requests | Item slide-out | Tap | `FULL_PARITY` |
| F-27 | Media Vault PIN & Bio | `pages/user/VaultPage.jsx` | `app/(app)/vault.tsx` | `POST /api/vault/verify-pin` | N/A | PIN keypad + Bio button | 5 attempts / 30s lockout + Bio unlock | Shake on error | Keypad tap | `FULL_PARITY` |
| F-28 | 5 Vault Content Tabs | `pages/user/VaultPage.jsx` | `app/(app)/vault.tsx` | `GET /api/vault/memories`, `albums`, `trash` | N/A | Tabbed memory grid | Timeline, Private, Albums, Favorites, Trash | Slide tabs | Tap | `FULL_PARITY` |
| F-29 | Settings (13 Panels) | `pages/user/SettingsPage.jsx` | `app/(app)/settings/index.tsx` | `GET/PUT /api/settings`, `DELETE /sessions` | N/A | 13 categorized views | Real session revocation & sync | Slide panels | Tap | `FULL_PARITY` |
| F-30 | Reels Vertical Pager | `pages/user/ReelsPage.jsx` | `app/(app)/reels/index.tsx` | `GET /api/reels`, `PUT /api/reels/:id/like` | N/A | Fullscreen pager | Autoplay on scroll, sound toggle | Heart pop | Vertical Swipe | `FULL_PARITY` |
| F-31 | AI Studio & Copilot | `pages/user/AiStudioPage.jsx` | `app/(app)/ai.tsx` | `POST /api/ai/assistant`, `caption`, `bio`, `generate-image` | N/A | AI chat + tools | AI caption/bio/image generation | Message slide-in | Tap | `FULL_PARITY` |
| F-32 | WebRTC Live Streaming | `components/live/LiveHostView.jsx` | `app/(app)/live/new.tsx`, `live/[id].tsx` | `POST /api/live/start`, `end` | WebRTC Mesh Signaling (8 events) | Fullscreen camera & chat | P2P video/audio + live chat/likes | Floating hearts | Tap | `FULL_PARITY` |
| F-33 | Creator Studio & Stats | `pages/creator/CreatorStudioPage.jsx` | `app/(app)/creator.tsx` | `GET /api/creator/overview`, `insights` | N/A | Charts + Metrics | 7d/30d/90d analytics filters | Fade | Tap | `FULL_PARITY` |
| F-34 | Monetization & Payouts | `pages/creator/MonetizationDashboardPage.jsx` | `app/(app)/monetization.tsx` | `GET /api/monetization/earnings`, `POST /payouts/request` | N/A | Earnings cards | Affiliate link manager + Payout modal | Modal slide-up | Tap | `FULL_PARITY` |
| F-35 | Admin Console & Users | `pages/admin/AdminDashboardPage.jsx` | `app/(admin)/index.tsx` | `GET /api/admin/metrics`, `GET /users`, `DELETE` | N/A | Metrics + User list | Search users, delete account | Fade | Tap | `FULL_PARITY` |
