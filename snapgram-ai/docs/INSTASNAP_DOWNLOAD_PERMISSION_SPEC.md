# InstaSnap AI — Creator-Controlled Download Permission Specification
**Document Version:** 1.0.0-Phase-T  
**Modules Affected:** `server/src/models/Story.js`, `server/src/models/Reel.js`, `server/src/controllers/storyController.js`, `server/src/controllers/reelController.js`, `client/src/components/feed/StoryViewer.jsx`, `client/src/pages/user/ReelsPage.jsx`, `mobile/src/components/feed/StoryViewer.tsx`, `mobile/src/pages/user/ReelsPage.tsx`

---

## 1. Context & Security Requirement

Modern social platforms require strict creator consent for saving or downloading media to local devices. Prior to Phase T, web and mobile clients attempted downloads using client-side checks with direct media CDN URLs, leaving the system vulnerable to unauthorized scraping, bypassing creator preferences, and omitting creator alerts.

---

## 2. Authorization Pipeline & Permission Resolution

### 2.1 Settings & Model Schema
1. **Global Account Setting** (`UserSettings.js`):
   - `privacy.allowStoryDownloads: Boolean` (default: `true`)
   - `privacy.allowReelDownloads: Boolean` (default: `true`)
2. **Per-Item Override** (`Story.js` and `Reel.js`):
   - `downloadPermission: { type: String, enum: ['allow', 'deny', 'use_account_default'], default: 'use_account_default' }`
   - Backward-compatible fields preserved: `Story.allowDownload: Boolean`, `Reel.downloadAllowed: Boolean`.

### 2.2 Cascading Resolution Hierarchy
When a user attempts to download media:
1. **Content Access Check**: Viewer must have fundamental access to the item (not blocked, not expired, member of Close Friends if close-friends story, approved follower if private account).
2. **Owner Exemption**: Creators can always download their own content.
3. **Per-Item Explicit Override**:
   - If `item.downloadPermission === 'allow'`: Download is permitted.
   - If `item.downloadPermission === 'deny'`: Download is forbidden (`HTTP 403`, reason: `'creator_disabled'`).
4. **Fallback to Account Default**:
   - If `item.downloadPermission === 'use_account_default'`, inspect author's `UserSettings`:
     - Story: `ownerSettings.privacy.allowStoryDownloads ?? true`
     - Reel: `ownerSettings.privacy.allowReelDownloads ?? true`
5. **Legacy Boolean Fallback**:
   - If `downloadPermission` is missing or undefined, inspect `story.allowDownload` or `reel.downloadAllowed`.

---

## 3. Real-Time Alert & Notification Protocol

When an authorized download occurs by a third party:
1. **Owner Protection**: Owners downloading their own stories or reels do not trigger notifications.
2. **Idempotency Guard**:
   - A 60-second dedup window is enforced in MongoDB:
   ```javascript
   const sixtySecondsAgo = new Date(Date.now() - 60 * 1000);
   const existingNotif = await Notification.findOne({
     recipient: authorId,
     sender: viewerId,
     type: 'story_downloaded', // or 'reel_downloaded'
     contentId: item._id,
     createdAt: { $gte: sixtySecondsAgo }
   });
   ```
   - If an existing notification is found within 60 seconds, download succeeds with `HTTP 200`, but duplicate notifications and socket events are suppressed.
3. **Socket.IO Real-time Delivery**:
   - If no duplicate exists, create the `Notification` record and immediately emit:
     - `new_notification`: Payload containing `senderUsername`, `contentId`, `type`, and formatted message (`"Jane downloaded your story"`).
     - `notification_count_update`: Increments unread badge count by 1.

---

## 4. Endpoints & Schemas

### Story Download
- **Route**: `POST /api/stories/:id/download`
- **Auth**: Required (`protect`)
- **Success (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "downloadUrl": "https://res.cloudinary.com/instasnap/.../video.mp4",
      "contentId": "story_id",
      "contentType": "story",
      "mediaType": "video"
    }
  }
  ```

### Reel Download
- **Route**: `POST /api/reels/:id/download`
- **Auth**: Required (`protect`)
- **Success (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "downloadUrl": "https://res.cloudinary.com/instasnap/.../reel.mp4",
      "contentId": "reel_id",
      "contentType": "reel",
      "mediaType": "video"
    }
  }
  ```

### Denial (`403 Forbidden`)
```json
{
  "success": false,
  "message": "The creator has disabled downloads for this story",
  "reason": "creator_disabled"
}
```
