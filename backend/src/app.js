/**
 * Express Application Configuration
 * Modular Monolith Architecture
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const env = require('./config/env');
const logger = require('./config/logger');
const requestLogger = require('./middlewares/requestLogger.middleware');
const errorMiddleware = require('./middlewares/error.middleware');
const notFoundMiddleware = require('./middlewares/notFound.middleware');
const rateLimitMiddleware = require('./middlewares/rateLimit.middleware');
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const leadRoutes = require('./routes/lead.routes');

const app = express();

// Trust reverse proxy (ALB, Nginx)
app.set('trust proxy', 1);

// 1. Security Headers via Helmet
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// 2. Cross-Origin Resource Sharing (CORS)
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || origin === env.CORS_ORIGIN || env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      return callback(new Error('Blocked by CORS policy'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  })
);

// 3. Request Compression & Body Parsing
app.use(compression());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// 4. Request Logging
app.use(requestLogger);

// 5. Rate Limiting on API endpoints
app.use('/api/', rateLimitMiddleware);

// 6. Base API v1 Routes
app.use('/api/v1', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/leads', leadRoutes);

// Root fallback
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'Real Estate CRM API',
    version: '1.0.0',
    documentation: '/api/docs',
    health: '/api/v1/health',
  });
});

// 7. 404 Route Not Found Handler
app.use(notFoundMiddleware);

// 8. Centralized Error Handler
app.use(errorMiddleware);

module.exports = app;
