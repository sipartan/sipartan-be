const { Sequelize } = require("sequelize");
const db = require("../config/database.js");
const Observasi = require('./observasi.js')

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
    observation_id: {
      type: DataTypes.STRING,
      defaultValue: undefined,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    nama: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    type: {
      type: DataTypes.STRING,
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

Observasi.hasMany(Dokumentasi, {
  foreignKey: "observation_id",
});
Dokumentasi.belongsTo(Observasi, {
  foreignKey: "observation_id",
});

module.exports = Dokumentasi;