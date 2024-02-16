const express = require("express");
const { verifyToken } = require("../middleware/authMiddleware")
const UserController = require("../controllers/userController");

const router = express.Router();
const userController = new UserController();

router.post("/user", userController.createUser);
router.post("/login", userController.login);

router.get("/getUser", verifyToken, userController.getUser);

// fungsi selanjutnya pakein verifyToken

module.exports = router;
