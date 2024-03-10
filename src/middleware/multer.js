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
        limits: { fieldSize: maxSize },
      }).array("files", 10);

      upload(req, res, next);
    } catch (err) {
      console.error(err);
      next(err);
    }
  };
};

module.exports = {
  setMulter,
};
