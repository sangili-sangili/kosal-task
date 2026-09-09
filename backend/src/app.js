const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const env = require('./config/env');
const requestLogger = require('./middlewares/requestLogger.middleware');
const errorHandler = require('./middlewares/errorHandler.middleware');
const { apiRateLimiter } = require('./middlewares/rateLimiter.middleware');
const setupSwagger = require('./config/swagger');
const healthRoutes = require('./routes/health.routes');
const v1Routes = require('./routes/v1');
const { NotFoundError } = require('./errors');
const { registerUserEvents } = require('./events/userEvents');

// Initialize event listeners
registerUserEvents();

const app = express();

// Trust proxy if behind load balancer (e.g., Nginx, ALB)
app.set('trust proxy', 1);

// 1. Security Headers via Helmet
app.use(
  helmet({
    contentSecurityPolicy: false, // Permissive for swagger-ui assets
    crossOriginEmbedderPolicy: false,
  })
);

// 2. Cross-Origin Resource Sharing (CORS)
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl) or matched origin
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

// 3. HTTP Body Parsers & Compression
app.use(compression());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// 4. Request Correlation & Logging
app.use(requestLogger);

// 5. Global API Rate Limiting
app.use('/api/', apiRateLimiter);

// 6. Swagger API Documentation
setupSwagger(app);

// 7. Health check probes
app.use('/', healthRoutes);

// 8. Mount API v1 Routes
app.use('/api/v1', v1Routes);

// 9. 404 Catch-all Handler
app.use((req, res, next) => {
  next(new NotFoundError(`Cannot ${req.method} ${req.originalUrl}`));
});

// 10. Centralized Error Handler (Must be last)
app.use(errorHandler);

module.exports = app;
