const Joi = require('joi');

const createLahan = {
    body: Joi.object().keys({
        lokasi_region: Joi.object().keys({
            provinsi: Joi.string().required(),
            kabupaten: Joi.string().required(),
            kecamatan: Joi.string().required(),
            desa: Joi.string().required(),
        }).required(),
        lahan: Joi.object().keys({
            nama_lahan: Joi.string().required(),
            tutupan_lahan: Joi.string().required(),
            jenis_vegetasi: Joi.string().required(),
            jenis_tanah: Joi.string().required(),
            tinggi_muka_air_gambut: Joi.number().required(),
            penggunaan_lahan: Joi.string().required(),
            latitude: Joi.string().required(),
            longitude: Joi.string().required(),
            coordinates: Joi.array()
                .min(4)
                .items(
                    Joi.array()
                        .length(2)
                        .items(Joi.number().required())
                )
                .optional(),
        }).required(),
    }).unknown(false),
};

const getAllLahan = {
    query: Joi.object().keys({
        page: Joi.number().min(1).default(1),
        limit: Joi.number().allow(null).default(null),
        sortBy: Joi.string().default("createdAt"),
        order: Joi.string().valid("ASC", "DESC").default("DESC"),
        lahan_id: Joi.string().guid({ version: ['uuidv4'] }).optional(),
        nama_lahan: Joi.string().optional(),
        provinsi: Joi.string().optional(),
        kabupaten: Joi.string().optional(),
        kecamatan: Joi.string().optional(),
        desa: Joi.string().optional(),
        hasil_penilaian: Joi.string().optional(),
        skor_min: Joi.number().optional(),
        skor_max: Joi.number().optional(),
        tanggal_kejadian_start: Joi.date().iso().optional(),
        tanggal_kejadian_end: Joi.date().iso().optional(),
        tanggal_penilaian_start: Joi.date().iso().optional(),
        tanggal_penilaian_end: Joi.date().iso().optional(),
    }).unknown(false),
};

const editLahan = {
    body: Joi.object().keys({
        lokasi_region: Joi.object().keys({
            provinsi: Joi.string(),
            kabupaten: Joi.string(),
            kecamatan: Joi.string(),
            desa: Joi.string(),
        }),
        lahan: Joi.object().keys({
            nama_lahan: Joi.string(),
            tutupan_lahan: Joi.string(),
            jenis_vegetasi: Joi.string(),
            jenis_tanah: Joi.string(),
            tinggi_muka_air_gambut: Joi.number(),
            jenis_karhutla: Joi.string(),
            penggunaan_lahan: Joi.string(),
            latitude: Joi.string(),
            longitude: Joi.string(),
            coordinates: Joi.array().items(
                Joi.array().items(Joi.number()).length(2)
            ).min(4),
        }),
    }).unknown(false),
};

const deleteLahan = {
    params: Joi.object().keys({
        lahan_id: Joi.string().guid({ version: ['uuidv4'] }).required(),
    }).unknown(false),
};

module.exports = {
    createLahan,
    getAllLahan,
    editLahan,
    deleteLahan,
};