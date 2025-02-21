const { Dokumentasi, PenilaianObservasi } = require("../models");
const { DeleteObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { s3Client, bucketName } = require("../config/minioClient");
const { NotFound, BadRequest } = require("../utils/response");
const logger = require("../utils/logger");

const uploadDokumentasiData = async (files, fields) => {
    try {
        logger.info("Starting upload of dokumentasi data");

        // check if penilaian_observasi_id exist
        const penilaianObservasi = await PenilaianObservasi.findOne({
            where: { penilaian_observasi_id: fields.penilaian_observasi_id },
        });

        if (!penilaianObservasi) {
            logger.warn(`Penilaian Observasi with ID ${fields.penilaian_observasi_id} not found`);
            throw new NotFound(`Penilaian Observasi with ID ${fields.penilaian_observasi_id} not found`);
        }

        // count existing dokumentasi for this penilaian_observasi_id
        const existingDokumentasiCount = await Dokumentasi.count({
            where: { penilaian_observasi_id: fields.penilaian_observasi_id },
        });

        if (existingDokumentasiCount >= 3) {
            logger.warn(`Dokumentasi limit reached for penilaian_observasi_id ${fields.penilaian_observasi_id}`);
            throw new BadRequest(`Cannot upload more than 3 dokumentasi for this penilaian observasi.`);
        }

        // determine how many more can be uploaded
        const remainingSlots = 3 - existingDokumentasiCount;
        if (files.length > remainingSlots) {
            logger.warn(`Upload limit exceeded: Can only upload ${remainingSlots} more dokumentasi.`);
            throw new BadRequest(`You can only upload ${remainingSlots} more dokumentasi for this penilaian observasi.`);
        }

        const uploadResults = await Promise.all(
            files.map(async ({ uploadPromise, s3Key }) => {
                try {
                    await uploadPromise;
                    logger.info(`File uploaded successfully: ${s3Key}`);
                    return { s3Key, success: true };
                } catch (err) {
                    logger.error(`File upload failed: ${s3Key}`, err);
                    return { s3Key, success: false, error: err };
                }
            })
        );

        const failed = uploadResults.filter((r) => !r.success);
        if (failed.length > 0) {
            logger.error("Some files failed to upload", failed);
            throw new Error('Some files failed to upload');
        }

        const dokumentasiIds = [];
        for (const { s3Key } of uploadResults) {
            const doc = await Dokumentasi.create({
                penilaian_observasi_id: fields.penilaian_observasi_id,
                s3_key: s3Key,
                tipe: fields.tipe,
                kategori: fields.kategori,
            });

            dokumentasiIds.push(doc.dokumentasi_id);
            logger.info(`Dokumentasi created with ID: ${doc.dokumentasi_id}`);
        }

        logger.info("Upload of dokumentasi data completed successfully");
        return { dokumentasi_ids: dokumentasiIds };

    } catch (error) {
        logger.error(`Error during dokumentasi upload: ${error.message}`, error);
        throw error;
    }
};

const getImage = async (dokumentasiId) => {
    try {
        logger.info(`Fetching image for dokumentasi ID: ${dokumentasiId}`);

        // find the dokumentasi record
        const dokumentasi = await Dokumentasi.findOne({
            where: { dokumentasi_id: dokumentasiId },
        });

        if (!dokumentasi) {
            logger.warn(`Dokumentasi with ID ${dokumentasiId} not found`);
            throw new NotFound(`Dokumentasi with ID ${dokumentasiId} not found`);
        }

        const s3Key = dokumentasi.s3_key;
        const command = new GetObjectCommand({
            Bucket: bucketName,
            Key: s3Key,
        });

        // fetch image from S3
        const { Body } = await s3Client.send(command);

        if (!Body) {
            logger.error(`Failed to fetch image from S3 for dokumentasi ID: ${dokumentasiId}`);
            throw new Error("Failed to fetch image");
        }

        logger.info(`Image fetched successfully for dokumentasi ID: ${dokumentasiId}`);
        return Body;

    } catch (error) {
        logger.error(`Error fetching image: ${error.message}`, error);
        throw error;
    }
};

const deleteDokumentasiData = async (dokumentasiId) => {
    logger.info(`Deleting dokumentasi with ID: ${dokumentasiId}`);
    // 1: find the dokumentasi record
    const dokumentasi = await Dokumentasi.findOne({
        where: { dokumentasi_id: dokumentasiId },
    });

    if (!dokumentasi) {
        logger.warn(`Dokumentasi with ID ${dokumentasiId} not found`);
        throw new NotFound(`Dokumentasi with ID ${dokumentasiId} not found`);
    }

    // 2: delete the file from MinIO 
    const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: dokumentasi.s3_key,
    });

    try {
        await s3Client.send(command);
        logger.info(`File deleted successfully from MinIO: ${dokumentasi.s3_key}`);
    } catch (error) {
        logger.error("Error deleting file from MinIO:", error);
        throw new Error("Failed to delete file from MinIO");
    }

    // 3: delete the dokumentasi record from the database
    await Dokumentasi.destroy({ where: { dokumentasi_id: dokumentasiId } });
    logger.info(`Dokumentasi record deleted successfully with ID: ${dokumentasiId}`);
};

module.exports = {
    uploadDokumentasiData,
    getImage,
    deleteDokumentasiData,
};