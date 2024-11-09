const db = require('./database');
const seedUser = require('../seeders/seedUser');
const seedPenilaian = require('../seeders/seedPenilaian'); 

const dbGenerate = async () => {
  try {
    await db.sync();
    console.log("Database synchronized successfully.");

    await seedPenilaian();
    await seedUser();
    
  } catch (error) {
    console.error("Unable to generate the database:", error);
  }
};

module.exports = dbGenerate;
