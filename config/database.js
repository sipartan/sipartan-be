const { Sequelize } = require("sequelize");
require("dotenv").config();

const db = new Sequelize("test", "postgres", "postgres", {
  host: "localhost",
  dialect: "postgres",
});

// const db = new Sequelize("sipartan-db", "postgres", "sipartan", {
//   host: "34.101.244.80",
//   dialect: "postgres",
// });

// const db = new Sequelize(
//   process.env.DB_NAME,
//   process.env.DB_USER,
//   process.env.DB_PASS,
//   {
//     host: process.env.DB_HOST,
//     dialect: "postgres",
//   }
// );

module.exports = db;
