const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./src/routes/auth');
const gameRoutes = require('./src/routes/games');
const drawRoutes = require('./src/routes/draws');
const lotteryTicketRoutes = require('./src/routes/lotteryTickets');
const abcTicketRoutes = require('./src/routes/abcTickets');
const walletRoutes = require('./src/routes/wallet');
const webhookRoutes = require('./src/routes/webhook');
const resultRoutes = require('./src/routes/results');
const adminRoutes = require('./src/routes/admin');
const userRoutes = require('./src/routes/users');

const app = express();

// ── CORS (must be before helmet so its headers don't override CORS)
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'capacitor://localhost',
    'http://localhost',
    'http://localhost:5173',
    'http://127.0.0.1',
    'http://127.0.0.1:5173',
    'https://lastdigitlotto.in',
    'https://www.lastdigitlotto.in'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ── Security & Logging
// crossOriginResourcePolicy must be 'cross-origin' so the browser allows
// cross-origin fetches (e.g. from localhost or a different domain in prod)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: false,
}));
app.use(morgan('dev'));

// ── Raw body for Razorpay webhook (must come before express.json)
app.use('/api/webhooks', express.raw({ type: 'application/json' }));

// ── Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Global rate limiter (100 req / 15 min per IP)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Increased from 100 to 1000 for development ease
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', globalLimiter);

// ── Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/draws', drawRoutes);
app.use('/api/lottery-tickets', lotteryTicketRoutes);
app.use('/api/abc-tickets', abcTicketRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/admin', adminRoutes);

// ── Health check
app.get('/health', (req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

// ── 404
app.use((req, res) =>
  res.status(404).json({ success: false, message: 'Route not found' })
);

// ── Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

module.exports = app;
