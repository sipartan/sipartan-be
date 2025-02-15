const { Upload } = require('@aws-sdk/lib-storage');
const { nanoid } = require('nanoid');
const { s3Client, bucketName } = require('../config/minioClient');
const observasiService = require('../services/observasiService');
const dokumentasiService = require('../services/dokumentasiService');
const penilaianService = require('../services/penilaianService');

const createObservasi = async (req, res, next) => {
    try {
        const user_id = req.user.user_id;
        const newDataObservasi = { ...req.body, user_id };

        const dataObservasi = await observasiService.createObservasiData(newDataObservasi);
        return res
            .status(201)
            .json({ status: 200, message: "Berhasil create data observasi", data: dataObservasi });
    } catch (error) {
        return next(error);
    }
};

const getObservasi = async (req, res, next) => {
    try {
        const filters = req.query;
        const result = await observasiService.getObservasiData(filters);
        return res
            .status(200)
            .json({ status: 200, message: "Berhasil get observasi", data: result });
    } catch (error) {
        return next(error);
    }
};

const getObservasiDetail = async (req, res, next) => {
    try {
        const { observasi_id } = req.params;
        const result = await observasiService.getObservasiDetailData(observasi_id);
        return res
            .status(200)
            .json({ status: 200, message: "Berhasil get detail observasi", data: result });
    } catch (error) {
        return next(error);
    }
};

const editObservasi = async (req, res, next) => {
    try {
        const { observasi_id } = req.params;
        const newDataObservasi = req.body;
        const result = await observasiService.editObservasiData(observasi_id, newDataObservasi);
        return res
            .status(200)
            .json({ status: 200, message: "Berhasil edit observasi", data: result });
    }
    catch (error) {
        return next(error);
    }
};

const deleteObservasi = async (req, res, next) => {
    try {
        const { observasi_id } = req.params;
        await observasiService.deleteObservasiData(observasi_id);
        return res
            .status(200)
            .json({ status: 200, message: "Berhasil delete observasi" });
    } catch (error) {
        return next(error);
    }
};

const uploadDokumentasi = async (req, res, next) => {
    try {
        // check if files were uploaded
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                status: 400,
                message: 'No files uploaded',
            });
        }

        // process each uploaded file
        const files = req.files.map((file) => {
            const now = new Date();
            
            // extract file extension
            const fileExtension = file.originalname.includes('.') 
                ? file.originalname.split('.').pop().toLowerCase() 
                : '';

            const filenameFormatted = `${now.toISOString().replace(/[:.]/g, '-')}_${nanoid()}${fileExtension ? '.' + fileExtension : ''}`;

            // construct S3 key
            const s3Key = [
                now.getFullYear(),
                String(now.getMonth() + 1).padStart(2, '0'),
                req.body.provinsi,
                req.body.kabupaten,
                req.body.kecamatan,
                req.body.desa,
                req.body.tipe,
                req.body.kategori,
                filenameFormatted
            ].join('/');

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

        // wait for all uploads to complete
        const { dokumentasi_ids } = await dokumentasiService.uploadDokumentasiData(files, req.body);

        return res.status(201).json({
            status: 200,
            message: 'Successfully created documentation',
            data: { dokumentasi_ids },
        });
    } catch (error) {
        next(error);
    }
};

const getDokumentasi = async (req, res, next) => {
    try {
        const { dokumentasi_id } = req.params;

        const fileStream = await dokumentasiService.getImage(dokumentasi_id);

        // pipe the file stream directly to the response
        fileStream.pipe(res);
    } catch (error) {
        next(error);
    }
};

const deleteDokumentasi = async (req, res, next) => {
    try {
        const { dokumentasi_id } = req.params;
        await dokumentasiService.deleteDokumentasiData(dokumentasi_id);
        return res.status(200).json({
            status: 200,
            message: "Berhasil delete dokumentasi"
        });
    } catch (error) {
        return next(error);
    }
};

const editPlot = async (req, res, next) => {
    try {
        const { plot_id } = req.params;
        const newData = req.body;
        const result = await observasiService.editPlotData(plot_id, newData);
        return res
            .status(200)
            .json({ status: 200, message: "Berhasil edit plot", data: result });
    } catch (error) {
        return next(error);
    }
};

const deletePlot = async (req, res, next) => {
    try {
        const { plot_id } = req.params;
        await observasiService.deletePlotData(plot_id);
        return res
            .status(200)
            .json({ status: 200, message: "Berhasil delete plot" });
    } catch (error) {
        return next(error);
    }
};

const createPenilaian = async (req, res, next) => {
    try {
        const newData = req.body;
        const result = await penilaianService.createPenilaianData(newData);
        return res
            .status(201)
            .json({ status: 200, message: "Berhasil create penilaian", data: result });
    }
    catch (error) {
        return next(error);
    }
};

const getAllPenilaian = async (req, res, next) => {
    try {
        const result = await penilaianService.getAllPenilaianData();
        return res
            .status(200)
            .json({ status: 200, message: "Berhasil get all penilaian", data: result });
    } catch (error) {
        return next(error);
    }
};

const convertToPDF = async (req, res, next) => {
    try {
        const { observasi_id } = req.params;
        const pdfBuffer = await observasiService.convertToPDF(observasi_id);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=observasi_${observasi_id}.pdf`);
        res.send(pdfBuffer);
    } catch (error) {
        return next(error);
    }
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
    getAllPenilaian,
    convertToPDF,
};