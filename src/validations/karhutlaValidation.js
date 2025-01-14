const Joi = require('joi');

const createKarhutla = {
    body: Joi.object({
        region: Joi.object({
            provinsi: Joi.string().required(),
            kabupaten: Joi.string().required(),
            kecamatan: Joi.string().required(),
            desa: Joi.string().required(),
        }).required().unknown(false),
        dataumumlahan: Joi.object({
            tutupan_lahan: Joi.string().required(),
            jenis_vegetasi: Joi.string().required(),
            luasan_karhutla: Joi.number().required(),
            jenis_tanah: Joi.string().required(),
            tinggi_muka_air_gambut: Joi.number().required(),
            jenis_karhutla: Joi.string().required(),
            penggunaan_lahan: Joi.string().required(),
            latitude: Joi.string().required(),
            longitude: Joi.string().required(),
            temperatur: Joi.number().required(),
            curah_hujan: Joi.number().required(),
            kelembaban_udara: Joi.number().required(),
        }).required().unknown(false),
        observasi: Joi.object({
            tanggal_kejadian: Joi.date().iso().required(),
            tanggal_penilaian: Joi.date().iso().required(),
            dataPlot: Joi.array().items(
                Joi.object({
                    coordinates: Joi.array()
                        .min(4)
                        .items(
                            Joi.array()
                                .length(2)
                                .items(Joi.number().required())
                        )
                        .required(),
                    penilaian_id: Joi.array().items(Joi.string().required()).required(),
                }).unknown(false)
            ).required(),
        }).required().unknown(false),
    }).unknown(false),
};

const editKarhutla = {
    body: Joi.object({
        lahan: Joi.object({
            data_lahan_id: Joi.string().uuid().required(),
            tutupan_lahan: Joi.string(),
            jenis_vegetasi: Joi.string(),
            luasan_karhutla: Joi.number(),
            jenis_tanah: Joi.string(),
            tinggi_muka_air_gambut: Joi.number(),
            jenis_karhutla: Joi.string(),
            penggunaan_lahan: Joi.string(),
            latitude: Joi.number(),
            longitude: Joi.number(),
            temperatur: Joi.number(),
            curah_hujan: Joi.number(),
            kelembaban_udara: Joi.number(),
        }).optional().unknown(false),

        observasi: Joi.object({
            observation_id: Joi.string().uuid().required(),
            tanggal_kejadian: Joi.date().iso(),
            tanggal_penilaian: Joi.date().iso(),
        }).optional().unknown(false),

        plot: Joi.object({
            plot_id: Joi.string().uuid().required(),
            polygon: Joi.object({
                coordinates: Joi.array().items(
                    Joi.array().items(
                        Joi.array().ordered(
                            Joi.number().required(),
                            Joi.number().required()
                        ).length(2)
                    )
                ).required(),
            }).optional().unknown(false),
            penilaianList: Joi.array().items(
                Joi.object({
                    penilaian_observasi_id: Joi.string().uuid().required(),
                    penilaian_id: Joi.string().uuid().required(),
                }).unknown(false)
            ).optional(),
        }).optional().or('polygon', 'penilaianList').unknown(false),
    }).or('lahan', 'observasi', 'plot')
    .messages({
        'object.or': 'At least one of lahan, observasi, plot, or penilaianList must be provided.',
        'object.or': 'At least one of polygon or penilaianList must be provided if plot exists.',
    }).unknown(false),
};

const getAllKarhutla = {
    query: Joi.object({
        userId: Joi.string().uuid().optional(),
        page: Joi.number().default(1),
        limit: Joi.number().optional(),
        sortBy: Joi.string().default("createdAt"),
        order: Joi.string().valid("ASC", "DESC").default("DESC"),
        hasil_penilaian: Joi.string().optional(),
        skor_min: Joi.number().optional(),
        skor_max: Joi.number().optional(),
        date_start: Joi.date().iso().optional(),
        date_end: Joi.date().iso().optional(),
    }).unknown(false),
};

const deleteKarhutla = {
    query: Joi.object({
        lahanId: Joi.string().uuid().optional(),
        observasiId: Joi.string().uuid().optional(),
        plotId: Joi.string().uuid().optional(),
    }).xor('lahanId', 'observasiId', 'plotId')
    .messages({
        'object.xor': 'Only one of lahanId, observasiId, or plotId must be provided.',
    }).unknown(false),
};

const uploadDokumentasi = {
    body: Joi.object({
        penilaian_observasi_id: Joi.string().uuid().required(),
        tipe: Joi.string().required(),
        kategori: Joi.string().required(),
        provinsi: Joi.string().required(),
        kabupaten: Joi.string().required(),
        kecamatan: Joi.string().required(),
        desa: Joi.string().required(),
    }).unknown(false),
};

const createPenilaian = {
    body: Joi.object({
        variable: Joi.string().required(),
        type: Joi.string().required(),
        bobot: Joi.number().required(),
        nilai: Joi.number().required(),
        deskripsi: Joi.string().required(),
        kategori: Joi.string().required(),
    }).unknown(false),
};

const getDokumentasi = {
    param: Joi.object({
        dokumentasiId: Joi.string().uuid().required(),
    }).unknown(false),
};

const deleteDokumentasi = {
    param: Joi.object({
        dokumentasiId: Joi.string().uuid().required(),
    }).unknown(false),
};

const convertToPDF = {
    param: Joi.object({
        lahanId: Joi.string().uuid().required(),
        observasiId: Joi.string().uuid().required(),
    }).unknown(false),
};

const getLahanDetail = {
    param: Joi.object({
        lahanId: Joi.string().uuid().required(),
    }).unknown(false),
    query: Joi.object({
        observation_id: Joi.string().uuid().optional(),
        user_id: Joi.string().uuid().optional(),
        start_date: Joi.date().iso().optional(),
        end_date: Joi.date().iso().optional(),
        skor_akhir: Joi.number().optional(),
        hasil_penilaian: Joi.string().optional(),
    }).unknown(false),
};

module.exports = {
    createKarhutla,
    getAllKarhutla,
    editKarhutla,
    deleteKarhutla,
    uploadDokumentasi,
    createPenilaian,
    getDokumentasi,
    deleteDokumentasi,
    convertToPDF,
    getLahanDetail,
};
