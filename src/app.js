const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dbGenerate = require('./config/dbGenerator')
const UserRoute = require("./routes/userRoute")
const LahanRoute = require("./routes/lahanRoute")
const ObservasiRoute = require("./routes/observasiRoute")

require('dotenv').config()

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors()); 

dbGenerate()

// routes
app.use(UserRoute);
app.use(LahanRoute);
app.use(ObservasiRoute);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log('Server listening on ' + PORT);
});