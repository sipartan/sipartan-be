const Dokumentasi = require("../models/dokumentasi");
const { DeleteObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { s3Client, bucketName } = require("../config/minioClient");
const { NotFound } = require("../utils/response");

const uploadDokumentasiData = async (files, fields) => {
    const uploadResults = await Promise.all(
        files.map(async ({ uploadPromise, s3Key }) => {
            try {
                await uploadPromise;
                return { s3Key, success: true };
            } catch (err) {
                return { s3Key, success: false, error: err };
            }
        })
    );

    const failed = uploadResults.filter((r) => !r.success);
    if (failed.length > 0) {
        throw new Error('Some files failed to upload');
    }

    const imageUrls = [];
    for (const { s3Key } of uploadResults) {
        const doc = await Dokumentasi.create({
            penilaian_observasi_id: fields.penilaian_observasi_id,
            s3_key: s3Key,
            tipe: fields.tipe,
            kategori: fields.kategori,
        });

        const imageUrl = `${process.env.BASE_URL}/observasi/dokumentasi/${doc.dokumentasi_id}`;
        imageUrls.push(imageUrl);
    }

    return { imageUrls };
};

const getImage = async (dokumentasiId) => {
    const dokumentasi = await Dokumentasi.findOne({
        where: { dokumentasi_id: dokumentasiId },
    });

    if (!dokumentasi) {
        throw new NotFound(`Dokumentasi with ID ${dokumentasiId} not found`);
    }

    const s3Key = dokumentasi.s3_key;
    const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
    });

    const { Body } = await s3Client.send(command);

    if (!Body) {
        throw new Error("Failed to fetch image");
    }

    return Body;
};

const deleteDokumentasiData = async (dokumentasiId) => {
    // Step 1: Find the Dokumentasi record
    const dokumentasi = await Dokumentasi.findOne({
        where: { dokumentasi_id: dokumentasiId },
    });

    if (!dokumentasi) {
        throw new NotFound(`Dokumentasi with ID ${dokumentasiId} not found`);
    }

    // Step 2: Delete the file from MinIO (S3)
    const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: dokumentasi.s3_key,
    });

    try {
        await s3Client.send(command);
    } catch (error) {
        console.error("Error deleting file from MinIO:", error);
        throw new Error("Failed to delete file from MinIO");
    }

    // Step 3: Delete the Dokumentasi record from the database
    await Dokumentasi.destroy({ where: { dokumentasi_id: dokumentasiId } });
};

module.exports = {
    uploadDokumentasiData,
    getImage,
    deleteDokumentasiData,
};