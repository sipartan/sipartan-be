const express = require('express');
const db = require('./config/database');
const bodyParser = require('body-parser');
const cors = require('cors');
const User = require('./model/user');

require('dotenv').config()

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors()); 

(async () => {
  // try {
  //   await db.authenticate();
  //   console.log("Connection has been established successfully.");
  //   // await User.sync();
  //   console.log("tabel berhasil dibuat");
  // } catch (error) {
  //   console.error("Unable to connect to the database:", error);
  // }
  await db.sync();
})();

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log('Server listening on ' + PORT);
});