'use strict';

const BASE_URL = 'http://localhost:5001';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const config = {
    method: options.method || 'GET',
    headers,
  };
  if (options.body) {
    config.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
  }
  const res = await fetch(url, config);
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, ok: res.ok, data };
}

async function runRuntimeVerification() {
  console.log('--- STARTING LIVE BACKEND RUNTIME VERIFICATION ---');

  const timestamp = Date.now();
  const userAData = {
    username: `user_a_${timestamp}`,
    email: `usera_${timestamp}@test.com`,
    password: 'Password123!',
    fullName: 'User A Owner',
  };
  const userBData = {
    username: `user_b_${timestamp}`,
    email: `userb_${timestamp}@test.com`,
    password: 'Password123!',
    fullName: 'User B Downloader',
  };

  // 1. Register User A and User B
  console.log('1. Registering test users...');
  const regA = await request('/api/auth/signup', { method: 'POST', body: userAData });
  if (regA.status !== 201 && regA.status !== 200) {
    throw new Error(`Failed to register User A: ${JSON.stringify(regA.data)}`);
  }
  const tokenA = regA.data.token || regA.data.data?.token;
  const userAId = regA.data.user?._id || regA.data.data?.user?._id || regA.data.data?._id;

  const regB = await request('/api/auth/signup', { method: 'POST', body: userBData });
  if (regB.status !== 201 && regB.status !== 200) {
    throw new Error(`Failed to register User B: ${JSON.stringify(regB.data)}`);
  }
  const tokenB = regB.data.token || regB.data.data?.token;
  const userBId = regB.data.user?._id || regB.data.data?.user?._id || regB.data.data?._id;

  console.log(`✅ Registered User A (${userAId}) and User B (${userBId})`);

  const authHeaderA = { headers: { Authorization: `Bearer ${tokenA}` } };
  const authHeaderB = { headers: { Authorization: `Bearer ${tokenB}` } };

  // 2. Test Profile Access (IDOR Prevention)
  console.log('2. Testing Profile Access from User B to User A...');
  const profileRes = await request(`/api/users/${userAId}`, authHeaderB);
  if (profileRes.status !== 200) {
    throw new Error(`Profile get failed: ${profileRes.status} ${JSON.stringify(profileRes.data)}`);
  }
  const pData = profileRes.data.data;
  if (pData.followers !== undefined || pData.following !== undefined) {
    throw new Error(`FAIL: IDOR vulnerability detected! Raw followers/following array leaked to non-owner!`);
  }
  if (typeof pData.followersCount !== 'number' || typeof pData.followingCount !== 'number') {
    throw new Error(`FAIL: followersCount or followingCount missing from response!`);
  }
  console.log(`✅ Profile IDOR check passed: scalar counts returned (${pData.followersCount} followers, ${pData.followingCount} following), arrays withheld.`);

  // 3. Set Followers List Visibility to 'followers' (B is not yet a follower)
  console.log('3. Updating User A privacy settings: followersListVisibility = "followers"...');
  const setRes = await request('/api/settings', {
    method: 'PUT',
    body: {
      privacy: {
        followersListVisibility: 'followers',
        followingListVisibility: 'followers',
        allowStoryDownloads: false,
      },
    },
    ...authHeaderA,
  });
  if (setRes.status !== 200) {
    throw new Error(`Failed to update settings: ${setRes.status} ${JSON.stringify(setRes.data)}`);
  }
  console.log('✅ Settings saved.');

  // 4. User B requests User A followers list -> MUST be 403
  console.log('4. User B requests User A followers list (should be 403)...');
  const listRes = await request(`/api/users/${userAId}/followers`, authHeaderB);
  if (listRes.status !== 403) {
    throw new Error(`FAIL: Expected 403 for restricted followers list, received ${listRes.status}: ${JSON.stringify(listRes.data)}`);
  }
  console.log(`✅ Followers list gating passed: 403 returned (${listRes.data.message})`);

  // 5. User A creates a story with downloadPermission: 'use_account_default' (account setting is false)
  console.log('5. User A creates a story...');
  const storyRes = await request('/api/stories', {
    method: 'POST',
    body: {
      media: [{ url: 'https://res.cloudinary.com/demo/video/upload/dog.mp4', type: 'video' }],
      caption: 'Phase U Test Story',
      privacy: 'public',
      downloadPermission: 'use_account_default',
    },
    ...authHeaderA,
  });
  if (storyRes.status !== 201 && storyRes.status !== 200) {
    throw new Error(`Failed to create story: ${storyRes.status} ${JSON.stringify(storyRes.data)}`);
  }
  const storyId = storyRes.data.data?._id || storyRes.data.data?.story?._id || storyRes.data._id;
  console.log(`✅ Story created: ${storyId}`);

  // 6. User B attempts download -> MUST be 403 because allowStoryDownloads is false
  console.log('6. User B attempts story download (should be 403)...');
  const dlRes1 = await request(`/api/stories/${storyId}/download`, { method: 'POST', ...authHeaderB });
  if (dlRes1.status !== 403) {
    throw new Error(`FAIL: Expected 403 when creator disabled story downloads, got ${dlRes1.status}: ${JSON.stringify(dlRes1.data)}`);
  }
  console.log(`✅ Creator story download restriction passed: 403 returned (${dlRes1.data.message})`);

  // 7. User A enables story downloads: allowStoryDownloads = true
  console.log('7. User A enables story downloads...');
  await request('/api/settings', {
    method: 'PUT',
    body: {
      privacy: { allowStoryDownloads: true },
    },
    ...authHeaderA,
  });

  // 8. User B downloads story -> MUST succeed with 200 and return downloadUrl
  console.log('8. User B downloads story with permission enabled...');
  const dlRes2 = await request(`/api/stories/${storyId}/download`, { method: 'POST', ...authHeaderB });
  if (dlRes2.status !== 200) {
    throw new Error(`FAIL: Expected 200 on authorized download, got ${dlRes2.status}: ${JSON.stringify(dlRes2.data)}`);
  }
  if (!dlRes2.data.data?.downloadUrl) {
    throw new Error(`FAIL: downloadUrl missing in response: ${JSON.stringify(dlRes2.data)}`);
  }
  console.log(`✅ Authorized story download succeeded: downloadUrl = ${dlRes2.data.data.downloadUrl}`);

  // 9. Check notification in DB for User A
  console.log('9. Checking real-time notifications for User A...');
  const notifRes = await request('/api/notifications', authHeaderA);
  const notifications = notifRes.data.data?.notifications || notifRes.data.data || [];
  const downloadNotif = notifications.find((n) => n.type === 'story_downloaded');
  if (!downloadNotif) {
    throw new Error(`FAIL: story_downloaded notification was not generated in notification center!`);
  }
  console.log(`✅ Notification verified in DB: type=${downloadNotif.type}, message="${downloadNotif.message}"`);

  // 10. User B downloads same story again immediately (within 60s) -> MUST succeed (200) without duplicating notification
  console.log('10. User B downloads same story again within 60s (idempotency check)...');
  const dlRes3 = await request(`/api/stories/${storyId}/download`, { method: 'POST', ...authHeaderB });
  if (dlRes3.status !== 200) {
    throw new Error(`FAIL: Second download failed with ${dlRes3.status}`);
  }

  const notifRes2 = await request('/api/notifications', authHeaderA);
  const notifications2 = notifRes2.data.data?.notifications || notifRes2.data.data || [];
  const downloadNotifsCount = notifications2.filter((n) => n.type === 'story_downloaded').length;
  if (downloadNotifsCount !== 1) {
    throw new Error(`FAIL: Idempotency violated! Expected 1 notification, found ${downloadNotifsCount}`);
  }
  console.log(`✅ 60-second deduplication verified: exactly 1 notification exists after repeated download.`);

  // 11. User A creates a Reel with downloadPermission: 'use_account_default' (account allowReelDownloads is true by default or set explicitly)
  console.log('11. Testing Reels live runtime flow...');
  await request('/api/settings', {
    method: 'PUT',
    body: { privacy: { allowReelDownloads: false } },
    ...authHeaderA,
  });

  const reelRes = await request('/api/reels', {
    method: 'POST',
    body: {
      video: { url: 'https://res.cloudinary.com/demo/video/upload/dog.mp4' },
      caption: 'Phase U Test Reel',
      downloadPermission: 'use_account_default',
    },
    ...authHeaderA,
  });
  if (reelRes.status !== 201 && reelRes.status !== 200) {
    throw new Error(`Failed to create reel: ${reelRes.status} ${JSON.stringify(reelRes.data)}`);
  }
  const reelId = reelRes.data.data?._id || reelRes.data._id;
  console.log(`✅ Reel created: ${reelId}`);

  // User B attempts reel download when allowReelDownloads is false -> 403
  const reelDl1 = await request(`/api/reels/${reelId}/download`, { method: 'POST', ...authHeaderB });
  if (reelDl1.status !== 403) {
    throw new Error(`FAIL: Expected 403 for restricted reel download, got ${reelDl1.status}`);
  }
  console.log(`✅ Creator reel download restriction passed: 403 returned (${reelDl1.data.message})`);

  // User A allows reel downloads
  await request('/api/settings', {
    method: 'PUT',
    body: { privacy: { allowReelDownloads: true } },
    ...authHeaderA,
  });

  // User B downloads reel -> 200 OK
  const reelDl2 = await request(`/api/reels/${reelId}/download`, { method: 'POST', ...authHeaderB });
  if (reelDl2.status !== 200 || !reelDl2.data.data?.downloadUrl) {
    throw new Error(`FAIL: Expected 200 on authorized reel download, got ${reelDl2.status}`);
  }
  console.log(`✅ Authorized reel download succeeded: downloadUrl = ${reelDl2.data.data.downloadUrl}`);

  // Check reel notification
  const notifRes3 = await request('/api/notifications', authHeaderA);
  const notifs3 = notifRes3.data.data?.notifications || notifRes3.data.data || [];
  const reelNotif = notifs3.find((n) => n.type === 'reel_downloaded');
  if (!reelNotif) {
    throw new Error(`FAIL: reel_downloaded notification not found in DB!`);
  }
  console.log(`✅ Reel notification verified in DB: type=${reelNotif.type}, message="${reelNotif.message}"`);

  // Deduplication check for reel
  const reelDl3 = await request(`/api/reels/${reelId}/download`, { method: 'POST', ...authHeaderB });
  if (reelDl3.status !== 200) throw new Error(`FAIL: Second reel download failed`);

  const notifRes4 = await request('/api/notifications', authHeaderA);
  const notifs4 = notifRes4.data.data?.notifications || notifRes4.data.data || [];
  const reelNotifCount = notifs4.filter((n) => n.type === 'reel_downloaded').length;
  if (reelNotifCount !== 1) {
    throw new Error(`FAIL: Expected 1 reel_downloaded notification after immediate repeat download, found ${reelNotifCount}`);
  }
  console.log(`✅ Reel 60s deduplication verified: exactly 1 notification exists.`);

  console.log('--- ALL LIVE RUNTIME VERIFICATION CHECKS PASSED SUCCESSFULLY ---');
}

runRuntimeVerification().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('VERIFICATION ERROR:', err);
  process.exit(1);
});
