# InstaSnap AI — Missing Feature & Forensic Gap Audit
**Phase:** T  
**Date:** September 2026  
**Scope:** Client (`/client`), Mobile (`/mobile`), Server (`/server`)

---

## 1. Executive Summary

A comprehensive forensic audit of the InstaSnap AI codebase was performed to identify missing core social features, incomplete features, UI-only placeholders, backend-only endpoints, and security vulnerabilities prior to Phase T remediation.

---

## 2. Forensic Findings by Category

### A. Critical Security & IDOR Deficiencies (Resolved in Phase T)
1. **Unprotected Follower Lists (IDOR)**:
   - *Previous State*: `GET /api/users/:id/followers` and `GET /api/users/:id/following` performed no privacy check. Any authenticated user could enumerate any target user's full follower graph regardless of private account or custom privacy settings.
   - *Resolution*: Implemented `canViewFollowersList` and `canViewFollowingList` in `server/src/utils/privacyGuards.js`. Blocked viewers and unauthorized tiers receive HTTP 403.
2. **User Profile Full Array Leaks**:
   - *Previous State*: `GET /api/users/:id` returned fully populated `followers` and `following` arrays directly to any requesting user.
   - *Resolution*: Sanitized profile output. Non-owners receive scalar counts (`followersCount`, `followingCount`) and relational booleans (`isFollowing`, `isFollowedBy`). Array contents are returned strictly to the authenticated owner.
3. **Unauthenticated & Direct Media Download Leaks**:
   - *Previous State*: Story and Reel downloads bypassed backend authorization by directly fetching CDN/Cloudinary media URLs in the client without notifying authors or checking permission status.
   - *Resolution*: Introduced backend download endpoints `POST /api/stories/:id/download` and `POST /api/reels/:id/download` with permission evaluation, author alerts, and 60-second idempotency.

---

### B. Incomplete Features & Blunt Settings (Resolved in Phase T)
1. **Binary Follower List Privacy**:
   - *Previous State*: Only boolean `hideFollowers` and `hideFollowing` existed in `UserSettings.js`.
   - *Resolution*: Replaced with 4-tier granular enums (`public`, `followers`, `following`, `private`).
2. **Creator Download Permissions**:
   - *Previous State*: Story had `allowDownload: Boolean`, Reel had `downloadAllowed: Boolean`. Neither had account-level defaults, and no download API existed.
   - *Resolution*: Added `allowStoryDownloads` and `allowReelDownloads` to `UserSettings`, added `downloadPermission` enum to `Story` and `Reel`, and unified enforcement in `privacyGuards.js`.
3. **Missing Notification Types**:
   - *Previous State*: Notification model did not have types for story or reel downloads.
   - *Resolution*: Added `story_downloaded` and `reel_downloaded` with `contentId` reference and real-time Socket.IO dispatch.

---

### C. Client & Mobile UI Gaps (Resolved in Phase T)
1. **Web & Mobile Settings Selectors**:
   - Upgraded both Web `PrivacySettings.jsx` and Mobile `PrivacySettings.tsx` to include `SettingSelect` dropdowns for Followers/Following visibility and dedicated Downloads cards.
2. **403 Private List UI States**:
   - Added dedicated `This account's followers list is private` lock states to Web and Mobile `FollowersPage` and `FollowingPage`.
3. **Download Flow**:
   - Integrated authorized API calls and device Media Library saving across Web `StoryViewer.jsx`, Web `ReelsPage.jsx`, Mobile `StoryViewer.tsx`, and Mobile `ReelsPage.tsx`.

---

## 3. Product Parity Audit Summary

| Component | Backend Status | Web Status | Mobile Status | Resolution Phase |
| :--- | :--- | :--- | :--- | :--- |
| Followers Visibility Privacy | Implemented (403 Gated) | Implemented (UI Selector + 403 State) | Implemented (UI Selector + 403 State) | Phase T |
| Following Visibility Privacy | Implemented (403 Gated) | Implemented (UI Selector + 403 State) | Implemented (UI Selector + 403 State) | Phase T |
| Story Download Authorization | Implemented (`POST /download`) | Implemented (Authorized Save) | Implemented (MediaLibrary + FileSystem) | Phase T |
| Reel Download Authorization | Implemented (`POST /download`) | Implemented (Authorized Save) | Implemented (MediaLibrary + FileSystem) | Phase T |
| Real-time Download Notifications | Implemented (Idempotent Socket.IO) | Implemented (Toast + Notif Center) | Implemented (Toast + Notif Center) | Phase T |
| IDOR User Profile Sanitization | Implemented (Counts Only) | Implemented (Consumes counts) | Implemented (Consumes counts) | Phase T |
