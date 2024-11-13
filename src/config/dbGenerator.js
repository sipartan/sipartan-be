const db = require('./database');
const seedUser = require('../seeders/seedUser');
const seedPenilaian = require('../seeders/seedPenilaian'); 

const dbGenerate = async () => {
  try {
    await db.authenticate();
    console.log('Database connected...');

    // Enable PostGIS extension
    await db.query('CREATE EXTENSION IF NOT EXISTS postgis;');

    // Sync models
    // await db.sync({ alter: true }); // Use { force: true } cautiously
    await db.sync();

    console.log('Database synchronized...');
    await seedPenilaian();
    await seedUser();
    
  } catch (error) {
    console.error("Unable to generate the database:", error);
  }
};

module.exports = dbGenerate;
