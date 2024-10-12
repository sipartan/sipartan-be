const db = require('./database');
const User = require("../model/user");
const DataUmumLahan = require("../model/dataUmum");
const LokasiRegion = require("../model/lokasiRegion");
const Observasi = require("../model/observasi");
const PenilaianObservasi = require("../model/penilaianObservasi");
const Penilaian = require("../model/penilaian");
const Hasil = require("../model/hasil");
const Dokumentasi = require("../model/dokumentasi");
const Plot = require("../model/plot");

const seedPenilaian = require('../seeders/seedPenilaian'); 

const dbGenerate = async () => {
  try {
    await db.sync();
    console.log("Database synchronized successfully.");

    const penilaianCount = await Penilaian.count();

    if (penilaianCount === 0) {
      console.log("Database appears to be newly created. Seeding Ppenilaian data...");

      await seedPenilaian();
      console.log("Penilaian data seeding completed.");
    } else {
      console.log("Database already exists and contains data penilaian.");
    }

    
  } catch (error) {
    console.error("Unable to generate the database:", error);
  }
};

module.exports = dbGenerate;
