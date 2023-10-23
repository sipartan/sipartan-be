const { Sequelize } = require("sequelize");
const db = require("../config/database.js");
const Observasi = require('./observasi.js')

const { DataTypes } = Sequelize;

const Plot = db.define(
  "plot",
  {
    plot_id: {
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
    luasan_plot: {
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

Observasi.hasMany(Plot, {
  foreignKey: "observation_id",
});
Plot.belongsTo(Observasi, {
  foreignKey: "observation_id",
});

module.exports = Plot;