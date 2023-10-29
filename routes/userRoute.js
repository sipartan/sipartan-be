const express = require("express");
const { createUser, login } = require("../controllers/userController");
const { verifyToken } = require("../middleware/authMiddleware")

const router = express.Router();

router.post("/user", createUser);
router.post("/login", login);

// fungsi selanjutnya pakein verifyToken

module.exports = router;
