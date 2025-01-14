const Joi = require('joi');

const createLahanKarhutla = {
    body: Joi.object({
        provinsi: Joi.string().required(),
        kabupaten: Joi.string().required(),
        kecamatan: Joi.string().required(),
        desa: Joi.string().required(),
        tutupan_lahan: Joi.string().required(),
        jenis_vegetasi: Joi.string().required(),
        luasan_karhutla: Joi.number().required(),
        jenis_tanah: Joi.string().required(),
        tinggi_muka_air_gambut: Joi.number().required(),
        jenis_karhutla: Joi.string().required(),
        penggunaan_lahan: Joi.string().required(),
        latitude: Joi.number().required(),
        longitude: Joi.number().required(),
        temperatur: Joi.number().required(),
        curah_hujan: Joi.number().required(),
        kelembaban_udara: Joi.number().required(),
    }),
};

const getSingleResult = {
    params: Joi.object({
        id: Joi.required(),
        obsId: Joi.number().required(),
    }),
};

const getResults = {
    query: Joi.object({
        userId: Joi.optional(),
        page: Joi.number().optional(),
        limit: Joi.number().optional(),
        sortBy: Joi.string().optional(),
        order: Joi.string().valid('ASC', 'DESC').optional(),
        hasil_penilaian: Joi.string().optional(),
        skor_min: Joi.number().optional(),
        skor_max: Joi.number().optional(),
        date_start: Joi.date().optional(),
        date_end: Joi.date().optional(),
    }),
};

const downloadPDF = {
    params: Joi.object({
        id: Joi.required(),
        obsId: Joi.number().required(),
    }),
};

const editKarhutla = {
    params: Joi.object({
        id: Joi.required(),
        obsId: Joi.number().required(),
    }),
    body: Joi.object({
        data: Joi.object({
            tutupan_lahan: Joi.string().required(),
            jenis_vegetasi: Joi.string().required(),
            luasan_karhutla: Joi.number().required(),
            jenis_tanah: Joi.string().required(),
            tinggi_muka_air_gambut: Joi.number().required(),
            jenis_karhutla: Joi.string().required(),
            penggunaan_lahan: Joi.string().required(),
            latitude: Joi.number().required(),
            longitude: Joi.number().required(),
            temperatur: Joi.number().required(),
            curah_hujan: Joi.number().required(),
            kelembaban_udara: Joi.number().required(),
            tanggal_kejadian: Joi.date().required(),
            tanggal_penilaian: Joi.date().required(),
            luas_plot: Joi.array().items(
                Joi.object({
                    plot_id: Joi.required(),
                    coordinates: Joi.array()
                        .min(4) 
                        .items(
                            Joi.array()
                                .length(2)
                                .items(Joi.number().required())
                        )
                        .required()
                })
            ).optional(),
            data_indikator: Joi.array().items(
                Joi.object({
                    penilaianObservation_id: Joi.required(),
                    penilaian_id: Joi.required(),
                })
            ).optional(),
        }).required(),
    }),
};

const deleteKarhutla = {
    params: Joi.object({
        id: Joi.required(),
    }),
};

module.exports = {
    createLahanKarhutla,
    getSingleResult,
    getResults,
    downloadPDF,
    editKarhutla,
    deleteKarhutla,
};