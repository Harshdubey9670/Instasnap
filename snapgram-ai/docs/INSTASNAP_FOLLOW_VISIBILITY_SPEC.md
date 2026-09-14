# InstaSnap AI — Follower & Following List Visibility Specification
**Document Version:** 1.0.0-Phase-T  
**Modules Affected:** `server/src/utils/privacyGuards.js`, `server/src/controllers/userController.js`, `client/src/pages/user/`, `mobile/src/pages/user/`

---

## 1. Requirement & Rationale

Prior to Phase T, social graph enumeration was unprotected. A malicious client could scrape the entire network graph of any account by hitting `GET /api/users/:id/followers` and `GET /api/users/:id/following`.

This specification institutes creator-level privacy tiers for social lists, allowing accounts to selectively disclose their follower and following networks.

---

## 2. Granular Privacy Tiers

Each user controls two independent settings in `UserSettings.js`:
- `privacy.followersListVisibility`: `['public', 'followers', 'following', 'private']` (Default: `'public'`)
- `privacy.followingListVisibility`: `['public', 'followers', 'following', 'private']` (Default: `'public'`)

### Tier Evaluation Rules:
1. **Owner Exemption**: The profile owner can ALWAYS view their own followers and following lists regardless of visibility settings.
2. **Bidirectional Block Gate**: If either party has blocked the other, access is rejected with `HTTP 403 (reason: 'blocked')`.
3. **Tier Enforcement**:
   - `public`: Any authenticated user can view the list.
   - `followers`: Only accounts present in the profile owner's `followers` array can view the list. Non-followers receive `HTTP 403 (reason: 'not_a_follower')`.
   - `following`: Only accounts present in the profile owner's `following` array can view the list. Non-followed accounts receive `HTTP 403 (reason: 'not_followed_by_owner')`.
   - `private`: Only the profile owner can view the list. All third-party viewers receive `HTTP 403 (reason: 'private_list')`.

---

## 3. Backward Compatibility Strategy

To preserve continuity for users with existing `hideFollowers` or `hideFollowing` boolean flags:
```javascript
function getEffectiveListVisibility(explicitVisibility, legacyBoolean) {
  if (explicitVisibility && ['public', 'followers', 'following', 'private'].includes(explicitVisibility)) {
    return explicitVisibility;
  }
  return legacyBoolean ? 'private' : 'public';
}
```
Existing databases migrate smoothly without downtime or data corruption.

---

## 4. API Responses & Client UX Behavior

### Success Response (`HTTP 200 OK`)
```json
{
  "success": true,
  "data": [
    {
      "_id": "user_id",
      "username": "janedoe",
      "fullName": "Jane Doe",
      "avatar": "https://...",
      "profilePicture": "https://..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 142,
    "hasMore": true
  }
}
```

### Denial Response (`HTTP 403 Forbidden`)
```json
{
  "success": false,
  "message": "This account's followers list is private",
  "reason": "private_list"
}
```

### Client UI Representation
Both Web and Mobile render an explicit lock state:
- **Web (`FollowersPage.jsx` & `FollowingPage.jsx`)**: Displays centered `Lock` icon, title "This account's followers/following list is private", and explanatory text.
- **Mobile (`FollowersPage.tsx` & `FollowingPage.tsx`)**: Displays purple accented `Lock` badge, title "This account's followers/following list is private", and disables pagination loaders.
