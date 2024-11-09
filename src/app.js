const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dbGenerate = require('./config/dbGenerator');
const UserRoute = require('./routes/userRoute');
const LahanRoute = require('./routes/lahanRoute');
const ObservasiRoute = require('./routes/observasiRoute');
const path = require('path');
const passport = require('./config/passport');

require('dotenv').config();

global.__basedir = path.resolve(__dirname);

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
app.use(passport.initialize());

dbGenerate();

// routes
app.use(UserRoute);
// app.use(LahanRoute);
// app.use(ObservasiRoute);

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log('Server listening on ' + PORT);
});
