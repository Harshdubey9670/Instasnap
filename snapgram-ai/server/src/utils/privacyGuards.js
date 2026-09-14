/**
 * privacyGuards.js — Phase T
 * ============================================================
 * Reusable server-side authorization helpers.
 *
 * These functions determine whether an authenticated viewer is
 * allowed to perform a given action.
 *
 * SECURITY RULES:
 *  - viewerId MUST come from req.user set by auth middleware.
 *  - Never accept a viewerId from req.body or req.query.
 *  - All block checks are bidirectional.
 *  - Owner always has access to their own data.
 * ============================================================
 */

'use strict';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Convert a Mongoose ObjectId or string to a plain string for comparison.
 */
const str = (id) => (id ? id.toString() : null);

/**
 * Check whether targetId appears in an array of ObjectIds/strings.
 */
const includes = (arr, targetId) =>
  Array.isArray(arr) && arr.some((id) => str(id) === str(targetId));

/**
 * Determine whether viewerId is blocked by profileOwner or has blocked them.
 * @param {string} viewerId
 * @param {object} profileOwner  — Mongoose User document (must have blockedUsers field)
 * @param {object} [viewer]      — Optional: Mongoose User document for the viewer
 */
const isBlocked = (viewerId, profileOwner, viewer = null) => {
  // Owner has blocked viewer
  if (includes(profileOwner.blockedUsers, viewerId)) return true;
  // Viewer has blocked owner
  if (viewer && includes(viewer.blockedUsers, str(profileOwner._id))) return true;
  return false;
};

// ─── Follower / Following List Visibility ────────────────────────────────────

/**
 * Determine effective visibility for a list, honouring the legacy boolean
 * migration rule:
 *   hideBool = true → 'private'
 *   else use the new enum (default 'public')
 *
 * @param {object} settings  — UserSettings document
 * @param {'followers'|'following'} listType
 * @returns {'public'|'followers'|'following'|'private'}
 */
const getEffectiveListVisibility = (settings, listType) => {
  if (!settings) return 'public';

  if (listType === 'followers') {
    // New enum field takes precedence if explicitly set
    const newVal = settings?.privacy?.followersListVisibility;
    if (newVal) return newVal;
    // Migrate legacy boolean
    return settings?.privacy?.hideFollowers === true ? 'private' : 'public';
  }

  // 'following'
  const newVal = settings?.privacy?.followingListVisibility;
  if (newVal) return newVal;
  return settings?.privacy?.hideFollowing === true ? 'private' : 'public';
};

/**
 * canViewFollowersList
 *
 * @param {string} viewerId              — from req.user (never from client body/query)
 * @param {object} profileOwner          — User document of the profile being visited
 * @param {object} ownerSettings         — UserSettings document for profileOwner
 * @param {object} [viewer]              — Optional: User document for the viewer (for block check)
 * @returns {{ allowed: boolean, reason: string }}
 */
const canViewFollowersList = (viewerId, profileOwner, ownerSettings, viewer = null) => {
  const ownerId = str(profileOwner._id);
  const vId = str(viewerId);

  // Owner always allowed
  if (ownerId === vId) return { allowed: true, reason: 'owner' };

  // Unauthenticated
  if (!vId) return { allowed: false, reason: 'unauthenticated' };

  // Block check (bidirectional)
  if (isBlocked(vId, profileOwner, viewer)) {
    return { allowed: false, reason: 'blocked' };
  }

  const visibility = getEffectiveListVisibility(ownerSettings, 'followers');

  switch (visibility) {
    case 'public':
      return { allowed: true, reason: 'public' };

    case 'followers':
      // Viewer must follow the profile owner
      if (includes(profileOwner.followers, vId)) {
        return { allowed: true, reason: 'is_follower' };
      }
      return { allowed: false, reason: 'not_a_follower' };

    case 'following':
      // Profile owner must follow the viewer
      if (includes(profileOwner.following, vId)) {
        return { allowed: true, reason: 'owner_follows_viewer' };
      }
      return { allowed: false, reason: 'owner_does_not_follow_viewer' };

    case 'private':
      return { allowed: false, reason: 'private_list' };

    default:
      return { allowed: true, reason: 'default_public' };
  }
};

/**
 * canViewFollowingList
 *
 * Same matrix as canViewFollowersList but for the following list.
 */
const canViewFollowingList = (viewerId, profileOwner, ownerSettings, viewer = null) => {
  const ownerId = str(profileOwner._id);
  const vId = str(viewerId);

  if (ownerId === vId) return { allowed: true, reason: 'owner' };
  if (!vId) return { allowed: false, reason: 'unauthenticated' };

  if (isBlocked(vId, profileOwner, viewer)) {
    return { allowed: false, reason: 'blocked' };
  }

  const visibility = getEffectiveListVisibility(ownerSettings, 'following');

  switch (visibility) {
    case 'public':
      return { allowed: true, reason: 'public' };

    case 'followers':
      if (includes(profileOwner.followers, vId)) {
        return { allowed: true, reason: 'is_follower' };
      }
      return { allowed: false, reason: 'not_a_follower' };

    case 'following':
      if (includes(profileOwner.following, vId)) {
        return { allowed: true, reason: 'owner_follows_viewer' };
      }
      return { allowed: false, reason: 'owner_does_not_follow_viewer' };

    case 'private':
      return { allowed: false, reason: 'private_list' };

    default:
      return { allowed: true, reason: 'default_public' };
  }
};

// ─── Download Permissions ────────────────────────────────────────────────────

/**
 * Resolve effective download permission for a Story.
 *
 * Priority:
 *   1. per-content  downloadPermission field ('allow'|'deny')
 *   2. account-wide allowStoryDownloads  (UserSettings)
 *   3. legacy story.allowDownload field
 *   4. default: allow
 *
 * @param {object} story          — Story document
 * @param {object} ownerSettings  — UserSettings document for story.user
 * @returns {boolean}
 */
const resolveStoryDownloadAllowed = (story, ownerSettings) => {
  const perContent = story.downloadPermission;
  if (perContent === 'allow') return true;
  if (perContent === 'deny')  return false;
  // 'use_account_default' or missing
  if (ownerSettings?.privacy?.allowStoryDownloads !== undefined) {
    return ownerSettings.privacy.allowStoryDownloads;
  }
  // Legacy field
  if (story.allowDownload !== undefined) return story.allowDownload;
  return true; // default allow
};

/**
 * Resolve effective download permission for a Reel.
 *
 * Priority:
 *   1. per-content  downloadPermission field
 *   2. account-wide allowReelDownloads
 *   3. legacy reel.downloadAllowed field (default false in old schema)
 *   4. default: allow (Phase T changes default to allow, legacy data keeps its value)
 *
 * @param {object} reel           — Reel document
 * @param {object} ownerSettings  — UserSettings document for reel.user
 * @returns {boolean}
 */
const resolveReelDownloadAllowed = (reel, ownerSettings) => {
  const perContent = reel.downloadPermission;
  if (perContent === 'allow') return true;
  if (perContent === 'deny')  return false;
  // 'use_account_default' or missing
  if (ownerSettings?.privacy?.allowReelDownloads !== undefined) {
    return ownerSettings.privacy.allowReelDownloads;
  }
  // Legacy field — respect existing creator choice (false = deny)
  if (reel.downloadAllowed !== undefined) return reel.downloadAllowed;
  return true; // default allow for new content
};

/**
 * canDownloadStory
 *
 * @param {string} viewerId       — from req.user
 * @param {object} story          — Story document (user field must be populated or raw id)
 * @param {object} storyAuthor    — User document for story.user
 * @param {object} ownerSettings  — UserSettings for storyAuthor
 * @param {object} [viewer]       — Optional: User document for viewer (for block check)
 * @returns {{ allowed: boolean, reason: string }}
 */
const canDownloadStory = (viewerId, story, storyAuthor, ownerSettings, viewer = null) => {
  const authorId = str(storyAuthor._id);
  const vId = str(viewerId);

  if (!vId) return { allowed: false, reason: 'unauthenticated' };

  // Blocked — never
  if (isBlocked(vId, storyAuthor, viewer)) {
    return { allowed: false, reason: 'blocked' };
  }

  // Check download permission (creator setting)
  const downloadAllowed = resolveStoryDownloadAllowed(story, ownerSettings);

  // Owner can always download their own story (regardless of public setting)
  if (authorId === vId) {
    return { allowed: true, reason: 'owner' };
  }

  if (!downloadAllowed) {
    return { allowed: false, reason: 'creator_disabled' };
  }

  return { allowed: true, reason: 'permitted' };
};

/**
 * canDownloadReel
 *
 * @param {string} viewerId       — from req.user
 * @param {object} reel           — Reel document
 * @param {object} reelAuthor     — User document for reel.user
 * @param {object} ownerSettings  — UserSettings for reelAuthor
 * @param {object} [viewer]       — Optional: User document for viewer
 * @returns {{ allowed: boolean, reason: string }}
 */
const canDownloadReel = (viewerId, reel, reelAuthor, ownerSettings, viewer = null) => {
  const authorId = str(reelAuthor._id);
  const vId = str(viewerId);

  if (!vId) return { allowed: false, reason: 'unauthenticated' };

  if (isBlocked(vId, reelAuthor, viewer)) {
    return { allowed: false, reason: 'blocked' };
  }

  const downloadAllowed = resolveReelDownloadAllowed(reel, ownerSettings);

  if (authorId === vId) {
    return { allowed: true, reason: 'owner' };
  }

  if (!downloadAllowed) {
    return { allowed: false, reason: 'creator_disabled' };
  }

  return { allowed: true, reason: 'permitted' };
};

// ─── Private Account Content Guard ───────────────────────────────────────────

/**
 * canViewPrivateProfileContent
 *
 * For private accounts: only the owner and approved followers can access content.
 *
 * @param {string} viewerId     — from req.user
 * @param {object} profileOwner — User document
 * @returns {boolean}
 */
const canViewPrivateProfileContent = (viewerId, profileOwner) => {
  const ownerId = str(profileOwner._id);
  const vId = str(viewerId);

  if (ownerId === vId) return true;
  if (!profileOwner.isPrivate) return true;
  // Must be an approved follower
  return includes(profileOwner.followers, vId);
};

// ─── Exports ─────────────────────────────────────────────────────────────────

module.exports = {
  canViewFollowersList,
  canViewFollowingList,
  canDownloadStory,
  canDownloadReel,
  canViewPrivateProfileContent,
  resolveStoryDownloadAllowed,
  resolveReelDownloadAllowed,
  getEffectiveListVisibility,
  // Export helpers for testing
  _isBlocked: isBlocked,
  _str: str,
  _includes: includes,
};
