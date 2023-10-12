const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dbGenerate = require('./config/dbGenerator')

require('dotenv').config()

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors()); 

// dbGenerate()

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log('Server listening on ' + PORT);
});