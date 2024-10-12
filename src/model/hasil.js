const { Sequelize } = require("sequelize");
const db = require("../config/database.js");
const Plot = require('./plot.js')

const { DataTypes } = Sequelize;

const Hasil = db.define(
  "hasil",
  {
    hasil_id: {
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
    kondisi_vegetasi: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    kondisi_tanah: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    skor: {
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

// TODO: di dbeaver ini one to many, seharusnya dia itu one to one
Plot.hasOne(Hasil, {
  foreignKey: "plot_id",
});
Hasil.belongsTo(Plot, {
  foreignKey: "plot_id",
});

module.exports = Hasil;