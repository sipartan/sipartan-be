const express = require('express');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const logger = require('./utils/logger');
const db = require('./config/database');
const { s3Client } = require('./config/minioClient');
const dbGenerate = require('./config/dbGenerator');
const errorHandler = require('./middlewares/error');
const userRoute = require('./routes/userRoute');
const lahanRoute = require('./routes/lahanRoute');
const observasiRoute = require('./routes/observasiRoute');
const infoRoute = require('./routes/infoRoute');
const authRoute = require('./routes/authRoute');
const passport = require('./config/passport');

require('dotenv').config();

const app = express();

app.use(
  morgan((tokens, req, res) => {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      method: tokens.method(req, res),
      url: tokens.url(req, res),
      status: tokens.status(req, res),
      response_time: `${tokens['response-time'](req, res)} ms`,
      user_agent: tokens['user-agent'](req, res),
      ip: req.ip,
    });
  }, {
    stream: {
      write: (message) => {
        const logObject = JSON.parse(message);
        logger.info('HTTP Request Log:', logObject);
      },
    },
  })
);

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  keyGenerator: (req) => req.ip,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded:', { ip: req.ip });
    res.status(429).json({ status: 429, message: 'Too many requests. Please try again in 15 minutes.' });
  },
  skip: (req) => process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development',
}));

app.use(cors());
app.use(compression()); // Moved before JSON parsing for efficiency
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(passport.initialize());

// database initialization
dbGenerate().catch((err) => {
  logger.error('Database connection failed:', { error: err.message });
  process.exit(1); // exit app on DB connection failure
});

// routes
app.use('/user', userRoute);
app.use('/lahan', lahanRoute);
app.use('/observasi', observasiRoute);
app.use('/auth', authRoute);
app.use('/info', infoRoute);

// health check
app.get('/ping', (req, res) => {
  res.status(200).json({ message: 'pong', timestamp: new Date().toISOString() });
});

// error handler
app.use(errorHandler);

// server initialization
const PORT = process.env.PORT || 8081;
const server = app.listen(PORT, () => {
  logger.info('Server listening', { port: PORT, timestamp: new Date().toISOString() });
});

// graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Gracefully shutting down...');
  try {
    await db.close(); // close DB connection properly
    logger.info('Database connection closed.');
    await s3Client.destroy(); // close MinIO connection properly
    logger.info('MinIO connection closed.');
  } catch (err) {
    logger.error('Error closing connections:', err);
  }
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
});


module.exports = app;
