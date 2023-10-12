const { Sequelize } = require("sequelize");
const db = require("../config/database.js");
const Observasi = require('./observasi.js')
const Penilaian = require('./penilaian.js')

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
    observation_id: {
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

Observasi.hasMany(PenilaianObservasi, {
  foreignKey: "observation_id",
});
PenilaianObservasi.belongsTo(Observasi, {
  foreignKey: "observation_id",
});

Penilaian.hasMany(PenilaianObservasi, {
  foreignKey: "penilaian_id",
});
PenilaianObservasi.belongsTo(Penilaian, {
  foreignKey: "penilaian_id",
});

module.exports = PenilaianObservasi;