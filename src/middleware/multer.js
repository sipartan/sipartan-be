const multer = require("multer");

const setMulter = (fieldName) => {
  return (req, res, next) => {
    try {
      const storage = multer.diskStorage({
        destination: (req, file, cb) => {
          cb(null, "src/image/upload");
        },
        filename: (req, file, cb) => {
          let splitted = file.originalname.split(".");
          splitted[splitted.length - 2] = `${
            splitted[splitted.length - 2]
          }-${Date.now()}.`;

          cb(null, splitted.join(""));
        },
      });

      const maxSize = 16 * 1024 * 1024;

      const upload = multer({
        storage: storage,
        limits: { fieldSize: maxSize },
      }).single(fieldName);

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
