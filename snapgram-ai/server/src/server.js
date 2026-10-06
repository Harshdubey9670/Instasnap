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

// Enable trust proxy for accurate client IP resolution behind reverse proxies/ALBs
app.set('trust proxy', 1);

const cookieParser = require('cookie-parser');
const sanitizeInput = require('./middleware/sanitizeInput');

// Build the CORS origin allowlist from the environment variable.
// CLIENT_URL may be a comma-separated list of allowed origins.
const buildCorsOrigin = () => {
  const raw = process.env.CLIENT_URL || 'http://localhost:5555,http://localhost:5173';
  const origins = raw.split(',').map(o => o.trim()).filter(Boolean);
  return (origin, callback) => {
    // Allow non-browser requests (mobile apps, server-to-server, curl)
    if (!origin) return callback(null, true);
    if (origins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked origin: ${origin}`));
  };
};

const io = new Server(httpServer, {
  cors: {
    origin: (process.env.CLIENT_URL || 'http://localhost:5555,http://localhost:5173').split(',').map(o => o.trim()).filter(Boolean),
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
  max: 200, // per IP per window
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 20 : 100,
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const strictAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 10 : 50,
  message: 'Too many sensitive authentication attempts (login/OTP/reset), please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(sanitizeInput);

app.use(cors({
  origin: buildCorsOrigin(),
  credentials: true
}));

app.use(helmet({
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://accounts.google.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "https://res.cloudinary.com",
        "https://images.unsplash.com",
        "https://i.pravatar.cc",
        "https://picsum.photos",
        "https://*.googleusercontent.com",
      ],
      mediaSrc: ["'self'", "blob:", "https://res.cloudinary.com"],
      connectSrc: [
        "'self'",
        "ws:",
        "wss:",
        "http://localhost:5001",
        "http://localhost:5555",
        "http://localhost:5173",
        "https://accounts.google.com",
        "https://res.cloudinary.com",
        ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map(u => u.trim()) : []),
      ],
      frameSrc: ["'self'", "https://accounts.google.com"],
    },
  },
}));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
// Logs a warning for any request taking >1s (e.g. unindexed search scans).
app.use(requestMonitorMiddleware());

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

// Apply strict rate limiting to sensitive authentication endpoints
app.use('/api/auth/login', strictAuthLimiter);
app.use('/api/auth/verify-otp', strictAuthLimiter);
app.use('/api/auth/resend-otp', strictAuthLimiter);
app.use('/api/auth/forgot-password', strictAuthLimiter);
app.use('/api/auth/reset-password', strictAuthLimiter);
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

// Secure image proxy: authenticated users only, strict domain allowlist, no redirects.
const { protect: protectRoute } = require('./middleware/authMiddleware');
const PROXY_ALLOWED_HOSTS = [
  'res.cloudinary.com',
  'images.unsplash.com',
  'i.pravatar.cc',
  'storage.googleapis.com',
  'picsum.photos',
];
const PROXY_MAX_BYTES = 10 * 1024 * 1024; // 10 MB

app.get('/api/proxy/image', protectRoute, async (req, res) => {
  const logger = require('./utils/logger');
  try {
    const { url } = req.query;
    if (!url || typeof url !== 'string') {
      return res.status(400).send('Missing url parameter');
    }

    let parsed;
    try { parsed = new URL(url); } catch {
      return res.status(400).send('Invalid URL');
    }

    if (parsed.protocol !== 'https:') {
      return res.status(403).send('Only HTTPS URLs are allowed');
    }

    if (!PROXY_ALLOWED_HOSTS.includes(parsed.hostname)) {
      logger.warn('Image proxy: blocked disallowed host', { hostname: parsed.hostname });
      return res.status(403).send('Domain not allowed');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    let response;
    try {
      response = await fetch(url, {
        redirect: 'error', // block redirects to prevent SSRF redirect chains
        signal: controller.signal,
        headers: {
          'User-Agent': 'SnapGram-Proxy/1.0'
        }
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      return res.status(response.status).send('Failed to fetch upstream image');
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    if (!contentType.startsWith('image/')) {
      return res.status(415).send('Upstream resource is not an image');
    }

    const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
    if (contentLength > PROXY_MAX_BYTES) {
      return res.status(413).send('Image too large');
    }

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > PROXY_MAX_BYTES) {
      return res.status(413).send('Image too large');
    }

    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=86400');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Access-Control-Allow-Origin', '*');
    return res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    logger.error('Image proxy error', err);
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
