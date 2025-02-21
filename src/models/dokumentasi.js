const { Sequelize } = require("sequelize");
const db = require("../config/database.js");

const { DataTypes } = Sequelize;

const Dokumentasi = db.define(
  "dokumentasi",
  {
    dokumentasi_id: {
      type: DataTypes.STRING,
      defaultValue: Sequelize.literal("gen_random_uuid()"),
      allowNull: false,
      primaryKey: true,
      validate: {
        notEmpty: true,
      },
    },
    penilaian_observasi_id: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    s3_key: {
      type: DataTypes.STRING(500), 
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
  },
  {
    freezeTableName: true,
    timestamps: true,
  }
);

module.exports = Dokumentasi;