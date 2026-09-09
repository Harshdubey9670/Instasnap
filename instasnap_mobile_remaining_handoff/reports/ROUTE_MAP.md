# Route Map — Web to Expo Router

## Route Mapping Table

| Web Route | HTTP Method | Web Page Component | Expo Router File | Status |
|---|---|---|---|---|
| `/` | GET | Redirect to /auth/login | `app/index.tsx` → Redirect | ✅ DONE |
| `/auth/login` | GET | LoginPage | `app/auth/login.tsx` | ✅ DONE |
| `/auth/signup` | GET | SignupPage | `app/auth/signup.tsx` | ✅ DONE |
| `/auth/otp` | GET | OtpPage | `app/auth/otp.tsx` | ✅ DONE |
| `/auth/forgot-password` | GET | ForgotPasswordPage | `app/auth/forgot-password.tsx` | ✅ DONE |
| `/auth/reset-password` | GET | ResetPasswordPage | `app/auth/reset-password.tsx` | ✅ DONE |
| `/auth/profile-setup` | GET | ProfileSetupPage | `app/auth/profile-setup.tsx` | ✅ DONE |
| `/app` (index) | GET | FeedPage | `app/app/index.tsx` | ✅ DONE |
| `/app/reels` | GET | ReelsPage | `app/app/reels.tsx` | ✅ DONE |
| `/app/spotlight` | GET | ReelsPage (alias) | `app/app/reels.tsx` | ✅ DONE (same screen) |
| `/app/reels/create` | GET | CreateReelPage | `app/app/reels/create.tsx` | ✅ DONE |
| `/app/stories` | GET | StoriesPage | `app/app/stories.tsx` | ✅ DONE |
| `/app/story/create` | GET | CreateStoryPage | `app/app/create-story.tsx` | ✅ DONE |
| `/app/camera` | GET | CameraPage | `app/app/camera.tsx` | ✅ DONE |
| `/app/explore` | GET | ExplorePage | `app/app/explore.tsx` | ✅ DONE |
| `/app/discover` | GET | ExplorePage (alias) | `app/app/explore.tsx` | ✅ DONE (same screen) |
| `/app/search` | GET | SearchResultsPage | `app/app/search-results.tsx` | ✅ DONE |
| `/app/chat` | GET | ChatPage | `app/app/chat.tsx` | ✅ DONE |
| `/app/chat/:id` | GET | ChatPage with id | `app/app/chat/[id].tsx` | ✅ DONE |
| `/app/vault` | GET | VaultPage | `app/app/vault.tsx` | ✅ DONE |
| `/app/notifications` | GET | NotificationsPage | `app/app/notifications.tsx` | ✅ DONE |
| `/app/profile` | GET | ProfilePage (own) | `app/app/profile/[id].tsx` | ✅ DONE |
| `/app/profile/:id` | GET | ProfilePage | `app/app/profile/[id].tsx` | ✅ DONE |
| `/app/profile/:id/followers` | GET | NetworkPage | `app/app/followers.tsx` | ✅ DONE |
| `/app/profile/:id/following` | GET | NetworkPage | `app/app/following.tsx` | ✅ DONE |
| `/app/hashtag/:tag` | GET | HashtagPage | `app/app/hashtag/[tag].tsx` | ✅ DONE |
| `/app/trending-hashtags` | GET | TrendingHashtagsPage | `app/app/trending-hashtag.tsx` | ✅ DONE |
| `/app/profile/u/:username` | GET | UsernameLookupPage | `app/app/username-lookup.tsx` | ✅ DONE |
| `/app/settings` | GET | SettingsPage | `app/app/settings.tsx` | ✅ DONE |
| `/app/creator` | GET | CreatorStudioPage | `app/creator/index.tsx` | ❌ **MISSING** |
| `/app/monetization` | GET | MonetizationDashboardPage | `app/creator/monetization.tsx` | ❌ **MISSING** |
| `/app/ai` | GET | AiStudioPage | `app/app/ai-studio.tsx` | ✅ DONE |
| `/app/post/:id` | GET | PostDetailPage | `app/app/post/[id].tsx` | ✅ DONE |
| `/app/live/new` | GET | LiveHostView | `app/app/live/new.tsx` | ❌ **MISSING** (component exists) |
| `/app/live/:id` | GET | LiveViewerView | `app/app/live/[id].tsx` | ❌ **MISSING** (component exists) |
| `/admin` | GET | AdminDashboardPage | `app/admin/index.tsx` | ❌ **MISSING** |
| `/splash` | GET | SplashScreen | Not needed in RN (use native splash) | ✅ NOT_APPLICABLE |

---

## Expo Router Directory Structure Required

```
app/
├── _layout.tsx                    ✅ EXISTS
├── index.tsx                      ✅ EXISTS (auth redirect)
├── auth/
│   ├── login.tsx                  ✅ EXISTS
│   ├── signup.tsx                 ✅ EXISTS
│   ├── otp.tsx                    ✅ EXISTS
│   ├── forgot-password.tsx        ✅ EXISTS
│   ├── reset-password.tsx         ✅ EXISTS
│   └── profile-setup.tsx          ✅ EXISTS
├── app/
│   ├── index.tsx                  ✅ EXISTS (Feed)
│   ├── reels.tsx                  ✅ EXISTS
│   ├── stories.tsx                ✅ EXISTS
│   ├── explore.tsx                ✅ EXISTS
│   ├── search-results.tsx         ✅ EXISTS
│   ├── chat.tsx                   ✅ EXISTS
│   ├── vault.tsx                  ✅ EXISTS
│   ├── notifications.tsx          ✅ EXISTS
│   ├── network.tsx                ✅ EXISTS
│   ├── followers.tsx              ✅ EXISTS
│   ├── following.tsx              ✅ EXISTS
│   ├── trending-hashtag.tsx       ✅ EXISTS
│   ├── username-lookup.tsx        ✅ EXISTS
│   ├── settings.tsx               ✅ EXISTS
│   ├── ai-studio.tsx              ✅ EXISTS
│   ├── post-detail.tsx            ✅ EXISTS
│   ├── camera.tsx                 ✅ EXISTS
│   ├── create-story.tsx           ✅ EXISTS
│   ├── create-reel.tsx            ✅ EXISTS
│   ├── notification.tsx           ✅ EXISTS (re-export to notifications)
│   ├── chat/
│   │   └── [id].tsx               ✅ EXISTS
│   ├── hashtag/
│   │   └── [tag].tsx              ✅ EXISTS
│   ├── post/
│   │   └── [id].tsx               ✅ EXISTS
│   ├── profile/
│   │   └── [id].tsx               ✅ EXISTS
│   ├── reels/
│   │   └── create.tsx             ✅ EXISTS
│   └── live/
│       ├── new.tsx                ❌ MISSING — create thin wrapper for LiveHostView
│       └── [id].tsx               ❌ MISSING — create thin wrapper for LiveViewerView
├── admin/
│   └── index.tsx                  ❌ MISSING — full AdminDashboardPage implementation
└── creator/
    ├── index.tsx                  ❌ MISSING — full CreatorStudioPage implementation
    └── monetization.tsx           ❌ MISSING — full MonetizationDashboardPage implementation
```

---

## Route Guard Mapping

| Web Guard | Mobile Equivalent |
|---|---|
| `<ProtectedRoute />` | Check `isAuthenticated` in each screen / use `app/index.tsx` redirect |
| `<ProtectedRoute adminOnly />` | Check `user.role === 'admin'` in `app/admin/index.tsx` |
| `<GuestRoute />` | Check `!isAuthenticated` in auth screens / redirect if logged in |

**Note:** The mobile app currently uses a simple redirect pattern in `app/index.tsx`. Admin-only protection should be added explicitly in `app/admin/index.tsx` using `useSelector(state => state.auth.user?.role)`.
