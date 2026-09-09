const mongoose = require('mongoose');
require('dotenv').config({ path: '/Users/harshdubey123/Desktop/gitProject/InstaSnap/snapgram-ai/server/.env' });
const User = require('./src/models/User');

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');
  const users = await User.find({ sentFollowRequests: { $exists: true, $not: {$size: 0} } });
  console.log('Users with sentFollowRequests:', users.map(u => ({ username: u.username, sentFollowRequests: u.sentFollowRequests })));
  
  const allUsers = await User.find({ followRequests: { $exists: true, $not: {$size: 0} } });
  console.log('Users with incoming followRequests:', allUsers.map(u => ({ username: u.username, followRequests: u.followRequests })));
  
  mongoose.disconnect();
}
test();
