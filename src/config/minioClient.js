const { S3Client, ListBucketsCommand } = require("@aws-sdk/client-s3");
const logger = require('../utils/logger');
const config = require('./config');

const s3Client = new S3Client({
    endpoint: config.minio.endpoint,
    credentials: {
        accessKeyId: config.minio.rootUser,
        secretAccessKey: config.minio.rootPassword,
    },
    region: "us-east-1",
    forcePathStyle: true,
});

const bucketName = config.minio.bucket;

// Test MinIO connection using AWS SDK v3
async function testConnection() {
    try {
        const command = new ListBucketsCommand({});
        const data = await s3Client.send(command);
        logger.info("Connected to MinIO. Buckets:", {buckets: data.Buckets});
    } catch (err) {
        logger.error("Error connecting to MinIO:", err);
        process.exit(1);
    }
}

testConnection();

module.exports = { s3Client, bucketName };