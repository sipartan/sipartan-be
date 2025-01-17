const multer = require('multer');
const { BadRequest } = require('../utils/response');

const storage = multer.memoryStorage();
// TODO: I CANNOT IN DOCKER
const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB per file
        files: 3, // Maximum of 3 files
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new BadRequest('Only jpeg, jpg, or png files are allowed'));
        }
        cb(null, true);
    },
});

module.exports = {
    uploadFiles: upload.array('files', 3),
};
