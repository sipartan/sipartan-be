const multer = require('multer');
const logger = require('../utils/logger');
const { UnsupportedMediaType } = require('../utils/response');

const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB per file
        files: 3, // maximum of 3 file
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(file.mimetype)) {
            logger.warn(`File rejected: Invalid type ${file.mimetype}`);
            return cb(new UnsupportedMediaType('Invalid file type. Only JPEG, JPG, or PNG files are allowed.'));
        }
        logger.info(`File accepted: ${file.originalname}, Type: ${file.mimetype}`);
        cb(null, true);
    },
});

// error-handling wrapper function
const uploadHandler = (req, res, next) => {
    upload.array('files', 3)(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                logger.error(`File upload error: File size too large for ${req.files?.map(f => f.originalname).join(', ') || 'unknown file'}`);
                return res.status(413).json({
                    status: 413,
                    message: 'File size too large. Maximum allowed size is 10MB per file.',
                });
            }
            if (err.code === 'LIMIT_FILE_COUNT') {
                logger.error(`File upload error: Too many files uploaded`);
                return res.status(400).json({
                    status: 400,
                    message: 'Too many files. Maximum 3 files are allowed.',
                });
            }
            if (err instanceof UnsupportedMediaType) {
                logger.warn(`File upload error: ${err.message}`);
                return res.status(415).json({
                    status: 415,
                    message: err.message,
                });
            }
            logger.error(`Unexpected error during file upload: ${err.message}`);
            return res.status(500).json({
                status: 500,
                message: 'Internal server error during file upload.',
            });
        }

        logger.info(`File upload successful: ${req.files.map(f => f.originalname).join(', ')}`);
        next();
    });
};

module.exports = {
    uploadFiles: uploadHandler,
};
