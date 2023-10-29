const { Sequelize } = require("sequelize");
const db = require("../config/database.js");
const DataUmumLahan = require('./dataUmum.js')

const { DataTypes } = Sequelize;

const LokasiTitik = db.define(
  "lokasi_titik",
  {
    point_location_id: {
      type: DataTypes.STRING,
      defaultValue: Sequelize.literal("gen_random_uuid()"),
      allowNull: false,
      primaryKey: true,
      validate: {
        notEmpty: true,
      },
    },
    data_lahan_id: {
      type: DataTypes.STRING,
      defaultValue: undefined,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    latitude: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    longitude: {
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

DataUmumLahan.hasOne(LokasiTitik, {
  foreignKey: "data_lahan_id",
});
LokasiTitik.belongsTo(DataUmumLahan, {
  foreignKey: "data_lahan_id",
});

module.exports = LokasiTitik;