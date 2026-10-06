# SnapGram AI / InstaSnap — Session & Token Architecture & Migration Guide

## Overview

As part of the production security audit, session and authentication handling has been upgraded to prevent token leakage, protect against Cross-Site Scripting (XSS), implement Cross-Site Request Forgery (CSRF) defenses, and enforce real-time session revocation.

---

## 1. Key Architectural Changes

### Plaintext Session Removal & Hashing (H-1 & C-3)
- **Previous behavior:** Raw JWT tokens were stored directly as plaintext strings inside `User.sessions[].token`. Any database read or query breach exposed every active session token.
- **New behavior:** Only cryptographic SHA-256 hashes of the session tokens are stored:
  ```js
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  ```
- The `authController` hashes tokens prior to adding them to `user.sessions`.
- The `sessions` field is marked `select: false` or stripped by default from `req.user` queries, preventing exposure via `/api/auth/me` or other user endpoints.

### Real-Time Session Revocation (H-1, H-2)
- On every protected request, `authMiddleware.js`:
  1. Extracts the token from either the `token` HttpOnly cookie or the `Authorization: Bearer <token>` header.
  2. Verifies the cryptographic JWT signature against `JWT_SECRET`.
  3. Computes the SHA-256 hash of the received token.
  4. Checks that the user's document in MongoDB has an active session matching the hash.
  5. If the session has been revoked via `logout`, `logoutSession`, or `logoutAllSessions`, the request is immediately rejected with `401 Not authorized, session has been revoked or expired`.

### Web Client HttpOnly Cookies & CSRF Protection (C-3, OWASP)
- **Cookies:** On successful login, signup, OTP verification, or Google auth, the server sets:
  - `token`: `HttpOnly`, `Secure` (in production), `SameSite: 'lax'` (or `'none'` if cross-origin HTTPS), `maxAge: 30 days`.
  - `csrf-token`: readable cookie containing a cryptographically random token.
- **CSRF Defense:** For mutating HTTP methods (`POST`, `PUT`, `PATCH`, `DELETE`) authenticated via cookies without a `Bearer` header, `authMiddleware.js` verifies that the `X-CSRF-Token` request header matches the `csrf-token` cookie (double-submit cookie pattern).
- **Client API Interceptor:** `client/src/services/api.js` automatically reads the `csrf-token` cookie and attaches it as `X-CSRF-Token` on every request.

### Native Mobile App Preservation
- The mobile app (`mobile/`) continues to store tokens securely via `authStorage` (using SecureStore / AsyncStorage) and transmits them via `Authorization: Bearer <token>`.
- The server seamlessly supports both web cookie credentials and mobile `Bearer` tokens without breaking mobile clients.

---

## 2. Token & Session Invalidation and Migration Strategy

### Transparent Rolling Migration (No User Logout Required)
`authMiddleware.js` includes backwards-compatible inspection for existing sessions created prior to this rollout:
1. When a user sends their existing token, the middleware checks for matching hashed tokens.
2. If not found, it checks if `user.sessions` contains the legacy unhashed token string (`s.token === token`).
3. If a match is found, the middleware **automatically migrates** that session by replacing the plaintext token with its SHA-256 hash in MongoDB and updating `lastActive`.
4. Subsequent requests will match the hash directly.

### Enforced Global Invalidation (Optional Operator Action)
If your security policy requires invalidating all sessions created prior to this security release:
```javascript
// Connect to MongoDB shell and run:
use snapgram;
db.users.updateMany({}, { $set: { sessions: [] } });
```
This will require all existing users to log in again, immediately ensuring that no legacy tokens exist in active use.

---

## 3. Verified Session Endpoints

| Endpoint | Method | Access | Description |
|---|---|---|---|
| `/api/auth/sessions` | `GET` | Private | Returns list of user's active sessions (device, IP, lastActive) without exposing token hashes |
| `/api/auth/logout` | `POST` | Private | Revokes current session from DB and clears `token` and `csrf-token` cookies |
| `/api/auth/sessions` | `DELETE` | Private | Revokes all sessions except the current one |
| `/api/auth/sessions/:sessionId` | `DELETE` | Private | Revokes a specific session by ID |
| `/api/auth/change-password` | `PUT` | Private | Changes password and preserves current session |
| `/api/auth/reset-password` | `POST` | Public | Resets password with verified OTP and invalidates all previous sessions |
