const { Sequelize } = require("sequelize");
const db = require("../config/database.js");

const { DataTypes } = Sequelize;

const PenilaianObservasi = db.define(
  "penilaian_observasi",
  {
    penilaian_observasi_id: {
      type: DataTypes.STRING,
      defaultValue: Sequelize.literal("gen_random_uuid()"),
      allowNull: false,
      primaryKey: true,
      validate: {
        notEmpty: true,
      },
    },
    plot_id: {
      type: DataTypes.STRING,
      defaultValue: undefined,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    penilaian_id: {
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

module.exports = PenilaianObservasi;