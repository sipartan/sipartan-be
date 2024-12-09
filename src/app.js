const express = require('express');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const dbGenerate = require('./config/dbGenerator');
const errorHandler = require('./middlewares/error');
const UserRoute = require('./routes/userRoute');
const LahanRoute = require('./routes/lahanRoute');
const ObservasiRoute = require('./routes/observasiRoute');
const infoRoute = require('./routes/infoRoute');
const authRoute = require('./routes/authRoute');
const passport = require('./config/passport');

require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(compression());
app.use(passport.initialize());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

dbGenerate().catch((err) => {
  console.error('Database connection failed:', err.message);
  process.exit(1); // Exit app on DB connection failure
});

// Routes
app.use('/user', UserRoute);
app.use(LahanRoute);
app.use(ObservasiRoute);
app.use('/auth', authRoute);
app.use('/info', infoRoute);

app.use(errorHandler);

// Server Initialization
const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

// Graceful Shutdown
process.on('SIGINT', () => {
  console.log('Gracefully shutting down...');
  process.exit(0);
});
