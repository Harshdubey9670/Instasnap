# InstaSnap AI — Public / Private Profile Access Hardening Specification
**Document Version:** 1.0.0-Phase-T  
**Standard:** Enterprise Security & Privacy Compliance  

---

## 1. Overview & Objectives

This specification details the hardened architecture governing Public and Private profile accounts in InstaSnap AI. It eliminates Indirect Object Reference (IDOR) vulnerabilities, prevents graph enumeration, and ensures deterministic client states when traversing profile boundaries.

---

## 2. Profile Access Architecture

### 2.1 Schema Definition
In `User.js`, every user has an `isPrivate: Boolean` flag (default `false`).
In `UserSettings.js`, user-controlled privacy configurations are held in `privacy: { ... }`.

### 2.2 Endpoint Sanitization (`GET /api/users/:id`)
When any client requests a user profile:
1. **Authentication Check**: Request must carry a valid JWT token (`protect` middleware).
2. **Bidirectional Block Verification**:
   - Verify if `owner.blockedUsers.includes(viewerId)`
   - Verify if `viewer.blockedUsers.includes(ownerId)`
   - If either is true: immediately terminate with `HTTP 403 Forbidden: { success: false, message: 'Profile not accessible' }`.
3. **Data Scrubbing (IDOR Elimination)**:
   - **Non-Owners NEVER receive arrays of `followers` or `following` ObjectIds**.
   - Instead, the server computes and returns scalar integers:
     - `followersCount: (user.followers || []).length`
     - `followingCount: (user.following || []).length`
   - Relational metadata needed for the UI is evaluated server-side:
     - `isFollowing: Boolean` (whether viewer follows owner)
     - `isFollowedBy: Boolean` (whether owner follows viewer)
     - `hasPendingRequest: Boolean` (whether viewer has a pending follow request)
   - Profile owners viewing their own profile receive their full relational sets to facilitate internal management.

---

## 3. Private Account Content Gating

When `isPrivate === true`:
1. **Follow Logic**: Clicking "Follow" transitions to `hasPendingRequest: true` (creating an entry in `user.followRequests`). No content is unlocked until the account owner explicitly approves the request via `/api/users/requests/:id/accept`.
2. **Posts**: Non-followers receive `posts: []` and an `isPrivate: true` signal.
3. **Stories**: Ephemeral stories are invisible to non-followers unless the viewer is explicitly an approved follower.
4. **Highlights**: Highlight reels are locked behind follower approval.

---

## 4. Error Handling & Client Parity

Both Web (`ProfilePage.jsx`) and Mobile (`ProfilePage.tsx`) follow identical state machine flows:
- If `isBlocked`: Show "Account unavailable / User not found" error placeholder.
- If `isPrivate && !isFollowing && !isOwner`:
  - Show user header (avatar, username, followersCount, followingCount, bio).
  - Show "This Account is Private" lock banner.
  - Render "Follow" / "Requested" button.
  - Suppress posts grid, reels tab, and tagged tab.
