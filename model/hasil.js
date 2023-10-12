const { Sequelize } = require("sequelize");
const db = require("../config/database.js");
const Observasi = require('./observasi.js')

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
    observation_id: {
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
  },
  {
    freezeTableName: true,
    timestamps: true,
  }
);

Observasi.hasOne(Hasil, {
  foreignKey: "observation_id",
});
Hasil.belongsTo(Observasi, {
  foreignKey: "observation_id",
});

module.exports = Hasil;