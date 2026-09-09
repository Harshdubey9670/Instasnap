# API & Socket.IO Contracts

## Base URL
```
EXPO_PUBLIC_API_URL=http://localhost:5001   (development)
```
Auth header: `Authorization: Bearer <jwt_token>`  
Token stored via: `expo-secure-store` (see `mobile/src/utils/authStorage.ts`)

---

## Admin API Endpoints (for AdminDashboardPage)

| Method | URL | Auth | Request | Response |
|---|---|---|---|---|
| GET | `/api/admin/metrics` | admin | — | `{ data: { totalUsers, totalPosts, pendingReports, totalRevenueUSD } }` |
| GET | `/api/admin/users` | admin | `?search=` | `{ data: User[] }` |
| PUT | `/api/admin/users/:id` | admin | `{ isBanned?, isVerified?, role? }` | `{ data: User }` |
| GET | `/api/admin/reports` | admin | — | `{ data: Report[] }` |
| PUT | `/api/admin/reports/:id` | admin | `{ actionTaken, removeContent }` | `{ data: Report }` |
| GET | `/api/admin/audit-logs` | admin | — | `{ data: AuditLog[] }` |
| POST | `/api/admin/broadcast-notification` | admin | `{ title, message }` | `{ message: "..." }` |
| GET | `/api/admin/system-config` | admin | — | `{ data: { featureFlags, maintenanceMode } }` |
| PUT | `/api/admin/system-config` | admin | `{ featureFlags?, maintenanceMode? }` | `{ data: SystemConfig }` |

---

## Creator API Endpoints (for CreatorStudioPage)

| Method | URL | Auth | Request | Response |
|---|---|---|---|---|
| GET | `/api/creator/overview` | user | `?timeframe=30d` | `{ data: { summary: { reach, impressions, watchTimeHours, profileVisits } } }` |
| GET | `/api/creator/insights` | user | `?timeframe=30d` | `{ data: { timeSeries: Array<{ date, impressions }> } }` |
| GET | `/api/creator/audience` | user | — | `{ data: { genderBreakdown, ageDistribution, topLocations, peakActiveHours } }` |
| GET | `/api/creator/content` | user | `?type=all\|posts\|reels\|stories` | `{ data: { posts, reels, stories } }` |
| GET | `/api/creator/content-manager` | user | — | `{ data: { drafts, scheduled } }` |
| POST | `/api/creator/bulk-action` | user | `{ action: 'archive'\|'delete', ids: string[], contentType: 'post' }` | `{ data: ... }` |
| GET | `/api/creator/export` | user | — | CSV file download (use expo-linking or expo-file-system) |

---

## Monetization API Endpoints (for MonetizationDashboardPage)

| Method | URL | Auth | Request | Response |
|---|---|---|---|---|
| GET | `/api/monetization/earnings` | user | — | `{ data: { summary: { pendingBalance, totalGrossEarnings, paidOut, revenueBreakdown }, monthlyTrends } }` |
| GET | `/api/monetization/affiliates` | user | — | `{ data: AffiliateLink[] }` |
| POST | `/api/monetization/affiliates` | user | `{ title, url }` | `{ data: AffiliateLink }` |
| GET | `/api/monetization/payouts` | user | — | `{ data: Payout[] }` |
| POST | `/api/monetization/request-payout` | user | `{ amount, paymentMethod }` | `{ data: Payout }` |
| GET | `/api/monetization/tax-info` | user | — | `{ data: TaxInfo }` |
| PUT | `/api/monetization/tax-info` | user | `{ legalName, taxIdType, taxId }` | `{ data: TaxInfo }` |

---

## Key Already-Implemented API Calls (for reference)

| Feature | Method | URL |
|---|---|---|
| Auth login | POST | `/api/auth/login` |
| Auth register | POST | `/api/auth/register` |
| Google OAuth | POST | `/api/auth/google` |
| Get current user | GET | `/api/auth/me` |
| Feed posts | GET | `/api/posts/feed?page=N&limit=5` |
| Stories | GET | `/api/stories` |
| User settings | GET | `/api/settings` |
| Update settings | PUT | `/api/settings` |
| Live streams | GET | `/api/live/streams` |
| Post detail | GET | `/api/posts/:id` |
| Comments | GET | `/api/comments/:postId` |
| Create comment | POST | `/api/comments` |
| Notifications | GET | `/api/notifications` |
| Mark read | PUT | `/api/notifications/mark-read` |
| Conversations | GET | `/api/conversations` |
| Messages | GET | `/api/messages/:conversationId` |
| Send message | POST | `/api/messages` |
| Vault items | GET | `/api/vault` |
| Search | GET | `/api/search?q=` |
| Explore | GET | `/api/search/explore` |
| Trending hashtags | GET | `/api/search/trending-hashtags` |
| Hashtag posts | GET | `/api/posts/hashtag/:tag` |
| Reels feed | GET | `/api/reels/feed` |

---

## Socket.IO Event Reference (Complete)

**Connection:** `io(API_URL, { auth: { token }, transports: ['websocket'] })`

### Events the SERVER emits to CLIENT

| Event | Payload | When |
|---|---|---|
| `getOnlineUsers` | `string[]` (userId array) | On user connect/disconnect |
| `newMessage` | `{ _id, sender: { _id, username }, content, ... }` | When any message is sent in a conversation the user is in |
| `messageDelivered` | `{ messageId }` | When recipient confirms delivery |
| `typing` | `{ userId, conversationId }` | When someone types |
| `stopTyping` | `{ userId, conversationId }` | When someone stops typing |
| `conversationPresenceUpdate` | `string[]` (userIds in conv) | When users join/leave conversation view |
| `chatScreenshotNotification` | `{ conversationId, takenBy, takenAt }` | When other user screenshots chat |
| `viewer-joined` | `{ viewerId, userId }` | When viewer joins live stream |
| `viewer-left` | `{ viewerId, userId }` | When viewer leaves live stream |
| `webrtc-offer` | `{ caller, offer, streamId }` | WebRTC signaling |
| `webrtc-answer` | `{ caller, answer, streamId }` | WebRTC signaling |
| `webrtc-ice-candidate` | `{ caller, candidate, streamId }` | WebRTC signaling |
| `live-chat-message` | `{ user: { _id, username, profilePicture }, text, timestamp }` | Live stream chat |
| `live-like` | `{ userId }` | Live stream like reaction |

### Events the CLIENT emits to SERVER

| Event | Payload | When |
|---|---|---|
| `markDelivered` | `{ messageId, senderId }` | When receiving a message from another user |
| `typing` | `conversationId` (string) | User starts typing |
| `stopTyping` | `conversationId` (string) | User stops typing |
| `joinConversation` | `conversationId` (string) | Open a chat screen |
| `leaveConversation` | `conversationId` (string) | Close a chat screen |
| `chatScreenshot` | `{ conversationId, receiverId }` | User takes screenshot in chat |
| `join-live` | `{ streamId }` | Viewer joins a live stream |
| `leave-live` | `{ streamId }` | Viewer leaves a live stream |
| `webrtc-offer` | `{ target, offer, streamId }` | WebRTC host → viewer signaling |
| `webrtc-answer` | `{ target, answer, streamId }` | WebRTC viewer → host signaling |
| `webrtc-ice-candidate` | `{ target, candidate, streamId }` | ICE candidate exchange |
| `live-chat-message` | `{ streamId, text }` | Send message in live stream |
| `live-like` | `{ streamId }` | React with like in live stream |

### Room Naming Convention
- Personal room: `userId` (string)
- Conversation room: `conv_${conversationId}`
- Live stream room: `live_${streamId}`
