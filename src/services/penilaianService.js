const { Penilaian } = require('../models');

const createPenilaianData = async (data) => {
    const { variable, type, deskripsi, kategori, bobot, nilai } = data;

    const penilaian = await Penilaian.create({ variable, type, deskripsi, kategori, bobot, nilai });

    return penilaian;
}

const getAllPenilaianData = async () => {
    const penilaian = await Penilaian.findAll();

    return penilaian;
}

module.exports = {
    createPenilaianData,
    getAllPenilaianData,
};