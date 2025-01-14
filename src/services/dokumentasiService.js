const Dokumentasi = require("../models/dokumentasi");
const { DeleteObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { s3Client, bucketName } = require("../config/minioClient");
const config = require("../config/config");

const BASE_URL = config.env.baseUrl;

const uploadDokumentasi = async (file, fields) => {
    // 1. Wait for all uploadPromises
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

    // 2. Check for failures
    const failed = uploadResults.filter((r) => !r.success);
    if (failed.length > 0) {
        throw new Error("Some files failed to upload");
    }

    // 3. Save successful uploads to Dokumentasi and generate URLs
    const imageUrls = [];
    for (const { s3Key } of uploadResults) {
        const doc = await Dokumentasi.create({
            penilaian_observasi_id: fields.penilaian_observasi_id,
            s3_key: s3Key,
            tipe: fields.tipe,
            kategori: fields.kategori,
        });

        // Generate the image URL
        const imageUrl = `${BASE_URL}/observasi/dokumentasi/${doc.dokumentasi_id}`;
        imageUrls.push(imageUrl);
    }

    // 4. Return the array of image URLs
    return {
        imageUrls,
    };
};

const getImage = async (dokumentasi_id) => {
    const dokumentasi = await Dokumentasi.findOne({
        where: { dokumentasi_id },
    });

    if (!dokumentasi) {
        throw new Error("Dokumentasi tidak ditemukan");
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

const deleteDokumentasi = async (dokumentasi_id) => {
    const dokumentasi = await Dokumentasi.findOne({
        where: { dokumentasi_id },
    });

    if (!dokumentasi) {
        throw new Error("Dokumentasi tidak ditemukan");
    }

    // Delete from S3
    const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: dokumentasi.s3_key,
    });

    await s3Client.send(command);

    // Delete from database
    await Dokumentasi.destroy({ where: { dokumentasi_id } });
};