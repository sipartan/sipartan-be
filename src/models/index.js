const User = require('./user');
const LokasiRegion = require('./lokasiRegion');
const Lahan = require('./lahan');
const Observasi = require('./observasi');
const Plot = require('./plot');
const Penilaian = require('./penilaian');
const PenilaianObservasi = require('./penilaianObservasi');
const Dokumentasi = require('./dokumentasi');

User.hasMany(Observasi, { foreignKey: 'user_id' });
Observasi.belongsTo(User, { foreignKey: 'user_id' });

LokasiRegion.hasMany(Lahan, { foreignKey: 'lokasi_region_id' });
Lahan.belongsTo(LokasiRegion, { foreignKey: 'lokasi_region_id' });

Lahan.hasMany(Observasi, { foreignKey: 'lahan_id' });
Observasi.belongsTo(Lahan, { foreignKey: 'lahan_id' });

Observasi.hasMany(Plot, { foreignKey: 'observasi_id' });
Plot.belongsTo(Observasi, { foreignKey: 'observasi_id' });

Plot.hasMany(PenilaianObservasi, { foreignKey: 'plot_id' });
PenilaianObservasi.belongsTo(Plot, { foreignKey: 'plot_id' });

Penilaian.hasMany(PenilaianObservasi, { foreignKey: 'penilaian_id' });
PenilaianObservasi.belongsTo(Penilaian, { foreignKey: 'penilaian_id' });

PenilaianObservasi.hasMany(Dokumentasi, { foreignKey: 'penilaian_observasi_id' });
Dokumentasi.belongsTo(PenilaianObservasi, { foreignKey: 'penilaian_observasi_id' });

module.exports = {
    User,
    LokasiRegion,
    Lahan,
    Observasi,
    Plot,
    Penilaian,
    PenilaianObservasi,
    Dokumentasi
};
