# ⚡ INSTASNAP — Master Real-Time Socket Parity Matrix

> **Server Source**: `server/src/socket/index.js` & `server/src/controllers/`  
> **Client Source**: `client/src/contexts/SocketContext.jsx` & `client/src/components/`  
> **Mobile Source**: `mobile/src/contexts/SocketContext.tsx` & `mobile/src/components/`

---

## 📡 Real-Time Socket Event Catalog

| # | Event Name | Direction | Sender | Receiver | Payload | UI / State Effect | Status |
|---|---|---|---|---|---|---|---|
| 1 | `getOnlineUsers` | Server → Client | Socket Server | All Connected Clients | `string[]` (User IDs) | Updates online green presence badges across chat and feed. | `FULL_PARITY` |
| 2 | `joinConversation` | Client → Server | Active Chat User | Socket Server | `conversationId` | Joins room `conv_${conversationId}`, updates presence list. | `FULL_PARITY` |
| 3 | `leaveConversation` | Client → Server | Chat User Navigating Away | Socket Server | `conversationId` | Leaves room, broadcasts updated presence list. | `FULL_PARITY` |
| 4 | `conversationPresenceUpdate` | Server → Client | Socket Server | Room `conv_${convId}` | `string[]` (User IDs viewing chat) | Reanimated bouncing avatar appears in active chat header. | `FULL_PARITY` |
| 5 | `typing` | Client → Server → Client | Typing User | Room `conv_${convId}` | `{ userId, conversationId }` | Renders animated 3-dot typing bubble next to user's avatar. | `FULL_PARITY` |
| 6 | `stopTyping` | Client → Server → Client | Typing User (Idle) | Room `conv_${convId}` | `{ userId, conversationId }` | Removes typing bubble animation with smooth exit transition. | `FULL_PARITY` |
| 7 | `newMessage` | Server → Client | `messageController` / `storyController` | Conversation Participants | `Message` JSON + `clientMessageId` | Appends message into conversation FlatList, deduplicates, triggers sound. | `FULL_PARITY` |
| 8 | `messagesSeen` | Server → Client | `messageController` | Other Chat Participant | `{ conversationId }` | Updates message status checks to double blue checkmarks (Seen). | `FULL_PARITY` |
| 9 | `markDelivered` | Client → Server | Message Recipient | Socket Server | `{ messageId, senderId }` | Updates message status in DB to delivered. | `FULL_PARITY` |
| 10 | `messageDelivered` | Server → Client | Socket Server | Message Sender | `{ messageId }` | Updates checkmark icon to double grey checkmarks. | `FULL_PARITY` |
| 11 | `snapOpened` | Server → Client | `messageController` | Snap Sender | `{ messageId, openedBy, openedAt }` | Marks snap as opened with hollow purple icon in chat stream. | `FULL_PARITY` |
| 12 | `snapExpired` | Server → Client | `messageController` | Room `conv_${convId}` | `{ messageId }` | Auto-closes snap viewer modal, displays "Expired" label. | `FULL_PARITY` |
| 13 | `chatScreenshot` | Client → Server | Screenshot Taker | Socket Server | `{ conversationId, receiverId }` | Triggers real-time notification to the other participant. | `FULL_PARITY` |
| 14 | `chatScreenshotNotification`| Server → Client | Socket Server | Chat Recipient | `{ conversationId, takenBy, takenAt }` | Displays in-chat alert banner and system toast: "📷 Screenshot Taken!". | `FULL_PARITY` |
| 15 | `screenshotNotification` | Server → Client | `messageController` | Snap Sender | `{ messageId, takenBy, takenAt }` | Appends warning badge to disappearing snap in chat log. | `FULL_PARITY` |
| 16 | `follow_request` | Server → Client | `userController` | Private Profile User | `{ senderId, senderUsername, message }` | Increments notification badge, updates request cards list. | `FULL_PARITY` |
| 17 | `follow_accepted` | Server → Client | `userController` | Requester | `{ acceptorId, acceptorUsername, message }` | Pushes real-time notification toast and updates relationship status. | `FULL_PARITY` |
| 18 | `notification_count_update`| Server → Client | `userController` | Recipient | `{ delta: 1 }` | Increments unread notifications count in Redux store. | `FULL_PARITY` |
| 19 | `postDeleted` | Server → Client | `postController` | All Connected Clients | `{ postId }` | Removes deleted post from active feed and search grids. | `FULL_PARITY` |
| 20 | `join-live` | Client → Server | Stream Viewer | Socket Server | `{ streamId }` | Joins live stream room `live_${streamId}`. | `FULL_PARITY` |
| 21 | `leave-live` | Client → Server | Stream Viewer | Socket Server | `{ streamId }` | Leaves live stream room, decrements viewer count. | `FULL_PARITY` |
| 22 | `viewer-joined` | Server → Client | Socket Server | Live Host Socket | `{ viewerId, userId }` | Host instantiates `RTCPeerConnection` and initiates SDP offer. | `FULL_PARITY` |
| 23 | `viewer-left` | Server → Client | Socket Server | Live Host Socket | `{ viewerId, userId }` | Host closes and cleans up viewer's peer connection. | `FULL_PARITY` |
| 24 | `webrtc-offer` | Client ↔ Client | Live Host / Viewer | Target Peer Socket | `{ caller, offer, streamId }` | Sets remote description and returns WebRTC SDP answer. | `FULL_PARITY` |
| 25 | `webrtc-answer` | Client ↔ Client | Viewer | Host Socket | `{ caller, answer, streamId }` | Completes WebRTC peer handshake. | `FULL_PARITY` |
| 26 | `webrtc-ice-candidate` | Client ↔ Client | Host / Viewer | Target Peer Socket | `{ caller, candidate, streamId }`| Exchanges ICE candidates for NAT traversal. | `FULL_PARITY` |
| 27 | `live-chat-message` | Client ↔ Client | Host / Viewer | Room `live_${streamId}` | `{ user, text, timestamp }` | Broadcasts real-time chat overlay message on live video. | `FULL_PARITY` |
| 28 | `live-like` | Client ↔ Client | Viewer | Room `live_${streamId}` | `{ userId }` | Broadcasts animated floating heart reaction on live video. | `FULL_PARITY` |
