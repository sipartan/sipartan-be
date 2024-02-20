const { Sequelize } = require("sequelize");
require("dotenv").config();

// ===== WINDOWS =====
// const db = new Sequelize("sipartan_db", "postgres", "postgres", {
//   host: "localhost",
//   dialect: "postgres",
// });

// ===== LINUX =====
// const db = new Sequelize("sipartan-db-local", "postgres", "postgres", {
//   host: "localhost",
//   dialect: "postgres",
// });

// ===== SERVER =====
// const db = new Sequelize("sipartan-db", "postgres", "sipartan", {
//   host: "34.101.174.205",
//   dialect: "postgres",
// });

const db = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: "postgres",
  }
);

module.exports = db;
