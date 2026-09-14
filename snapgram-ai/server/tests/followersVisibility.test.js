'use strict';

/**
 * followersVisibility.test.js
 * Unit/Integration tests for getFollowers, getFollowing, and getUserProfile privacy enforcement
 */

jest.mock('../src/models/User');
jest.mock('../src/models/UserSettings');

const User = require('../src/models/User');
const UserSettings = require('../src/models/UserSettings');
const { getFollowers, getFollowing, getUserProfile } = require('../src/controllers/userController');

describe('User Privacy & Visibility Controller Tests', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      params: { id: 'target_user_id' },
      query: { page: 1, limit: 10 },
      user: { _id: 'viewer_user_id', id: 'viewer_user_id' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  describe('getFollowers', () => {
    it('returns 404 if target user is not found', async () => {
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await getFollowers(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'User not found' })
      );
    });

    it('returns 403 if target user has set followersListVisibility to private and viewer is not owner', async () => {
      const mockTarget = {
        _id: 'target_user_id',
        followers: ['someone_else'],
        following: [],
        blockedUsers: [],
        username: 'alice',
      };
      User.findById
        .mockReturnValueOnce({
          select: jest.fn().mockResolvedValue(mockTarget),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockResolvedValue({ blockedUsers: [] }),
        });

      UserSettings.findOne.mockResolvedValue({
        privacy: { followersListVisibility: 'private' },
      });

      await getFollowers(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "This account's followers list is private",
          reason: 'private_list',
        })
      );
    });

    it('returns 200 with followers if viewer is owner even if set to private', async () => {
      req.user._id = 'target_user_id';
      req.user.id = 'target_user_id';

      const mockTarget = {
        _id: 'target_user_id',
        followers: ['follower_1', 'follower_2'],
        following: [],
        blockedUsers: [],
        username: 'alice',
      };
      User.findById.mockReturnValueOnce({
        select: jest.fn().mockResolvedValue(mockTarget),
      });

      UserSettings.findOne.mockResolvedValue({
        privacy: { followersListVisibility: 'private' },
      });

      const mockFollowerUsers = [
        { username: 'bob', fullName: 'Bob', profilePicture: 'bob.jpg' },
      ];

      User.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockFollowerUsers),
      });
      User.countDocuments.mockResolvedValue(1);

      await getFollowers(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockFollowerUsers,
          pagination: expect.objectContaining({ total: 1 }),
        })
      );
    });

    it('returns 403 if viewer is blocked by target user', async () => {
      const mockTarget = {
        _id: 'target_user_id',
        followers: ['viewer_user_id'],
        following: [],
        blockedUsers: ['viewer_user_id'],
        username: 'alice',
      };
      User.findById
        .mockReturnValueOnce({
          select: jest.fn().mockResolvedValue(mockTarget),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockResolvedValue({ blockedUsers: [] }),
        });

      UserSettings.findOne.mockResolvedValue({
        privacy: { followersListVisibility: 'public' },
      });

      await getFollowers(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          reason: 'blocked',
        })
      );
    });
  });

  describe('getFollowing', () => {
    it('returns 403 if followingListVisibility is followers only and viewer is not a follower', async () => {
      const mockTarget = {
        _id: 'target_user_id',
        followers: ['someone_else'],
        following: ['celebrity_1'],
        blockedUsers: [],
        username: 'alice',
      };
      User.findById
        .mockReturnValueOnce({
          select: jest.fn().mockResolvedValue(mockTarget),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockResolvedValue({ blockedUsers: [] }),
        });

      UserSettings.findOne.mockResolvedValue({
        privacy: { followingListVisibility: 'followers' },
      });

      await getFollowing(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          reason: 'not_a_follower',
        })
      );
    });

    it('returns 200 with following list if viewer is in followers list', async () => {
      const mockTarget = {
        _id: 'target_user_id',
        followers: ['viewer_user_id'],
        following: ['celebrity_1'],
        blockedUsers: [],
        username: 'alice',
      };
      User.findById
        .mockReturnValueOnce({
          select: jest.fn().mockResolvedValue(mockTarget),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockResolvedValue({ blockedUsers: [] }),
        });

      UserSettings.findOne.mockResolvedValue({
        privacy: { followingListVisibility: 'followers' },
      });

      const mockFollowingUsers = [
        { username: 'celebrity', fullName: 'Celebrity' },
      ];

      User.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockFollowingUsers),
      });
      User.countDocuments.mockResolvedValue(1);

      await getFollowing(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockFollowingUsers,
        })
      );
    });
  });

  describe('getUserProfile IDOR protection', () => {
    it('does NOT expose full followers/following arrays to non-owners, returns counts only', async () => {
      const targetUser = {
        _id: 'target_user_id',
        fullName: 'Alice Wonder',
        username: 'alice',
        bio: 'Hello world',
        followers: ['user_a', 'user_b', 'user_c'],
        following: ['user_d', 'user_e'],
        blockedUsers: [],
        isPrivate: false,
        isVerified: true,
      };

      User.findById
        .mockReturnValueOnce({
          select: jest.fn().mockResolvedValue(targetUser),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockResolvedValue({ blockedUsers: [] }),
        });

      await getUserProfile(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      const jsonResponse = res.json.mock.calls[0][0];
      expect(jsonResponse.success).toBe(true);
      expect(jsonResponse.data.followersCount).toBe(3);
      expect(jsonResponse.data.followingCount).toBe(2);
      expect(jsonResponse.data.followers).toBeUndefined();
      expect(jsonResponse.data.following).toBeUndefined();
      expect(jsonResponse.data.isFollowing).toBe(false);
    });

    it('exposes followers/following arrays only when viewer is profile owner', async () => {
      req.user._id = 'target_user_id';
      req.user.id = 'target_user_id';

      const ownerUser = {
        _id: 'target_user_id',
        fullName: 'Alice Wonder',
        username: 'alice',
        email: 'alice@example.com',
        followers: ['user_a', 'user_b'],
        following: ['user_c'],
        blockedUsers: [],
        savedPosts: [],
      };

      User.findById.mockReturnValueOnce({
        select: jest.fn().mockResolvedValue(ownerUser),
      });

      await getUserProfile(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      const jsonResponse = res.json.mock.calls[0][0];
      expect(jsonResponse.success).toBe(true);
      expect(jsonResponse.data.followers).toEqual(['user_a', 'user_b']);
      expect(jsonResponse.data.following).toEqual(['user_c']);
      expect(jsonResponse.data.email).toBe('alice@example.com');
    });
  });
});
