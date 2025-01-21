const multer = require('multer');
const { BadRequest } = require('../utils/response');

const storage = multer.memoryStorage();

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

// Error-handling wrapper function
const uploadHandler = (req, res, next) => {
    upload.array('files', 3)(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ status: 400, message: 'File size too large. Max 10MB per file allowed.' });
            }
            if (err.code === 'LIMIT_FILE_COUNT') {
                return res.status(400).json({ status: 400, message: 'Too many files. Maximum 3 files allowed.' });
            }
            if (err instanceof BadRequest) {
                return res.status(400).json({ status: 400, message: err.message });
            }
            return res.status(500).json({ status: 500, message: 'File upload failed.' });
        }
        next();
    });
};

module.exports = {
    uploadFiles: uploadHandler,
};
