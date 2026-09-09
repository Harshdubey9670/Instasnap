const mongoose = require('mongoose');
require('dotenv').config({ path: '/Users/harshdubey123/Desktop/gitProject/InstaSnap/snapgram-ai/server/.env' });
const User = require('./src/models/User');

async function migrateDB() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');
  
  const users = await User.find({ followRequests: { $exists: true, $not: {$size: 0} } });
  
  for (const targetUser of users) {
    for (const requesterId of targetUser.followRequests) {
      await User.findByIdAndUpdate(requesterId, {
        $addToSet: { sentFollowRequests: targetUser._id }
      });
      console.log(`Added ${targetUser.username} to sentFollowRequests of user ID ${requesterId}`);
    }
  }
  
  console.log('Migration complete');
  mongoose.disconnect();
}
migrateDB();
