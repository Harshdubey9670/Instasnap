# InstaSnap AI — Privacy Matrix & Authorization Rules
**Version:** 1.0.0-Phase-T  
**Scope:** Universal Authorization Rules Across Web, Mobile, and Backend API

---

## 1. Matrix Overview

The Privacy Matrix defines access permissions for all social objects, endpoints, and interaction types based on viewer identity, relationship status, and owner privacy settings.

---

## 2. Object-Level Access Control Matrix

| Content / Endpoint | Owner | Approved Follower | Non-Follower (Public Account) | Non-Follower (Private Account) | Blocked Viewer | Muted / Restricted |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Profile Metadata** (`/api/users/:id`) | FULL | Full (No Private Data) | Public Info + Counts | Summary + Private Flag | **403 Denied** | Full Info (Restricted interaction) |
| **Followers Array** (`/api/users/:id`) | **EXPOSED** | **HIDDEN (Counts Only)** | **HIDDEN (Counts Only)** | **HIDDEN (Counts Only)** | **403 Denied** | **HIDDEN (Counts Only)** |
| **Followers List** (`/followers` - Public) | ALLOW | ALLOW | ALLOW | ALLOW | **403 Denied** | ALLOW |
| **Followers List** (`/followers` - Followers Only) | ALLOW | ALLOW | **403 Denied** | **403 Denied** | **403 Denied** | Depends on Follow Status |
| **Followers List** (`/followers` - Following Only) | ALLOW | ALLOW (If followed by owner) | **403 Denied** | **403 Denied** | **403 Denied** | Depends on Owner Follow |
| **Followers List** (`/followers` - Private) | ALLOW | **403 Denied** | **403 Denied** | **403 Denied** | **403 Denied** | **403 Denied** |
| **Story View** (Standard) | ALLOW | ALLOW | ALLOW | **403 Denied** | **403 Denied** | ALLOW |
| **Story View** (Close Friends) | ALLOW | If in `closeFriends` | **403 Denied** | **403 Denied** | **403 Denied** | **403 Denied** |
| **Story Download** (`/download` - Allowed) | ALLOW | ALLOW | ALLOW (If story accessible) | **403 Denied** | **403 Denied** | ALLOW |
| **Story Download** (`/download` - Denied) | ALLOW | **403 Denied** | **403 Denied** | **403 Denied** | **403 Denied** | **403 Denied** |
| **Reel View** (Feed/Explore) | ALLOW | ALLOW | ALLOW | ALLOW | **403 Denied** | ALLOW |
| **Reel Download** (`/download` - Allowed) | ALLOW | ALLOW | ALLOW | ALLOW | **403 Denied** | ALLOW |
| **Reel Download** (`/download` - Denied) | ALLOW | **403 Denied** | **403 Denied** | **403 Denied** | **403 Denied** | **403 Denied** |

---

## 3. Bidirectional Block Policy

In InstaSnap AI, blocks are strictly bidirectional:
- If **Viewer** has blocked **Owner**, Viewer cannot see Owner's profile, posts, stories, reels, followers, or followings.
- If **Owner** has blocked **Viewer**, Viewer cannot see Owner's profile, posts, stories, reels, followers, or followings.
- All endpoints query:
  ```javascript
  const isBlockedByOwner = (owner.blockedUsers || []).some(id => id.toString() === viewerId);
  const hasBlockedOwner = viewerDoc && (viewerDoc.blockedUsers || []).some(id => id.toString() === ownerId);
  if (isBlockedByOwner || hasBlockedOwner) return 403 Forbidden;
  ```

---

## 4. Download Notification Dispatch Matrix

| Action | Content Type | Recipient | Sender | Notification Emitted | Socket Event | Idempotency Window |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: |
| Owner Downloads Own Story | Story | Author (Self) | Owner | **NO** | **NO** | N/A |
| Third-Party Downloads Story | Story | Author | Downloader | **YES (`story_downloaded`)** | `new_notification` | 60 seconds |
| Third-Party Downloads Story (2nd time within 60s) | Story | Author | Downloader | **NO (Suppressed)** | **NO** | 60 seconds |
| Owner Downloads Own Reel | Reel | Author (Self) | Owner | **NO** | **NO** | N/A |
| Third-Party Downloads Reel | Reel | Author | Downloader | **YES (`reel_downloaded`)** | `new_notification` | 60 seconds |
| Third-Party Downloads Reel (2nd time within 60s) | Reel | Author | Downloader | **NO (Suppressed)** | **NO** | 60 seconds |
