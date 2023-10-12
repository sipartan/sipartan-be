const { Sequelize } = require("sequelize");
const db = require("../config/database.js");
const LokasiTitik = require('./lokasiTitik.js')

const { DataTypes } = Sequelize;

const KeadaanCuaca = db.define(
  "keadaan_cuaca",
  {
    keadaan_cuaca_id: {
      type: DataTypes.STRING,
      defaultValue: Sequelize.literal("gen_random_uuid()"),
      allowNull: false,
      primaryKey: true,
      validate: {
        notEmpty: true,
      },
    },
    point_location_id: {
      type: DataTypes.STRING,
      defaultValue: undefined,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    temperatur: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    cuaca_hujan: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    kelembaban_udara: {
      type: DataTypes.FLOAT,
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

LokasiTitik.hasOne(KeadaanCuaca, {
  foreignKey: "point_location_id",
});
KeadaanCuaca.belongsTo(LokasiTitik, {
  foreignKey: "point_location_id",
});

module.exports = KeadaanCuaca;