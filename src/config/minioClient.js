const {
    S3Client,
    ListBucketsCommand,
    HeadBucketCommand,
    CreateBucketCommand,
} = require("@aws-sdk/client-s3");
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

// Initialize MinIO: Test connection and ensure bucket exists
const initializeMinIO = async () => {
    try {
        // Test connection
        const command = new ListBucketsCommand({});
        const data = await s3Client.send(command);
        logger.info("Connected to MinIO. Buckets:", { buckets: data.Buckets });

        // Ensure the bucket exists
        try {
            await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
            logger.info(`Bucket "${bucketName}" exists.`);
        } catch (error) {
            if (error.name === 'NotFound') {
                logger.info(`Bucket "${bucketName}" not found. Creating...`);
                await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
                logger.info(`Bucket "${bucketName}" created.`);
            } else {
                throw error;
            }
        }
    } catch (error) {
        logger.error("Error initializing MinIO:", error);
        process.exit(1); // Exit process on failure
    }
};

// Initialize MinIO
initializeMinIO();

module.exports = { s3Client, bucketName };
