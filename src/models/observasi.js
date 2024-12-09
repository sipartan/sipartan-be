const { Sequelize } = require("sequelize");
const db = require("../config/database.js");
const DataUmumLahan = require('./dataUmum.js')

const { DataTypes } = Sequelize;

const Observasi = db.define(
  "observasi",
  {
    observation_id: {
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
    tanggal_kejadian: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    tanggal_penilaian: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    skor_akhir: {
      type: DataTypes.FLOAT,
      allowNull: true,
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

DataUmumLahan.hasMany(Observasi, {
  foreignKey: "data_lahan_id",
});
Observasi.belongsTo(DataUmumLahan, {
  foreignKey: "data_lahan_id",
});

module.exports = Observasi;