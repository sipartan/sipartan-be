const express = require('express');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const logger = require('./utils/logger');
const dbGenerate = require('./config/dbGenerator');
const errorHandler = require('./middlewares/error');
const userRoute = require('./routes/userRoute');
const LahanRoute = require('./routes/lahanRoute');
const ObservasiRoute = require('./routes/observasiRoute');
const karhutlaRoute = require('./routes/karhutlaRoute');
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

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(compression());
app.use(passport.initialize());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// Database initialization
dbGenerate().catch((err) => {
  logger.error('Database connection failed:', { error: err.message });
  process.exit(1); // Exit app on DB connection failure
});

// Routes
app.use('/user', userRoute);
app.use(LahanRoute);
app.use(ObservasiRoute);
app.use('/auth', authRoute);
app.use('/info', infoRoute);
app.use('/karhutla', karhutlaRoute);

// Error handler
app.use(errorHandler);

// Server Initialization
const PORT = process.env.PORT || 8081;
const server = app.listen(PORT, () => {
  logger.info('Server listening', { port: PORT, timestamp: new Date().toISOString() });
});

// Graceful Shutdown
process.on('SIGINT', () => {
  logger.info('Gracefully shutting down...');
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
});

module.exports = app;
