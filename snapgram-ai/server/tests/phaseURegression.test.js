'use strict';

/**
 * phaseURegression.test.js
 * Comprehensive Step 3 - Step 7 Phase U Runtime Regression Test Suite
 * Validates:
 * - Step 3: Followers & Following list visibility for Users A, B, C, D, E across all 4 visibility settings
 * - Step 4: Profile privacy & IDOR protection across public, private, approved, pending, blocked viewers
 * - Step 5: Story download permission cascading, expiry, blocks, and owner access
 * - Step 6: Reel download permission cascading, blocks, and owner access
 * - Step 7: Real-time Socket.IO alerts and 60-second notification deduplication
 */

jest.mock('../src/models/User');
jest.mock('../src/models/UserSettings');
jest.mock('../src/models/Story');
jest.mock('../src/models/Reel');
jest.mock('../src/models/Notification');
jest.mock('../src/socket', () => ({
  getIo: jest.fn(),
}));

const User = require('../src/models/User');
const UserSettings = require('../src/models/UserSettings');
const Story = require('../src/models/Story');
const Reel = require('../src/models/Reel');
const Notification = require('../src/models/Notification');
const { getIo } = require('../src/socket');

const { getFollowers, getFollowing, getUserProfile } = require('../src/controllers/userController');
const { downloadStory } = require('../src/controllers/storyController');
const { downloadReel } = require('../src/controllers/reelController');

describe('Phase U Runtime Regression Test Suite', () => {
  let mockIo;

  beforeEach(() => {
    jest.clearAllMocks();
    mockIo = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };
    getIo.mockReturnValue(mockIo);
  });

  // ============================================================================
  // STEP 3: FOLLOWER & FOLLOWING LIST VISIBILITY
  // User A = Owner ('user_A')
  // User B = Follower of A ('user_B')
  // User C = Person A follows ('user_C')
  // User D = Unrelated user ('user_D')
  // User E = Blocked user ('user_E')
  // ============================================================================
  describe('Step 3: Follower and Following List Visibility Matrix', () => {
    const userA = {
      _id: 'user_A',
      username: 'alice_owner',
      followers: ['user_B'],
      following: ['user_C'],
      blockedUsers: ['user_E'],
    };

    const runListEndpoint = async (handler, targetId, viewerId, visibilitySetting) => {
      const req = {
        params: { id: targetId },
        query: { page: 1, limit: 10 },
        user: { _id: viewerId, id: viewerId },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const next = jest.fn();

      User.findById.mockImplementation((id) => {
        const idStr = id?.toString();
        if (idStr === 'user_A') {
          return { select: jest.fn().mockResolvedValue({ ...userA }) };
        }
        if (idStr === 'user_E') {
          return { select: jest.fn().mockResolvedValue({ _id: 'user_E', blockedUsers: [] }) };
        }
        return { select: jest.fn().mockResolvedValue({ _id: idStr, blockedUsers: [] }) };
      });

      UserSettings.findOne.mockResolvedValue({
        privacy: {
          followersListVisibility: visibilitySetting,
          followingListVisibility: visibilitySetting,
        },
      });

      User.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ _id: 'sample_user', username: 'sample' }]),
      });
      User.countDocuments.mockResolvedValue(1);

      await handler(req, res, next);
      return { status: res.status.mock.calls[0]?.[0], body: res.json.mock.calls[0]?.[0] };
    };

    test('Followers List: Owner A is always allowed regardless of setting', async () => {
      const res = await runListEndpoint(getFollowers, 'user_A', 'user_A', 'private');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('Followers List: PUBLIC allows B, C, D; blocks E', async () => {
      expect((await runListEndpoint(getFollowers, 'user_A', 'user_B', 'public')).status).toBe(200);
      expect((await runListEndpoint(getFollowers, 'user_A', 'user_C', 'public')).status).toBe(200);
      expect((await runListEndpoint(getFollowers, 'user_A', 'user_D', 'public')).status).toBe(200);
      const blockedRes = await runListEndpoint(getFollowers, 'user_A', 'user_E', 'public');
      expect(blockedRes.status).toBe(403);
      expect(blockedRes.body.reason).toBe('blocked');
    });

    test('Followers List: FOLLOWERS allows B, denies C and D', async () => {
      expect((await runListEndpoint(getFollowers, 'user_A', 'user_B', 'followers')).status).toBe(200);
      const resC = await runListEndpoint(getFollowers, 'user_A', 'user_C', 'followers');
      expect(resC.status).toBe(403);
      expect(resC.body.reason).toBe('not_a_follower');
      const resD = await runListEndpoint(getFollowers, 'user_A', 'user_D', 'followers');
      expect(resD.status).toBe(403);
      expect(resD.body.reason).toBe('not_a_follower');
    });

    test('Followers List: FOLLOWING allows C, denies B and D', async () => {
      expect((await runListEndpoint(getFollowers, 'user_A', 'user_C', 'following')).status).toBe(200);
      const resB = await runListEndpoint(getFollowers, 'user_A', 'user_B', 'following');
      expect(resB.status).toBe(403);
      expect(resB.body.reason).toBe('owner_does_not_follow_viewer');
      const resD = await runListEndpoint(getFollowers, 'user_A', 'user_D', 'following');
      expect(resD.status).toBe(403);
      expect(resD.body.reason).toBe('owner_does_not_follow_viewer');
    });

    test('Followers List: PRIVATE denies B, C, D', async () => {
      const resB = await runListEndpoint(getFollowers, 'user_A', 'user_B', 'private');
      expect(resB.status).toBe(403);
      expect(resB.body.reason).toBe('private_list');
      const resC = await runListEndpoint(getFollowers, 'user_A', 'user_C', 'private');
      expect(resC.status).toBe(403);
      expect(resC.body.reason).toBe('private_list');
      const resD = await runListEndpoint(getFollowers, 'user_A', 'user_D', 'private');
      expect(resD.status).toBe(403);
      expect(resD.body.reason).toBe('private_list');
    });

    test('Following List: PUBLIC allows B, C, D; blocks E', async () => {
      expect((await runListEndpoint(getFollowing, 'user_A', 'user_B', 'public')).status).toBe(200);
      expect((await runListEndpoint(getFollowing, 'user_A', 'user_C', 'public')).status).toBe(200);
      expect((await runListEndpoint(getFollowing, 'user_A', 'user_D', 'public')).status).toBe(200);
      const blockedRes = await runListEndpoint(getFollowing, 'user_A', 'user_E', 'public');
      expect(blockedRes.status).toBe(403);
      expect(blockedRes.body.reason).toBe('blocked');
    });

    test('Following List: FOLLOWERS allows B, denies C and D', async () => {
      expect((await runListEndpoint(getFollowing, 'user_A', 'user_B', 'followers')).status).toBe(200);
      expect((await runListEndpoint(getFollowing, 'user_A', 'user_C', 'followers')).status).toBe(403);
      expect((await runListEndpoint(getFollowing, 'user_A', 'user_D', 'followers')).status).toBe(403);
    });

    test('Following List: FOLLOWING allows C, denies B and D', async () => {
      expect((await runListEndpoint(getFollowing, 'user_A', 'user_C', 'following')).status).toBe(200);
      expect((await runListEndpoint(getFollowing, 'user_A', 'user_B', 'following')).status).toBe(403);
      expect((await runListEndpoint(getFollowing, 'user_A', 'user_D', 'following')).status).toBe(403);
    });

    test('Following List: PRIVATE denies B, C, D', async () => {
      expect((await runListEndpoint(getFollowing, 'user_A', 'user_B', 'private')).status).toBe(403);
      expect((await runListEndpoint(getFollowing, 'user_A', 'user_C', 'private')).status).toBe(403);
      expect((await runListEndpoint(getFollowing, 'user_A', 'user_D', 'private')).status).toBe(403);
    });
  });

  // ============================================================================
  // STEP 4: PROFILE PRIVACY & IDOR VERIFICATION
  // ============================================================================
  describe('Step 4: Profile Privacy & IDOR Prevention', () => {
    const createTargetProfile = (overrides = {}) => ({
      _id: 'target_id',
      username: 'target_user',
      fullName: 'Target User',
      bio: 'Target bio',
      isPrivate: false,
      followers: ['follower_1', 'follower_2', 'follower_3'],
      following: ['following_1', 'following_2'],
      blockedUsers: [],
      mutedUsers: ['muted_1'],
      savedPosts: ['post_1', 'post_2'],
      followRequests: ['pending_1'],
      ...overrides,
    });

    const runGetProfile = async (targetUser, viewerId, viewerBlocked = []) => {
      const req = {
        params: { id: targetUser._id },
        user: { _id: viewerId, id: viewerId },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const next = jest.fn();

      User.findById.mockImplementation((id) => {
        const idStr = id?.toString();
        if (idStr === targetUser._id) {
          return { select: jest.fn().mockResolvedValue(targetUser) };
        }
        if (idStr === viewerId) {
          return { select: jest.fn().mockResolvedValue({ _id: viewerId, blockedUsers: viewerBlocked }) };
        }
        return { select: jest.fn().mockResolvedValue(null) };
      });

      await getUserProfile(req, res, next);
      return { status: res.status.mock.calls[0]?.[0], body: res.json.mock.calls[0]?.[0] };
    };

    test('Non-owner profile MUST contain counts and relationship flags, MUST NOT leak full arrays', async () => {
      const target = createTargetProfile();
      const res = await runGetProfile(target, 'unrelated_viewer');

      expect(res.status).toBe(200);
      const data = res.body.data;
      // Must contain counts
      expect(data.followersCount).toBe(3);
      expect(data.followingCount).toBe(2);
      // Must contain flags
      expect(data.isFollowing).toBe(false);
      expect(data.isFollowedBy).toBe(false);
      expect(data.hasPendingRequest).toBe(false);
      expect(data.isBlocked).toBe(false);
      // MUST NOT leak raw arrays
      expect(data.followers).toBeUndefined();
      expect(data.following).toBeUndefined();
      expect(data.blockedUsers).toBeUndefined();
      expect(data.mutedUsers).toBeUndefined();
      expect(data.savedPosts).toBeUndefined();
      expect(data.followRequests).toBeUndefined();
    });

    test('Approved follower sees isFollowing=true, but still no raw arrays', async () => {
      const target = createTargetProfile({ followers: ['viewer_approved'] });
      const res = await runGetProfile(target, 'viewer_approved');

      expect(res.status).toBe(200);
      expect(res.body.data.isFollowing).toBe(true);
      expect(res.body.data.followers).toBeUndefined();
      expect(res.body.data.following).toBeUndefined();
    });

    test('Pending follower sees hasPendingRequest=true', async () => {
      const target = createTargetProfile({ followRequests: ['viewer_pending'] });
      const res = await runGetProfile(target, 'viewer_pending');

      expect(res.status).toBe(200);
      expect(res.body.data.hasPendingRequest).toBe(true);
      expect(res.body.data.isFollowing).toBe(false);
    });

    test('Blocked viewer receives 403 Profile not accessible', async () => {
      const target = createTargetProfile({ blockedUsers: ['viewer_blocked'] });
      const res = await runGetProfile(target, 'viewer_blocked');

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Profile not accessible');
    });

    test('Viewer who blocked target receives 403 Profile not accessible', async () => {
      const target = createTargetProfile();
      const res = await runGetProfile(target, 'viewer_who_blocked', ['target_id']);

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Profile not accessible');
    });

    test('Owner viewing own profile receives own relational arrays for management', async () => {
      const target = createTargetProfile({ _id: 'owner_me' });
      const req = {
        params: { id: 'owner_me' },
        user: { _id: 'owner_me', id: 'owner_me' },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const next = jest.fn();

      User.findById.mockImplementation((id) => {
        if (id?.toString() === 'owner_me') {
          return { select: jest.fn().mockResolvedValue(target) };
        }
        return { select: jest.fn().mockResolvedValue(null) };
      });

      await getUserProfile(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json.mock.calls[0][0].data.followers).toEqual(['follower_1', 'follower_2', 'follower_3']);
      expect(res.json.mock.calls[0][0].data.savedPosts).toEqual(['post_1', 'post_2']);
    });
  });

  // ============================================================================
  // STEP 5: STORY DOWNLOAD PERMISSION MATRIX
  // ============================================================================
  describe('Step 5: Story Download Matrix', () => {
    const authorUser = {
      _id: 'author_1',
      username: 'author_user',
      isPrivate: false,
      followers: ['viewer_1'],
      following: [],
      blockedUsers: [],
    };

    const runDownloadStoryTest = async ({
      viewerId = 'viewer_1',
      author = authorUser,
      accountSetting = true,
      storyDownloadPermission = 'use_account_default',
      isExpired = false,
      isBlocked = false,
    }) => {
      const req = {
        params: { id: 'story_100' },
        user: { _id: viewerId, id: viewerId },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const next = jest.fn();

      const storyDoc = {
        _id: 'story_100',
        user: author,
        media: [{ url: 'https://cdn.example.com/story.mp4', type: 'video' }],
        expiresAt: isExpired ? new Date(Date.now() - 60000) : new Date(Date.now() + 60000),
        privacy: 'public',
        downloadPermission: storyDownloadPermission,
      };

      Story.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(storyDoc),
      });
      UserSettings.findOne.mockResolvedValue({
        privacy: { allowStoryDownloads: accountSetting },
      });
      User.findById.mockImplementation((id) => {
        if (id?.toString() === viewerId) {
          return {
            select: jest.fn().mockResolvedValue({
              _id: viewerId,
              username: 'viewer_name',
              blockedUsers: isBlocked ? [author._id] : [],
            }),
          };
        }
        return { select: jest.fn().mockResolvedValue(null) };
      });

      Notification.findOne.mockResolvedValue(null);
      Notification.create.mockResolvedValue({ _id: 'notif_1' });

      await downloadStory(req, res, next);
      return { status: res.status.mock.calls[0]?.[0], body: res.json.mock.calls[0]?.[0] };
    };

    test('allowStoryDownloads = true + use_account_default -> 200 allowed', async () => {
      const res = await runDownloadStoryTest({ accountSetting: true, storyDownloadPermission: 'use_account_default' });
      expect(res.status).toBe(200);
      expect(res.body.data.downloadUrl).toBe('https://cdn.example.com/story.mp4');
    });

    test('allowStoryDownloads = false + use_account_default -> 403 denied', async () => {
      const res = await runDownloadStoryTest({ accountSetting: false, storyDownloadPermission: 'use_account_default' });
      expect(res.status).toBe(403);
      expect(res.body.reason).toBe('creator_disabled');
    });

    test('downloadPermission = allow overrides allowStoryDownloads = false -> 200 allowed', async () => {
      const res = await runDownloadStoryTest({ accountSetting: false, storyDownloadPermission: 'allow' });
      expect(res.status).toBe(200);
      expect(res.body.data.downloadUrl).toBe('https://cdn.example.com/story.mp4');
    });

    test('downloadPermission = deny overrides allowStoryDownloads = true -> 403 denied', async () => {
      const res = await runDownloadStoryTest({ accountSetting: true, storyDownloadPermission: 'deny' });
      expect(res.status).toBe(403);
      expect(res.body.reason).toBe('creator_disabled');
    });

    test('Blocked viewer is denied story download with 403', async () => {
      const blockedAuthor = { ...authorUser, blockedUsers: ['viewer_1'] };
      const res = await runDownloadStoryTest({ author: blockedAuthor });
      expect(res.status).toBe(403);
    });

    test('Expired story requested by non-owner -> 403', async () => {
      const res = await runDownloadStoryTest({ isExpired: true });
      expect(res.status).toBe(403);
      expect(res.body.message).toBe('This story has expired');
    });

    test('Owner downloading own expired story -> 200 allowed, no self-notification', async () => {
      const res = await runDownloadStoryTest({ viewerId: 'author_1', isExpired: true });
      expect(res.status).toBe(200);
      expect(Notification.create).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // STEP 6: REEL DOWNLOAD PERMISSION MATRIX
  // ============================================================================
  describe('Step 6: Reel Download Matrix', () => {
    const authorUser = {
      _id: 'author_reel',
      username: 'reel_creator',
      isPrivate: false,
      followers: [],
      following: [],
      blockedUsers: [],
    };

    const runDownloadReelTest = async ({
      viewerId = 'viewer_reel',
      author = authorUser,
      accountSetting = true,
      reelDownloadPermission = 'use_account_default',
      isBlocked = false,
    }) => {
      const req = {
        params: { id: 'reel_200' },
        user: { _id: viewerId, id: viewerId },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const next = jest.fn();

      const reelDoc = {
        _id: 'reel_200',
        user: author,
        video: { url: 'https://cdn.example.com/reel.mp4' },
        downloadPermission: reelDownloadPermission,
        downloadAllowed: false, // legacy flag
      };

      Reel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(reelDoc),
      });
      UserSettings.findOne.mockResolvedValue({
        privacy: { allowReelDownloads: accountSetting },
      });
      User.findById.mockImplementation((id) => {
        if (id?.toString() === viewerId) {
          return {
            select: jest.fn().mockResolvedValue({
              _id: viewerId,
              username: 'viewer_reel_name',
              blockedUsers: isBlocked ? [author._id] : [],
            }),
          };
        }
        return { select: jest.fn().mockResolvedValue(null) };
      });

      Notification.findOne.mockResolvedValue(null);
      Notification.create.mockResolvedValue({ _id: 'notif_reel' });

      await downloadReel(req, res, next);
      return { status: res.status.mock.calls[0]?.[0], body: res.json.mock.calls[0]?.[0] };
    };

    test('allowReelDownloads = true + use_account_default -> 200 allowed', async () => {
      const res = await runDownloadReelTest({ accountSetting: true, reelDownloadPermission: 'use_account_default' });
      expect(res.status).toBe(200);
      expect(res.body.data.downloadUrl).toBe('https://cdn.example.com/reel.mp4');
    });

    test('allowReelDownloads = false + use_account_default -> 403 denied', async () => {
      const res = await runDownloadReelTest({ accountSetting: false, reelDownloadPermission: 'use_account_default' });
      expect(res.status).toBe(403);
      expect(res.body.reason).toBe('creator_disabled');
    });

    test('downloadPermission = allow overrides allowReelDownloads = false -> 200 allowed', async () => {
      const res = await runDownloadReelTest({ accountSetting: false, reelDownloadPermission: 'allow' });
      expect(res.status).toBe(200);
      expect(res.body.data.downloadUrl).toBe('https://cdn.example.com/reel.mp4');
    });

    test('downloadPermission = deny overrides allowReelDownloads = true -> 403 denied', async () => {
      const res = await runDownloadReelTest({ accountSetting: true, reelDownloadPermission: 'deny' });
      expect(res.status).toBe(403);
      expect(res.body.reason).toBe('creator_disabled');
    });

    test('Blocked viewer is denied reel download with 403', async () => {
      const blockedAuthor = { ...authorUser, blockedUsers: ['viewer_reel'] };
      const res = await runDownloadReelTest({ author: blockedAuthor });
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    test('Owner downloading own reel -> 200 allowed, no notification emitted', async () => {
      const res = await runDownloadReelTest({ viewerId: 'author_reel' });
      expect(res.status).toBe(200);
      expect(Notification.create).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // STEP 7: DOWNLOAD NOTIFICATION & 60s DEDUPLICATION
  // ============================================================================
  describe('Step 7: Download Notification & 60s Deduplication Verification', () => {
    test('Story Download creates DB notification and emits Socket.IO new_notification', async () => {
      const author = { _id: 'author_alert', username: 'author_alert', blockedUsers: [] };
      const story = {
        _id: 'story_alert_1',
        user: author,
        media: [{ url: 'https://cdn.example.com/story.mp4', type: 'video' }],
        expiresAt: new Date(Date.now() + 60000),
        privacy: 'public',
        downloadPermission: 'allow',
      };

      Story.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(story) });
      UserSettings.findOne.mockResolvedValue({ privacy: { allowStoryDownloads: true } });
      User.findById.mockImplementation((id) => ({
        select: jest.fn().mockResolvedValue({ _id: id, username: 'downloader_bob', blockedUsers: [] }),
      }));

      Notification.findOne.mockResolvedValue(null);
      Notification.create.mockResolvedValue({ _id: 'notif_created_1' });

      const req = { params: { id: 'story_alert_1' }, user: { _id: 'downloader_1', id: 'downloader_1' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

      await downloadStory(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(200);
      expect(Notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'story_downloaded',
          recipient: 'author_alert',
          sender: 'downloader_1',
          contentId: 'story_alert_1',
        })
      );
      expect(mockIo.emit).toHaveBeenCalledWith(
        'new_notification',
        expect.objectContaining({
          type: 'story_downloaded',
          contentId: 'story_alert_1',
          senderUsername: 'downloader_bob',
        })
      );
    });

    test('Duplicate story download within 60s proceeds with 200 but SUPPRESSES duplicate notification & socket alert', async () => {
      const author = { _id: 'author_alert', username: 'author_alert', blockedUsers: [] };
      const story = {
        _id: 'story_alert_1',
        user: author,
        media: [{ url: 'https://cdn.example.com/story.mp4', type: 'video' }],
        expiresAt: new Date(Date.now() + 60000),
        privacy: 'public',
        downloadPermission: 'allow',
      };

      Story.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(story) });
      UserSettings.findOne.mockResolvedValue({ privacy: { allowStoryDownloads: true } });
      User.findById.mockImplementation((id) => ({
        select: jest.fn().mockResolvedValue({ _id: id, username: 'downloader_bob', blockedUsers: [] }),
      }));

      // SIMULATE EXISTING NOTIFICATION WITHIN 60 SECONDS
      Notification.findOne.mockResolvedValue({ _id: 'existing_recent_notif' });

      const req = { params: { id: 'story_alert_1' }, user: { _id: 'downloader_1', id: 'downloader_1' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

      await downloadStory(req, res, jest.fn());

      // Download still succeeds
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ downloadUrl: 'https://cdn.example.com/story.mp4' }),
        })
      );
      // But NO duplicate DB record and NO socket emit
      expect(Notification.create).not.toHaveBeenCalled();
      expect(mockIo.emit).not.toHaveBeenCalled();
    });

    test('Duplicate reel download within 60s proceeds with 200 but SUPPRESSES duplicate notification & socket alert', async () => {
      const author = { _id: 'author_alert', username: 'author_alert', blockedUsers: [] };
      const reel = {
        _id: 'reel_alert_1',
        user: author,
        video: { url: 'https://cdn.example.com/reel.mp4' },
        downloadPermission: 'allow',
      };

      Reel.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(reel) });
      UserSettings.findOne.mockResolvedValue({ privacy: { allowReelDownloads: true } });
      User.findById.mockImplementation((id) => ({
        select: jest.fn().mockResolvedValue({ _id: id, username: 'downloader_bob', blockedUsers: [] }),
      }));

      // SIMULATE EXISTING NOTIFICATION WITHIN 60 SECONDS
      Notification.findOne.mockResolvedValue({ _id: 'existing_recent_reel_notif' });

      const req = { params: { id: 'reel_alert_1' }, user: { _id: 'downloader_1', id: 'downloader_1' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

      await downloadReel(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(200);
      expect(Notification.create).not.toHaveBeenCalled();
      expect(mockIo.emit).not.toHaveBeenCalled();
    });
  });
});
