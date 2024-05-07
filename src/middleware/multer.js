const multer = require("multer");

const setMulter = () => {
  return (req, res, next) => {
    try {
      const storage = multer.diskStorage({
        destination: (req, file, cb) => {
          cb(null, "src/image/upload");
        },
        filename: (req, file, cb) => {
          cb(null, file.originalname);
        },
      });

      const maxSize = 16 * 1024 * 1024;

      const upload = multer({
        storage: storage,
        limits: { fileSize: maxSize },
        fileFilter: (req, file, cb) => {
          if (
            file.mimetype == "image/jpeg" ||
            file.mimetype == "image/jpg" ||
            file.mimetype == "image/png"
          ) {
            cb(null, true);
          } else {
            cb(null, false);
            return cb(new Error("Only jpeg, jpg, or png file allowed"));
          }
        },
      }).array("files", 3);

      // upload(req, res, next);
      upload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
          // Multer errors
          if (err.code === "LIMIT_FILE_SIZE") {
            res.status(400).json({ error: "File size exceeded the limit" });
          } else {
            res.status(400).json({ error: err.message });
          }
        } else if (err) {
          // Other errors
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

module.exports = {
  setMulter,
};
