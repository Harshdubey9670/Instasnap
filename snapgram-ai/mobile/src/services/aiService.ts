import api from './api';

export const chatAssistant = async (
  prompt: string,
  conversationHistory: { role: string; content: string }[] = [],
) => {
  const response = await api.post('/api/ai/assistant', { prompt, conversationHistory });
  return response.data;
};

export const generateImage = async (prompt: string) => {
  const response = await api.post('/api/ai/generate-image', { prompt });
  return response.data;
};

export const generateCaption = async (topic: string, tone: string) => {
  const response = await api.post('/api/ai/caption', { topic, tone });
  return response.data;
};

export const generateHashtags = async (topic: string) => {
  const response = await api.post('/api/ai/hashtags', { topic });
  return response.data;
};

export const generateBio = async (niche: string, vibe: string) => {
  const response = await api.post('/api/ai/bio', { niche, vibe });
  return response.data;
};

export const suggestUsernames = async (name: string, interest: string) => {
  const response = await api.post('/api/ai/usernames', { name, interest });
  return response.data;
};

export const generatePostIdeas = async (category: string) => {
  const response = await api.post('/api/ai/post-ideas', { category });
  return response.data;
};

export const suggestComments = async (postContext: string) => {
  const response = await api.post('/api/ai/comments', { postContext });
  return response.data;
};

export const translateText = async (text: string, targetLang: string) => {
  const response = await api.post('/api/ai/translate', { text, targetLang });
  return response.data;
};

export const moderateContent = async (text: string) => {
  const response = await api.post('/api/ai/moderate', { text });
  return response.data;
};

export const detectFakeAccount = async (targetUserId?: string) => {
  const response = await api.post('/api/ai/fake-account-check', { targetUserId });
  return response.data;
};

export const generateAltText = async (imageDescription: string) => {
  const response = await api.post('/api/ai/alt-text', { imageDescription });
  return response.data;
};
