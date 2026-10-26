const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const logger = require('./middleware/logger');
const validateJson = require('./middleware/validateJson');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const taskRoutes = require('./routes/tasks');
const authRoutes = require('./routes/auth');
const rulesRoutes = require('./routes/rules');
const { seedDefaultAdmin } = require('./controllers/authController');
const { seedDefaultRules } = require('./controllers/workflowRuleController');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB using Mongoose and run initial demonstration seeds
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected');
    await seedDefaultAdmin();
    await seedDefaultRules();
  })
  .catch((err) => console.error('MongoDB connection error:', err));

// CORS Configuration (allows Vite frontend on localhost or 127.0.0.1)
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.indexOf(origin) !== -1 ||
      /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
    ) {
      return callback(null, origin);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// 1. Enable express.json() for request body parsing
app.use(express.json());

// 2. Global Logger Middleware
app.use(logger);

// 3. Content-Type Validation Middleware
app.use(validateJson);

// Root endpoint (health check)
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Task Manager API is running',
    endpoints: {
      register: 'POST /register (or POST /auth/register)',
      login: 'POST /login (or POST /auth/login)',
      me: 'GET /me (or GET /auth/me)',
      tasks: '/tasks',
      reports: 'GET /tasks/reports (Admin only)',
      cacheStats: 'GET /tasks/cache/stats (Protected debug cache statistics)',
      notifications: 'POST /tasks (Triggers async background notification via Node.js EventEmitter)',
      rules: '/rules (Workflow automation)',
      auth: '/auth'
    }
  });
});

// Convenient alias for cache stats debug endpoint (Practical 9)
const { authenticate } = require('./middleware/auth');
const cache = require('./utils/cache');
app.get('/cache/stats', authenticate, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Task Cache Statistics',
    stats: cache.getStats()
  });
});

// Mount routers:
app.use('/', authRoutes);
app.use('/auth', authRoutes);
app.use('/tasks', taskRoutes);
app.use('/rules', rulesRoutes);

// 4. Fallback 404 Middleware
app.use(notFound);

// 5. Global Error Handler Middleware
app.use(errorHandler);

// Start listening for incoming traffic
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
