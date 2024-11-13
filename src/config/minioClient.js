const { S3Client, ListBucketsCommand } = require("@aws-sdk/client-s3");
require("dotenv").config();

const s3Client = new S3Client({
    endpoint: process.env.MINIO_ENDPOINT || "http://localhost:9000",
    credentials: {
        accessKeyId: process.env.MINIO_ROOT_USER || "minioadmin",
        secretAccessKey: process.env.MINIO_ROOT_PASSWORD || "minioadmin",
    },
    region: "us-east-1", 
    forcePathStyle: true, 
});

const bucketName = process.env.MINIO_BUCKET || "sipartan";

// // Test MinIO connection using AWS SDK v3
// async function testConnection() {
//   try {
//     const command = new ListBucketsCommand({});
//     const data = await s3Client.send(command);
//     console.log("Connected to MinIO. Buckets:", data.Buckets);
//   } catch (err) {
//     console.error("Error connecting to MinIO:", err);
//   }
// }

// testConnection();

module.exports = { s3Client, bucketName };
