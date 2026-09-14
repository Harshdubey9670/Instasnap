# InstaSnap AI — Product Master Registry
**Version:** 1.0.0-Phase-T  
**Status:** Verified & Active  
**Last Audit:** September 2026  

---

## 1. Executive Summary

This Master Registry catalogues every functional capability across **Web** (`/client`), **Mobile** (`/mobile`), and **Backend** (`/server`), tracking parity, state management, API routes, and privacy enforcement.

---

## 2. Core Feature Matrix

| Domain | Feature Area | Backend API / Socket | Web Client (`/client`) | Mobile App (`/mobile`) | Status | Parity Rating |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Authentication** | Email/Password Registration | `POST /api/auth/register` | `SignupPage.jsx` | `SignupScreen.tsx` | Complete | 100% |
| **Authentication** | Login (JWT + Cookie/Bearer) | `POST /api/auth/login` | `LoginPage.jsx` | `LoginScreen.tsx` | Complete | 100% |
| **Authentication** | Google OAuth | `POST /api/auth/google` | `LoginPage.jsx` | `AuthStorage.ts` / Expo Auth | Complete | 100% |
| **Authentication** | Password Reset (OTP) | `POST /api/auth/forgot-password`<br>`POST /api/auth/reset-password` | `ForgotPasswordPage.jsx`<br>`ResetPasswordPage.jsx` | `ForgotPasswordScreen.tsx` | Complete | 100% |
| **Authentication** | Account Switcher | Multi-session tokens | `AccountSwitcherModal.jsx` | Multi-account SecureStore | Complete | 100% |
| **Profile** | View Profile (Self / Other) | `GET /api/users/:id` | `ProfilePage.jsx` | `ProfilePage.tsx` | Complete (Hardened) | 100% |
| **Profile** | Edit Profile / Avatar / Bio | `PUT /api/users/update` | `EditProfileModal.jsx` | `EditProfileScreen.tsx` | Complete | 100% |
| **Profile** | Follow / Unfollow / Request | `POST /api/users/:id/follow`<br>`DELETE /api/users/:id/unfollow` | `FollowButton.jsx` | `FollowButton.tsx` | Complete | 100% |
| **Profile** | Followers List Visibility | `GET /api/users/:id/followers` | `FollowersPage.jsx` (403 Gated) | `FollowersPage.tsx` (403 Gated) | Complete (Phase T) | 100% |
| **Profile** | Following List Visibility | `GET /api/users/:id/following` | `FollowingPage.jsx` (403 Gated) | `FollowingPage.tsx` (403 Gated) | Complete (Phase T) | 100% |
| **Profile** | Saved Posts Grid | `GET /api/users/saved-posts` | `ProfilePage.jsx` (Saved tab) | `ProfilePage.tsx` (Saved tab) | Complete | 100% |
| **Feed** | Algorithmic Post Feed | `GET /api/posts/feed` | `FeedPage.jsx` | `FeedScreen.tsx` | Complete | 100% |
| **Feed** | Create Post (Image/Video/Carousel) | `POST /api/posts` | `CreatePostModal.jsx` | `CreatePostScreen.tsx` | Complete | 100% |
| **Feed** | Like / Unlike Post | `PUT /api/posts/:id/like` | `PostCard.jsx` | `PostCard.tsx` | Complete | 100% |
| **Feed** | Comments & Threaded Replies | `GET/POST /api/comments/:postId` | `CommentSection.jsx` | `CommentsSheet.tsx` | Complete | 100% |
| **Feed** | Save / Bookmark Post | `POST /api/posts/:id/save` | `PostCard.jsx` | `PostCard.tsx` | Complete | 100% |
| **Stories** | 24-Hour Ephemeral Stories | `GET /api/stories`<br>`POST /api/stories` | `StoriesRow.jsx`<br>`StoryViewer.jsx` | `StoriesRow.tsx`<br>`StoryViewer.tsx` | Complete | 100% |
| **Stories** | Story Highlights | `GET/POST /api/stories/highlights` | `ProfilePage.jsx` | `StoryHighlightsRow.tsx` | Complete | 100% |
| **Stories** | Story Archive | `GET /api/stories/archive` | `ArchivePage.jsx` | `StoriesPage.tsx` (Archive) | Complete | 100% |
| **Stories** | Authorized Story Download | `POST /api/stories/:id/download` | `StoryViewer.jsx` | `StoryViewer.tsx` | Complete (Phase T) | 100% |
| **Reels** | Vertical Video Feed | `GET /api/reels` | `ReelsPage.jsx` | `ReelsPage.tsx` | Complete | 100% |
| **Reels** | Create Reel / Audio Sync | `POST /api/reels` | `CreateReelPage.jsx` | `CreateReelPage.tsx` | Complete | 100% |
| **Reels** | Remix Reel | `POST /api/reels?remix=...` | `ReelsPage.jsx` | `ReelsPage.tsx` | Complete | 100% |
| **Reels** | Authorized Reel Download | `POST /api/reels/:id/download` | `ReelsPage.jsx` | `ReelsPage.tsx` | Complete (Phase T) | 100% |
| **Direct Messaging** | 1-on-1 Chat | Sockets (`send_message`, etc.) | `ChatPage.jsx` | `ChatPage.tsx` | Complete | 100% |
| **Direct Messaging** | Group Chats | Sockets + `POST /api/chats/group` | `ChatPage.jsx` | `ChatPage.tsx` | Complete | 100% |
| **Direct Messaging** | End-to-End Ephemeral Media | Sockets (`media_sent`) | `MediaPreviewModal.jsx` | `MediaAttachment.tsx` | Complete | 100% |
| **Video Calls** | WebRTC 1-on-1 Video Calling | Sockets (`call_user`, `answer_call`) | `VideoCallModal.jsx` | WebRTC native client | Complete | 100% |
| **Notifications** | Real-time Push & In-app Alerts | Socket `new_notification` | `NotificationsPage.jsx` | `NotificationsScreen.tsx` | Complete (Phase T types) | 100% |
| **Privacy & Security** | Private Account Toggle | `PUT /api/settings` | `PrivacySettings.jsx` | `PrivacySettings.tsx` | Complete | 100% |
| **Privacy & Security** | Followers List Visibility Control | `PUT /api/settings` | `PrivacySettings.jsx` (Select) | `PrivacySettings.tsx` (Select) | Complete (Phase T) | 100% |
| **Privacy & Security** | Following List Visibility Control | `PUT /api/settings` | `PrivacySettings.jsx` (Select) | `PrivacySettings.tsx` (Select) | Complete (Phase T) | 100% |
| **Privacy & Security** | Story Download Global Permission | `PUT /api/settings` | `PrivacySettings.jsx` (Toggle) | `PrivacySettings.tsx` (Toggle) | Complete (Phase T) | 100% |
| **Privacy & Security** | Reel Download Global Permission | `PUT /api/settings` | `PrivacySettings.jsx` (Toggle) | `PrivacySettings.tsx` (Toggle) | Complete (Phase T) | 100% |
| **Privacy & Security** | Block / Mute / Restrict Users | `PUT /api/users/block` | `PrivacySettings.jsx` | `PrivacySettings.tsx` | Complete | 100% |

---

## 3. Data Flow & Security Guarantees

1. **Defense-in-Depth Authorization**: Every private route passes through `protect` middleware verifying valid JWT.
2. **Granular Guard Layer**: Visibility queries (`/followers`, `/following`, `/stories/:id/download`, `/reels/:id/download`) pass through `privacyGuards.js` resolving bidirectional block lists, account privacy, and creator permissions before database exposure.
3. **IDOR Prevention**: `/api/users/:id` sanitizes followers and following arrays into integers (`followersCount`, `followingCount`) for non-owner viewers. Full arrays are restricted to the owner.
