const db = require('./database');
const { User, LokasiRegion, Lahan, Observasi, Plot, Penilaian, PenilaianObservasi } = require('../models');
const seedUser = require('../seeders/seedUser');
const seedPenilaian = require('../seeders/seedPenilaian');
const logger = require('../utils/logger');

const dbGenerate = async () => {
  try {
    await db.authenticate();
    logger.info('Database connected...');

    // Enable PostGIS extension
    await db.query('CREATE EXTENSION IF NOT EXISTS postgis;');
    logger.info('PostGIS extension enabled...');

    // Sync models
    // await db.sync({ force: true }); // delete and create
    // await db.sync({ alter: true }); // { force: true } is dangerous 
    await db.sync();
    logger.info('Database synchronized...');

    await seedPenilaian();
    logger.info('Penilaian seeded successfully...');

    await seedUser();
    logger.info('User seeded successfully...');
    
  } catch (error) {
    logger.error("Unable to generate the database:", error);
  }
};

module.exports = dbGenerate;