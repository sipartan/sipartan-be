const { Sequelize } = require("sequelize");
const db = require("../config/database.js");
const Plot = require("./plot.js");

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
    plot_id: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    nama: {
      type: DataTypes.STRING(500), 
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

Plot.hasMany(Dokumentasi, {
  foreignKey: "plot_id",
});
Dokumentasi.belongsTo(Plot, {
  foreignKey: "plot_id",
});

module.exports = Dokumentasi;
