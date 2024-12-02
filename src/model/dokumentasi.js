const { Sequelize } = require("sequelize");
const db = require("../config/database.js");
const PenilaianObservasi = require("./penilaianObservasi.js");

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

PenilaianObservasi.hasMany(Dokumentasi, {
  foreignKey: "penilaian_observasi_id",
});
Dokumentasi.belongsTo(PenilaianObservasi, {
  foreignKey: "penilaian_observasi_id",
});

module.exports = Dokumentasi;
