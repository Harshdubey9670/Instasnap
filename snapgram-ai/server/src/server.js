const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { createServer } = require('http');
const { Server } = require('socket.io');

const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler');

const { validateEnv } = require('./config/envValidation');
const { requestMonitorMiddleware } = require('./utils/logger');

// Load & Validate environment variables
dotenv.config();
validateEnv();

// Create Express app
const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: function (origin, callback) {
      callback(null, true);
    },
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['polling', 'websocket'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000
});

// Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 10 : 100, // strict limit for auth routes in prod, lenient in dev
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: function (origin, callback) {
    callback(null, true);
  },
  credentials: true
}));
app.use(helmet({
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
}));
app.use(morgan('dev'));

// Apply Global Rate Limiter
app.use('/api/', globalLimiter);

const connectDB = require('./config/db');

// MongoDB Connection
connectDB();

// --- Routes ---
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const storyRoutes = require('./routes/storyRoutes');
const reelRoutes = require('./routes/reelRoutes');
const userRoutes = require('./routes/userRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const searchRoutes = require('./routes/searchRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const collectionRoutes = require('./routes/collectionRoutes');
const conversationRoutes = require('./routes/conversationRoutes');
const messageRoutes = require('./routes/messageRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const liveRoutes = require('./routes/liveRoutes');
const creatorRoutes = require('./routes/creatorRoutes');
const monetizationRoutes = require('./routes/monetizationRoutes');
const aiRoutes = require('./routes/aiRoutes');
const vaultRoutes = require('./routes/vaultRoutes');
const adminRoutes = require('./routes/adminRoutes');
const noteRoutes = require('./routes/noteRoutes');

// Apply strict rate limiting to auth routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/reels', reelRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/live', liveRoutes);
app.use('/api/creator', creatorRoutes);
app.use('/api/monetization', monetizationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/vault', vaultRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notes', noteRoutes);

app.get('/api/proxy/image', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url || typeof url !== 'string') {
      return res.status(400).send('Missing url parameter');
    }
    const decodedUrl = decodeURIComponent(url);
    const response = await fetch(decodedUrl);
    if (!response.ok) {
      return res.status(response.status).send('Failed to fetch upstream image');
    }
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=86400');
    const arrayBuffer = await response.arrayBuffer();
    return res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    return res.status(500).send('Proxy error');
  }
});

app.get('/health', (req, res) => {
  res.send('SnapGram AI API is running...');
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'SnapGram AI API is running...' });
});

app.get('/api/info', (req, res) => {
  res.status(200).json({ version: '1.0.0', name: 'SnapGram AI' });
});

app.get('/', (req, res) => {
  res.send('SnapGram AI Server');
});

// Socket.io connection handling
require('./socket').initSocket(io);

// Global Error Handler
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
