'use strict';
/**
 * privacyGuards.test.js
 * Unit tests for all guard functions in utils/privacyGuards.js
 * No database or network required — pure business logic.
 */

const {
  canViewFollowersList,
  canViewFollowingList,
  canDownloadStory,
  canDownloadReel,
  getEffectiveListVisibility,
  resolveStoryDownloadAllowed,
  resolveReelDownloadAllowed,
} = require('../src/utils/privacyGuards');

// ─── Factories ───────────────────────────────────────────────────────────────

const makeUser = (overrides = {}) => ({
  _id: 'owner_001',
  followers: [],
  following: [],
  blockedUsers: [],
  isPrivate: false,
  ...overrides,
});

const makeSettings = (privacyOverrides = {}) => ({
  privacy: {
    followersListVisibility: 'public',
    followingListVisibility: 'public',
    allowStoryDownloads: true,
    allowReelDownloads: true,
    hideFollowers: false,
    hideFollowing: false,
    ...privacyOverrides,
  },
});

const makeViewer = (overrides = {}) => ({
  _id: 'viewer_001',
  blockedUsers: [],
  ...overrides,
});

const makeStory = (overrides = {}) => ({
  _id: 'story_001',
  user: { _id: 'owner_001' },
  downloadPermission: 'use_account_default',
  allowDownload: true,
  ...overrides,
});

const makeReel = (overrides = {}) => ({
  _id: 'reel_001',
  user: { _id: 'owner_001' },
  downloadPermission: 'use_account_default',
  downloadAllowed: false,
  ...overrides,
});

// ─── getEffectiveListVisibility ───────────────────────────────────────────────

describe('getEffectiveListVisibility', () => {
  test('returns public when no settings', () => {
    expect(getEffectiveListVisibility(null, 'followers')).toBe('public');
    expect(getEffectiveListVisibility(null, 'following')).toBe('public');
  });

  test('returns new enum value when set', () => {
    const s = makeSettings({ followersListVisibility: 'private' });
    expect(getEffectiveListVisibility(s, 'followers')).toBe('private');
  });

  test('migration: hideFollowers=true maps to private', () => {
    const s = { privacy: { hideFollowers: true, hideFollowing: false } };
    expect(getEffectiveListVisibility(s, 'followers')).toBe('private');
  });

  test('migration: hideFollowers=false maps to public', () => {
    const s = { privacy: { hideFollowers: false } };
    expect(getEffectiveListVisibility(s, 'followers')).toBe('public');
  });

  test('new enum takes precedence over legacy hideFollowers', () => {
    const s = { privacy: { hideFollowers: true, followersListVisibility: 'followers' } };
    expect(getEffectiveListVisibility(s, 'followers')).toBe('followers');
  });
});

// ─── canViewFollowersList ─────────────────────────────────────────────────────

describe('canViewFollowersList', () => {
  const owner = makeUser({ _id: 'owner_001', followers: ['viewer_001'], following: ['viewer_001'] });

  test('owner always allowed', () => {
    const s = makeSettings({ followersListVisibility: 'private' });
    const r = canViewFollowersList('owner_001', owner, s);
    expect(r.allowed).toBe(true);
    expect(r.reason).toBe('owner');
  });

  test('public: any authenticated viewer allowed', () => {
    const s = makeSettings({ followersListVisibility: 'public' });
    const r = canViewFollowersList('random_user', owner, s);
    expect(r.allowed).toBe(true);
  });

  test('followers: viewer who follows owner is allowed', () => {
    const s = makeSettings({ followersListVisibility: 'followers' });
    const r = canViewFollowersList('viewer_001', owner, s);
    expect(r.allowed).toBe(true);
    expect(r.reason).toBe('is_follower');
  });

  test('followers: non-follower is denied', () => {
    const s = makeSettings({ followersListVisibility: 'followers' });
    const ownerNoFollowers = makeUser({ _id: 'owner_001', followers: [] });
    const r = canViewFollowersList('viewer_001', ownerNoFollowers, s);
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe('not_a_follower');
  });

  test('following: owner follows viewer — allowed', () => {
    const s = makeSettings({ followersListVisibility: 'following' });
    // owner.following includes viewer_001
    const r = canViewFollowersList('viewer_001', owner, s);
    expect(r.allowed).toBe(true);
    expect(r.reason).toBe('owner_follows_viewer');
  });

  test('following: owner does NOT follow viewer — denied', () => {
    const s = makeSettings({ followersListVisibility: 'following' });
    const ownerNoFollowing = makeUser({ _id: 'owner_001', following: [] });
    const r = canViewFollowersList('viewer_001', ownerNoFollowing, s);
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe('owner_does_not_follow_viewer');
  });

  test('private: any non-owner denied', () => {
    const s = makeSettings({ followersListVisibility: 'private' });
    const r = canViewFollowersList('viewer_001', owner, s);
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe('private_list');
  });

  test('blocked by owner: denied regardless of visibility', () => {
    const blockedOwner = makeUser({ _id: 'owner_001', blockedUsers: ['viewer_001'] });
    const s = makeSettings({ followersListVisibility: 'public' });
    const r = canViewFollowersList('viewer_001', blockedOwner, s);
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe('blocked');
  });

  test('viewer has blocked owner: denied', () => {
    const s = makeSettings({ followersListVisibility: 'public' });
    const viewer = makeViewer({ _id: 'viewer_001', blockedUsers: ['owner_001'] });
    const r = canViewFollowersList('viewer_001', owner, s, viewer);
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe('blocked');
  });

  test('unauthenticated viewer denied', () => {
    const s = makeSettings({ followersListVisibility: 'public' });
    const r = canViewFollowersList(null, owner, s);
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe('unauthenticated');
  });
});

// ─── canViewFollowingList ─────────────────────────────────────────────────────

describe('canViewFollowingList', () => {
  const owner = makeUser({ _id: 'owner_001', followers: ['viewer_001'], following: ['viewer_001'] });

  test('owner always allowed', () => {
    const s = makeSettings({ followingListVisibility: 'private' });
    const r = canViewFollowingList('owner_001', owner, s);
    expect(r.allowed).toBe(true);
  });

  test('public: viewer allowed', () => {
    const s = makeSettings({ followingListVisibility: 'public' });
    const r = canViewFollowingList('viewer_001', owner, s);
    expect(r.allowed).toBe(true);
  });

  test('followers: non-follower denied', () => {
    const s = makeSettings({ followingListVisibility: 'followers' });
    const ownerNoFollowers = makeUser({ _id: 'owner_001', followers: [] });
    const r = canViewFollowingList('viewer_001', ownerNoFollowers, s);
    expect(r.allowed).toBe(false);
  });

  test('private: any non-owner denied', () => {
    const s = makeSettings({ followingListVisibility: 'private' });
    const r = canViewFollowingList('viewer_001', owner, s);
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe('private_list');
  });

  test('blocked viewer: denied', () => {
    const blockedOwner = makeUser({ _id: 'owner_001', blockedUsers: ['viewer_001'] });
    const s = makeSettings({ followingListVisibility: 'public' });
    const r = canViewFollowingList('viewer_001', blockedOwner, s);
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe('blocked');
  });
});

// ─── resolveStoryDownloadAllowed ─────────────────────────────────────────────

describe('resolveStoryDownloadAllowed', () => {
  test('per-content allow overrides account deny', () => {
    const story = makeStory({ downloadPermission: 'allow' });
    const settings = makeSettings({ allowStoryDownloads: false });
    expect(resolveStoryDownloadAllowed(story, settings)).toBe(true);
  });

  test('per-content deny overrides account allow', () => {
    const story = makeStory({ downloadPermission: 'deny' });
    const settings = makeSettings({ allowStoryDownloads: true });
    expect(resolveStoryDownloadAllowed(story, settings)).toBe(false);
  });

  test('use_account_default defers to account setting (allow)', () => {
    const story = makeStory({ downloadPermission: 'use_account_default' });
    const settings = makeSettings({ allowStoryDownloads: true });
    expect(resolveStoryDownloadAllowed(story, settings)).toBe(true);
  });

  test('use_account_default defers to account setting (deny)', () => {
    const story = makeStory({ downloadPermission: 'use_account_default' });
    const settings = makeSettings({ allowStoryDownloads: false });
    expect(resolveStoryDownloadAllowed(story, settings)).toBe(false);
  });

  test('no settings: falls back to legacy allowDownload', () => {
    const story = makeStory({ downloadPermission: 'use_account_default', allowDownload: false });
    expect(resolveStoryDownloadAllowed(story, null)).toBe(false);
  });

  test('default: allow when no field present', () => {
    const story = { _id: 'story_001' }; // no fields
    expect(resolveStoryDownloadAllowed(story, null)).toBe(true);
  });
});

// ─── resolveReelDownloadAllowed ───────────────────────────────────────────────

describe('resolveReelDownloadAllowed', () => {
  test('per-content allow overrides account deny', () => {
    const reel = makeReel({ downloadPermission: 'allow' });
    const settings = makeSettings({ allowReelDownloads: false });
    expect(resolveReelDownloadAllowed(reel, settings)).toBe(true);
  });

  test('per-content deny overrides account allow', () => {
    const reel = makeReel({ downloadPermission: 'deny' });
    const settings = makeSettings({ allowReelDownloads: true });
    expect(resolveReelDownloadAllowed(reel, settings)).toBe(false);
  });

  test('use_account_default defers to account allow', () => {
    const reel = makeReel({ downloadPermission: 'use_account_default' });
    const settings = makeSettings({ allowReelDownloads: true });
    expect(resolveReelDownloadAllowed(reel, settings)).toBe(true);
  });

  test('legacy downloadAllowed=false is respected when no account setting', () => {
    const reel = makeReel({ downloadPermission: 'use_account_default', downloadAllowed: false });
    expect(resolveReelDownloadAllowed(reel, null)).toBe(false);
  });
});

// ─── canDownloadStory ─────────────────────────────────────────────────────────

describe('canDownloadStory', () => {
  const author = makeUser({ _id: 'owner_001' });
  const settings = makeSettings({ allowStoryDownloads: true });
  const story = makeStory({ downloadPermission: 'use_account_default' });

  test('owner can always download', () => {
    const r = canDownloadStory('owner_001', story, author, settings);
    expect(r.allowed).toBe(true);
    expect(r.reason).toBe('owner');
  });

  test('authorized viewer can download when creator allows', () => {
    const r = canDownloadStory('viewer_001', story, author, settings);
    expect(r.allowed).toBe(true);
  });

  test('creator disabled: denied', () => {
    const noDownload = makeSettings({ allowStoryDownloads: false });
    const r = canDownloadStory('viewer_001', story, author, noDownload);
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe('creator_disabled');
  });

  test('per-content deny overrides account allow', () => {
    const denyStory = makeStory({ downloadPermission: 'deny' });
    const r = canDownloadStory('viewer_001', denyStory, author, settings);
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe('creator_disabled');
  });

  test('blocked viewer: always denied', () => {
    const blockedAuthor = makeUser({ _id: 'owner_001', blockedUsers: ['viewer_001'] });
    const r = canDownloadStory('viewer_001', story, blockedAuthor, settings);
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe('blocked');
  });

  test('unauthenticated: denied', () => {
    const r = canDownloadStory(null, story, author, settings);
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe('unauthenticated');
  });
});

// ─── canDownloadReel ──────────────────────────────────────────────────────────

describe('canDownloadReel', () => {
  const author = makeUser({ _id: 'owner_001' });
  const settings = makeSettings({ allowReelDownloads: true });
  const reel = makeReel({ downloadPermission: 'use_account_default' });

  test('owner can always download', () => {
    const r = canDownloadReel('owner_001', reel, author, settings);
    expect(r.allowed).toBe(true);
    expect(r.reason).toBe('owner');
  });

  test('creator allows: viewer can download', () => {
    const r = canDownloadReel('viewer_001', reel, author, settings);
    expect(r.allowed).toBe(true);
  });

  test('creator disabled: denied', () => {
    const noDownload = makeSettings({ allowReelDownloads: false });
    const r = canDownloadReel('viewer_001', reel, author, noDownload);
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe('creator_disabled');
  });

  test('blocked viewer: denied', () => {
    const blockedAuthor = makeUser({ _id: 'owner_001', blockedUsers: ['viewer_001'] });
    const r = canDownloadReel('viewer_001', reel, blockedAuthor, settings);
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe('blocked');
  });

  test('per-content deny: denied even if account allows', () => {
    const denyReel = makeReel({ downloadPermission: 'deny' });
    const r = canDownloadReel('viewer_001', denyReel, author, settings);
    expect(r.allowed).toBe(false);
  });
});
