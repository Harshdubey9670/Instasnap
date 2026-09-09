require('dotenv').config({ path: '/Users/harshdubey123/Desktop/gitProject/InstaSnap/snapgram-ai/server/.env' });
const aiService = require('./src/services/aiService');

async function test() {
  const res = await aiService.chatAssistant("What is 2+2? Keep your answer short.");
  console.log("AI Response:", res);
}
test();
