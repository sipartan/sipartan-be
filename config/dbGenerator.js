const db = require('./database');
const User = require("../model/user");
const DataUmumLahan = require("../model/dataUmum");
const LokasiRegion = require("../model/lokasiRegion");
const LokasiTitik = require("../model/lokasiTitik");
const KeadaanCuaca = require("../model/keadaanCuaca");
const Observasi = require("../model/observasi");
const PenilaianObservasi = require("../model/penilaianObservasi");
const Penilaian = require("../model/penilaian");
const Hasil = require("../model/hasil");
const Dokumentasi = require("../model/dokumentasi");
const Plot = require("../model/plot");

const dbGenerate = async () => {
  try {
    await db.sync();
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};

module.exports = dbGenerate;