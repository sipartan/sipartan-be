const multer = require("multer");
const multerS3 = require("multer-s3");
const { s3Client, bucketName } = require("../config/minioClient");

const setMulter = () => {
  return (req, res, next) => {
    try {
      const upload = multer({
        storage: multerS3({
          s3: s3Client,
          bucket: bucketName,
          contentType: multerS3.AUTO_CONTENT_TYPE,
          acl: "public-read",
          key: function (req, file, cb) {
            const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
            cb(null, "images/" + uniqueSuffix + "-" + file.originalname);
          },
        }),
        limits: { fileSize: 16 * 1024 * 1024 },
        fileFilter: (req, file, cb) => {
          if (
            file.mimetype == "image/jpeg" ||
            file.mimetype == "image/jpg" ||
            file.mimetype == "image/png"
          ) {
            cb(null, true);
          } else {
            cb(null, false);
            return cb(new Error("Only jpeg, jpg, or png files are allowed"));
          }
        },
      }).array("files", 3);

      upload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            res.status(400).json({ error: "File size exceeded the limit" });
          } else {
            res.status(400).json({ error: err.message });
          }
        } else if (err) {
          res.status(400).json({ error: err.message || "An error occurred" });
        } else {
          next();
        }
      });
    } catch (err) {
      console.error(err);
      next(err);
    }
  };
};

module.exports = { setMulter };
