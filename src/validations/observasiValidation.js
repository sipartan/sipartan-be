const Joi = require('joi');

const createKarhutla = {
    body: Joi.object({
        data: Joi.object({
            data_lahan_id: Joi.required(),
            tanggal_kejadian: Joi.date().required(),
            tanggal_penilaian: Joi.date().required(),
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
                    penilaian_id: Joi.array().items(Joi.required()).required(),
                })
            ).required(),
        }).required(),
    }),
};

const createPenilaian = {
    body: Joi.object({
        variable: Joi.string().required(),
        type: Joi.string().required(),
        bobot: Joi.number().required(),
        nilai: Joi.number().required(),
        deskripsi: Joi.string().required(),
        kategori: Joi.string().required(),
    }),
};

const createDokumentasi = {
    body: Joi.object({
        penilaian_observasi_id: Joi.required(),
        tipe: Joi.string().required(),
        kategori: Joi.string().required(),
        provinsi: Joi.string().required(),
        kabupaten: Joi.string().required(),
        kecamatan: Joi.string().required(),
        desa: Joi.string().required(),
    }),
};

const getImage = {
    params: Joi.object({
        id: Joi.required(),
    }),
};

const deleteDokumentasi = {
    params: Joi.object({
        id: Joi.required(),
    }),
};

const deletePenilaian = {
    params: Joi.object({
        penilaian_id: Joi.required(),
    }),
};

module.exports = {
    createKarhutla,
    createPenilaian,
    createDokumentasi,
    getImage,
    deleteDokumentasi,
    deletePenilaian,
};