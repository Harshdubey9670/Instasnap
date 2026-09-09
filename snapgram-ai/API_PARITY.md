# 🌐 INSTASNAP — Master API Parity Matrix (`client/` vs `mobile/` vs `server/`)

> **Single Source of Truth**: `client/src/services/` & `server/src/routes/`  
> **Mobile Target**: `mobile/src/services/` & `mobile/src/services/api.ts`

---

## 1. Authentication & Session APIs (`/api/auth`)
| Method | Endpoint | Client Caller | Mobile Service | Server Controller | Status |
|---|---|---|---|---|---|
| `POST` | `/api/auth/register` | `pages/auth/SignupPage.jsx` | `authService.register` | `authController.register` | `FULL_PARITY` |
| `POST` | `/api/auth/login` | `pages/auth/LoginPage.jsx` | `authService.login` | `authController.login` | `FULL_PARITY` |
| `GET` | `/api/auth/me` | `store/authSlice.js` | `authService.getMe` | `authController.getMe` | `FULL_PARITY` |
| `POST` | `/api/auth/forgot-password` | `pages/auth/ForgotPasswordPage.jsx` | `authService.forgotPassword` | `authController.forgotPassword` | `FULL_PARITY` |
| `POST` | `/api/auth/reset-password` | `pages/auth/ResetPasswordPage.jsx` | `authService.resetPassword` | `authController.resetPassword` | `FULL_PARITY` |
| `PUT` | `/api/auth/change-password` | `components/settings/SecuritySettings.jsx` | `authService.changePassword` | `authController.changePassword` | `FULL_PARITY` |
| `GET` | `/api/auth/sessions` | `components/settings/SecuritySettings.jsx` | `authService.getSessions` | `authController.getSessions` | `FULL_PARITY` |
| `DELETE` | `/api/auth/sessions` | `components/settings/SecuritySettings.jsx` | `api.delete('/api/auth/sessions')` | `authController.logoutAllOtherSessions` | `FULL_PARITY` |
| `DELETE` | `/api/auth/sessions/:id` | `components/settings/SecuritySettings.jsx` | `api.delete('/api/auth/sessions/:id')` | `authController.logoutSession` | `FULL_PARITY` |

---

## 2. User & Social Graph APIs (`/api/users`)
| Method | Endpoint | Client Caller | Mobile Service | Server Controller | Status |
|---|---|---|---|---|---|
| `GET` | `/api/users/profile/:id` | `pages/user/ProfilePage.jsx` | `userService.getProfile` | `userController.getUserProfile` | `FULL_PARITY` |
| `PUT` | `/api/users/update` | `components/profile/EditProfileModal.jsx` | `userService.updateProfileJson` | `userController.updateUserProfile` | `FULL_PARITY` |
| `POST` | `/api/users/avatar` | `components/profile/EditProfileModal.jsx` | `userService.uploadAvatar` | `userController.uploadAvatar` | `FULL_PARITY` |
| `POST` | `/api/users/:id/follow` | `components/user/FollowButton.jsx` | `userService.toggleFollow` | `userController.toggleFollowUser` | `FULL_PARITY` |
| `GET` | `/api/users/:id/followers` | `pages/user/NetworkPage.jsx` | `userService.getFollowers` | `userController.getUserFollowers` | `FULL_PARITY` |
| `GET` | `/api/users/:id/following` | `pages/user/NetworkPage.jsx` | `userService.getFollowing` | `userController.getUserFollowing` | `FULL_PARITY` |
| `POST` | `/api/users/:id/block` | `components/profile/RelationshipActionsModal.jsx` | `userService.blockUser` | `userController.blockUser` | `FULL_PARITY` |
| `POST` | `/api/users/:id/mute` | `components/profile/RelationshipActionsModal.jsx` | `userService.muteUser` | `userController.muteUser` | `FULL_PARITY` |
| `POST` | `/api/users/:id/restrict` | `components/profile/RelationshipActionsModal.jsx` | `userService.restrictUser` | `userController.restrictUser` | `FULL_PARITY` |
| `POST` | `/api/users/:id/report` | `components/profile/RelationshipActionsModal.jsx` | `userService.reportUser` | `userController.reportUser` | `FULL_PARITY` |
| `GET` | `/api/users/suggested` | `components/user/SuggestedUsersCarousel.jsx` | `userService.getSuggested` | `userController.getSuggestedUsers` | `FULL_PARITY` |
| `GET` | `/api/users/follow-requests` | `pages/user/NotificationsPage.jsx` | `userService.getFollowRequests` | `userController.getFollowRequests` | `FULL_PARITY` |
| `POST` | `/api/users/follow-requests/:id/accept` | `pages/user/NotificationsPage.jsx` | `userService.acceptFollowRequest` | `userController.acceptFollowRequest` | `FULL_PARITY` |
| `POST` | `/api/users/follow-requests/:id/decline` | `pages/user/NotificationsPage.jsx` | `userService.declineFollowRequest` | `userController.declineFollowRequest` | `FULL_PARITY` |

---

## 3. Posts & Comments APIs (`/api/posts` & `/api/comments`)
| Method | Endpoint | Client Caller | Mobile Service | Server Controller | Status |
|---|---|---|---|---|---|
| `GET` | `/api/posts/feed` | `pages/user/FeedPage.jsx` | `postService.getFeed` | `postController.getFeedPosts` | `FULL_PARITY` |
| `POST` | `/api/posts` | `pages/user/CameraPage.jsx` | `postService.create` | `postController.createPost` | `FULL_PARITY` |
| `GET` | `/api/posts/:id` | `pages/user/PostDetailPage.jsx` | `postService.getById` | `postController.getPostById` | `FULL_PARITY` |
| `PUT` | `/api/posts/:id` | `components/post/EditPostModal.jsx` | `postService.update` | `postController.updatePost` | `FULL_PARITY` |
| `DELETE` | `/api/posts/:id` | `components/post/PostOptionsModal.jsx` | `postService.delete` | `postController.deletePost` | `FULL_PARITY` |
| `POST` | `/api/posts/:id/like` | `components/feed/PostCard.jsx` | `postService.toggleLike` | `postController.toggleLikePost` | `FULL_PARITY` |
| `POST` | `/api/posts/:id/save` | `components/feed/PostCard.jsx` | `postService.toggleSave` | `postController.toggleSavePost` | `FULL_PARITY` |
| `PUT` | `/api/posts/:id/archive` | `components/post/PostOptionsModal.jsx` | `postService.toggleArchive` | `postController.toggleArchivePost` | `FULL_PARITY` |
| `PUT` | `/api/posts/:id/pin` | `components/post/PostOptionsModal.jsx` | `postService.togglePin` | `postController.togglePinPost` | `FULL_PARITY` |
| `PUT` | `/api/posts/:id/settings` | `components/post/PostOptionsModal.jsx` | `postService.updateSettings` | `postController.updatePostSettings` | `FULL_PARITY` |
| `POST` | `/api/posts/:id/report` | `components/post/PostOptionsModal.jsx` | `postService.report` | `postController.reportPost` | `FULL_PARITY` |
| `POST` | `/api/posts/:id/hide` | `components/post/PostOptionsModal.jsx` | `postService.hide` | `postController.hidePost` | `FULL_PARITY` |
| `GET` | `/api/posts/user/:userId` | `pages/user/ProfilePage.jsx` | `postService.getUserPosts` | `postController.getUserPosts` | `FULL_PARITY` |
| `GET` | `/api/posts/saved` | `pages/user/ProfilePage.jsx` | `postService.getSavedPosts` | `postController.getSavedPosts` | `FULL_PARITY` |
| `GET` | `/api/posts/:id/comments` | `components/feed/CommentModal.jsx` | `commentService.getByPost` | `commentController.getPostComments` | `FULL_PARITY` |
| `POST` | `/api/posts/:id/comments` | `components/feed/CommentModal.jsx` | `commentService.create` | `commentController.addComment` | `FULL_PARITY` |
| `POST` | `/api/comments/:id/like` | `components/feed/CommentModal.jsx` | `commentService.toggleLike` | `commentController.toggleLikeComment` | `FULL_PARITY` |
| `DELETE` | `/api/comments/:id` | `components/feed/CommentModal.jsx` | `commentService.delete` | `commentController.deleteComment` | `FULL_PARITY` |
| `PUT` | `/api/comments/:id/pin` | `components/feed/CommentModal.jsx` | `commentService.togglePin` | `commentController.togglePinComment` | `FULL_PARITY` |
| `POST` | `/api/comments/:id/report` | `components/feed/CommentModal.jsx` | `commentService.report` | `commentController.reportComment` | `FULL_PARITY` |

---

## 4. Stories & Highlights APIs (`/api/stories`)
| Method | Endpoint | Client Caller | Mobile Service | Server Controller | Status |
|---|---|---|---|---|---|
| `GET` | `/api/stories` | `components/feed/StoriesRow.jsx` | `storyService.getAll` | `storyController.getFeedStories` | `FULL_PARITY` |
| `POST` | `/api/stories` | `pages/user/CreateStoryPage.jsx` | `storyService.create` | `storyController.createStory` | `FULL_PARITY` |
| `PUT` | `/api/stories/:id/view` | `components/feed/StoryViewer.jsx` | `storyService.markViewed` | `storyController.viewStory` | `FULL_PARITY` |
| `POST` | `/api/stories/:id/react` | `components/feed/StoryViewer.jsx` | `storyService.react` | `storyController.reactToStory` | `FULL_PARITY` |
| `POST` | `/api/stories/:id/reply` | `components/feed/StoryViewer.jsx` | `storyService.reply` | `storyController.replyToStory` | `FULL_PARITY` |
| `GET` | `/api/stories/:id/viewers` | `components/feed/StoryViewer.jsx` | `storyService.getViewers` | `storyController.getStoryViewers` | `FULL_PARITY` |
| `DELETE` | `/api/stories/:id` | `components/feed/StoryViewer.jsx` | `storyService.delete` | `storyController.deleteStory` | `FULL_PARITY` |
| `GET` | `/api/stories/archive` | `components/profile/StoryHighlightsRow.jsx` | `storyService.getArchive` | `storyController.getStoryArchive` | `FULL_PARITY` |
| `GET` | `/api/stories/highlights/:userId` | `components/profile/StoryHighlightsRow.jsx` | `storyService.getHighlights` | `storyController.getUserHighlights` | `FULL_PARITY` |
| `POST` | `/api/stories/highlights` | `components/profile/StoryHighlightsRow.jsx` | `storyService.createHighlight` | `storyController.createHighlight` | `FULL_PARITY` |
| `PUT` | `/api/stories/highlights/:id` | `components/profile/StoryHighlightsRow.jsx` | `storyService.updateHighlight` | `storyController.updateHighlight` | `FULL_PARITY` |
| `DELETE` | `/api/stories/highlights/:id` | `components/profile/StoryHighlightsRow.jsx` | `storyService.deleteHighlight` | `storyController.deleteHighlight` | `FULL_PARITY` |

---

## 5. Chat, Messages & Disappearing Snaps APIs (`/api/messages` & `/api/conversations`)
| Method | Endpoint | Client Caller | Mobile Service | Server Controller | Status |
|---|---|---|---|---|---|
| `GET` | `/api/conversations` | `pages/user/ChatPage.jsx` | `chatService.getConversations` | `conversationController.getUserConversations` | `FULL_PARITY` |
| `POST` | `/api/conversations` | `pages/user/ChatPage.jsx` | `chatService.createConversation` | `conversationController.getOrCreateConversation` | `FULL_PARITY` |
| `GET` | `/api/messages/:id` | `components/chat/ChatDetail.jsx` | `chatService.getMessages` | `messageController.getConversationMessages` | `FULL_PARITY` |
| `POST` | `/api/messages/:id` | `components/chat/ChatDetail.jsx` | `chatService.sendMessage` | `messageController.sendMessage` | `FULL_PARITY` |
| `POST` | `/api/messages/snap/:id/open` | `components/chat/SnapViewerModal.jsx` | `postService/api.post('/api/messages/snap/:id/open')` | `messageController.openSnap` | `FULL_PARITY` |
| `POST` | `/api/messages/snap/:id/screenshot` | `components/chat/SnapViewerModal.jsx` | `api.post('/api/messages/snap/:id/screenshot')` | `messageController.reportScreenshot` | `FULL_PARITY` |
| `POST` | `/api/messages/:id/react` | `components/chat/MessageBubble.jsx` | `api.post('/api/messages/:id/react')` | `messageController.reactMessage` | `FULL_PARITY` |
| `DELETE` | `/api/messages/:id` | `components/chat/MessageBubble.jsx` | `chatService.deleteMessage` | `messageController.deleteMessage` | `FULL_PARITY` |

---

## 6. Media Vault APIs (`/api/vault`)
| Method | Endpoint | Client Caller | Mobile Service | Server Controller | Status |
|---|---|---|---|---|---|
| `POST` | `/api/vault/verify-pin` | `services/vaultService.js` | `vaultService.verifyPin` | `vaultController.verifyPin` | `FULL_PARITY` |
| `POST` | `/api/vault/set-pin` | `services/vaultService.js` | `vaultService.setPin` | `vaultController.setPin` | `FULL_PARITY` |
| `GET` | `/api/vault/memories` | `services/vaultService.js` | `vaultService.getMemories` | `vaultController.getMemories` | `FULL_PARITY` |
| `POST` | `/api/vault/memories` | `services/vaultService.js` | `vaultService.addMemory` | `vaultController.addMemory` | `FULL_PARITY` |
| `PUT` | `/api/vault/memories/:id/favorite` | `services/vaultService.js` | `vaultService.toggleFavorite` | `vaultController.toggleFavorite` | `FULL_PARITY` |
| `DELETE` | `/api/vault/memories/:id` | `services/vaultService.js` | `vaultService.deleteMemory` | `vaultController.deleteMemory` | `FULL_PARITY` |
| `GET` | `/api/vault/trash` | `services/vaultService.js` | `vaultService.getTrash` | `vaultController.getTrash` | `FULL_PARITY` |
| `POST` | `/api/vault/restore/:id` | `services/vaultService.js` | `vaultService.restoreMemory` | `vaultController.restoreMemory` | `FULL_PARITY` |
| `GET` | `/api/vault/albums` | `services/vaultService.js` | `vaultService.getAlbums` | `vaultController.getAlbums` | `FULL_PARITY` |
| `POST` | `/api/vault/albums` | `services/vaultService.js` | `vaultService.createAlbum` | `vaultController.createAlbum` | `FULL_PARITY` |
| `POST` | `/api/vault/share-link` | `services/vaultService.js` | `vaultService.generateShareLink` | `vaultController.generateShareLink` | `FULL_PARITY` |

---

## 7. AI & Studio APIs (`/api/ai`)
| Method | Endpoint | Client Caller | Mobile Service | Server Controller | Status |
|---|---|---|---|---|---|
| `POST` | `/api/ai/assistant` | `services/aiService.js` | `aiService.chatAssistant` | `aiController.chatAssistant` | `FULL_PARITY` |
| `POST` | `/api/ai/generate-image` | `services/aiService.js` | `aiService.generateImage` | `aiController.generateImage` | `FULL_PARITY` |
| `POST` | `/api/ai/caption` | `services/aiService.js` | `aiService.generateCaption` | `aiController.generateCaption` | `FULL_PARITY` |
| `POST` | `/api/ai/hashtags` | `services/aiService.js` | `aiService.generateHashtags` | `aiController.generateHashtags` | `FULL_PARITY` |
| `POST` | `/api/ai/bio` | `services/aiService.js` | `aiService.generateBio` | `aiController.generateBio` | `FULL_PARITY` |
| `POST` | `/api/ai/usernames` | `services/aiService.js` | `aiService.suggestUsernames` | `aiController.suggestUsernames` | `FULL_PARITY` |
| `POST` | `/api/ai/post-ideas` | `services/aiService.js` | `aiService.generatePostIdeas` | `aiController.generatePostIdeas` | `FULL_PARITY` |
| `POST` | `/api/ai/translate` | `services/aiService.js` | `aiService.translateText` | `aiController.translateText` | `FULL_PARITY` |
| `POST` | `/api/ai/moderate` | `services/aiService.js` | `aiService.moderateContent` | `aiController.moderateContent` | `FULL_PARITY` |
| `POST` | `/api/ai/fake-account-check` | `services/aiService.js` | `aiService.detectFakeAccount` | `aiController.detectFakeAccount` | `FULL_PARITY` |
| `POST` | `/api/ai/alt-text` | `services/aiService.js` | `aiService.generateAltText` | `aiController.generateAltText` | `FULL_PARITY` |

---

## 8. Live, Creator, Monetization & Admin APIs
| Method | Endpoint | Client Caller | Mobile Service | Server Controller | Status |
|---|---|---|---|---|---|
| `POST` | `/api/live/start` | `services/liveService.js` | `liveService.start` | `liveController.startStream` | `FULL_PARITY` |
| `POST` | `/api/live/:id/end` | `services/liveService.js` | `liveService.end` | `liveController.endStream` | `FULL_PARITY` |
| `GET` | `/api/live/active` | `services/liveService.js` | `liveService.getActive` | `liveController.getActiveStreams` | `FULL_PARITY` |
| `GET` | `/api/live/:id` | `services/liveService.js` | `liveService.getStream` | `liveController.getStreamById` | `FULL_PARITY` |
| `GET` | `/api/creator/overview` | `services/creatorService.js` | `creatorService.getOverview` | `creatorController.getOverview` | `FULL_PARITY` |
| `GET` | `/api/creator/insights` | `services/creatorService.js` | `creatorService.getInsights` | `creatorController.getInsights` | `FULL_PARITY` |
| `GET` | `/api/creator/audience` | `services/creatorService.js` | `creatorService.getAudience` | `creatorController.getAudience` | `FULL_PARITY` |
| `GET` | `/api/creator/content` | `services/creatorService.js` | `creatorService.getContent` | `creatorController.getContent` | `FULL_PARITY` |
| `GET` | `/api/creator/content-manager`| `services/creatorService.js`| `creatorService.getDrafts` | `creatorController.getDrafts` | `FULL_PARITY` |
| `POST`| `/api/creator/bulk-action` | `services/creatorService.js` | `creatorService.bulkAction` | `creatorController.bulkAction` | `FULL_PARITY` |
| `GET` | `/api/monetization/earnings`| `services/monetizationService.js`| `monetizationService.getEarnings` | `monetizationController.getEarnings` | `FULL_PARITY` |
| `GET` | `/api/monetization/affiliates`| `services/monetizationService.js`| `monetizationService.getAffiliates` | `monetizationController.getAffiliates` | `FULL_PARITY` |
| `POST`| `/api/monetization/affiliates`| `services/monetizationService.js`| `monetizationService.addAffiliate` | `monetizationController.addAffiliate` | `FULL_PARITY` |
| `GET` | `/api/monetization/payouts` | `services/monetizationService.js`| `monetizationService.getPayouts` | `monetizationController.getPayouts` | `FULL_PARITY` |
| `POST`| `/api/monetization/payouts/request`| `services/monetizationService.js`| `monetizationService.requestPayout` | `monetizationController.requestPayout` | `FULL_PARITY` |
| `GET` | `/api/admin/metrics` | `services/adminService.js` | `adminService.getDashboard` | `adminController.getDashboardMetrics` | `FULL_PARITY` |
| `GET` | `/api/admin/users` | `services/adminService.js` | `adminService.getUsers` | `adminController.getUsersList` | `FULL_PARITY` |
| `PUT` | `/api/admin/users/:id` | `services/adminService.js` | `adminService.updateUserStatus` | `adminController.updateUserStatus` | `FULL_PARITY` |
| `DELETE`| `/api/admin/users/:id` | `pages/admin/AdminDashboardPage.jsx`| `adminService.deleteUser` | `adminController.deleteUser` | `FULL_PARITY` |
| `GET` | `/api/admin/reports` | `services/adminService.js` | `adminService.getReports` | `adminController.getModerationQueue` | `FULL_PARITY` |
| `PUT` | `/api/admin/reports/:id` | `services/adminService.js` | `adminService.resolveReport` | `adminController.resolveReport` | `FULL_PARITY` |
