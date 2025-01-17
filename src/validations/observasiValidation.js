const Joi = require('joi');

const createObservasi = {
    body: Joi.object().keys({
        lahan_id: Joi.string().guid({ version: ['uuidv4'] }).required(),
        jenis_karhutla: Joi.string().required(),
        temperatur: Joi.number().required(),
        curah_hujan: Joi.number().required(),
        kelembapan_udara: Joi.number().required(),
        tanggal_kejadian: Joi.date().iso().required(),
        tanggal_penilaian: Joi.date().iso().required(),
        dataPlot: Joi.array().items(
            Joi.object().keys({
                coordinates: Joi.array()
                    .min(4)
                    .items(
                        Joi.array()
                            .length(2)
                            .items(Joi.number().required())
                    )
                    .required(),
                penilaian_id: Joi.array().items(Joi.string().guid({ version: ['uuidv4'] }).required()).required()
            })
        ).required()
    }).unknown(false),
};

const getObservasi = {
    query: Joi.object().keys({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).default(10),
        sortBy: Joi.string().default('createdAt'),
        order: Joi.string().valid('ASC', 'DESC').default('DESC'),
        lahan_id: Joi.string().guid({ version: ['uuidv4'] }).optional(),
        user_id: Joi.string().guid({ version: ['uuidv4'] }).optional(),
        hasil_penilaian: Joi.string().optional(),
        skor_min: Joi.number().optional(),
        skor_max: Joi.number().optional(),
        tanggal_kejadian_start: Joi.date().iso().optional(),
        tanggal_kejadian_end: Joi.date().iso().optional(),
        tanggal_penilaian_start: Joi.date().iso().optional(),
        tanggal_penilaian_end: Joi.date().iso().optional(),
        jenis_karhutla: Joi.string().optional(),
    }).unknown(false),
};

const getObservasiDetail = {
    params: Joi.object().keys({
        observasi_id: Joi.string().guid({ version: ['uuidv4'] }).required(),
    }).unknown(false),
};

const editObservasi = {
    params: Joi.object().keys({
        observasi_id: Joi.string().guid({ version: ['uuidv4'] }).required(),
    }).unknown(false),
    body: Joi.object().keys({
        jenis_karhutla: Joi.string().required(),
        temperatur: Joi.number().required(),
        curah_hujan: Joi.number().required(),
        kelembapan_udara: Joi.number().required(),
        tanggal_kejadian: Joi.date().iso().required(),
        tanggal_penilaian: Joi.date().iso().required(),
    }).unknown(false),
};

const deleteObservasi = {
    params: Joi.object().keys({
        observasi_id: Joi.string().guid({ version: ['uuidv4'] }).required(),
    }).unknown(false),
};

const uploadDokumentasi = {
    body: Joi.object().keys({
        penilaian_observasi_id: Joi.string().guid({ version: ['uuidv4'] }).required(),
        tipe: Joi.string().required(),
        provinsi: Joi.string().required(),
        kabupaten: Joi.string().required(),
        kecamatan: Joi.string().required(),
        desa: Joi.string().required(),
        kategori: Joi.string().required(),
    }).unknown(false),
};

const getDokumentasi = {
    params: Joi.object().keys({
        dokumentasi_id: Joi.string().guid({ version: ['uuidv4'] }).required(),
    }).unknown(false),
};

const deleteDokumentasi = {
    params: Joi.object().keys({
        dokumentasi_id: Joi.string().guid({ version: ['uuidv4'] }).required(),
    }).unknown(false),
};

const editPlot = {
    params: Joi.object().keys({
        plot_id: Joi.string().guid({ version: ['uuidv4'] }).required(),
    }).unknown(false),
    body: Joi.object({
        coordinates: Joi.array()
            .min(4)
            .items(
                Joi.array()
                    .length(2)
                    .items(Joi.number().required())
            )
            .optional(),

        penilaianList: Joi.array()
            .items(
                Joi.object({
                    penilaian_observasi_id: Joi.string()
                        .guid({ version: ['uuidv4'] })
                        .required(),
                    penilaian_id: Joi.string()
                        .guid({ version: ['uuidv4'] })
                        .required(),
                })
            )
            .optional(),
    }).unknown(false),
};

const deletePlot = {
    params: Joi.object().keys({
        plot_id: Joi.string().guid({ version: ['uuidv4'] }).required(),
    }).unknown(false),
};

const createPenilaian = {
    body: Joi.object().keys({
        variable: Joi.string().required(),
        type: Joi.string().required(),
        kategori: Joi.string().required(),
        deskripsi: Joi.string().required(),
        bobot: Joi.number().required(),
        nilai: Joi.number().required(),
    }).unknown(false),
};

module.exports = {
    createObservasi,
    getObservasi,
    getObservasiDetail,
    editObservasi,
    deleteObservasi,
    uploadDokumentasi,
    getDokumentasi,
    deleteDokumentasi,
    editPlot,
    deletePlot,
    createPenilaian,
};