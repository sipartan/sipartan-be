const { Upload } = require('@aws-sdk/lib-storage');
const { nanoid } = require('nanoid');
const { s3Client, bucketName } = require('../config/minioClient');
const { PassThrough } = require('stream');
const karhutlaService = require('../services/karhutlaService');

const logger = require('../utils/logger');

const createKarhutla = async (req, res, next) => {
    try {
        const user_id = req.user.user_id;
        const newData = { ...req.body, user_id };

        const dataKarhutla = await karhutlaService.createKarhutlaData(newData);
        return res
            .status(201)
            .json({ status: 200, message: "Berhasil create data karhutla", data: dataKarhutla });
    } catch (error) {
        return next(error);
    }
}

const getAllKarhutla = async (req, res, next) => {
    try {
        const filters = req.query;
        const result = await karhutlaService.getAllKarhutlaData(filters);
        return res
            .status(200)
            .json({ status: 200, message: "Berhasil get results", data: result });
    } catch (error) {
        return next(error);
    }
}

const editKarhutla = async (req, res, next) => {
    try {
        const newData = req.body;
        const result = await karhutlaService.editKarhutlaData(newData);
        return res
            .status(200)
            .json({ status: 200, message: "Berhasil edit data karhutla", data: result });
    } catch (error) {
        return next(error);
    }
};

const deleteKarhutla = async (req, res, next) => {
    try {
        console.log(req.query);
        await karhutlaService.deleteKarhutlaData(req.query);
        return res
            .status(200)
            .json({ status: 200, message: "Berhasil delete data karhutla" });
    } catch (error) {
        return next(error);
    }
};

const uploadDokumentasi = async (req, res, next) => {
    try {
        // Check if files were uploaded
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                status: 400,
                message: 'No files uploaded',
            });
        }

        // Process each uploaded file
        const files = req.files.map((file) => {
            const now = new Date();
            const filenameFormatted = `${now.toISOString().replace(/[:.]/g, '-')}_${nanoid()}`;
            const s3Key = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${req.body.provinsi}/${req.body.kabupaten}/${req.body.kecamatan}/${req.body.desa}/${req.body.tipe}/${req.body.kategori}/${filenameFormatted}`;

            return {
                uploadPromise: new Upload({
                    client: s3Client,
                    params: {
                        Bucket: bucketName,
                        Key: s3Key,
                        Body: file.buffer,
                        ContentType: file.mimetype,
                    },
                }).done(),
                s3Key,
            };
        });

        // Wait for all uploads to complete
        const { imageUrls } = await karhutlaService.uploadDokumentasiData(files, req.body);

        return res.status(201).json({
            status: 200,
            message: 'Successfully created documentation',
            data: { imageUrls },
        });
    } catch (error) {
        next(error);
    }
};

const getDokumentasi = async (req, res, next) => {
    try {
        const { dokumentasiId } = req.params;

        const fileStream = await karhutlaService.getImage(dokumentasiId);

        // Pipe the file stream directly to the response
        fileStream.pipe(res);
    } catch (error) {
        next(error);
    }
}

const deleteDokumentasi = async (req, res, next) => {
    try {
        const { dokumentasiId } = req.params;
        await karhutlaService.deleteDokumentasiData(dokumentasiId);
        return res.status(200).json({
            status: 200,
            message: "Berhasil delete dokumentasi"
        });
    } catch (error) {
        return next(error);
    }
}

const getLahanDetail = async (req, res, next) => {
    try {
        const { lahanId } = req.params;
        const { filters } = req.query;
        const result = await karhutlaService.getLahanDetailData(lahanId, filters);
        return res
            .status(200)
            .json({ status: 200, message: "Berhasil get lahan detail", data: result });
    } catch (error) {
        return next(error);
    }
}

const convertToPDF = async (req, res, next) => {
    try {
        const { lahanId, observasiId } = req.params;
        const pdfBuffer = await karhutlaService.convertToPDFData(lahanId, observasiId);

        res.setHeader("Content-Type", "application/pdf");
        return res.status(200).send(pdfBuffer);
    } catch (error) {
        return next(error);
    }
}

const createPenilaian = async (req, res, next) => {
    try {
        const { data } = req.body;
        const result = await karhutlaService.createPenilaianData(data);
        return res
            .status(201)
            .json({ status: 200, message: "Berhasil create penilaian", data: result });
    } catch (error) {
        return next(error);
    }
}

const getAllPenilaian = async (req, res, next) => {
    try {
        const result = await karhutlaService.getAllPenilaianData();
        return res
            .status(200)
            .json({ status: 200, message: "Berhasil get penilaian", data: result });
    } catch (error) {
        return next(error);
    }
}

module.exports = {
    createKarhutla,
    getAllKarhutla,
    editKarhutla,
    deleteKarhutla,
    uploadDokumentasi,
    getDokumentasi,
    deleteDokumentasi,
    getLahanDetail,
    convertToPDF,
    createPenilaian,
    getAllPenilaian
};