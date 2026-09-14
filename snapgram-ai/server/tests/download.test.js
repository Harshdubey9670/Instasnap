'use strict';

/**
 * download.test.js
 * Unit tests for downloadStory and downloadReel controller handlers
 * Verifies authorization, creator controls, expiry, idempotency, and real-time alerts
 */

jest.mock('../src/models/Story');
jest.mock('../src/models/Reel');
jest.mock('../src/models/User');
jest.mock('../src/models/UserSettings');
jest.mock('../src/models/Notification');
jest.mock('../src/socket', () => ({
  getIo: jest.fn(),
}));

const Story = require('../src/models/Story');
const Reel = require('../src/models/Reel');
const User = require('../src/models/User');
const UserSettings = require('../src/models/UserSettings');
const Notification = require('../src/models/Notification');
const { getIo } = require('../src/socket');
const { downloadStory } = require('../src/controllers/storyController');
const { downloadReel } = require('../src/controllers/reelController');

describe('Download Controllers Tests', () => {
  let req;
  let res;
  let next;
  let mockIo;

  beforeEach(() => {
    jest.clearAllMocks();
    mockIo = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };
    getIo.mockReturnValue(mockIo);

    req = {
      params: { id: 'content_123' },
      user: { _id: 'viewer_123', id: 'viewer_123' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  describe('downloadStory', () => {
    it('returns 404 when story is not found', async () => {
      Story.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await downloadStory(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Story not found' })
      );
    });

    it('returns 403 when story is expired and viewer is not owner', async () => {
      const expiredStory = {
        _id: 'content_123',
        user: { _id: 'author_456' },
        expiresAt: new Date(Date.now() - 10000), // in the past
      };
      Story.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(expiredStory),
      });

      await downloadStory(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'This story has expired' })
      );
    });

    it('returns 403 when creator has disabled story downloads', async () => {
      const story = {
        _id: 'content_123',
        user: {
          _id: 'author_456',
          isPrivate: false,
          followers: ['viewer_123'],
          following: [],
          blockedUsers: [],
        },
        expiresAt: new Date(Date.now() + 100000),
        privacy: 'public',
        downloadPermission: 'deny',
        media: [{ url: 'https://example.com/story.mp4', type: 'video' }],
      };
      Story.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(story),
      });
      UserSettings.findOne.mockResolvedValue({
        privacy: { allowStoryDownloads: true },
      });
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({ blockedUsers: [] }),
      });

      await downloadStory(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          reason: 'creator_disabled',
          message: 'The creator has disabled downloads for this story',
        })
      );
    });

    it('returns 200 with downloadUrl and sends notification when authorized', async () => {
      const story = {
        _id: 'content_123',
        user: {
          _id: 'author_456',
          isPrivate: false,
          followers: ['viewer_123'],
          following: [],
          blockedUsers: [],
        },
        expiresAt: new Date(Date.now() + 100000),
        privacy: 'public',
        downloadPermission: 'allow',
        media: [{ url: 'https://example.com/story.mp4', type: 'video' }],
      };
      Story.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(story),
      });
      UserSettings.findOne.mockResolvedValue({
        privacy: { allowStoryDownloads: true },
      });
      User.findById
        .mockReturnValueOnce({
          select: jest.fn().mockResolvedValue({ blockedUsers: [] }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockResolvedValue({ username: 'bob_downloader' }),
        });

      Notification.findOne.mockResolvedValue(null);
      Notification.create.mockResolvedValue({ _id: 'notif_789' });

      await downloadStory(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            downloadUrl: 'https://example.com/story.mp4',
            mediaType: 'video',
          }),
        })
      );
      expect(Notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'story_downloaded',
          recipient: 'author_456',
          sender: 'viewer_123',
        })
      );
      expect(mockIo.emit).toHaveBeenCalledWith(
        'new_notification',
        expect.objectContaining({
          type: 'story_downloaded',
          contentId: 'content_123',
        })
      );
    });

    it('enforces 60-second idempotency: does not create duplicate notification if already sent', async () => {
      const story = {
        _id: 'content_123',
        user: {
          _id: 'author_456',
          isPrivate: false,
          followers: ['viewer_123'],
          following: [],
          blockedUsers: [],
        },
        expiresAt: new Date(Date.now() + 100000),
        privacy: 'public',
        downloadPermission: 'allow',
        media: [{ url: 'https://example.com/story.mp4', type: 'video' }],
      };
      Story.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(story),
      });
      UserSettings.findOne.mockResolvedValue({
        privacy: { allowStoryDownloads: true },
      });
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({ blockedUsers: [] }),
      });

      // Existing notification found within last 60s
      Notification.findOne.mockResolvedValue({ _id: 'existing_notif' });

      await downloadStory(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(Notification.create).not.toHaveBeenCalled();
      expect(mockIo.emit).not.toHaveBeenCalled();
    });
  });

  describe('downloadReel', () => {
    it('returns 404 if reel not found', async () => {
      Reel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await downloadReel(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Reel not found' })
      );
    });

    it('returns 403 when creator settings disable reel downloads', async () => {
      const reel = {
        _id: 'content_123',
        user: {
          _id: 'author_456',
          isPrivate: false,
          followers: [],
          following: [],
          blockedUsers: [],
        },
        video: { url: 'https://example.com/reel.mp4' },
        downloadPermission: 'use_account_default',
        downloadAllowed: false,
      };
      Reel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(reel),
      });
      UserSettings.findOne.mockResolvedValue({
        privacy: { allowReelDownloads: false },
      });
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({ blockedUsers: [] }),
      });

      await downloadReel(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          reason: 'creator_disabled',
          message: 'The creator has disabled downloads for this reel',
        })
      );
    });

    it('returns 200 with downloadUrl for authorized reel download and notifies author', async () => {
      const reel = {
        _id: 'content_123',
        user: {
          _id: 'author_456',
          isPrivate: false,
          followers: [],
          following: [],
          blockedUsers: [],
        },
        video: { url: 'https://example.com/reel.mp4' },
        downloadPermission: 'allow',
      };
      Reel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(reel),
      });
      UserSettings.findOne.mockResolvedValue({
        privacy: { allowReelDownloads: true },
      });
      User.findById
        .mockReturnValueOnce({
          select: jest.fn().mockResolvedValue({ blockedUsers: [] }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockResolvedValue({ username: 'bob_downloader' }),
        });

      Notification.findOne.mockResolvedValue(null);
      Notification.create.mockResolvedValue({ _id: 'notif_reel_1' });

      await downloadReel(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            downloadUrl: 'https://example.com/reel.mp4',
            contentType: 'reel',
            mediaType: 'video',
          }),
        })
      );
      expect(Notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'reel_downloaded',
          recipient: 'author_456',
        })
      );
    });
  });
});
