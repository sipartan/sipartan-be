const PenilaianObservasi = require("../models/penilaianObservasi");

const createPenilaianObservasi = async (plot_id, penilaian_id) => {
    try {
        const result = [];
        for (let i = 0; i < penilaian_id.length; i++) {
            const penilaianObservasi = await PenilaianObservasi.create({
                plot_id,
                penilaian_id: penilaian_id[i],
            });
            result.push(penilaianObservasi.penilaian_observasi_id);
        }
        return result;
    } catch (error) {
        throw new Error(`Error creating penilaian observasi: ${error.message}`);
    }
}

const deletePenilaianObservasi = async (penilaian_observasi_id) => {
    try {
        const deleted = await PenilaianObservasi.destroy({
            where: { penilaian_observasi_id },
        });

        if (!deleted) {
            throw new Error(`Penilaian observasi with ID: ${penilaian_observasi_id} not found.`);
        }

        return `Penilaian observasi with ID: ${penilaian_observasi_id} has been deleted.`;
    } catch (error) {
        throw new Error(`Error deleting penilaian observasi: ${error.message}`);
    }
}

const updatePenilaianObservasi = async (penilaian_observasi_id, plot_id, penilaian_id) => {
    try {
        const penilaianObservasi = await PenilaianObservasi.findByPk(penilaian_observasi_id);

        if (!penilaianObservasi) {
            throw new Error(`Penilaian observasi with ID: ${penilaian_observasi_id} not found.`);
        }

        await penilaianObservasi.update({
            plot_id,
            penilaian_id,
        });

        return penilaianObservasi;
    } catch (error) {
        throw new Error(`Error updating penilaian observasi: ${error.message}`);
    }
}

const getPenilaianObservasi = async (penilaian_observasi_id) => {
    try {
        const penilaianObservasi = await PenilaianObservasi.findOne({
            where: { penilaian_observasi_id },
        });

        if (!penilaianObservasi) {
            throw new Error(`Penilaian observasi with ID: ${penilaian_observasi_id} not found.`);
        }

        return penilaianObservasi;
    } catch (error) {
        throw new Error(`Error getting penilaian observasi: ${error.message}`);
    }
}

module.exports = {
    createPenilaianObservasi,
    deletePenilaianObservasi,
    updatePenilaianObservasi,
    getPenilaianObservasi,
};